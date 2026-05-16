# Agents

Version-controlled agent harness configuration and personal agent assets.

This directory is intended to become the source of truth for agent-related concerns such as Pi extensions, Pi-specific skills, prompt templates, and other harness configuration.

## Layout

```text
agents/
└── pi/
    ├── extensions/  # Pi TypeScript extensions
    ├── skills/      # Pi-specific skills, if/when needed
    └── prompts/     # Pi prompt templates, if/when needed
```

## Notes

- Keep harness-specific executable code under that harness's directory.
- Add shared or cross-harness directories only when there is a concrete need.
- Prefer version-controlled source here, then load/symlink from the harness-specific runtime locations.

## Pi

Pi can load extensions from this repo by adding paths to Pi settings, or by symlinking files into `~/.pi/agent/extensions/`.

Example symlink for a global Pi extension:

```bash
mkdir -p ~/.pi/agent/extensions
ln -sf ~/Code/config/agents/pi/extensions/todos.ts ~/.pi/agent/extensions/todos.ts
```
