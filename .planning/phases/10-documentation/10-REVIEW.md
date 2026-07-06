---
phase: 10-documentation
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - README.md
  - COMMANDS.md
  - ARCHITECTURE.md
  - MAINTAINING.md
  - scripts/generate-command-reference.cjs
  - test/docs-conformance.test.cjs
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 10: Code Review Report

**Depth:** standard | **Files Reviewed:** 6 | **Status:** issues_found

## Summary

The two `.cjs` files are small and mostly well-guarded: the command-reference generator writes to a fixed `repoRoot`-relative path (`path.join(__dirname, '..', 'COMMANDS.md')`) with no stem interpolated into any write path, all regexes are linear/anchored (no ReDoS), and directory enumeration is fail-closed via `fs.existsSync`. The conformance test's set-equality assertions are sound — section slicing correctly excludes the Flagged-gaps / Unsupported tokens, and all 4 assertions pass against the live tree (28 sources, roster/README/COMMANDS all equal). The security-critical claims in the docstrings hold up.

The defects are in **correctness-under-change**: the reference generator applies no capability gate (unlike the roster generator and the real installer), it inserts descriptions into a markdown table without escaping, and it degrades silently on malformed frontmatter — all three contradict the stated "generated, drift-proof, fail-loud" discipline. There is also an unguarded hardcoded `28` in README prose that the drift-guard does not cover.

## Warnings

### WR-01: Reference generator applies no capability gate — diverges from roster generator and installer

**File:** `scripts/generate-command-reference.cjs:47-52`
**Issue:** `generate-command-reference.cjs` emits a row for **every** `commands/gsd/*.md` stem unconditionally. `generate-support-roster.cjs` and the real installer both pass each candidate through `adapter.gateArtifact(...)` and can move a stem to *Unsupported*. The reference generator never reads `requires`/skip metadata, so its notion of "emitted" is purely "file exists." The COMMANDS.md header claims "One row per emitted command" — but a source with an unmet `requires` would be listed as emitted while the installer gates it out. Harmless today (all 28 current sources are `requires: []`); the moment a gated source lands in `commands/gsd/`, COMMANDS.md becomes factually wrong (and assertion 3 fails at test time, not generation time).
**Fix:** Derive the row set the same way the roster does — filter stems through the bob-adapter gate so the reference and the roster share one definition of "emitted."

### WR-02: Unescaped `|` in description corrupts the markdown table

**File:** `scripts/generate-command-reference.cjs:51`
**Issue:** The generator inserts the frontmatter description verbatim into a table cell with no escaping. GSD descriptions elsewhere in the command family use pipes (e.g. the `gsd-ns-*` namespaced commands). If any such source is ever vendored into `commands/gsd/`, the raw `|` splits the row into extra columns and breaks COMMANDS.md rendering. Latent (no current description contains a pipe).
**Fix:** Escape pipes before interpolation.

### WR-03: Silent empty/malformed-frontmatter handling violates the fail-loud discipline

**File:** `scripts/generate-command-reference.cjs:39-45`
**Issue:** `extractDescription` returns `''` on a missing `description:`, a missing closing `---`, frontmatter not starting at byte 0, or an empty value. The generator then emits a blank cell and still prints success. For a project whose D-02 discipline is "generated-not-hand-edited, cannot silently drift," silently producing a blank description with a green exit code is the wrong failure mode.
**Fix:** Treat an empty description as a hard error so a malformed source fails regeneration instead of emitting a blank row.

### WR-04: README prose `28` is a hardcoded count the drift guard does not cover

**File:** `README.md` (`The 28 skills below…`, `for each of the 28 emitted commands`)
**Issue:** The conformance test pins `stems.length === 28` and asserts set-equality of names, but nothing ties the README prose number to the actual count. If the supported set grows, these two README sentences would silently remain "28."
**Fix:** Drop the numeral in favor of count-agnostic phrasing, or add an assertion tying README prose to `stems.length`.

## Info

### IN-01: Assertion 3 scans the whole COMMANDS.md instead of slicing the table

**File:** `test/docs-conformance.test.cjs:94-101`
**Issue:** Assertion 2 slices the README to its section before collecting tokens, but assertion 3 runs `tokenSet` over the entire COMMANDS.md. Passes today (header has no `gsd-` token) but is inconsistent hardening.
**Fix:** Slice COMMANDS.md to its table body before `tokenSet`, matching the README-slicing pattern.

### IN-02: MAINTAINING.md patch-count granularity is internally inconsistent

**File:** `MAINTAINING.md` (composition box vs delta enumeration)
**Issue:** The payload-composition box says "four Bob data/code patches" (counting the two alias files separately) while the delta enumeration folds both aliases into a single delta #5 ("six deltas"). Same edits, two different counts.
**Fix:** Pick one granularity, or footnote that "both aliases" is one delta spanning two files.
