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

# --- Review events -----------------------------------------------------------
# Independent review finding P2-2: there are TWO historical review events, bound
# to DIFFERENT packets. The original summary's packet hash identifies only the
# first, and must never be presented as if it bound both.
RDIR = "docs/reviews/scholarship-sample-2026-10-21"


def sha(ref, path):
    """SHA-256 recomputed here from committed bytes, never copied from a record."""
    return hashlib.sha256(show(ref, path)).hexdigest()


def verify(recomputed, claimed):
    if claimed is None:
        return "recomputed_here_no_committed_claim_to_compare"
    return ("recomputed_here_and_matches_committed_claim" if recomputed == claimed
            else "RECOMPUTED_HERE_AND_DISAGREES_WITH_COMMITTED_CLAIM")


summary = json.loads(show(PR73, RDIR + "/review-summary.json"))
attest_014 = json.loads(show(PR73, RDIR + "/external-review-maths-014.attestation.json"))

# Event 1 - original advisory review of the whole 12-item sample.
# review-summary.json names its target packet as "packet.json", but the packet was
# amended afterwards (maths-014 remediation, 45b6cdab) and the originally reviewed
# bytes were archived under release-preparation/. Both are hashed here so the
# distinction is visible rather than implied.
EV1_EVIDENCE = RDIR + "/external-review-chatgpt.json"
EV1_PACKET_ARCHIVED = RDIR + "/release-preparation/packet-reviewed-original.json"
PACKET_CURRENT = RDIR + "/packet.json"

# Event 2 - later re-review of the amended maths-014 only, with its own attestation.
EV2_EVIDENCE = RDIR + "/external-review-maths-014.json"
EV2_PACKET = RDIR + "/packet-maths-014.json"
EV2_ATTESTATION = RDIR + "/external-review-maths-014.attestation.json"

ev1_raw, ev1_pkt = sha(PR73, EV1_EVIDENCE), sha(PR73, EV1_PACKET_ARCHIVED)
ev2_raw, ev2_pkt = sha(PR73, EV2_EVIDENCE), sha(PR73, EV2_PACKET)
pkt_current = sha(PR73, PACKET_CURRENT)

review = {r["id"]: r for r in json.loads(show(PR73, EV1_EVIDENCE))["items"]}
fresh = {r["id"]: r for r in json.loads(show(PR73, EV2_EVIDENCE))["items"]}

REVIEW_EVENTS = {
    "original_advisory_review": {
        "eventId": "original_advisory_review",
        "scope": "all 12 sample candidates, before maths-014 remediation",
        "evidenceFile": EV1_EVIDENCE,
        "evidenceSha256": ev1_raw,
        "evidenceSha256CommittedClaim": summary.get("rawEvidenceSha256"),
        "evidenceBindingVerification": verify(ev1_raw, summary.get("rawEvidenceSha256")),
        "reviewedPacketPath": EV1_PACKET_ARCHIVED,
        "reviewedPacketSha256": ev1_pkt,
        "reviewedPacketSha256CommittedClaim": summary.get("targetPacketSha256"),
        "packetBindingVerification": verify(ev1_pkt, summary.get("targetPacketSha256")),
        "packetPathNamedInCommittedSummary": summary.get("targetPacket"),
        "bindingProvenance": "independently recomputed from committed bytes",
        "manualAttestationReference": None,
        "evidenceType": summary.get("evidenceType"),
        "provider": summary.get("provider"),
        "model": summary.get("model"),
        "apiEnvelope": False,
        "status": summary.get("status"),
        "reviewCompletedForSample": summary.get("reviewCompletedForSample"),
        "itemCount": summary.get("itemCount"),
        "agreeWithKey": summary.get("agreeWithKey"),
    },
    "maths_014_rereview": {
        "eventId": "maths_014_rereview",
        "scope": "scholarship-y6-maths-014 only, after remediation 45b6cdab",
        "evidenceFile": EV2_EVIDENCE,
        "evidenceSha256": ev2_raw,
        "evidenceSha256CommittedClaim": attest_014.get("rawEvidenceSha256"),
        "evidenceBindingVerification": verify(ev2_raw, attest_014.get("rawEvidenceSha256")),
        "reviewedPacketPath": EV2_PACKET,
        "reviewedPacketSha256": ev2_pkt,
        "reviewedPacketSha256CommittedClaim": attest_014.get("packetSha256"),
        "packetBindingVerification": verify(ev2_pkt, attest_014.get("packetSha256")),
        "packetPathNamedInCommittedSummary": None,
        "bindingProvenance": "independently recomputed from committed bytes",
        "manualAttestationReference": EV2_ATTESTATION,
        "evidenceType": attest_014.get("evidenceType"),
        "provider": None,
        "model": attest_014.get("modelLabel"),
        "apiEnvelope": False,
        "status": "rereview_of_amended_item",
        "reviewCompletedForSample": False,
        "itemCount": len(fresh),
        "agreeWithKey": None,
    },
}

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
    ev = REVIEW_EVENTS["maths_014_rereview" if qid in fresh else "original_advisory_review"]
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
            # Which of the two review events supplied the answer recorded here.
            "reviewEventId": ev["eventId"],
            "evidenceFile": ev["evidenceFile"],
            "evidenceSha256": ev["evidenceSha256"],
            "reviewedPacketPath": ev["reviewedPacketPath"],
            "reviewedPacketSha256": ev["reviewedPacketSha256"],
            "bindingProvenance": ev["bindingProvenance"],
            "evidenceBindingVerification": ev["evidenceBindingVerification"],
            "packetBindingVerification": ev["packetBindingVerification"],
            "manualAttestationReference": ev["manualAttestationReference"],
            "evidenceType": ev["evidenceType"],
            "provider": ev["provider"],
            "model": ev["model"],
            "apiEnvelope": False,
            "derivedOptionId": (rev or {}).get("myAnswer"),
            "agreesWithKey": (rev or {}).get("myAnswer") == key,
            "verdict": (rev or {}).get("verdict"),
            "status": ev["status"],
            "reviewerDifficulty": (rev or {}).get("difficulty"),
            "supersededPrimaryVerdict": (rev_primary or {}).get("verdict")
                if rev is not rev_primary else None,
            "supersededPrimaryEventId": "original_advisory_review"
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
    # P2-2 follow-on: cross-check the Phase 1 preflight hashes against the
    # independent PR #73 source-register. For `transformation: none` items the
    # register's currentCandidateHash must equal the preflight factoryCandidateHash.
    # For `solver_sidecar` items the register records the PRE-transformation hash,
    # so it must equal the preflight rawQuestionHash instead. Anything else is
    # reported, never reconciled away.
    reg_raw = reg.get("currentRawQuestionHash")
    reg_cand = reg.get("currentCandidateHash")
    reg_pub = reg.get("currentPublicationContentHash")
    xform = pf.get("transformation")
    expected_cand = pf.get("rawQuestionHash") if xform == "solver_sidecar" else pf.get("factoryCandidateHash")
    cand_ok = reg_cand == expected_cand
    row["crossSourceHashCheck"] = {
        "sourceRegisterPath": "docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json",
        "transformation": xform,
        "rawQuestionHashAgrees": reg_raw == pf.get("rawQuestionHash"),
        "publicationContentHashAgrees": reg_pub == pf.get("publicationContentHash"),
        "registerCandidateHashSemantics": ("pre_transformation_equals_raw" if xform == "solver_sidecar"
                                           else "equals_factory_candidate_hash"),
        "candidateHashAgreesWithExpectedSemantics": cand_ok,
        "preflightFactoryCandidateHash": pf.get("factoryCandidateHash"),
        "sourceRegisterCurrentCandidateHash": reg_cand,
    }
    for label, agrees in (("rawQuestionHash", reg_raw == pf.get("rawQuestionHash")),
                          ("publicationContentHash", reg_pub == pf.get("publicationContentHash")),
                          ("candidateHash", cand_ok)):
        if not agrees:
            problems.append({"id": qid, "kind": "preflight_vs_source_register_hash_mismatch",
                             "field": label, "transformation": xform,
                             "preflight": pf.get("factoryCandidateHash" if label == "candidateHash" else label),
                             "sourceRegister": {"rawQuestionHash": reg_raw,
                                                "candidateHash": reg_cand,
                                                "publicationContentHash": reg_pub}[
                                 "candidateHash" if label == "candidateHash" else label]})

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
    "generatedBy": "docs/reviews/legacy-content-provenance-phase2/reconcile.py (mechanical; no manual transcription)",
    "sourceCommitPr73": PR73,
    "preflightSource": "docs/reviews/legacy-content-provenance-phase1/preflight-12.json",
    "preflightManifestSha256": pre.get("manifestSha256"),
    "preflightAggregate": {k: pre.get(k) for k in
        ("status","writesToFactory","independentReviewEligible","stagingEligible","publicationEligible")},
    # P2-2: two distinct review events, each with its own independently recomputed
    # bindings. There is deliberately no single aggregate packet hash at this level,
    # because no one packet hash identifies both events.
    "reviewEvents": [REVIEW_EVENTS["original_advisory_review"],
                     REVIEW_EVENTS["maths_014_rereview"]],
    "packetFiles": {
        "reviewedOriginalPath": EV1_PACKET_ARCHIVED,
        "reviewedOriginalSha256": ev1_pkt,
        "currentPacketPath": PACKET_CURRENT,
        "currentPacketSha256": pkt_current,
        "currentPacketDiffersFromReviewedOriginal": pkt_current != ev1_pkt,
        "note": ("The original advisory review was performed against the archived "
                 "packet-reviewed-original.json bytes. The current packet.json was amended "
                 "afterwards by the maths-014 remediation and is a different file with a "
                 "different hash. They are not interchangeable."),
    },
    "reviewEvidenceOriginalSummaryVerbatim": {k: summary.get(k) for k in
        ("evidenceType","provider","model","transport","rawEvidenceFile","rawEvidenceSha256",
         "targetPacket","targetPacketSha256","status","reviewCompletedForSample",
         "itemCount","agreeWithKey")},
    "itemCount": len(out),
    "crossSourceHashCheck": {
        "description": ("Phase 1 preflight hashes cross-checked against the independent PR #73 "
                        "source-register. Sidecar-bound items are expected to differ on the "
                        "candidate hash because the register records the pre-transformation value."),
        "itemsChecked": len(out),
        "rawQuestionHashAgreements": sum(1 for r in out if r["crossSourceHashCheck"]["rawQuestionHashAgrees"]),
        "publicationContentHashAgreements": sum(1 for r in out if r["crossSourceHashCheck"]["publicationContentHashAgrees"]),
        "candidateHashAgreementsUnderExpectedSemantics":
            sum(1 for r in out if r["crossSourceHashCheck"]["candidateHashAgreesWithExpectedSemantics"]),
        "sidecarBoundItems": sorted(r["id"] for r in out
                                    if r["crossSourceHashCheck"]["transformation"] == "solver_sidecar"),
    },
    "ownerMappingAgreementCount": sum(1 for r in out if r["ownerKeyAgrees"]),
    "reviewAgreementCount": sum(1 for r in out if r["review"]["agreesWithKey"]),
    "inconsistencies": problems,
    "items": out,
}
json.dump(result, sys.stdout, indent=2)
