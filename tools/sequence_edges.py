"""
Measure the film edges of the encoded sequence frames:  python3 tools/sequence_edges.py

  public/sequences/<seq>/desktop/NNNN.webp  ->  src/content/sequenceEdges.json

For every frame, the highest alpha in the outermost 3 px of each edge (top, bottom, left, right). The frames carry the
shadow catcher's shadow on a transparent film, and on the lit studio floor a shadow that reaches the film edge would end
in a visible line wherever that edge is on screen. ImageSequence continues such a shadow past the edge — but only where
the edge holds shadow alone: an edge the product itself touches (alpha near 1, e.g. the pinned top of the open sequence)
is never stretched. The mobile frames are the same renders scaled down, so one table serves both sets.
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)


def main():
    data = json.load(open(os.path.join(REPO, "src", "content", "sequences.json")))
    out = {}
    for sid, seq in data["sequences"].items():
        rows = []
        for i in range(seq["frames"]):
            im = Image.open(os.path.join(REPO, "public", "sequences", sid, "desktop", f"{i:04d}.webp")).convert("RGBA")
            a = im.getchannel("A")
            w, h = a.size
            edge = lambda box: round(a.crop(box).getextrema()[1] / 255, 2)
            rows.append([edge((0, 0, w, 3)), edge((0, h - 3, w, h)), edge((0, 0, 3, h)), edge((w - 3, 0, w, h))])
        out[sid] = rows
    path = os.path.join(REPO, "src", "content", "sequenceEdges.json")
    with open(path, "w") as f:
        f.write('{\n  "_": "max alpha at each film edge per frame: [top, bottom, left, right] (tools/sequence_edges.py)",\n')
        f.write(",\n".join(f'  "{sid}": [' + ", ".join(json.dumps(r) for r in rows) + "]" for sid, rows in out.items()))
        f.write("\n}\n")
    print(path, {sid: len(rows) for sid, rows in out.items()})


if __name__ == "__main__":
    main()
