---
phase: 08-model-neutralization
verified: 2026-07-03T00:00:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 8: Model Neutralization Verification Report

**Phase Goal:** Add a converter pass so zero model references reach emitted `.bob/` artifacts — Bob owns model routing. Neutrality is verified by a zero-literal invariant assertion (not byte-golden). SC: NEUTRAL-01 (strip machine-readable model directives), NEUTRAL-02 (rewrite inline tier prose to neutral wording), NEUTRAL-03 (zero-literal invariant over the emitted converted set, fails loud, passes 1.6.1 emission, authored as a Phase 11 device-runnable acceptance step).
**Verified:** 2026-07-03
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `neutralizeModelReferences()` wraps BOTH converter outputs in stage.cjs's convertible loop before `stageFile()` (D-02) | ✓ VERIFIED | `src/installer/stage.cjs:32` destructures `neutralizeModelReferences` from `../bob-adapter.cjs`; L284 wraps `convertClaudeCommandToBobCommand`, L289 wraps `convertClaudeCommandToBobSkill`, both inside `Buffer.from(...)` before `stageFile`. |
| 2 | ONE shared model-literal SOURCE constant powers BOTH the pass and `scanModelLiterals` (D-03) | ✓ VERIFIED | `MODEL_TIER_RE_SOURCE`, `MODEL_DIRECTIVE_RE_SOURCE`, `MODEL_ID_RE_SOURCE` (bob-adapter.cjs:49,57,72) consumed by `neutralizeModelReferences` (L105-109) AND `scanModelLiterals` (L135-137). No shared `/g` instance — fresh RegExps built per use, `lastIndex` reset per line. |
| 3 | A real full staging run emits `.bob/commands`+`.bob/skills` with ZERO tier tokens and ZERO residual directives against the full 1.6.1-derived emission (NEUTRAL-03) | ✓ VERIFIED | `NEUTRAL-03: the full emitted .bob/ converted set contains ZERO model literals` passes (repoRoot=pkgRoot, scans only `commands/`+`skills/` gsd- artifacts, never `gsd-core/`). Suite 10/10 green. |
| 4 | A seeded tier-prose + directive source is emitted neutral end-to-end through the converter+stage seam (NEUTRAL-01/02) | ✓ VERIFIED | `WIRING: a seeded tier-prose + directive source emerges neutral through stage.cjs` passes — asserts `scanModelLiterals(emitted) === []` AND neutral wording present on both `commands/gsd-demo.md` and `skills/gsd-demo/SKILL.md`. |
| 5 | `test/model-neutrality.test.cjs` fails loud listing every file:line:token, never a bare count (D-04) | ✓ VERIFIED | Invariant assert builds `hits` as `` `${root}/${rel}:${h.line}:${h.token}` `` and `assert.deepEqual(hits, [], <message listing every hit>)`. WR-01 test exercises detector parity: a surviving date-infixed id is flagged AS THE FULL ID. Behavioral: the detector-flags-survivor path is tested (line 175-179), not presence-only. |
| 6 | ACCEPTANCE-CHECKLIST.md gains insert-only AC-27; AC-01..AC-26 byte-unchanged (D-04, Pitfall 4) | ✓ VERIFIED | `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` present at L267, follows frozen block shape (Cmd/Expect/Confirms/Result); 27 total AC headers, AC-20..AC-26 intact and unchanged. |
| 7 | `test/acceptance-coverage.test.cjs` green: detects real `## Milestone v2.0 Requirements` boundary, admits AC-27→NEUTRAL-03, still rejects typos (Open Q1 option a) | ✓ VERIFIED | Boundary string fixed (L72 `md.indexOf('## Milestone v2.0 Requirements')`); `declaredRequirementIds()` added (L94) and used as phantom-ref validity set (L156). Suite 3/3 green. |
| 8 | Pitfall-1 pre-collapse is brand-agnostic — NO model-vendor brand name in `src/bob-adapter.cjs` | ✓ VERIFIED | `grep -ciE '\b(opus\|sonnet\|haiku)\b\|claude-' src/bob-adapter.cjs` → 0. Tier tokens assembled from base64 array (L41); `MODEL_ID_RE_SOURCE` uses `[A-Za-z]+` vendor wildcard, no named vendor. `backend-neutrality.test.cjs` 3/3 green. |

**Score:** 8/8 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/bob-adapter.cjs` | Exports 5 new symbols | ✓ VERIFIED | `MODEL_TIER_RE_SOURCE`, `MODEL_DIRECTIVE_RE_SOURCE`, `MODEL_TIER_REPLACEMENTS`, `neutralizeModelReferences`, `scanModelLiterals` all in module.exports (L381-385). Substantive: real ordered-replacement logic + shared-source detector. |
| `src/installer/stage.cjs` | Post-pass wired around both converter outputs | ✓ VERIFIED | Destructure + 2 wrapped call sites (L32, 284, 289). Raw `.bob/gsd-core/**` payload copy untouched (D-01). |
| `test/model-neutrality.test.cjs` | Unit + wiring + invariant + self-check | ✓ VERIFIED | 10 tests, all groups present, green. |
| `test/acceptance-coverage.test.cjs` | Boundary fix + declared-id phantom-ref set | ✓ VERIFIED | Both surgical changes present; green. |
| `.planning/ACCEPTANCE-CHECKLIST.md` | AC-27 appended insert-only | ✓ VERIFIED | AC-27 present, frozen items intact. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| stage.cjs convertible loop | neutralizeModelReferences() | wraps both converter outputs before stageFile() | ✓ WIRED | L284/L289 — emit-time neutralization seam confirmed; WIRING test proves it runs. |
| bob-adapter SOURCE constants | neutralizeModelReferences + scanModelLiterals | single source of truth (D-03) | ✓ WIRED | Both functions build fresh RegExps from the same 3 SOURCE strings. |
| AC-27 `Confirms: NEUTRAL-03` | acceptance-coverage phantom-ref set | declaredRequirementIds() includes v2 IDs | ✓ WIRED | NEUTRAL-03 admitted; typos still rejected. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Invariant passes on full real emission | `node --test test/model-neutrality.test.cjs` | 10/10 pass | ✓ PASS |
| Acceptance coverage green | `node --test test/acceptance-coverage.test.cjs` | 3/3 pass | ✓ PASS |
| No brand literal introduced | `node --test test/backend-neutrality.test.cjs` | 3/3 pass | ✓ PASS |
| Staging/idempotency contract holds | `node --test test/installer/stage.test.cjs` | 15/15 pass | ✓ PASS |
| Full suite (only known unrelated failure) | `node --test` | 200 tests, 199 pass, 1 fail (CORE-02 archived-fixture, out of scope) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NEUTRAL-01 | 08-01-PLAN | Converter strips machine-readable model directives from emitted `.bob/` artifacts | ✓ SATISFIED | Directive-line strip in `neutralizeModelReferences` step 2; NEUTRAL-01 unit test + WIRING test green. |
| NEUTRAL-02 | 08-01-PLAN | Converter rewrites inline tier prose to model-neutral wording | ✓ SATISFIED | Tier rewrite step 3 + `MODEL_TIER_REPLACEMENTS`; before/after unit tests green. |
| NEUTRAL-03 | 08-01-PLAN | Invariant asserts zero model literals across emitted set, fails loud, passes 1.6.1 emission, authored as Phase 11 device step | ✓ SATISFIED | Invariant test green on full emission; loud file:line:token failure mode; AC-27 authored insert-only. |

All 3 phase requirement IDs accounted for and mapped to REQUIREMENTS.md (L96-98, L197-199 marked Complete).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX in any modified file | — | Clean |

### Code Review Disposition (08-REVIEW.md)

- **WR-01** (false-green: date-infixed model ID surviving undetected) — FIXED, commit `3bcefe5`, with regression test (`NEUTRAL-02/03 (WR-01)` group, line 155-180). Verified: `MODEL_ID_RE_SOURCE` now tolerates intervening version segments (`[A-Za-z]+(?:[.-][A-Za-z0-9]+)*[.-](tier)...`) AND `scanModelLiterals` detects the full id shape — rewrite/detector asymmetry closed.
- **WR-02 / WR-03 / IN-01 / IN-02** — deferred (latent; no trigger tokens in current 10-command corpus; WR-02/WR-03 would narrow the locked D-03 rewrite design — a false-positive/false-negative tradeoff the user owns). Not gaps against this phase goal.

### Out-of-Scope Confirmation (D-01)

Raw-copied `.bob/gsd-core/**` payload is intentionally excluded from neutralization and the invariant (executable model-resolver runtime + GSD config vocabulary). stage.cjs payload byte-copy is untouched; the invariant enumerator scopes to `commands/`+`skills/` gsd- artifacts only. Not flagged as a gap — deliberate, documented decision.

### Gaps Summary

None. All 8 must-have truths verified against the codebase with behavioral test evidence. All 3 requirement IDs satisfied. The single full-suite failure (`core-loop-contract.test.cjs` CORE-02) is the documented, pre-existing, out-of-scope archived-fixture-path issue, unrelated to model neutralization.

---

_Verified: 2026-07-03_
_Verifier: Claude (gsd-verifier)_
