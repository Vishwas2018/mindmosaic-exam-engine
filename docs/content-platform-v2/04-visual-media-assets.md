# Visual and Media Asset Contract

Structured visuals continue to use the closed renderer registry and Zod discriminated union. Uploaded or generated images/audio use `content_assets` plus immutable `content_asset_versions`; published questions pin the exact version and hash. Production bytes belong in private managed Supabase Storage, not public external URLs.

An asset version records storage reference, MIME type, byte size, hash, accessibility metadata, provenance and derivative linkage. Images require meaningful alt text; audio requires an accessible transcript before publication. Validators check existence, revision, hash, allowed MIME/size, renderer compatibility, legibility and absence of colour-only meaning or answer leakage. Optimised derivatives remain linked to the master and must not change pedagogical meaning.

AI-generated media is candidate content: generate -> ingest -> validate -> review -> owner approve -> pin. Store generator/model/prompt hash when known; the learner projection never needs the generation prompt.
