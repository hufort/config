{
  description = "Example nix-darwin system flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nix-darwin.url = "github:nix-darwin/nix-darwin/master";
    nix-darwin.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = inputs@{ self, nix-darwin, nixpkgs }:
  let
    configuration = { pkgs, ... }: {
      system.primaryUser = "hugh";

      # List packages installed in system profile. To search by name, run:
      # $ nix-env -qaP | grep wget
      environment.systemPackages = with pkgs; [
        vim
        git
        gh
        jq
        ripgrep
        fzf
        eza
        bat
        starship
        nodejs_22
        tree
        wget
        curl
        flyctl
      ];

      # Nerd fonts for prompt symbols
      fonts.packages = with pkgs; [
        nerd-fonts.jetbrains-mono
      ];

      # unlock sudo with touchID
      security.pam.services.sudo_local.touchIdAuth = true;

      # Necessary for using flakes on this system.
      nix.settings.experimental-features = "nix-command flakes";

      # shell configuration
      programs.zsh.enableSyntaxHighlighting = true;
      programs.zsh.enableAutosuggestions = true;

      # Let Determinate manage Nix daemon instead of nix-darwin
      nix.enable = false;

      # Set Git commit hash for darwin-version.
      system.configurationRevision = self.rev or self.dirtyRev or null;

      # Used for backwards compatibility, please read the changelog before changing.
      # $ darwin-rebuild changelog
      system.stateVersion = 6;

      # The platform the configuration will be used on.
      nixpkgs.hostPlatform = "aarch64-darwin";

      # MacOS system defaults config
      system.defaults = {
        dock.autohide = true;
        dock.mru-spaces = false;
        dock.show-recents = false;
        finder.AppleShowAllExtensions = true;
        finder.FXPreferredViewStyle = "clmv";
        finder.ShowPathbar = true;
        trackpad.Clicking = true;  # Tap to click
        NSGlobalDomain.InitialKeyRepeat = 15;
        NSGlobalDomain.KeyRepeat = 2;
        NSGlobalDomain.ApplePressAndHoldEnabled = false;  # Key repeat instead of accents
        screencapture.location = "~/Downloads/screenshots";
      };
    };
  in
  {
    # Build darwin flake using:
    # $ darwin-rebuild build --flake .#simple
    darwinConfigurations."mba" = nix-darwin.lib.darwinSystem {
      modules = [ configuration ];
    };
  };
}
