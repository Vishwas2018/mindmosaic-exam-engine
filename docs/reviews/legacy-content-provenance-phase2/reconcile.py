"""Mechanical 12-item evidence reconciliation for MindMosaic PR #75.

Reads only committed bytes: PR #73 drafts + review records at dcb60a80, and the
Phase 1 preflight on the current branch. Emits reconciliation.json. Never edits
source questions; disagreements are reported, not repaired.
"""
import json, subprocess, sys, hashlib

PR73 = "dcb60a80f3f6eabdb522b20202929d2e3f328a94"
DRAFTS = [
    "content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json",
    "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json",
    "content/scholarship-drafts/scholarship-y6-mathematics-draft.json",
    "content/scholarship-drafts/scholarship-y6-reading-draft.json",
]
IDS = ["scholarship-y6-vr-001","scholarship-y6-vr-016","scholarship-y6-vr-032",
       "scholarship-y6-nr-001","scholarship-y6-nr-022","scholarship-y6-nr-023",
       "scholarship-y6-rc-001","scholarship-y6-rc-002","scholarship-y6-rc-003",
       "scholarship-y6-maths-004","scholarship-y6-maths-007","scholarship-y6-maths-014"]

# Owner-supplied verified mapping (the authority this run is checked against).
OWNER = {"scholarship-y6-vr-001":"e","scholarship-y6-vr-016":"d","scholarship-y6-vr-032":"c",
         "scholarship-y6-nr-001":"e","scholarship-y6-nr-022":"e","scholarship-y6-nr-023":"b",
         "scholarship-y6-rc-001":"a","scholarship-y6-rc-002":"c","scholarship-y6-rc-003":"e",
         "scholarship-y6-maths-004":"b","scholarship-y6-maths-007":"a","scholarship-y6-maths-014":"c"}

CLASS_A = ["scholarship-y6-vr-032","scholarship-y6-nr-001","scholarship-y6-nr-022",
           "scholarship-y6-nr-023","scholarship-y6-maths-004","scholarship-y6-maths-007",
           "scholarship-y6-maths-014"]

def show(ref, path):
    return subprocess.run(["git","show",f"{ref}:{path}"], capture_output=True, check=True).stdout

items, sidecars = {}, {}
for p in DRAFTS:
    blob = show(PR73, p)
    doc = json.loads(blob)
    for q in doc.get("questions", []):
        if q.get("id") in IDS:
            items[q["id"]] = {"q": q, "sourcePath": p,
                              "sourceBlobSha256": hashlib.sha256(blob).hexdigest()}
    for k, v in (doc.get("parameters") or {}).items():
        if k in IDS:
            sidecars[k] = v

review = {r["id"]: r for r in json.loads(show(PR73,
    "docs/reviews/scholarship-sample-2026-10-21/external-review-chatgpt.json"))["items"]}
fresh = {r["id"]: r for r in json.loads(show(PR73,
    "docs/reviews/scholarship-sample-2026-10-21/external-review-maths-014.json"))["items"]}
summary = json.loads(show(PR73,
    "docs/reviews/scholarship-sample-2026-10-21/review-summary.json"))

with open("docs/reviews/legacy-content-provenance-phase1/preflight-12.json","rb") as f:
    pre = json.load(f)
preflight = {i["id"]: i for i in pre["items"]}
register = {i["id"]: i for i in json.loads(show(PR73,
    "docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json"))["items"]}

out, problems = [], []
for qid in IDS:
    if qid not in items:
        problems.append({"id": qid, "kind": "missing_source_item"}); continue
    q = items[qid]["q"]
    opts = {o["id"]: o["text"] for o in q.get("options", [])}
    key = q.get("answerKey", {}).get("optionId")
    rev = fresh.get(qid) or review.get(qid)
    rev_primary = review.get(qid)
    pf, reg = preflight.get(qid, {}), register.get(qid, {})
    og = reg.get("originalGeneration", {})

    row = {
        "id": qid,
        "class": "A_deterministic" if qid in CLASS_A else "deferred_B_or_C",
        "sourcePath": items[qid]["sourcePath"],
        "answerKey": key,
        "answerText": opts.get(key),
        "optionIds": sorted(opts),
        "difficulty": q.get("metadata", {}).get("difficulty"),
        "estimatedTimeSeconds": q.get("metadata", {}).get("estimatedTimeSeconds"),
        "skill": q.get("metadata", {}).get("skill"),
        "promptSha256": hashlib.sha256(q.get("prompt","").encode()).hexdigest(),
        "ownerStatedKey": OWNER[qid],
        "ownerKeyAgrees": OWNER[qid] == key,
        "review": {
            "evidenceType": summary.get("evidenceType"),
            "provider": summary.get("provider"),
            "model": summary.get("model"),
            "apiEnvelope": False,
            "derivedOptionId": (rev or {}).get("myAnswer"),
            "agreesWithKey": (rev or {}).get("myAnswer") == key,
            "verdict": (rev or {}).get("verdict"),
            "reviewerDifficulty": (rev or {}).get("difficulty"),
            "supersededPrimaryVerdict": (rev_primary or {}).get("verdict")
                if rev is not rev_primary else None,
        },
        "hashes": {
            "rawQuestionHash": pf.get("rawQuestionHash"),
            "factoryCandidateHash": pf.get("factoryCandidateHash"),
            "publicationContentHash": pf.get("publicationContentHash"),
            "transformation": pf.get("transformation"),
            "preflightStatus": pf.get("status"),
        },
        "originalGeneration": {
            "status": og.get("status"), "provider": og.get("provider"),
            "model": og.get("model"), "promptHash": og.get("promptHash"),
            "candidateGenerationEvent": og.get("candidateGenerationEvent"),
        },
        "solverSidecarInPr73Packet": qid in sidecars,
        "sidecarSolver": (sidecars.get(qid) or {}).get("solver"),
        "sidecarTargetOption": (sidecars.get(qid) or {}).get("targetOption"),
    }
    if not row["ownerKeyAgrees"]:
        problems.append({"id": qid, "kind": "owner_mapping_vs_source_key",
                         "owner": OWNER[qid], "source": key})
    if not row["review"]["agreesWithKey"]:
        problems.append({"id": qid, "kind": "review_vs_source_key",
                         "review": row["review"]["derivedOptionId"], "source": key})
    if row["sidecarTargetOption"] and row["sidecarTargetOption"] != key:
        problems.append({"id": qid, "kind": "sidecar_target_vs_source_key",
                         "sidecar": row["sidecarTargetOption"], "source": key})
    if og.get("status") != "unverified":
        problems.append({"id": qid, "kind": "original_generation_not_unverified",
                         "status": og.get("status")})
    if pf.get("status") != "PASS":
        problems.append({"id": qid, "kind": "preflight_not_pass", "status": pf.get("status")})
    out.append(row)

result = {
    "generatedBy": "scratchpad/recon/reconcile.py (mechanical; no manual transcription)",
    "sourceCommitPr73": PR73,
    "preflightSource": "docs/reviews/legacy-content-provenance-phase1/preflight-12.json",
    "preflightManifestSha256": pre.get("manifestSha256"),
    "preflightAggregate": {k: pre.get(k) for k in
        ("status","writesToFactory","independentReviewEligible","stagingEligible","publicationEligible")},
    "reviewEvidence": {k: summary.get(k) for k in
        ("evidenceType","provider","model","transport","rawEvidenceSha256","targetPacketSha256",
         "status","reviewCompletedForSample","itemCount","agreeWithKey")},
    "itemCount": len(out),
    "ownerMappingAgreementCount": sum(1 for r in out if r["ownerKeyAgrees"]),
    "reviewAgreementCount": sum(1 for r in out if r["review"]["agreesWithKey"]),
    "inconsistencies": problems,
    "items": out,
}
json.dump(result, sys.stdout, indent=2)
