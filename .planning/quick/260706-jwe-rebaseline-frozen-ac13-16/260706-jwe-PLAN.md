---
quick_id: 260706-jwe
slug: rebaseline-frozen-ac13-16
description: Deliberately re-baseline the frozen acceptance AC-01..26 snapshot to correct the install package name @opengsd/gsd-bob → @zack-maz/gsd-bob
date: 2026-07-06
status: ready
---

# Quick Task 260706-jwe: Re-baseline the frozen acceptance checklist (package rename)

## Governance note (READ FIRST)

This task **intentionally breaks the Phase 11 "v1 AC-01..AC-26 frozen byte-for-byte"
guarantee** as a deliberate v2.0 correction. The package publishes under
`@zack-maz/gsd-bob`, not `@opengsd/gsd-bob`, so the install commands baked into the frozen
acceptance steps AC-13..AC-16 point at a non-existent package. Rather than leave the
on-device acceptance pass with a wrong install command, we re-baseline the freeze: update
the live checklist AND regenerate the committed snapshot fixture in lockstep so the
insert-only guard (`test/acceptance-insert-only.test.cjs`) stays green against the NEW
baseline. The accountability record is this task + its commit message + SUMMARY — not the
byte-freeze (which we are knowingly moving).

## Objective

Replace every `@opengsd/gsd-bob` with `@zack-maz/gsd-bob` in the acceptance checklist and
re-snapshot the frozen fixture so all three acceptance guards pass.

Verified occurrence map (do not change scope):
- `.planning/ACCEPTANCE-CHECKLIST.md` — **5** occurrences total:
  - 1 in the **preamble** (before the `## AC-01 — Subagent isolation` anchor; editable region)
  - 4 in the **frozen slice** (AC-13, AC-14, AC-15, AC-16 install/uninstall/dry-run commands)
- `test/fixtures/acceptance/frozen-ac01-26.md` — the committed snapshot; currently byte-equals
  `slice(indexOf('## AC-01 — Subagent isolation'), indexOf('## AC-27'))` of the live checklist.

## Tasks

### Task 1 — Rename package in the live checklist + regenerate the frozen fixture

**Files:** `.planning/ACCEPTANCE-CHECKLIST.md`, `test/fixtures/acceptance/frozen-ac01-26.md`

**Action:**
1. In `.planning/ACCEPTANCE-CHECKLIST.md`, replace **all 5** literal occurrences of
   `@opengsd/gsd-bob` with `@zack-maz/gsd-bob` (a global string replace; leaves every other
   byte — including the `@opengsd/gsd-core` payload references, if any — untouched). Only the
   `gsd-bob` package token changes.
2. Regenerate the fixture deterministically as the exact frozen slice of the UPDATED live
   checklist, using the SAME anchors the guard uses (`## AC-01 — Subagent isolation` →
   `## AC-27`):
   ```bash
   node -e "const fs=require('fs');const m=fs.readFileSync('.planning/ACCEPTANCE-CHECKLIST.md','utf8');const s=m.indexOf('## AC-01 — Subagent isolation'),e=m.indexOf('## AC-27');if(!(s>=0&&e>s))throw new Error('anchors');fs.writeFileSync('test/fixtures/acceptance/frozen-ac01-26.md',m.slice(s,e));console.log('fixture regenerated: '+(e-s)+' bytes');"
   ```
   Do NOT hand-edit the fixture — it must be the byte-exact slice so the insert-only guard's
   `assert.equal(live, frozen)` holds.

**Verify:**
- `node --test test/acceptance-insert-only.test.cjs` → passes (live frozen slice === fixture).
- `node --test test/acceptance-coverage.test.cjs test/acceptance-delta-coverage.test.cjs` →
  pass (these key on IDs/roster tokens/families, not the package URL — should be unaffected).
- `grep -c "@opengsd/gsd-bob" .planning/ACCEPTANCE-CHECKLIST.md test/fixtures/acceptance/frozen-ac01-26.md`
  → `0` in both.
- `grep -c "@zack-maz/gsd-bob" test/fixtures/acceptance/frozen-ac01-26.md` → `4`.
- `npm test` (full suite) → the ONLY pre-existing failure allowed is `CORE-02` in
  `test/core-loop-contract.test.cjs` (unrelated ENOENT on an archived phase-04 fixture);
  count must remain identical to baseline. Report exact output.

**Done:** No `@opengsd/gsd-bob` remains in the checklist or fixture; fixture is the byte-exact
new slice; all acceptance guards green.

## Notes / constraints

- This DOES touch `.planning/` (the checklist) and `test/fixtures/` — both are the point of this
  task; commit them together in ONE atomic commit (this is a `test/`+`docs` change). The
  project runs `commit_docs:false`, but this task's whole purpose is the checklist+fixture edit,
  so the executor SHOULD stage and commit exactly these two files. Use a commit message that
  records the deliberate re-baseline, e.g.
  `test(260706-jwe): re-baseline frozen AC-01..26 to @zack-maz/gsd-bob (deliberate v2.0 amend)`.
- Do NOT stage any other pre-existing dirty files.
- Do NOT touch AC-27+ or the roll-up rows.
- Create `260706-jwe-SUMMARY.md` with `status: complete`, explicitly recording that the freeze
  was intentionally re-baselined (governance).
