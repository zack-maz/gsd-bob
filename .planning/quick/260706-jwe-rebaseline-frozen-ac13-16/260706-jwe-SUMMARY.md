---
quick_id: 260706-jwe
slug: rebaseline-frozen-ac13-16
date: 2026-07-06
status: complete
commit: 0f1f0e2
governance: deliberate re-baseline of Phase 11 frozen AC-01..26 snapshot (not an accidental edit)
---

# Quick Task 260706-jwe: Re-baseline frozen acceptance checklist (package rename) — Summary

## One-liner

Corrected the install package token `@opengsd/gsd-bob` → `@zack-maz/gsd-bob` across the live
acceptance checklist and deliberately re-baselined the byte-frozen AC-01..26 snapshot fixture
in lockstep, keeping all three acceptance guards green against the new baseline.

## Governance note (deliberate freeze move)

This task **intentionally re-baselined** the Phase 11 "v1 AC-01..AC-26 frozen byte-for-byte"
guarantee. The package publishes under `@zack-maz/gsd-bob`, not `@opengsd/gsd-bob`, so the
install/uninstall/dry-run commands baked into frozen steps AC-13..AC-16 pointed at a
non-existent package. Rather than leave the on-device acceptance pass with a wrong install
command, the freeze was knowingly moved: the live checklist and the committed snapshot fixture
(`test/fixtures/acceptance/frozen-ac01-26.md`) were regenerated together so
`test/acceptance-insert-only.test.cjs` (`assert.equal(live, frozen)`) passes against the NEW
baseline. The accountability record is this task + the commit message + this SUMMARY — not the
byte-freeze, which we knowingly moved.

## What changed

- `.planning/ACCEPTANCE-CHECKLIST.md` — global replace of all **5** `@opengsd/gsd-bob` tokens
  (1 preamble at line 31; 4 in frozen slice AC-13/AC-14/AC-15/AC-16 install commands). Only the
  `gsd-bob` package token changed; every other byte (including `@opengsd/gsd-core` payload
  references) left intact.
- `test/fixtures/acceptance/frozen-ac01-26.md` — regenerated deterministically via the exact
  node slice command in the plan (anchors `## AC-01 — Subagent isolation` → `## AC-27`), not
  hand-edited. New size: 29460 bytes.

## Grep counts (before → after)

| Target | Token | Before | After |
| --- | --- | --- | --- |
| `.planning/ACCEPTANCE-CHECKLIST.md` | `@opengsd/gsd-bob` | 5 | 0 |
| `test/fixtures/acceptance/frozen-ac01-26.md` | `@opengsd/gsd-bob` | 4 | 0 |
| `.planning/ACCEPTANCE-CHECKLIST.md` | `@zack-maz/gsd-bob` | 0 | 5 |
| `test/fixtures/acceptance/frozen-ac01-26.md` | `@zack-maz/gsd-bob` | 0 | 4 |

## Verification (exact output)

- `node --test test/acceptance-insert-only.test.cjs` → pass 1 / fail 0 (live frozen slice === fixture).
- `node --test test/acceptance-coverage.test.cjs test/acceptance-delta-coverage.test.cjs` → pass 5 / fail 0.
- Grep counts: opengsd = 0 in both files; zack-maz = 5 (checklist) / 4 (fixture). All match plan.
- `npm test` (full suite) → **pass 321 / fail 1**, identical to prior baseline. The sole failure
  is the pre-existing, unrelated `CORE-02` ENOENT in `test/core-loop-contract.test.cjs`
  (missing archived `.planning/phases/04-core-loop-port/04-01-PLAN.md` fixture).

## Deviations from Plan

None — plan executed exactly as written.

## Commit

- `0f1f0e2` — `test(260706-jwe): re-baseline frozen AC-01..26 to @zack-maz/gsd-bob (deliberate v2.0 amend)`
  (2 files changed, 9 insertions, 9 deletions).

## Self-Check: PASSED

- FOUND: `.planning/ACCEPTANCE-CHECKLIST.md` (5 zack-maz, 0 opengsd)
- FOUND: `test/fixtures/acceptance/frozen-ac01-26.md` (4 zack-maz, 0 opengsd)
- FOUND: commit `0f1f0e2`
