"""
INFINOS T-1 transport bag -- photo-based replica, generator v0.3 (photo-validated)
==================================================================================
PROVISIONAL REPLICA - proportions come from the reference photographs, NOT from measurements.

v0.3 - every change below was checked against the 13 reference photographs (IMG-20261009-WA0014..0031,
identical to the 13 pages of IMG-20261009-WA0014.pdf):
  * upper body height 0.220 -> 0.235 m: upper/lower red side panels measure ~0.95:1 (WA0016, WA0027, WA0031)
  * thinner lid + flap stack (4.0 -> 3.25 cm) and a longer flap front (covers ~76 % of the upper front, WA0019)
  * flap quilting traced from WA0019: 'plateau' stitch lines (low at both edges, S-rise near 20 %, flat middle,
    S-fall near 80 %), not a sinusoid
  * carry handle removed: no handle is visible in any of the 13 photographs (WA0019 silhouette)
  * display plate enlarged to the measured 0.445 x side depth, 1.6:1, rounded corners, 4 corner screws, centred
    OLED module with its own 4 screws, sitting just above the compartment seam (WA0016); OLED text as photographed
  * biohazard embroidery redrawn from a least-squares fit of the real symbol (WA0031): crescents open outward,
    merged hub with centre hole, inner ring shown only inside the crescents; ~0.265 x depth, 41 % up the panel
  * shoulder straps closer together and wider at the top (centres +-0.066 m, WA0015)
  * -X upper side: stitched sleeve-pocket panel (WA0023, WA0027, WA0029, WA0031); +X: top stitch seam (WA0016)
  * back: seam between the upper and lower compartment backs (WA0015)
  * rack: 12 x 7 holes in two blocks (4 back + 3 front) with a raised +X end wall (WA0026, WA0028)
  * orange lining shifted toward the photographed yellow-orange; glossier silver liner and acrylic display plate
  * triangle budget brought under the 100k desktop target (coarser fabric tessellation where it is not visible)

What changed from v0.1 (hard bevelled boxes): every compartment is now a *sewn, padded fabric volume*:
  * rounded-rectangle tubes with sewn corner radii, padded bulge, soft end-rounding and fabric wrinkles
  * separate outer fabric / orange lining with a real wall thickness and a piped rim
  * round piping tubes along seams and corners, stitch ribbons (dashed thread) beside every seam
  * procedural woven-nylon albedo + normal maps (red, black, orange honeycomb, webbing, mesh, silver liner)
  * photographic preview renders (Cycles, 85 mm, soft studio lighting, depth of field)

Nothing hidden is modelled (no cooling / battery / electronics).  No ZIPCOOL branding.

Run (headless):  blender --background --python build_infinos_bag.py -- --out /path/t1.glb
                 [--preview-dir DIR] [--photo-dir DIR] [--samples 96] [--no-export] [--quick]
Conventions: metres, bag FRONT = Blender -Y (glTF +Z), bag RIGHT (from the front) = +X (display side).
Confidence tags: [PHOTO] read from photographs, [PROVISIONAL] adjustable guess, [UNKNOWN] not determinable.
"""
import bpy, bmesh, math, os, sys, json, tempfile
import numpy as np
from mathutils import Vector, Matrix, Euler, noise

# ======================================================================================
# 0. ARGS
# ======================================================================================
def parse_args():
    argv = sys.argv; argv = argv[argv.index("--") + 1:] if "--" in argv else []
    o = {"out": None, "preview": None, "photo": None, "export": True, "samples": 96, "quick": False, "only": None, "ao": True}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--out": o["out"] = argv[i + 1]; i += 2
        elif a == "--preview-dir": o["preview"] = argv[i + 1]; i += 2
        elif a == "--photo-dir": o["photo"] = argv[i + 1]; i += 2
        elif a == "--samples": o["samples"] = int(argv[i + 1]); i += 2
        elif a == "--only": o["only"] = argv[i + 1].split(","); i += 2
        elif a == "--no-export": o["export"] = False; i += 1
        elif a == "--quick": o["quick"] = True; i += 1
        elif a == "--no-ao": o["ao"] = False; i += 1
        else: i += 1
    if o["out"] is None:
        base = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.path.expanduser("~")
        o["out"] = os.path.join(base, "t1.glb")
    return o

# ======================================================================================
# 1. PARAMETERS (metres)
# ======================================================================================
P = dict(
    W=0.42,            # [PROVISIONAL] overall width; W/H ~0.83 (WA0019 front, WA0015 back)
    H_LOWER=0.25,      # [PHOTO-RELATIVE]
    H_UPPER=0.235,     # [PHOTO-RELATIVE] upper/lower red side panels ~0.95 (WA0016, WA0027, WA0031)
    D_UPPER=0.31,      # [PHOTO-RELATIVE] side photos give depth ~0.72 x overall height (WA0031)
    STEP=0.035,        # [PHOTO] lower compartment + drop panel protrude forward (WA0019; ~1 cm once open, WA0023)
    WALL=0.012,        # [UNKNOWN] shell + padding thickness
    LINER=0.004,       # [UNKNOWN]
    CORNER_R=0.024,    # [PHOTO] sewn corner radius
    BULGE=0.007,       # [PHOTO] how much the padded panels pillow outward
    WRINKLE=0.0022,    # [PHOTO] fabric unevenness amplitude
    LID_T=0.016,       # [PHOTO-RELATIVE] inner top lid pad; lid + flap stack ~3.2 cm above the rim (WA0031)
    FLAP_T=0.0145,     # [PHOTO-RELATIVE] quilted flap thickness
    FLAP_DROP=0.172,   # [PHOTO] flap hem sits 0.172 m below the rim: covers ~76 % of the upper front (WA0019)
    QUILT_PITCH=0.040,                 # [PHOTO] stitch-line spacing (4 lines on the front face, WA0019)
    QUILT_WAVE=0.026,                  # [PHOTO] peak-to-peak height of the stitch-line 'plateau'
    QUILT_RISE=(0.11, 0.27), QUILT_FALL=(0.73, 0.89),   # [PHOTO] S-bends as fractions of the flap width
    INCLUDE_CARRY_HANDLE=False,        # [NOT IN PHOTOS] kept only as an option
    BOX_W=0.325, BOX_D=0.285, BOX_H=0.190, BOX_LID_T=0.022,      # [PROVISIONAL] inner insulated box
    RACK_COLS=12, RACK_ROWS=7, RACK_FRONT_ROWS=3,                # [PHOTO] 12 x (3 + 4) holes (WA0028)
    RACK_W=0.205, RACK_D=0.180, RACK_T=0.010, RACK_HOLE_FR=0.64, RACK_WALL_H=0.024,
    DISPLAY_SIDE=+1, DISPLAY_PLATE=(0.132, 0.082, 0.008), DISPLAY_SCREEN=(0.040, 0.021), DISPLAY_Z_FRAC=0.225,
    DISPLAY_LINE1="TEMP : 24.19°C", DISPLAY_LINE2="WiFi Disconnected",   # as photographed (WA0016); not a spec
    BIO_SIZE=0.088, BIO_Z_FRAC=0.41,   # [PHOTO] embroidery width and centre height on the lower side panels
    SIDE_POCKET=True,                  # [PHOTO] stitched sleeve panel on the -X upper side (WA0031)
    STICKER_INFINOS=True,
    OPTIONAL_LOGO_DIR="",     # optional cropped PNGs: biohazard.png emblem.png sticker.png badge.png
    INCLUDE_BAY_ITEM=True,    # [UNKNOWN] grey pouch + cable seen in the right bay
    STRAP_W=0.100, STRAP_W_END=0.072, STRAP_T=0.030, STRAP_X0=0.066, STRAP_X1=0.088,   # [PHOTO] WA0015
    WEAR=0.22,                # 0 = factory clean, 1 = as dusty as the black front in WA0019
)
W = P["W"]; XH = W / 2
Y_BACK = 0.155
D_U = P["D_UPPER"]
Y_UF = Y_BACK - D_U
Y_LF = Y_UF - P["STEP"]
H_L, H_U = P["H_LOWER"], P["H_UPPER"]
Z_U0, Z_U1 = H_L, H_L + H_U
WALL, LIN, RC = P["WALL"], P["LINER"], P["CORNER_R"]
LID_Z0 = Z_U1 + 0.0015                         # underside of the inner top lid
Z_FLAP_TOP = LID_Z0 + P["LID_T"] + 0.0005 + P["FLAP_T"]
BOX_Y_FRONT = Y_LF + 0.024 + 0.004
BOX_Y_BACK = BOX_Y_FRONT + P["BOX_D"]
BOX_Z0 = WALL + LIN
BOX_Z1 = BOX_Z0 + P["BOX_H"]

BOX_OUT = (0.0, 0.012, 0.36)    # three.js model metres: fully clear of the bag, lifted 12 mm onto the opened drop panel
LAYERS = [
    # open: [(stage, rotate_x, translate_threejs_xyz)] - stages run flap -> lid -> drop -> boxOut -> boxLid (photos:
    # the inner box lid only opens once the box is out of the lower compartment, WA0026/28/29)
    dict(id="flap", node="INFINOS_Flap", label="QUILTED OUTER FLAP", role="Quilted outer cover", side="right",
         dir=(0, 1, 0), dist=0.40, rot=(-1.1, 0, 0), open=[("flap", -1.9, None)]),
    dict(id="lid", node="INFINOS_UpperLid", label="INNER TOP LID", role="Upper compartment closure", side="left",
         dir=(0, 1, 0), dist=0.28, rot=(-0.8, 0, 0), open=[("lid", -1.75, None)]),
    dict(id="upper", node="INFINOS_UpperBody", label="UPPER COMPARTMENT", role="Orange-lined top-loading compartment", side="right",
         dir=(0, 1, 0), dist=0.16, rot=None),
    dict(id="display", node="INFINOS_Display", label="DIGITAL DISPLAY", role="OLED readout, upper side panel", side="right",
         dir=(1, 1.2, 0), dist=0.13, rot=None, meta={"telemetryRole": "SOURCE", "glowMaterial": "INFINOS_Mat_DisplayScreen"}),
    dict(id="lower", node="INFINOS_LowerShell", label="LOWER COMPARTMENT", role="Front-opening compartment shell", side="left",
         dir=(0, 1, 0), dist=0.0, rot=None),
    dict(id="dropPanel", node="INFINOS_DropPanel", label="DROP-DOWN FRONT PANEL", role="Zipped panel hinged at the bottom", side="left",
         dir=(0, 0, 1), dist=0.10, rot=(1.5, 0, 0), open=[("drop", 1.5, None)]),
    dict(id="innerBox", node="INFINOS_InnerBox", label="INSULATED INNER BOX", role="Silver-lined box with dividers", side="right",
         dir=(0, 0, 1), dist=0.32, rot=None, open=[("boxOut", None, BOX_OUT)],
         meta={"visualization": "EMISSIVE", "glowMaterial": "INFINOS_Mat_SilverLiner"}),   # illustrative thermal tint
    dict(id="innerBoxLid", node="INFINOS_InnerBoxLid", label="INNER BOX LID", role="Silver-lined zipped lid", side="right",
         dir=(0, 0.3, 1), dist=0.32, rot=(-2.7, 0, 0), open=[("boxOut", None, BOX_OUT), ("boxLid", -1.65, None)]),
    dict(id="rack", node="INFINOS_Rack", label="PERFORATED RACK", role="White perforated insert", side="left",
         dir=(0, 0.75, 1), dist=0.32, rot=None, open=[("boxOut", None, BOX_OUT)]),
    dict(id="straps", node="INFINOS_Straps", label="BACK PANEL & STRAPS", role="Padded shoulder straps", side="left",
         dir=(0, 0, -1), dist=0.12, rot=None, meta={"hideLabel": "true"}),
]

TMP = tempfile.mkdtemp(prefix="infinos_tex_")

# ======================================================================================
# 2. TEXTURES (numpy)  - woven nylon etc.
# ======================================================================================
def lowfreq(n, scale, seed):
    """Tileable low-frequency noise in [-1,1] via FFT low-pass."""
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.normal(size=(n, n)))
    fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    f *= np.exp(-((fx ** 2 + fy ** 2) * (scale ** 2)))
    r = np.real(np.fft.ifft2(f)); r -= r.mean(); r /= (np.abs(r).max() + 1e-9)
    return r.astype(np.float32)

def weave_height(n=1024, p=8):
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    u = (xs / p) % 1.0; v = (ys / p) % 1.0
    over = ((np.floor(xs / p) + np.floor(ys / p)) % 2) == 0
    hw = np.sin(np.pi * u) ** 0.7 * (0.62 + 0.38 * np.sin(np.pi * v))
    hf = np.sin(np.pi * v) ** 0.7 * (0.62 + 0.38 * np.sin(np.pi * u))
    return np.where(over, hw, hf * 0.92).astype(np.float32)

def normal_from_height(h, strength):
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / l * 0.5 + 0.5, ny / l * 0.5 + 0.5, nz / l * 0.5 + 0.5, np.ones_like(h)], -1).astype(np.float32)

def save_image(name, arr, fmt="PNG", noncolor=False):
    h, w, _ = arr.shape
    img = bpy.data.images.new(name, w, h, alpha=(fmt == "PNG"))
    a = np.clip(arr, 0, 1).astype(np.float32)
    if fmt != "PNG": a = a.copy(); a[..., 3] = 1.0
    img.pixels.foreach_set(np.ascontiguousarray(a[::-1]).ravel())
    img.filepath_raw = os.path.join(TMP, name + (".png" if fmt == "PNG" else ".jpg"))
    img.file_format = "PNG" if fmt == "PNG" else "JPEG"
    img.save()
    img.colorspace_settings.name = "Non-Color" if noncolor else "sRGB"
    return img

def fabric_textures(tag, base, seed, p=8, nstrength=2.6, wear=0.0, tint=0.05, slub=0.05):
    n = 1024
    h = weave_height(n, p)
    rng = np.random.default_rng(seed)
    cells = rng.uniform(1 - slub, 1 + slub, size=(n // p, n // p)).astype(np.float32)
    cellmap = np.kron(cells, np.ones((p, p), np.float32))
    shade = (0.78 + 0.34 * h) * cellmap * (1 + 0.07 * lowfreq(n, 60, seed + 1))
    fine = 1 + rng.normal(0, 0.018, (n, n)).astype(np.float32)
    col = np.ones((n, n, 4), np.float32)
    for i in range(3): col[..., i] = base[i] / 255.0 * shade * fine
    if wear > 0:   # dust / scuffing: lighter, desaturated blotches (photo A4 black front)
        dust = np.clip(lowfreq(n, 140, seed + 2) * 0.8 + lowfreq(n, 20, seed + 3) * 0.5, 0, 1) * wear
        for i in range(3): col[..., i] = col[..., i] * (1 - dust * 0.55) + 0.30 * dust * 0.55
    alb = save_image("tex_%s_albedo" % tag, col, "JPEG")
    hh = h + 0.12 * lowfreq(n, 25, seed + 4)
    nrm = save_image("tex_%s_normal" % tag, normal_from_height(hh, nstrength), "JPEG", noncolor=True)
    return alb, nrm

def hex_textures(tag, base, n=1024, cycles=22):
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    u, v = xs / n * cycles, ys / n * cycles
    k = [(1.0, 0.0), (-0.5, 0.866), (-0.5, -0.866)]
    pat = sum(np.cos(2 * math.pi * (kx * u + ky * v)) for kx, ky in k)       # -1.5 .. 3
    hgt = np.clip((pat + 1.5) / 4.5, 0, 1) ** 1.3
    weave = weave_height(n, 4) * 0.25
    shade = 0.80 + 0.28 * hgt + 0.06 * weave
    col = np.ones((n, n, 4), np.float32)
    for i in range(3): col[..., i] = base[i] / 255.0 * shade
    alb = save_image("tex_%s_albedo" % tag, col, "JPEG")
    nrm = save_image("tex_%s_normal" % tag, normal_from_height(hgt + weave * 0.5, 3.2), "JPEG", noncolor=True)
    return alb, nrm

def silver_textures(n=512):
    r = lowfreq(n, 18, 41) * 0.6 + lowfreq(n, 6, 42) * 0.4
    col = np.ones((n, n, 4), np.float32)
    shade = 0.92 + 0.10 * r
    for i, c in enumerate((172, 183, 196)): col[..., i] = c / 255.0 * shade
    alb = save_image("tex_silver_albedo", col, "JPEG")
    nrm = save_image("tex_silver_normal", normal_from_height(r * 1.6, 2.2), "JPEG", noncolor=True)
    return alb, nrm

def webbing_textures(n=512):
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    tw = (np.sin((xs + ys) * 2 * math.pi / 8) * 0.5 + 0.5)
    col = np.ones((n, n, 4), np.float32)
    for i, c in enumerate((24, 25, 28)): col[..., i] = c / 255.0 * (0.75 + 0.35 * tw)
    return save_image("tex_webbing_albedo", col, "JPEG"), save_image("tex_webbing_normal", normal_from_height(tw, 2.0), "JPEG", noncolor=True)

def mesh_texture(n=512, cell=16):
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    u = (xs % cell) / cell - 0.5; v = (ys % cell) / cell - 0.5
    hole = (np.abs(u) + np.abs(v)) < 0.36                                  # diamond openings like photo A1
    arr = np.zeros((n, n, 4), np.float32)
    arr[..., :3] = (0.05, 0.05, 0.055); arr[..., 3] = (~hole).astype(np.float32)
    return save_image("tex_mesh", arr, "PNG")

def stitch_texture(tag, rgb, n=64):
    arr = np.zeros((16, n, 4), np.float32)
    arr[..., :3] = np.array(rgb) / 255.0
    ys, xs = np.mgrid[0:16, 0:n].astype(np.float32)
    dash = (xs > 6) & (xs < n - 6)
    thick = (np.abs(ys - 7.5) < 3.2 - 2.2 * (np.abs(xs - n / 2) / (n / 2)) ** 3)
    arr[..., 3] = (dash & thick).astype(np.float32)
    shade = 0.8 + 0.35 * np.clip(1 - np.abs(ys - 7.5) / 4, 0, 1)
    arr[..., :3] *= shade[..., None]
    return save_image("tex_stitch_" + tag, arr, "PNG")

FONT = {
 '0': "01110 10001 10011 10101 11001 10001 01110", '1': "00100 01100 00100 00100 00100 00100 01110",
 '2': "01110 10001 00001 00010 00100 01000 11111", '3': "11110 00001 00001 01110 00001 00001 11110",
 '4': "00010 00110 01010 10010 11111 00010 00010", '5': "11111 10000 11110 00001 00001 10001 01110",
 '6': "00110 01000 10000 11110 10001 10001 01110", '7': "11111 00001 00010 00100 01000 01000 01000",
 '8': "01110 10001 10001 01110 10001 10001 01110", '9': "01110 10001 10001 01111 00001 00010 01100",
 '.': "00000 00000 00000 00000 00000 01100 01100", ':': "00000 01100 01100 00000 01100 01100 00000",
 '-': "00000 00000 00000 11111 00000 00000 00000", ' ': "00000 00000 00000 00000 00000 00000 00000",
 'T': "11111 00100 00100 00100 00100 00100 00100", 'E': "11111 10000 10000 11110 10000 10000 11111",
 'M': "10001 11011 10101 10101 10001 10001 10001", 'P': "11110 10001 10001 11110 10000 10000 10000",
 'W': "10001 10001 10001 10101 10101 11011 10001", 'I': "01110 00100 00100 00100 00100 00100 01110",
 'F': "11111 10000 10000 11110 10000 10000 10000", 'D': "11110 10001 10001 10001 10001 10001 11110",
 'S': "01111 10000 10000 01110 00001 00001 11110", 'C': "01110 10001 10000 10000 10000 10001 01110",
 'O': "01110 10001 10001 10001 10001 10001 01110", 'N': "10001 11001 10101 10011 10001 10001 10001",
 'i': "00100 00000 01100 00100 00100 00100 01110", 'n': "00000 00000 10110 11001 10001 10001 10001",
 'f': "00110 01001 01000 11100 01000 01000 01000", 'o': "00000 00000 01110 10001 10001 10001 01110",
 's': "00000 00000 01111 10000 01110 00001 11110",
 'e': "00000 00000 01110 10001 11111 10000 01110", 'c': "00000 00000 01110 10000 10000 10001 01110",
 't': "01000 01000 11100 01000 01000 01001 00110", 'd': "00001 00001 01101 10011 10001 10011 01101",
 '°': "01100 10010 10010 01100 00000 00000 00000",
}
WIFI_ICON = "0011100 0100010 1000001 0011100 0100010 0001000 0001000"   # small wifi glyph (7x7) before line 2
def draw_text(arr, text, x, y, scale, color):
    for ch in text:
        for r, row in enumerate(FONT.get(ch, FONT[' ']).split()):
            for c, bit in enumerate(row):
                if bit == '1':
                    arr[y + r * scale:y + r * scale + scale, x + c * scale:x + c * scale + scale, :3] = color
                    arr[y + r * scale:y + r * scale + scale, x + c * scale:x + c * scale + scale, 3] = 1.0
        x += 6 * scale

def embroidery_textures(name, mask_fn, rgb, n=512):
    """White satin-stitch embroidery: alpha from the symbol mask, thread hatch + puffy normal map."""
    m = mask_fn(n).astype(np.float32)
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    hatch = np.sin((xs * 0.8 + ys * 0.6) * 2 * math.pi / 5.0) * 0.5 + 0.5
    # blur mask for a padded, raised look
    f = np.fft.fft2(m); fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    blur = np.real(np.fft.ifft2(f * np.exp(-((fx ** 2 + fy ** 2) * 900))))
    height = blur * 1.0 + hatch * 0.08 * m
    col = np.zeros((n, n, 4), np.float32)
    for i in range(3): col[..., i] = rgb[i] / 255.0 * (0.80 + 0.28 * hatch)
    col[..., 3] = (m > 0.5).astype(np.float32)
    nrm = normal_from_height(height * 6.0, 3.0)
    return save_image(name + "_albedo", col, "PNG"), save_image(name + "_normal", nrm, "PNG", noncolor=True)

# Biohazard symbol fitted to the embroidery in WA0031 (IoU-maximised against a binarised crop, then the crescent
# opening and centre hole re-measured by hand).  Units: claw-circle radius frame, symbol hub at the origin.
BIO = dict(d1=0.552, r1=0.626, d2=0.690, r2=0.4916, ring_r=0.495, ring_t=0.147, gap=0.047, hole=0.090)

def bio_fit_scale():
    """Uniform scale that fits the symbol into the decal square with a 4 % margin, and its vertical centring."""
    w = 2 * (BIO["d1"] * math.cos(math.radians(30)) + BIO["r1"]); top = BIO["d1"] + BIO["r1"]; bot = BIO["d1"] * 0.5 + BIO["r1"]
    return 0.96 * 2 / max(w, top + bot), (top - bot) / 2, w

def biohazard_mask(n):
    """Crescents (claw circle minus an outward-offset cut circle) merge into a hub around the centre hole; the inner
    ring is only visible inside each crescent's opening, separated from it by a thin gap - as on the real patch."""
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    u = xs / (n - 1) * 2 - 1; v = 1 - ys / (n - 1) * 2
    R, vc, _ = bio_fit_scale()
    u = u / R; v = v / R + vc
    claws = np.zeros((n, n), bool); inside = np.zeros((n, n), bool)
    for k in range(3):
        th = math.radians(90 + 120 * k); ux, uy = math.cos(th), math.sin(th)
        db = np.hypot(u - BIO["d1"] * ux, v - BIO["d1"] * uy); dc = np.hypot(u - BIO["d2"] * ux, v - BIO["d2"] * uy)
        claws |= (db < BIO["r1"]) & (dc > BIO["r2"])
        inside |= dc < BIO["r2"] - BIO["gap"]
    rad = np.hypot(u, v)
    ring = (np.abs(rad - BIO["ring_r"]) < BIO["ring_t"] / 2) & inside
    return (claws | ring) & ~(rad < BIO["hole"])

def emblem_texture(name, n=256):
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    u = xs / (n - 1) * 2 - 1; v = 1 - ys / (n - 1) * 2
    disc = np.hypot(u + 0.12, v - 0.12) < 0.72
    cross = ((np.abs(u + 0.12) < 0.16) & (np.abs(v - 0.12) < 0.46)) | ((np.abs(v - 0.12) < 0.16) & (np.abs(u + 0.12) < 0.46))
    hx, hy = u - 0.58, v + 0.58
    heart = (np.hypot(hx - 0.14, hy - 0.08) < 0.22) | (np.hypot(hx + 0.14, hy - 0.08) < 0.22) | \
            ((hy < 0.08) & (hy > -0.38) & (np.abs(hx) < (hy + 0.38) * 0.95) & (np.abs(hx) < 0.36))
    arr = np.zeros((n, n, 4), np.float32); red = np.array([0.80, 0.11, 0.10])
    arr[disc, :3] = red; arr[disc, 3] = 1; arr[disc & cross, :3] = (0.93, 0.92, 0.9); arr[heart, :3] = red; arr[heart, 3] = 1
    w = weave_height(n, 4) * 0.12
    arr[..., :3] *= (0.92 + w[..., None])
    return save_image(name, arr, "PNG")

def downsample(a, k):
    h, w, c = a.shape; return a.reshape(h // k, k, w // k, k, c).mean(axis=(1, 3))

def sticker_texture(name, n=256):
    k = 4; h, w = 160 * k, n * k
    arr = np.zeros((h, w, 4), np.float32); arr[..., 3] = 1
    arr[..., :3] = (0.88, 0.60, 0.62); arr[8 * k:h - 8 * k, 8 * k:w - 8 * k, :3] = (0.86, 0.72, 0.10)
    arr[22 * k:h - 22 * k, 22 * k:w - 22 * k, :3] = (0.05, 0.05, 0.06)
    draw_text(arr, "infinos", 40 * k, 52 * k, 4 * k, (0.93, 0.93, 0.93))
    return save_image(name, downsample(arr, k), "PNG")

def badge_texture(name, n=256):
    h, w = 160, n
    arr = np.zeros((h, w, 4), np.float32); arr[..., 3] = 1; arr[..., :3] = (0.93, 0.93, 0.92)
    arr[8:h - 8, 8:w - 8, :3] = (0.80, 0.24, 0.13)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.hypot(xs - w / 2, ys - h * 0.45)
    arr[(r < 38) & (r > 28), :3] = 0.93
    arr[(np.abs(xs - w / 2) < 6) & (np.abs(ys - h * 0.45) < 20), :3] = 0.93
    arr[(np.abs(xs - w / 2) < 20) & (np.abs(ys - h * 0.45) < 6), :3] = 0.93
    return save_image(name, arr, "PNG")

def oled_texture(name):
    """Layout read from the photographed OLED (WA0016): small label + large reading, a rule, icon + status line."""
    k = 2; Wt, Ht = 512, 256
    arr = np.zeros((Ht * k, Wt * k, 4), np.float32); arr[..., 3] = 1; arr[..., :3] = (0.004, 0.006, 0.016)
    blue = (0.22, 0.58, 1.0)
    label, _, value = P["DISPLAY_LINE1"].partition(":")
    draw_text(arr, label.strip() + " :", 18 * k, 77 * k, 4 * k, blue)
    draw_text(arr, value.strip(), 196 * k, 59 * k, 7 * k, blue)
    arr[131 * k:135 * k, 14 * k:498 * k, :3] = blue
    for r, row in enumerate(WIFI_ICON.split()):
        for c, bit in enumerate(row):
            if bit == "1": arr[(169 + r * 4) * k:(173 + r * 4) * k, (18 + c * 4) * k:(22 + c * 4) * k, :3] = blue
    draw_text(arr, P["DISPLAY_LINE2"], 60 * k, 169 * k, 4 * k, blue)
    return save_image(name, downsample(arr, k), "PNG")

def load_png(fname):
    d = P["OPTIONAL_LOGO_DIR"]
    if d and os.path.exists(os.path.join(d, fname)):
        img = bpy.data.images.load(os.path.join(d, fname)); img.colorspace_settings.name = "sRGB"; return img
    return None

# ======================================================================================
# 3. MATERIALS
# ======================================================================================
MATS = {}
def srgb(r, g, b):
    def c(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (c(r), c(g), c(b), 1.0)

def sin_(b, names, val):
    for n in names:
        if n in b.inputs:
            b.inputs[n].default_value = val; return

def material(key, base=(0.5, 0.5, 0.5, 1), rough=0.8, metal=0.0, albedo=None, normal=None, nstr=1.0,
             emissive=None, mask=False, sheen=0.0, name=None, doubleside=True):
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(name or ("INFINOS_Mat_" + key)); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base; b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    sin_(b, ["Specular IOR Level", "Specular"], 0.30)
    if sheen > 0:
        sin_(b, ["Sheen Weight", "Sheen"], sheen); sin_(b, ["Sheen Roughness"], 0.5); sin_(b, ["Sheen Tint"], (min(1, base[0] * 2 + .15), min(1, base[1] * 2 + .15), min(1, base[2] * 2 + .15), 1))
    if albedo is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = albedo
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if mask: nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    if normal is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = normal
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = nstr
        nt.links.new(t.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if emissive is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = emissive
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color" if "Emission Color" in b.inputs else "Emission"])
        sin_(b, ["Emission Strength"], 1.0)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if mask:
        for a, v in (("blend_method", "CLIP"), ("alpha_threshold", 0.5), ("shadow_method", "CLIP")):
            try: setattr(m, a, v)
            except Exception: pass
    MATS[key] = m; return m

def build_materials():
    M = {}
    RED, BLK, ORG = (176, 20, 24), (30, 32, 40), (255, 122, 10)   # BLK ~1.3 % reflectance (dusty charcoal nylon, WA0019); ORG: yellow-orange lining (WA0014/21)
    ra, rn = fabric_textures("red", RED, 11, p=8, nstrength=2.6, wear=0.05)
    ba, bn = fabric_textures("black", BLK, 22, p=8, nstrength=2.4, wear=P["WEAR"])
    oa, on = fabric_textures("orange", ORG, 33, p=8, nstrength=1.8)
    ha, hn = hex_textures("orangehex", ORG)
    sa, sn = silver_textures()
    wa, wn = webbing_textures()
    M["red"] = material("RedFabric", srgb(*RED), 0.88, 0, ra, rn, 1.0, sheen=0.08)
    M["black"] = material("BlackFabric", srgb(*BLK), 0.90, 0, ba, bn, 1.0, sheen=0.12)
    M["orange"] = material("OrangeLining", srgb(*ORG), 0.78, 0, oa, on, 0.8, sheen=0.12)
    M["orange_hex"] = material("OrangeLiningHex", srgb(*ORG), 0.70, 0, ha, hn, 1.0, sheen=0.10)
    M["silver"] = material("SilverLiner", srgb(196, 205, 214), 0.30, 0.15, sa, sn, 0.7, sheen=0.05)   # glossy PVC liner (WA0026/28)
    M["white"] = material("WhitePlastic", srgb(232, 232, 226), 0.48, 0)
    M["mesh"] = material("BlackMesh", srgb(10, 10, 12), 0.9, 0, mesh_texture(), mask=True)
    M["zip"] = material("Zipper", srgb(20, 21, 24), 0.58, 0.08)      # dark coil zips (photos), not bright metal
    M["webbing"] = material("Webbing", srgb(22, 23, 26), 0.88, 0, wa, wn, 1.0, sheen=0.2)
    M["plastic"] = material("BlackPlastic", srgb(10, 10, 12), 0.42, 0)
    M["acrylic"] = material("DisplayAcrylic", srgb(7, 7, 9), 0.20, 0)        # glossy plate, reflections in WA0016
    M["steel"] = material("Steel", srgb(150, 152, 158), 0.38, 0.85)
    M["cable"] = material("Cable", srgb(8, 8, 9), 0.5, 0)
    M["pouch"] = material("UnidentifiedBayItem", srgb(105, 110, 116), 0.4, 0)
    M["screen"] = material("DisplayScreen", srgb(255, 255, 255), 0.18, 0, emissive=oled_texture("tex_oled"), name="INFINOS_Mat_DisplayScreen")
    M["velcro"] = material("VelcroLoop", srgb(14, 14, 16), 0.97, 0, ba, bn, 3.0)
    ea, en = embroidery_textures("tex_bio", biohazard_mask, (236, 232, 222))
    bio = load_png("biohazard.png")
    M["biohazard"] = material("BiohazardEmbroidery", (1, 1, 1, 1), 0.55, 0, bio or ea, None if bio else en, 1.2, mask=True, sheen=0.3)
    M["emblem"] = material("RedCrossEmblem", (1, 1, 1, 1), 0.75, 0, load_png("emblem.png") or emblem_texture("tex_emblem"), mask=True)
    M["sticker"] = material("InfinosSticker", (1, 1, 1, 1), 0.45, 0, load_png("sticker.png") or sticker_texture("tex_sticker"))
    M["badge"] = material("InnerBoxBadge", (1, 1, 1, 1), 0.45, 0, load_png("badge.png") or badge_texture("tex_badge"))
    M["st_red"] = material("StitchRed", (1, 1, 1, 1), 0.7, 0, stitch_texture("red", (215, 52, 46)), mask=True)
    M["st_black"] = material("StitchBlack", (1, 1, 1, 1), 0.7, 0, stitch_texture("black", (70, 72, 78)), mask=True)
    M["st_orange"] = material("StitchOrange", (1, 1, 1, 1), 0.7, 0, stitch_texture("orange", (255, 150, 60)), mask=True)
    M["st_white"] = material("StitchWhite", (1, 1, 1, 1), 0.7, 0, stitch_texture("white", (225, 225, 220)), mask=True)
    return M

# ======================================================================================
# 4. GEOMETRY KIT
# ======================================================================================
ROOT = None
def newbm(): return bmesh.new()

def box_uv(bm, tile):
    bm.normal_update(); uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i])); a, b = [(1, 2), (0, 2), (0, 1)][ax]
        for l in f.loops:
            c = l.vert.co; l[uv].uv = (c[a] / tile, c[b] / tile)

def make_group(node, pivot):
    e = bpy.data.objects.new(node, None); e.empty_display_type = "PLAIN_AXES"; e.empty_display_size = 0.02
    bpy.context.collection.objects.link(e); e.parent = ROOT; e.location = Vector(pivot); return e

def finish(name, bm, mats, group, tile=0.05, flat=False, uv=True, conf="photo", note="", sharp=38, smooth=True):
    """bm in WORLD coords -> object parented to group.  mats: material or list (face.material_index indexes it)."""
    if len(bm.verts) == 0: bm.free(); return None
    if uv: box_uv(bm, tile)
    bmesh.ops.translate(bm, verts=bm.verts, vec=-group.location)
    me = bpy.data.meshes.new(name)
    if not flat and smooth:
        for f in bm.faces: f.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(sharp): e.smooth = False
    bm.to_mesh(me); bm.free()
    try: me.use_auto_smooth = True; me.auto_smooth_angle = math.pi
    except Exception: pass
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.parent = group
    for m in (mats if isinstance(mats, (list, tuple)) else [mats]): me.materials.append(m)
    o["confidence"] = conf
    if note: o["note"] = note
    return o

# ---------- rounded-rectangle perimeter with fixed topology -----------------------------
NXL, NYL, NA = 26, 18, 8
def perim(a, b, rc, cnt=None):
    NXL, NYL, NA = cnt or (globals()["NXL"], globals()["NYL"], globals()["NA"])
    pts = []; marks = {}
    def line(p0, p1, n, cnt):
        for i in range(cnt):
            t = i / cnt; pts.append((p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, n[0], n[1]))
    def arc(c, t0, t1, cnt, mark):
        marks[mark] = len(pts) + cnt // 2
        for i in range(cnt):
            t = t0 + (t1 - t0) * i / cnt; pts.append((c[0] + rc * math.cos(t), c[1] + rc * math.sin(t), math.cos(t), math.sin(t)))
    line((a, 0), (a, b - rc), (1, 0), NYL // 2)
    arc((a - rc, b - rc), 0, math.pi / 2, NA, "c_pp")
    line((a - rc, b), (-(a - rc), b), (0, 1), NXL)
    arc((-(a - rc), b - rc), math.pi / 2, math.pi, NA, "c_mp")
    line((-a, b - rc), (-a, -(b - rc)), (-1, 0), NYL)
    arc((-(a - rc), -(b - rc)), math.pi, 1.5 * math.pi, NA, "c_mm")
    line((-(a - rc), -b), ((a - rc), -b), (0, -1), NXL)
    arc((a - rc, -(b - rc)), 1.5 * math.pi, 2 * math.pi, NA, "c_pm")
    line((a, -(b - rc)), (a, 0), (1, 0), NYL // 2)
    marks.update(side_px=0, side_py=NYL // 2 + NA + NXL // 2, side_mx=NYL // 2 + 2 * NA + NXL + NYL // 2,
                 side_my=NYL // 2 + 3 * NA + NXL + NYL + NXL // 2)
    return pts, marks

def z_samples(L, rt0, rt1, step=0.012, nr=7):
    zs = []
    if rt0 > 0:
        for i in range(nr): zs.append(rt0 * (1 - math.cos(math.pi / 2 * i / nr)))
    s0 = rt0 if rt0 > 0 else 0.0; s1 = L - rt1 if rt1 > 0 else L
    n = max(1, int(round((s1 - s0) / step)))
    for i in range(n + 1): zs.append(s0 + (s1 - s0) * i / n)
    if rt1 > 0:
        for i in range(1, nr + 1): zs.append(L - rt1 + rt1 * math.sin(math.pi / 2 * i / nr))
    return zs

class Tube:
    """Sewn, padded rounded-rectangle tube in local coords: x in [-a,a], y in [-b,b], z in [0,L]; ends rounded by rt0/rt1."""
    def __init__(self, frame, a, b, rc, L, rt0=0.0, rt1=0.0, bulge=0.0, wr=0.0, seed=0, wr_scale=(1.0, 1.0, 1.0),
                 closed0=False, closed1=False, step=0.012, cnt=None, nr=7):
        self.F = frame; self.a, self.b, self.rc, self.L = a, b, rc, L
        self.rt0, self.rt1, self.bulge, self.wr, self.seed = rt0, rt1, bulge, wr, seed
        self.ws = wr_scale; self.closed0, self.closed1 = closed0, closed1
        self.cnt = cnt                                    # perimeter resolution (NXL, NYL, NA); None = default
        self.zs = z_samples(L, rt0, rt1, step, nr)
        self.rings = []; self.ring_data = []
        self.marks = perim(a, b, rc, cnt)[1]
    def inset(self, z):
        if self.rt0 > 0 and z < self.rt0: return self.rt0 - math.sqrt(max(self.rt0 ** 2 - (self.rt0 - z) ** 2, 0))
        if self.rt1 > 0 and z > self.L - self.rt1:
            dz = z - (self.L - self.rt1); return self.rt1 - math.sqrt(max(self.rt1 ** 2 - dz ** 2, 0))
        return 0.0
    def disp(self, x, y, z, nx, ny, e):
        a2, b2 = self.a - e, self.b - e; rc2 = max(self.rc - e * 0.5, 0.004)
        if abs(nx) >= abs(ny): u = y / max(b2 - rc2, 1e-6)
        else: u = x / max(a2 - rc2, 1e-6)
        bump = max(0.0, 1 - u * u) if abs(u) < 1 else 0.0
        vz = math.sin(math.pi * min(max(z / self.L, 0), 1)) ** 0.6
        d = self.bulge * bump * vz
        fade = 1.0 - min(1.0, e / max(self.rt0, self.rt1, 1e-6)) * 0.7 if e > 0 else 1.0
        sx, sy, sz = self.ws
        p = Vector((x * 18 * sx + self.seed, y * 18 * sy, z * 18 * sz))
        d += self.wr * fade * (noise.noise(p) * 0.8 + noise.noise(p * 3.1) * 0.35 + noise.noise(p * 0.33 + Vector((7.0, 3.0, 1.0))) * 1.9)
        return d
    def local_pt(self, z, idx, off=0.0):
        e = self.inset(z); rc2 = max(self.rc - e * 0.5, 0.004)
        pts, _ = perim(self.a - e, self.b - e, rc2, self.cnt)
        x, y, nx, ny = pts[idx % len(pts)]
        d = self.disp(x, y, z, nx, ny, e) + off
        return Vector((x + nx * d, y + ny * d, z)), Vector((nx, ny, 0.0)), e
    def world(self, v): return self.F @ v
    def wnormal(self, n): return (self.F.to_3x3() @ n).normalized()
    def build(self, bm, matfn=None, inward=False, mats_index=0):
        """Adds the tube surface to bm. Returns list of rings (vertex lists, bottom->top) for bridging."""
        rings = []
        for z in self.zs:
            e = self.inset(z); rc2 = max(self.rc - e * 0.5, 0.004)
            pts, _ = perim(self.a - e, self.b - e, rc2, self.cnt)
            ring = []
            for (x, y, nx, ny) in pts:
                d = self.disp(x, y, z, nx, ny, e)
                ring.append(bm.verts.new(self.F @ Vector((x + nx * d, y + ny * d, z))))
            rings.append(ring)
        N = len(rings[0]); faces = []
        for r0, r1 in zip(rings[:-1], rings[1:]):
            for k in range(N):
                k2 = (k + 1) % N
                faces.append(bm.faces.new((r0[k], r0[k2], r1[k2], r1[k])))
        caps = []
        if self.closed0: caps.append(bm.faces.new(rings[0][::-1]))
        if self.closed1: caps.append(bm.faces.new(rings[-1]))
        # orient outward (frame is right-handed): test first wall face
        bm.normal_update()
        f0 = faces[len(faces) // 2]
        cen = f0.calc_center_median(); axis_pt = self.F @ Vector((0, 0, self.L / 2))
        # horizontal outward direction = from the tube axis to the face centre (use local x/y)
        loc = self.F.inverted() @ cen; hv = self.F.to_3x3() @ Vector((loc.x, loc.y, 0))
        outward = f0.normal.dot(hv) > 0
        if outward == inward:
            bmesh.ops.reverse_faces(bm, faces=faces + caps)
        if matfn is not None:
            for f in faces + caps:
                bm.normal_update()
                f.material_index = matfn(f.calc_center_median(), f.normal)
        self.rings = rings
        return rings, faces, caps
    # ----- paths on the surface (for piping / stitches / zipper) ------------------------
    def ring_path(self, z, i0=0, i1=None, off=0.0, closed=False):
        N = len(perim(self.a, self.b, self.rc, self.cnt)[0])
        i1 = N if i1 is None else i1
        out = []
        idxs = list(range(i0, i1)) if i1 >= i0 else list(range(i0, N)) + list(range(0, i1))
        for i in idxs:
            p, n, e = self.local_pt(z, i, off); out.append((self.F @ p, self.wnormal(n)))
        if closed and out: out.append(out[0])
        return out
    def vline(self, idx, z0, z1, off=0.0, n=24):
        out = []
        for i in range(n + 1):
            z = z0 + (z1 - z0) * i / n; p, nn, e = self.local_pt(z, idx, off); out.append((self.F @ p, self.wnormal(nn)))
        return out
    def flat_pt(self, side, u, z, off=0.0):
        """Point on a flat panel: side in '+x','-x','+y','-y'; u = local coordinate along the panel."""
        e = self.inset(z); a2, b2 = self.a - e, self.b - e
        if side == '+x': x, y, nx, ny = a2, u, 1, 0
        elif side == '-x': x, y, nx, ny = -a2, u, -1, 0
        elif side == '+y': x, y, nx, ny = u, b2, 0, 1
        else: x, y, nx, ny = u, -b2, 0, -1
        d = self.disp(x, y, z, nx, ny, e) + off
        return self.F @ Vector((x + nx * d, y + ny * d, z)), self.wnormal(Vector((nx, ny, 0)))

def add_pipe(bm, path, r, closed=False, sides=8, ref=Vector((0, 0, 1))):
    """Round piping tube along a polyline of Vectors."""
    pts = [Vector(p) for p in path]
    if closed and (pts[0] - pts[-1]).length < 1e-9: pts = pts[:-1]
    n = len(pts); rings = []
    for i, p in enumerate(pts):
        a = pts[(i - 1) % n] if closed else pts[max(i - 1, 0)]
        b = pts[(i + 1) % n] if closed else pts[min(i + 1, n - 1)]
        f = (b - a)
        if f.length < 1e-9: continue
        f.normalize()
        s = ref - f * ref.dot(f)
        if s.length < 1e-4: s = Vector((1, 0, 0)) - f * f.x
        s.normalize(); u = f.cross(s).normalized()
        rings.append([bm.verts.new(p + s * (r * math.cos(2 * math.pi * k / sides)) + u * (r * math.sin(2 * math.pi * k / sides))) for k in range(sides)])
    faces = []
    m = len(rings)
    for i in range(m - (0 if closed else 1)):
        r0, r1 = rings[i], rings[(i + 1) % m]
        for k in range(sides): faces.append(bm.faces.new((r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k])))
    if not closed:
        faces.append(bm.faces.new(rings[0][::-1])); faces.append(bm.faces.new(rings[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=faces)

def add_loft(bm, pts, width, thick, side_hint, widths=None, power=3.0, nprof=14):
    """Padded strip (strap / binding / webbing): super-elliptic cross-section, width along side_hint, optional per-point widths."""
    pts = [Vector(p) for p in pts]; sh = Vector(side_hint)
    prof = []
    for k in range(nprof):
        t = 2 * math.pi * k / nprof; c, s = math.cos(t), math.sin(t)
        prof.append((math.copysign(abs(c) ** (2 / power), c), math.copysign(abs(s) ** (2 / power), s)))
    rings = []
    for i, p in enumerate(pts):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, len(pts) - 1)]
        f = (b - a).normalized(); s_ = (sh - f * sh.dot(f)).normalized(); n_ = f.cross(s_).normalized()
        w = (widths[i] if widths else width) / 2; t_ = thick / 2
        rings.append([bm.verts.new(p + s_ * (x * w) + n_ * (y * t_)) for x, y in prof])
    faces = []
    for r0, r1 in zip(rings[:-1], rings[1:]):
        for k in range(nprof): faces.append(bm.faces.new((r0[k], r0[(k + 1) % nprof], r1[(k + 1) % nprof], r1[k])))
    faces.append(bm.faces.new(rings[0][::-1])); faces.append(bm.faces.new(rings[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=faces)

def add_stitch(bm, path, width=0.0042, off=0.0007, dash=0.0036):
    """Dashed-thread ribbon following [(point, normal), ...]; UV u counts dashes."""
    if len(path) < 2: return
    uv = bm.loops.layers.uv.verify(); verts = []; acc = 0.0
    for i, (p, n) in enumerate(path):
        a = path[max(i - 1, 0)][0]; b = path[min(i + 1, len(path) - 1)][0]
        t = (b - a).normalized(); n = Vector(n).normalized(); s = t.cross(n).normalized()
        if i > 0: acc += (p - path[i - 1][0]).length
        verts.append((bm.verts.new(p + n * off - s * width / 2), bm.verts.new(p + n * off + s * width / 2), acc / dash))
    for (a0, a1, u0), (b0, b1, u1) in zip(verts[:-1], verts[1:]):
        f = bm.faces.new((a0, b0, b1, a1))
        for l, (u, v) in zip(f.loops, [(u0, 0), (u1, 0), (u1, 1), (u0, 1)]): l[uv].uv = (u, v)

def add_plane(bm, c, u_dir, v_dir, su, sv):
    c, u, v = Vector(c), Vector(u_dir).normalized(), Vector(v_dir).normalized()
    ps = [c - u * su / 2 - v * sv / 2, c + u * su / 2 - v * sv / 2, c + u * su / 2 + v * sv / 2, c - u * su / 2 + v * sv / 2]
    f = bm.faces.new([bm.verts.new(p) for p in ps]); uv = bm.loops.layers.uv.verify()
    for l, (a, b) in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): l[uv].uv = (a, b)

def add_decal_on(bm, tube, side, u_c, z_c, su, sz, n=14, off=0.0008, flip_u=False, uvf=None):
    """Decal grid draped on a tube's flat panel (follows padding bulge).  uvf(a, b) remaps the grid fractions
    (a along the panel's u axis, b along the tube axis) to texture coordinates."""
    uv = bm.loops.layers.uv.verify(); g = []
    uvf = uvf or (lambda a, b: (a, b))
    for j in range(n + 1):
        row = []
        for i in range(n + 1):
            uu = (i / n - 0.5) * su * (-1 if flip_u else 1); zz = z_c + (j / n - 0.5) * sz
            p, nn = tube.flat_pt(side, u_c + uu, zz, off); row.append(bm.verts.new(p))
        g.append(row)
    faces = []
    for j in range(n):
        for i in range(n):
            f = bm.faces.new((g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i])); faces.append(f)
            for l, (a, b) in zip(f.loops, [(i / n, j / n), ((i + 1) / n, j / n), ((i + 1) / n, (j + 1) / n), (i / n, (j + 1) / n)]): l[uv].uv = uvf(a, b)
    return faces

def add_patch_on(bm, tube, side, u0, u1, z0, z1, thick, nu=22, nz=16, edge=0.007):
    """Sewn-on padded panel draped over a tube's flat side: rises to `thick` and rolls back down at its edges."""
    g = []
    for j in range(nz + 1):
        row = []
        for i in range(nu + 1):
            u = u0 + (u1 - u0) * i / nu; z = z0 + (z1 - z0) * j / nz
            d = min(abs(u - u0), abs(u1 - u), abs(z - z0), abs(z1 - z)) / edge
            off = thick * (min(1.0, d) ** 0.5) + 0.0004
            row.append(bm.verts.new(tube.flat_pt(side, u, z, off)[0]))
        g.append(row)
    faces = [bm.faces.new((g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i])) for j in range(nz) for i in range(nu)]
    bm.normal_update()
    out = tube.flat_pt(side, (u0 + u1) / 2, (z0 + z1) / 2, 0.0)[1]
    if faces[0].normal.dot(out) < 0: bmesh.ops.reverse_faces(bm, faces=faces)
    return faces

def add_box(bm, c, s, bevel=0.0, seg=2, rot=None):
    m = Matrix.Translation(Vector(c))
    if rot: m = m @ Euler(rot).to_matrix().to_4x4()
    m = m @ Matrix.Diagonal((s[0], s[1], s[2], 1.0))
    verts = bmesh.ops.create_cube(bm, size=1.0, matrix=m)["verts"]
    bevel = min(bevel, min(s) * 0.45)
    if bevel > 1e-5:
        bmesh.ops.bevel(bm, geom=list({e for v in verts for e in v.link_edges}), offset=bevel, segments=seg, affect="EDGES")

def add_box_range(bm, x0, x1, y0, y1, z0, z1, bevel=0.0, seg=2):
    add_box(bm, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), bevel, seg)

def add_cyl_axis(bm, c, r, depth, axis="X", segs=12):
    rot = {"X": Euler((0, math.pi / 2, 0)), "Y": Euler((-math.pi / 2, 0, 0)), "Z": Euler((0, 0, 0))}[axis]
    m = Matrix.Translation(Vector(c)) @ rot.to_matrix().to_4x4()
    kw = dict(cap_ends=True, cap_tris=False, segments=segs, depth=depth, matrix=m)
    try: bmesh.ops.create_cone(bm, radius1=r, radius2=r, **kw)
    except TypeError: bmesh.ops.create_cone(bm, diameter1=2 * r, diameter2=2 * r, **kw)

def add_zip_poly(bm, path, width=0.010, pitch=0.0042):
    """Zipper run along [(point, normal)]: fabric tape + alternating coil teeth."""
    pts = [Vector(p) for p, n in path]; ns = [Vector(n) for p, n in path]
    if len(pts) < 2: return
    tape = [(p + n * 0.0004, n) for p, n in zip(pts, ns)]
    add_loft(bm, [t[0] for t in tape], width, 0.0022, (ns[0].cross(pts[1] - pts[0])).normalized(), power=6.0, nprof=8)
    acc = 0.0; k = 0; nxt = pitch / 2
    for i in range(len(pts) - 1):
        seg = pts[i + 1] - pts[i]; L = seg.length
        if L < 1e-9: continue
        f = seg / L; n = (ns[i] + ns[i + 1]).normalized(); s = n.cross(f).normalized()
        while nxt <= acc + L:
            c = pts[i] + f * (nxt - acc) + n * 0.0019 + s * (0.0011 if k % 2 else -0.0011)
            m = Matrix((f, s, n)).transposed().to_4x4(); m.translation = c
            m = m @ Matrix.Diagonal((0.0028, 0.0034, 0.0016, 1.0)); bmesh.ops.create_cube(bm, size=1.0, matrix=m)
            nxt += pitch; k += 1
        acc += L

def add_slider(bm, c, along, outward, tab_dir, tab_len=0.026, tab_w=0.007):
    c = Vector(c); a = Vector(along).normalized(); o = Vector(outward).normalized(); t = Vector(tab_dir).normalized()
    s = a.cross(o).normalized()
    m = Matrix((a, s, o)).transposed().to_4x4(); m.translation = c + o * 0.004
    m = m @ Matrix.Diagonal((0.016, 0.012, 0.008, 1.0))
    verts = bmesh.ops.create_cube(bm, size=1.0, matrix=m)["verts"]
    bmesh.ops.bevel(bm, geom=list({e for v in verts for e in v.link_edges}), offset=0.0018, segments=2, affect="EDGES")
    t_side = t.cross(o).normalized() if t.cross(o).length > 1e-4 else s
    m2 = Matrix((t, t_side, o)).transposed().to_4x4(); m2.translation = c + o * 0.0075 + t * (tab_len / 2 + 0.004)
    m2 = m2 @ Matrix.Diagonal((tab_len, tab_w, 0.0022, 1.0))
    v2 = bmesh.ops.create_cube(bm, size=1.0, matrix=m2)["verts"]
    bmesh.ops.bevel(bm, geom=list({e for v in v2 for e in v.link_edges}), offset=0.0009, segments=2, affect="EDGES")

def wrap_path(path_pts, n_close=True):
    return path_pts

def bridge(bm, ringA, ringB, flip=False):
    N = len(ringA); faces = []
    for k in range(N):
        k2 = (k + 1) % N
        q = (ringA[k], ringA[k2], ringB[k2], ringB[k]) if not flip else (ringA[k2], ringA[k], ringB[k], ringB[k2])
        faces.append(bm.faces.new(q))
    return faces

# ======================================================================================
# 5. COMPONENT BUILDERS
# ======================================================================================
def Fz(origin): return Matrix.Translation(Vector(origin))
def Fy_back(origin):   # local z -> world -Y (tube grows toward the front), local y -> world Z
    m = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0))).transposed().to_4x4(); m.translation = Vector(origin); return m
def Fy_front(origin):  # local z -> world +Y, local y -> world -Z
    m = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0))).transposed().to_4x4(); m.translation = Vector(origin); return m

def red_black(red_idx, blk_idx):
    return lambda c, n: red_idx if abs(n.x) > 0.7071 else blk_idx

def piping_along(bm, path, r=0.0042, closed=False, ref=Vector((0, 0, 1))):
    add_pipe(bm, [p for p, n in path], r, closed, 8, ref)

def build_lower_shell(g, M, S):
    L = Y_BACK - Y_LF
    T = Tube(Fy_back((0, Y_BACK, H_L / 2)), XH, H_L / 2, RC, L, rt0=0.022, rt1=0.0, bulge=P["BULGE"], wr=P["WRINKLE"], seed=3,
             wr_scale=(1, 1, 1), closed0=True, step=0.015)
    S["lower"] = T
    bm = newbm(); T.build(bm, red_black(0, 1))
    finish("LS_Shell", bm, [M["red"], M["black"]], g, 0.05)
    # orange lining (inside, open at front) + bridged rim
    iw = WALL
    Ti = Tube(Fy_back((0, Y_BACK - WALL, H_L / 2)), XH - iw, H_L / 2 - iw, max(RC - iw, 0.008), L - WALL - 0.002, rt0=0.012, rt1=0.0,
              bulge=0.002, wr=0.001, seed=7, closed0=True, step=0.022)
    bm = newbm(); Ti.build(bm, None, inward=True)
    finish("LS_Lining_Orange", bm, M["orange"], g, 0.05)
    # close the gap between shell and lining at the front rim
    bm = newbm()
    ro = [bm.verts.new(p) for p, n in T.ring_path(L, 0, None, 0.0)]
    ri = [bm.verts.new(p) for p, n in Ti.ring_path(Ti.L, 0, None, 0.0)]
    bridge(bm, ro, ri); finish("LS_RimBand", bm, M["black"], g, 0.04, sharp=60)
    # front opening frame: piping + stitches + zipper track (inverted U) + sliders at the bottom corners
    bm = newbm(); front = Ti.ring_path(Ti.L - 0.001, 0, None, 0.002, closed=True)
    piping_along(bm, front, 0.0042, True, Vector((0, 1, 0)))
    finish("LS_FrontPiping", bm, M["black"], g, 0.04)
    # simple, robust zipper U: two verticals + top
    zx = XH - WALL - 0.003; zt = H_L - WALL - 0.003; zb = 0.020
    bm = newbm(); nrm = Vector((0, -1, 0)); yz = Y_LF + 0.0008
    U = [(Vector((-zx, yz, zb + (zt - zb) * i / 14)), nrm) for i in range(15)] + \
        [(Vector((-zx + 2 * zx * i / 40, yz, zt)), nrm) for i in range(1, 41)] + \
        [(Vector((zx, yz, zt - (zt - zb) * i / 14)), nrm) for i in range(1, 15)]
    add_zip_poly(bm, U, 0.008, 0.0056)
    for sx in (-1, 1):
        add_slider(bm, (sx * zx, yz - 0.001, 0.030), (0, 0, 1), (0, -1, 0), (0, 0, -1), 0.020)
    finish("Zipper_DropPanel", bm, M["zip"], g, uv=False, flat=True, conf="provisional", note="Routing partly inferred from A6/A7")
    # corner piping + stitches on the shell (sewn seams between red sides and black faces)
    bm = newbm()
    for key in ("c_pp", "c_mp", "c_mm", "c_pm"):
        path = T.vline(T.marks[key], 0.004, L - 0.0, 0.0, 34)
        piping_along(bm, path, 0.0040, False, Vector((1, 0, 0)))
    finish("LS_CornerPiping", bm, M["black"], g, 0.04)
    for key, mat in (("c_pp", "st_black"), ("c_mp", "st_black"), ("c_mm", "st_black"), ("c_pm", "st_black")):
        for dI in (-3, 3):
            bm = newbm(); add_stitch(bm, T.vline(T.marks[key] + dI, 0.01, L - 0.003, 0.0006, 40))
            finish("LS_Stitch_%s_%d" % (key, dI), bm, M[mat], g, uv=False, flat=True)
    # biohazard embroidery on both side panels (decals draped over the padded surface)
    _, _, w_bio = bio_fit_scale()
    side_len = P["BIO_SIZE"] / (w_bio * bio_fit_scale()[0] / 2)        # decal square that holds a BIO_SIZE-wide symbol
    for side in ("+x", "-x"):
        bm = newbm()
        # local y <-> world Z (centre at H_L/2); local z runs toward the front.  Texture v must follow world Z
        # (symbol upright) and texture u the depth axis, front on the viewer's left (+X) or right (-X).
        uvf = (lambda a, b: (1 - b, a)) if side == "+x" else (lambda a, b: (b, a))
        add_decal_on(bm, T, side, (P["BIO_Z_FRAC"] - 0.5) * H_L, L * 0.5, side_len, side_len, 18, 0.0010, uvf=uvf)
        finish("LS_Biohazard_%s" % ("Right" if side == "+x" else "Left"), bm, M["biohazard"], g, uv=False, flat=True,
               note="Embroidery approximated. Override with OPTIONAL_LOGO_DIR/biohazard.png")
    return T

def build_drop_panel(g, M, S):
    a = XH - WALL - 0.0015; b = (H_L - 2 * WALL - 0.004) / 2
    T = Tube(Fy_front((0, Y_LF, H_L / 2)), a, b, 0.016, 0.026, rt0=0.009, rt1=0.009, bulge=0.0045, wr=0.0012, seed=11,
             closed0=True, closed1=True, step=0.014, nr=5)
    S["drop"] = T
    bm = newbm()
    T.build(bm, lambda c, n: 1 if c.y > Y_LF + 0.013 else 0)   # inner half orange hex, outer half black (split under the binding)
    finish("DP_Panel", bm, [M["black"], M["orange_hex"]], g, 0.05)
    # perimeter binding (piping) + stitch rows on the outer face
    bm = newbm()
    path = T.ring_path(0.0125, 0, None, 0.0025, closed=True)
    piping_along(bm, path, 0.0052, True, Vector((0, 1, 0)))
    finish("DP_EdgeBinding", bm, M["black"], g, 0.04)
    for zz in (0.0035, 0.0215):
        bm = newbm(); add_stitch(bm, T.ring_path(zz, 0, None, 0.0006, closed=True), 0.0040, 0.0006)
        finish("DP_Stitch_%d" % int(zz * 1e4), bm, M["st_black"], g, uv=False, flat=True)
    # decals on the OUTER face (z=0 side is local 'front' - draped as a flat grid)
    def outer_decal(name, xc, zc, sx, sz, mat):
        bm = newbm(); uv = bm.loops.layers.uv.verify(); n = 10; gridv = []
        for j in range(n + 1):
            row = []
            for i in range(n + 1):
                x = xc + (i / n - 0.5) * sx; zl = zc + (j / n - 0.5) * sz   # world X, world Z
                # sample front face height from the tube: front plane is world y = Y_LF - bulge
                lx = x; ly = -(zl - H_L / 2)
                e = T.inset(0.0); d = T.disp(lx, ly, 0.0, 0, 0, e) if False else 0.0
                row.append(bm.verts.new((x, Y_LF - 0.0006 - 0.0004, zl)))
            gridv.append(row)
        for j in range(n):
            for i in range(n):
                f = bm.faces.new((gridv[j][i], gridv[j + 1][i], gridv[j + 1][i + 1], gridv[j][i + 1]))
                for l, (u, v) in zip(f.loops, [(i / n, j / n), (i / n, (j + 1) / n), ((i + 1) / n, (j + 1) / n), ((i + 1) / n, j / n)]): l[uv].uv = (u, v)
        finish(name, bm, M[mat], g, uv=False, flat=True)
    outer_decal("DP_Emblem_RedCross", 0.102, 0.078, 0.032, 0.032, "emblem")
    if P["STICKER_INFINOS"]:
        outer_decal("DP_Sticker_Infinos", 0.104, 0.040, 0.054, 0.034, "sticker")
    return T

def build_upper_body(g, M, S):
    T = Tube(Fz((0, (Y_UF + Y_BACK) / 2, Z_U0)), XH, D_U / 2, RC, H_U, rt0=0.016, rt1=0.0, bulge=P["BULGE"], wr=P["WRINKLE"], seed=5,
             closed0=True, step=0.015)
    S["upper"] = T
    bm = newbm(); T.build(bm, red_black(0, 1))
    finish("UB_Shell", bm, [M["red"], M["black"]], g, 0.05)
    iw = WALL
    Ti = Tube(Fz((0, (Y_UF + Y_BACK) / 2, Z_U0 + WALL)), XH - iw, D_U / 2 - iw, max(RC - iw, 0.008), H_U - WALL, rt0=0.012, rt1=0.0,
              bulge=0.003, wr=0.0012, seed=9, closed0=True, step=0.02)
    S["upper_in"] = Ti
    bm = newbm(); Ti.build(bm, None, inward=True)
    finish("UB_Lining_Orange", bm, M["orange"], g, 0.05)
    # rim: bridge outer and inner top rings, then piping
    bm = newbm()
    ro = [bm.verts.new(p) for p, n in T.ring_path(H_U, 0, None, 0.0)]
    ri = [bm.verts.new(p) for p, n in Ti.ring_path(H_U - WALL, 0, None, 0.0)]
    # shift inner ring to the same height (it lives WALL lower in its own frame)
    bridge(bm, ro, ri)
    finish("UB_RimBand", bm, M["black"], g, 0.04, sharp=60)
    bm = newbm(); piping_along(bm, T.ring_path(H_U - 0.001, 0, None, 0.002, True), 0.0046, True)
    finish("UB_RimPiping", bm, M["black"], g, 0.04)
    # corner piping + stitches
    bm = newbm()
    for key in ("c_pp", "c_mp", "c_mm", "c_pm"):
        piping_along(bm, T.vline(T.marks[key], 0.008, H_U - 0.002, 0.0, 30), 0.0040, False, Vector((1, 0, 0)))
    finish("UB_CornerPiping", bm, M["black"], g, 0.04)
    for key in ("c_pp", "c_mp", "c_mm", "c_pm"):
        for dI in (-3, 3):
            bm = newbm(); add_stitch(bm, T.vline(T.marks[key] + dI, 0.012, H_U - 0.012, 0.0006, 34))
            finish("UB_Stitch_%s_%d" % (key, dI), bm, M["st_black"], g, uv=False, flat=True)
    bm = newbm(); add_stitch(bm, T.ring_path(H_U - 0.010, 0, None, 0.0006, True)); finish("UB_Stitch_Rim", bm, M["st_black"], g, uv=False, flat=True)
    # seam band between compartments
    bm = newbm(); piping_along(bm, T.ring_path(0.004, 0, None, 0.0014, True), 0.0058, True)
    finish("UB_SeamBand", bm, M["black"], g, 0.04)
    # velcro band on the front (A1/A12) + stitched edges
    bm = newbm(); front = []
    for i in range(0, 41):
        x = -XH + 0.030 + (2 * XH - 0.060) * i / 40
        front.append(T.flat_pt('-y', x, H_U - 0.040, 0.0))
    top = [T.flat_pt('-y', p.x, H_U - 0.020, 0.0) for p, n in front]
    # strip made of two paths
    add_loft(bm, [p + n * 0.0011 for p, n in [T.flat_pt('-y', -XH + 0.030 + (2 * XH - 0.060) * i / 40, H_U - 0.030, 0.0) for i in range(41)]],
             0.026, 0.0022, (0, 0, 1), power=8.0, nprof=8)
    finish("UB_FrontVelcroBand", bm, M["velcro"], g, 0.02, conf="photo")
    # interior details: mesh pocket (back wall), side pocket, tag
    yb = Y_BACK - WALL - LIN - 0.003
    bm = newbm(); uv = bm.loops.layers.uv.verify(); g_ = []
    x0, x1, z0, z1 = -0.115, 0.115, Z_U0 + WALL + 0.060, Z_U0 + WALL + 0.170
    vs = [bm.verts.new(p) for p in ((x0, yb, z0), (x1, yb, z0), (x1, yb, z1), (x0, yb, z1))]
    f = bm.faces.new(vs[::-1]); f.normal_flip()
    for l, (u, v) in zip(f.loops, [(0, 0), (0, 5), (7, 5), (7, 0)]): l[uv].uv = (u, v)
    finish("UB_MeshPocket_Back", bm, M["mesh"], g, uv=False, flat=True, conf="photo")
    bm = newbm(); piping_along(bm, [(Vector((x0, yb, z1)), 0), (Vector((x1, yb, z1)), 0)], 0.0028, False, Vector((0, 1, 0)))
    finish("UB_MeshPocket_Elastic", bm, M["black"], g, 0.04)
    bm = newbm()
    add_box_range(bm, -XH + WALL + LIN + 0.001, -XH + WALL + LIN + 0.005, -0.075, 0.045, Z_U0 + WALL + 0.035, Z_U0 + WALL + 0.150, 0.0015)
    add_box_range(bm, XH - WALL - LIN - 0.005, XH - WALL - LIN - 0.001, 0.045, 0.135, Z_U0 + WALL + 0.012, Z_U1 - 0.014, 0.0015)
    finish("UB_Pockets_Side", bm, M["black"], g, 0.03, conf="provisional")
    bm = newbm(); add_box_range(bm, -0.111, -0.079, yb - 0.002, yb + 0.0005, Z_U1 - 0.036, Z_U1 - 0.016, 0.001)
    finish("UB_Tag_Infinos", bm, M["sticker"], g, 0.02, conf="photo", note="Woven tag left of centre at the top of the back wall (WA0014, WA0021)")
    # -X side: stitched sleeve-pocket panel from the back edge to ~87 % of the depth (WA0023, WA0027, WA0029, WA0031)
    if P["SIDE_POCKET"]:
        u_back, u_front = D_U / 2 - 0.010, D_U / 2 - 0.87 * D_U
        z0p, z1p = 0.014, H_U - 0.012
        bm = newbm(); add_patch_on(bm, T, '-x', u_front, u_back, z0p, z1p, 0.0048)
        finish("UB_SidePocket_Red", bm, M["red"], g, 0.05, conf="photo", note="Sewn-on sleeve panel, -X upper side (WA0031)")
        for path in ([T.flat_pt('-x', u_front + 0.006, z0p + (z1p - z0p) * i / 24, 0.0036) for i in range(25)],
                     [T.flat_pt('-x', u_front + (u_back - u_front) * i / 30, z1p - 0.006, 0.0036) for i in range(31)]):
            bm = newbm(); add_stitch(bm, path); finish("UB_SidePocket_Stitch", bm, M["st_red"], g, uv=False, flat=True)
    # +X side: a stitched seam runs across the top of the panel (WA0016)
    bm = newbm(); add_stitch(bm, [T.flat_pt('+x', -D_U / 2 + 0.020 + (D_U - 0.040) * i / 30, H_U - 0.024, 0.0006) for i in range(31)])
    finish("UB_SideSeam_Stitch_Right", bm, M["st_black"], g, uv=False, flat=True)
    # lid zipper track on the rim (front + both sides)
    zp = []
    ring = T.ring_path(H_U + 0.0008, 0, None, -0.0045)
    N = len(ring)
    pts = [(p + Vector((0, 0, 0.0)), Vector((0, 0, 1))) for p, n in ring]
    # keep front half only (y < back - 0.02): front + sides
    sel = [q for q in pts if q[0].y < Y_BACK - 0.030]
    sel.sort(key=lambda q: math.atan2(q[0].y - (Y_UF + Y_BACK) / 2, q[0].x))
    # order from back-left, across the front, to back-right
    sel.sort(key=lambda q: (math.atan2(-(q[0].y - (Y_UF + Y_BACK) / 2), q[0].x)))
    bm = newbm(); add_zip_poly(bm, sel, 0.010, 0.0056)
    finish("Zipper_UpperLid", bm, M["zip"], g, uv=False, flat=True)
    return T

def build_upper_lid(g, M, S):
    lt = P["LID_T"]
    T = Tube(Fz((0, (Y_UF + Y_BACK) / 2 - 0.002, LID_Z0)), XH - 0.004, D_U / 2 - 0.006, RC - 0.003, lt, rt0=0.0065, rt1=0.0065,
             bulge=0.0035, wr=0.0012, seed=13, closed0=True, closed1=True, step=0.008, nr=5)
    z_split = LID_Z0 + lt * 0.5                       # orange underside / black top meet under the rim binding
    bm = newbm(); T.build(bm, lambda c, n: 1 if c.z < z_split else 0)
    finish("UL_Pad", bm, [M["black"], M["orange_hex"]], g, 0.05)
    bm = newbm(); piping_along(bm, T.ring_path(lt * 0.5, 0, None, 0.0015, True), 0.0046, True)
    finish("UL_RimBinding", bm, M["black"], g, 0.04)
    bm = newbm(); add_stitch(bm, T.ring_path(lt - 0.0036, 0, None, 0.0006, True)); finish("UL_Stitch", bm, M["st_black"], g, uv=False, flat=True)
    bm = newbm()
    add_slider(bm, (XH - 0.0035, Y_BACK - 0.050, LID_Z0 + lt * 0.5), (0, 1, 0), (1, 0, 0), (0, 1, 0), 0.024)
    finish("UL_ZipperPull", bm, M["zip"], g, uv=False, flat=True)

def build_flap(g, M, S):
    th = P["FLAP_T"]
    z_top = Z_FLAP_TOP
    y_hinge = Y_BACK - 0.008
    R = 0.030
    y_out = Y_LF + 0.012
    y_arc = y_out + R
    z_bot = Z_U1 - P["FLAP_DROP"]
    zc = z_top - R
    xw = XH - 0.001
    prof = []; s = 0.0; last = None
    def push(y, z, ny, nz):
        nonlocal s, last
        if last is not None: s += math.hypot(y - last[0], z - last[1])
        prof.append((y, z, ny, nz, s)); last = (y, z)
    for i in range(41): push(y_hinge + (y_arc - y_hinge) * i / 40, z_top, 0, 1)
    for i in range(1, 13):
        phi = math.pi / 2 * i / 12; push(y_arc - R * math.sin(phi), zc + R * math.cos(phi), -math.sin(phi), math.cos(phi))
    for i in range(1, 29): push(y_out, zc + (z_bot - zc) * i / 28, -1, 0)
    total = prof[-1][4]
    NX = 64; xs = [-xw + 2 * xw * i / NX for i in range(NX + 1)]
    pitch, amp = P["QUILT_PITCH"], 0.0088          # deep, narrow stitch grooves between full channels (WA0019)
    def sstep(a, b, t):
        t = min(1.0, max(0.0, (t - a) / (b - a))); return t * t * (3 - 2 * t)
    def wave(x):
        """Stitch-line offset traced from WA0019: low at both edges, S-rise, raised flat middle, S-fall."""
        u = (x + xw) / (2 * xw)
        f = sstep(*P["QUILT_RISE"], u) * (1 - sstep(*P["QUILT_FALL"], u))
        return -P["QUILT_WAVE"] * (f - 0.5)
    def qh(x, sj):
        c = sj - wave(x)
        fr = (c / pitch) % 1.0
        return amp * (math.sin(math.pi * fr) ** 0.45) - amp * 0.30
    def taper(x, sj):
        d = max(0.0, min(1.0, min(xw - abs(x), sj, total - sj) / 0.026)); return d * d * (3 - 2 * d)
    def at(sv):
        for i in range(len(prof) - 1):
            if prof[i][4] <= sv <= prof[i + 1][4]:
                t = (sv - prof[i][4]) / max(prof[i + 1][4] - prof[i][4], 1e-9)
                y = prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t; z = prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t
                ny = prof[i][2] + (prof[i + 1][2] - prof[i][2]) * t; nz = prof[i][3] + (prof[i + 1][3] - prof[i][3]) * t
                l = math.hypot(ny, nz) or 1; return y, z, ny / l, nz / l
        return None
    bm = newbm(); vg = []
    for (y, z, ny, nz, sj) in prof:
        row = []
        for x in xs:
            h = qh(x, sj) * taper(x, sj) + P["WRINKLE"] * noise.noise(Vector((x * 22, sj * 22, 3.0))) * 0.8
            row.append(bm.verts.new((x, y + ny * h, z + nz * h)))
        vg.append(row)
    for j in range(len(prof) - 1):
        for i in range(NX): bm.faces.new((vg[j][i], vg[j + 1][i], vg[j + 1][i + 1], vg[j][i + 1]))
    bm.normal_update(); bm.faces.ensure_lookup_table()
    if bm.faces[0].normal.z < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    finish("Flap_Quilted_Red", bm, M["red"], g, 0.05, sharp=75, note="Quilting stitch lines traced from WA0019")
    bm = newbm(); vg = []
    under_rows = prof[::2] + ([prof[-1]] if (len(prof) - 1) % 2 else [])
    under_xs = xs[3:-3:2] + ([xs[-4]] if len(xs[3:-3]) % 2 == 0 else [])
    for (y, z, ny, nz, sj) in under_rows:
        vg.append([bm.verts.new((x, y - ny * th, z - nz * th)) for x in under_xs])
    for j in range(len(under_rows) - 1):
        for i in range(len(under_xs) - 1): bm.faces.new((vg[j][i], vg[j][i + 1], vg[j + 1][i + 1], vg[j + 1][i]))
    bm.normal_update(); bm.faces.ensure_lookup_table()
    if bm.faces[0].normal.z > 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    finish("Flap_Underside_OrangeHex", bm, M["orange_hex"], g, 0.05, sharp=75)
    # quilting stitch lines along every groove
    k = 1
    while k * pitch < total - 0.01:
        path = []
        for i in range(0, NX + 1):
            x = xs[i]; sv = k * pitch + wave(x)
            if 0.012 < sv < total - 0.012:
                r = at(sv); y, z, ny, nz = r; h = qh(x, sv) * taper(x, sv)
                path.append((Vector((x, y + ny * (h + 0.0014), z + nz * (h + 0.0014))), Vector((0, ny, nz))))
        if len(path) > 3:
            bm = newbm(); add_stitch(bm, path, 0.0040, 0.0003); finish("Flap_Stitch_%02d" % k, bm, M["st_red"], g, uv=False, flat=True)
        k += 1
    # edge bindings: rolled bias tape over both side edges and the hem
    bm = newbm()
    for sx in (-1, 1):
        pts = [(sx * (xw - 0.003), y - ny * (th * 0.5), z - nz * (th * 0.5)) for (y, z, ny, nz, sj) in prof[::2]]
        add_loft(bm, pts, 0.0105, th + 0.003, (1, 0, 0), power=3.5, nprof=12)
    add_loft(bm, [(-xw + 0.003 + (2 * xw - 0.006) * i / 24, y_out - 0.0015 + th * 0.0, z_bot + 0.002) for i in range(25)], 0.013, th + 0.003, (0, 0, 1), power=3.5, nprof=12)
    finish("Flap_Binding_Black", bm, M["black"], g, 0.04, sharp=70)
    for sx in (-1, 1):
        for off in (0.0105,):
            path = []
            for (y, z, ny, nz, sj) in prof[::2]:
                path.append((Vector((sx * (xw - off), y + ny * 0.0012, z + nz * 0.0012)), Vector((0, ny, nz))))
            bm = newbm(); add_stitch(bm, path, 0.0040, 0.0003); finish("Flap_EdgeStitch_%+d" % sx, bm, M["st_black"], g, uv=False, flat=True)
    bm = newbm(); path = [(Vector((-xw + 0.011 + (2 * xw - 0.022) * i / 40, y_out - 0.0010, z_bot + 0.012)), Vector((0, -1, 0))) for i in range(41)]
    add_stitch(bm, path, 0.0040, 0.0003); finish("Flap_HemStitch", bm, M["st_black"], g, uv=False, flat=True)
    # carry handle: NOT visible in any of the 13 photographs -> only built when explicitly requested
    if P["INCLUDE_CARRY_HANDLE"]:
        build_carry_handle(g, M, z_top)
    # underside details (WA0016): velcro band near the hem, zipped pocket near the hinge
    bm = newbm()
    yb = y_out + th + 0.0012
    add_loft(bm, [(-xw + 0.03 + (2 * xw - 0.06) * i / 20, yb, zc - 0.062) for i in range(21)], 0.026, 0.0022, (0, 0, 1), power=8, nprof=8)
    finish("Flap_Underside_VelcroBand", bm, M["velcro"], g, 0.02)
    bm = newbm(); zi = z_top - th - 0.0012
    add_loft(bm, [(-0.105 + 0.21 * i / 20, y_hinge - 0.090, zi) for i in range(21)], 0.034, 0.0022, (0, 1, 0), power=8, nprof=8)
    zp = [(Vector((-0.098 + 0.196 * i / 30, y_hinge - 0.090, zi - 0.0012)), Vector((0, 0, -1))) for i in range(31)]
    add_zip_poly(bm, zp, 0.008, 0.0042)
    finish("Flap_Underside_ZipPocket", bm, M["black"], g, 0.02, conf="photo")
    return dict(z_top=z_top, y_hinge=y_hinge)

def build_carry_handle(g, M, z_top):
    """Optional padded webbing arch (INCLUDE_CARRY_HANDLE).  Not supported by the reference photographs."""
    bm = newbm(); pts = []
    for i in range(15):
        t = i / 14; y = -0.050 + 0.150 * t
        pts.append((0, y, z_top + 0.002 + 0.030 * math.sin(math.pi * t) ** 0.85))
    add_loft(bm, pts, 0.030, 0.0055, (1, 0, 0), power=5.0, nprof=10)
    finish("Flap_CarryHandle", bm, M["webbing"], g, 0.03, conf="provisional", note="Position/length estimated from B4")
    for yy in (-0.054, 0.104):
        bm = newbm(); add_box_range(bm, -0.020, 0.020, yy - 0.011, yy + 0.011, z_top - 0.001, z_top + 0.0035, 0.001)
        finish("Flap_HandleTab_%d" % int(yy * 1000), bm, M["webbing"], g, 0.03, conf="provisional")
        bm = newbm()
        pp = [(Vector((-0.017 + 0.034 * i / 10, yy - 0.008, z_top + 0.0042)), Vector((0, 0, 1))) for i in range(11)] + \
             [(Vector((0.017, yy - 0.008 + 0.016 * i / 6, z_top + 0.0042)), Vector((0, 0, 1))) for i in range(1, 7)] + \
             [(Vector((0.017 - 0.034 * i / 10, yy + 0.008, z_top + 0.0042)), Vector((0, 0, 1))) for i in range(1, 11)]
        add_stitch(bm, pp, 0.0030, 0.0002, 0.003); finish("Flap_HandleStitch_%d" % int(yy * 1000), bm, M["st_white"], g, uv=False, flat=True)

def add_rounded_plate(bm, x_face, sd, yc, zc, w, h, t, r, seg=6, bevel=0.0012):
    """Rounded-rectangle plate in the YZ plane, resting on x = x_face and extruded by t toward sd * X."""
    pts = []
    for (cy_, cz_, a0) in ((w / 2 - r, h / 2 - r, 0), (-(w / 2 - r), h / 2 - r, 90), (-(w / 2 - r), -(h / 2 - r), 180), (w / 2 - r, -(h / 2 - r), 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg); pts.append((yc + cy_ + r * math.cos(a), zc + cz_ + r * math.sin(a)))
    base = [bm.verts.new((x_face, y, z)) for y, z in pts]
    f = bm.faces.new(base if sd > 0 else base[::-1])
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    top = [v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=Vector((sd * t, 0, 0)))
    bm.normal_update()
    if bevel > 0:
        cap_edges = [e for e in bm.edges if all(v in top for v in e.verts)]
        bmesh.ops.bevel(bm, geom=cap_edges, offset=bevel, segments=2, affect="EDGES")

def add_screw_head(bm, c, sd, r, h=0.0011, segs=14):
    """Low domed screw head facing sd * X."""
    add_cyl_axis(bm, (c[0] + sd * h / 2, c[1], c[2]), r, h, "X", segs)
    m = Matrix.Translation(Vector((c[0] + sd * h, c[1], c[2]))) @ Matrix.Diagonal((r * 0.45, r, r, 1.0))
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=6, radius=1.0, matrix=m)

def build_display(g, M, S):
    """Display as photographed (WA0016): glossy black rounded plate, 4 corner screws, centred OLED module."""
    pw, ph, pt = P["DISPLAY_PLATE"]; sw, sh = P["DISPLAY_SCREEN"]; sd = P["DISPLAY_SIDE"]
    T = S["upper"]
    zc = g.location.z; yc = g.location.y
    z_local = zc - Z_U0
    side = '+x' if sd > 0 else '-x'
    p, n = T.flat_pt(side, yc - (Y_UF + Y_BACK) / 2, z_local, 0.0)
    x0 = p.x - sd * 0.001
    bm = newbm()
    add_rounded_plate(bm, x0, sd, yc, zc, pw, ph, pt, 0.0095)
    finish("DISP_Plate_Black", bm, M["acrylic"], g, 0.03, conf="photo", note="Plate size/shape from WA0016; thickness unknown", sharp=50)
    xf = x0 + sd * pt
    bm = newbm()
    for dy in (-1, 1):
        for dz in (-1, 1):
            add_screw_head(bm, (xf, yc + dy * (pw / 2 - 0.0085), zc + dz * (ph / 2 - 0.0085)), sd, 0.0031)
    for dy, dz in ((-1, 1), (1, -1)):                     # OLED module screws (the other two holes are empty)
        add_screw_head(bm, (xf, yc + dy * 0.019, zc + dz * 0.016), sd, 0.0017, 0.0007, 10)
    finish("DISP_Screws", bm, M["steel"], g, 0.01)
    bm = newbm()
    for dy, dz in ((1, 1), (-1, -1)):
        add_cyl_axis(bm, (xf + sd * 0.0002, yc + dy * 0.019, zc + dz * 0.016), 0.0016, 0.0004, "X", 10)
    add_box(bm, (xf + sd * 0.0004, yc, zc), (0.0008, sw + 0.0045, sh + 0.0045), 0.0003, 1)
    finish("DISP_Bezel", bm, M["plastic"], g, 0.02)
    bm = newbm(); x = xf + sd * 0.0010
    add_plane(bm, (x, yc, zc), (0, sd, 0), (0, 0, 1), sw, sh)      # text reads toward the back (viewer's right)
    finish("DISP_Screen_OLED", bm, M["screen"], g, uv=False, flat=True, conf="photo",
           note="Readout as photographed in WA0016 - illustrative, not a specification")

def build_inner_box(g, M, S):
    bw, bd, bh = P["BOX_W"], P["BOX_D"], P["BOX_H"]
    cy = (BOX_Y_FRONT + BOX_Y_BACK) / 2
    T = Tube(Fz((0, cy, BOX_Z0)), bw / 2, bd / 2, 0.018, bh, rt0=0.010, rt1=0.0, bulge=0.004, wr=0.0014, seed=17, closed0=True, step=0.016)
    S["box"] = T
    bm = newbm(); T.build(bm, red_black(0, 1))
    finish("IB_Shell", bm, [M["red"], M["black"]], g, 0.05)
    t = 0.006
    Ti = Tube(Fz((0, cy, BOX_Z0 + t)), bw / 2 - t, bd / 2 - t, 0.012, bh - t, rt0=0.006, rt1=0.0, bulge=0.002, wr=0.0016, seed=19, closed0=True, step=0.02)
    bm = newbm(); Ti.build(bm, None, inward=True)
    finish("IB_Liner_Silver", bm, M["silver"], g, 0.06)
    bm = newbm()
    ro = [bm.verts.new(p) for p, n in T.ring_path(bh, 0, None, 0.0)]
    ri = [bm.verts.new(p) for p, n in Ti.ring_path(bh - t, 0, None, 0.0)]
    bridge(bm, ro, ri); finish("IB_RimBand", bm, M["black"], g, 0.04, sharp=60)
    bm = newbm(); piping_along(bm, T.ring_path(bh - 0.001, 0, None, 0.002, True), 0.0040, True)
    finish("IB_RimPiping", bm, M["black"], g, 0.04)
    bm = newbm()
    for key in ("c_pp", "c_mp", "c_mm", "c_pm"):
        piping_along(bm, T.vline(T.marks[key], 0.006, bh - 0.002, 0.0, 22), 0.0036, False, Vector((1, 0, 0)))
    finish("IB_CornerPiping", bm, M["black"], g, 0.04)
    for key in ("c_pp", "c_mp", "c_mm", "c_pm"):
        for dI in (-3, 3):
            bm = newbm(); add_stitch(bm, T.vline(T.marks[key] + dI, 0.010, bh - 0.010, 0.0006, 24))
            finish("IB_Stitch_%s_%d" % (key, dI), bm, M["st_black"], g, uv=False, flat=True)
    # dividers around the rack zone (A8/A10) with mesh upper panels
    zone_x0, zone_x1 = -0.145, 0.066
    zone_y0, zone_y1 = BOX_Y_FRONT + 0.022, BOX_Y_BACK - 0.040
    zd = BOX_Z0 + t + 0.002
    bm = newbm()
    add_box_range(bm, zone_x0 - 0.004, zone_x1 + 0.004, zone_y1, zone_y1 + 0.003, zd, zd + 0.095, 0.0012)
    add_box_range(bm, zone_x1, zone_x1 + 0.003, zone_y0, BOX_Y_BACK - t - 0.004, zd, zd + 0.095, 0.0012)
    add_box_range(bm, zone_x0 - 0.003, zone_x0, zone_y0 + 0.02, zone_y1, zd, zd + 0.085, 0.0012)
    finish("IB_Dividers_Black", bm, M["black"], g, 0.03, conf="provisional", note="Divider layout inferred from A8/A10")
    bm = newbm(); uv = bm.loops.layers.uv.verify()
    def mesh_quad(p0, p1, p2, p3, ucount, vcount):
        f = bm.faces.new([bm.verts.new(p) for p in (p0, p1, p2, p3)])
        for l, (u, v) in zip(f.loops, [(0, 0), (ucount, 0), (ucount, vcount), (0, vcount)]): l[uv].uv = (u, v)
    mesh_quad((zone_x0, zone_y1 + 0.0045, zd + 0.095), (zone_x1, zone_y1 + 0.0045, zd + 0.095), (zone_x1, zone_y1 + 0.0045, zd + 0.145), (zone_x0, zone_y1 + 0.0045, zd + 0.145), 10, 3)
    mesh_quad((zone_x1 + 0.0045, zone_y0, zd + 0.095), (zone_x1 + 0.0045, zone_y1, zd + 0.095), (zone_x1 + 0.0045, zone_y1, zd + 0.145), (zone_x1 + 0.0045, zone_y0, zd + 0.145), 10, 3)
    finish("IB_DividerMesh", bm, M["mesh"], g, uv=False, flat=True, conf="provisional")
    # handle tab + velcro patch on the front, badge
    yf = BOX_Y_FRONT - 0.0025 - 0.004
    bm = newbm()
    add_loft(bm, [(0, yf - 0.002 + 0.0, bh + BOX_Z0 - 0.004 - 0.045 * i / 8) for i in range(9)], 0.028, 0.0040, (1, 0, 0), power=5, nprof=10)
    finish("IB_FrontHandleTab", bm, M["webbing"], g, 0.03)
    bm = newbm()
    add_box_range(bm, -0.012, 0.012, yf - 0.0035, yf + 0.0005, BOX_Z0 + bh - 0.095, BOX_Z0 + bh - 0.060, 0.001)
    finish("IB_VelcroPatch", bm, M["velcro"], g, 0.02)
    bm = newbm(); bx, bz = 0.104, BOX_Z0 + 0.043
    add_box(bm, (bx, yf + 0.0008, bz), (0.054, 0.0026, 0.034), 0.0010, 2)
    finish("IB_BadgeBase", bm, M["red"], g, 0.02)
    bm = newbm(); add_plane(bm, (bx, yf - 0.0007, bz), (1, 0, 0), (0, 0, 1), 0.052, 0.0325)
    finish("IB_Badge", bm, M["badge"], g, uv=False, flat=True, note="Brand text intentionally omitted")
    # lid zipper track + double slider at front centre (B2)
    ring = T.ring_path(bh + 0.0006, 0, None, -0.004)
    sel = [(p, Vector((0, 0, 1))) for p, n in ring if p.y < BOX_Y_BACK - 0.03]
    sel.sort(key=lambda q: math.atan2(-(q[0].y - cy), q[0].x))
    bm = newbm(); add_zip_poly(bm, sel, 0.010, 0.0056)
    for dx in (-0.012, 0.012): add_slider(bm, (dx, BOX_Y_FRONT + 0.012, BOX_Z1 + 0.0008), (1, 0, 0), (0, 0, 1), (0, -1, 0), 0.018)
    finish("Zipper_InnerBoxLid", bm, M["zip"], g, uv=False, flat=True)
    if P["INCLUDE_BAY_ITEM"]:
        bm = newbm(); add_box_range(bm, 0.082, 0.150, BOX_Y_BACK - 0.115, BOX_Y_BACK - 0.020, zd, zd + 0.062, 0.013, 3)
        finish("PROV_UnidentifiedBayItem", bm, M["pouch"], g, 0.04, conf="unknown", note="Grey soft item with cable seen in the right bay (A8/A10). Identity unknown.")
        bm = newbm(); pts = [Vector(p) for p in ((0.114, BOX_Y_BACK - 0.022, zd + 0.060), (0.120, BOX_Y_BACK - 0.050, zd + 0.088),
              (0.124, cy - 0.01, zd + 0.082), (0.110, cy - 0.055, zd + 0.045), (0.108, cy - 0.060, zd + 0.008))]
        add_pipe(bm, pts, 0.0024, False, 8)
        finish("PROV_Cable", bm, M["cable"], g, 0.03, conf="unknown", note="Cable route is a guess.")

def build_inner_box_lid(g, M, S):
    bw, bd = P["BOX_W"], P["BOX_D"]; cy = (BOX_Y_FRONT + BOX_Y_BACK) / 2; lt = P["BOX_LID_T"]
    T = Tube(Fz((0, cy, BOX_Z1 + 0.0008)), bw / 2, bd / 2, 0.018, lt, rt0=0.007, rt1=0.007, bulge=0.003, wr=0.0012, seed=21,
             closed0=True, closed1=True, step=0.010, nr=5)
    z_split = BOX_Z1 + 0.0008 + lt * 0.5              # silver underside / black top meet under the rim binding
    bm = newbm(); T.build(bm, lambda c, n: 1 if c.z < z_split else 0)
    finish("IBL_Pad", bm, [M["black"], M["silver"]], g, 0.05)
    bm = newbm(); piping_along(bm, T.ring_path(lt * 0.5, 0, None, 0.0015, True), 0.0042, True)
    finish("IBL_RimBinding", bm, M["black"], g, 0.04)
    bm = newbm(); add_stitch(bm, T.ring_path(lt - 0.0045, 0, None, 0.0006, True)); finish("IBL_Stitch", bm, M["st_black"], g, uv=False, flat=True)

def build_rack(g, M, S):
    """White perforated rack (WA0028): 12 columns, 3 front rows + a solid bar + 4 back rows, raised +X end wall."""
    cols, rows, nf = P["RACK_COLS"], P["RACK_ROWS"], P["RACK_FRONT_ROWS"]; rw, rd, rt = P["RACK_W"], P["RACK_D"], P["RACK_T"]
    nrow = rows + 1                                       # one solid row between the two hole blocks
    px, py = rw / cols, rd / nrow; r = min(px, py) * P["RACK_HOLE_FR"] / 2; N = 16   # multiple of 8: the 45 deg directions hit the cell corners
    bm = newbm(); cx0, cy0 = g.location.x - rw / 2, g.location.y - rd / 2; z = g.location.z + rt / 2
    for i in range(cols):
        for j in range(nrow):
            cx = cx0 + (i + .5) * px; cy = cy0 + (j + .5) * py; outer = []; inner = []
            for k in range(N):
                a = 2 * math.pi * k / N; ca, sa = math.cos(a), math.sin(a); sc = 1.0 / max(abs(ca), abs(sa))
                outer.append(bm.verts.new((cx + ca * sc * px / 2, cy + sa * sc * py / 2, z)))
                if j != nf: inner.append(bm.verts.new((cx + r * ca, cy + r * sa, z)))
            if j == nf:
                bm.faces.new(outer)                          # solid bar cell
            else:
                for k in range(N):
                    k2 = (k + 1) % N; bm.faces.new((inner[k], outer[k], outer[k2], inner[k2]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bm.normal_update(); bm.faces.ensure_lookup_table()
    for f in bm.faces:
        if f.normal.z < 0: f.normal_flip()
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=-rt); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    add_box_range(bm, cx0 + rw - 0.004, cx0 + rw, cy0, cy0 + rd, z - rt, z + P["RACK_WALL_H"], 0.0012)
    finish("RACK_Plate_White", bm, M["white"], g, uv=False, flat=False, conf="photo", sharp=50,
           note="Grid %d x (%d + %d) holes counted in WA0028; hole size approximate" % (cols, nf, rows - nf))

def build_straps(g, M, S):
    yb = Y_BACK
    T = Tube(Fy_front((0, yb, (Z_U1 - 0.004) / 2)), XH - 0.002, (Z_U1 - 0.004) / 2, 0.020, 0.024, rt0=0.009, rt1=0.009, bulge=0.004, wr=0.0013, seed=27,
             closed0=True, closed1=True, step=0.014, cnt=(16, 12, 5), nr=5)
    bm = newbm(); T.build(bm, None)
    finish("BK_Panel_Black", bm, M["black"], g, 0.05)
    # padded red roll along the top of the back (A2)
    bm = newbm(); roll = [Vector((-XH + 0.012 + (2 * XH - 0.024) * i / 30, yb + 0.006, Z_U1 + 0.004)) for i in range(31)]
    add_loft(bm, roll, 0.046, 0.044, (0, 0, 1), power=2.6, nprof=16)
    finish("BK_TopRoll_Red", bm, M["red"], g, 0.05, note="Padded red top edge (A2)")
    # shoulder straps: thick padded, flaring, stitched borders
    sw, st = P["STRAP_W"], P["STRAP_T"]; ys = yb + 0.024 + st / 2 - 0.004
    x0s, x1s, w1 = P["STRAP_X0"], P["STRAP_X1"], P["STRAP_W_END"]
    strap_x = lambda t: x0s + (x1s - x0s) * t * t                       # centres +-0.066 m under the top roll (WA0015)
    strap_w = lambda t: sw + (w1 - sw) * t                              # wide padded top tapering toward the buckles
    for sx in (-1, 1):
        pts, wid = [], []
        for i in range(25):
            t = i / 24; z = (Z_U1 - 0.020) + (0.055 - (Z_U1 - 0.020)) * t
            pts.append((sx * strap_x(t), ys + 0.006 * math.sin(math.pi * t), z)); wid.append(strap_w(t))
        bm = newbm(); add_loft(bm, pts, sw, st, (1, 0, 0), widths=wid, power=3.0, nprof=16)
        finish("BK_ShoulderStrap_%s" % ("R" if sx > 0 else "L"), bm, M["red"], g, 0.04, conf="photo", note="Strap curve/spacing simplified from A2")
        for off in (-0.5, 0.5):
            path = []
            for i in range(25):
                t = i / 24; z = (Z_U1 - 0.020) + (0.055 - (Z_U1 - 0.020)) * t
                x = sx * strap_x(t) + off * (strap_w(t) - 0.016)
                path.append((Vector((x, ys + 0.006 * math.sin(math.pi * t) + st / 2 * 0.98, z)), Vector((0, 1, 0))))
            bm = newbm(); add_stitch(bm, path, 0.0040, 0.0003); finish("BK_StrapStitch_%s_%d" % ("R" if sx > 0 else "L", off > 0), bm, M["st_red"], g, uv=False, flat=True)
        # adjuster buckle + webbing tail tucked on the panel
        bm = newbm(); xc = sx * (x1s + 0.012); zc = 0.040
        for dz, sz in ((-0.0105, 0.0028), (0.0105, 0.0028)): add_box(bm, (xc, ys + st / 2 + 0.003, zc + dz), (0.046, 0.006, sz), 0.0010)
        for dx in (-0.0215, 0.0215): add_box(bm, (xc + dx, ys + st / 2 + 0.003, zc), (0.0028, 0.006, 0.024), 0.0010)
        add_box(bm, (xc, ys + st / 2 + 0.0035, zc), (0.040, 0.004, 0.0030), 0.0008)
        finish("BK_Buckle_%s" % ("R" if sx > 0 else "L"), bm, M["plastic"], g, 0.02, conf="provisional")
        bm = newbm(); tail = [(xc + (sx * 0.075) * (i / 14), ys + st / 2 + 0.0022 - 0.012 * (i / 14) ** 2, zc - 0.006 - 0.012 * (i / 14)) for i in range(15)]
        add_loft(bm, tail, 0.026, 0.0035, (0, 0, 1), power=6, nprof=8)
        finish("BK_WebbingTail_%s" % ("R" if sx > 0 else "L"), bm, M["webbing"], g, 0.03, conf="provisional", note="Tails hang loose in A2; tucked here to keep the bbox clean")
    # side zipper on the viewer-left (bag +X) back edge with pulls (A2)
    zx = XH - 0.020; zp = [(Vector((zx, yb + 0.0268, 0.060 + (Z_U1 - 0.075) * i / 30)), Vector((0, 1, 0))) for i in range(31)]
    bm = newbm(); add_zip_poly(bm, zp, 0.010, 0.0056)
    add_slider(bm, (zx, yb + 0.030, Z_U1 - 0.018), (0, 0, 1), (0, 1, 0), (0, 0, -1), 0.020)
    add_slider(bm, (zx, yb + 0.030, 0.215), (0, 0, 1), (0, 1, 0), (0, 0, -1), 0.020)
    finish("Zipper_BackSide", bm, M["zip"], g, uv=False, flat=True, conf="provisional", note="Routing inferred from A2")
    bm = newbm(); add_plane(bm, (XH - 0.034, yb + 0.0272, Z_U1 - 0.060), (-1, 0, 0), (0, 0, 1), 0.022, 0.022)
    finish("BK_Emblem_RedCross", bm, M["emblem"], g, uv=False, flat=True)
    # the backs of the two compartments read as separate padded panels with a seam between them (WA0015)
    bm = newbm()
    piping_along(bm, [(Vector((-XH + 0.006 + (2 * XH - 0.012) * i / 30, yb + 0.0258, Z_U0)), 0) for i in range(31)], 0.0052, False, Vector((0, 1, 0)))
    finish("BK_CompartmentSeam", bm, M["black"], g, 0.04, conf="photo")

# ======================================================================================
# 6. ASSEMBLY
# ======================================================================================
def build_all():
    global ROOT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for b_ in list(coll): coll.remove(b_)
    MATS.clear()
    M = build_materials()
    ROOT = bpy.data.objects.new("INFINOS_Product", None); bpy.context.collection.objects.link(ROOT)
    plate_z = Z_U0 + P["DISPLAY_Z_FRAC"] * H_U; yU = (Y_UF + Y_BACK) / 2
    pivots = {
        "INFINOS_Flap": (0, Y_BACK - 0.008, Z_FLAP_TOP),
        "INFINOS_UpperLid": (0, Y_BACK - 0.010, LID_Z0 + P["LID_T"] / 2),
        "INFINOS_UpperBody": (0, yU, (Z_U0 + Z_U1) / 2),
        "INFINOS_Display": (P["DISPLAY_SIDE"] * XH, yU, plate_z),
        "INFINOS_LowerShell": (0, (Y_LF + Y_BACK) / 2, H_L / 2),
        "INFINOS_DropPanel": (0, Y_LF + 0.013, WALL + 0.002),
        "INFINOS_InnerBox": (0, (BOX_Y_FRONT + BOX_Y_BACK) / 2, (BOX_Z0 + BOX_Z1) / 2),
        "INFINOS_InnerBoxLid": (0, BOX_Y_BACK - 0.005, BOX_Z1 + 0.0118),
        "INFINOS_Rack": (-0.040, (BOX_Y_FRONT + 0.022 + BOX_Y_BACK - 0.040) / 2, BOX_Z0 + 0.006 + 0.0035),
        "INFINOS_Straps": (0, Y_BACK + 0.016, Z_U1 / 2),
    }
    G = {k: make_group(k, v) for k, v in pivots.items()}
    S = {}
    build_upper_body(G["INFINOS_UpperBody"], M, S)
    build_lower_shell(G["INFINOS_LowerShell"], M, S)
    build_drop_panel(G["INFINOS_DropPanel"], M, S)
    build_upper_lid(G["INFINOS_UpperLid"], M, S)
    build_flap(G["INFINOS_Flap"], M, S)
    build_display(G["INFINOS_Display"], M, S)
    build_inner_box(G["INFINOS_InnerBox"], M, S)
    build_inner_box_lid(G["INFINOS_InnerBoxLid"], M, S)
    build_rack(G["INFINOS_Rack"], M, S)
    build_straps(G["INFINOS_Straps"], M, S)
    return G

def object_tris():
    return {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH"}

def bounds_and_tris():
    bpy.context.view_layer.update()
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3); tris = 0
    for o in bpy.data.objects:
        if o.type != "MESH": continue
        tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mn = Vector((min(mn[i], w[i]) for i in range(3))); mx = Vector((max(mx[i], w[i]) for i in range(3)))
    return mn, mx, tris

# Real-time crevice shading.  three.js has no ambient occlusion by default, so the soft studio light flattened the
# quilting and seams that read clearly in the photographs.  AO is baked per component (each layer alone, so a part is
# never darkened by a neighbour it only touches while closed - e.g. the orange flap underside resting on the lid) into
# an 'AO' colour attribute that is exported as COLOR_0.  Decals, stitches and meshes are excluded as occluders.
DECAL_HINTS = ("Biohazard", "Emblem", "Sticker", "Badge", "Stitch", "Screen", "MeshPocket", "DividerMesh", "Tag_")

def bake_vertex_ao(G, distance=0.018, samples=48, strength=0.72):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = samples
    if scene.world is None: scene.world = bpy.data.worlds.new("bake")
    scene.world.light_settings.distance = distance
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    is_decal = lambda o: any(h in o.name for h in DECAL_HINTS)
    for grp in G.values():
        targets = [o for o in meshes if o.parent == grp and not is_decal(o)]
        if not targets: continue
        for o in meshes: o.hide_render = o not in targets
        bpy.ops.object.select_all(action="DESELECT")
        for o in targets:
            o.data.color_attributes.active_color = o.data.color_attributes.new("AO", "FLOAT_COLOR", "POINT")
            o.select_set(True)
        bpy.context.view_layer.objects.active = targets[0]
        bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
        for o in targets:                                  # keep it a gentle crevice term, never a dirty smudge
            a = o.data.color_attributes["AO"]; buf = np.empty(len(a.data) * 4, np.float32); a.data.foreach_get("color", buf)
            ao = 1.0 - strength * (1.0 - np.clip(buf[0::4], 0, 1))
            buf[0::4] = buf[1::4] = buf[2::4] = ao; buf[3::4] = 1.0; a.data.foreach_set("color", buf)
    for o in meshes: o.hide_render = False
    print("baked vertex AO into %d objects" % sum(1 for o in meshes if "AO" in o.data.color_attributes))

def to_three(p): return (p[0], p[2], -p[1])

def write_ts(path, G):
    L = ["// AUTO-GENERATED by build_infinos_bag.py (v0.3) - model-space metres; the site multiplies by the root auto-scale",
         "// Layer geometry is PROVISIONAL until validated against measurements.", "export const MODEL_COMPONENTS: ProductComponentSpec[] = ["]
    for i, d in enumerate(LAYERS):
        base = to_three(G[d["node"]].location)
        rot = ", rotate: [%s]" % ", ".join("%g" % r for r in d["rot"]) if d["rot"] else ""
        L += ["  {", "    id: '%s'," % d["id"], "    nodeName: '%s'," % d["node"], "    label: '%s'," % d["label"], "    role: '%s'," % d["role"],
              "    placeholder: true,   // provisional replica - names/roles from photos, unverified", "    priority: %d," % (i + 1),
              "    basePosition: [%.4f, %.4f, %.4f]," % base,
              "    explode: { dir: [%s], distance: %g%s }," % (", ".join("%g" % x for x in d["dir"]), d["dist"], rot)]
        if d.get("open"):
            parts = []
            for stage, rx, tr in d["open"]:
                f = ["stage: '%s'" % stage]
                if rx is not None: f.append("rotate: [%g, 0, 0]" % rx)
                if tr is not None: f.append("translate: [%s]" % ", ".join("%g" % v for v in tr))
                parts.append("{ %s }" % ", ".join(f))
            L.append("    open: [%s]," % ", ".join(parts))
        if d.get("meta"): L.append("    metadata: { %s }," % ", ".join("%s: '%s'" % kv for kv in d["meta"].items()))
        L += ["    labelSide: '%s'," % d["side"], "  },"]
    L.append("]")
    open(path, "w").write("\n".join(L) + "\n")

# ======================================================================================
# 7. PHOTOGRAPHIC PREVIEWS (Cycles)
# ======================================================================================
def apply_pose(G, pose):
    for d in LAYERS:
        o = G[d["node"]]; o.location = Vector(o["rest_loc"]); o.rotation_euler = (0, 0, 0)
    if pose == "closed": return
    if pose in ("open", "boxout"):
        amounts = dict(flap=1, lid=1, drop=1, boxOut=1 if pose == "boxout" else 0, boxLid=1 if pose == "boxout" else 0)
        apply_stage_pose(G, amounts)
        return
    for d in LAYERS:
        o = G[d["node"]]
        v = Vector((d["dir"][0], -d["dir"][2], d["dir"][1]))
        o.location = Vector(o["rest_loc"]) + v * d["dist"]
        if d["rot"]: o.rotation_euler = (d["rot"][0], 0, 0)

def apply_stage_pose(G, amounts):
    """Same rigid-body pose as the website (src/motion/pose.ts): stage amounts 0..1 drive rotations/translations."""
    for d in LAYERS:
        o = G[d["node"]]; rest = Vector(o["rest_loc"]); rx = 0.0; t = Vector((0, 0, 0))
        for stage, srx, tr in d.get("open", []):
            a = amounts.get(stage, 0.0)
            if srx is not None: rx += srx * a
            if tr is not None: t += Vector((tr[0], -tr[2], tr[1])) * a      # three.js (x, y, z) -> Blender (x, -z, y)
        o.location = rest + t; o.rotation_euler = (rx, 0, 0)

def studio(scene, samples, res, quick=False):
    scene.render.engine = "CYCLES"; scene.cycles.samples = samples; scene.cycles.device = "CPU"
    scene.cycles.use_denoising = False          # this Blender build has no OpenImageDenoise; use samples + clamping instead
    try: scene.cycles.sample_clamp_indirect = 8.0; scene.cycles.sample_clamp_direct = 20.0; scene.cycles.use_adaptive_sampling = True
    except Exception: pass
    scene.cycles.max_bounces = 6 if not quick else 3
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"
    try: scene.view_settings.look = "Filmic - Medium Contrast"
    except Exception: pass
    scene.view_settings.exposure = -0.55
    w = bpy.data.worlds.new("studio"); w.use_nodes = True; nt = w.node_tree
    bg = nt.nodes["Background"]; bg.inputs[0].default_value = (0.045, 0.047, 0.052, 1); bg.inputs[1].default_value = 1.0
    scene.world = w
    # seamless backdrop sweep (matte grey, slight roughness) + floor
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -0.0003)); fl = bpy.context.object
    fm = bpy.data.materials.new("floor"); fm.use_nodes = True; fb = fm.node_tree.nodes["Principled BSDF"]
    fb.inputs["Base Color"].default_value = srgb(70, 71, 75); fb.inputs["Roughness"].default_value = 0.55; fl.data.materials.append(fm)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 1.6, 0), rotation=(math.pi / 2, 0, 0)); wl = bpy.context.object
    wl.data.materials.append(fm)
    def area(name, loc, target, size, power, color=(1, 1, 1)):
        l = bpy.data.lights.new(name, "AREA"); l.shape = "RECTANGLE"; l.size, l.size_y = size; l.energy = power; l.color = color
        o = bpy.data.objects.new(name, l); bpy.context.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    area("key", (-1.5, -1.9, 1.7), (0, 0, 0.25), (1.8, 1.3), 330, (1.0, 0.96, 0.92))
    area("fill", (1.9, -1.6, 0.9), (0, 0, 0.25), (2.2, 1.4), 90, (0.92, 0.95, 1.0))
    area("rim", (0.5, 1.6, 1.4), (0, 0, 0.3), (1.6, 0.6), 300, (1.0, 1.0, 1.0))
    area("top", (0, 0, 2.3), (0, 0, 0), (1.6, 1.6), 90)

ONLY = None
def photo(scene, name, outdir, cam, loc, target, lens, fstop=5.6, focus=None):
    if ONLY and name not in ONLY: return
    cam.location = loc; cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens; cam.data.sensor_width = 36
    cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = fstop
    cam.data.dof.focus_distance = focus if focus else (Vector(target) - Vector(loc)).length
    scene.render.filepath = os.path.join(outdir, name + ".png"); scene.camera = cam
    bpy.ops.render.render(write_still=True)

def render_previews(outdir, G, samples, quick):
    os.makedirs(outdir, exist_ok=True); scene = bpy.context.scene
    for o in G.values(): o["rest_loc"] = list(o.location)
    res = (900, 1125) if quick else (1400, 1750)
    studio(scene, samples, res, quick)
    cd = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cd); bpy.context.collection.objects.link(cam)
    tgt = (0, 0, 0.255)
    apply_pose(G, "closed")
    photo(scene, "hero_closed", outdir, cam, (-0.95, -1.55, 0.55), tgt, 85)
    photo(scene, "front_closed", outdir, cam, (0.0, -1.9, 0.40), tgt, 85)
    photo(scene, "side_display", outdir, cam, (1.85, -0.12, 0.34), tgt, 85)
    photo(scene, "back_closed", outdir, cam, (0.0, 1.9, 0.42), tgt, 85)
    photo(scene, "detail_flap", outdir, cam, (-0.35, -0.75, 0.62), (0, -0.14, 0.43), 100, 4.0)
    photo(scene, "detail_display", outdir, cam, (0.80, -0.10, 0.33), (0.21, 0.0, 0.31), 100, 4.0)
    apply_pose(G, "open")
    photo(scene, "hero_open", outdir, cam, (-1.25, -2.15, 0.85), (0, -0.10, 0.34), 70)
    photo(scene, "open_front", outdir, cam, (0.0, -2.5, 0.75), (0, -0.05, 0.30), 70)
    apply_pose(G, "boxout")
    photo(scene, "box_interior", outdir, cam, (0.55, -1.75, 0.95), (0, -0.30, 0.20), 70, 8.0)
    apply_pose(G, "exploded")
    photo(scene, "exploded", outdir, cam, (0.9, -3.9, 1.25), (0, -0.05, 0.52), 62, 8.0)
    apply_pose(G, "closed")

# ======================================================================================
# 8. MAIN
# ======================================================================================
def main():
    o = parse_args(); G = build_all()
    if o["ao"] and o["export"]: bake_vertex_ao(G)
    mn, mx, tris = bounds_and_tris(); size = mx - mn
    ROOT.location = -Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z)); bpy.context.view_layer.update()
    print("== INFINOS model v0.3: %d triangles, bbox W%.3f x D%.3f x H%.3f m ==" % (tris, size.x, size.y, size.z))
    out = o["out"]; outdir = os.path.dirname(os.path.abspath(out)); os.makedirs(outdir, exist_ok=True)
    write_ts(os.path.join(outdir, "t1_components.generated.ts"), G)
    heavy = sorted(object_tris().items(), key=lambda kv: -kv[1])[:25]
    rep = dict(version="0.3-photo-validated", triangles=tris, bbox_m=dict(width=round(size.x, 4), depth=round(size.y, 4), height=round(size.z, 4)),
               bbox_min_blender=[round(v, 5) for v in mn], bbox_max_blender=[round(v, 5) for v in mx], heaviest_objects=heavy,
               params={k: (list(v) if isinstance(v, tuple) else v) for k, v in P.items()}, nodes=[d["node"] for d in LAYERS],
               warning="Photo-validated replica. Absolute scale, internal construction, zipper routing and bay contents remain UNVERIFIED.")
    json.dump(rep, open(os.path.join(outdir, "t1_model_report.json"), "w"), indent=2)
    if o["export"]:
        bpy.ops.object.select_all(action="DESELECT")
        for ob in bpy.data.objects: ob.select_set(True)
        kw = dict(filepath=out, export_format="GLB", export_yup=True, export_apply=False, export_texcoords=True, export_normals=True,
                  export_materials="EXPORT", export_cameras=False, export_lights=False, use_selection=True, export_extras=True,
                  export_image_format="AUTO", export_vertex_color="NAME", export_vertex_color_name="AO")
        bpy.ops.export_scene.gltf(**kw)
        print("exported", out, "(%.2f MB)" % (os.path.getsize(out) / 1e6))
    global ONLY; ONLY = o["only"]
    if o["preview"]: render_previews(o["preview"], G, o["samples"], o["quick"])

if __name__ == "__main__":      # tools/render_sequences.py executes this file as a module
    main()
