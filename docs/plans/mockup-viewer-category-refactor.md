# Work Plan: Mockup Viewer Category Refactor
Date: 2026-04-21

## Goal
Refactor the mockup viewer page so that mockups are organized by category with version selection, instead of a flat vertical list. Users should be able to select a category first, then browse/compare versions within that category.

## Tasks

### Frontend
- [ ] Add `category` field to all 20 entries in `manifest.json`
- [ ] Update `MockupEntry` type to include `category` field
- [ ] Define `CATEGORIES` constant mapping category IDs to Japanese display labels
- [ ] Refactor left sidebar to show categories (accordion or vertical tabs) instead of flat list
- [ ] Within each category section, show version cards (desktop + mobile A/B/C)
- [ ] Auto-select first version when a category is clicked
- [ ] Constrain compare mode to versions within the same category
- [ ] Reset secondary selection when active category changes
- [ ] Preserve existing features: viewport toggle, dark mode, compare mode

### QA
- [ ] Run `bunx tsc -b --noEmit` (type check)
- [ ] Run `bunx biome check --write` (lint + format)
- [ ] Run `bun run build` (build all workspaces)
- [ ] Commit changes

## Execution Order
1. Frontend: manifest.json update + page.tsx refactor
2. QA: type check, lint, build, commit

## Deliverables
- `packages/web/public/mockups/manifest.json`: category field added to all entries
- `packages/web/app/(dashboard)/mockups/page.tsx`: category-based UI with version selection

## Risks / Notes
- No backend changes needed — purely frontend
- Compare mode scoped to within-category makes the most sense for version comparison
- The 5 categories: ダッシュボード, キャラクター一覧, キャラクター編集, シナリオ編集, 相関図
