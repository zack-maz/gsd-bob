---
phase: 09-command-expansion
plan: 02
subsystem: testing
tags: [node-test, converter, stage, model-neutrality, roster, directory-derived]

# Dependency graph
requires:
  - phase: 09-01
    provides: 28 vendored commands/gsd sources, regenerated SUPPORT-ROSTER.md, re-frozen quality-gate fixtures
provides:
  - test/command-expansion.test.cjs — directory-derived structural + count==28 + zero-literal + roster-reflects-28 verification suite
  - phase gate proof that the roster-agnostic invariants hold over the full 28-command emission
affects: [command-expansion, verification, future-command-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Directory-derived test spine: enumerate stems via readdirSync(commands/gsd), never a hardcoded name list — auto-covers future additions"
    - "Single-pinned magic count: literal 28 appears in exactly one CMD-01 guard; every other count derives from source-stem length"

key-files:
  created:
    - test/command-expansion.test.cjs
  modified: []

key-decisions:
  - "Two-roster divergence Option A: CMD-02 verified against repo-root generated SUPPORT-ROSTER.md + count==28, NOT the installed stage.cjs renderRoster 5-entry representative list; stage.cjs left untouched (source-only phase)"
  - "Composed the suite from three existing harness idioms (quality-gate-equivalence structural loop, model-neutrality scanModelLiterals + scratch stage(), roster-capmap directory enumeration) rather than authoring new machinery"

patterns-established:
  - "Programmatic forbidden-token construction via .join('') so a neutrality test's own prose never self-trips its assertions"
  - "Supported-section slicing before roster stem assertion so an Unsupported reason line can never falsely satisfy a Supported check"

requirements-completed: [CMD-01, CMD-02, CMD-03]

coverage:
  - id: D1
    description: "All 28 commands/gsd sources convert to structurally Bob-conformant command + skill (non-empty description, argument-hint iff declared, effort/allowed-tools/agent/type/requires stripped, skill frontmatter name+description only, no config-home path / no colon dialect, carries .bob home + hyphen form)"
    requirement: "CMD-03"
    verification:
      - kind: unit
        ref: "test/command-expansion.test.cjs#Group A structural equivalence (per stem)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every converted command + skill over the full 28 carries zero model literals per scanModelLiterals; NEUTRAL-03 stays green at 28"
    requirement: "CMD-03"
    verification:
      - kind: unit
        ref: "test/command-expansion.test.cjs#Group B neutrality (per stem)"
        status: pass
      - kind: unit
        ref: "test/model-neutrality.test.cjs#NEUTRAL-03 full emitted set zero literals"
        status: pass
    human_judgment: false
  - id: D3
    description: "A scratch stage() run emits exactly 28 .bob/commands and 28 .bob/skills; source count pinned to 28 in one guard"
    requirement: "CMD-01"
    verification:
      - kind: integration
        ref: "test/command-expansion.test.cjs#CMD-01 scratch stage() emitted count === source count"
        status: pass
    human_judgment: false
  - id: D4
    description: "Repo-root SUPPORT-ROSTER.md lists every commands/gsd stem as gsd-<stem> under Supported"
    requirement: "CMD-02"
    verification:
      - kind: unit
        ref: "test/command-expansion.test.cjs#CMD-02 roster Supported section reflects all stems"
        status: pass
      - kind: unit
        ref: "test/roster-capmap.test.cjs#every command Supported / every skip traces to gate"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-07-03
status: complete
---

# Phase 9 Plan 02: Command Expansion Verification Summary

**Directory-derived test suite proving all 28 vendored commands convert to structurally-conformant, zero-model-literal Bob command+skill pairs, emit exactly 28 commands + 28 skills via a real scratch stage() run, and appear Supported in the regenerated roster — with the literal 28 pinned in exactly one CMD-01 guard.**

## Performance

- **Duration:** ~8 min
- **Tasks:** 2
- **Files created:** 1 (test/command-expansion.test.cjs)
- **Files modified:** 0 source/machinery files

## Accomplishments
- Authored `test/command-expansion.test.cjs` — a `node:test`/`node:assert/strict` suite that iterates the FULL `commands/gsd/*.md` directory (drift-proof spine, D-05) instead of any hardcoded name list, auto-covering the 18 additions and every future command.
- Group A (structural, per stem ×28): non-empty description, argument-hint kept iff the source declared one, `effort`/`allowed-tools`/`agent`/`type`/`requires` stripped, skill frontmatter is `name` + `description` only, bodies carry no Claude config-home path / no colon dialect and carry the `.bob` home + hyphen form.
- Group B (neutrality, per stem ×28): `scanModelLiterals` returns `[]` for each converted command and skill — reuses the shared Phase-8 detector, no second regex authored.
- Group C (CMD-01): a real scratch `stage()` run into an `os.tmpdir()` target emits `gsd-*` command count === skill count === source-stem count; a single guard pins `stems.length === 28`.
- Group D (CMD-02): repo-root `SUPPORT-ROSTER.md` Supported section lists every `gsd-<stem>` (Supported-section sliced first so no Unsupported reason line can falsely satisfy it).
- Phase gate: full `npm test` green over the 28-command emission except the one documented pre-existing failure.

## Task Commits

1. **Task 1: Author test/command-expansion.test.cjs** - `ae57275` (test) — TDD task; the deliverable is the verification test itself over already-green machinery, so RED/GREEN collapse to a single test commit that passes on first green run.
2. **Task 2: Phase gate — full invariant family green** - no commit (verification-only, no file changes).

**Plan metadata:** committed with this SUMMARY.

## Files Created/Modified
- `test/command-expansion.test.cjs` - Directory-derived structural equivalence (×28) + per-stem zero-model-literal scan + scratch-stage() emitted count==28 + roster-reflects-28 verification suite. 115 assertions, exits 0.

## Decisions Made
- **Two-roster divergence = Option A (locked in CONTEXT/plan):** CMD-02 asserts against the repo-root generated `SUPPORT-ROSTER.md` + `count==28` emission gate, NOT the installed `stage.cjs renderRoster` hardcoded 5-entry representative list. `stage.cjs` deliberately left untouched (staging-engine edits out of scope for this source-only phase). The installed roster showing 5 representative entries is a known, accepted divergence — not a silent gap.
- **Composed, not rebuilt:** the suite reuses three existing harness idioms verbatim (structural loop, `scanModelLiterals`, scratch `stage()` harness) rather than authoring new neutrality regexes or emission machinery (D-06).
- **Single pinned 28:** the literal `28` appears in exactly one CMD-01 guard; all other counts derive from `readdirSync(commands/gsd).length` so the suite can never go stale (Pitfall 4).

## Deviations from Plan

None - plan executed exactly as written. (One trivial in-authoring fix: a block-comment line contained a `gsd-*/SKILL.md` glob whose `*/` prematurely closed the JSDoc comment, tripping a `SyntaxError`; rewrote the comment prose to avoid the `*/` sequence. This was a same-file authoring correction within Task 1, not a deviation-rule fix to any other artifact.)

## Issues Encountered
- **Pre-existing, out-of-scope suite failure (accepted):** `npm test` reports 313 pass / 1 fail. The single failure is `test/core-loop-contract.test.cjs:126` (CORE-02), which hardcodes a read of the missing/uncommitted `.planning/phases/04-core-loop-port/04-01-PLAN.md`. It reproduces at HEAD independent of Phase 9 and is documented in `.planning/phases/09-command-expansion/deferred-items.md` (with a git-stash reproduction proof). Not fixed here — it is out of Phase 9 scope and must not be papered over by creating planning files. Every OTHER test, including the new suite and the Phase-8 NEUTRAL-03 invariant, passes.

## Next Phase Readiness
- Phase 9 verification gate satisfied: 28 sources → 28 emitted commands + 28 skills, roster shows 28 Supported, zero model literals over the full converted set.
- The directory-derived suite auto-covers any future command addition with no test edits — add a `commands/gsd/*.md` source and regenerate the roster, and the count/structural/neutrality/roster assertions extend automatically.

## Threat Flags

None — no new security surface introduced. The plan's threat register (T-09-02 information disclosure, T-09-04 count spoofing, T-09-03 roster repudiation) is fully mitigated by Groups B, C, and D respectively; the accepted supply-chain item (T-09-SC) holds — no packages installed, only `node:test`/`node:assert` builtins and the already-vendored converter via `test/_helpers/vendor.cjs`.

## Self-Check: PASSED

- FOUND: test/command-expansion.test.cjs
- FOUND: commit ae57275

---
*Phase: 09-command-expansion*
*Completed: 2026-07-03*
