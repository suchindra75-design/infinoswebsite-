"""
INFINOS coolant pack -- photo-based replica, generator v1.0
===========================================================
Source of truth: coolents.pdf (3 pages, front-view photographs; pages 1 and 2 show the same white pack, page 3 the
turquoise pack).  Both packs are the same rigid blow-moulded part, so ONE body + ONE cap mesh is built here; the three
site variants (organic / inorganic / eutectic) differ only by material, which is applied in the browser.

All proportions are in units of the pack width W, measured on pages 2 and 3 and averaged:
  [PHOTO]  height (shoulder top to base)            1.84 W   (p2 1.85, p3 1.80)
  [PHOTO]  notch: opening +-0.22 W, floor +-0.166 W, depth 0.145 W, centred
  [PHOTO]  corner radii: top outer 0.06 W, bottom 0.045 W, notch corners ~0.025 W
  [PHOTO]  cap: diameter 0.14 W, height ~0.125 W, short narrower neck; sits on the notch floor, centred
  [PHOTO]  recessed window: 0.30 W wide, from 0.595 W to 1.29 W below the shoulder top, corner radius 0.04 W
  [PHOTO]  four round dimples at x = +-0.25 W, 0.578 W and 1.30 W below the shoulder top (aligned with the window
           ends), flat bottom ~0.065 W, outer ~0.12 W; each with a fine groove running out to its side edge
  [PHOTO]  fill line (liquid level) 0.29 W below the shoulder top -> exported as an extra in the GLB, used by the shader
  [PROVISIONAL] thickness 0.28 W and edge radius 0.055 W: the PDF has no side view
  [PROVISIONAL] recess depths (window 0.022 W, dimples 0.05 W, grooves 0.0035 W): read from shading only
  [UNKNOWN] back face: not photographed -> kept plain (slight doming only), nothing is invented there
Nothing that is not visible in the photographs is modelled (no labels, handles, ports or text).

Run (headless):  blender --background --python tools/build_coolant_pack.py -- --out /path/coolant-pack.glb
                 [--preview-dir DIR] [--samples 64]
Conventions: metres (W = 0.10 m, a nominal scale -- real dimensions are not given), pack FRONT = Blender -Y
(glTF +Z), pack HEIGHT = Blender +Z (glTF +Y), cap on top, origin at the centre of the body.
"""
import bpy, bmesh, math, os, sys
import numpy as np
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt

W = 0.10                       # nominal scale (m per unit W)
H = 1.84                       # body height (W)
T = 0.28                       # thickness (W)            [PROVISIONAL]
RE = 0.055                     # edge (fillet) radius     [PROVISIONAL]
HH = H / 2
NOTCH_TOP, NOTCH_FLOOR, NOTCH_DEPTH = 0.22, 0.166, 0.145
FILL_Y = HH - 0.29             # liquid level, body-centred (W)

# sharp outline (CCW, body-centred) with fillet radius per corner; >0 convex, <0 concave
OUTLINE = [
    (-0.5, -HH, 0.045), (0.5, -HH, 0.045), (0.5, HH, 0.06),
    (NOTCH_TOP, HH, 0.028), (NOTCH_FLOOR, HH - NOTCH_DEPTH, -0.02),
    (-NOTCH_FLOOR, HH - NOTCH_DEPTH, -0.02), (-NOTCH_TOP, HH, 0.028), (-0.5, HH, 0.06),
]
CORNER_SAMPLES = 12
EDGE_STEP = 0.02
PROFILE_STEPS = 9              # quarter-circle steps of the edge fillet

# front details (W, body-centred: y measured up from the centre)
WIN_C = (0.0, HH - (0.595 + 1.29) / 2)
WIN_HALF = (0.15, (1.29 - 0.595) / 2)
WIN_R, WIN_DEPTH, WIN_WALL = 0.04, 0.022, 0.024
DIMPLES = [(sx * 0.25, HH - dy) for dy in (0.578, 1.30) for sx in (-1, 1)]
DIMPLE_FLAT, DIMPLE_OUT, DIMPLE_DEPTH = 0.032, 0.062, 0.05
GROOVE_HALF, GROOVE_DEPTH = 0.0045, 0.0035
DOME = 0.005                   # very slight pillowing of both faces


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def smootherstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * t * (t * (6 * t - 15) + 10)


def offset_polygon(pts, o):
    """inset a CCW polygon by o (edges moved inward, new corners at the intersections)"""
    n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = np.array(pts[i - 1]), np.array(pts[i]), np.array(pts[(i + 1) % n])
        d0 = (p1 - p0) / np.linalg.norm(p1 - p0); d1 = (p2 - p1) / np.linalg.norm(p2 - p1)
        n0 = np.array([-d0[1], d0[0]]); n1 = np.array([-d1[1], d1[0]])      # inward normals (CCW)
        a0 = p0 + n0 * o; a1 = p1 + n1 * o
        A = np.array([d0, -d1]).T
        s = np.linalg.solve(A, a1 - a0)[0]
        out.append(tuple(a0 + d0 * s))
    return out


def edge_counts():
    pts = [(x, y) for x, y, _ in OUTLINE]
    return [max(1, round(math.dist(pts[i], pts[(i + 1) % len(pts)]) / EDGE_STEP)) for i in range(len(pts))]


EDGE_N = edge_counts()


def ring(o):
    """outline inset by o, filleted and resampled with a FIXED vertex count (rings can be bridged with quads)"""
    sharp = offset_polygon([(x, y) for x, y, _ in OUTLINE], o)
    n = len(sharp); arcs = []
    for i in range(n):
        r0 = OUTLINE[i][2]
        r = max(r0 - o, 0.004) if r0 > 0 else (-r0 + o)
        P = np.array(sharp[i]); A = np.array(sharp[i - 1]); B = np.array(sharp[(i + 1) % n])
        u = (A - P) / np.linalg.norm(A - P); v = (B - P) / np.linalg.norm(B - P)
        half = math.acos(max(-1.0, min(1.0, float(u @ v)))) / 2
        d = r / math.tan(half)
        t1, t2 = P + u * d, P + v * d
        bis = (u + v) / np.linalg.norm(u + v)
        C = P + bis * (r / math.sin(half))
        a1 = math.atan2(*(t1 - C)[::-1]); a2 = math.atan2(*(t2 - C)[::-1])
        da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
        arcs.append([tuple(C + r * np.array([math.cos(a1 + da * k / (CORNER_SAMPLES - 1)), math.sin(a1 + da * k / (CORNER_SAMPLES - 1))]))
                     for k in range(CORNER_SAMPLES)])
    out = []
    for i in range(n):
        out += arcs[i]
        e0, e1 = np.array(arcs[i][-1]), np.array(arcs[(i + 1) % n][0])
        for k in range(1, EDGE_N[i]):
            out.append(tuple(e0 + (e1 - e0) * k / EDGE_N[i]))
    return np.array(out)


def dist_to_polyline(P, poly):
    """distance from points P (N,2) to the closed polyline poly (M,2)"""
    A = poly; B = np.roll(poly, -1, axis=0); AB = B - A
    best = np.full(len(P), np.inf)
    for i in range(0, len(A), 64):
        a, ab = A[i:i + 64][None], AB[i:i + 64][None]
        ap = P[:, None, :] - a
        t = np.clip((ap * ab).sum(-1) / (ab * ab).sum(-1), 0, 1)
        d = np.linalg.norm(ap - ab * t[..., None], axis=-1).min(1)
        best = np.minimum(best, d)
    return best


def point_in_poly(P, poly):
    x, y = P[:, 0], P[:, 1]; inside = np.zeros(len(P), bool)
    xa, ya = poly[:, 0], poly[:, 1]; xb, yb = np.roll(xa, -1), np.roll(ya, -1)
    for i in range(len(poly)):
        cond = ((ya[i] > y) != (yb[i] > y)) & (x < (xb[i] - xa[i]) * (y - ya[i]) / (yb[i] - ya[i] + 1e-12) + xa[i])
        inside ^= cond
    return inside


def sdf_round_rect(P, c, half, r):
    q = np.abs(P - np.array(c)) - (np.array(half) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(np.maximum(q[:, 0], q[:, 1]), 0) - r


def front_depth(P, dist):
    """recess depth (W) of the front-face details at points P (body-centred W units); dist = distance to face border"""
    sw = sdf_round_rect(P, WIN_C, WIN_HALF, WIN_R)
    d = WIN_DEPTH * (1 - smootherstep(-WIN_WALL, 0.009, sw))
    for cx, cy in DIMPLES:
        r = np.hypot(P[:, 0] - cx, P[:, 1] - cy)
        d = np.maximum(d, DIMPLE_DEPTH * (1 - smootherstep(DIMPLE_FLAT, DIMPLE_OUT, r)))
        outward = (P[:, 0] - cx) * np.sign(cx)                                  # runs from the dimple to its side edge
        g = (1 - smoothstep(GROOVE_HALF * 0.3, GROOVE_HALF, np.abs(P[:, 1] - cy))) * smoothstep(0.0, 0.03, outward)
        d = np.maximum(d, GROOVE_DEPTH * g * smoothstep(0.0, 0.03, dist))
    return d


def cap_points(poly, fine):
    """interior sample points for a face: a coarse grid everywhere, a fine grid where the details are"""
    lo, hi = poly.min(0), poly.max(0)
    def grid(h):
        # staggered (triangular) lattice: a square grid lets the Delaunay fill flip diagonals along steep walls,
        # which shows up as a dashed highlight on the window edge
        dy = h * math.sqrt(3) / 2
        ys = np.arange(lo[1] + dy / 2, hi[1], dy)
        g = np.concatenate([np.stack([np.arange(lo[0] + h / 2 + (h / 2 if k % 2 else 0), hi[0], h), np.full_like(np.arange(lo[0] + h / 2 + (h / 2 if k % 2 else 0), hi[0], h), y)], -1)
                            for k, y in enumerate(ys)])
        g = g[point_in_poly(g, poly)]
        return g[dist_to_polyline(g, poly) > h * 0.6]
    coarse = grid(0.03)
    if not fine:
        return coarse
    def zone(P):
        z = np.abs(sdf_round_rect(P, WIN_C, WIN_HALF, WIN_R)) < 0.045
        for cx, cy in DIMPLES:
            z |= np.hypot(P[:, 0] - cx, P[:, 1] - cy) < 0.085
            z |= (np.abs(P[:, 1] - cy) < 0.018) & ((P[:, 0] - cx) * np.sign(cx) > 0)
        return z
    f = grid(0.005)
    return np.concatenate([coarse[~zone(coarse)], f[zone(f)]])


def build_body():
    bm = bmesh.new()
    def to_b(x, y, t):              # (width, height, thickness) in W -> Blender metres (front = -Y)
        return Vector((x * W, -t * W, y * W))
    rings = []
    # back face border -> back fillet -> side -> front fillet -> front face border
    phis = [math.pi / 2 * k / (PROFILE_STEPS - 1) for k in range(PROFILE_STEPS)]
    for side in (-1, 1):
        seq = phis[::-1] if side < 0 else phis
        for phi in seq:
            o = RE * (1 - math.cos(phi)); t = side * ((T / 2 - RE) + RE * math.sin(phi))
            rings.append((ring(o), t))
    vrings = [[bm.verts.new(to_b(x, y, t)) for x, y in r] for r, t in rings]
    n = len(vrings[0])
    for a, b in zip(vrings[:-1], vrings[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    # the two faces: constrained Delaunay fill of the innermost rings, then displacement
    for side, verts, (poly, t0) in ((1, vrings[-1], rings[-1]), (-1, vrings[0], rings[0])):
        pts = cap_points(poly, fine=side > 0)
        dist = dist_to_polyline(pts, poly)
        z = t0 + side * DOME * smoothstep(0.0, 0.22, dist)
        if side > 0:
            z = z - front_depth(pts, dist)
        allp = [Vector((float(x), float(y))) for x, y in np.concatenate([poly, pts])]
        edges = [(i, (i + 1) % n) for i in range(n)]
        out_v, _, out_f, orig_v, _, _ = delaunay_2d_cdt(allp, edges, [list(range(n))], 1, 1e-9)
        new = {}
        def vert(k):
            src = orig_v[k][0] if orig_v[k] else None
            if src is not None and src < n:
                return verts[src]
            if k not in new:
                j = (src - n) if src is not None else None
                x, y = out_v[k]
                zz = z[j] if j is not None else t0
                new[k] = bm.verts.new(to_b(x, y, zz))
            return new[k]
        for f in out_f:
            vs = [vert(k) for k in f]
            if side < 0:
                vs = vs[::-1]
            try:
                bm.faces.new(vs)
            except ValueError:
                pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('CoolantBody'); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('CoolantBody', me); bpy.context.collection.objects.link(ob)
    return ob


def build_cap():
    """revolved profile: short neck (r 0.06 W) + cap (r 0.07 W) with a rounded top edge; sits on the notch floor"""
    y0 = HH - NOTCH_DEPTH - 0.03            # neck starts inside the body so there is no gap at the rounded floor
    top = HH - 0.02                         # cap top just below the shoulders (p3)
    prof = [(0.0, y0), (0.06, y0), (0.06, HH - NOTCH_DEPTH + 0.018), (0.07, HH - NOTCH_DEPTH + 0.022)]
    rr = 0.014
    for k in range(7):                      # rounded top edge
        a = (math.pi / 2) * k / 6
        prof.append((0.07 - rr + rr * math.cos(a), top - rr + rr * math.sin(a)))
    prof.append((0.0, top))
    seg = 48
    bm = bmesh.new()
    rings = [[bm.verts.new(Vector((r * math.cos(2 * math.pi * s / seg) * W, r * math.sin(2 * math.pi * s / seg) * W, y * W)))
              for s in range(seg)] for r, y in prof]
    for a, b in zip(rings[:-1], rings[1:]):
        for s in range(seg):
            bm.faces.new((a[s], a[(s + 1) % seg], b[(s + 1) % seg], b[s]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('CoolantCap'); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('CoolantCap', me); bpy.context.collection.objects.link(ob)
    return ob


def material(name, rgb, rough, sss=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.02, 0.02, 0.02)
    return m


def render_previews(out_dir, samples, body, cap):
    """Cycles previews: front view framed like the PDF photographs, and a 3/4 view for the unseen thickness"""
    os.makedirs(out_dir, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 900, 1200
    sc.view_settings.view_transform = 'AgX'
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.012, 0.012, 0.014, 1)
    for loc, energy, size in (((-0.35, -0.6, 0.45), 26, 0.5), ((0.45, -0.5, 0.1), 7, 0.6), ((0, 0.45, 0.5), 12, 0.4)):
        bpy.ops.object.light_add(type='AREA', location=loc); L = bpy.context.object
        L.data.energy = energy; L.data.size = size
        L.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, -HH * W - 0.0005))
    bpy.context.object.data.materials.append(material('floor', (0.012, 0.012, 0.014), 0.95))
    for variant, rgb in (('white', (0.80, 0.82, 0.78)), ('turquoise', (0.30, 0.66, 0.58))):
        body.data.materials.clear(); body.data.materials.append(material('shell_' + variant, rgb, 0.42, 0.25))
        cap.data.materials.clear(); cap.data.materials.append(material('cap', (0.85, 0.86, 0.84), 0.38, 0.2))
        for view, loc in (('front', (0, -0.62, 0.0)), ('threequarter', (0.36, -0.48, 0.12))):
            bpy.ops.object.camera_add(location=loc); cam = bpy.context.object
            cam.data.lens = 85
            cam.rotation_euler = (Vector((0, 0, 0.0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
            sc.camera = cam
            sc.render.filepath = os.path.join(out_dir, f'coolant_{variant}_{view}.png')
            bpy.ops.render.render(write_still=True)
            bpy.data.objects.remove(cam)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    o = {'out': None, 'preview': None, 'samples': 64}
    for i, a in enumerate(argv):
        if a == '--out': o['out'] = argv[i + 1]
        if a == '--preview-dir': o['preview'] = argv[i + 1]
        if a == '--samples': o['samples'] = int(argv[i + 1])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    body, cap = build_body(), build_cap()
    print('body tris', sum(len(p.vertices) - 2 for p in body.data.polygons), '| cap tris', sum(len(p.vertices) - 2 for p in cap.data.polygons))
    body.data.materials.append(material('shell', (0.85, 0.86, 0.83), 0.42))
    cap.data.materials.append(material('cap', (0.88, 0.88, 0.86), 0.38))
    # the liquid level travels with the model (glTF extras), so the browser does not hard-code it
    body['fillLevel'] = FILL_Y * W
    if o['out']:
        for ob in (body, cap):
            ob.select_set(True)
        bpy.ops.export_scene.gltf(filepath=o['out'], export_format='GLB', use_selection=True, export_extras=True,
                                  export_yup=True, export_apply=True, export_normals=True, export_materials='EXPORT')
        print('exported', o['out'], '(%.1f KB)' % (os.path.getsize(o['out']) / 1e3))
    if o['preview']:
        render_previews(o['preview'], o['samples'], body, cap)


if __name__ == '__main__':
    main()
