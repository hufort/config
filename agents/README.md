# Agents

Version-controlled agent harness configuration and personal agent assets.

Agent-related concerns live in this config repo for now because the current assets are personal configuration, not a reusable package. Keeping them next to the rest of the machine/bootstrap config makes setup and review straightforward. Split this into a dedicated repo only if these assets need an independent release lifecycle or need to be shared beyond this config.

## Layout

The scaffold is intentionally minimal and Pi-only:

```text
agents/
└── pi/
    ├── extensions/          # Pi TypeScript extensions
    ├── intercepted-commands/ # command shims used by extensions
    ├── skills/              # Pi-specific skills, if/when needed
    └── prompts/     # Pi prompt templates, if/when needed
```

There are no top-level `shared/`, `claude/`, or `codex/` directories yet. Add shared or harness-specific directories only when a concrete need appears; avoid creating empty taxonomy ahead of real usage.

## Pi setup

Pi loads these files through Pi settings that point at this repo, rather than symlinks into `~/.pi/agent/extensions/`.

Add local extension and skill paths to `~/.pi/agent/settings.json`:

```json
{
  "extensions": [
    "/Users/hugh/Code/config/agents/pi/extensions/todos.ts",
    "/Users/hugh/Code/config/agents/pi/extensions/answer.ts",
    "/Users/hugh/Code/config/agents/pi/extensions/uv.ts"
  ],
  "skills": [
    "/Users/hugh/Code/config/agents/pi/skills/web-browser"
  ]
}
```

After changing extension or skill files, reload Pi with `/reload` or restart Pi.

### Todo extension

`agents/pi/extensions/todos.ts` provides the `/todos` UI and todo tools. It stores todo state under `.pi/todos` by default, or under `PI_TODO_PATH` when that environment variable is set.

The repo intentionally ignores `.pi/`, including `.pi/todos/`, because those files are local runtime/session state rather than durable configuration.

### UV extension

`agents/pi/extensions/uv.ts` steers Pi's bash tool toward `uv` for Python dependency and environment work. It prepends `agents/pi/intercepted-commands/` to `PATH` and blocks direct `pip`, `pip3`, `poetry`, `python -m pip`, `python -m venv`, and `python -m py_compile` usage with `uv`-based suggestions.

Keep `uv` installed in the system environment; this repo does that via `nix/flake.nix`.

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

### Extension provenance

Record provenance for copied extensions so they can be updated intentionally later. Include at least the source URL, source commit/tag/version, and any local modifications worth preserving.

Current extensions:

| Extension | Provenance |
|-----------|------------|
| `todos.ts` | Copied into this repo in commit `f99bc06`; upstream source URL/commit not yet recorded. Fill this in before doing a substantial sync/update. |
| `answer.ts` | Local extension added directly in this repo. Modified during setup to authenticate via existing OpenAI Codex OAuth credentials and prefer GPT-5.2-family Codex models for extraction instead of Haiku/API-key fallback. |
| `uv.ts` + `intercepted-commands/` | Copied from `mitsuhiko/agent-stuff` at commit `ab79f98104bcd3c6a7c5491e609f6d6700a7414d`: `extensions/uv.ts` and `intercepted-commands/{pip,pip3,poetry,python,python3}`. No local modifications. |
| `skills/web-browser` | Copied from `mitsuhiko/agent-stuff` at commit `ab79f98104bcd3c6a7c5491e609f6d6700a7414d`: `skills/web-browser`. No local modifications. |
