from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(sys.argv[1])
TERMS = re.compile(
    r"monash|ito\s*[-_ ]?(?:4133|5047|5216|5126|5407)|"
    r"introduction\s+to\s+python|fundamentals\s+of\s+artificial\s+intelligence|"
    r"discrete\s+optimi[sz]ation|minizinc|37297228",
    re.IGNORECASE,
)
NAME_HINTS = re.compile(
    r"monash|ito\s*[-_ ]?(?:4133|5047|5216|5126|5407)|assessment|module|"
    r"python|artificial|optimi[sz]|minizinc|powergen|retailroster|pipe.?routing|"
    r"cryptarithm|weka|\.arff$|\.dne$|\babs\b|h_zero|h_sld",
    re.IGNORECASE,
)
TEXT_EXTENSIONS = {
    ".txt", ".md", ".csv", ".tsv", ".json", ".html", ".htm", ".xml",
    ".py", ".mzn", ".dzn", ".arff", ".dne", ".sql",
}
ZIP_EXTENSIONS = {".docx", ".xlsx", ".pptx", ".epub", ".zip"}


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def read_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    parts = []
    for page in reader.pages[:30]:
        parts.append(page.extract_text() or "")
    return " ".join(parts)


def read_zip_text(path: Path) -> str:
    parts: list[str] = []
    with zipfile.ZipFile(path) as archive:
        parts.extend(item.filename for item in archive.infolist())
        for item in archive.infolist():
            suffix = Path(item.filename).suffix.lower()
            if item.is_dir() or item.file_size > 2_000_000:
                continue
            if suffix not in TEXT_EXTENSIONS and suffix not in {".rels"}:
                continue
            try:
                data = archive.read(item)
                parts.append(data.decode("utf-8", errors="ignore"))
            except Exception:
                continue
    return " ".join(parts)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def inspect(path: Path) -> dict[str, object] | None:
    name_match = bool(NAME_HINTS.search(path.name))
    text = ""
    error = None
    try:
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            text = read_pdf(path)
        elif suffix in ZIP_EXTENSIONS:
            text = read_zip_text(path)
        elif suffix in TEXT_EXTENSIONS and path.stat().st_size <= 10_000_000:
            text = read_text(path)
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"

    searchable = clean_text(f"{path.name} {text}")
    matches = sorted({m.group(0) for m in TERMS.finditer(searchable)}, key=str.lower)
    is_top_level = path.parent == ROOT
    if not matches and not (is_top_level and name_match):
        return None

    snippets = []
    for match in TERMS.finditer(searchable):
        start = max(0, match.start() - 100)
        end = min(len(searchable), match.end() + 180)
        snippet = searchable[start:end]
        if snippet not in snippets:
            snippets.append(snippet)
        if len(snippets) == 5:
            break
    return {
        "path": str(path),
        "name_hint": name_match,
        "matches": matches,
        "error": error,
    }


for candidate in sorted(ROOT.iterdir()):
    if not candidate.is_file():
        continue
    result = inspect(candidate)
    if result:
        print(json.dumps(result, ensure_ascii=True))
