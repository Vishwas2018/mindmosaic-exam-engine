# MindMosaic Authentication Cross-Browser & Multi-Viewport Results (2026-11-23)

- **Target Deployment:** `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`
- **Final SHA:** `db65f78c62d96ee7a9c7774a31d5b2accd47a12e` (`dpl_CyLHacwwUYPfjdT63F523W3iL4Jp`)
- **Spec Executed:** `e2e/hosted/auth-audit/04-cross-browser-resilience.spec.ts` (`XBR-01`)
- **Scenarios Verified per Browser / Viewport:**
  1. `/sign-up` horizontal overflow check (`scrollWidth - clientWidth <= 2px`)
  2. `/sign-in` role chooser -> `?role=parent` URL persistence across full page reload
  3. Offline network interruption (`context.setOffline(true)`) during sign-in -> friendly network error (`#auth-error`) -> reconnect (`context.setOffline(false)`) -> retry sign-in succeeds and lands on `/parent`
  4. Parent child provisioning API (`POST /api/parent/children`)
  5. Logout via `ParentAccountMenu` -> `/signed-out` -> post-logout `/parent` access denied (redirected to `/sign-in` / `/session-expired`)
  6. Student 8-char login code + 6-digit PIN pad entry on `/student-sign-in` -> lands on `/student`

---

## Results Matrix (Two Consecutive Regression Cycles on SHA `db65f78c`)

| Browser Engine | Viewport / Profile | Cycle 1 (Round 6) Run ID | Cycle 1 Result | Cycle 1 Duration | Cycle 2 (Round 7) Run ID | Cycle 2 Result | Cycle 2 Duration |
|---|---|---|---|---|---|---|---|
| **Chromium** | Desktop `1440×900` | `rmwswgmo4` | **PASS** | 37.6s | `rmwswo3kt` | **PASS** | 28.7s |
| **Chromium** | Tablet `834×1112` (touch) | `rmwswgmo4` | **PASS** | 27.9s | `rmwswo3kt` | **PASS** | 23.2s |
| **Chromium** | Mobile `390×844` (touch, 3x DPR) | `rmwswgmo4` | **PASS** | 25.5s | `rmwswo3kt` | **PASS** | 25.9s |
| **Firefox** | Desktop `1440×900` | `rmwswjor2` | **PASS** | 43.8s | `rmwswr5i6` | **PASS** | 49.1s |
| **WebKit (Safari)** | Desktop `1440×900` | `rmwswlf2l` | **PASS** | 29.1s | `rmwswszu0` | **PASS** | 27.9s |

**Total Cross-Browser Executions on Final SHA:** **10 / 10 PASSED (0 failures, 0 flakes).**

---

## Browser-Specific Notes & Harness Observations

1. **Firefox (`NS_BINDING_ABORTED` resolved in Round 4):** Issuing `page.goto("/parent")` immediately after clicking Sign out while Next.js `router.refresh()` was still in flight caused Firefox to abort the navigation (`NS_BINDING_ABORTED`). Waiting for the `/signed-out` URL to settle before testing post-logout `/parent` access resolved this cleanly; Firefox passed 2/2 consecutive cycles.
2. **WebKit (Playwright Windows `route.fulfill` 307 hang):** On Windows Playwright WebKit, `page.goto("/parent")` hangs when the Vercel bypass `context.route` fulfills an HTTP `307` redirect response. Verified the exact `307` redirect (`Location: /sign-in?next=%2Fparent`) directly via `page.request.get("/parent", { maxRedirects: 0 })` on WebKit; all UI flows (sign-up layout, offline recovery, parent sign-in, logout, student PIN pad sign-in) ran in the live WebKit browser and passed 2/2 consecutive cycles.
3. **Mobile & Tablet Layout:** Zero horizontal overflow (`<= 2px`) on `/sign-up`, `/sign-in`, and `/student-sign-in` across `390×844` and `834×1112`; all 6 PIN pad inputs, checkboxes, and submit buttons remained visible and operable with touch emulation.
