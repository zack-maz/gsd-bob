---
quick_id: 260619-ou0
slug: npm-publish-packaging
date: 2026-06-20
---

# Quick Task: npm publish packaging

Prepare `@opengsd/gsd-bob` for its first npm publish by constraining the published
tarball to the runtime-necessary files and supplying the declared license.

## Problem

`package.json` had no `"files"` allowlist and the repo has no `.npmignore`, so
`npm publish` would have shipped `.planning/` (internal planning artifacts),
`test/`, `prompt.md`, `UPSTREAM.md`, and the two 1.7 MB `opengsd-gsd-bob-*.tgz`
build outputs (recursive bloat). `package.json` also declared `"license":"MIT"`
with no `LICENSE` file present.

## Changes

1. **`package.json` `files` allowlist** — `bin/`, `src/`, `gsd-core/`, `commands/`,
   `scripts/`, `README.md`, `LICENSE`. Derived from the install-time runtime
   contract in `src/installer/stage.cjs`: the installer sources the vendored
   `gsd-core/` payload (incl. `gsd-core/VERSION`), `scripts/fix-slash-commands.cjs`
   (a sibling the staged shim eagerly requires), and `commands/gsd/` (the Claude
   command conversion sources), plus its own `src/` + `bin/`.
2. **`LICENSE`** — standard MIT text, copyright holder Zack Maz, matching the
   `package.json` `license` field.

## Verification

- `npm pack --dry-run`: 0 `.planning/` paths, 0 `test/` paths, 0 bundled `.tgz`
  content files; `LICENSE` present; runtime-critical files
  (`scripts/fix-slash-commands.cjs`, `gsd-core/VERSION`, all 10 `commands/gsd/*.md`,
  `bin/gsd-bob.cjs`, `src/**`) present. 405 files, 1.3 MB packed / 4.9 MB unpacked.
- `npm test`: 189/189 pass after the edit; `package.json` parses.

Does NOT publish — `npm login` is interactive and user-driven; `npm publish` is
the user's explicit next step.
