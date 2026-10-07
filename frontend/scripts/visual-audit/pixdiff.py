"""Compares <name>-rest.png and <name>-hover.png pairs: bounding box of changed pixels and dominant colour change.

    python scripts/visual-audit/pixdiff.py <dir> [prefix]
"""
import collections
import glob
import os
import sys

from PIL import Image, ImageChops

folder = sys.argv[1]
prefix = sys.argv[2] if len(sys.argv) > 2 else ""
for rest in sorted(glob.glob(os.path.join(folder, f"{prefix}*-rest.png"))):
    hover = rest.replace("-rest.png", "-hover.png")
    if not os.path.exists(hover):
        continue
    a = Image.open(rest).convert("RGB")
    b = Image.open(hover).convert("RGB")
    if a.size != b.size:
        print(os.path.basename(rest), "size mismatch", a.size, b.size)
        continue
    diff = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > 3 else 0)
    box = diff.getbbox()
    name = os.path.basename(rest).replace("-rest.png", "")
    if not box:
        print(f"{name:16} no visible change  size={a.size}")
        continue
    pairs = collections.Counter()
    pa, pb, pd = a.load(), b.load(), diff.load()
    for y in range(box[1], box[3]):
        for x in range(box[0], box[2]):
            if pd[x, y]:
                pairs[(pa[x, y], pb[x, y])] += 1
    top = pairs.most_common(2)
    changed = sum(pairs.values())
    print(f"{name:16} changed bbox={box} px={changed} size={a.size}  top: " + "; ".join(f"{p[0][0]}->{p[0][1]} x{p[1]}" for p in top))
