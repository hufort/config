# Config

Personal system configuration for macOS, managed with nix-darwin.

## What's here

Configuration is grouped by the tool or subsystem it belongs to. `nix/` is the
source of truth for system packages, applications, defaults, activation steps,
and managed links; `agents/` documents the separate agent harness setup. Browse
the repository root for the current set of tool-specific configuration.

## Setup on a new machine

1. Install Nix (Determinate Systems installer):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
   ```

2. Set up GitHub SSH auth:
   ```bash
   mkdir -p ~/.ssh
   ssh-keygen -t ed25519 -C "github-personal-$(whoami)-$(hostname -s)" -f ~/.ssh/github_personal_$(whoami)_$(hostname -s)
   ssh-add ~/.ssh/github_personal_$(whoami)_$(hostname -s)
   pbcopy < ~/.ssh/github_personal_$(whoami)_$(hostname -s).pub
   ```
   Add the copied public key to GitHub → Settings → SSH and GPG keys.

   Test the connection:
   ```bash
   ssh -T git@github.com
   ```

3. Clone this repo over SSH:
   ```bash
   mkdir -p ~/Code
   git clone git@github.com:hufort/config.git ~/Code/config
   ```

4. Link the bootstrap configuration that is not managed by nix-darwin:
   ```bash
   ln -sf ~/Code/config/zsh/.zshrc ~/.zshrc
   mkdir -p ~/.config/ghostty
   ln -sf ~/Code/config/starship/starship.toml ~/.config/starship.toml
   ln -sf ~/Code/config/nix ~/.config/nix-darwin-config
   ln -sf ~/Code/config/ghostty/config ~/.config/ghostty/config
   ```

   `nix/flake.nix` is authoritative for links created during activation; do not
   duplicate that list here.

5. Bootstrap nix-darwin:
   ```bash
   nix run nix-darwin -- switch --flake ~/.config/nix-darwin-config
   ```
   Note: the activation script installs the declaratively managed GUI apps and
   re-creates managed config symlinks, including the VS Code user settings, on
   each rebuild.

## Daily use

Rebuild after editing nix config:
```bash
rebuild  # alias for: sudo darwin-rebuild switch --flake ~/.config/nix-darwin-config
```

## Pi skills

Custom skills live in `agents/pi/skills/`. With that directory configured in Pi,
run `/skill:grill-me` to settle decisions, then `/skill:to-spec` to capture them
without another requirements interview. `to-spec` confirms test seams before
writing and preserves the upstream Matt Pocock spec template without requiring
his other skills or setup.

Specs default to `tmp/<descriptive-slug>-spec.md` in the target project, with
`/tmp/` added to its `.gitignore` when needed. If the user or project instructions
already specify an issue tracker, the skill publishes there instead, using the
project's conventions rather than assuming triage labels.

## GUI apps

Managed GUI applications are declared in `homebrew.casks` in
`nix/flake.nix`; consult that list rather than maintaining another inventory
here.

The Homebrew activation cleanup policy is intentionally set to `"none"` so
software installed outside this flake is preserved while existing Macs are
migrated. Homebrew packages can be audited on each machine with:

```bash
brew list --formula
brew list --cask
```

Installed manually:

- Raycast
- Ghostty
- Arc
- 1Password

## Notes

- Uses Determinate Nix with `nix.enable = false` in flake (lets Determinate manage the Nix daemon)
- Touch ID enabled for sudo
- Starship prompt requires a Nerd Font (JetBrainsMono Nerd Font installed via nix)
