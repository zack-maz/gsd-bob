---
quick_id: 260704-gmp
description: Bump @zack-maz/gsd-bob version 0.1.2 → 0.2.0 and verify npm pack is clean
date: 2026-07-04
---

# Quick Task 260704-gmp: Version bump 0.1.2 → 0.2.0 + npm pack verification

## Objective

The published npm package `@zack-maz/gsd-bob@0.1.2` (2026-07-02) predates all of
milestone v2.0 (Phases 7–11: gsd-core 1.6.1 re-vendor, model neutralization,
command expansion 10 → 28, documentation, acceptance delta). Bump the version so
the v2.0 work can be published, and verify the packed tarball is clean.

Minor bump (0.1.2 → 0.2.0) chosen because v2.0 is feature-scale, backward-compatible
work — not a breaking change and not a patch.

## Tasks

1. **Bump version** — `package.json` `version` `0.1.2` → `0.2.0`.
   - verify: `node -p "require('./package.json').version"` → `0.2.0`
   - done: field reads 0.2.0

2. **Verify tarball hygiene** — run `npm pack --dry-run`.
   - verify: tarball reports `version: 0.2.0`; zero `.planning/`, `test/`, or `.tgz`
     entries in the file list.
   - done: dry-run clean, matches the `files` allowlist (bin/, src/, gsd-core/,
     commands/, scripts/, README.md, LICENSE).

## Out of scope

- `npm publish` itself (login/user-driven, per quick-task 260619-ou0).
- README/roster regeneration (already current from Phase 10).
</content>
</invoke>
