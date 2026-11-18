# Complete Admin design artboard inventory

11 November 2026, Australia/Sydney. Actual Claude canvas: https://claude.ai/artifact/RmoM5xtuZoj4dHNLzRqbg1

27 named artboards, all source snapshots preserved. Native sizes below are authored artboard dimensions; they are not proof that an application supports every viewport. Browser-read text, controls, links and inspected viewports are in [all-artboards.json](evidence/all-artboards.json).

| # | Exact artboard | Native size | Existing/proposed route | Status / reuse | Required content and states |
|---|---|---|---|---|---|
| 1 | [Overview.dc.html](evidence/design/Overview.dc.html) | 1440 x 910 | `/admin` | Existing tools hub; new queue/gate read models | Queues, reports, publication mode; sample metrics must be replaced with real reads or unavailable states |
| 2 | [OverviewTablet.dc.html](evidence/design/OverviewTablet.dc.html) | 834 x 1470 | `/admin` | 834px variant | Cards reflow; sidebar retained |
| 3 | [Library.dc.html](evidence/design/Library.dc.html) | 1440 x 1000 | `/admin/questions` | Proposed route and general authoring catalogue | ID/prompt/skill search; programme/year/subject/strand/status; chips, sort, row navigation |
| 4 | [LibraryTablet.dc.html](evidence/design/LibraryTablet.dc.html) | 834 x 1140 | `/admin/questions` | 834px variant | Wrapped filters and horizontal table scrolling |
| 5 | [LibraryStates.dc.html](evidence/design/LibraryStates.dc.html) | 1440 x 1030 | `/admin and /admin/questions` | Component/test states | Loading cards/table; queue cleared vs filter no-match; failed load; wrong role |
| 6 | [Review.dc.html](evidence/design/Review.dc.html) | 1440 x 1600 | `/admin/questions/[questionId]` | Proposed general detail; reuse existing Scholarship review parts | Student rendering, key/explanation, automated findings, metadata and immutable revision history |
| 7 | [ReviewMobile.dc.html](evidence/design/ReviewMobile.dc.html) | 390 x 1240 | `/admin/questions/[questionId]` | Essential 390px variant | Question, key, findings and hand-off to human approval |
| 8 | [ReviewStates.dc.html](evidence/design/ReviewStates.dc.html) | 1440 x 1170 | `/admin/questions/[questionId]` | Component/test states | AI-flagged; stale findings/re-run; edit-in-progress pause (new presence dependency) |
| 9 | [Approve.dc.html](evidence/design/Approve.dc.html) | 1440 x 1080 | `/admin/questions/[questionId]/approval` | Proposed publication-capable decision service | Approve/request changes/reject, required notes, person plus exact revision; does not publish |
| 10 | [ApproveMobile.dc.html](evidence/design/ApproveMobile.dc.html) | 390 x 570 | `/admin/questions/[questionId]/approval` | Essential 390px variant | Revision-bound decision; preserve server-required explicit checks |
| 11 | [ApproveStates.dc.html](evidence/design/ApproveStates.dc.html) | 1440 x 1690 | `/admin/questions/[questionId]/approval` | Component/test states | Acknowledged approval; stale revision blocked; concurrent reviewer; senior-reviewer denial |
| 12 | [Paper.dc.html](evidence/design/Paper.dc.html) | 1440 x 1240 | `/admin/papers/[paperId]` | Proposed fixed-paper read model | Ordered version-pinned items, marks, time, per-question decisions, readiness and distinct forms |
| 13 | [PaperStates.dc.html](evidence/design/PaperStates.dc.html) | 1440 x 700 | `/admin/papers/[paperId]` | Component/test states | Short of approved content; changed question revision must not silently replace pinned item |
| 14 | [Publish.dc.html](evidence/design/Publish.dc.html) | 1440 x 930 | `/admin/publication` | Proposed authenticated operation boundary | Schema/human/hash/machine readiness; publish acknowledgement; history; actual gate modes |
| 15 | [PublishStates.dc.html](evidence/design/PublishStates.dc.html) | 1440 x 1190 | `/admin/publication` | Component/test states and destructive confirmation | Missing approval; stale approval; confirmed publication; unpublish/keep-live confirmation |
| 16 | [Writing.dc.html](evidence/design/Writing.dc.html) | 1440 x 840 | `/admin/writing` | Proposed authorized redacted Admin read/mark path | Task, response, rubric, feedback; no identifying data beyond approved policy; confirm mark |
| 17 | [WritingMobile.dc.html](evidence/design/WritingMobile.dc.html) | 390 x 800 | `/admin/writing` | Essential 390px variant | Task/response, marks and feedback; claim mark only after server acknowledgement |
| 18 | [WritingStates.dc.html](evidence/design/WritingStates.dc.html) | 1440 x 710 | `/admin/writing` | Component/test states | Confirmed mark; empty queue; failed save preserves entered feedback |
| 19 | [Support.dc.html](evidence/design/Support.dc.html) | 1440 x 750 | `/admin/support` | Proposed report/account triage repository | Fixed-reason question reports and account issues; open question without opening child record |
| 20 | [SupportMobile.dc.html](evidence/design/SupportMobile.dc.html) | 390 x 550 | `/admin/support` | Essential 390px variant | Prioritized report list and privacy boundary |
| 21 | [SupportStates.dc.html](evidence/design/SupportStates.dc.html) | 1440 x 790 | `/admin/support` | Component/test states; escalation needs policy | Distress report; question review/unpublish hand-off; no child identity, answers or free text |
| 22 | [Activity.dc.html](evidence/design/Activity.dc.html) | 1440 x 690 | `/admin/activity` | Proposed unified audit projection | Filter who/action/date; actor, action, item, hash and time; System for automated steps |
| 23 | [ActivityStates.dc.html](evidence/design/ActivityStates.dc.html) | 1440 x 730 | `/admin/activity` | Component/test states | Loading, no activity in range; append-only provenance guarantees |
| 24 | [AdminMap.dc.html](evidence/design/AdminMap.dc.html) | 1480 x 1260 | `Documentation, not an application route` | Reference map | End-to-end governance journeys and three distinct authority layers |
| 25 | [AdminInventory.dc.html](evidence/design/AdminInventory.dc.html) | 1440 x 2260 | `Documentation, not an application route` | Reference inventory | All 27 artboards, desktop/tablet/mobile scope and excluded claims |
| 26 | [AdminDecisions.dc.html](evidence/design/AdminDecisions.dc.html) | 1440 x 1410 | `Documentation, not an application route` | Reference decisions D1-D10 | Recommended/built/sign-off positions; verify each against actual source |
| 27 | [AdminDeps.dc.html](evidence/design/AdminDeps.dc.html) | 1440 x 1510 | `Documentation, not an application route` | Reference dependencies | Existing contracts vs new backend work and owner policy decisions |

## Coverage constraints

- Dedicated tablet designs exist only for Overview and Library at 834px. Dedicated mobile designs exist only for Review, Approval, Writing and Support at 390px.
- Other journeys still need responsive implementation and tests, using their approved components and explicit owner decisions for missing interaction details; do not invent extra features.
- Overview/Library share one state board. Other journey state boards are component specifications, not URLs that should display fabricated records in authenticated mode.
- Approval and unpublish confirmations, failed saves, stale revisions and concurrent edits are distinct states. A static success drawing does not authorize or prove a write.
- Reference map/inventory/decisions/dependencies are handoff material, not application screens.
- The design only sketches library rows and sort controls; page size, pagination UI, persistence and cursor/offset contract need specification.
- Displayed hashes such as a3f9c1e are abbreviated sample labels. Backend requests and evidence must use complete validated cryptographic identities.

## Selected visually checked reference captures

- [Overview, 1440px](evidence/screenshots/Overview.dc.html.png)
- [Question library, 1440px](evidence/screenshots/Library.dc.html.png)
- [Human approval, 390px](evidence/screenshots/ApproveMobile.dc.html.png)
- [Writing review, 390px](evidence/screenshots/WritingMobile.dc.html.png)

These are references, not implementation comparisons. Other raw captures include prototype transition/blank failures and are segregated under unverified-captures. They are not visual-acceptance evidence.
