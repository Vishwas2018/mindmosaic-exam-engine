# Content Lifecycle

The controlled states are `draft -> generated -> validated -> reviewed -> approved -> published -> retired`; manual/import content may move `draft -> validated`. Review or approval can return a revision to draft, but changing content always creates a new revision.

Agents may create candidates and evidence. The owner alone moves reviewed content to approved. The publication service alone publishes or retires. Published revision content is immutable. Retirement prevents new allocation but never breaks historical attempts.

Batch retries are idempotent. Audit events record actor kind, timestamp, event and evidence hash. Candidate authoring tables are unavailable to learner roles.
