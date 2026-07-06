# Phase 10 — Deferred / Out-of-Scope Items

Items discovered during execution that are NOT caused by this phase's changes.

## Pre-existing test failure (out of scope)

- **File:** `test/core-loop-contract.test.cjs` (CORE-02)
- **Failure:** `ENOENT` opening `.planning/phases/04-core-loop-port/04-01-PLAN.md` — the
  fixture plan file was archived/removed, but the test still hard-references its old path.
- **Evidence it is pre-existing:** `npm test` reports `pass 313 / fail 1` WITHOUT
  `test/docs-conformance.test.cjs` and `pass 317 / fail 1` WITH it. The +4 are this plan's new
  passing assertions; the single failure is unchanged, so plan 10-01 introduces zero regressions.
- **Recommended fix (separate work):** point the test at a live plan fixture or make it
  directory-derive an existing `NN-NN-PLAN.md` rather than pinning the archived `04-01` path.
