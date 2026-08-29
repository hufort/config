# Agent guidance

Read `README.md` before making changes. Treat it as the description of the repo's intended setup and workflows. If a proposed change conflicts with or makes the README incomplete, reconcile the two: reconsider the change or update the README as part of the same work.

## Package management

Keep installation declarative when practical, with nix-darwin as the control plane:

- Use Nix (`environment.systemPackages`) for CLI tools, runtimes, and other packages that work naturally from the Nix store.
- Use nix-darwin-managed Homebrew casks for native macOS GUI applications where conventional `/Applications` installation and macOS integration are preferable.
- Install an application manually only when neither route is suitable; document manually managed GUI apps in the README.
- Do not manage the same package through multiple mechanisms.
- Preserve `homebrew.onActivation.cleanup = "none"` unless unmanaged Homebrew software on every target Mac has been audited and stricter reconciliation is explicitly intended.

After changing `nix/flake.nix`, run:

```bash
cd nix && nix flake check --no-build
```
