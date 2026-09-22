# Agents

Version-controlled agent harness configuration and personal agent assets.

Agent-related concerns live in this config repo for now because the current assets are personal configuration, not a reusable package. Keeping them next to the rest of the machine/bootstrap config makes setup and review straightforward. Split this into a dedicated repo only if these assets need an independent release lifecycle or need to be shared beyond this config.

## Layout

Harness-agnostic assets belong under `agents/shared/`; Pi-specific extensions,
skills, prompts, dependencies, and command shims belong under `agents/pi/`.
Browse those directories for the current inventory rather than maintaining a
parallel tree here. Add another harness-specific directory only when it has
assets that cannot remain shared.

## Shared skills

`agents/shared/skills/` holds skills used from more than one harness, written to the [Agent Skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md) standard (`name` + `description` frontmatter, directory name matching `name`) that both Claude Code and Pi implement natively. Keep the body of each `SKILL.md` harness-agnostic; only note an invocation-syntax difference (`/name` in Claude Code vs. `/skill:name` in Pi) if the skill text needs to reference its own invocation.

Each harness discovers these differently: Pi can load the shared parent directory,
while Claude Code needs one same-named symlink per skill. See the setup sections
below. The directories and their `SKILL.md` files are authoritative for the
current inventory and behavior.

## Pi setup

Pi loads these assets through the local `~/.pi/agent/settings.json`, which points
at this checkout rather than relying on symlinks under `~/.pi/agent/`. That file
also contains machine-local preferences, so it is intentionally not tracked here;
inspect it directly for the active configuration instead of copying a JSON example
from this README.

Update its `extensions` entries when extension files are added, removed, or moved.
Its `skills` entries should point at the `agents/pi/skills` and
`agents/shared/skills` parent directories, allowing Pi to discover skills beneath
them without another settings change. On a differently located checkout, adjust
the absolute paths accordingly.

Install or refresh the locked Pi extension dependencies from `agents/pi/` with
`npm ci`.

After changing extension or skill files, reload Pi with `/reload` or restart Pi.

## Claude Code setup

Claude Code has no settings-driven external path list, so each shared skill needs
a same-named symlink from `~/.claude/skills/` to its directory under
`agents/shared/skills/` (see [Shared skills](#shared-skills)). These are manual,
machine-local bootstrap links rather than nix-darwin-managed configuration;
create them after cloning on a new machine and add or remove them when the set of
shared skills changes. Account for the checkout's absolute path when creating the
links.

### Todo extension

`agents/pi/extensions/todos.ts` provides the `/todos` UI and todo tools. It stores todo state under `.pi/todos` by default, or under `PI_TODO_PATH` when that environment variable is set.

The repo intentionally ignores `.pi/`, including `.pi/todos/`, because those files are local runtime/session state rather than durable configuration.

### Questions extension

`agents/pi/extensions/questions/` provides the generic `ask_questions` tool and the `/answer` command. The tool presents questions supplied in structured form, while `/answer` first extracts questions from the previous assistant response with a model. Both entry points share the same interactive question UI.

### UV extension

`agents/pi/extensions/uv.ts` steers Python environment and dependency commands
toward `uv`; its implementation and intercepted-command directory define the
current command policy. Keep `uv` installed through `nix/flake.nix`.

### Grilling skills

`agents/pi/skills/grill-me` is the explicit entry point for a structured grilling session. It delegates to `agents/pi/skills/grilling`, which presents each round through the `ask_questions` tool and uses a text fallback when that tool is unavailable.

Use `/skill:grill-me` to begin a session.

### Spec skill

Use `/skill:to-spec` after settling decisions to synthesize the conversation into a spec. It confirms test seams, then saves to a gitignored `tmp/<slug>-spec.md` in the target project unless an issue tracker is already specified. No other skills or tracker setup workflow are required.

### Web browser skill

`agents/pi/skills/web-browser/SKILL.md` is the source of truth for its Chrome/CDP
capabilities and usage. Its scripts have a separate lockfile; install their
locked dependencies from `agents/pi/skills/web-browser/scripts/` with `npm ci`.

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
