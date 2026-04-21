---
name: ui-designer
description: Generate standalone HTML mockups matching the project's design system. Saves to packages/web/public/mockups/ and updates manifest.json for the viewer page.
user_invocable: true
---

# /ui-designer — HTML Mockup Generator

Generate self-contained HTML mockups that match the Irodori TTS project's design system.

## Interaction Rules

- When presenting the user with a choice between multiple options, use the `AskUserQuestion` tool instead of asking in free-form text.

## Workflow

1. **Hearing**: If the user specifies what to mock up, use that. Otherwise, ask what component/page they want to prototype.
2. **Research**: Read the current implementation of the target component/page if it exists (check `packages/web/app/` and `packages/web/components/`). Read `packages/web/app/globals.css` to confirm current color tokens.
3. **Generate**: Create the HTML mockup following the template below.
4. **Save**: Write to `packages/web/public/mockups/{name}.html`.
5. **Manifest**: Update `packages/web/public/mockups/manifest.json` — append or update the entry.
6. **Report**: Tell the user the filename and summarize the design decisions. Remind them to view at `/mockups` in the web app.

## HTML Template

Every mockup MUST follow this exact structure:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Geist', 'sans-serif'] },
          colors: {
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            card: 'var(--card)',
            'card-foreground': 'var(--card-foreground)',
            primary: 'var(--primary)',
            'primary-foreground': 'var(--primary-foreground)',
            secondary: 'var(--secondary)',
            'secondary-foreground': 'var(--secondary-foreground)',
            muted: 'var(--muted)',
            'muted-foreground': 'var(--muted-foreground)',
            accent: 'var(--accent)',
            'accent-foreground': 'var(--accent-foreground)',
            destructive: 'var(--destructive)',
            border: 'var(--border)',
            input: 'var(--input)',
            ring: 'var(--ring)',
          }
        }
      }
    }
  </script>
  <style>
    :root {
      --background: oklch(0.985 0 0);
      --foreground: oklch(0.25 0 0);
      --card: oklch(0.995 0 0);
      --card-foreground: oklch(0.25 0 0);
      --primary: oklch(0.45 0.20 265);
      --primary-foreground: oklch(0.98 0 0);
      --secondary: oklch(0.96 0 0);
      --secondary-foreground: oklch(0.30 0 0);
      --muted: oklch(0.96 0 0);
      --muted-foreground: oklch(0.556 0 0);
      --accent: oklch(0.96 0 0);
      --accent-foreground: oklch(0.30 0 0);
      --destructive: oklch(0.577 0.245 27.325);
      --border: oklch(0.912 0 0);
      --input: oklch(0.912 0 0);
      --ring: oklch(0.45 0.20 265);
    }
    .dark {
      --background: oklch(0.18 0 0);
      --foreground: oklch(0.88 0 0);
      --card: oklch(0.22 0 0);
      --card-foreground: oklch(0.88 0 0);
      --primary: oklch(0.70 0.18 265);
      --primary-foreground: oklch(0.15 0 0);
      --secondary: oklch(0.28 0 0);
      --secondary-foreground: oklch(0.88 0 0);
      --muted: oklch(0.28 0 0);
      --muted-foreground: oklch(0.65 0 0);
      --accent: oklch(0.28 0 0);
      --accent-foreground: oklch(0.88 0 0);
      --destructive: oklch(0.704 0.191 22.216);
      --border: oklch(0.90 0 0 / 10%);
      --input: oklch(0.90 0 0 / 15%);
      --ring: oklch(0.70 0.18 265);
    }
    body { font-family: 'Geist', sans-serif; background: var(--background); color: var(--foreground); }
  </style>
</head>
<body>
  <!-- mockup content here -->
</body>
</html>
```

## Manifest Format

The file `packages/web/public/mockups/manifest.json` is a JSON array:

```json
[
  {
    "name": "character-detail-v2",
    "title": "キャラクター詳細 v2",
    "description": "キャラクター詳細ページの新デザイン案",
    "file": "character-detail-v2.html",
    "createdAt": "2026-04-21T12:00:00Z"
  }
]
```

Fields:
- `name`: kebab-case identifier (also the filename stem)
- `title`: Japanese display title
- `description`: Brief description of what the mockup shows
- `file`: filename relative to `/mockups/`
- `createdAt`: ISO 8601 timestamp

## Design Guidelines

- Use the project's color tokens via CSS variables — never hardcode colors
- Follow shadcn/ui visual patterns: `rounded-xl` cards, `ring-1 ring-foreground/10` borders, `0.625rem` radius
- Use Tailwind utility classes exclusively — no custom CSS beyond the color variables
- Support both light and dark modes via the `.dark` class on `<html>`
- Use Japanese text for labels and placeholder content
- Design responsively for 375px (mobile), 768px (tablet), and 1280px (desktop) viewports
- Match shadcn/ui base-nova style for badges, buttons, cards, inputs, and selects

## Constraints

- Never modify existing source code in `packages/web/app/` or `packages/web/components/`
- Mockups are design artifacts only — they do not affect the running application
- Keep HTML files under 500 lines for readability
- Use `const` instead of `let` in any inline `<script>` blocks
- All communication with the user should be in Japanese (日本語)