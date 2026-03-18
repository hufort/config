-- Add your custom plugin specs here
-- Each file in this directory is automatically loaded by LazyVim
--
-- To add a plugin, return a table:
-- return {
--   { "plugin/name", opts = {} },
-- }
--
-- To disable a LazyVim default plugin:
-- return {
--   { "plugin/name", enabled = false },
-- }

return {
  {
    "echasnovski/mini.animate",
    opts = {
      resize = { enable = false },
    },
  },
  {
    "akinsho/bufferline.nvim",
    opts = {
      options = {
        numbers = "ordinal",
      },
    },
    keys = {
      { "<leader>b1", "<cmd>BufferLineGoToBuffer 1<cr>", desc = "Go to buffer 1" },
      { "<leader>b2", "<cmd>BufferLineGoToBuffer 2<cr>", desc = "Go to buffer 2" },
      { "<leader>b3", "<cmd>BufferLineGoToBuffer 3<cr>", desc = "Go to buffer 3" },
      { "<leader>b4", "<cmd>BufferLineGoToBuffer 4<cr>", desc = "Go to buffer 4" },
      { "<leader>b5", "<cmd>BufferLineGoToBuffer 5<cr>", desc = "Go to buffer 5" },
      { "<leader>b6", "<cmd>BufferLineGoToBuffer 6<cr>", desc = "Go to buffer 6" },
      { "<leader>b7", "<cmd>BufferLineGoToBuffer 7<cr>", desc = "Go to buffer 7" },
      { "<leader>b8", "<cmd>BufferLineGoToBuffer 8<cr>", desc = "Go to buffer 8" },
      { "<leader>b9", "<cmd>BufferLineGoToBuffer 9<cr>", desc = "Go to buffer 9" },
    },
  },
}
