from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


output = Path(sys.argv[1])
paths = [Path(item) for item in sys.argv[2:]]
columns = 3
cell_width = 420
cell_height = 310
label_height = 44
rows = math.ceil(len(paths) / columns)
sheet = Image.new("RGB", (columns * cell_width, rows * (cell_height + label_height)), "white")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default(size=16)

for index, path in enumerate(paths):
    with Image.open(path) as source:
        image = source.convert("RGB")
        image.thumbnail((cell_width - 16, cell_height - 16))
    column = index % columns
    row = index // columns
    x = column * cell_width + (cell_width - image.width) // 2
    y = row * (cell_height + label_height) + (cell_height - image.height) // 2
    sheet.paste(image, (x, y))
    draw.text(
        (column * cell_width + 8, row * (cell_height + label_height) + cell_height + 4),
        path.name[:52],
        fill="black",
        font=font,
    )

output.parent.mkdir(parents=True, exist_ok=True)
sheet.save(output)
