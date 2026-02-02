# Config

Personal system configuration for macOS, managed with nix-darwin.

## What's here

```
config/
├── browser/       # browser extension configs
├── ghostty/       # terminal emulator config
├── git/           # git config and global gitignore
├── nix/           # nix-darwin system configuration
├── starship/      # prompt configuration
└── zsh/           # shell config (.zshrc)
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
   ln -sf ~/Code/config/git/.gitconfig ~/.gitconfig
   ln -sf ~/Code/config/git/.gitignore_global ~/.gitignore_global
   mkdir -p ~/.config/ghostty  # also creates ~/.config if needed
   ln -sf ~/Code/config/starship/starship.toml ~/.config/starship.toml
   ln -sf ~/Code/config/nix ~/.config/nix-darwin-config
   ln -sf ~/Code/config/ghostty/config ~/.config/ghostty/config
   ```

4. Bootstrap nix-darwin:
   ```bash
   nix run nix-darwin -- switch --flake ~/.config/nix-darwin-config
   ```

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
