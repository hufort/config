---
name: commit-like-me
description: Draft a single git commit message in Hugh's personal style — required scope, imperative subject, minimal-but-sufficient why-focused body, no PM-tool references unless the commit can't stand without one. Use whenever proposing, drafting, or revising a commit message for a commit that's ready to make. Not for grouping a diff into multiple atomic commits (see `atomic-commit`) or for splitting a branch into a stack (see `/stack`).
allowed-tools:
  - Bash(git diff*)
  - Bash(git log*)
  - Bash(git status*)
  - Bash(git show*)
---

Draft the commit message for a single, already-decided commit. This skill is only about the shape of that message — it has nothing to say about whether to split a branch into multiple commits, their order, or scoping work into slices. For grouping a diff into multiple atomic commits, use `atomic-commit` (which follows these same message rules); for splitting a branch into a stack, use `/stack`.

This is a personal preference layer, not a project standard. If the current repo's `CLAUDE.md` (or other checked-in convention) explicitly documents a different commit format that the team follows, don't silently override it — surface the conflict and ask which should win for this repo.

## Subject line

`type(scope): description`

- **Type** is one of: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `chore`, `build`, `docs`. Nothing else, nothing added.
- **Scope is required, always.** Never a bare `type:` — always `type(scope):`. This is a deliberate, permanent preference, not situational.
- Scope names the area of the codebase touched (a directory, module, feature, or component name) — short, lowercase, no spaces.
- Lowercase after the colon. No trailing period.
- Imperative mood by default (`recenter`, `handle`, `extract` — not `recenters`, `handled`, `extraction of`).
- ≤70 characters.
- Describes the change itself, not the ticket. Never lead with or embed a Linear ID, issue number, or task label in the subject.
- Capitalize proper nouns normally, and render code entities (function/variable/prop names, etc.) in their own native casing (`camelCase`, `snake_case`) rather than forcing sentence case on them.

## Body (optional)

Skip the body entirely for simple, self-evident commits — not every commit needs one. Include it when a future reader would otherwise lack context for *why* the change was made.

When present:

- One short paragraph, up to ~3 sentences. No bullet lists.
- Lead with the why. Include only the minimal amount of "what" needed to make that why legible — naming the mechanism/concept involved (e.g. "padding," "line-height," "the draft-save effect") is fine; restating diff-visible specifics (exact values, exact line/file counts) is not.
- Can carry more casual, human voice than the terse imperative subject — this is where personality is allowed to show.
- Never narrate lint/formatting/tooling side effects of the commit.
- Breaking changes: call it out as a plain sentence in the body (per repo `CLAUDE.md` convention) — no `BREAKING CHANGE:` footer.

## References — justify, don't reach

- **Never** reference Linear tickets, task IDs, "slices," stack positions, or other transient project-management bookkeeping in a commit message. The branch name and PR already carry that; the commit shouldn't.
- A merged PR *may* be referenced by number, but only when the commit genuinely doesn't stand on its own without that pointer. Default to describing prior context narratively instead (e.g. "a prior line-height change fixed wrapped-line spacing, but..." rather than "see #1702"). Don't add a reference just because one exists — that's reference fetish, and it makes the commit brittle (the referenced PR can be deleted, renumbered on a fork, etc.) while the narrative version stays legible forever.

## Worked examples

Good, no body needed:
```
fix(dm-preferences): handle nil group in preference check
```
```
refactor(errors): extract ErrorAlert helper from repeated markup
```

Good, body earns its place:
```
fix(message-input): recenter placeholder after line-height adjustment

A prior line-height change fixed spacing between wrapped lines in
multi-line messages, but the input's padding was never adjusted to
match, leaving single-line text sitting too high in the box.
```

Bad — missing a scope:
```
feat: add DM preference toggle
```
Fixed:
```
feat(chat-settings): add DM preference toggle
```

Bad — leaky/brittle reference and restates diff mechanics:
```
fix(message-input): center placeholder vertically

The line-height fix in #1702 (32px → 24px, to match Figma spec and fix
wrapped-line spacing) left vertical padding tuned for the old line-height,
so single-line text no longer filled the box height and sat too high.
```
