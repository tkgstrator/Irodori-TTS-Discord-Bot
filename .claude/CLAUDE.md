# Conventions for `.claude/` Markdown Files

## Authoring Agents and Skills

When creating or updating agent definitions (`.claude/agents/*.md`) or skill files (`.claude/skills/**/SKILL.md`), always include the following interaction rule:

> When presenting the user with a choice between multiple options, use the `AskUserQuestion` tool instead of asking in free-form text.

For **agents**, add this as a bullet in the `## Constraints` section.
For **skills**, add a `## Interaction Rules` section near the top of the document body (after the title).

### Why

Free-form "which do you prefer, A/B/C?" text is easy to overlook. `AskUserQuestion` renders a structured prompt that the user can answer with a single click, reducing friction and preventing ambiguity.
