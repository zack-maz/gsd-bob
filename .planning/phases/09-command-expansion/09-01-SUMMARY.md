---
phase: 09-command-expansion
plan: 01
subsystem: command-vendoring
tags: [vendoring, roster, fixtures, gsd-core-1.6.1, source-only]
status: complete
requires:
  - "@opengsd/gsd-core@1.6.1 tarball (package/commands/gsd/*.md)"
  - "src/installer/stage.cjs convertible loop (unchanged)"
  - "src/bob-adapter.cjs gateArtifact/buildSupportRoster/neutralizeModelReferences (unchanged)"
  - "gsd-core/bin/lib/runtime-artifact-conversion.cjs converters (unchanged, read-only)"
provides:
  - "commands/gsd/ = 28 pristine 1.6.1 command sources on one consistent version"
  - "SUPPORT-ROSTER.md regenerated to 28 supported + 2 curated skip"
  - "8 quality-gate golden fixtures re-frozen to 1.6.1 converter output"
affects:
  - "Plan 09-02 (verification: count==28, structural equivalence, neutrality re-run)"
  - "Phase 10 DOCS-* (per-command reference cites the 28-command roster)"
tech-stack:
  added: []
  patterns:
    - "Vendor-as-source, transform-at-emit (F-02): sources stay verbatim upstream; converter rewrites at emit"
    - "Directory-derived candidate set (drift-proof): roster + staging loop read commands/gsd/*.md"
    - "Immutable-tarball fetch discipline (npm pack + node-builtins, diff -q byte gate)"
key-files:
  created:
    - "commands/gsd/{new-milestone,complete-milestone,milestone-summary,quick,fast,ship,explore,spec-phase,mvp-phase,map-codebase,ui-phase,secure-phase,extract-learnings,docs-update,health,stats,resume-work,pause-work}.md (18 new pristine sources)"
  modified:
    - "commands/gsd/{code-review,debug,audit-fix,audit-uat}.md (4 re-synced 1.5.0 -> 1.6.1)"
    - "SUPPORT-ROSTER.md (regenerated: 28 supported + 2 skip)"
    - "test/fixtures/quality-gates/*.{command,skill}.expected.md (8 re-frozen)"
decisions:
  - "Vendored all 18 + re-synced 4 from the SAME immutable @opengsd/gsd-core@1.6.1 tarball; byte-verified every one with diff -q (zero drift, T-09-01)"
  - "Regenerated SUPPORT-ROSTER.md via the script, never hand-edited (D-08)"
  - "Regenerated the 8 quality-gate fixtures in the SAME task as the re-sync so the suite was never observed red across the task/plan boundary (Q5/Pitfall 1)"
  - "Zero edits to src/ or gsd-core/ — the pipeline auto-consumed the additions"
metrics:
  duration: "~15m"
  tasks: 2
  files-touched: 31
  completed: 2026-07-04
---

# Phase 9 Plan 01: Vendor + Re-sync + Regenerate Summary

Grew the vendored command-source set from 10 to 28 by dropping in 18 pristine `@opengsd/gsd-core@1.6.1` command sources and re-syncing the 4 drifted ones — a purely-additive, source-only change that touches zero machinery; the directory-derived staging loop, gate, and roster generator auto-consumed the additions.

## What Was Built

- **18 new pristine command sources** (`new-milestone`, `complete-milestone`, `milestone-summary`, `quick`, `fast`, `ship`, `explore`, `spec-phase`, `mvp-phase`, `map-codebase`, `ui-phase`, `secure-phase`, `extract-learnings`, `docs-update`, `health`, `stats`, `resume-work`, `pause-work`) copied verbatim from the immutable 1.6.1 tarball into `commands/gsd/`. Each byte-verified against the tarball with `diff -q` (zero drift). Sources landed in their pristine upstream shape (colon form, `~/.claude`, full frontmatter); the converter transforms at emit time.
- **4 drifted sources re-synced** (`code-review`, `debug`, `audit-fix`, `audit-uat`) from 1.5.0 to their 1.6.1 tarball versions, so all 28 sources now sit on one consistent 1.6.1 version (SYNC-01 spirit). All 4 byte-verified against the tarball.
- **`SUPPORT-ROSTER.md` regenerated** via `node scripts/generate-support-roster.cjs` → `2 unsupported, 28 supported`. Never hand-edited (D-08). All 18 new commands classify Supported by construction (the gate is name/`requires[]`-based, and derived candidates carry `requires: []`; the only skip vector is the single `gsd-autonomous` `BOB_SKIP_LIST` entry, not among the 18).
- **8 quality-gate golden fixtures re-frozen** (`test/fixtures/quality-gates/{code-review,debug,audit-fix,audit-uat}.{command,skill}.expected.md`) by running the vendored converter over the re-synced 1.6.1 sources — the same computation `quality-gate-equivalence.test.cjs` performs. The 1.6.1 trailing-blank-line removal changed the emitted body, so the frozen goldens had to be regenerated (Q5/Pitfall 1). Regeneration was bound to the re-sync inside the same task so the suite was never left red across a boundary.

## How It Works

`commands/gsd/*.md` is the single directory both the roster generator and the installer staging loop read. Adding a source file is the entire product change: `generate-support-roster.cjs` maps each `<stem>.md → { name: 'gsd-'+stem, requires: [] }`, and `stage.cjs` iterates the same directory to emit `.bob/commands/gsd-<stem>.md` + `.bob/skills/gsd-<stem>/SKILL.md` wrapped in `neutralizeModelReferences(...)`. No machinery edit was possible or needed.

## Deviations from Plan

None affecting scope. The plan's Task-1/Task-2 acceptance criteria ask for `npm test` to exit 0; the suite ends at `pass 198 / fail 1`, where the single failure is **pre-existing and unrelated** to this plan.

### Out-of-scope discovery (documented, not fixed)

- **`test/core-loop-contract.test.cjs:126` (CORE-02)** fails with `ENOENT` reading `.planning/phases/04-core-loop-port/04-01-PLAN.md`, a phase directory that no longer exists on disk. Proven pre-existing: stashing all of Plan 09-01's changes and re-running reproduces the identical failure at HEAD `3bcefe5`. Per the executor SCOPE BOUNDARY rule this is out of scope for a command-vendoring plan; logged to `.planning/phases/09-command-expansion/deferred-items.md`. All Phase-9-relevant suites (`quality-gate-equivalence`, `roster-capmap`, `model-neutrality`) are green (`pass 35 / fail 0`).

## Verification Results

- `ls commands/gsd/*.md | wc -l` → **28**.
- All 22 vendored/re-synced sources byte-identical to the `@opengsd/gsd-core@1.6.1` tarball (`diff -q` zero drift for all).
- `node scripts/generate-support-roster.cjs` → `2 unsupported, 28 supported`.
- `node --test test/quality-gate-equivalence.test.cjs test/roster-capmap.test.cjs test/model-neutrality.test.cjs` → `pass 35 / fail 0`.
- `npm test` → `pass 198 / fail 1` (the one failure is the pre-existing unrelated CORE-02 `.planning/` artifact read; see Deviations).

## Threat Mitigations Applied

- **T-09-01 (Tampering, vendored sources):** every one of the 22 sources fetched only from the immutable pinned tarball and byte-verified with `diff -q` before commit.
- **T-09-02 (Information disclosure, emitted set):** `model-neutrality.test.cjs` (NEUTRAL-03) re-run green over the 28-command emission.
- **T-09-03 (Repudiation, roster):** regenerated roster records the split loudly (28 supported + 2 explicit skip lines); no silent parity gap.
- **T-09-SC (supply chain):** no new packages installed; `npm pack` fetched the project's own already-vetted upstream — no legitimacy checkpoint applies.

## Requirements Satisfied

- **CMD-01:** 18 new sources vendored + 4 re-synced → `commands/gsd/` holds exactly 28 pristine 1.6.1 sources, byte-verified; unchanged installer auto-emits.
- **CMD-02:** `SUPPORT-ROSTER.md` regenerated to the full 28-command Supported set via the script; all 18 Supported by construction.
- **CMD-03 (foundation):** the 8 quality-gate golden fixtures re-frozen to 1.6.1 output; model-neutrality invariant stays green over the 28-command emission. Full CMD-03 verification lands in Plan 09-02.

## Self-Check: PASSED

All created files verified present on disk; both task commits (`70bb831`, `92751b7`) verified in git log.
