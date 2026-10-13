# Branch cleanup report - 13 October 2026

Read-only inventory after refreshing remote refs over HTTPS. No branches or worktrees were deleted. The primary checkout remains untouched.

| Local branch | PR status | Worktree | Recommendation |
| --- | --- | --- | --- |
| `chore/supabase-explicit-grants` | #24 open | No attached worktree | Keep while PR is open |
| `content/depth-prep-and-reading-regroup` | #26 open | No attached worktree | Keep while PR is open |
| `content/icas-y5-science-salvage` | No matching PR in repository history | Clean dedicated worktree | Retain; no confirmed merged PR |
| `content/roadmap-drafts-review` | #33 open | Dirty dedicated worktree | Keep while PR is open |
| `dev` | #23 merged, #5 closed | Dirty dedicated worktree | Keep permanent integration/production branch |
| `docs/monetisation-readiness` | #25 open | No attached worktree | Keep while PR is open |
| `evidence/landing-ch1-six-scene-scroll` | No matching PR in repository history | Clean dedicated worktree | Retain QA evidence pending owner decision |
| `evidence/landing-ch2-previews-qa` | No matching PR in repository history | Clean dedicated worktree | Retain QA evidence pending owner decision |
| `feat/bar-model-visual` | #45 open | Dirty dedicated worktree | Keep while PR is open |
| `feat/landing-ch1-six-scene-scroll` | #40 open | Clean dedicated worktree | Keep while PR is open |
| `feat/landing-hero-refinement` | #29 open | Clean dedicated worktree | Keep while PR is open |
| `feat/programme-governance-roadmap` | #30 closed | Clean dedicated worktree | Retain unmerged work; closed PR is not proof of integration |
| `feat/publication-governance` | #35 open | Clean dedicated worktree | Keep while PR is open |
| `main` | No matching PR in repository history | No attached worktree | Keep permanent integration/production branch |

No local short-lived branch in this inventory has a confirmed merged PR suitable for immediate deletion. PR #33 targets `dev`; this work continues on its existing dedicated review worktree. Its original base is `af944979`; refreshed `origin/dev` is `aea1fcc2`.
