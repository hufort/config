---
name: atomic-commit
description: Reviews the working tree, groups changes into a sequence of atomic commits, and stages and commits them by default, using commit-like-me's message rules. Use when asked to commit changes as multiple atomic commits or to split a diff into a reviewable commit sequence. Defaults to committing; --draft or an explicit request for messages only proposes commit boundaries and messages without staging or committing.
allowed-tools:
  - Bash(git status*)
  - Bash(git diff*)
  - Bash(git log*)
  - Bash(git show*)
  - Bash(git add*)
  - Bash(git commit*)
  - Bash(git stash*)
---

# Atomic Commit

Review the requested changes, choose atomic commit boundaries, and stage and commit them by default. This skill covers how to split and sequence the commits; for the shape of each individual commit message (subject, body, references), follow the `commit-like-me` skill.

## Modes

- Default: inspect the working tree and create atomic commits for the requested scope. If no scope is specified, consider all staged, unstaged, and untracked changes; do not blindly include generated files, secrets, or unrelated artifacts.
- `--draft`: propose commit boundaries and messages only. Do not modify files, the index, or history, and do not run checks that modify files.
- An explicit request to only write, draft, revise, or preview messages also selects draft mode. Merely discussing or editing this skill does not authorize committing.

`--draft` is an instruction passed as an argument, not a CLI flag. Respect any narrower scope or already-decided boundaries supplied by the user.

This is a personal preference layer, not a project standard. Before applying it, check any explicit commit-message or commit-granularity convention in the repository's checked-in guidance, such as `AGENTS.md`, `CLAUDE.md`, or contributing documentation. If that convention conflicts with this skill, surface the conflict and ask the user which should govern this repository. Do not silently choose either format.

## Workflow

1. Read applicable repository guidance. Inspect `git status`, staged and unstaged diffs, and relevant untracked files; do not assume all changes were made in this session.
2. Prefer very small commits: typically the smallest coherent change a human reviewer can understand on its own. Slice changes into an easy-to-follow narrative, introducing foundations before their consumers. For example, add a function's implementation and focused tests in one commit, then wire it into its callsites in a subsequent commit. Temporarily unused code is acceptable when a later planned commit uses it, provided it passes the repository's checks. Keep each commit green: do not introduce broken references, failing tests, or lint/type errors between commits. Include tests and documentation needed to keep each slice correct, but do not bundle an entire feature merely to keep implementation and integration together. Split by reviewable concept, not mechanically by file or directory.
3. If scope, intent, or existing staged changes are ambiguous, ask one concise clarifying question. Preserve unrelated work and existing staging; do not reset the index or discard changes to simplify the task.
4. Draft each commit's message using the `commit-like-me` rules (subject, body, references). In draft mode, stop here and return the proposed commits in order, identifying their files or hunks and placing each message in a plain-text fenced block. For a single already-decided message, return only that block.
5. In default mode, briefly state the intended commit sequence and its narrative. Validate each proposed commit's actual snapshot with relevant repository checks, not just the final working tree: later uncommitted changes must not mask a broken intermediate commit. Use an isolated temporary checkout or equivalent non-destructive approach when needed, preserving the user's working tree and index. Report failures and stop or revise the slicing rather than bypassing hooks or silently committing failing changes. If checks modify files, inspect those changes before staging them.
6. Stage only the paths or hunks belonging to the next commit. Review the complete staged diff and check it for whitespace errors before committing. If unrelated pre-staged work prevents isolating the commit without disturbing the user's index, ask before proceeding.
7. Run `git commit` with the validated message, then inspect the resulting commit and remaining status. Repeat for each planned commit. Do not amend, rewrite history, push, or disable hooks unless explicitly requested.
8. Return a concise summary of created commit hashes and subjects, checks run, and any remaining changes. If a commit fails, report it accurately; do not claim the plan was completed.
