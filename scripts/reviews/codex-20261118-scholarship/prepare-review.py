
"""Assemble a local draft review package around the existing scholarship validator."""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BANK = Path("content/vihaan-scholarship")
EXPANSION = BANK / "expansion-500"
PILOT = BANK / "pilot-01"
HERE = Path(__file__).resolve().parent
LABELS = {
    "numeracy": "Mathematics", "numerical_reasoning": "Numerical Reasoning",
    "verbal_reasoning": "Verbal Reasoning", "reading": "Reading Comprehension",
    "writing": "Written Expression",
}
TIERS = ("easy", "medium", "challenging")
TARGETS = dict(zip(LABELS, [(18, 54, 48)] * 3 + [(15, 45, 40), (6, 18, 16)]))
MOCK_COUNTS = dict(zip(LABELS, [24, 23, 23, 20, 6]))
MISCONCEPTIONS = {
    "maths-algebra": "Treating a stated relationship as a total, or applying an operation to only one side of an equation.",
    "maths-directed-numbers": "Using the size of a change without its direction, especially when crossing zero.",
    "maths-fractions-decimals": "Applying a fraction to the original amount when the task changes the reference amount.",
    "maths-geometry": "Combining measurements with different units or confusing a boundary length with an area or volume.",
    "maths-percentages": "Choosing the wrong base for a percentage or treating successive percentage changes as simple additions.",
    "maths-probability": "Counting only favourable outcomes or keeping the same total after a draw without replacement.",
    "maths-ratios-rates": "Adding the same amount to each ratio term instead of applying a common scale factor.",
    "nr-arithmetical-reasoning": "Applying a familiar operation to all the numbers without checking the order and relationship in the stem.",
    "nr-logic-deduction-numbers": "Accepting a value that meets one numerical condition without testing every condition.",
    "nr-number-matrices": "Applying a rule to the wrong row or reversing the roles of an input and an output.",
    "nr-number-series": "Continuing a last-step change without checking that the rule also fits the earlier steps and positions.",
    "vr-analogies": "Picking an associated word without preserving the direction and type of the first pair’s relationship.",
    "vr-classification": "Grouping by a noticeable surface trait instead of the property required by the question.",
    "vr-coded-words": "Applying the shift backwards, overlooking letter order, or using a rule that works for only one example.",
    "vr-letter-series": "Treating interleaved positions as one run or missing a change in the size of the letter step.",
    "vr-sentence-logic": "Assuming a rule works in reverse or treating some members of a group as all members.",
    "vr-synonyms-antonyms": "Choosing a word associated with the topic rather than matching its meaning, tone or opposite in context.",
    "vr-word-relationships": "Recognising that two words are connected without identifying which role each word plays.",
    "rc-argument-evaluation": "Mistaking a forceful claim, a preference or an anecdote for relevant evidence.",
    "rc-authorial-craft": "Describing what happens in the text when the question asks why the writer chose that detail.",
    "rc-cause-effect": "Treating events as cause and effect solely because they are mentioned together or occur in that order.",
    "rc-character-inference": "Projecting a motive onto a character instead of using their actions, words and reactions.",
    "rc-factual-inference": "Choosing a plausible idea about the real world that the specific passage does not support.",
    "rc-factual-retrieval": "Selecting a nearby detail that matches the topic but answers a different question.",
    "rc-figurative-language": "Reading an image literally instead of asking which quality is being transferred.",
    "rc-main-idea": "Promoting one memorable example to the main point of the entire text.",
    "rc-text-structure": "Identifying the topic of a section instead of explaining how it functions in the whole text.",
    "rc-tone-analysis": "Giving the reader’s own feeling instead of using wording to infer the speaker’s attitude.",
    "rc-vocabulary-context": "Choosing the most familiar dictionary meaning without checking the immediate sentence.",
}


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def packet_hash(question):
    """Hash of the key-free question exactly as a blind reviewer was shown it."""
    shown = {k: v for k, v in question.items() if k not in ("answerKey", "explanation")}
    canonical = json.dumps(shown, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def bind_replies(unit, replies, number):
    """Pair blind replies with questions by ID and packet hash, never by position alone."""
    if [r.get("n") for r in replies] != list(range(1, len(unit) + 1)):
        raise ValueError(f"Review unit {number} is incomplete")
    seen = set()
    for item, reply in zip(unit, replies, strict=True):
        q = item["question"]
        if reply.get("id") != q["id"] or q["id"] in seen:
            raise ValueError(f"Review unit {number} reply {reply.get('n')} is not bound to question {q['id']}")
        if reply.get("packetHash") != packet_hash(q):
            raise ValueError(f"Review unit {number} reply for {q['id']} was not made against this exact question")
        seen.add(q["id"])
    return {item["question"]["id"]: reply for item, reply in zip(unit, replies, strict=True)}


def inside_repository(path, root=ROOT):
    """True when path is in any Git checkout, including a linked worktree of this repository."""
    path = path.resolve()
    for folder in (path, *path.parents):
        if (folder / ".git").exists():
            return True
    try:
        listing = subprocess.run(["git", "-C", str(root), "worktree", "list", "--porcelain"],
                                 check=True, capture_output=True, text=True, encoding="utf-8").stdout
    except (OSError, subprocess.CalledProcessError):
        return True
    worktrees = [Path(line[9:]).resolve() for line in listing.splitlines() if line.startswith("worktree ")]
    return any(path == tree or tree in path.parents for tree in worktrees)


def choice(q):
    key = q["answerKey"]
    if key["kind"] != "single_option":
        return None
    return next(i for i, o in enumerate(q["options"], 1) if o["id"] == key["optionId"])


def option_text(q):
    position = choice(q)
    return q["options"][position - 1]["text"] if position else None


def calibrate(items, pilot_ids, evidence, findings):
    moves = []
    for subject, counts in TARGETS.items():
        group = [i["question"] for i in items if i["question"]["metadata"]["subject"] == subject]
        target = dict(zip(TIERS, counts))
        def move(q, goal, editorial_reason=None):
            before = q["metadata"]["difficulty"]
            moves.append({"id": q["id"], "from": before, "to": goal,
                          "blindLabel": evidence[q["id"]]["difficulty"],
                          "editorialReason": editorial_reason})
            q["metadata"]["difficulty"] = goal
            if subject not in ("reading", "writing"):
                q["metadata"]["estimatedTimeSeconds"] = {"easy": 60, "medium": 90, "challenging": 150}[goal]
        for q in group:
            finding = findings.get(q["id"], {})
            if goal := finding.get("difficulty"):
                if q["id"] in pilot_ids or goal not in TIERS or not finding.get("calibrationReason"):
                    raise ValueError(f"Invalid editorial difficulty decision: {q['id']}")
                move(q, goal, finding["calibrationReason"])
        current = Counter(q["metadata"]["difficulty"] for q in group)
        for goal in TIERS:
            while current[goal] < target[goal]:
                candidates = [
                    q for q in group if q["id"] not in pilot_ids
                    and q["id"] not in {m["id"] for m in moves}
                    and current[q["metadata"]["difficulty"]] > target[q["metadata"]["difficulty"]]
                    and evidence[q["id"]]["difficulty"] == goal
                ]
                if not candidates:
                    raise ValueError(f"Editorial calibration needed for {subject} / {goal}")
                q = min(candidates, key=lambda q: (abs(TIERS.index(goal) - TIERS.index(q["metadata"]["difficulty"])), q["id"]))
                before = q["metadata"]["difficulty"]
                move(q, goal)
                current[before] -= 1
                current[goal] += 1
        if dict(current) != target:
            raise ValueError(f"Difficulty target mismatch for {subject}")
    return moves


def balance_options(items, pilot_ids):
    for subject in list(LABELS)[:-1]:
        qs = [i["question"] for i in items if i["question"]["metadata"]["subject"] == subject]
        target = len(qs) // 4
        current = Counter(choice(q) for q in qs)
        for want in range(1, 5):
            while current[want] < target:
                candidates = [q for q in qs if q["id"] not in pilot_ids and current[choice(q)] > target]
                q = max(candidates, key=lambda q: (current[choice(q)] - target, q["id"]))
                current_position = choice(q)
                options = q["options"]
                options[want - 1], options[current_position - 1] = options[current_position - 1], options[want - 1]
                for key, option in zip("abcd", options, strict=True):
                    option["id"] = key
                q["answerKey"]["optionId"] = "abcd"[want - 1]
                current[current_position] -= 1
                current[want] += 1



def standardise_options(items, pilots):
    for item in items:
        q = item["question"]
        if q["id"] in pilots or q["type"] == "essay":
            continue
        for option in q["options"]:
            t = option["text"]
            if q["metadata"]["subject"] == "reading":
                option["text"] = t[:1].upper() + t[1:]
            elif q["metadata"]["subject"] in ("numeracy", "numerical_reasoning") and re.fullmatch(r"-?\d+\.0+", t):
                option["text"] = t.split(".", 1)[0]

def diagram(q):
    if q["metadata"].get("skill") != "scholarship.nr-number-matrices":
        return None
    rows = re.findall(r"\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(\?|-?\d+)\s*\)", q["prompt"])
    if len(rows) < 2 or sum(row.count("?") for row in rows) != 1:
        return None
    key = option_text(q)
    if key in {cell for row in rows for cell in row}:
        return None
    return {
        "id": f"{q['id']}-review-grid", "type": "table",
        "altText": "Number grid with a missing entry. The prompt states the relationship to apply.",
        "data": {"headers": ["First entry", "Second entry", "Third entry"],
                 "rows": [[int(cell) if cell != "?" else "?" for cell in row] for row in rows],
                 "rowHeaders": False},
    }


def assemble_mock(items, reserved):
    chosen = []
    for subject, target in MOCK_COUNTS.items():
        pool = [i["question"] for i in items if i["question"]["id"] in reserved
                and i["question"]["metadata"]["subject"] == subject]
        if subject == "reading":
            groups = defaultdict(list)
            for q in pool:
                groups[q["stimulus"]["title"]].append(q)
            all_counts = Counter(i["question"]["stimulus"]["title"] for i in items if i["question"].get("stimulus"))
            complete = [group for title, group in groups.items() if len(group) == all_counts[title] == 5]
            if len(complete) < target // 5:
                raise ValueError("Not enough complete reserved passages")
            chosen.extend(q for group in complete[:target // 5] for q in group)
        else:
            if len(pool) < target:
                raise ValueError(f"Insufficient reserved items for {subject}")
            ordered = []
            for t in TIERS:
                ordered.append([q for q in pool if q["metadata"]["difficulty"] == t])
            while any(ordered):
                for group in ordered:
                    if group:
                        chosen.append(group.pop(0))
                        target -= 1
                    if target == 0:
                        break
                if target == 0:
                    break
    if len(chosen) != 96 or len({q["id"] for q in chosen}) != 96:
        raise ValueError("Mock reserve must contain 96 unique items")
    return [{"id": q["id"], "subject": q["metadata"]["subject"], "difficulty": q["metadata"]["difficulty"],
             "estimatedSeconds": q["metadata"]["estimatedTimeSeconds"],
             **({"passage": q["stimulus"]["title"]} if q.get("stimulus") else {})} for q in chosen]


def node(script, cwd=ROOT, args=()):
    loader = (ROOT / "node_modules/tsx/dist/loader.mjs").as_uri()
    return subprocess.run(
        ["node", "--import", loader, str(script), *map(str, args)], cwd=cwd,
        env={**os.environ, "TSX_TSCONFIG_PATH": str(ROOT / "tsconfig.json")},
        check=True, capture_output=True, text=True, encoding="utf-8",
    ).stdout


def read_examples(path):
    output = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        short_id, model, annotations = line.split("|", 2)
        id_ = f"vihaan-{short_id}"
        if id_ in output or len(model) < 80 or len(annotations) < 25:
            raise ValueError(f"Missing or duplicate writing evidence: {id_}")
        output[id_] = {"example": model, "annotation": annotations}
    return output


def apply_findings(item, reply, finding, retained):
    q = item["question"]
    position = choice(q)
    if position is None and (reply["choice"] is not None or reply["quality"] != "writing"):
        raise ValueError(f"Blind writing result mismatch: {q['id']}")
    discrepancy = position is not None and (
        reply["choice"] != position or reply["quality"] in {"ambiguous", "wrong_choices", "uncertain"}
    )
    if discrepancy and not finding:
        raise ValueError(f"Independent result requires adjudication: {q['id']}")
    if not finding:
        return
    if not finding.get("reason"):
        raise ValueError(f"Missing adjudication rationale: {q['id']}")
    changes = finding.get("changes")
    if not changes:
        return
    if retained:
        raise ValueError(f"Retained pilot cannot be edited: {q['id']}")
    if "prompt" in changes:
        q["prompt"] = changes["prompt"]
    if "skill" in changes:
        meta = q["metadata"]
        original_skill = meta["skill"].removeprefix("scholarship.")
        meta["skill"] = f"scholarship.rc-{changes['skill']}"
        meta["tags"] = [meta["skill"].removeprefix("scholarship.") if tag == original_skill else tag for tag in meta["tags"]]
        meta["topic"] = changes["topic"]
    if "options" in changes:
        q["options"] = [{"id": k, "text": t} for k, t in zip("abcd", changes["options"], strict=True)]
    if "key" in changes:
        q["answerKey"]["optionId"] = next(o["id"] for o in q["options"] if o["text"] == changes["key"])
    if "working" in changes:
        item["workedSolution"] = changes["working"]
        q["explanation"] = " ".join(changes["working"])
    if "arithmetic" in changes:
        item["arithmeticCheck"] = changes["arithmetic"]


def build(evidence, output):
    pilot = read(ROOT / PILOT / "draft.json")
    manifest = read(ROOT / EXPANSION / "bank.draft.json")
    batches = [read(ROOT / EXPANSION / entry["file"]) for entry in manifest["batches"]]
    pilots = {i["question"]["id"] for i in pilot["items"]}
    samples = read_examples(evidence / "writing-examples.txt")
    findings = read(evidence / "adjudication.json")
    units = [pilot["items"] + batches[0]["items"], *[b["items"] for b in batches[1:]]]
    items = [i for unit in units for i in unit]
    ids = [i["question"]["id"] for i in items]
    if len(ids) != 500 or len(set(ids)) != 500 or set(findings) - set(ids):
        raise ValueError("Bank or adjudication IDs differ from the original 500")
    if set(samples) != {i["question"]["id"] for i in items if i["question"]["type"] == "essay"}:
        raise ValueError("All 40 writing examples are required")
    blind = {}
    original_positions = {}
    for number, unit in enumerate(units, 1):
        replies = read(evidence / "verification" / f"solved-{number:02}.json")["items"]
        if len(unit) != 50:
            raise ValueError(f"Review unit {number} must hold 50 questions")
        blind.update(bind_replies(unit, replies, number))
        for item, reply in zip(unit, replies, strict=True):
            q = item["question"]
            id_ = q["id"]
            original_positions[id_] = choice(q)
            apply_findings(item, reply, findings.get(id_), id_ in pilots)
            if id_ in samples and id_ not in pilots:
                q["answerKey"]["sampleResponse"] = samples[id_]["example"]
    standardise_options(items, pilots)
    moves = calibrate(items, pilots, blind, findings)
    balance_options(items, pilots)
    visuals = {i["question"]["id"]: visual for i in items if (visual := diagram(i["question"])) is not None}
    checksum_sources = [ROOT / PILOT / f for f in ("draft.json", "published-manifest.json")]
    checksum_sources += [ROOT / EXPANSION / f for f in ("bank.draft.json", "published-manifest.json", *[e["file"] for e in manifest["batches"]])]
    checksums = {str(p.relative_to(ROOT)): fingerprint(p) for p in checksum_sources}
    with tempfile.TemporaryDirectory(prefix=".build-", dir=output.parent) as staged:
        stage = Path(staged)
        for parent in ("content/scholarship-drafts", "src/content/questions/generated"):
            shutil.copytree(ROOT / parent, stage / parent)
        (stage / PILOT).mkdir(parents=True)
        shutil.copy2(ROOT / PILOT / "draft.json", stage / PILOT / "draft.json")
        write(stage / EXPANSION / "bank.draft.json", manifest)
        for entry, batch in zip(manifest["batches"], batches, strict=True):
            write(stage / EXPANSION / entry["file"], batch)
        try:
            node(ROOT / "scripts/validate-vihaan-expansion.mts", stage, ("--write-report",))
        except subprocess.CalledProcessError as error:
            print(error.stdout)
            print(error.stderr)
            raise
        checks = read(stage / EXPANSION / "quality-coverage-report.json")
        work = stage / "review-references.json"
        write(work, {"ids": ids, "diagrams": list(visuals.values())})
        refs = json.loads(node(HERE / "references.mts", args=(work,)))
        if len(refs["mockIds"]) != 166 or refs["visualCount"] != len(visuals):
            raise ValueError("Published reservation or diagram validation mismatch")
        package = stage / "bundle"
        private_bank = package / "canonical"
        shutil.copytree(stage / EXPANSION, private_bank / EXPANSION)
        shutil.copytree(stage / PILOT, private_bank / PILOT)
        make_reports(package, units, blind, original_positions, findings, samples, visuals, moves, refs, checks, checksums, pilots)
        if any(fingerprint(ROOT / name) != digest for name, digest in checksums.items()):
            raise RuntimeError("A published input changed while generating the review")
        package.rename(output)



def md(path, lines):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def make_reports(package, units, blind, original_positions, findings, samples, visuals, moves, refs, checks, checksums, pilots):
    private_bank = package / "canonical" / EXPANSION
    items = [item for unit in units for item in unit]
    history = {}
    for parent in (PILOT, EXPANSION):
        for a in read(ROOT / parent / "published-manifest.json")["approvals"]:
            history[a["questionId"]] = {k: a[k] for k in ("approvedBy", "approvedAt", "contentHash", "fingerprint")}
    if len(history) != 500 or set(history) != set(blind):
        raise ValueError("Historical approval inventory mismatch")
    mock = assemble_mock(items, set(refs["mockIds"]))
    mock_ids = {r["id"] for r in mock}
    register = []
    links = []
    for number, unit in enumerate(units, 1):
        tag = f"unit-{number:02}"
        batch = read(private_bank / f"batch-{number:02}.validation.json")
        if not batch["passed"] or len(batch["checks"]) != 50:
            raise ValueError("Canonical validation failed")
        cards, rows, passages = [f"# Review {tag}", "", "Private reviewer copy", ""], [], set()
        for i, check in zip(unit, batch["checks"], strict=True):
            q = i["question"]
            id_ = q["id"]
            meta = q["metadata"]
            answer = choice(q)
            if check["id"] != id_:
                raise ValueError("Canonical report order mismatch")
            existing = history[id_]
            retained = id_ in pilots
            register.append({"id": id_, "unit": number, "draftHash": check["contentHash"],
                "historicalApproval": existing, "approvedBy": existing["approvedBy"] if retained else None,
                "status": "retained_approved_pilot" if retained else "draft_pending_human_review",
                "reviewDecision": None, "mockOnlyInReviewPlan": id_ in mock_ids})
            finding = findings.get(id_, {})
            reviewer = blind[id_]
            misconception = MISCONCEPTIONS.get(meta.get("skill", "").removeprefix("scholarship."))
            if answer is not None and misconception is None:
                raise ValueError(f"Missing misconception guidance: {id_}")
            row = {"id": id_, "canonicalDraftHash": check["contentHash"],
                   "automated": check["automated"], "originalBlindCheck": reviewer,
                   "originalAuthoredPosition": original_positions[id_], "independentWorking": finding.get("reason", reviewer["working"]),
                   "adjudication": "revised" if finding.get("changes") else "retained",
                   "distractorNote": finding.get("distractorNote") or (reviewer["issue"] if reviewer["quality"] == "weak_distractor" else ""),
                   "misconception": misconception, "humanReapprovalRequired": not retained}
            rows.append(row)
            cards += [f"## {id_}", "",
                      f"{LABELS[meta['subject']]} · {meta['topic']} · {meta.get('skill', ' / '.join(meta['tags'][-4:]))}",
                      "", f"{meta['difficulty']} · {meta['estimatedTimeSeconds']} seconds", ""]
            if stimulus := q.get("stimulus"):
                title = stimulus["title"]
                if title not in passages:
                    passages.add(title)
                    cards += [f"**Passage — {title}**", "", stimulus["body"], ""]
                else:
                    cards += [f"Passage — {title} (shown above)", ""]
            cards += [q["prompt"], ""]
            if visual := visuals.get(id_):
                table = visual["data"]
                cards += ["| " + " | ".join(table["headers"]) + " |",
                          "| " + " | ".join(["---"] * len(table["headers"])) + " |"]
                cards += ["| " + " | ".join(map(str, cells)) + " |" for cells in table["rows"]]
                cards.append("")
            if answer is None:
                cards += ["**Planning and feedback**", "", *("- " + x for x in i["writingGuidance"]["successCriteria"]),
                          "", "**Annotated example**", "", samples[id_]["example"], "", samples[id_]["annotation"], "",
                          "Apply the rubric in the review index. Give one observed strength and one revision the writer can try.", ""]
            else:
                cards += [*(f"- {o['id'].upper()}. {o['text']}" for o in q["options"]), "",
                          f"**Answer — {q['answerKey']['optionId'].upper()}. {option_text(q)}**", "",
                          *(f"{n}. {x}" for n, x in enumerate(i["workedSolution"], 1)), "",
                          f"**Common misconception:** {misconception}", "", f"**Independent working:** {row['independentWorking']}", ""]
                if row["distractorNote"]:
                    cards += [f"**Distractor note:** {row['distractorNote']}", ""]
            cards += ["---", ""]
        md(package / "review" / f"{tag}.md", cards)
        write(package / "review" / f"{tag}.validation.json",
              {"batch": number, "status": "draft", "approvedBy": None, "total": len(rows),
               "canonicalValidationPassed": batch["passed"], "checks": rows})
        links.append(f"- [{tag} with answers](review/{tag}.md) · [validation record](review/{tag}.validation.json)")
    write(package / "approval-register.json", {"status": "draft", "approvedBy": None, "publicationEligible": False,
                                               "retainedPilotApprovals": 20, "expansionDecisionsPending": 480, "items": register})
    write(package / "mock-inventory.json", {"status": "draft", "approvedBy": None, "total": 96, "expansionSlots": 480,
        "sourcePool": 166, "previousStudentExposure": "Not established", "passagePolicy": "Keep complete passage sets together.", "items": mock})
    write(package / "source-file-checksums.json", checksums)
    write(package / "review-diagrams.json", visuals)
    write(package / "difficulty-adjudication.json", moves)
    write(package / "duplicate-detection.json", {"corpus": checks["corpus"], "blockingMatches": checks["duplicateMatches"],
          "limits": "The unchanged pipeline checks exact and high-similarity stems and numeric reskins within the recorded corpus. Human semantic and originality decisions remain open."})
    rubric = ["# Written expression rubric", "", "Score all six criteria on a 1–5 scale. Levels 2 and 4 sit between the anchors.", ""]
    for c in refs["rubric"]["criteria"]:
        rubric += [f"## {c['label']}", "", c["lookFor"], "", *(f"- **{n}:** {c['anchors'][str(n)]}" for n in (1, 3, 5)), ""]
    md(package / "writing-rubric.md", rubric)
    matrix = ["# Subject, topic and difficulty coverage", "", "| Subject | Easy | Medium | Challenging | Total |",
              "| --- | ---: | ---: | ---: | ---: |"]
    for subject, title in LABELS.items():
        data = checks["coverage"][subject]
        e, m, c = [data["difficulty"].get(t, 0) for t in TIERS]
        matrix.append(f"| {title} | {e} | {m} | {c} | {data['count']} |")
    matrix += ["| **Total** | **75** | **225** | **200** | **500** |", "",
               "Difficulty and timings are editorial. Read each shared passage once. Each objective subject has equal key-position totals.", "",
               "| Subject | Topic / skill | Easy | Medium | Challenging | Total |",
               "| --- | --- | ---: | ---: | ---: | ---: |"]
    topics = defaultdict(Counter)
    for item in items:
        meta = item["question"]["metadata"]
        topics[(meta["subject"], meta.get("skill") or meta["topic"])][meta["difficulty"]] += 1
    for (subject, topic), t in sorted(topics.items()):
        matrix.append(f"| {LABELS[subject]} | {topic} | {t['easy']} | {t['medium']} | {t['challenging']} | {sum(t.values())} |")
    md(package / "coverage-matrix.md", matrix)
    md(package / "README.md", ["# Private scholarship draft review", "",
        "Codex November 2026 editorial revision. The twenty approved pilot items are retained exactly. All expansion items are reused, with editorial repairs where needed. Approval of the published revision and approval of these draft hashes are distinct decisions.",
        "",
        "The school lists 13 February 2027 as the test date for Year 7 entry in 2028. This bank is original practice aligned to broad skills. Use 60-minute sessions on six days per week, including a complete writing slot and follow-up on writing days. [Huntingtower scholarship admissions](https://www.huntingtower.vic.edu.au/admissions/scholarships).",
        "",
        "Keep answer material and mock selection private. Existing published material can be inspected in the public repository, so prior exposure to any reused item is unknown.",
        "",
        "- [Coverage](coverage-matrix.md)", "- [Duplicate screen](duplicate-detection.json)",
        "- [Mock inventory](mock-inventory.json)", "- [Human approval register](approval-register.json)",
        "- [Writing rubric](writing-rubric.md)", "- [Source checksums](source-file-checksums.json)", "",
        *links])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("evidence", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    evidence, output = args.evidence.resolve(), args.output.resolve()
    if inside_repository(evidence) or inside_repository(output) or output.exists() or output.parent != evidence:
        parser.error("Evidence and output must be private directories outside this checkout and every other Git worktree, with the output a new directory directly inside the evidence directory.")
    build(evidence, output)
    print(f"Created private draft review package: {output}")


if __name__ == "__main__":
    main()
