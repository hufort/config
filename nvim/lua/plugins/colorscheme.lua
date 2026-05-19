-- Solarized provides Neovim/LazyVim highlight colors.
-- Transparency lets Ghostty's Hivacruz background show through.
return {
  {
    "maxmx03/solarized.nvim",
    lazy = false,
    priority = 1000,
    opts = {
      transparent = { enabled = true },
    },
  },

  -- Tell LazyVim to use it
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "solarized",
    },
  },
}
