---
phase: 07-gsd-core-1-6-1-sync
plan: 03
subsystem: revalidation-and-upstream-docs
tags: [sync-01, sync-02, sync-03, golden-drift, upstream-inventory, revendor-notes]
status: complete
requires:
  - gsd-core/ payload restaged at 1.6.1 with six local deltas (Plan 07-02)
  - .planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md (Plans 07-01/07-02 seed)
provides:
  - 1.6.1 payload re-validated against the existing suites (186/3 baseline; invariants 10/10 unmodified)
  - UPSTREAM.md updated to gsd-core 1.6.1 with 6 re-verified pointers + honest converter framing
  - SYNC-01 version-consistency clean outside the payload (README + stage.cjs comment)
  - finalized 07-REVENDOR-NOTES.md with the replayable runbook-seed recipe (Phase 10 DOCS-04)
affects:
  - Phase 10 DOCS-04 (MAINTAINING runbook — this plan's notes are its raw source)
  - Phase 08 NEUTRAL-* (operates on the now-1.6.1 payload)
tech-stack:
  added: []
  patterns:
    - "Run invariants FIRST, then classify each non-baseline failure — never blanket-regenerate goldens (D-08)"
    - "Re-verify every UPSTREAM.md file:line pointer against the actual re-vendored source, never copy stale numbers"
    - "Scope version-consistency asserts to exclude the single stock legacy-cleanup.cjs historical line"
key-files:
  created:
    - .planning/phases/07-gsd-core-1-6-1-sync/07-03-SUMMARY.md
  modified:
    - test/installer/staged-shim-loads.test.cjs (version fixture 1.5.0 → 1.6.1)
    - UPSTREAM.md (1.6.1 + 6 re-verified pointers + name-policy alias + corrected converter framing)
    - README.md (gsd-core 1.5.0 → 1.6.1 + reconciled move summary)
    - src/installer/stage.cjs (comment 1.5.0 → 1.6.1, cosmetic)
    - .planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md (finalized: drift, pointer re-verification, runbook seed)
decisions:
  - "The one guaranteed golden drift (staged-shim-loads version) was applied AFTER running the suite unchanged and confirming it was the only new failure — the three converter/text goldens stayed green, proving the re-injected converters + helpers survived byte-for-byte (D-03 output equivalence)"
  - "UPSTREAM.md inventory grew 5 → 6 artifacts by documenting the previously-undocumented runtime-name-policy.cjs FALLBACK_ALIASES bob entry (the 4th data patch)"
  - "Corrected the false 'no new converter code / already exist upstream' framing: the Bob converters are a vendored ~105-line hand-edit (banner at L2338), grep-absent from the pristine tarball — a parameterized rewrite, not stock upstream"
  - "SYNC-01 version-consistency scoped to exclude the stock legacy-cleanup.cjs:225 historical line (carried forward from the Plan 02 deviation) — editing it would break apply-bob-patches.cjs idempotency"
metrics:
  duration: ~20m
  completed: 2026-07-03
  tasks: 3
  files: 5
---

# Phase 07 Plan 03: 1.6.1 Re-validation + UPSTREAM.md Sync Summary

Closed the phase's validation + docs wave on the main working tree: re-ran the existing test
harness against the re-vendored 1.6.1 bin (applying the D-08 golden-drift policy and confirming
the D-09 invariants pass unmodified), corrected `UPSTREAM.md` to target gsd-core 1.6.1 with all
pointers re-verified against the actual source plus an honest converter framing, swept the last
1.5.0 residue outside the payload, and finalized `07-REVENDOR-NOTES.md` as the Phase 10 runbook seed.

## What Was Built

### Task 1 — Suite re-validation + D-08 drift classification
- **D-09 invariants first, unmodified:** `node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` → **10/10 pass** with both files untouched. backend-neutrality brace-walked the re-injected bob registry block (zero brand literals survived the 1.6.1 re-injection); descriptor confirmed the shim resolves the `.bob` home under the 1.6.1 bin.
- **Full suite unchanged first:** `npm test` → 189 tests, **185 pass / 4 fail**. Diffed against the recorded 186/3 baseline: the 4 failures were the 3 pre-existing environmental-noise tests **plus exactly one new failure** — `staged-shim-loads.test.cjs:65` (`'1.6.1' !== '1.5.0'`), the guaranteed drift. No unexpected regressions; the three converter/text goldens (`skill-golden`, `command-golden`, `text-mode-golden`) stayed **green**.
- **Applied the ONE guaranteed drift:** bumped the version fixture in `staged-shim-loads.test.cjs` L65 to `1.6.1`. Suite returned to the **exact 186/3 baseline** (same three pre-existing failing IDs). Recorded the justification keyed by fixture name in the notes — no blanket regeneration (T-07-05 mitigated).

### Task 2 — SYNC-03 UPSTREAM.md → 1.6.1
- Bumped the targeted version `1.5.0 → 1.6.1` (header + inline mention).
- **Re-verified all pointers against the actual 1.6.1 source** (grep/inspect, never copied stale numbers): registry block `capability-registry.cjs` **L2876–2940**; skill converter impl **L2399** (export L2461), command converter impl **L2427** (export L2462); alias manifest **L79–82**; dot-home resolver `runtime-homes.cjs` **L84–92**; shim **0 bob refs**.
- **Added the 6th artifact:** the previously-undocumented `runtime-name-policy.cjs` **L41** `FALLBACK_ALIASES` bob entry (the 4th data patch) — inventory grew 5 → 6.
- **Corrected the false framing:** replaced "No new converter code / they already exist upstream" with the honest account — the two Bob converters are a vendored ~105-line hand-edit (banner `gsd-bob HAND-EDIT to this GENERATED file` at L2338), grep-absent from the pristine tarball; a parameterized rewrite a maintainer folds into gsd-core's converter family, not stock upstream.

### Task 3 — SYNC-01 residue sweep outside the payload + notes finalized
- `README.md` L93: `gsd-core 1.5.0 → 1.6.1` (and reconciled the one-line move summary to the corrected 6-artifact / two-converter framing).
- `src/installer/stage.cjs` L239: comment `1.5.0 → 1.6.1` (cosmetic — L242 reads VERSION dynamically).
- **Finalized `07-REVENDOR-NOTES.md`:** Task 3 sweep, an explicit "intentionally out of scope" table (stock `legacy-cleanup.cjs:225`, the hermetic `stage.test.cjs` fixture, `.claude/CLAUDE.md` research context, historical `.tgz` / archived phase docs), the D-08 drift justification, the SYNC-03 old→new pointer re-verification, and a **replayable runbook-seed recipe** (pack → nuke → restage → apply-bob-patches → suites+drift → UPSTREAM → version-check) with carried-forward gotchas for Phase 10 DOCS-04.

## Verification Evidence

- **SYNC-02 invariants (D-09):** `node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` → 10/10 pass, both files UNMODIFIED (git-confirmed).
- **SYNC-02 suite:** `npm test` → 186 pass / 3 fail — the exact pre-vendor baseline (zero regressions; the only new failure was the guaranteed version drift, now fixed).
- **SYNC-03:** `grep -q '1.6.1' UPSTREAM.md && ! grep -q '1.5.0' UPSTREAM.md && grep -q 'runtime-name-policy' UPSTREAM.md` → `upstream ok`.
- **SYNC-01 (scoped):** `gsd-core/VERSION`=1.6.1; `grep -rn '1.5.0' gsd-core/ | grep -v 'legacy-cleanup.cjs:225:'` → empty; no 1.5.0 in README.md / UPSTREAM.md / stage.cjs comment.

## Deviations from Plan

### 1. [Rule 2 — consistency] Reconciled README + UPSTREAM move-summary prose to the corrected framing
- **Found during:** Tasks 2–3.
- **Issue:** README L94–95 and the UPSTREAM intro still described the port as "one registry entry, one alias, clean move" — which directly contradicts the honest framing this plan was mandated to establish (two aliases, two vendored hand-edited converters).
- **Fix:** updated both prose summaries to the accurate "one registry entry, two aliases, a small pair of vendored Bob converters, and the adapter module" wording. Version-only edits would have left a self-contradicting document.
- **Files modified:** README.md, UPSTREAM.md.
- **Commits:** `01f2eee` (UPSTREAM), `df955b1` (README).

### 2. [Carried-forward Plan 02 deviation] SYNC-01 grep scoped around the stock 1.5.0 line
- The plan's literal `! grep -Rn '1.5.0' gsd-core/` one-liner is unsatisfiable because of the immutable stock upstream comment at `gsd-core/bin/lib/legacy-cleanup.cjs:225`. Per the Plan 02 decision (editing it = an undocumented 7th delta that breaks `apply-bob-patches.cjs` idempotency + nuke-and-restage integrity, T-07-03), the assertion is scoped to exclude that single historical line. The SYNC-01 semantic intent (one consistent version, no 1.5.0/1.6.1 mix) holds. Documented as an out-of-scope exception in the notes.

## Known Stubs

None — all three requirements are closed and verified; the notes are a complete live record.

## Threat Flags

None — no new network endpoint, auth path, or trust-boundary surface. The three registered
threats were mitigated as planned: T-07-05 (blanket regeneration) by the run-first-then-classify
D-08 policy with a single keyed justification; T-07-06 (pointer accuracy) by re-verifying every
pointer against the source and logging old→new; T-07-07 (backend-neutrality regression) by
`test/backend-neutrality.test.cjs` passing unmodified.

## Self-Check: PASSED

- `.planning/phases/07-gsd-core-1-6-1-sync/07-03-SUMMARY.md` — FOUND (this file)
- `UPSTREAM.md` targets 1.6.1, no 1.5.0 — FOUND
- `test/installer/staged-shim-loads.test.cjs` asserts 1.6.1 — FOUND
- Commit `693cc66` (Task 1) — FOUND in git log
- Commit `01f2eee` (Task 2) — FOUND in git log
- Commit `df955b1` (Task 3) — FOUND in git log
