# Config

Personal system configuration for macOS, managed with nix-darwin.

## What's here

```
config/
├── browser/       # browser extension configs
├── ghostty/       # terminal emulator config
├── git/           # shared git config (user, aliases, pull/push settings)
├── nix/           # nix-darwin system configuration
├── starship/      # prompt configuration
├── tmux/          # tmux config
└── zsh/           # shell config, aliases, and functions
```

## Setup on a new machine

1. Install Nix (Determinate Systems installer):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
   ```

2. Clone this repo:
   ```bash
   mkdir -p ~/Code
   git clone git@github.com:hufort/config.git ~/Code/config
   ```

3. Symlink configs:
   ```bash
   ln -sf ~/Code/config/zsh/.zshrc ~/.zshrc
   ln -sf ~/Code/config/tmux/tmux.conf ~/.tmux.conf
   mkdir -p ~/.config/ghostty ~/.config/git
   ln -sf ~/Code/config/git/config ~/.config/git/config
   ln -sf ~/Code/config/starship/starship.toml ~/.config/starship.toml
   ln -sf ~/Code/config/nix ~/.config/nix-darwin-config
   ln -sf ~/Code/config/ghostty/config ~/.config/ghostty/config
   ```

4. Bootstrap nix-darwin:
   ```bash
   nix run nix-darwin -- switch --flake ~/.config/nix-darwin-config
   ```
   Note: the activation script will re-create the `~/.tmux.conf` and `~/.config/git/config` symlinks on each rebuild.

5. Install Cursor shell command: `Cmd+Shift+P` → "Install 'cursor' command"

## Daily use

Rebuild after editing nix config:
```bash
rebuild  # alias for: sudo darwin-rebuild switch --flake ~/.config/nix-darwin-config
```

## GUI apps (installed manually)

- Raycast
- Ghostty
- Arc
- Cursor
- 1Password

## Notes

- Uses Determinate Nix with `nix.enable = false` in flake (lets Determinate manage the Nix daemon)
- Touch ID enabled for sudo
- Starship prompt requires a Nerd Font (JetBrainsMono Nerd Font installed via nix)
