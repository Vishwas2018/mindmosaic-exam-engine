# Blueprint Model

Generation is deficit-driven across programme, offering, year, subject, strand, skill, difficulty/cognitive demand, interaction, visual/image/audio/stimulus requirement, scoring mode, targets, reserve and form constraints. Every framework rule records framework ID/version, official URL, retrieval time and `sourceType`.

`generate-next-batch` computes accepted/reserved counts per cell and assigns only deficits, normally 25-50 items. A reservation carries batch and idempotency identity so a resumed job cannot double-fill a cell. Unsupported renderer or asset capabilities make a cell ineligible rather than weakening its requirement.
