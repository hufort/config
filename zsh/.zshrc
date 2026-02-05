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

# Modern CLI replacements
alias ls='eza'
alias ll='eza -l'
alias la='eza -la'
alias cat='bat'

# Git aliases
alias main="git checkout main && git pull"
alias dev="git checkout dev && git pull"
alias gb="git branch"
alias lol="git log --oneline"
alias gtfo="git reset --hard HEAD"

# Nix rebuild after config changes
alias rebuild="sudo darwin-rebuild switch --flake ~/.config/nix-darwin-config"

# Ghostty
alias ghostty-docs="cat /Applications/Ghostty.app/Contents/Resources/ghostty/doc/ghostty.1.md"

# Open directory in Cursor
csr() {
  local target="${1:-.}"
  cursor "$target"
}

# Interactive branch checkout (local)
co() {
  local branch
  branch=$(git branch --format='%(refname:short)' | fzf --height 40% --reverse) || return
  [ -n "$branch" ] && git checkout "$branch"
}

# Interactive branch checkout (remote)
cor() {
  local branch
  branch=$(git branch -r --format='%(refname:short)' | grep -v HEAD | fzf --height 40% --reverse) || return
  [ -n "$branch" ] && git checkout --track "$branch"
}

# Interactive branch deletion
del() {
  local branch
  branch=$(git branch --format='%(refname:short)' | grep -v "^$(git branch --show-current)$" | fzf --height 40% --reverse) || return
  [ -n "$branch" ] && git branch -D "$branch"
}

# Interactive branch copy (branch name to clipboard)
gbc() {
  local branch
  branch=$(git branch --format='%(refname:short)' | fzf --height 40% --reverse) || return
  [ -n "$branch" ] && printf '%s' "$branch" | pbcopy
}

# Interactive branch merge
gbm() {
  local branch
  branch=$(git branch --format='%(refname:short)' | grep -v "^$(git branch --show-current)$" | fzf --height 40% --reverse) || return
  [ -n "$branch" ] && git merge "$branch"
}

# Create and checkout new branch
cob() {
  git checkout -b "$1"
}

# Delete branch(es) with protection for main/dev
gbd() {
  local force=false
  local remote="origin"
  local delete_remote=false

  while [[ $# -gt 0 ]]; do
    case $1 in
      -f) force=true; shift ;;
      -r) delete_remote=true; shift ;;
      *) break ;;
    esac
  done

  if [ $# -eq 0 ]; then
    echo "Usage: gbd [-f] [-r] branch-name [branch-name ...]"
    return 1
  fi

  for branch in "$@"; do
    if [[ "$branch" == "main" ]] || [[ "$branch" == "dev" ]]; then
      if [ "$delete_remote" = true ]; then
        echo "Cannot delete remote protected branch: $branch"
      fi
      if [ "$force" = true ]; then
        echo "Deleting local protected branch: $branch"
        git branch -D "$branch"
      else
        echo "Protected branch: $branch (use -f to force delete local only)"
      fi
    else
      echo "Deleting branch: $branch"
      git branch -D "$branch" 2>/dev/null || echo "Local branch $branch doesn't exist"
      if [ "$delete_remote" = true ]; then
        if git ls-remote --heads $remote $branch | grep -q $branch; then
          echo "Deleting remote branch: $branch"
          git push $remote --delete $branch
        else
          echo "Remote branch $branch doesn't exist"
        fi
      fi
    fi
  done
}
