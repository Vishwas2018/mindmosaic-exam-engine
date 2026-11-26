# MindMosaic AI UAT Assistant — User Guide

> **Scope:** DEV & Preview environments only. Hard-disabled on Vercel production (`VERCEL_ENV=production`) and restricted to verified `admin` (active admin entitlement, with Admin MFA when it is switched on) or explicitly allowlisted tester sessions.

---

## 1. Getting Started Across Portals (Admin, Parent & Student)

1. **Activate your UAT session:** Sign in on MindMosaic DEV (`preview` deployment or `npm run dev`) with your **Admin** account (or an account listed in `MM_UAT_TESTER_USER_IDS` / `MM_UAT_TESTER_EMAILS`). If your organisation has switched on Admin MFA, complete the MFA step first: the UAT Assistant never bypasses it, and an admin session that has not passed MFA gets no UAT access at all.
2. **Floating Launcher:** A compact floating **Report Issue** bar appears in the bottom corner of every DEV page:
   - **Report Issue:** Opens the UAT capture dialog for the current screen.
   - **Clipboard count badge:** Opens the quick **UAT Defect Dashboard** modal showing open/retest counts without leaving your current page.
   - **Dock left/right toggle (`⇄`):** Moves the floating launcher to the opposite bottom corner if you need to inspect controls underneath it.
   - **End (`⏻`):** Ends your UAT session (see section 1a).
3. **Testing Student & Parent Portals:** Once you have visited any DEV page while signed in as **Admin**, MindMosaic sets a 4-hour `HttpOnly` HMAC-signed tester cookie (`mm_uat_tester`) in that browser. You can sign out or switch into any **Parent** or **Student** test account in the same browser and continue using **Report Issue** across `/parent/*`, `/student/*`, `/exam`, `/practice/*`, and `/results`. The cookie is re-checked against the account that created it on every request: if that administrator is revoked (or loses the admin entitlement) the assistant switches off on the very next page load, even while you are signed in as a Student or Parent.

### 1a. Ending your UAT session

Press **End** on the floating launcher and confirm. This:

- removes the tester cookie and switches the assistant off in this browser (it stays off after reloads and on every page);
- **keeps your saved defects** in this browser (export a JSON backup first if you want a copy);
- is reversible only on purpose: open **`/dev/uat`** and press **Start new UAT session**. Starting re-checks your entitlement (and Admin MFA) before issuing a fresh session.

End your session when you hand the device to someone else or finish a testing shift. Sessions also expire automatically after 4 hours.

---

## 2. Selecting an Element Safely

1. Select **Report Issue**, then select **Select element**.
2. Hover or tap over any UI element on the page:
   - A purple highlight frame previews the target element and its stable locator (`[data-testid="..."]`, `#id`, `role=...`, or deterministic CSS path).
   - **Zero side-effects:** A full-viewport capture shield and capture-phase event interceptors block clicks, pointer events, keyboard Enter/Space, and form submissions. Selecting an exam option, **Submit exam**, or an admin approval control **never** activates the underlying action.
3. Click or tap to lock in the element (or press `Esc` / **Cancel** to return without selecting).

---

## 3. Recording Observations by Voice or Text

- **Manual typing:** Enter your observation in **Your observation notes (preserved verbatim)**. Drafts auto-save to IndexedDB as you type so accidental refreshes or browser restarts do not lose your notes.
- **Voice dictation:** Select **Dictate by voice** (uses Web Speech API in `en-AU`). Speak naturally to append to your notes, then select **Stop dictation**.
  - If microphone permission is blocked, the assistant shows instructions to re-enable site microphone access while keeping manual typing active.
  - In browsers without Web Speech API support (e.g. Firefox desktop), a clear fallback badge confirms that manual typing is active.

---

## 4. Using "Improve with AI"

1. After recording your notes (and optionally selecting an element), select **Improve with AI**.
2. The server calls MindMosaic's configured AI provider (`QF_AI_PROVIDER=anthropic|openai|gemini`, or `MM_UAT_AI_PROVIDER`) using server-side credentials only.
3. AI populates editable fields:
   - **Defect title**
   - **Severity** (`Critical`, `High`, `Medium`, `Low`) & **Category** (`UI & visual`, `Functional`, `Accessibility`, `Question / content`, `Performance`, `Responsive / mobile`, `Auth & permissions`, `Other`)
   - **Description**
   - **Steps to reproduce**
   - **Actual result** & **Expected result**
4. **Grounded & editable:** AI is strictly instructed never to invent observations, console logs, or root causes beyond your verbatim notes and captured context. Your **original notes** remain permanently preserved alongside the structured report, and every field can be edited before or after saving.
5. **Offline / unconfigured fallback:** If no server AI key is configured in a local environment, the assistant automatically structures your report locally from your verbatim notes so your workflow is never blocked.

---

## 5. Optional Screenshots & Annotations

Inside **Screenshot & annotations (optional)**:
- **Layout snapshot:** Zero-permission, instant Canvas 2D wireframe snapshot of the current viewport with your selected element highlighted and sensitive fields redacted.
- **Capture tab:** Uses the browser Screen Capture API (`getDisplayMedia`) to grab a pixel frame of the current tab.
- **Upload / Paste (`Ctrl+V` / `Cmd+V`):** Attach any PNG, JPEG, or WebP screenshot directly from your clipboard or device.
- **Annotation toolbar:** Draw **Highlight boxes**, **Arrows**, **Freehand marks**, or **Redact mask (permanent)**, with **Undo**, **Clear marks**, and **Remove**.

> **Redaction is permanent.** A redact mask overwrites the covered pixels the moment you release the mouse and the unmasked frame is discarded. Only the already-redacted image is kept in the draft, in IndexedDB, in JSON exports and in anything sent to GitHub, so nobody can lift the hidden content back out of a saved file. Because of that, a redaction cannot be undone; if you covered the wrong area, press **Remove** and capture again. Highlight boxes, arrows and freehand marks can still be undone while you are editing. Redact anything sensitive (names, emails, codes, unpublished question text) **before** saving.

---

## 6. Defect Dashboard, Persistence & Exports

Open the dashboard from the floating count button on any page, or visit **`/dev/uat`** for the full-page workspace:

- **IndexedDB Persistence:** All defects, screenshots, and UAT test sessions persist locally in `mindmosaic_uat_assistant_v1` across browser restarts.
- **Triage Statuses:** Filter and transition defects across **Open**, **Fixed**, **Retest**, and **Closed**.
- **Search & Filter:** Filter by keyword (title, notes, route, ID, or locator), **Severity**, and **Category**.
- **Exports & Backups:**
  - **Export Markdown (`.md`) / Copy Markdown:** Produces a clean summary table and full per-defect sections ready for PR comments or documentation.
  - **Export JSON (`.json`) / Import JSON:** Full schema-validated (`zod`) backup and non-destructive merge across devices or browsers.

---

## 7. Optional GitHub Issue Creation

1. Select a defect in the dashboard and select **Create GitHub issue…**.
2. A mandatory **Confirm GitHub issue creation** dialog displays the target repository (`MM_UAT_GITHUB_REPO`), title, and full redacted Markdown body.
3. Tick the explicit confirmation checkbox and select **Confirm & create GitHub issue** (`POST /api/uat/github`).
   - Requires server-only `MM_UAT_GITHUB_TOKEN` (with Issues write permission). If unconfigured, use **Copy Markdown** in the same dialog to paste manually.

---

## 8. Environment Variables Reference (Server-Only)

| Variable | Purpose | Default |
|---|---|---|
| `MM_UAT_ASSISTANT_ENABLED` | Feature flag / kill switch (`1` enables in non-prod; `0` disables everywhere; ignored in `VERCEL_ENV=production`) | Enabled on `VERCEL_ENV=preview` & `next dev`; off elsewhere |
| `MM_UAT_TESTER_USER_IDS` | Optional comma-separated `auth.users` UUIDs allowed in addition to `role='admin'` | Empty |
| `MM_UAT_TESTER_EMAILS` | Optional comma-separated tester emails allowed in addition to `role='admin'` | Empty |
| `MM_UAT_SESSION_EPOCH` | Rotate (e.g. `1` → `2`) to invalidate every outstanding tester cookie at once | `0` |
| `MM_UAT_SESSION_SECRET` | Optional dedicated signing secret for the tester cookie (min 16 chars); otherwise derived from the service-role key | Derived |
| `MM_UAT_AI_PROVIDER` | Optional AI provider override (`anthropic`, `openai`, `gemini`) | Falls back to `QF_AI_PROVIDER` |
| `MM_UAT_GITHUB_TOKEN` | Optional server-only GitHub PAT for confirmed issue creation | Unset |
| `MM_UAT_GITHUB_REPO` | Target `owner/repo` for confirmed GitHub issues | `Vishwas2018/mindmosaic-exam-engine` |
