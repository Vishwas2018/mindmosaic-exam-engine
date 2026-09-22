# MindMosaic Repository Instructions

## Product

MindMosaic is a Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice portal.

All practice questions must be original. Never copy official NAPLAN, ICAS, textbook, website, or commercial questions.

## Architecture

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Zod schemas
- Zustand for client exam state
- Pure scoring functions outside React components
- Structured visual JSON rendered deterministically as HTML or SVG
- No arbitrary unsanitised SVG
- No API keys in browser code

## Quality Rules

Before committing, run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Use accessible semantic HTML.

Keep question rendering separate from visual rendering.

Do not hard-code exam-specific logic into general UI components.

Commit in small, verified increments.

## Git Safety

- Do not work directly on another agent's active branch.
- Never use `git reset --hard` on work that may need to be retained.
- Do not use `git clean` without explicit approval.
- Do not commit `.env*`, secrets, generated test output, or build directories.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
