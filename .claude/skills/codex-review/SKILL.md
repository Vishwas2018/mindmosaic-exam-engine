---
name: codex-review
description: Request an independent read-only Codex review for a human-screened MindMosaic change.
user-invocable: true
disable-model-invocation: true
argument-hint: "[focus]"
---

# Codex review

Run only on the user's explicit request. The reviewer can use only the screened
text supplied on stdin. The official Codex plugin is installed separately and
disabled in this project because its repository and delegation commands can
expose a larger workspace.

1. Verify `codex --version` and `codex login status`. On Windows use `codex.cmd`.
2. List tracked, staged and untracked changed paths. Prepare a bounded UTF-8
   snapshot in a private scratch location from the relevant hunks or source
   files only. Include filenames and line numbers when possible.
3. Inspect the exact snapshot line by line before transmission. Keep credentials,
   environment values, auth files, student or parent personal data, real records,
   transcripts, logs, dumped data and generated artefacts out of the snapshot.
   If in doubt omit the material and explain the gap. The script's local checks
   are a backstop and cannot identify arbitrary personal data.
4. Run `node .claude/scripts/codex-review.mjs --screened-snapshot <file>`.
5. Verify each finding against the worktree. Report confirmed findings and
   rejected candidates with reasons. Repeat a review only on request.
