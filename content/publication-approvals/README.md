# Human publication approvals

No historical signatures are inferred or generated. Unapproved authoring content remains available for review but is excluded from learner banks.

Run `npm run content:approval-queue` to produce private review packets under the ignored factory reports directory. Each packet includes the exact question, answer, explanation, source binding, and an unsigned approval template. Review correctness, originality, and age appropriateness. A reviewer must fill `approvedBy`, `approvedAt`, and all three checks after completing that review.

Run `npm run content:record-approval -- --packet <reviewed-packet.json>` to verify the snapshot against current authoring content and create its immutable approval here. The command never substitutes an environment variable, defaults an identity, or fills review checks. New factory publications carry the same revision-bound approval within their manifests.

These records contain private authoring content. They must never be served as learner DTOs, placed in `public/`, or used as metadata. Hashes are tamper evidence within the trusted Git authoring workflow, not cryptographic proof of a person's identity. Human review and protected code review remain mandatory.
