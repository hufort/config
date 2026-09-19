---
name: commit-like-me
description: Reviews changes, groups them into atomic commits, and stages and commits them using scoped Conventional Commit messages. Use when asked to commit changes or write, draft, or revise commit messages. Defaults to committing; --draft or an explicit request for messages only proposes commits without staging or committing.
---

# Commit Like Me

Review the requested changes, choose atomic commit boundaries, and stage and commit them by default. Apply the message rules below to each commit.

## Modes

- `/skill:commit-like-me`: inspect the working tree and create atomic commits for the requested scope. If no scope is specified, consider all staged, unstaged, and untracked changes; do not blindly include generated files, secrets, or unrelated artifacts.
- `/skill:commit-like-me --draft`: propose commit boundaries and messages only. Do not modify files, the index, or history, and do not run checks that modify files.
- An explicit request to only write, draft, revise, or preview messages also selects draft mode. Merely discussing or editing this skill does not authorize committing.

`--draft` is an instruction passed as a skill argument, not a Pi CLI flag. Respect any narrower scope or already-decided boundaries supplied by the user.

This is a personal preference layer, not a project standard. Before applying it, check any explicit commit-message convention in the repository's checked-in guidance, such as `AGENTS.md`, `CLAUDE.md`, or contributing documentation. If that convention conflicts with this skill, surface the conflict and ask the user which should govern this repository. Do not silently choose either format.

## Workflow

1. Read applicable repository guidance. Inspect `git status`, staged and unstaged diffs, and relevant untracked files; do not assume all changes were made in this session.
2. Prefer very small commits: typically the smallest coherent change a human reviewer can understand on its own. Slice changes into an easy-to-follow narrative, introducing foundations before their consumers. For example, add a function's implementation and focused tests in one commit, then wire it into its callsites in a subsequent commit. Temporarily unused code is acceptable when a later planned commit uses it, provided it passes the repository's checks. Keep each commit green: do not introduce broken references, failing tests, or lint/type errors between commits. Include tests and documentation needed to keep each slice correct, but do not bundle an entire feature merely to keep implementation and integration together. Split by reviewable concept, not mechanically by file or directory.
3. If scope, intent, or existing staged changes are ambiguous, ask one concise clarifying question. Preserve unrelated work and existing staging; do not reset the index or discard changes to simplify the task.
4. Draft and validate each message against the rules below. In draft mode, stop here and return the proposed commits in order, identifying their files or hunks and placing each message in a plain-text fenced block. For a single already-decided message, return only that block.
5. In default mode, briefly state the intended commit sequence and its narrative. Validate each proposed commit's actual snapshot with relevant repository checks, not just the final working tree: later uncommitted changes must not mask a broken intermediate commit. Use an isolated temporary checkout or equivalent non-destructive approach when needed, preserving the user's working tree and index. Report failures and stop or revise the slicing rather than bypassing hooks or silently committing failing changes. If checks modify files, inspect those changes before staging them.
6. Stage only the paths or hunks belonging to the next commit. Review the complete staged diff and check it for whitespace errors before committing. If unrelated pre-staged work prevents isolating the commit without disturbing the user's index, ask before proceeding.
7. Run `git commit` with the validated message, then inspect the resulting commit and remaining status. Repeat for each planned commit. Do not amend, rewrite history, push, or disable hooks unless explicitly requested.
8. Return a concise summary of created commit hashes and subjects, checks run, and any remaining changes. If a commit fails, report it accurately; do not claim the plan was completed.

## Subject

Use this exact shape:

```text
type(scope): description
```

- `type` must be exactly one of: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `chore`, `build`, `docs`.
- `scope` is always required. Never emit a bare `type:` subject.
- Name the touched codebase area: a short, lowercase directory, module, feature, or component name with no spaces.
- Start the description lowercase, except when a proper noun or code entity requires its native casing.
- Preserve native casing for code entities such as function, variable, and prop names.
- Use imperative mood by default: `recenter`, `handle`, or `extract`, not `recenters`, `handled`, or `extraction of`.
- Keep the entire subject at or below 70 characters.
- Do not end with a period.
- Describe the change itself, not its ticket or task.
- Never include a Linear ID, issue number, or task label in the subject.

## Body

Omit the body for simple, self-evident commits. Include it only when a future reader would otherwise lack important context about why the change was made.

When present:

- Write one short paragraph of at most about three sentences. Do not use bullets.
- Lead with the reason for the change.
- Include only enough of the mechanism or concept to make the reason understandable.
- Do not restate diff-visible details such as exact values or file and line counts.
- A more casual, human voice is welcome here than in the terse imperative subject.
- Do not narrate lint, formatting, or tooling side effects.
- State a breaking change as a plain sentence in the body, following repository convention. Do not use a `BREAKING CHANGE:` footer.

## References

Justify references; do not reach for them by default.

- Never mention Linear tickets, task IDs, slices, stack positions, or other transient project-management bookkeeping.
- Reference a merged pull request by number only when the commit genuinely cannot stand on its own without that pointer.
- Prefer durable narrative context over a pull-request reference. For example, write `a prior line-height change fixed wrapped-line spacing, but...` instead of `see #1702`.
- Do not add a reference merely because one exists.

## Examples

Good, with no body needed:

```text
fix(dm-preferences): handle nil group in preference check
```

```text
refactor(errors): extract ErrorAlert helper from repeated markup
```

Good, with a body that earns its place:

```text
fix(message-input): recenter placeholder after line-height adjustment

A prior line-height change fixed spacing between wrapped lines in multi-line messages, but the input's padding was never adjusted to match, leaving single-line text sitting too high in the box.
```

Bad—scope is missing:

```text
feat: add DM preference toggle
```

Corrected:

```text
feat(chat-settings): add DM preference toggle
```

Bad—the body uses a brittle reference and restates diff mechanics:

```text
fix(message-input): center placeholder vertically

The line-height fix in #1702 (32px → 24px, to match Figma spec and fix wrapped-line spacing) left vertical padding tuned for the old line-height, so single-line text no longer filled the box height and sat too high.
```
