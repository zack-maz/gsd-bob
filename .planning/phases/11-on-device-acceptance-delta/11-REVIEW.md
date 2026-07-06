---
status: resolved
phase: 11-on-device-acceptance-delta
depth: standard
files_reviewed: 3
reviewed: 2026-07-04
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
resolved: 6
---

# Phase 11: Code Review Report

**Depth:** standard · **Files reviewed:** 3 · **Status:** all findings resolved

Advisory review of the phase's two hermetic guard tests + the frozen fixture. No blockers. All three WARNINGs and the actionable INFO were about the guards being *weaker than their docstrings claimed* (whole-file substring matches, and an insert-only end-boundary coupled to mutable downstream prose) — each narrowed the class of drift a guard could catch. All applied as test-only hardening; the full suite stays green (16/16 acceptance+neutrality tests, 321/322 overall — the lone failure is the pre-existing `core-loop-contract` phase-04 ENOENT, unrelated).

**Files reviewed:**
- `test/acceptance-delta-coverage.test.cjs`
- `test/acceptance-insert-only.test.cjs`
- `test/fixtures/acceptance/frozen-ac01-26.md`

## Warnings

### WR-01 — Coverage match was a whole-file substring, not a `Cmd:`-scoped step — RESOLVED
`test/acceptance-delta-coverage.test.cjs`. The ACCEPT-01 assertion used `checklist.includes(`${c}.md`)` against the entire 50 KB file, so a Supported command merely name-dropped in prose / a roll-up row / another step's example would satisfy coverage with no dedicated AC step (false-negative). **Fix applied:** scope the match to `Cmd:` lines only. Verified all 28 Supported commands' `gsd-<name>.md` appear on a `Cmd:` line before applying, so no regression.

### WR-02 — Insert-only end anchor was AC-27's mutable full title — RESOLVED
`test/acceptance-insert-only.test.cjs`. `END` was `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` — the description-bearing title of a block that lives *outside* the frozen range and is legitimately editable. A benign AC-27 title reword would make `indexOf` return −1 and fail the guard, falsely implicating the untouched AC-01..26 region. **Fix applied:** anchor `END` on the ID prefix `## AC-27`. Verified it occurs exactly once as a header and starts at the identical byte offset (36085) as the full title, so the slice — and the committed fixture — are byte-unchanged. Added `assertSingleAc27Header` so the end anchor can never become ambiguous silently.

### WR-03 — `>= 28` floor could mask a malformed roster bullet — RESOLVED
`test/acceptance-delta-coverage.test.cjs`. The strict bullet regex silently skips a malformed entry; combined with a lower-bound floor, a future 29th malformed bullet would escape coverage without failing. **Fix applied:** cross-check the cleanly-parsed count against the raw `- gsd-` bullet count inside `supportedCommands()` (`assert.equal`), so a dropped/malformed bullet fails loud.

## Info

### IN-01 — Second assertion matched bare ID anywhere, not a `Confirms:` line — RESOLVED
`test/acceptance-delta-coverage.test.cjs`. `checklist.includes(id)` matched section headers (e.g. `## AC-28 — … (ACCEPT-01)`) too. **Fix applied:** scope to `Confirms:` lines, matching the stated contract.

### IN-02 — Roster-slice depends on `## Supported`/`## Unsupported` substring uniqueness — ACKNOWLEDGED
Not a current defect (headings are unique today). Left as-is; noted for future prose changes.

### IN-03 — Fixture is structurally sound — NO ACTION
Confirmed the fixture is a correct byte-frozen boundary snapshot (`## AC-01 …` → AC-26 `Result:` trailing), matching the live slice byte-for-byte.

---

*Reviewed: 2026-07-04 · gsd-code-reviewer (standard) · all findings resolved in commit following execution*
