# Migration and Cutover Plan

1. Deploy the authoring control-plane migration without changing delivery.
2. Import new content and legacy content with truthful origins; preserve raw source and never fabricate review/approval.
3. Produce deterministic exports and compare authoring publication projections with the existing compiled bank.
4. Shadow-compare IDs, revisions, counts, answers, stimuli, visual/asset pins, learner DTOs, form allocation and historical resolution.
5. Switch authenticated delivery only after equivalence and rollback tests pass. Keep the compiled path available for rollback during the observation window.

The old curated/factory files are retained migration inputs and recovery evidence, not the v2 operational authoring database. Guest delivery remains unchanged until its separate cutover is proven.
