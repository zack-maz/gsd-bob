---
phase: 08-model-neutralization
plan: 01
subsystem: bob-adapter + installer staging + neutrality invariant
tags: [model-neutrality, bob-adapter, stage, invariant, acceptance-checklist]
requires:
  - src/bob-adapter.cjs (existing exported-helper idiom)
  - src/installer/stage.cjs (convertible loop)
  - gsd-core/bin/lib/runtime-artifact-conversion.cjs (vendored converters, read-only)
  - test/installer/stage.test.cjs (scratch-tmpdir harness)
  - test/backend-neutrality.test.cjs (loud zero-literal assert idiom)
provides:
  - neutralizeModelReferences(content) — emit-time model-routing neutralization pass
  - scanModelLiterals(content) — shared zero-literal detector
  - MODEL_TIER_RE_SOURCE / MODEL_DIRECTIVE_RE_SOURCE / MODEL_TIER_REPLACEMENTS
  - test/model-neutrality.test.cjs — NEUTRAL-03 invariant
  - .planning/ACCEPTANCE-CHECKLIST.md AC-27 (ACCEPT-02 seed)
affects:
  - Phase 9 (all 18 added commands born model-neutral, auto-caught on leak)
  - Phase 11 (AC-27 device-runnable neutrality step)
tech-stack:
  added: []
  patterns:
    - single-source shared regex (SOURCE strings, never a shared /g RegExp)
    - emit-time post-pass wrapping converter output (adapter-isolation, D-02)
    - real-staging invariant harness (repoRoot = pkgRoot)
    - brand-literal-free adapter via programmatic base64 token assembly
key-files:
  created:
    - test/model-neutrality.test.cjs
  modified:
    - src/bob-adapter.cjs
    - src/installer/stage.cjs
    - test/acceptance-coverage.test.cjs
    - .planning/ACCEPTANCE-CHECKLIST.md
decisions:
  - D-01 affirmed — scope = emitted converted set only; raw .bob/gsd-core/** untouched
  - D-02 — neutralizer in bob-adapter.cjs, post-pass in stage.cjs; vendored converter never edited
  - D-03 — one shared SOURCE constant powers both the pass and the invariant
  - D-04 — loud node:test invariant (file:line:token) + insert-only AC-27
  - acceptance-coverage Open Q1 resolved via option (a): boundary fix + declared-id phantom-ref set
metrics:
  duration: ~9 min
  completed: 2026-07-03
  tasks: 3
  files_created: 1
  files_modified: 4
status: complete
---

# Phase 8 Plan 01: Model Neutralization Summary

Added a durable emit-time model-neutralization pass (`neutralizeModelReferences`) plus a loud zero-literal invariant (`test/model-neutrality.test.cjs`), both driven by ONE shared SOURCE-string regex in `src/bob-adapter.cjs`, so every Bob-native artifact gsd-bob emits through its converters (`.bob/commands/gsd-*.md` + `.bob/skills/gsd-*/SKILL.md`) is born model-neutral and any future leak is caught with a `file:line:token` failure.

## What was built

### Task 1 — shared constants + pass + detector (`src/bob-adapter.cjs`)

Five new exports:
- `MODEL_TIER_RE_SOURCE` — `\b(<tier>|<tier>|<tier>)\b` SOURCE string; tier tokens assembled programmatically from a base64 array so the backend-neutral adapter carries **zero bare model-brand literals** (verified: `grep -ciE '\b(opus|sonnet|haiku)\b|claude-' src/bob-adapter.cjs` → 0).
- `MODEL_DIRECTIVE_RE_SOURCE` — line-anchored `^…(model|effort|model_profile|resolve_model_ids):.*$` (a prose mention of a config key never trips; only a literal directive line does).
- `MODEL_TIER_REPLACEMENTS` — tier→capability-neutral wording map (higher-capability / balanced / faster), built programmatically keyed on the decoded tier tokens.
- `neutralizeModelReferences(content)` — three ordered ReDoS-safe replacements: (1) brand-agnostic vendor-prefixed model-ID pre-collapse → "the configured model" (Pitfall 1), (2) residual directive-line strip (NEUTRAL-01 defense-in-depth), (3) bare tier-prose rewrite (NEUTRAL-02). Idempotent.
- `scanModelLiterals(content)` — the shared per-line detector (fresh RegExps, `lastIndex` reset) reused by the invariant so pass and test cannot drift (D-03).

### Task 2 — post-pass wiring (`src/installer/stage.cjs`)

`neutralizeModelReferences` added to the `../bob-adapter.cjs` destructure and wrapped around BOTH converter outputs in the convertible loop before `stageFile`:
- `Buffer.from(neutralizeModelReferences(convertClaudeCommandToBobCommand(content, name)))`
- `Buffer.from(neutralizeModelReferences(convertClaudeCommandToBobSkill(content, name)))`

The raw `.bob/gsd-core/**` byte-copy (structural piece 2) was left untouched (D-01); the vendored converter was never edited (D-02).

### Task 3 — invariant + acceptance wiring

- **`test/model-neutrality.test.cjs` (CREATE):** unit (before/after: tier rewrite, directive strip, vendor-id pre-collapse, peer-CLI allowlist), wiring (a seeded tier-prose + directive source staged through the real `stage.cjs` seam emerges neutral), full-emission invariant (`repoRoot = pkgRoot`, scans only `commands/` + `skills/`, never `gsd-core/`, loud `file:line:token`), and a non-empty self-check. Green on landing (9/9).
- **`test/acceptance-coverage.test.cjs` (MODIFY):** two surgical changes — (1) fixed the boundary detection in `canonicalSCs()` from the never-matching `'## v2 Requirements'` to the real heading `'## Milestone v2.0 Requirements'` (this was the live pre-existing RED); (2) added `declaredRequirementIds()` (all IDs above `## Future Requirements`, i.e. v1 + v2.0) as the phantom-ref validity set, so `AC-27 → NEUTRAL-03` is admitted while typos (`NEUTRAL-99`) / unknown families still fail. The no-orphan-SC check (VERIFY-01a) stays v1-scoped.
- **`.planning/ACCEPTANCE-CHECKLIST.md` (MODIFY):** appended insert-only `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` after AC-26; AC-01..AC-26 byte-unchanged (0 removed/changed lines).

## Exported symbols

`MODEL_TIER_RE_SOURCE`, `MODEL_DIRECTIVE_RE_SOURCE`, `MODEL_TIER_REPLACEMENTS`, `neutralizeModelReferences`, `scanModelLiterals`.

## stage.cjs call sites wrapped

Both `stageFile(...)` emissions in the convertible loop (flat command + nested SKILL.md).

## acceptance-coverage.test.cjs changes

1. Boundary string: `'## v2 Requirements'` → `'## Milestone v2.0 Requirements'` in `canonicalSCs()`.
2. New `declaredRequirementIds()` (v1 + v2.0, bounded above `## Future Requirements`) used as the VERIFY-01b phantom-ref validity set in place of the v1-only canonical set.

## Verification

- `node --test test/model-neutrality.test.cjs` → 9/9 pass (invariant green against the full real emission).
- `node --test test/acceptance-coverage.test.cjs` → pass (previously-RED boundary assertion now green; AC-27 admitted).
- `node --test test/backend-neutrality.test.cjs` → 3/3 pass (no brand literal introduced).
- `node --test test/installer/stage.test.cjs` → 15/15 pass (staging/idempotency contract holds).
- Full suite: 198 tests, 197 pass, 1 fail.

## Deviations from Plan

None — plan executed exactly as written. Task 1 carried `tdd="true"`; since the durable test file is authored in Task 3 (per the plan's own file ownership) and the phase config has `tdd_mode: false`, Task 1 was validated via the plan's specified inline `node -e` assertions and the Task 3 suite rather than a separate throwaway RED commit. All specified behaviors are covered by `test/model-neutrality.test.cjs`.

## Out of Scope (pre-existing, unrelated)

The single remaining full-suite failure is `test/core-loop-contract.test.cjs` **CORE-02** ("a produced PLAN.md carries the documented section + frontmatter markers"), which reads the archived `.planning/phases/04-core-loop-port/04-01-PLAN.md` fixture. It is unrelated to model neutralization and explicitly excluded from this phase's whole-suite-green criterion. Not touched.

## Self-Check: PASSED

- FOUND: test/model-neutrality.test.cjs
- FOUND commit 0f71763 (feat: bob-adapter constants + functions)
- FOUND commit 2ff54dc (feat: stage.cjs post-pass wiring)
- FOUND commit 93aa9b3 (test: invariant + acceptance-coverage fix + AC-27)
