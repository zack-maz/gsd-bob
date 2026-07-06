# Phase 7: gsd-core 1.6.1 Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-02
**Phase:** 7-gsd-core-1-6-1-sync
**Areas discussed:** Re-applying bob patches, Re-vendor mechanics & source, Golden-fixture drift policy, Runbook note capture
**Mode:** User selected "auto for everything" — all four areas auto-selected and auto-decided with Claude's recommended option per area.

---

## Re-applying bob patches

| Option | Description | Selected |
|--------|-------------|----------|
| Idempotent re-injection script | New `scripts/apply-bob-patches.cjs` re-inserts the 2 data-only patches onto fresh 1.6.1; re-runnable; becomes the runbook's executable core | ✓ |
| Manual 3-way re-apply | Hand-merge the bob block/alias onto 1.6.1's changed files | |
| Refactor bob entry out-of-tree | Keep the registry entry in a separate file gsd-core loads | |

**Claude's choice:** Idempotent re-injection script.
**Notes:** Verified the bob support is exactly two in-place, data-only edits (commit `f20e328`), no existing injection script. Manual re-apply isn't repeatable (fails the runbook goal); out-of-tree requires modifying gsd-core's registry loader (invasive, breaks the "move not rewrite" upstream story). The converter impls are stock gsd-core, so only these 2 edits need re-applying — but SYNC-02 must re-verify the converter functions still exist in 1.6.1.

---

## Re-vendor mechanics & source

| Option | Description | Selected |
|--------|-------------|----------|
| npm pack + nuke-and-restage same subset | `npm pack @opengsd/gsd-core@1.6.1` → delete tracked subdirs → restage identical curated subset → bump VERSION | ✓ |
| git tag checkout | Clone/checkout the 1.6.1 git tag | |
| Surgical file-by-file diff-apply | Apply only the enumerated changed files | |

**Claude's choice:** npm pack + nuke-and-restage the identical curated subset.
**Notes:** Published tarball is deterministic and mirrors gsd-core's own distribution. Nuke-and-restage is the only mechanic that guarantees SYNC-01's "no residual 1.5.0/1.6.1 mix." Curated-subset boundary (`bin/ workflows/ templates/ references/ contexts/ VERSION`) kept unchanged to avoid scope creep; confirm required subset against `src/installer/stage.cjs`. A version-consistency check enforces one consistent version.

---

## Golden-fixture drift policy

| Option | Description | Selected |
|--------|-------------|----------|
| Run unchanged first, then classify per failure | Regenerate only expected-drift fixtures (one-line justification each); regressions are bugs to fix; neutrality + descriptor tests are invariants | ✓ |
| Regenerate-all-then-eyeball | Blanket-regenerate every golden, review the aggregate diff | |

**Claude's choice:** Run suites unchanged, then classify (expected drift vs regression).
**Notes:** Blanket regeneration would mask a real converter break, defeating goldens. `backend-neutrality` and `descriptor` (shim resolves bob home) tests must pass unmodified. Justifications recorded in `07-REVENDOR-NOTES.md` + fixture-update commit messages, keyed by fixture name.

---

## Runbook note capture

| Option | Description | Selected |
|--------|-------------|----------|
| Live `07-REVENDOR-NOTES.md` as-you-go | Capture exact commands, gotchas, dead-ends during the work | ✓ |
| Reconstruct from commits in Phase 10 | Rebuild the procedure later from git history | |

**Claude's choice:** Live `07-REVENDOR-NOTES.md`, written as-the-work-happens.
**Notes:** Roadmap requires the runbook to "reflect the real dance, not an aspirational one" — reconstruction loses the exact commands and gotchas. File seeds Phase 10 / DOCS-04.

## Claude's Discretion

- All four areas were delegated to Claude ("auto for everything"). Downstream research/planning may refine the *implementation technique* of each decision (e.g., string-anchor vs AST vs structured-JSON edit inside `apply-bob-patches.cjs`) as long as the locked decisions hold.

## Deferred Ideas

- None — discussion stayed within phase scope. Model neutralization (8), command expansion (9), the MAINTAINING doc itself (10), and acceptance-delta steps (11) are already scoped to their own phases.
