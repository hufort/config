# Environment
export EDITOR='vim'
export VISUAL=$EDITOR
export GIT_EDITOR=$EDITOR
export BUNDLE_EDITOR=$EDITOR

# fzf shell integration
eval "$(fzf --zsh)"

# Starship prompt
eval "$(starship init zsh)"

# Auto-load project-specific environments
eval "$(direnv hook zsh)"

# Aliases and functions 
source "${0:A:h}/aliases.zsh"
