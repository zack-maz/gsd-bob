# Phase 9: Command Expansion - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** `--auto` (Claude selected the recommended option for every gray area; each is logged in `09-DISCUSSION-LOG.md`)

<domain>
## Phase Boundary

Grow the curated emitted command surface **from 10 to 28** by vendoring **18 additional gsd-core command sources** into `commands/gsd/` so the *unchanged* installer auto-emits them as Bob-native `.bob/commands/gsd-*.md` (+ `.bob/skills/gsd-*/SKILL.md`). The 18: `new-milestone`, `complete-milestone`, `milestone-summary`, `quick`, `fast`, `ship`, `explore`, `spec-phase`, `mvp-phase`, `map-codebase`, `ui-phase`, `secure-phase`, `extract-learnings`, `docs-update`, `health`, `stats`, `resume-work`, `pause-work`.

Each new command is vetted through the **capability-map gate** (subagent-heavy → sequential-inline; interactive prompts → `text_mode`), `SUPPORT-ROSTER.md` is regenerated to reflect the full 28-command set, and the expanded set is proven to hold the `.planning/` artifact contract while emitting **model-neutral** output (Phase 8 invariant).

**In scope:** CMD-01 (vendor the 18 into `commands/gsd/`, unchanged installer emits, 10→28 total), CMD-02 (each passes the capability-map gate — Supported or flagged-skip with an explicit reason — and the regenerated roster reflects all 28), CMD-03 (per-command equivalence/golden with the real-answer guard + every newly emitted command passes the Phase 8 model-neutrality invariant).

**Out of scope (own phases / explicitly excluded):**
- Documentation of the expanded set — README/per-command reference/architecture/MAINTAINING runbook (Phase 10, DOCS-*).
- Device-runnable acceptance steps for the new commands + neutrality invariant (Phase 11, ACCEPT-*).
- The **still-deferred** long-tail commands: `transition` (LIFE-01 remainder), `ai-integration-phase` (SHAPE-01 remainder), the autonomy cluster `autonomous`/`manager`/`workstreams` (AUTO-01), and full ~70-skill parity (PARITY-01). This phase is exactly the 18 named in CMD-01 — no more, no less.
- Any change to the converter, installer staging engine, or the capability-map gate logic — this phase adds *sources*, not machinery (the machinery is roster-agnostic by Phase 3/5 design).

**Cross-cutting invariants (carried forward, must stay true):** backend-neutral (zero model-brand literals reach emitted artifacts — Phase 8), `.planning/` root-anchored, capability-map flag-gap contract (conservative lower-bound: assume NO isolated subagents, assume NO structured prompts), test-deferred (no live Bob — every criterion verifiable via unit/golden tests on the artifact contract, Claude-runtime equivalence, or doc-conformance; device-runnable steps accrue to the Phase 11 acceptance checklist), and one-consistent-gsd-core-version (SYNC-01 spirit — no residual 1.5.0/1.6.1 mix).

</domain>

<decisions>
## Implementation Decisions

### Grounding facts discovered during scouting (drive every decision below)
- **F-01 (source location):** the gsd-core npm tarball ships pristine command sources at `package/commands/gsd/*.md` (69 total in 1.6.1). All **18 targets are present** in `@opengsd/gsd-core@1.6.1` — verified by `npm pack @1.6.1` + `tar tzf`. This is the same immutable-tarball source Phase 7 used for the payload re-vendor.
- **F-02 (sources are pristine, converter does the Bob transform):** `commands/gsd/*.md` hold **verbatim upstream** files — colon command form (`name: gsd:new-project`) and `~/.claude` home, full frontmatter (`allowed-tools`, `model`, etc.). The Bob-specific rewrites (colon→hyphen, `.claude`→`.bob`, frontmatter reduction, model-neutralization) happen **at emit time** in the converter + Phase 8 post-pass — NOT in the vendored source. So vendoring = drop the pristine source in; the existing pipeline does the rest.
- **F-03 (existing sources are version-mixed):** diffing the 10 current `commands/gsd/` sources against the 1.6.1 tarball: **6 are byte-identical** (`new-project`, `plan-phase`, `discuss-phase`, `execute-phase`, `verify-work`, `progress`) but **4 have DRIFTED** (`code-review`, `debug`, `audit-fix`, `audit-uat` — vendored at 1.5.0 in Phase 5, changed upstream by 1.6.1). Phase 7 re-vendored the `gsd-core/` payload but did **not** touch `commands/gsd/`, leaving a real 1.5.0/1.6.1 command-source mix.
- **F-04 (subagent-heavy is already precedent-Supported):** `map-codebase` declares `allowed-tools: Agent` and is described as "parallel mapper agents" — yet `new-project` (already emitted, Supported) also uses `Agent` (4 researchers). The v1 precedent is that Agent-using commands stay **Supported** and their orchestration degrades to sequential-inline under the gate; only `autonomous`/`parallel-fanout` (which *cannot* function without isolated subagents + completion signals) are flagged-skip.
- **F-05 (roster + neutrality auto-cover the new set):** `SUPPORT-ROSTER.md` candidate set is already **derived from `commands/gsd/*.md`** (Phase 5 D-06, drift-proof), and the Phase 8 NEUTRAL-03 invariant **enumerates the emitted converted set via the real staging path** (Phase 8 D-04). Both pick up the 18 new commands automatically with zero new wiring — they must be *run/asserted*, not rebuilt.

### Source & version consistency
- **D-01 — Vendor all 18 from the immutable `@opengsd/gsd-core@1.6.1` tarball's `commands/gsd/`**, dropping each in pristine (F-02) so the unchanged converter/installer emits them. Use the same `npm pack @1.6.1` fetch discipline Phase 7 established (immutable tarball, node-builtins, no hand-authoring of command bodies). *(Recommended default, `--auto`.)*
- **D-02 — Re-sync the 4 DRIFTED existing sources (`code-review`, `debug`, `audit-fix`, `audit-uat`) to their 1.6.1 tarball versions in the same pass** (F-03), so all 28 command sources land on **one consistent 1.6.1 version** — honoring the SYNC-01 "no residual 1.5.0/1.6.1 mix" contract that Phase 7 established for the payload. Re-running the existing equivalence/golden suite over these 4 catches any behavior change the re-sync introduces. *(Recommended default, `--auto`. Research may narrow this if a specific 1.6.1 change breaks a Bob assumption — but the default is: converge to 1.6.1.)*

### Capability-map gating (CMD-02)
- **D-03 — Default every one of the 18 to Supported; degrade, don't skip.** Under the capability-map contract, subagent orchestration degrades to **sequential-inline** and interactive prompts to **`text_mode`** — the same treatment `new-project`/`map-codebase`-style `Agent`-using commands already receive (F-04). The converter emits them unchanged; degradation is a runtime property Bob provides, not an emit-time exclusion. *(Recommended default, `--auto`.)*
- **D-04 — Flag-skip a command ONLY if it cannot function at all without isolated subagents + completion signals** (the `autonomous`/`parallel-fanout` precedent). Research MUST classify each of the 18 against the gate; the **expectation is all 18 Supported** (none of the 18 is in the autonomy cluster, which stays deferred). Any skip must carry an explicit `unsupported on Bob: <reason>` line in the regenerated roster — never a silent omission (TRANS-04 / parity-first). *(Recommended default, `--auto`.)*

### Verification strategy (CMD-03)
- **D-05 — Extend the existing roster-derived, table-driven equivalence/golden harness to iterate the full command-source set rather than authoring 18 bespoke goldens.** Mirror the Phase 5 D-06 "candidate set derived from `commands/gsd/*.md`" drift-proof discipline so the suite auto-covers additions and can never go stale. Keep the **real-answer guard** (D-05 real-answer guard from Phase 4) on any command that captures user input. *(Recommended default, `--auto`.)*
- **D-06 — Rely on the Phase 8 NEUTRAL-03 invariant to cover model-neutrality of the new commands with zero new wiring** (F-05) — it already enumerates the emitted converted set via the real staging path. The phase's obligation is to **confirm it stays green** against the 28-command emission (and that it *catches* any inline `opus`/`sonnet`/`haiku` a new source drags in), not to build a second neutrality check. *(Recommended default, `--auto`.)*
- **D-07 — Assert the emitted count is exactly 28** (`.bob/commands/gsd-*.md`) against the expected roster (CMD-01), plus the Supported/skip split matches the regenerated roster (CMD-02). A count/roster assertion is the phase's headline gate. *(Recommended default, `--auto`.)*

### Roster & count contract (CMD-02)
- **D-08 — Regenerate `SUPPORT-ROSTER.md` via `node scripts/generate-support-roster.cjs`; never hand-edit** (F-05). Because the candidate set is already derived from `commands/gsd/*.md`, adding the 18 sources means regeneration auto-produces the full 28-command roster with the correct Supported/unsupported split. Commit the regenerated roster as a generated artifact. *(Recommended default, `--auto`.)*

### Claude's Discretion
User delegated all areas (`--auto`). Every decision above is Claude's recommended option, logged in `09-DISCUSSION-LOG.md`. Downstream research/planning may refine *how* each is implemented — the exact per-command gate classification (D-04), the precise harness parametrization (D-05), plan/wave batching of the 18 vendors, and whether the 4-source re-sync (D-02) is one plan or folded into the vendor plan — **as long as the decisions above hold**. The decisions research is explicitly invited to pressure-test with evidence: (a) D-04's "all 18 Supported" expectation (classify each against the gate — is any of the 18 genuinely orchestration-locked?), and (b) D-02's blanket "converge the 4 drifted sources to 1.6.1" (is any 1.6.1 change to those 4 hostile to a Bob assumption?).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap (the phase contract)
- `.planning/ROADMAP.md` §"Phase 9: Command Expansion" — goal, the named 18 commands, the 3 success criteria, and the "born model-neutral (depends on Phase 8) + operate on 1.6.1 (depends on Phase 7)" ordering.
- `.planning/REQUIREMENTS.md` — CMD-01, CMD-02, CMD-03 (verbatim requirement text) + the deferred remainders (LIFE-01/SHAPE-01/AUTO-01/PARITY-01) that bound this phase's scope.

### The vendor source & the emit pipeline (D-01, D-02, D-03)
- `commands/gsd/*.md` — the vendor *target* dir; the 18 new pristine sources land here, and the 4 drifted existing ones (`code-review`, `debug`, `audit-fix`, `audit-uat`) get re-synced here. Source of truth = `@opengsd/gsd-core@1.6.1` tarball `package/commands/gsd/`.
- `src/installer/stage.cjs` — the **roster-agnostic** staging engine; its convertible loop iterates `commands/gsd/*.md` and (Phase 8 D-02) wraps each converter output in `neutralizeModelReferences(...)`. **No edit needed** — it auto-emits the additions.
- `src/bob-adapter.cjs` — the isolated Bob-logic module: `gateArtifact`/`buildSupportRoster` (capability gate + roster), `neutralizeModelReferences` (Phase 8 neutrality pass). The gate classifies each new source; no new gate logic expected.
- `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — the vendored Bob converters (`convertClaudeCommandToBobCommand`/`Skill`). **Read-only** — must NOT be edited (would fork gsd-core; breaks the move-not-rewrite story).
- `scripts/apply-bob-patches.cjs` — Phase 7's immutable-tarball fetch + delta-reinjection discipline; the reference for *how* to pull pristine 1.6.1 sources with node-builtins only.

### Roster, count & neutrality gates (CMD-02, CMD-03)
- `scripts/generate-support-roster.cjs` — regenerate `SUPPORT-ROSTER.md` from the `commands/gsd/*.md` candidate set (D-08); never hand-edit.
- `SUPPORT-ROSTER.md` (repo root) — the generated roster; must reflect the full 28-command Supported/unsupported split after regeneration.
- `test/model-neutrality.test.cjs` (Phase 8 NEUTRAL-03) — the zero-literal invariant over the emitted converted set; must stay green against the 28-command emission and catch any new inline model prose (D-06).
- `test/installer/` + the scratch-tmpdir staging harness — drives real emission; reuse to count emitted `.bob/commands` == 28 (D-07) and to run per-command equivalence/golden (D-05).
- `test/backend-neutrality.test.cjs` — the RUNTIME-04 core-path neutrality test; unaffected but part of the invariant family to keep green.

### Prior context (carried forward)
- `.planning/phases/08-model-neutralization/08-CONTEXT.md` — Phase 8's D-02 post-pass placement + D-04 invariant scope (emitted converted set, enumerated via real staging). The reason the 18 new commands are "born clean" with zero Phase 9 wiring.
- `.planning/phases/07-gsd-core-1-6-1-sync/07-CONTEXT.md` — the 1.6.1 re-vendor + SYNC-01 "one consistent version" contract that D-02's re-sync of the 4 drifted sources honors, and the immutable-tarball fetch discipline D-01 reuses.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The unchanged installer/converter pipeline** (`src/installer/stage.cjs` convertible loop) — roster-agnostic since Phase 3/5; iterates `commands/gsd/*.md` and emits `.bob/commands` + `.bob/skills`. Vendoring 18 sources requires **zero pipeline edits** — the emission is automatic.
- **`scripts/generate-support-roster.cjs`** — candidate set derived from `commands/gsd/*.md` (Phase 5 D-06). Regeneration auto-produces the full 28-command roster; the phase runs it, doesn't rewrite it.
- **`test/model-neutrality.test.cjs` (Phase 8)** — enumerates the emitted converted set via real staging; auto-covers the 18 additions. No second neutrality check needed.
- **`test/installer/` scratch-tmpdir harness** — drives real emission into a temp `.bob/`; reuse to assert count==28 and to iterate per-command equivalence/golden (drift-proof, roster-derived).
- **`scripts/apply-bob-patches.cjs` fetch discipline** — the proven immutable-`npm pack @1.6.1` + node-builtins pattern for pulling pristine sources.

### Established Patterns
- **Vendor-as-source, transform-at-emit (F-02)** — `commands/gsd/*.md` are verbatim upstream (colon form, `~/.claude`, full frontmatter); the converter + Phase 8 post-pass do the Bob rewrites at emit time. Never pre-transform the vendored source.
- **Parity-first gating (TRANS-04)** — Supported by default; flag-skip only what genuinely cannot degrade; every skip recorded LOUD in the roster. Agent-using commands stay Supported (degrade to sequential-inline).
- **Generated-not-hand-edited artifacts** — `SUPPORT-ROSTER.md` regenerated, never hand-typed; same single-source-of-truth discipline as the Phase 8 shared regex.
- **One-consistent-version (SYNC-01)** — the payload is one version; extend the same to the command sources by re-syncing the 4 drifted files to 1.6.1 (D-02).

### Integration Points
- **New sources:** 18 files added to `commands/gsd/` + 4 existing re-synced to 1.6.1.
- **No new machinery:** converter, staging engine, gate, and neutralization pass are untouched — they auto-consume the additions.
- **Regenerated:** `SUPPORT-ROSTER.md` (full 28-command roster).
- **Extended tests:** roster-derived equivalence/golden harness iterates the full set; count==28 assertion; Phase 8 neutrality invariant re-run green over the 28-command emission.

</code_context>

<specifics>
## Specific Ideas

- **This phase is deliberately "source-only" (F-02).** The heavy lifting (converter, installer, gate, neutralization) already exists and is roster-agnostic — Phase 9's real work is: (1) fetch pristine sources, (2) converge the version mix, (3) prove the existing gates hold at 28. Plan it so vendoring is a mechanical, checkpoint-gated fetch, not per-command bespoke code.
- **The version-mix reconciliation (D-02) is the subtle, high-value part.** The 6-same / 4-drifted split (F-03) means "vendor 18" alone would leave a 1.5.0/1.6.1 command-source mix that undercuts the SYNC-01 spirit Phase 7 fought for. Fold the 4-source re-sync into this phase explicitly so the 28 sources are provably one version.
- **Keep the count/roster assertion (D-07/D-08) as the headline gate** — 28 emitted, roster split correct, neutrality green. A downstream reader should be able to confirm the phase in one command.
- The **`autonomous`/`parallel-fanout` skip precedent** is the *only* reason to flag-skip; none of the 18 is in that cluster, so a skip would be a surprise worth flagging loudly in research.

</specifics>

<deferred>
## Deferred Ideas

- **`transition` command** (LIFE-01 remainder) — not among the 18; stays deferred.
- **`ai-integration-phase` command** (SHAPE-01 remainder) — not among the 18; stays deferred.
- **Autonomy cluster** — `autonomous`, `manager`, `workstreams` (AUTO-01) — orchestration-locked / off the curated set; deferred (and `autonomous` is already a roster flagged-skip).
- **Full ~70-skill parity** (PARITY-01) — the long tail beyond the 28 curated commands; deferred.
- **Install-time prose-neutralization of the copied `.bob/gsd-core/**` payload** — carried forward from Phase 8's deferred list (D-01 OPEN QUESTION); not reopened here.

*(No scope-creep ideas surfaced — discussion stayed within the CMD-01 named-18 boundary.)*

</deferred>

---

*Phase: 9-command-expansion*
*Context gathered: 2026-07-03*
