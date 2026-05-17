# Config

Personal system configuration for macOS, managed with nix-darwin.

## What's here

```
config/
├── browser/       # browser extension configs
├── ghostty/       # terminal emulator config
├── git/           # shared git config (user, aliases, pull/push settings)
├── agents/        # agent harness config, extensions, skills, and prompts
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

4. Symlink configs:
   ```bash
   ln -sf ~/Code/config/zsh/.zshrc ~/.zshrc
   ln -sf ~/Code/config/tmux/tmux.conf ~/.tmux.conf
   mkdir -p ~/.config/ghostty ~/.config/git
   ln -sf ~/Code/config/git/config ~/.config/git/config
   ln -sf ~/Code/config/starship/starship.toml ~/.config/starship.toml
   ln -sf ~/Code/config/nix ~/.config/nix-darwin-config
   ln -sf ~/Code/config/ghostty/config ~/.config/ghostty/config
   ```

5. Bootstrap nix-darwin:
   ```bash
   nix run nix-darwin -- switch --flake ~/.config/nix-darwin-config
   ```
   Note: the activation script will re-create the `~/.tmux.conf` and `~/.config/git/config` symlinks on each rebuild.

6. Install Cursor shell command: `Cmd+Shift+P` → "Install 'cursor' command"

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
