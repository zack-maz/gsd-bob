# Deferred Items — Phase 11

Out-of-scope discoveries during Phase 11 execution. NOT fixed here (SCOPE BOUNDARY:
only issues directly caused by this phase's changes are auto-fixed).

## Pre-existing test failure (unrelated to Phase 11)

- **Test:** `test/core-loop-contract.test.cjs` → `CORE-02: a produced PLAN.md carries the documented section + frontmatter markers`
- **Error:** `ENOENT: .planning/phases/04-core-loop-port/04-01-PLAN.md` (file does not exist)
- **Root cause:** The `04-core-loop-port` phase directory was removed when milestone v2.0
  started (commit `459d992 docs: start milestone v2.0`). The test still hard-references the
  archived phase-04 plan path.
- **Proof it pre-exists:** The identical failure reproduces at commit `683066e` (the commit
  before Phase 11 Task 1). Phase 11 touched only `.planning/ACCEPTANCE-CHECKLIST.md`,
  `test/fixtures/acceptance/frozen-ac01-26.md`, and the two new `test/acceptance-*` guards —
  none of which `core-loop-contract.test.cjs` reads.
- **Suggested fix (future phase):** Re-point the test at a live phase plan derived at run
  time (glob `.planning/phases/*/[0-9]*-PLAN.md`) instead of the hard-coded phase-04 path,
  mirroring the anti-drift convention used elsewhere in the suite.
