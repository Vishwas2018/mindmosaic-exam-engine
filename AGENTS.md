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
