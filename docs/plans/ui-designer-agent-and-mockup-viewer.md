# Work Plan: UI Designer Agent & Mockup Viewer
Date: 2026-04-21

## Goal
Create a UI Designer agent that generates standalone HTML mockups, and build a mockup viewer/comparison page in the Vinext web app.

## Tasks

### Leader (Agent Definition)
- [x] Create `.claude/agents/ui-designer.md` — agent that generates self-contained HTML mockups with Tailwind CDN and project color tokens, saves to `packages/web/public/mockups/`, and updates manifest.json

### Frontend
- [x] Create `packages/web/public/mockups/` directory with initial `manifest.json` (empty array)
- [x] Create mockup viewer page: `packages/web/app/(dashboard)/mockups/page.tsx`
  - Fetch `/mockups/manifest.json` to list available mockups
  - Render selected mockup in iframe with resizable viewport
  - Side-by-side comparison mode (select two mockups)
  - Dark mode toggle for iframe content (inject `.dark` class)
  - Responsive viewport presets (mobile 375px / tablet 768px / desktop 1280px)
- [x] Update `packages/web/components/app-sidebar.tsx` — add "モック" nav item with `Palette` icon under new "ツール" group
- [x] Update `packages/web/app/(dashboard)/layout.tsx` — add `/mockups` to PAGE_TITLES

### QA
- [x] Type check: `bunx tsc -b --noEmit` — changed files clean (pre-existing errors only)
- [x] Lint + format: `bunx biome check --write packages/web/` — all changed files pass
- [x] Commit: `74fce49`

## Deliverables
- `.claude/agents/ui-designer.md`: New agent definition
- `packages/web/public/mockups/manifest.json`: Mockup index file
- `packages/web/app/(dashboard)/mockups/page.tsx`: Viewer/comparison page
- `packages/web/components/app-sidebar.tsx`: Updated nav with "管理" + "ツール" groups
- `packages/web/app/(dashboard)/layout.tsx`: Updated page titles
