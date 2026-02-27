# Modern CLI replacements
alias ls='eza'
alias ll='eza -l'
alias la='eza -la'
alias cat='bat'

# Git aliases
alias main="git checkout main && git pull"
alias dev="git checkout dev && git pull"
alias lol="git log --oneline origin/main..HEAD"
alias gtfo="git reset --hard HEAD"

# Nix rebuild after config changes
alias rebuild="sudo darwin-rebuild switch --flake ~/.config/nix-darwin-config"

# Ghostty
alias ghostty-docs="cat /Applications/Ghostty.app/Contents/Resources/ghostty/doc/ghostty.1.md"
