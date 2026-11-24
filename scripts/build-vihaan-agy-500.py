"""Deterministic builder & batch-by-batch validator for vihaan-scholarship-agy-500."""

import importlib.util
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "vihaan-scholarship" / "bank-agy-500"
OUT.mkdir(parents=True, exist_ok=True)


def _load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


maths_mod = _load("agy_maths", "agy-500-maths.py")
nr_mod = _load("agy_nr", "agy-500-nr.py")
vr_mod = _load("agy_vr", "agy-500-vr.py")
reading_mod = _load("agy_reading", "agy-500-reading.py")
writing_mod = _load("agy_writing", "agy-500-writing.py")


def to_canonical_item(raw):
    subj = raw["subject"]
    is_writing = subj == "writing"
    is_reading = subj == "reading"
    q_type = "essay" if is_writing else ("reading_comprehension" if is_reading else "multiple_choice")

    meta = {
        "subject": subj,
        "strand": raw["strand"],
        "topic": raw["topic"],
        "difficulty": raw["difficulty"],
        "marks": 10 if is_writing else 1,
        "estimatedTimeSeconds": raw["estimatedTimeSeconds"],
        "locale": "en-AU",
        "tags": raw["tags"],
    }
    if not is_writing:
        meta["skill"] = raw["skill"]

    q = {
        "id": raw["id"],
        "type": q_type,
        "yearLevel": 6,
        "examStyle": "scholarship_style",
        "status": "draft",
        "origin": "original_seed",
        "prompt": raw["prompt"],
        "options": [] if is_writing else raw["options"],
        "visuals": raw.get("visuals", []),
        "answerKey": (
            {"kind": "manual", "rubric": raw["rubric"]}
            if is_writing
            else {"kind": "single_option", "optionId": raw["answerOptionId"]}
        ),
        "explanation": " ".join(raw["workedSolution"]),
        "metadata": meta,
    }
    if is_reading:
        q["stimulus"] = raw["stimulus"]

    worked = list(raw["workedSolution"])
    if len(worked) < 2:
        worked.append("Verification tip: test the remaining options against the rule to confirm only one choice fits.")

    item = {
        "question": {
            **q,
            "explanation": " ".join(worked),
        },
        "workedSolution": worked,
        "reviewFocus": raw["reviewFocus"],
        "writingGuidance": raw["writingGuidance"] if is_writing else None,
        "reservedForMock": "mock-reserved" in raw["tags"],
    }
    if "arithmeticCheck" in raw:
        item["arithmeticCheck"] = raw["arithmeticCheck"]
    return item


def run_cmd(args):
    res = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stdout)
        print(res.stderr)
        raise SystemExit(res.returncode)
    return res.stdout


def main():
    maths = [to_canonical_item(x) for x in maths_mod.build_maths_questions()]
    nr = [to_canonical_item(x) for x in nr_mod.build_nr_questions()]
    vr = [to_canonical_item(x) for x in vr_mod.build_vr_questions()]
    reading = [to_canonical_item(x) for x in reading_mod.build_reading_questions()]
    writing = [to_canonical_item(x) for x in writing_mod.build_writing_questions()]

    assert len(maths) == 120
    assert len(nr) == 120
    assert len(vr) == 120
    assert len(reading) == 100
    assert len(writing) == 40

    provenance = {
        "adapter": "manual_external",
        "author": "Antigravity session",
        "model": None,
        "generatedOn": "2026-11-18",
        "originalGenerationEvidence": "Session-authored original problems, diagrams, passages and writing prompts; deterministic assembly from checked-in authoring modules.",
        "externalQuestionMaterialUsed": False,
        "formatReference": "https://www.edutest.com.au/tests_parents.html",
        "formatReferenceUse": "Public assessment areas and writing modes only; no external or copyrighted test questions used.",
        "promptFile": "authoring-brief.md",
    }

    manifest = {
        "bankId": "vihaan-scholarship-agy-500",
        "version": 1,
        "status": "draft",
        "approvedBy": None,
        "targets": {
            "numeracy": 120,
            "numerical_reasoning": 120,
            "verbal_reasoning": 120,
            "reading": 100,
            "writing": 40,
        },
        "difficultyTargets": {
            "easy": 75,
            "medium": 225,
            "challenging": 200,
        },
        "mockReservationTotal": 100,
        "batches": [],
    }

    (OUT / "authoring-brief.md").write_text(
        "# Authoring Brief: Vihaan Huntingtower Year 7 Scholarship Bank (AGY-500)\n\n"
        "- **Target Learner:** Vihaan (Year 5/6 preparing for Huntingtower Year 7 Scholarship, unofficial Edutest-style timed practice).\n"
        "- **Governance:** Draft only (`status: \"draft\"`, `approvedBy: null`, `publicationEligible: false`). Follows AGENTS.md and ADR-017.\n"
        "- **Originality:** 100% original problems, visual diagrams, reading passages, and writing prompts. Zero copyrighted or official Edutest/ACER/Huntingtower material.\n"
        "- **Answer Secrecy:** Correct answers never appear in `altText`, `title`, `caption`, `metadata`, or `tags`.\n"
        "- **Mock Reservation:** 100 items (`m097..m120`, `n097..n120`, `v097..v120`, `r081..r100`, `w033..w040`) are reserved exclusively for unseen timed mock examinations.\n",
        encoding="utf-8",
    )

    all_batches_items = []
    for b in range(10):
        batch_num = b + 1
        batch_id = f"vihaan-agy-{batch_num:02d}"
        filename = f"batch-{batch_num:02d}.draft.json"
        batch_items = (
            maths[b * 12 : (b + 1) * 12]
            + nr[b * 12 : (b + 1) * 12]
            + vr[b * 12 : (b + 1) * 12]
            + reading[b * 10 : (b + 1) * 10]
            + writing[b * 4 : (b + 1) * 4]
        )
        assert len(batch_items) == 50, f"Batch {batch_num} has {len(batch_items)} items"
        all_batches_items.append(batch_items)

        batch_doc = {
            "batchId": batch_id,
            "version": 1,
            "status": "draft",
            "approvedBy": None,
            "provenance": provenance,
            "items": batch_items,
        }
        (OUT / filename).write_text(json.dumps(batch_doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        manifest["batches"].append({"batchId": batch_id, "file": filename})

        print(f"Validating {batch_id} ({filename})...")
        out = run_cmd(["node", "--import", "tsx", "scripts/validate-vihaan-agy-500.mts", "--batch", str(batch_num), "--write-report"])
        print(f"  {batch_id}: OK")

    (OUT / "bank.draft.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    # Mock Exam Inventory (100 reserved items: Mock Paper A = Batch 09, Mock Paper B = Batch 10)
    mock_a_ids = [it["question"]["id"] for it in all_batches_items[8]]
    mock_b_ids = [it["question"]["id"] for it in all_batches_items[9]]
    mock_inv = {
        "inventoryVersion": 1,
        "bankId": "vihaan-scholarship-agy-500",
        "status": "draft",
        "approvedBy": None,
        "totalReserved": 100,
        "mockPapers": [
            {
                "paperId": "vihaan-agy-mock-A",
                "title": "Huntingtower Year 7 Unseen Mock Examination A",
                "sourceBatch": "batch-09.draft.json",
                "totalItems": 50,
                "sections": {
                    "numeracy": {"count": 12, "ids": [i for i in mock_a_ids if "-m" in i], "recommendedMinutes": 18},
                    "numerical_reasoning": {"count": 12, "ids": [i for i in mock_a_ids if "-n" in i], "recommendedMinutes": 16},
                    "verbal_reasoning": {"count": 12, "ids": [i for i in mock_a_ids if "-v" in i], "recommendedMinutes": 14},
                    "reading": {"count": 10, "ids": [i for i in mock_a_ids if "-r" in i], "recommendedMinutes": 18},
                    "writing": {"count": 4, "ids": [i for i in mock_a_ids if "-w" in i], "recommendedMinutes": 60, "note": "Select 1 or 2 prompts for a timed sitting"},
                },
            },
            {
                "paperId": "vihaan-agy-mock-B",
                "title": "Huntingtower Year 7 Unseen Mock Examination B",
                "sourceBatch": "batch-10.draft.json",
                "totalItems": 50,
                "sections": {
                    "numeracy": {"count": 12, "ids": [i for i in mock_b_ids if "-m" in i], "recommendedMinutes": 18},
                    "numerical_reasoning": {"count": 12, "ids": [i for i in mock_b_ids if "-n" in i], "recommendedMinutes": 16},
                    "verbal_reasoning": {"count": 12, "ids": [i for i in mock_b_ids if "-v" in i], "recommendedMinutes": 14},
                    "reading": {"count": 10, "ids": [i for i in mock_b_ids if "-r" in i], "recommendedMinutes": 18},
                    "writing": {"count": 4, "ids": [i for i in mock_b_ids if "-w" in i], "recommendedMinutes": 60, "note": "Select 1 or 2 prompts for a timed sitting"},
                },
            },
        ],
    }
    (OUT / "mock-exam-inventory.json").write_text(json.dumps(mock_inv, indent=2) + "\n", encoding="utf-8")

    (OUT / "mock-exam-inventory.md").write_text(
        "# Mock Examination Inventory (100 Reserved Questions)\n\n"
        "These 100 questions are strictly reserved (`reservedForMock: true`) for unseen timed mock examinations and must remain excluded from daily adaptive practice.\n\n"
        "| Mock Paper | Source Batch | Maths | Num. Reasoning | Verbal Reasoning | Reading (2 Passages) | Writing Prompts | Total |\n"
        "|---|---|---:|---:|---:|---:|---:|---:|\n"
        "| **Mock Paper A** (`vihaan-agy-mock-A`) | [batch-09.draft.json](batch-09.draft.json) | 12 (`m097..m108`) | 12 (`n097..n108`) | 12 (`v097..v108`) | 10 (`r081..r090`) | 4 (`w033..w036`) | **50** |\n"
        "| **Mock Paper B** (`vihaan-agy-mock-B`) | [batch-10.draft.json](batch-10.draft.json) | 12 (`m109..m120`) | 12 (`n109..n120`) | 12 (`v109..v120`) | 10 (`r091..r100`) | 4 (`w037..w040`) | **50** |\n"
        "| **Total Reserved** | — | **24** | **24** | **24** | **20** | **8** | **100** |\n\n"
        "## Timed Examination Pacing Guidance\n\n"
        "- **Two-pass strategy:** Answer confident items first (target 45–60 s for Verbal/NR, 60–90 s for Maths); flag multi-step problems for Pass 2.\n"
        "- **Reading Comprehension:** Read the passage once with full focus (~2–2.5 min) before answering all 5 linked questions.\n"
        "- **Written Expression:** Use 15 minutes per prompt (3–4 min planning, 8–9 min drafting, 2–3 min proofreading).\n",
        encoding="utf-8",
    )

    print("Running consolidated 500-item validation...")
    consolidated_out = run_cmd(["node", "--import", "tsx", "scripts/validate-vihaan-agy-500.mts", "--write-report"])
    print(consolidated_out)


if __name__ == "__main__":
    main()
