"""
Encode rendered sequence frames for the web:  python3 tools/encode_sequences.py [--src tools/build/frames] [--quality 80] [--partial] [--seq reveal]

  tools/build/frames/<seq>/NNNN.png  ->  public/sequences/<seq>/desktop/NNNN.webp  (film width x height)
                                          public/sequences/<seq>/mobile/NNNN.webp   (mobileWidth x mobileHeight)

Frames keep their alpha channel (transparent film + shadow catcher), so the website composites them over the same CSS
studio backdrop as the live 3D canvas. Sizes come from src/content/sequences.json.
"""
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def main():
    src = arg("--src", os.path.join(HERE, "build", "frames"))
    quality = int(arg("--quality", "80"))
    partial = "--partial" in sys.argv          # preview: encode whatever frames exist (the site falls back to the nearest frame)
    data = json.load(open(os.path.join(REPO, "src", "content", "sequences.json")))
    film = data["film"]
    only = arg("--seq", None)
    for sid, seq in data["sequences"].items():
        if only and sid not in only.split(","):
            continue
        rs = dict(film); rs.update(seq.get("render", {}))      # per-sequence sizes (the reveal is 2560 x 1600)
        sizes = {"desktop": (rs["width"], rs["height"]), "mobile": (rs["mobileWidth"], rs["mobileHeight"])}
        missing = [i for i in range(seq["frames"]) if not os.path.exists(os.path.join(src, sid, "%04d.png" % i))]
        if missing and not (partial and len(missing) < seq["frames"]):
            print("%s: %d frame(s) missing (first %d) - skipped" % (sid, len(missing), missing[0]))
            continue
        total = {}
        for variant, size in sizes.items():
            out = os.path.join(REPO, "public", seq["dir"].lstrip("/"), variant)
            os.makedirs(out, exist_ok=True)
            total[variant] = 0
            for i in range(seq["frames"]):
                if i in missing: continue
                im = Image.open(os.path.join(src, sid, "%04d.png" % i)).convert("RGBA")
                if im.size != size:
                    im = im.resize(size, Image.LANCZOS)
                path = os.path.join(out, "%04d.webp" % i)
                im.save(path, "WEBP", quality=quality, method=6, alpha_quality=90)
                total[variant] += os.path.getsize(path)
        print("%s: %d frames  desktop %.1f MB  mobile %.1f MB" % (sid, seq["frames"], total["desktop"] / 1e6, total["mobile"] / 1e6))


if __name__ == "__main__":
    main()
