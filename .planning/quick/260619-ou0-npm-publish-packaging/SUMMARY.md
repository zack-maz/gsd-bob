---
quick_id: 260619-ou0
slug: npm-publish-packaging
date: 2026-06-20
status: complete
---

# Summary: npm publish packaging

Constrained the published tarball to runtime-necessary files and added the
declared MIT license, so the first `npm publish` of `@opengsd/gsd-bob` ships a
clean, working package.

## What changed

- `package.json`: added a `"files"` allowlist — `bin/`, `src/`, `gsd-core/`,
  `commands/`, `scripts/`, `README.md`, `LICENSE`.
- `LICENSE`: new MIT license file (copyright holder Zack Maz).

## Outcome (verified)

- `npm pack --dry-run`: **0** `.planning/`, **0** `test/`, **0** bundled `.tgz`
  content files; `LICENSE` included; all install-time runtime files present
  (`gsd-core/` payload incl. `VERSION`, `scripts/fix-slash-commands.cjs`,
  `commands/gsd/` sources, `src/`, `bin/`). **405 files, 1.3 MB packed.**
- `npm test`: **189/189 pass**.

## Not done (intentional)

- `npm publish` NOT run — `npm login` is interactive/user-driven. The package is
  publish-ready; the actual publish (`npm publish --access public`) is the user's
  next step once authenticated.
