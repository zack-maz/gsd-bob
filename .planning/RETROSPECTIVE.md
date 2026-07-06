# Retrospective — GSD for IBM Bob (gsd-bob)

A living retrospective, appended at each milestone close.

## Milestone: v2.0 — 1.6.1 Sync & Command Expansion

**Shipped:** 2026-07-06 (npm `@zack-maz/gsd-bob@0.2.1`)
**Phases:** 5 (7–11) | **Plans:** 10 | **Tasks:** 18

### What Was Built
- Full re-vendor of the `gsd-core/` payload from 1.5.0 → 1.6.1 on one consistent version, with the six Bob deltas re-injected idempotently via `scripts/apply-bob-patches.cjs` and the descriptor/converter suites re-validated against the new bin layer.
- A model-neutralization converter pass (`neutralizeModelReferences` + shared regex in `bob-adapter.cjs`) so zero model literals reach emitted `.bob/` artifacts, guarded by the NEUTRAL-03 zero-literal invariant.
- Emitted command surface grown 10 → 28 through the same capability-map gate, with a directory-derived equivalence suite and a regenerated 28-entry `SUPPORT-ROSTER.md`.
- Maintainer-standard docs: expanded README, generated `COMMANDS.md`, `ARCHITECTURE.md` (four axes, live-code anchored), and a `MAINTAINING.md` version-bump runbook distilled from the real re-vendor.
- Insert-only acceptance delta (AC-28..AC-45 + AC-27 amend) over the frozen v1 AC-01..AC-26.

### What Worked
- **Generated-not-hand-maintained artifacts.** The roster, COMMANDS.md, and README skill list all derive from `commands/gsd/` through the gate, so drift is structurally impossible and doc-conformance is a hermetic test, not a review chore.
- **Invariant-over-golden for neutrality.** Asserting *absence* of model literals across the whole emission proved far more durable than byte-golden fixtures for fuzzy prose rewriting.
- **Strict dependency ordering.** Re-vendor → neutralize → expand → document → accept meant every new command was born model-neutral and every doc described the final surface.

### What Was Inefficient
- **v1.0 was never formally archived** (carried into v2.0 via `new-milestone` without `complete-milestone`), so v1 phase dirs vanished from disk while remaining in ROADMAP — which surfaced later as `milestone.complete` false-flagging "6 unstarted phases" (needed `--force`) and a lingering `core-loop-contract.test.cjs` reference to a deleted phase-04 plan.
- The **package name/scope churned** (`@opengsd/gsd-bob` → `@zack-maz/gsd-bob`) after docs and the frozen acceptance checklist already baked in the old name, forcing a deliberate freeze re-baseline at close.

### Patterns Established
- **Gate-derived rosters + hermetic drift guards** as the standard for any generated doc/artifact set.
- **Deliberate-amend protocol for frozen artifacts:** when a freeze must change, update the live doc *and* regenerate its snapshot fixture in lockstep, and record the intent in the commit/task (accountability via history, not the byte-freeze).

### Key Lessons
- Run `/gsd-complete-milestone` at each milestone boundary — skipping it (v1.0) left latent inconsistencies that cost time at the next close.
- Pin the published package name/scope *before* writing install commands into shipped docs and frozen checklists.
- Carry a known-unrelated test failure (the phase-04 `core-loop-contract.test.cjs` ENOENT) as a tracked follow-up, not silent tolerance.

### Follow-ups Carried Forward
- Re-point `test/core-loop-contract.test.cjs` at a run-time-globbed live plan instead of the deleted `04-core-loop-port/04-01-PLAN.md` (pre-existing failure; documented in Phase 11 deferred-items).
- Deferred long tail for a future milestone: `transition`, `ai-integration-phase`, the knowledge-graph/mempalace cluster, and the actual upstream PR to open-gsd/gsd-core.

### Cost Observations
- Sessions: milestone spanned multiple sessions; close-out + 3 post-ship quick tasks (270k seed, freeze re-baseline, version bump) handled in one session.
- Notable: heaviest lifting (re-vendor, command expansion) front-loaded in Phases 7 and 9; docs and acceptance were fast once the surface was frozen.

## Cross-Milestone Trends

| Milestone | Phases | Plans | Shipped | npm |
|-----------|--------|-------|---------|-----|
| v1.0 — Bob Runtime & Core Loop | 6 | 15 | 2026-06-19 | 0.1.x |
| v2.0 — 1.6.1 Sync & Command Expansion | 5 | 10 | 2026-07-06 | 0.2.1 |
