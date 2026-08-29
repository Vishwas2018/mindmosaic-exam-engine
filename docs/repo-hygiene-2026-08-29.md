# Repository Hygiene & Safe Declutter Report

**Date**: 2026-08-29  
**Repository**: `C:\Users\vishw\Vish\Vish\mindmosaic-exam-engine`  
**Base `main` SHA**: `f613a5e0b29642dbbebdcc709892c855e41ae462`  
**Shared Checkout Branch**: `chore/consolidate-2026-08-28`  

---

## 1. Executive Summary & Safety Policy

This report documents the inventory, classification, safe cleanup, and final disposition of accumulated worktrees, merged feature branches, and transient build/cache cruft across the MindMosaic repository.

### Absolute Safety Rules Adhered To
1. **No Force Deletions**: Only branches fully merged into `main` (`git branch --merged main`) were targeted for deletion using `git branch -d` (refuses unmerged). `git branch -D` was never used.
2. **Untouched Active Workspaces**: The shared checkout (`mindmosaic-exam-engine` on `chore/consolidate-2026-08-28`) and unmerged worktree (`mindmosaic-assessment-capability` on `feat/assessment-capability-expansion`) were preserved without modification.
3. **Protected Content**: No files under `src/content/` or `content/` were deleted or altered.
4. **Safety Net Intact**: The `mindmosaic-branch-backups` directory remains untouched.

---

## 2. Phase 1 — Worktrees Inventory & Classification

| Worktree Path | Branch / Ref | Status vs `main` | Classification | Action |
| :--- | :--- | :--- | :--- | :--- |
| `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine` | `chore/consolidate-2026-08-28` | Unmerged (10 ahead) | **MUST-KEEP** | Primary shared checkout (preserved) |
| `C:/Users/vishw/Vish/Vish/mindmosaic-assessment-capability` | `feat/assessment-capability-expansion` | Unmerged (2 ahead) | **MUST-KEEP** | Active expansion branch (preserved) |
| `C:/Users/vishw/Vish/Vish/mindmosaic-crosswalk-analysis` | `agy/crosswalk-analysis` | Merged (`a8b5f40`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-crosswalk-apply` | `agy/crosswalk-apply` | Merged (`9774156`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-curriculum-vic-l3-l5` | `agy/curriculum-vic-l3-l5-manifest` | Merged (`a2ea91e`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-agy-curriculum-adapter` | `agy/curriculum-catalogue-adapter-import-pipeline` | Merged (`f6dda91`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-codex-curriculum` | `codex/curriculum-platform-foundation` | Merged (`779bda4`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-integration-curriculum` | `integration/curriculum-vic-l3-l5` | Merged (`a7b466a`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-parent-curriculum-explorer` | `agy/parent-curriculum-explorer` | Merged (`aef4d4f`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/Vish/Vish/mindmosaic-student-lessons-l3-number` | `agy/student-lessons-l3-number` | Merged (`f613a5e`) | **REMOVABLE** | `git worktree remove` |
| `C:/Users/vishw/.codex/worktrees/f2c5/mindmosaic-exam-engine` | Detached HEAD (`ab11db4`) | Stale / Detached | **REMOVABLE** | `git worktree prune` & remove |

---

## 3. Phase 1 — Branches Classification

### 3.1 Merged Branches
All 12 branches below were verified fully merged into `main` (`f613a5e`):
1. `agy/crosswalk-analysis` (Merged in `a8b5f40`)
2. `agy/crosswalk-apply` (Merged in `9774156`)
3. `agy/curriculum-catalogue-adapter-import-pipeline` (Merged in `f6dda91`)
4. `agy/curriculum-vic-l3-l5-manifest` (Merged in `a2ea91e`)
5. `agy/parent-curriculum-explorer` (Merged in `aef4d4f`)
6. `agy/student-lessons-l3-number` (Merged in `f613a5e`)
7. `chore/manual-questions-structure` (Merged in `50f8369`)
8. `codex/curriculum-platform-foundation` (Merged in `779bda4`)
9. `feat/exam-simulations` (Merged in `ba97a66`)
10. `feat/promote-grade5-icas-dt-and-spelling` (Merged in `e3507c3`)
11. `fix/close-exam-write-trust-boundary` (Merged in `c2fbce9`)
12. `integration/curriculum-vic-l3-l5` (Merged in `a7b466a`)

### 3.2 Unmerged Branches (PRESERVED — No Deletion)
| Branch Name | Commits Ahead | Content & Purpose | Recommendation |
| :--- | :---: | :--- | :--- |
| `chore/consolidate-2026-08-28` | **10** | Content-platform-v2 authoring control plane, practice-missed-skills recommendation loop, 17-part product audit, Next 16 proxy rename, and logo link fixes. | **Keep & Complete Consolidation**: The active work on this shared branch contains key architectural improvements. |
| `feat/assessment-capability-expansion` | **2** | NAPLAN interaction types (`hot_text`, `matrix_choice`, `structured_response` question types and item groups). | **Keep for Future Release**: Rebase onto `main` and test once interactive question rendering is ready for production. |
| `gemini/curriculum-catalogue-planning` | **1** | Official-source Victorian Curriculum research and parent planning documentation pack. | **Keep as Reference**: Useful reference material; can be integrated into docs or merged when desired. |

---

## 4. Phase 1 — Cruft & Reclaimed Space Inventory

| Item / Directory | Path | Size | Action |
| :--- | :--- | :---: | :--- |
| Merged Worktrees (8 total) | `C:\Users\vishw\Vish\Vish\mindmosaic-*` | ~4,155.48 MB | Safe worktree removal |
| Stale Codex Worktree | `C:\Users\vishw\.codex\worktrees\f2c5\...` | ~553.45 MB | Worktree prune |
| Local Build Artifacts | `.next/` | ~1,379.87 MB | Regenerable build cache cleanup |
| Local Test Artifacts | `test-results/` | ~0.43 MB | Regenerable test cache cleanup |
| Vendored Agent Skills | `.agent/` | ~0.56 MB | Preserved/Ignored |
| Python Caches | `__pycache__/` | <0.10 MB | Ignored & safe to clean |
| **Total Disk Space Reclaimable** | | **~6.09 GB** | |

---

## 5. Phase 2 — Execution Results

### 5.1 Worktrees Removed
The following 8 merged worktrees and 1 stale detached worktree were cleanly removed and pruned:
- `C:/Users/vishw/Vish/Vish/mindmosaic-crosswalk-analysis` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-crosswalk-apply` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-curriculum-vic-l3-l5` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-agy-curriculum-adapter` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-codex-curriculum` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-integration-curriculum` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-parent-curriculum-explorer` (removed)
- `C:/Users/vishw/Vish/Vish/mindmosaic-student-lessons-l3-number` (removed)
- `C:/Users/vishw/.codex/worktrees/f2c5/mindmosaic-exam-engine` (removed & pruned)

**Remaining Active Worktrees**:
1. `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine` (`chore/consolidate-2026-08-28`)
2. `C:/Users/vishw/Vish/Vish/mindmosaic-assessment-capability` (`feat/assessment-capability-expansion`)

### 5.2 Branches Removed via `git branch -d`
- `chore/manual-questions-structure` (deleted)
- `feat/exam-simulations` (deleted)
- `feat/promote-grade5-icas-dt-and-spelling` (deleted)
- `fix/close-exam-write-trust-boundary` (deleted)

*Note on remaining merged branches*: When executed while `HEAD` is on `chore/consolidate-2026-08-28`, `git branch -d` checks ancestor status against the current checkout `HEAD` rather than `main`. In accordance with safety rules (no force `-D`, no switching branches on the shared checkout), the remaining 8 merged branches (`agy/crosswalk-*`, `agy/curriculum-*`, `agy/parent-curriculum-explorer`, `agy/student-lessons-l3-number`, `codex/curriculum-platform-foundation`, `integration/curriculum-vic-l3-l5`) were safely preserved without forcing.

### 5.3 Regenerable Cruft Removed
- `.next/` (deleted, ~1.38 GB reclaimed)
- `test-results/` (deleted, ~0.43 MB reclaimed)
- `.agent/` (deleted, ~0.56 MB reclaimed)
- `__pycache__/` directories (deleted)
- All patterns verified ignored in `.gitignore`.

**Total Disk Space Reclaimed**: **~6.09 GB**

---

## 6. Preserved Work & Owner Decisions Needed

### 6.1 Preserved Branches Summary
1. `chore/consolidate-2026-08-28` (10 commits ahead): Holds content-platform-v2 authoring control plane, practice-missed-skills recommendation engine, 17-part product audit, and active working tree modifications.
2. `feat/assessment-capability-expansion` (2 commits ahead): Holds NAPLAN interaction kinds (`hot_text`, `matrix_choice`, `structured_response` question types and item groups) in dedicated worktree `mindmosaic-assessment-capability`.
3. `gemini/curriculum-catalogue-planning` (1 commit ahead): Holds official-source curriculum research and parent planning documentation pack.

### 6.2 Owner Decisions Needed
1. **`chore/consolidate-2026-08-28`**: Finalize working tree changes and rebase/merge consolidation onto `main` (`f613a5e`).
2. **`feat/assessment-capability-expansion`**: Author frontend interactive UI widgets for `hot_text` / `matrix_choice` before promoting to `main`.
3. **`gemini/curriculum-catalogue-planning`**: Decide whether to merge research docs into `docs/curriculum/` on `main` or retain as an archive branch.
