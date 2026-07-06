---
quick_id: 260704-gmp
status: complete
date: 2026-07-04
commit: c18a156
---

# Quick Task 260704-gmp: Version bump 0.1.2 → 0.2.0 + npm pack verification — Summary

## What was done

1. **Version bump** — `package.json` `version` bumped `0.1.2` → `0.2.0` (minor;
   milestone v2.0 is feature-scale and backward-compatible). Committed as `c18a156`
   (code only; `.planning/` docs uncommitted per `commit_docs: false`).

2. **Tarball verification** — `npm pack --dry-run` on the bumped package:
   - `name=@zack-maz/gsd-bob version=0.2.0`
   - **445 files**, 1.5 MB packed / 5.7 MB unpacked
   - Hygiene: **0** `.planning/` entries, **0** `test/` entries, **0** `.tgz` entries
   - Contents match the `files` allowlist (bin/, src/, gsd-core/, commands/, scripts/,
     README.md, LICENSE)
   - File count grew 405 → 445 vs v0.1.2, consistent with Phase 9's +18 commands and
     Phase 10 docs riding in the `gsd-core/`/`commands/` payload.

## Result

The working tree is ready to publish. Publishing itself is user-driven:

```
npm publish --access public
```

(`--access public` is required the first time a scoped package is published, if not
already public.)

## Notes / follow-ups

- npm registry still serves `0.1.2` (2026-07-02) until `npm publish` is run.
- Pre-existing test failure `core-loop-contract.test.cjs` CORE-02 (ENOENT on archived
  `04-01-PLAN.md`) is unrelated to this task and does not affect the tarball.
</content>
