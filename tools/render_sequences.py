"""
Photoreal scroll sequences for the INFINOS website (Blender Cycles)
==================================================================
Renders the frames of every sequence in src/content/sequences.json from the SAME generator as public/models/t1.glb
(tools/build_infinos_bag.py, executed in-session), with the same camera path, opening stages and tone mapping as the
live three.js scene, so the website can cross-fade between the frames and the interactive model.

    blender --background --python tools/render_sequences.py -- [--seq reveal,open] [--frames 0,47,95]
            [--samples N] [--device CPU|GPU] [--out tools/build/frames] [--skip-existing]
    Resolution and samples per sequence come from its "render" block in sequences.json (reveal: 2560x1600, 16 spp).
    python3 tools/encode_sequences.py          # PNG -> public/sequences/<seq>/{desktop,mobile}/NNNN.webp

Frames are rendered with a transparent film plus a shadow catcher, so the website composites them over the same CSS
studio backdrop as the live canvas. The interpolation helpers below mirror src/motion/sequences.ts exactly.
"""
import bpy, sys, os, json, math, time
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SEQ_JSON = os.path.join(REPO, "src", "content", "sequences.json")


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = {"seq": None, "frames": None, "samples": None, "device": "CPU", "out": os.path.join(HERE, "build", "frames"), "skip_existing": False,
         "denoise": True, "hide": []}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--seq": o["seq"] = argv[i + 1].split(","); i += 2
        elif a == "--frames": o["frames"] = [int(v) for v in argv[i + 1].split(",")]; i += 2
        elif a == "--samples": o["samples"] = int(argv[i + 1]); i += 2
        elif a == "--device": o["device"] = argv[i + 1].upper(); i += 2
        elif a == "--out": o["out"] = argv[i + 1]; i += 2
        elif a == "--skip-existing": o["skip_existing"] = True; i += 1
        elif a == "--no-denoise": o["denoise"] = False; i += 1
        elif a == "--hide": o["hide"] = argv[i + 1].split(","); i += 2          # debug: exclude objects by name part
        else: i += 1
    return o


# ---- src/motion/sequences.ts twins -------------------------------------------------------------------------------
def clamp01(t): return min(1.0, max(0.0, t))
def smoothstep(a, b, t):
    x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x)
def ease_in_out_sine(t): return 0.5 - 0.5 * math.cos(math.pi * clamp01(t))
def catmull_rom(p0, p1, p2, p3, s):
    s2, s3 = s * s, s * s * s
    return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3)
def spline_at(values, times, u):
    n = len(values); i = 0
    while i < n - 2 and u > times[i + 1]: i += 1
    s = clamp01((u - times[i]) / (times[i + 1] - times[i]))
    p1, p2 = values[i], values[i + 1]
    p0 = values[i - 1] if i > 0 else [2 * a - b for a, b in zip(p1, p2)]
    p3 = values[i + 2] if i + 2 < n else [2 * b - a for a, b in zip(p1, p2)]
    return [catmull_rom(p0[k], p1[k], p2[k], p3[k], s) for k in range(len(p1))]
def sequence_camera(seq, t):
    u = ease_in_out_sine(t); times = [k["t"] for k in seq["keys"]]
    return (spline_at([k["pos"] for k in seq["keys"]], times, u), spline_at([k["target"] for k in seq["keys"]], times, u),
            spline_at([[k["fov"]] for k in seq["keys"]], times, u)[0])
STAGES = ("flap", "lid", "drop", "boxOut", "boxLid")
def sequence_stages(seq, t):
    return {s: (smoothstep(seq["stages"][s][0], seq["stages"][s][1], t) if s in seq["stages"] else 0.0) for s in STAGES}
def frame_t(i, frames): return i / (frames - 1)          # inverse of sequenceFrame(): frame i shows chapter progress t


# ---- scene ---------------------------------------------------------------------------------------------------------
def load_generator():
    g = {"__name__": "infinos_gen", "__file__": os.path.join(HERE, "build_infinos_bag.py")}
    exec(compile(open(g["__file__"]).read(), g["__file__"], "exec"), g)
    return g


def srgb_hex(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c)


def setup_studio(gen, k, samples, device):
    """Mirror of src/components/product/LightingSystem.tsx (three.js world -> Blender: (x, -z, y) / k)."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    try: scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception: pass
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.03
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 2
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.sample_clamp_indirect = 6.0
    scene.render.use_persistent_data = True                   # only transforms change between frames: keep BVH/textures
    try: scene.cycles.denoising_prefilter = "NONE"           # keeps fabric weave + stitch detail (FAST smeared it at low samples)
    except Exception: pass
    if device == "GPU":
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for backend in ("METAL", "OPTIX", "CUDA", "HIP", "ONEAPI"):
            try:
                prefs.compute_device_type = backend; prefs.get_devices()
                if any(d.type != "CPU" for d in prefs.devices):
                    for d in prefs.devices: d.use = d.type != "CPU"
                    scene.cycles.device = "GPU"; print("GPU backend", backend); break
            except Exception: continue
    film = json.load(open(SEQ_JSON))["film"]
    scene.render.resolution_x, scene.render.resolution_y = film["width"], film["height"]
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.use_motion_blur = False                      # product must stay crisp in every frame
    scene.render.filter_size = 1.5                            # standard Blackman-Harris anti-aliasing
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    vs = scene.view_settings
    vs.view_transform = "Khronos PBR Neutral"                 # = THREE.NeutralToneMapping
    vs.look = "None"
    vs.exposure = math.log2(0.86)                             # = toneMappingExposure (renderSettings.ts)
    vs.gamma = 1.0

    def B(p): return Vector((p[0] / k, -p[2] / k, p[1] / k))

    w = bpy.data.worlds.new("site_studio"); w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (*[c * 0.55 for c in srgb_hex("#dfe6f0")], 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.09   # hemisphere + diffuse environment remainder
    scene.world = w

    def sun(name, pos3, strength, color, angle_deg):
        l = bpy.data.lights.new(name, "SUN"); l.energy = strength; l.color = srgb_hex(color); l.angle = math.radians(angle_deg)
        o = bpy.data.objects.new(name, l); bpy.context.collection.objects.link(o)
        d = Vector((pos3[0], -pos3[2], pos3[1])).normalized()
        o.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    sun("key", (-2.6, 5.2, 3.6), 5.2, "#fff6ec", 10)
    sun("fill", (3.4, 2.0, 1.6), 2.1, "#dfe8ff", 24)
    sun("rear", (-0.6, 3.0, -4.2), 1.3, "#f2f0ee", 24)

    env_scale = 0.7                                           # environmentIntensity
    def softbox(name, pos3, size3, intensity, color, target3=(0, 1, 0), facing=None):
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=B(pos3)); o = bpy.context.object; o.name = name
        o.scale = (size3[0] / k, size3[1] / k, 1)
        if facing is not None: o.rotation_euler = facing
        else: o.rotation_euler = (B(target3) - B(pos3)).to_track_quat("Z", "Y").to_euler()
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
        for n in list(nt.nodes): nt.nodes.remove(n)
        em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = (*srgb_hex(color), 1); em.inputs[1].default_value = intensity * env_scale
        out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0], out.inputs[0])
        o.data.materials.append(m)
        o.visible_camera = False; o.visible_shadow = False
    softbox("sb_key", (-4.5, 4.6, 4.6), (5, 3.5), 7, "#fff3e6")
    softbox("sb_fill", (5, 1.6, 4), (5, 3), 2.8, "#e8f0ff")
    softbox("sb_top", (0, 7, 0), (7, 7), 2.6, "#ffffff", facing=(math.pi, 0, 0))
    softbox("sb_rim_l", (-5, 2.5, -4), (1.2, 6), 5, "#ffffff")
    softbox("sb_rim_r", (5, 2.5, -4), (1.2, 6), 5, "#ffffff")

    bpy.ops.mesh.primitive_plane_add(size=40 / k, location=(0, 0, -0.0004)); floor = bpy.context.object; floor.name = "shadow_catcher"
    floor.is_shadow_catcher = True
    fm = bpy.data.materials.new("catcher"); fm.use_nodes = True
    fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*srgb_hex("#15161a"), 1)
    floor.data.materials.append(fm)
    return B


def main():
    o = parse_args()
    data = json.load(open(SEQ_JSON))
    gen = load_generator()
    G = gen["build_all"]()
    mn, mx, _ = gen["bounds_and_tris"]()
    gen["ROOT"].location = -Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    bpy.context.view_layer.update()
    k = 1.8 / (mx.z - mn.z)                                   # ProductModel auto-scale (targetHeightMeters 1.8)
    for g in G.values(): g["rest_loc"] = list(g.location)
    B = setup_studio(gen, k, o["samples"] or 12, o["device"])
    bpy.context.scene.cycles.use_denoising = o["denoise"]
    for ob in bpy.data.objects:
        if any(h in ob.name for h in o["hide"]): ob.hide_render = True

    cam_data = bpy.data.cameras.new("seq_cam"); cam_data.sensor_fit = "VERTICAL"; cam_data.clip_start = 0.02; cam_data.clip_end = 60
    cam = bpy.data.objects.new("seq_cam", cam_data); bpy.context.collection.objects.link(cam)
    cam_data.dof.use_dof = False                              # no depth-of-field blur anywhere in the sequences
    bpy.context.scene.camera = cam

    for sid, seq in data["sequences"].items():
        if o["seq"] and sid not in o["seq"]: continue
        outdir = os.path.join(o["out"], sid); os.makedirs(outdir, exist_ok=True)
        rs = dict(data["film"]); rs.update(seq.get("render", {}))
        sc = bpy.context.scene
        sc.render.resolution_x, sc.render.resolution_y = rs["width"], rs["height"]
        sc.cycles.samples = o["samples"] or rs.get("samples", 12)
        sc.cycles.adaptive_threshold = 0.02 if sc.cycles.samples >= 16 else 0.03
        sc.view_settings.exposure = math.log2(0.86) + rs.get("exposureEV", 0.0)   # per-sequence exposure in the render itself
        print("[seq] %s at %dx%d, %d spp" % (sid, rs["width"], rs["height"], sc.cycles.samples), flush=True)
        frames = o["frames"] if o["frames"] else range(seq["frames"])
        for i in frames:
            path = os.path.join(outdir, "%04d.png" % i)
            if o["skip_existing"] and os.path.exists(path): continue
            t = frame_t(i, seq["frames"])
            pos, target, fov = sequence_camera(seq, t)
            gen["apply_stage_pose"](G, sequence_stages(seq, t))
            cam.location = B(pos)
            cam.rotation_euler = (B(target) - B(pos)).to_track_quat("-Z", "Y").to_euler()
            cam_data.angle_y = math.radians(fov)
            bpy.context.view_layer.update()
            bpy.context.scene.render.filepath = path
            t0 = time.time(); bpy.ops.render.render(write_still=True)
            print("[seq] %s %04d/%d  %.1fs" % (sid, i, seq["frames"] - 1, time.time() - t0), flush=True)


main()
