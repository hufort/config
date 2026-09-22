# Agents

Version-controlled agent harness configuration and personal agent assets.

Agent-related concerns live in this config repo for now because the current assets are personal configuration, not a reusable package. Keeping them next to the rest of the machine/bootstrap config makes setup and review straightforward. Split this into a dedicated repo only if these assets need an independent release lifecycle or need to be shared beyond this config.

## Layout

```text
agents/
├── shared/
│   └── skills/              # harness-agnostic Agent Skills, one dir per skill
└── pi/
    ├── package.json         # npm dependencies shared by Pi extensions
    ├── extensions/          # Pi TypeScript extensions
    ├── intercepted-commands/ # command shims used by extensions
    ├── skills/              # Pi-specific personal workflows
    └── prompts/             # Pi prompt templates, if/when needed
```

There's no top-level `claude/` or `codex/` directory yet — Claude Code needs no harness-specific assets beyond the symlinks described below. Add a harness-specific directory only when a concrete need appears; avoid creating empty taxonomy ahead of real usage. `shared/` exists because `commit-like-me` was independently duplicated for Pi and Claude Code and had drifted; see [Shared skills](#shared-skills).

## Shared skills

`agents/shared/skills/` holds skills used from more than one harness, written to the [Agent Skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md) standard (`name` + `description` frontmatter, directory name matching `name`) that both Claude Code and Pi implement natively. Keep the body of each `SKILL.md` harness-agnostic; only note an invocation-syntax difference (`/name` in Claude Code vs. `/skill:name` in Pi) if the skill text needs to reference its own invocation.

Each harness picks these up differently, since only Pi supports pointing settings at an arbitrary external path:

- **Pi**: a directory entry in `settings.json` (see [Pi setup](#pi-setup)) — Pi discovers every `SKILL.md` under it recursively, so new shared skills need no further settings changes.
- **Claude Code**: a symlink per skill into `~/.claude/skills/`, since Claude Code only scans that directory (and a project's `.claude/skills/`) and has no settings-driven external path list:

  ```bash
  ln -s /Users/hugh/Code/config/agents/shared/skills/<name> ~/.claude/skills/<name>
  ```

Current shared skills:

- **`commit-like-me`**: drafts the message for a single, already-decided commit — required-scope Conventional Commit subject, minimal why-focused body, no PM-tool references unless the commit can't stand without one. Message shape only; it has nothing to say about splitting a diff into multiple commits.
- **`atomic-commit`**: reviews the working tree, groups changes into a sequence of atomic commits, and stages and commits them by default (`--draft` previews boundaries and messages without touching the index or history). Defers to `commit-like-me`'s rules for each individual commit's message.

## Pi setup

Pi loads these files through Pi settings that point at this repo, rather than symlinks into `~/.pi/agent/extensions/`.

Add local extension and skill paths to `~/.pi/agent/settings.json`:

```json
{
  "extensions": [
    "/Users/hugh/Code/config/agents/pi/extensions/todos.ts",
    "/Users/hugh/Code/config/agents/pi/extensions/questions/index.ts",
    "/Users/hugh/Code/config/agents/pi/extensions/uv.ts",
    "/Users/hugh/Code/config/agents/pi/extensions/firecrawl.ts"
  ],
  "skills": [
    "/Users/hugh/Code/config/agents/pi/skills",
    "/Users/hugh/Code/config/agents/shared/skills"
  ]
}
```

`skills` entries can be individual skill directories or, as above, a parent directory — Pi discovers every `SKILL.md` under a listed directory recursively.

Install or refresh shared Pi extension dependencies after cloning:

```bash
cd ~/Code/config/agents/pi
npm install
```

After changing extension or skill files, reload Pi with `/reload` or restart Pi.

## Claude Code setup

Claude Code has no settings-driven external path list, so shared skills need a symlink each into `~/.claude/skills/` (see [Shared skills](#shared-skills)):

```bash
ln -s /Users/hugh/Code/config/agents/shared/skills/commit-like-me ~/.claude/skills/commit-like-me
ln -s /Users/hugh/Code/config/agents/shared/skills/atomic-commit ~/.claude/skills/atomic-commit
```

This is a manual bootstrap step, not managed by nix-darwin/home-manager — there's no other symlink-based dotfile management in this repo, so introducing one for two symlinks would be more machinery than the problem needs. Re-run the relevant `ln -s` after cloning on a new machine, or whenever a new shared skill is added.

### Todo extension

`agents/pi/extensions/todos.ts` provides the `/todos` UI and todo tools. It stores todo state under `.pi/todos` by default, or under `PI_TODO_PATH` when that environment variable is set.

The repo intentionally ignores `.pi/`, including `.pi/todos/`, because those files are local runtime/session state rather than durable configuration.

### Questions extension

`agents/pi/extensions/questions/` provides the generic `ask_questions` tool and the `/answer` command. The tool presents questions supplied in structured form, while `/answer` first extracts questions from the previous assistant response with a model. Both entry points share the same interactive question UI.

### UV extension

`agents/pi/extensions/uv.ts` steers Pi's bash tool toward `uv` for Python dependency and environment work. It prepends `agents/pi/intercepted-commands/` to `PATH` and blocks direct `pip`, `pip3`, `poetry`, `python -m pip`, `python -m venv`, and `python -m py_compile` usage with `uv`-based suggestions.

Keep `uv` installed in the system environment; this repo does that via `nix/flake.nix`.

### Grilling skills

`agents/pi/skills/grill-me` is the explicit entry point for a structured grilling session. It delegates to `agents/pi/skills/grilling`, which presents each round through the `ask_questions` tool and uses a text fallback when that tool is unavailable.

Use `/skill:grill-me` to begin a session.

### Spec skill

Use `/skill:to-spec` after settling decisions to synthesize the conversation into a spec. It confirms test seams, then saves to a gitignored `tmp/<slug>-spec.md` in the target project unless an issue tracker is already specified. No other skills or tracker setup workflow are required.

### Web browser skill

`agents/pi/skills/web-browser` provides lightweight Chrome/Chromium control through the Chrome DevTools Protocol: navigation, JavaScript evaluation, screenshots, mobile emulation, element picking, cookie dialog dismissal, console/error/network logging, and network summaries.

Dependencies:

- Node.js and npm
- Google Chrome or Chromium
- The skill-local npm dependency installed from `agents/pi/skills/web-browser/scripts/package.json`

Install or refresh the npm dependency after cloning:

```bash
cd ~/Code/config/agents/pi/skills/web-browser/scripts
npm install
```

### Asset provenance

Record provenance for copied agent assets so they can be updated intentionally later. Include at least the source URL, source commit/tag/version, and any local modifications worth preserving.

Current assets:

| Asset | Provenance |
|-------|------------|
| `todos.ts` | Copied into this repo in commit `f99bc06`; upstream source URL/commit not yet recorded. Fill this in before doing a substantial sync/update. |
| `questions/` | Local extension evolved from the repo's former `answer.ts`. It retains model-based extraction for `/answer` and adds a shared interactive UI plus the structured `ask_questions` tool. |
| `uv.ts` + `intercepted-commands/` | Copied from `mitsuhiko/agent-stuff` at commit `ab79f98104bcd3c6a7c5491e609f6d6700a7414d`: `extensions/uv.ts` and `intercepted-commands/{pip,pip3,poetry,python,python3}`. No local modifications. |
| `firecrawl.ts` | Adapted from `davis7dotsh/my-pi-setup` `extensions/firecrawl-search.ts` on 2026-05-17. Local modifications: updated imports to current `@earendil-works/*` Pi packages, namespaced tools as `firecrawl_search`/`firecrawl_scrape`, added bounded/truncated output, normalized search formatting, stricter URL/integer handling, flattened to the repo extension naming convention, and settings-based loading. |
| `skills/to-spec` | Adapted from [mattpocock/skills](https://github.com/mattpocock/skills/tree/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/to-spec) at commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`. Preserves the spec template; replaces setup and label dependencies with gitignored local Markdown or an already-specified tracker, and uses Pi's `ask_questions` for seam confirmation. |
| `skills/web-browser` | Copied from `mitsuhiko/agent-stuff` at commit `ab79f98104bcd3c6a7c5491e609f6d6700a7414d`: `skills/web-browser`. No local modifications. |
| `shared/skills/commit-like-me` | Originally a Claude-only, message-drafting-only skill; a separate Pi adaptation (`agents/pi/skills/commit-like-me`) added a default atomic staging/commit workflow and had drifted from it. On migrating both to `shared/`, split back into this skill (message shape only, matching the original Claude scope) and `atomic-commit` (the staging/commit workflow, matching the Pi scope) so each harness can use both without re-duplicating either. |
| `shared/skills/atomic-commit` | Split out of the former `agents/pi/skills/commit-like-me` during the `shared/` migration above; delegates message formatting to `commit-like-me` instead of duplicating it. |
| `skills/grill-me`, `skills/grilling` | Vendored from `mattpocock/skills` at commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`. Local modifications: replaced Claude's skill-tool delegation with a relative Pi skill reference, integrated structured rounds with the local `ask_questions` tool, retained a text fallback, and generalized sub-agent-specific fact gathering to available tools. |
