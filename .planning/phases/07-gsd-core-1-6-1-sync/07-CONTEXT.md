# Phase 7: gsd-core 1.6.1 Sync - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Re-vendor the curated `gsd-core/` payload from **1.5.0 → 1.6.1** wholesale (24 changed workflows + 1 new `list-seeds.md`, 5 changed templates, 6 changed + 5 new references, 61 changed + 14 new bin files), **re-apply the two in-place `bob` patches** that a wholesale replace would otherwise wipe, re-validate the Bob runtime descriptor + converter suites against the new bin layer, and update `UPSTREAM.md` to record 1.6.1 with re-verified 5-artifact move-inventory pointers (file:line).

**In scope:** SYNC-01 (full wholesale payload replace, one consistent version), SYNC-02 (descriptor + converter suites re-validated, shim still resolves `bob` home), SYNC-03 (UPSTREAM.md → 1.6.1 with re-verified pointers).

**Out of scope (own phases):** stripping/rewriting model references (Phase 8, NEUTRAL-*); adding the 18 new commands (Phase 9, CMD-*); the MAINTAINING runbook doc itself (Phase 10, DOCS-04 — this phase only produces the *raw notes* that seed it); device-runnable acceptance steps for the new surface (Phase 11).

**Cross-cutting invariants (carried forward, must stay true):** backend-neutral (zero model-brand literals in core paths + `bob-adapter.cjs`), `.planning/` root-anchored, capability-map flag-gap contract, and test-deferred (no live Bob — every criterion verifiable via doc-conformance, golden/unit tests against the artifact contract, or Claude-runtime equivalence).

</domain>

<decisions>
## Implementation Decisions

### Re-applying the in-place `bob` patches
- **D-01:** The `bob` support is **two data-only, in-place edits** to vendored gsd-core files, added by commit `f20e328` ("add data-only bob runtime registry entry + alias") with **no injection script**: the `"bob"` registry block in `gsd-core/bin/lib/capability-registry.cjs` (~L3045–3109) and the `"bob"` alias in `gsd-core/bin/shared/runtime-aliases.manifest.json` (L79–82). A wholesale 1.6.1 replace overwrites both. **These are the only local modifications to the vendored payload.**
- **D-02:** Preserve them via a new **idempotent re-injection script** `scripts/apply-bob-patches.cjs`: given a freshly-restaged clean 1.6.1 payload, it re-inserts the two patches and is safe to re-run (no duplication). This makes SYNC-01's wholesale replace safe, and becomes the **executable core of the Phase 10 MAINTAINING runbook** (a bump = nuke → restage clean 1.6.1 → run this script → validate). Chosen over manual 3-way re-apply (not repeatable) and over refactoring the entry out-of-tree (would require modifying gsd-core's registry loader — invasive, diverges from the upstream "move not rewrite" story).
- **D-03:** The registry entry names the converters `convertClaudeCommandToBobSkill` / `convertClaudeCommandToBobCommand`, whose **impls are stock gsd-core** (generic, parameterized by the registry — per UPSTREAM.md). SYNC-02 MUST **re-verify these functions still exist** in 1.6.1's `runtime-artifact-conversion.cjs` (they may have moved lines or been renamed). If 1.6.1 renamed/removed them, that is a real integration break to resolve here — not a fixture update.

### Re-vendor mechanics & source
- **D-04:** Obtain 1.6.1 via **`npm pack @opengsd/gsd-core@1.6.1`** (the published, immutable, deterministic tarball — mirrors how end-users and gsd-core itself distribute), not a git tag checkout.
- **D-05:** **Nuke-and-restage**, not surgical file-by-file: delete the tracked vendored `gsd-core/` subdirs, then restage the **identical curated subset** (`bin/ workflows/ templates/ references/ contexts/ VERSION`) from the tarball, and bump `gsd-core/VERSION` to `1.6.1`. Nuke-and-restage is the only mechanic that *guarantees* SYNC-01's "no residual 1.5.0/1.6.1 mix."
- **D-06:** **Keep the curated-subset boundary unchanged.** Refresh the same subdirs the payload already vendors (including `contexts/`, even though the roadmap's change-enumeration doesn't list it) to 1.6.1. Changing which subdirs are vendored is out of scope for this phase. If 1.6.1 introduces a *new* top-level dir the shim/workflows actually reference, include it; otherwise mirror the existing subset. Confirm the required subset against what `src/installer/stage.cjs` copies and `scripts/generate-support-roster.cjs` reads.
- **D-07:** A **payload version-consistency check** (SYNC-01) asserts one consistent version post-restage: `VERSION` reads `1.6.1` and no file still carries a 1.5.0 marker/residue.

### Golden-fixture drift policy (SYNC-02)
- **D-08:** **Run the existing suites unchanged against 1.6.1 first**, then classify each failure — never blanket-regenerate (that would mask a real converter break, defeating the point of goldens):
  - **Expected drift** (1.6.1 source content flowing correctly through an unchanged converter) → regenerate *that* fixture, with a **one-line recorded justification** per fixture.
  - **Regression** (converter/descriptor behavior actually broke) → a **bug to fix in this phase**, not a fixture to update.
- **D-09:** `test/backend-neutrality.test.cjs` and `test/descriptor.test.cjs` (shim resolves the `bob` home) are **invariants, not drift-eligible** — they must pass unmodified. Justifications for any regenerated golden live in `07-REVENDOR-NOTES.md` (D-11) and the fixture-update commit message, keyed by fixture name.

### Runbook note capture (seeds Phase 10 / DOCS-04)
- **D-10:** Capture the concrete re-vendor steps as **live raw notes written as-the-work-happens**, not reconstructed from commits afterward. The roadmap explicitly requires the runbook to "reflect the real dance, not an aspirational one" — that demands capturing exact commands, gotchas, and dead-ends in the moment.
- **D-11:** Notes file: `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md`. Contents: chronological exact-command log (pack/extract/nuke/restage), each gotcha/dead-end, the D-03 converter-existence re-verification result, the D-08 fixture-drift justifications, and the SYNC-03 pointer re-verification results. This is the raw source Phase 10 turns into the MAINTAINING runbook.

### Claude's Discretion
- User delegated all four areas ("auto for everything") — decisions above are Claude's recommended options. Downstream research/planning may refine *how* each is implemented (e.g., the exact re-injection technique in `apply-bob-patches.cjs`: anchor-based string insertion vs. AST vs. structured-JSON edit for the alias) as long as the decisions above hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap (the phase contract)
- `.planning/ROADMAP.md` §"Phase 7: gsd-core 1.6.1 Sync" — goal, 3 success criteria, the payload change-counts, and the "raw notes seed Phase 10" Note.
- `.planning/REQUIREMENTS.md` — SYNC-01, SYNC-02, SYNC-03 (verbatim requirement text).

### The upstream move inventory (SYNC-03 target)
- `UPSTREAM.md` (repo root) — the 5-artifact move inventory + backend-neutrality guarantee. This phase updates its "Targeted gsd-core version" from `1.5.0` → `1.6.1` and **re-verifies every file:line pointer** against the 1.6.1 source.

### The two in-place bob patches (D-01/D-02 — must survive the replace)
- `gsd-core/bin/lib/capability-registry.cjs` — holds the `"bob"` registry block (currently ~L3045–3109).
- `gsd-core/bin/shared/runtime-aliases.manifest.json` — holds the `"bob"` alias (currently L79–82).

### Converters + resolver to re-verify against 1.6.1 (D-03, SYNC-02)
- `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — impls of `convertClaudeCommandToBobSkill` / `convertClaudeCommandToBobCommand` (re-verify they still exist).
- `gsd-core/bin/lib/runtime-homes.cjs` — generic `dot-home` case that resolves the `.bob` home.
- `gsd-core/bin/gsd-tools.cjs` — the shim (resolves `bob` home with no bob-specific branch).
- `gsd-core/VERSION` — `1.5.0` marker to bump to `1.6.1`.

### The isolated Bob logic + validation harness (SYNC-02)
- `src/bob-adapter.cjs` — the one net-new substance module (gate + roster + `custom_modes.yaml` merge); must stay backend-neutral & green.
- `test/backend-neutrality.test.cjs`, `test/descriptor.test.cjs` — invariants (D-09).
- `test/skill-golden.test.cjs`, `test/command-golden.test.cjs`, `test/text-mode-golden.test.cjs`, `test/unsupported-gate.test.cjs`, `test/core-loop-*.test.cjs`, `test/quality-gate-*.test.cjs`, `test/roster-capmap.test.cjs`, `test/merge.test.cjs` — golden/equivalence suites subject to the D-08 drift policy.
- `src/installer/stage.cjs`, `scripts/generate-support-roster.cjs` — define/consume the curated vendored subset (D-06).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Existing test suite (18 files under `test/`)** is the re-validation harness for SYNC-02 — no new equivalence framework needed; run it unchanged against 1.6.1 and apply the D-08 policy.
- **`src/installer/stage.cjs`** already establishes exactly which vendored subdirs the payload must contain — use it as the source of truth for the D-06 curated subset rather than re-deriving.
- **`UPSTREAM.md`'s existing 5-artifact table** already documents each pointer's role — the re-verification is a mechanical file:line refresh against 1.6.1, not a rewrite.

### Established Patterns
- **Vendored payload is sourced exclusively from repo root** (Phase 03 decision, `stage.cjs`) — the restaged 1.6.1 payload lives at `gsd-core/`, never cwd-relative.
- **All Bob-specific logic isolated to `src/bob-adapter.cjs` + two data-only registry edits** — the re-injection script (D-02) must touch *only* those two files, preserving the isolation the upstream story depends on.
- **SUPPORT-ROSTER.md is generated, never hand-edited** — if 1.6.1 shifts the convertible set, regenerate via `scripts/generate-support-roster.cjs`.

### Integration Points
- **New file:** `scripts/apply-bob-patches.cjs` (D-02) — the idempotent re-injection step, invoked after restaging.
- **New file:** `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` (D-11) — live re-vendor log.
- `gsd-tools.cjs` shim → `runtime-homes.cjs` `dot-home` resolution is the SYNC-02 smoke path (`gsd_run query` still resolves the `bob` home under the 1.6.1 bin).

</code_context>

<specifics>
## Specific Ideas

- The re-vendor recipe is deliberately built to be **replayable** (npm pack → nuke → restage → `apply-bob-patches.cjs` → run suites → verify version-consistency) so Phase 10's MAINTAINING runbook is a near-transcription of what actually happened here, per the roadmap's "real dance, not aspirational" directive.
- Preferred order of operations within the phase: (1) capture current state / pointers, (2) pack+restage 1.6.1, (3) re-inject bob patches, (4) re-verify converter existence + shim resolution, (5) run suites & apply drift policy, (6) update UPSTREAM.md to 1.6.1 with fresh pointers, (7) version-consistency check — logging each into `07-REVENDOR-NOTES.md`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Model neutralization, command expansion, the runbook document itself, and acceptance-delta steps are already scoped to Phases 8–11.)

</deferred>

---

*Phase: 7-gsd-core-1-6-1-sync*
*Context gathered: 2026-07-02*
