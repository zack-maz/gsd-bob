---
phase: quick-260619-ncs
plan: 01
subsystem: installer
status: complete
tags: [installer, staging, manifest, gsd-core, regression-test]
requires:
  - "src/installer/stage.cjs stageFile() manifest-tracking path"
  - "gsd-core/VERSION + scripts/fix-slash-commands.cjs (vendored package contract)"
provides:
  - "Self-sufficient .bob/ layout whose vendored gsd-core shim loads from any cwd"
  - "Out-of-tree regression test guarding the staged-shim load path"
affects:
  - "Every gsd-bob --bob install (INSTALL-03 clean install, INSTALL-05 uninstall sweep)"
tech-stack:
  added: []
  patterns:
    - "Stage gsd-core siblings via the existing manifest-tracked stageFile() path (no special-casing)"
    - "Synthesize a minimal package.json stamping the VENDORED version, never gsd-bob's own"
    - "Out-of-tree child_process regression: run staged shim with cwd != repoRoot"
key-files:
  created:
    - test/installer/staged-shim-loads.test.cjs
  modified:
    - src/installer/stage.cjs
    - test/installer/stage.test.cjs
decisions:
  - "Stage both siblings from repoRoot (package root), never cwd/workspaceRoot — same source as the gsd-core/ payload"
  - "Synthesized package.json carries {name:@opengsd/gsd-core, version:1.5.0 from gsd-core/VERSION}, NOT gsd-bob's 0.1.0"
  - "Reads of the two siblings throw loud if absent (a package missing them is broken) — per plan guidance, so the fixtureRepoRoot test fixture was extended to include them"
metrics:
  duration: ~12m
  completed: 2026-06-19
  tasks: 2
  files: 3
---

# Phase quick-260619-ncs Plan 01: Fix gsd-bob installer to stage gsd-core siblings Summary

Made the staged `.bob/` layout self-sufficient by staging the two gsd-core siblings (`scripts/fix-slash-commands.cjs` + a synthesized `package.json` stamping the vendored `1.5.0`) through the manifest-tracked `stageFile()` path, so `node .bob/gsd-core/bin/gsd-tools.cjs query state.load` loads from any cwd instead of crashing with `Cannot find module '../../../scripts/fix-slash-commands.cjs'`; added an out-of-tree regression test so the gap can never silently reappear.

## What Was Built

**Task 1 — stage the two gsd-core siblings (commit `2231886`)**
Added a "Structural piece 2b" block to `stage()` in `src/installer/stage.cjs`, placed after the vendored-payload copy loop and before the SUPPORT-ROSTER.md write. It:
- copies `repoRoot/scripts/fix-slash-commands.cjs` verbatim → `<target>/scripts/fix-slash-commands.cjs` via `stageFile`,
- reads `repoRoot/gsd-core/VERSION` (`.trim()` → `1.5.0`) and stages a minimal `<target>/package.json` = `{"name":"@opengsd/gsd-core","version":"1.5.0"}` (pretty-printed, trailing newline) via `stageFile`.

Both go through the existing `stageFile(relPath, bytes)` helper, so each is recorded in `manifest.entries` as `{path, sha256, kind:'file'}`, obeys the D-04 collision policy, and is swept on uninstall (INSTALL-05). Both are sourced from `repoRoot` (the package root), never `cwd`/`workspaceRoot`.

The `stage.test.cjs` `fixtureRepoRoot()` helper was extended to include `gsd-core/VERSION` and `scripts/fix-slash-commands.cjs`, because these siblings are now part of the vendored package contract a fixture install must provide (the plan specifies the reads throw loud if absent).

**Task 2 — out-of-tree regression test (commit `be4002a`)**
Created `test/installer/staged-shim-loads.test.cjs`. It drives a REAL install via `bin/gsd-bob.cjs --bob --global -c <scratch>/.bob` (cwd = a distinct scratch workspace), asserts both siblings exist with correct content (`version === '1.5.0'`) and appear as `kind:'file'` manifest entries with 64-hex sha256, then runs the STAGED shim via `spawnSync(node, [<target>/gsd-core/bin/gsd-tools.cjs, 'query', 'state.load'], {cwd: path.dirname(target)})` — a clean mkdtemp dir, never `repoRoot`. It asserts exit 0 and that stdout is a parseable JSON object.

## How to Verify

- `npm test` → 189 tests, all pass (188 prior + the new regression).
- Manual: `TMP=$(mktemp -d); node bin/gsd-bob.cjs --bob --global -c "$TMP/.bob"; (cd "$TMP" && node "$TMP/.bob/gsd-core/bin/gsd-tools.cjs" query state.load)` → JSON on stdout, exit 0 (was `Cannot find module`). `<TMP>/.bob/package.json` is version `1.5.0`; both siblings appear as `file` entries in `<TMP>/.bob/.gsd-bob-manifest.json`; `--uninstall` removes both.

## Deviations from Plan

**1. [Rule 3 - Blocking] Extended `test/installer/stage.test.cjs` fixtureRepoRoot to include the two siblings**
- **Found during:** Task 1 (`npm test` after the stage.cjs edit dropped 9 stage.test.cjs cases).
- **Issue:** The hermetic `fixtureRepoRoot()` built a minimal package root with only `gsd-core/bin/gsd-tools.cjs`. The new unconditional reads of `repoRoot/scripts/fix-slash-commands.cjs` and `repoRoot/gsd-core/VERSION` threw (fail-loud, as the plan specifies), failing all 9 cases that call `stage()` through `baseOpts()`.
- **Fix:** Added `gsd-core/VERSION` (`1.5.0`, no trailing newline) and `scripts/fix-slash-commands.cjs` (marker) to `fixtureRepoRoot()`. These siblings are part of the vendored package contract a real install provides; the plan explicitly notes a package missing them is broken and the read should throw loud. The convertible-loop tests (which `rm` + symlink the real `gsd-core`/`scripts`/`package.json`) remained byte-equal green.
- **Files modified:** `test/installer/stage.test.cjs`
- **Commit:** `2231886` (committed with Task 1, since the fixture change is required for Task 1's edit to keep the suite green).

This was anticipated by the plan ("if either is genuinely absent the read throws loud (acceptable)") and the acceptance criterion ("All 188 existing tests still pass"); updating the fixture to satisfy the new package contract is the correct resolution, not weakening the fail-loud read.

## Self-Check: PASSED

- src/installer/stage.cjs — FOUND (modified)
- test/installer/stage.test.cjs — FOUND (modified)
- test/installer/staged-shim-loads.test.cjs — FOUND (created)
- Commit 2231886 — FOUND
- Commit be4002a — FOUND
- `npm test` — 189/189 pass, 0 fail
- Regression test fails RED against pre-fix stage.cjs (HEAD~1), GREEN with the fix — verified
