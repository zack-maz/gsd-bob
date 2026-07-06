# Phase 9 — Deferred Items (out-of-scope discoveries during execution)

## Pre-existing test failure (NOT caused by Plan 09-01)

**Test:** `test/core-loop-contract.test.cjs:126` — `CORE-02: a produced PLAN.md carries the documented section + frontmatter markers`

**Failure:** `ENOENT: no such file or directory, open '.planning/phases/04-core-loop-port/04-01-PLAN.md'`

**Root cause:** The test hardcodes a read of `.planning/phases/04-core-loop-port/04-01-PLAN.md`, but that phase directory no longer exists on disk (archived/removed). The failure is entirely independent of the command-vendoring work in Plan 09-01.

**Proof it is pre-existing:** Stashing all of Plan 09-01's changes (`git stash push --include-untracked commands/gsd/ SUPPORT-ROSTER.md`) and re-running `node --test test/core-loop-contract.test.cjs` reproduces the same failure (`pass 4 / fail 1`). It fails at HEAD `3bcefe5` before any Phase 9 change.

**Disposition:** Out of scope for Plan 09-01 per the executor SCOPE BOUNDARY rule (pre-existing failure in an unrelated test that reads a missing `.planning/` artifact). Not fixed here. Should be addressed separately — either point the test at a live PLAN.md or make it derive its target from an existing phase directory.
