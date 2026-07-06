---
phase: 07-gsd-core-1-6-1-sync
plan: 01
subsystem: re-vendor-tooling
tags: [re-vendor, bob-patches, idempotent-script, baseline-capture]
status: complete
requires: []
provides:
  - scripts/apply-bob-patches.cjs
  - .planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md
affects:
  - Phase 07 Plan 02 (runs apply-bob-patches.cjs against restaged pristine 1.6.1)
  - Phase 07 Plan 03 (appends drift classification + SYNC-03 pointer re-verification to notes)
  - Phase 10 DOCS-04 (MAINTAINING runbook — apply-bob-patches.cjs is its executable core)
tech-stack:
  added: []
  patterns:
    - "Byte-perfect inline block embedding via per-line JSON.stringify array + .join('\\n')"
    - "Reuse exported pure transforms (transformContentToHyphen) instead of running the source script as main"
    - "Anchor-based string insertion keyed on stable sibling tokens (never line numbers)"
    - "Idempotency guard per patch step (skip-if-already-applied / content-equality)"
key-files:
  created:
    - scripts/apply-bob-patches.cjs
    - .planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md
  modified: []
decisions:
  - "Store canonical bob blocks as inline per-line JSON.stringify arrays (not String.raw) — backticks appear in ~15 comment lines, making template-literal escaping error-prone; JSON-per-line is mechanically byte-perfect and stays human-readable for the Phase 10 runbook"
  - "Confirmed and implemented the SIX-delta model (RESEARCH §1), correcting CONTEXT.md D-01's incomplete two-edit premise"
  - "Registry anchor = first '\"claude\": {' AFTER 'const runtimes = {' index, to avoid the earlier 'const capabilities' object that also contains a claude key (L212 vs L2712 in the current tree)"
metrics:
  duration: ~25m
  completed: 2026-07-03
  tasks: 2
  files: 2
---

# Phase 07 Plan 01: Re-vendor Prerequisites Summary

Prepared the two prerequisites the destructive 1.5.0→1.6.1 re-vendor depends on — the live re-vendor log seeded with the pre-vendor baseline, and the idempotent `apply-bob-patches.cjs` that reproduces the full six-delta local set — WITHOUT touching the vendored `gsd-core/` payload (the nuke/restage is Plan 02).

## What Was Built

### Task 1 — Pre-vendor baseline (`07-REVENDOR-NOTES.md`)
- Live re-vendor log (D-10/D-11) with a dated header and an empty Command Log section for Plans 02/03 to append to.
- Recorded the actual `npm test` baseline: **189 tests, 186 pass / 3 fail** — matching the RESEARCH prediction exactly.
- Named the 3 failures verbatim as **pre-existing environmental noise** (not re-vendor-related): `acceptance-coverage.test.cjs` :114 and :128 (missing `## v2 Requirements` boundary / archived `.planning/` fixtures) and `core-loop-contract.test.cjs` :126 (ENOENT on archived `04-01-PLAN.md`). Per Pitfall 5, these are explicitly NOT to be fixed in this phase.
- Anchored pre-vendor provenance: git HEAD `d832efa`, `gsd-core/VERSION` = `1.5.0`, target `1.6.1`.
- Seeded placeholder sub-sections: D-03 converter re-verification, D-08 fixture-drift justifications, SYNC-03 pointer re-verification.

### Task 2 — `scripts/apply-bob-patches.cjs` (six-delta idempotent re-injection)
Node-builtins-only (`node:fs`, `node:path`), no network, no `child_process`, writes only under `gsd-core/`. Reuses `transformContentToHyphen` + `readCmdNames` imported from `scripts/fix-slash-commands.cjs` (never runs it as `main` — its require.main runs the wrong hyphen→colon direction, Pitfall 4). Implements all six deltas, each guarded idempotent:

1. **colon→hyphen** — over `gsd-core/{workflows,references,templates,contexts}/**/*.md` only (bin/ excluded); reuses the exported pure transform.
2. **~/.claude→$HOME** — same `.md` doc-tree walk; `/(^|[^\w$])~\/\.claude/g` (covers the `@~/.claude` mandatory-read form; idempotent).
3. **`"bob"` registry block** — anchor-insert before the first `"claude": {` inside `const runtimes = {`; guard on `"id": "bob"`.
4. **Bob converter block (~105 lines) + 3 exports** — anchor-insert before `module.exports = {` and before the `convertClaudeCommandToCursorCommand,` export; guards on `function convertClaudeCommandToBobSkill` / export symbol.
5a. **`"bob"` alias (JSON manifest)** — structured `JSON.parse`→add→`JSON.stringify(…,null,2)+'\n'`.
5b. **`bob` alias (FALLBACK_ALIASES)** — anchor-insert after the `cline:` line in `runtime-name-policy.cjs` (the undocumented 4th data patch, RESEARCH §1/§8).
6. **`gsd-core/VERSION`** = `1.6.1` (tarball ships none; `stage.cjs` L242 throws ENOENT without it), no trailing newline, content-equality idempotent.

The canonical `"bob"` registry block and the ~105-line converter block are embedded as inline per-line `JSON.stringify` arrays joined by `\n` and were verified **byte-identical** to the current vendored tree (captured before the Plan-02 nuke).

## Verification Evidence

- `node --check scripts/apply-bob-patches.cjs` → PASS.
- Plan verify one-liner → `ok` (reuse import present, transforms present, both converters present, VERSION target present).
- Byte-identity: embedded `REGISTRY_BLOCK`/`CONVERTER_BLOCK` === live vendored slices → both `true`.
- Isolated idempotency proof (temp copy of gsd-core with local deltas stripped to emulate pristine): two consecutive runs — first applied all six, second reported all six as no-ops. Post-patch `node --check` on all three patched `.cjs` PASS; registry `"id": "bob"` occurrences = 1; 2 converter fn decls + 2 export lines; manifest `bob` present; name-policy `bob` alias present; VERSION = `"1.6.1"`.
- Real vendored `gsd-core/` tree: `git status --short gsd-core/` clean — **no payload mutation in this plan** (nuke/restage deferred to Plan 02).

## Deviations from Plan

None — plan executed exactly as written. Note: the plan permitted refining *how* the blocks are embedded (RESEARCH Open Question 1 offered inline constants vs fixture dir); inline constants were chosen as directed, using a per-line `JSON.stringify` array rather than a raw template literal because backticks appear in ~15 comment lines of the converter block, which would corrupt a cooked/raw template literal. The resulting string value is byte-identical (verified), satisfying the must-have.

## Known Stubs

None — both artifacts are complete and executable. The `07-REVENDOR-NOTES.md` placeholder sub-sections (D-03/D-08/SYNC-03) are intentional live-log slots that Plans 02/03 fill as-the-work-happens (D-10).

## Self-Check: PASSED

- `scripts/apply-bob-patches.cjs` — FOUND (git-tracked, commit 9283781)
- `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` — FOUND (commit 26257f0)
- Commit `26257f0` — FOUND in git log
- Commit `9283781` — FOUND in git log
