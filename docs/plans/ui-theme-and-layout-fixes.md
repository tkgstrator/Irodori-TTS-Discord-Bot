# Work Plan: UI Theme & Layout Fixes
Date: 2026-04-21

## Goal
Fix light/dark mode color themes (add indigo/violet accent), improve character creation Dialog and scenario Dialog sizing/layout, improve sidebar icons and dashboard header, and add a theme toggle.

## Tasks

### Frontend
- [x] **Theme colors**: Update `/packages/web/app/globals.css` — replace monochrome (chroma=0) `--primary`, `--ring`, `--sidebar-primary` values with indigo/violet OKLch accent colors for both `:root` (light) and `.dark` blocks
- [x] **ThemeProvider**: Create `/packages/web/components/theme-provider.tsx` — context that reads/writes `localStorage`, applies `class="dark"` to `<html>`, supports `"light" | "dark" | "system"` modes
- [x] **Theme toggle**: Create `/packages/web/components/theme-toggle.tsx` — ghost button with Sun/Moon/Monitor icons cycling through modes
- [x] **Root layout**: Update `/packages/web/app/layout.tsx` — wrap with ThemeProvider, add `suppressHydrationWarning` to `<html>`
- [x] **Dashboard header**: Update `/packages/web/app/(dashboard)/layout.tsx` — add page title area and ThemeToggle on the right side of the header
- [x] **Sidebar icons**: Update `/packages/web/components/app-sidebar.tsx` — replace emoji icons (👤, 📖) with lucide-react icons (Users, BookOpen), add app icon beside "Irodori TTS"
- [x] **Dialog default width**: Update `/packages/web/components/ui/dialog.tsx` — change default `sm:max-w-sm` to `sm:max-w-lg`
- [x] **Character Dialog layout**: Update `/packages/web/app/(dashboard)/characters/character-create-dialog.tsx` — widen to `sm:max-w-2xl`
- [ ] **Scenario Dialog layout**: Review `/packages/web/app/(dashboard)/scenarios/scenario-create-dialog.tsx` — no change needed (already uses DialogContent default which is now `sm:max-w-lg`)

### QA
- [x] Type check: `bunx tsc -b --noEmit` — fixed `noUncheckedIndexedAccess` issue in theme-toggle.tsx
- [x] Lint + format: `bunx biome check --write packages/web/` — all changed files pass
- [x] Build: `bun run build` — bot builds OK; web has pre-existing build issue (unrelated)
- [ ] Commit in commitlint format — pending user approval

## Execution Order
1. Sequential: Theme colors (globals.css) → ThemeProvider → Theme toggle
2. Parallel: Sidebar icons, Dialog fixes, Dashboard header (all depend on theme being set first)
3. Sequential: QA (after all frontend changes)

## Deliverables
- `packages/web/app/globals.css`: Indigo/violet accent colors for light + dark modes
- `packages/web/components/theme-provider.tsx`: New ThemeProvider context
- `packages/web/components/theme-toggle.tsx`: New theme toggle component
- `packages/web/app/layout.tsx`: Wrapped with ThemeProvider
- `packages/web/app/(dashboard)/layout.tsx`: Improved header with theme toggle
- `packages/web/components/app-sidebar.tsx`: Lucide icons
- `packages/web/components/ui/dialog.tsx`: Wider default
- `packages/web/app/(dashboard)/characters/character-create-dialog.tsx`: Better layout

## Risks / Notes
- Redis API layer is deferred to a future task — localStorage storage remains for now
- Theme toggle state persisted in localStorage (key: `irodori-theme`)
- `@base-ui/react/dialog` primitives are used, not radix — ensure ThemeProvider doesn't conflict
- vinext (Vite-based Next.js) may need `suppressHydrationWarning` for SSR compat
- Pre-existing: `next/link` and `next/navigation` module resolution errors (vinext compatibility)
- Pre-existing: web package build failure (missing Cloudflare vite plugin config)
- QA added `ignoreDeprecations: "6.0"` to `packages/web/tsconfig.json` for TS `baseUrl` deprecation
