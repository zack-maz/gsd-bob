# Phase 11: On-Device Acceptance Delta - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Mode:** `--auto --chain` (Claude selected the recommended option for every gray area; each is logged in `11-DISCUSSION-LOG.md`. `--chain` will auto-advance to plan-phase after this context is committed.)

<domain>
## Phase Boundary

Extend the existing root-anchored `.planning/ACCEPTANCE-CHECKLIST.md` — v1's "contribute-then-run-once-on-hardware" device-runnable checklist — with **insert-only** steps for the two things v2.0 added that the checklist does not yet cover:

1. The **18 newly added Phase 9 commands** (`new-milestone`, `complete-milestone`, `milestone-summary`, `quick`, `fast`, `ship`, `explore`, `spec-phase`, `mvp-phase`, `map-codebase`, `ui-phase`, `secure-phase`, `extract-learnings`, `docs-update`, `health`, `stats`, `resume-work`, `pause-work`) — none of which has an AC step today (v1 AC-17..AC-25 cover only the original core-loop + quality-gate commands).
2. The **model-neutrality invariant** (NEUTRAL-03 zero-literal grep) runnable against a real Bob install.

**In scope:**
- ACCEPT-01 — append device-runnable steps (exact `Cmd:` + expected output) for each of the 18 new commands, after the frozen `AC-01..AC-26` and the existing `AC-27`, verified by a new presence/traceability test.
- ACCEPT-02 — a device-runnable model-neutrality verification step (NEUTRAL-03 zero-literal invariant against a real Bob install).
- SC#3 — a byte-unchanged (insert-only) guarantee over the frozen `AC-01..AC-26` step blocks, verified by an anchor/diff assertion.

**Out of scope (explicitly):**
- Editing the frozen `AC-01..AC-26` step blocks in any way (byte-frozen — SC#3).
- Re-running the on-device pass itself (Phase 6 was the single unattended run; this phase only *extends* the checklist — running the delta on hardware is the user's follow-up action, not a development deliverable, per the test-deferred principle).
- Adding acceptance coverage for the still-deferred long-tail commands (`transition`, `ai-integration-phase`, the autonomy cluster, full ~70-skill parity) — they are not emitted, so they get no AC step.
- Any change to the converter, installer, gate, roster generator, or neutralization pass — this phase adds *checklist steps + tests*, not runtime machinery.
- New follow-up machinery — `.planning/ACCEPTANCE-FOLLOWUPS.md` (the wrong-assumption log) already exists and the existing mechanism covers any delta refutation.

**Cross-cutting invariants (carried forward, must stay true):** test-deferred (no live Bob — every new step must be verifiable-by-construction via the presence/traceability + insert-only tests; the actual hardware run accrues to the checklist for the user), `.planning/` root-anchored (the checklist stays at `.planning/ACCEPTANCE-CHECKLIST.md`), read-only-by-default safety (T-01-SC — every new `Cmd:` line must be side-effect-free), and backend-neutral (the model-neutrality step asserts zero model literals; Bob owns routing).

</domain>

<decisions>
## Implementation Decisions

### Grounding facts discovered during scouting (drive every decision below)
- **F-01 (AC-27 already exists and already IS the ACCEPT-02 step):** `.planning/ACCEPTANCE-CHECKLIST.md` already carries `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)`, appended in **Phase 8** (08-01-PLAN). Its `Cmd:` greps the emitted converted set `"$BOB_HOME"/commands/gsd-*.md "$BOB_HOME"/skills/gsd-*/SKILL.md` for tier tokens + machine-readable model directives, expecting **zero** lines. The `gsd-*` wildcard **already covers the 18 new commands** — no scope change is needed for AC-27 to exercise the full 28-command emission. ACCEPT-02's substance is therefore already on the checklist; the phase's job is to make ACCEPT-02 *provably discharged*, not to add a duplicate grep.
- **F-02 (the frozen range is AC-01..AC-26; AC-27 is NOT frozen):** ROADMAP §Phase 11 SC#3 freezes exactly `AC-01..AC-26` (v1's items). `AC-27` is a v2.0 (Phase 8) addition and sits **outside** the frozen range, so its `Confirms:` line may be amended.
- **F-03 (the 18 new commands have NO functional AC step, and functional runs would be unsafe):** v1 AC-17..AC-25 functionally invoke the original core-loop + quality-gate commands. Many of the 18 new commands mutate irreversibly or reach outward (`complete-milestone`, `new-milestone`, `ship` open PRs / rewrite roadmap). Functionally invoking all 18 unattended would **violate the T-01-SC read-only-by-default safety invariant** and the unattended-run contract. The on-device risk for these source-only additions is "does Bob emit + recognize the converted artifact + is it neutral," not "does the workflow logic run" (the pipeline itself is already exercised by AC-17..21).
- **F-04 (traceability precedent already exists):** `test/acceptance-coverage.test.cjs` is the hermetic, anti-drift completeness proof for the checklist — it derives its ID sets at run time from `REQUIREMENTS.md` + the checklist rather than freezing a list, and it **already admits `ACCEPT-01`/`ACCEPT-02` as declared v2.0 IDs** (declared-requirement set = everything above `## Future Requirements`). The new presence/traceability test should mirror this discipline (derive, never freeze) and compose with it.
- **F-05 (drift-proof command source of truth):** the 28-command Supported set is generated into `SUPPORT-ROSTER.md` from `commands/gsd/*.md` (Phase 5 D-06). All 18 targets are present in `commands/gsd/`. This is the drift-proof source for "which commands the delta must cover."

### Step design — the 18 new commands (ACCEPT-01)
- **D-01 — Append one AC step per new command (`AC-28..AC-45`, 18 steps), each a READ-ONLY emission + Bob-recognition check** following the proven `AC-07`/`AC-08` pattern (`ls`/`cat .bob/commands/gsd-<name>.md`, confirm frontmatter, observe the command in Bob's slash-command palette) — **NOT** a functional invocation of the command. Rationale: per-command granularity most literally satisfies SC#1 ("for each newly added Phase 9 command") and makes the ACCEPT-01 traceability test a clean 1:1; read-only emission-recognition honors T-01-SC (F-03) and is unattended-safe; the workflow logic is already covered on-device by the core-loop steps AC-17..21. *(Recommended default, `--auto`. Planner may weigh a lighter alternative — a single consolidated `AC-28` that `ls`-enumerates all 18 in one read-only command — if 18 roll-up rows is judged too heavy; the per-command form is preferred for traceability fidelity and precedent-match.)*
- **D-02 — Each new step's `Confirms:` line references `ACCEPT-01`** (plus optionally the originating Phase 9 requirement `CMD-01`), so the presence/traceability test and the existing `acceptance-coverage.test.cjs` phantom-ref guard both see a real declared ID. *(Recommended default, `--auto`.)*

### Model-neutrality (ACCEPT-02)
- **D-03 — Discharge ACCEPT-02 via the EXISTING `AC-27`; do NOT add a duplicate grep step.** AC-27 already is the device-runnable NEUTRAL-03 zero-literal invariant and its `gsd-*` glob already covers the 18 new commands (F-01). Make ACCEPT-02 traceable by **adding `ACCEPT-02` to AC-27's `Confirms:` line** (AC-27 is outside the frozen range — F-02 — so this single-token edit is permitted and is the minimal, non-duplicating way to satisfy SC#2). *(Recommended default, `--auto`. Planner may instead add a thin cross-referencing `AC-46` that points to AC-27's grep and Confirms `ACCEPT-02` if amending AC-27 is judged less clean than a pure append — but amend-in-place avoids a redundant step.)*

### Insert-only guarantee (SC#3)
- **D-04 — Add a hermetic anchor/diff test asserting the `AC-01..AC-26` step blocks are byte-unchanged** against a frozen snapshot fixture committed in this phase (e.g. `test/fixtures/acceptance-frozen-ac01-26.md`), comparing the live checklist's `## AC-01 …` → end-of-`AC-26` slice for byte equality. Prefer a committed snapshot over a git-`HEAD` diff so the guarantee stays hermetic and deterministic after the phase commits. The freeze is scoped to the **AC step blocks**, not the whole file — the Results Roll-Up table, Execution Order, and How-to-Run prose may gain rows/notes for the new steps (those live outside the frozen step blocks). *(Recommended default, `--auto`. Exact snapshot mechanism — fixture file vs. embedded expected hash — left to planning.)*

### Traceability test (ACCEPT-01, SC#1)
- **D-05 — Add a presence/traceability test that asserts every command in the delta-set has a corresponding new AC step, deriving the delta-set drift-proof** (from `SUPPORT-ROSTER.md` Supported minus the commands already covered by `AC-01..AC-27`, or equivalently the 18 `commands/gsd/*.md` sources with no prior AC step) rather than freezing the 18 names — mirroring `acceptance-coverage.test.cjs`'s anti-drift discipline (F-04). Compose with, do not fork, the existing coverage suite. *(Recommended default, `--auto`. The exact derivation — roster-minus-covered vs. commands-dir-minus-covered — is a planner/research call; the invariant is "derived, never a frozen literal list.")*

### Placement & numbering (insert-only)
- **D-06 — New steps are `AC-28..AC-45`, appended AFTER `AC-27`.** They are read-only, so they slot into the checklist's "read-only first (any order)" execution bucket; extend the Results Roll-Up table with `AC-28..AC-45` rows and add a one-line note to Execution Order / How-to-Run (all outside the frozen `AC-01..AC-26` step blocks, so SC#3 holds). *(Recommended default, `--auto`.)*

### Safety (T-01-SC)
- **D-07 — Every new `Cmd:` line is read-only** (`ls` / `cat` / `grep` / `echo`), never a functional `/gsd-*` invocation of the 18 (F-03). This preserves the checklist's read-only-by-default posture and keeps the delta unattended-safe. Any on-device recognition/neutrality miss is logged to the existing `.planning/ACCEPTANCE-FOLLOWUPS.md` — no new follow-up machinery. *(Recommended default, `--auto`.)*

### Claude's Discretion
User delegated all areas (`--auto`). Every decision above is Claude's recommended option, logged in `11-DISCUSSION-LOG.md`. Downstream research/planning may refine *how* each is implemented — the per-command vs. consolidated step form (D-01), amend-AC-27 vs. thin-append-AC-46 (D-03), snapshot-fixture vs. embedded-hash for the freeze (D-04), and the exact drift-proof derivation of the delta-set (D-05) — **as long as the decisions above hold**. Research is explicitly invited to pressure-test with evidence: (a) D-03's claim that AC-27's existing `gsd-*` glob genuinely covers all 18 new commands with zero scope gap, and (b) D-01's "emission-recognition, not functional-run" call — confirm none of the 18 needs an on-device functional step to satisfy ACCEPT-01's intent.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase contract (requirements & roadmap)
- `.planning/ROADMAP.md` §"Phase 11: On-Device Acceptance Delta" — goal (insert-only extension), the 3 success criteria, and the "frozen v1 AC-01..AC-26" constraint + "depends on Phases 8, 9" ordering.
- `.planning/REQUIREMENTS.md` — `ACCEPT-01` (device-runnable steps for the newly added commands) and `ACCEPT-02` (device-runnable model-neutrality step) verbatim, plus the `## Milestone v2.0 Requirements` / `## Future Requirements` boundaries the coverage test depends on.

### The insert target & its schema (D-01, D-04, D-06, D-07)
- `.planning/ACCEPTANCE-CHECKLIST.md` — THE file being extended. Note: the D-05 `Cmd:`/`Expect:`/`Confirms:`/`Result:` step schema, the T-01-SC read-only safety invariant, the D-07 append convention, `AC-01..AC-26` (frozen), `AC-27` (existing model-neutrality/NEUTRAL-03 step — the ACCEPT-02 anchor), the Results Roll-Up table, and the Execution Order / How-to-Run sections that need the new rows/notes.
- `.planning/ACCEPTANCE-FOLLOWUPS.md` — the existing root-anchored wrong-assumption log; the delta reuses it (no new machinery, D-07).

### Traceability & neutrality tests to mirror / keep green (D-04, D-05)
- `test/acceptance-coverage.test.cjs` — the hermetic, anti-drift coverage proof to MIRROR (derive-never-freeze) and COMPOSE with. Already admits `ACCEPT-01`/`ACCEPT-02` as declared IDs; must stay green after the append (every new AC block needs exactly one `Confirms:` line referencing a declared ID).
- `test/model-neutrality.test.cjs` — the Phase 8 NEUTRAL-03 hermetic invariant that AC-27 is the on-device complement of; the delta must not regress it.
- `SUPPORT-ROSTER.md` (repo root) — generated 28-command Supported roster; the drift-proof source of the delta-command set (D-05). Regenerate only via `scripts/generate-support-roster.cjs`, never hand-edit.

### Prior context (carried forward)
- `.planning/phases/09-command-expansion/09-CONTEXT.md` — the 18 newly added command names (CMD-01) that ACCEPT-01 must cover, and the source-only / drift-proof-roster discipline.
- `.planning/phases/08-model-neutralization/08-CONTEXT.md` — the origin of AC-27 / the NEUTRAL-03 zero-literal invariant and its emitted-converted-set scope (D-01/D-04 there), which ACCEPT-02 discharges via AC-27.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`.planning/ACCEPTANCE-CHECKLIST.md` append convention (D-07) + AC step schema (D-05)** — the delta reuses the exact `Cmd:`/`Expect:`/`Confirms:`/`Result:` four-field schema and the read-only-by-default posture; no new format to invent.
- **`AC-07`/`AC-08` read-only emission-recognition step pattern** — the template for the 18 new per-command steps (`ls`/`cat .bob/commands/gsd-<name>.md` + palette observation), already proven safe.
- **`AC-27` (Phase 8)** — already the device-runnable NEUTRAL-03 grep; ACCEPT-02 is discharged by reference to it (D-03), not by a new step.
- **`test/acceptance-coverage.test.cjs`** — the anti-drift, derive-at-runtime traceability harness to mirror for the ACCEPT-01 presence test (D-05) and to keep green.
- **`.planning/ACCEPTANCE-FOLLOWUPS.md`** — the existing wrong-assumption log; the delta needs no new follow-up machinery (D-07).
- **`SUPPORT-ROSTER.md` + `scripts/generate-support-roster.cjs`** — drift-proof 28-command source of truth for the delta-set derivation (D-05).

### Established Patterns
- **Insert-only over a frozen contract** — v1 established "each phase appends AC-NN steps, never edits prior ones"; Phase 11 is the same move over the AC-01..AC-26 freeze (now enforced by an explicit anchor/diff test, D-04).
- **Derive, never freeze (anti-drift)** — `acceptance-coverage.test.cjs` / `roster-capmap.test.cjs` re-derive their sets at run time; the new traceability test follows suit (D-05).
- **Generated-not-hand-edited artifacts** — the roster is regenerated, never typed; the delta-set derives from it.
- **Read-only safety (T-01-SC)** — every checklist `Cmd:` is side-effect-free; the 18 new steps hold this by using emission-recognition, not functional runs (D-07).

### Integration Points
- **Edited:** `.planning/ACCEPTANCE-CHECKLIST.md` — append `AC-28..AC-45` step blocks + roll-up rows + Execution-Order/How-to-Run notes; one-token `Confirms:` amend on `AC-27` for `ACCEPT-02` (D-03).
- **New tests:** a presence/traceability test for ACCEPT-01 (D-05) and an insert-only anchor/diff test for SC#3 (D-04), plus a frozen `AC-01..AC-26` snapshot fixture.
- **Kept green (unchanged):** `test/acceptance-coverage.test.cjs`, `test/model-neutrality.test.cjs`, the roster.
- **No runtime machinery touched:** converter, installer, gate, roster generator, neutralization pass all untouched.

</code_context>

<specifics>
## Specific Ideas

- **This phase is checklist-and-tests only — zero runtime code.** The real work: (1) author 18 read-only emission-recognition AC steps for the new commands, (2) make ACCEPT-02 provably discharged via the already-present AC-27, (3) lock the AC-01..AC-26 freeze with an explicit hermetic test. Plan it as a small, mostly-authoring phase with two guard tests, not a build phase.
- **The insert-only freeze is the highest-value guard.** SC#3 is the one place a careless edit could silently regress v1's proven checklist; the anchor/diff test (D-04) is what makes "insert-only" a mechanically-enforced contract rather than a hope.
- **Do not duplicate AC-27.** The single most likely mistake is authoring a second model-neutrality grep step for ACCEPT-02 when AC-27 already covers the full 28-command `gsd-*` emission — discharge by reference + Confirms amend instead (D-03).
- **Read-only for all 18.** Resist the pull to functionally invoke commands like `map-codebase`/`health`/`stats` (which happen to be safe-ish) — keeping the schema uniformly emission-recognition preserves T-01-SC and unattended-safety for the whole delta (D-07).

</specifics>

<deferred>
## Deferred Ideas

- **On-device acceptance for the deferred long-tail commands** — `transition` (LIFE-01), `ai-integration-phase` (SHAPE-01), the autonomy cluster (`autonomous`/`manager`/`workstreams`, AUTO-01), and full ~70-skill parity (PARITY-01). Not emitted → no AC step; carried forward from Phase 9's deferred list.
- **Functional on-device runs of the 18 new commands** — deliberately out of scope for the automated delta (unattended-safety / T-01-SC, F-03). If the user later wants a supervised functional smoke of a safe subset (e.g. `health`, `stats`), that is a manual follow-up, not a development deliverable.
- **Install-time prose-neutralization of the copied `.bob/gsd-core/**` raw payload** — carried forward from Phase 8's deferred list (AC-27 scopes to the *converted* set by design, D-01 there); not reopened here.

*(No scope-creep ideas surfaced — discussion stayed within the ACCEPT-01/ACCEPT-02 insert-only boundary.)*

</deferred>

---

*Phase: 11-on-device-acceptance-delta*
*Context gathered: 2026-07-04*
