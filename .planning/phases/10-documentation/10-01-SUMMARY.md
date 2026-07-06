---
phase: 10-documentation
plan: 01
subsystem: testing
tags: [documentation, node-test, generator, drift-guard, roster, cjs]

# Dependency graph
requires:
  - phase: 09-command-expansion
    provides: "commands/gsd/*.md 28-source set + generated SUPPORT-ROSTER.md Supported list"
provides:
  - "README ## Supported skills expanded 10 -> 28, clustered under 5 h3 subheads (DOCS-01)"
  - "COMMANDS.md — generated 28-row per-command reference from source frontmatter (DOCS-02)"
  - "scripts/generate-command-reference.cjs — directory-derived COMMANDS.md generator"
  - "test/docs-conformance.test.cjs — 3 set-equality drift guards vs SUPPORT-ROSTER Supported set (D-03)"
affects: [10-02, 10-03, documentation, acceptance-delta]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Directory-derived doc generator mirroring generate-support-roster.cjs (node builtins only)"
    - "Hermetic node:test drift guard: section-slice + set-equality against the generated roster"

key-files:
  created:
    - scripts/generate-command-reference.cjs
    - COMMANDS.md
    - test/docs-conformance.test.cjs
  modified:
    - README.md

key-decisions:
  - "COMMANDS.md is generated (not hand-authored) so blurbs trace verbatim to source frontmatter and cannot drift"
  - "README cluster subheads are h3 so the next h2 (## Flagged gaps) stays the section boundary for the conformance slice"
  - "package.json files allowlist left untouched — COMMANDS.md/ARCHITECTURE.md/MAINTAINING.md stay repo-only (D-07)"

patterns-established:
  - "Doc-drift guard: slice heading->next-## section, build gsd- token Set, assert.deepEqual sorted arrays"
  - "Single pinned literal 28 lives in one guard; every other count derives from readdirSync stems"

requirements-completed: [DOCS-01, DOCS-02]

coverage:
  - id: D1
    description: "README ## Supported skills lists all 28 roster commands under 5 h3 cluster subheads, gaps stay flagged, 3 new docs linked"
    requirement: "DOCS-01"
    verification:
      - kind: unit
        ref: "test/docs-conformance.test.cjs#assertion 2: README ## Supported skills token set == roster Supported set"
        status: pass
    human_judgment: false
  - id: D2
    description: "COMMANDS.md — 28-row per-command reference generated from commands/gsd/*.md frontmatter description"
    requirement: "DOCS-02"
    verification:
      - kind: unit
        ref: "test/docs-conformance.test.cjs#assertion 3: COMMANDS.md token set == roster Supported set"
        status: pass
      - kind: other
        ref: "node scripts/generate-command-reference.cjs (regenerates 28-row COMMANDS.md)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hermetic doc-conformance drift guard: roster == stems, README == roster, COMMANDS == roster; catches injected drift"
    verification:
      - kind: unit
        ref: "test/docs-conformance.test.cjs (4 tests, all pass; injected gsd-fake bullet proven to fail assertion 2)"
        status: pass
    human_judgment: false

# Metrics
duration: ~10min
completed: 2026-07-04
status: complete
---

# Phase 10 Plan 01: Roster-Derived Documentation & Drift Guard Summary

**README Supported skills grown 10 → 28 (5 h3 clusters), a generated 28-row COMMANDS.md reference, and a hermetic node:test drift guard pinning both to the generated SUPPORT-ROSTER Supported set.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-04
- **Tasks:** 3
- **Files modified:** 4 (1 modified, 3 created)

## Accomplishments
- README `## Supported skills` expanded from 10 to the full 28 roster commands, grouped under 5 `###` cluster subheads (core loop, quality gates, milestone lifecycle, planning aids, context & maintenance); the 2 flagged gaps remain only in `## Flagged gaps`; `## Documentation` now links COMMANDS.md, ARCHITECTURE.md, MAINTAINING.md.
- `scripts/generate-command-reference.cjs` deterministically emits a 28-row COMMANDS.md whose per-command blurbs are lifted verbatim from each `commands/gsd/<stem>.md` frontmatter `description:` — mirrors generate-support-roster.cjs (directory-derived, GENERATED banner, fixed repoRoot write path, ReDoS-safe regexes).
- `test/docs-conformance.test.cjs` implements 3 set-equality assertions (roster==stems, README==roster, COMMANDS==roster) plus the single pinned `28` guard; drift-catching proven by a temporary `gsd-fake` injection that failed assertion 2, then reverted.

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand README Supported skills to 28** - `4bfe8ff` (docs)
2. **Task 2: Generate COMMANDS.md via new generator** - `f7d4b65` (feat)
3. **Task 3: Add doc-conformance drift guard** - `12485b5` (test)

## Files Created/Modified
- `README.md` - Supported skills grown 10→28 under 5 h3 clusters; Documentation section links 3 new docs
- `scripts/generate-command-reference.cjs` - directory-derived COMMANDS.md generator (node builtins only)
- `COMMANDS.md` - generated 28-row per-command reference table (repo-only, not in files allowlist)
- `test/docs-conformance.test.cjs` - hermetic 3-assertion drift guard against the roster Supported set

## Decisions Made
- COMMANDS.md is generated rather than hand-authored so every blurb traces verbatim to source frontmatter and the D-03 guard keeps it honest.
- README cluster subheads are h3 (not h2) so `## Flagged gaps` remains the first h2 after `## Supported skills`, keeping the conformance test's heading-to-next-h2 slice correct.
- `package.json` `files` allowlist untouched (D-07): only README.md ships among the docs; COMMANDS/ARCHITECTURE/MAINTAINING stay repo-only.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm test` shows 1 pre-existing failure in `test/core-loop-contract.test.cjs` (CORE-02): it hard-references an archived `.planning/phases/04-core-loop-port/04-01-PLAN.md`. Proven pre-existing and OUT OF SCOPE — the suite is `pass 313 / fail 1` without this plan's new file and `pass 317 / fail 1` with it (the +4 are this plan's passing assertions; the single failure is unchanged, so plan 10-01 introduces zero regressions). Logged to `.planning/phases/10-documentation/deferred-items.md` with a recommended fix; not touched per the scope boundary.

## Next Phase Readiness
- README now links ARCHITECTURE.md and MAINTAINING.md ahead of their creation in plans 10-02 and 10-03; both links currently point at not-yet-created repo-root files (expected — those plans deliver them).
- The doc-conformance guard is directory-derived and will automatically cover any future command additions/removals via the roster.

## Self-Check: PASSED

All 4 deliverable files exist on disk (README.md, COMMANDS.md, scripts/generate-command-reference.cjs, test/docs-conformance.test.cjs) and all 3 task commits (4bfe8ff, f7d4b65, 12485b5) are present in git history.

---
*Phase: 10-documentation*
*Completed: 2026-07-04*
