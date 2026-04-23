---
name: refactor
description: Plans and applies behavior-preserving refactors for Bun + TypeScript + Discord.js code. Focuses on extraction, deduplication, decomposition, and type safety.
user_invocable: true
---

# /refactor - Refactoring Command

Apply scoped refactors that improve maintainability without changing intended behavior.

## Interaction Rules

- When presenting the user with a choice between multiple options, use the `AskUserQuestion` tool instead of asking in free-form text.

## Goals

- Reduce duplication
- Extract cohesive helpers
- Split overly large modules
- Improve naming and local structure
- Strengthen type safety
- Keep runtime behavior stable unless the user explicitly requests behavior changes

## Repository Rules

- Prefer existing helpers and patterns over new abstractions
- Use Zod schemas for parsing and prefer `safeParse` when validation is needed
- Place new schemas under `src/schemas/**.dto.ts` with PascalCase names
- Do not add meaningless `JSON.parse()` / `JSON.stringify()` round-trips
- Do not use heredoc for templating; use Handlebars templates instead
- Replace `z.string().min(1)` / `z.array().min(1)` with `.nonempty()`
- Replace `z.string().uuid()` / `z.string().url()` with `z.uuid()` / `z.url()`
- Keep log messages in English and source-code comments in Japanese

## Hook / Automated Checks

Treat the following as hook- or automation-friendly checks:

- `bunx tsc -b --noEmit`
- `bun run lint` (`biome check packages/`)
- Ban `while`, `let`, and `var`
- Ban `any`, `unknown`, and `as`
- Flag `.tsx` files with 200 or more lines

## Frontend Rules

Apply these rules when the scope includes React / TSX:

- Do not call `fetch` directly; access the backend through the Zodios client
- Use TanStack Query and prefer `useSuspenseQuery`
- Show loading UI through Suspense fallback when `useSuspenseQuery` is used
- Do not leave `.tsx` files at 200 lines or more; split them into components, hooks, or helpers

## Workflow

### Step 1: Confirm Scope

If the user did not name a file, module, or symptom, ask which scope should be refactored first.

### Step 2: Load Context

Read:

- The target files
- Their direct callers
- Related tests, if they exist
- `CLAUDE.md`
- `.github/copilot-instructions.md`

Also load these skills when relevant:

- `.claude/skills/typescript/SKILL.md`
- `.claude/skills/bun/SKILL.md`
- `.claude/skills/discord-js/SKILL.md`
- `.claude/skills/tanstack-query-best-practices/SKILL.md` when frontend data fetching is involved

### Step 3: Choose Refactor Type

Prefer one or more of the following:

- Extract helper/function
- Deduplicate repeated logic
- Tighten types
- Decompose a large module
- Clarify naming
- Isolate side effects

Avoid turning a refactor request into a feature change unless the user explicitly asks for that.

### Step 4: Execute

- If automated checks or scans find forbidden patterns in scope, fix them first
- Apply the smallest coherent patch
- Preserve public interfaces and behavior by default
- Do not add broad catches or success-shaped fallbacks
- Remove forbidden patterns found in scope, including raw `fetch`, redundant JSON round-trips, heredoc templating, and oversized `.tsx` files

### Step 5: Verify

Finish only when these checks are clean:

```sh
bunx tsc -b --noEmit
bun run lint
```

### Step 6: Report

Respond in Japanese with:

- The files changed
- The kind of refactor performed
- The forbidden patterns that were removed or confirmed absent
- Any behavior-sensitive areas that were intentionally preserved
