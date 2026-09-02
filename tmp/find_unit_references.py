from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path

from pypdf import PdfReader


root = Path(sys.argv[1])
pattern = re.compile(r"ITO\s*[-_ ]?(4133|5047|5216)", re.IGNORECASE)
text_extensions = {".txt", ".md", ".csv", ".tsv", ".json", ".html", ".xml", ".py", ".mzn", ".dzn", ".arff", ".dne"}
zip_extensions = {".docx", ".xlsx", ".pptx", ".epub", ".zip"}


def read_candidate(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return " ".join((page.extract_text() or "") for page in PdfReader(path).pages[:6])
    if suffix in zip_extensions:
        parts = []
        with zipfile.ZipFile(path) as archive:
            parts.extend(item.filename for item in archive.infolist())
            for item in archive.infolist():
                if item.is_dir() or item.file_size > 2_000_000:
                    continue
                if Path(item.filename).suffix.lower() not in text_extensions | {".rels"}:
                    continue
                parts.append(archive.read(item).decode("utf-8", errors="ignore"))
        return " ".join(parts)
    if suffix in text_extensions and path.stat().st_size < 10_000_000:
        return path.read_text(encoding="utf-8", errors="ignore")
    return ""


for path in sorted(root.iterdir()):
    if not path.is_file():
        continue
    try:
        text = f"{path.name} {read_candidate(path)}"
    except Exception:
        continue
    units = sorted({f"ITO{match.group(1)}" for match in pattern.finditer(text)})
    if units:
        print(f"{','.join(units)}\t{path.name}")
