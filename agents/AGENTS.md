# Agent configuration guidance

Read `agents/README.md` before changing agent configuration or assets.

When adding or moving Pi skills, extensions, or other discoverable assets, check that Pi's active configuration loads them. Update `~/.pi/agent/settings.json` when necessary and keep the setup example in `agents/README.md` synchronized. Verify registered paths exist, and remind the user to `/reload`. Creating files in this repo alone does not register them with Pi.
