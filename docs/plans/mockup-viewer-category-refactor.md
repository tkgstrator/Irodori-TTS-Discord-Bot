# Work Plan: Mockup Viewer Category Refactor
Date: 2026-04-21

## Goal
Refactor the mockup viewer page so that mockups are organized by category with version selection, instead of a flat vertical list. Users should be able to select a category first, then browse/compare versions within that category.

## Tasks

### Frontend
- [x] Add `category` field to all 20 entries in `manifest.json`
- [x] Update `MockupEntry` type to include `category` field
- [x] Define `CATEGORIES` constant mapping category IDs to Japanese display labels
- [x] Refactor left sidebar to show categories (accordion or vertical tabs) instead of flat list
- [x] Within each category section, show version cards (desktop + mobile A/B/C)
- [x] Auto-select first version when a category is clicked
- [x] Constrain compare mode to versions within the same category
- [x] Reset secondary selection when active category changes
- [x] Preserve existing features: viewport toggle, dark mode, compare mode

### QA
- [x] Run `bunx tsc -b --noEmit` (type check)
- [x] Run `bunx biome check --write` (lint + format)
- [x] Run `bun run build` (build all workspaces)
- [x] Commit changes

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
