# Roadmap: GSD for IBM Bob (gsd-bob)

## Overview

gsd-bob makes the runtime-neutral GSD planning framework run natively inside IBM Bob, emitting the same `.planning/` artifact contract so Bob and Claude Code stay interchangeable. The journey is strictly dependency-ordered: first a documentation-grounded capability mapping resolves the documented-absent Bob primitives by choosing conservative lower-bound defaults that gate the whole design; then the backend-agnostic runtime foundation and the Bob-native artifact emitter are built together as the irreducible core; then a manifest-aware npx installer stages what the emitter produces; then the core planning loop (`new-project` → `verify`) runs end-to-end under Bob, proving the Core Value; then the daily-driver quality gates are ported parity-first and the whole adapter is audited to upstream-ready standard; finally a dedicated on-device acceptance phase runs the consolidated checklist against a real Bob install. Backend-neutrality, the flag-gap contract, and `.planning/` root-anchoring are established in the foundation phase and enforced through every later phase.

**Test-deferred cross-cutting principle:** No live Bob exists on the development device, and none ever will. Therefore every phase's success criteria must be verifiable WITHOUT a live Bob during development — via documentation conformance against Bob's official docs, unit/golden tests against the `.planning/` artifact contract, or Claude-runtime equivalence checks. Where a primitive is documented-absent, the design assumes the conservative lower bound (no isolated subagents → sequential inline; no structured prompts → `text_mode`) so it runs even on Bob's most constrained documented behavior. Every phase must additionally contribute its own device-runnable verification steps (exact commands + expected outputs) to a single consolidated on-device acceptance checklist, which the user runs once on a Bob-enabled machine in the final phase. Capability discovered to be richer than assumed on-device is logged as a follow-up enhancement, never a development prerequisite.

**Milestone v2.0 — 1.6.1 Sync & Command Expansion (Phases 7–11):** With the v1.0 core loop shipping, v2.0 brings the vendored payload to one consistent gsd-core 1.6.1, makes every emitted artifact fully model-neutral, roughly triples the emitted command surface (10 → 28) to cover the daily-driver GSD workflow, documents the adapter to a maintainer standard, and extends the single on-device acceptance pass to the new surface. The dependency chain is strict: the 1.6.1 re-vendor (Phase 7) is the foundation everything downstream builds on; model neutralization (Phase 8) lands before command expansion so every newly emitted command is born clean; command expansion (Phase 9) grows the roster through the same capability-map gate; documentation (Phase 10) is written only once the final command set and neutralization behavior exist, and its MAINTAINING runbook is sourced from Phase 7's real re-vendor; the acceptance delta (Phase 11) appends device-runnable steps for the new commands and the neutrality invariant. All v1 cross-cutting principles carry forward unchanged — test-deferred (no live Bob; every criterion verifiable via doc-conformance, golden/unit tests against the `.planning/` artifact contract, or Claude-runtime equivalence, with device-runnable steps accruing to the acceptance checklist), backend-neutral, `.planning/` root-anchored, and the capability-map flag-gap contract enforced throughout.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

**Milestone v1.0 — Bob Runtime & Core Loop (Phases 1–6, complete):**

- [x] **Phase 1: Bob Capability Mapping** - Resolve the documented-absent Bob primitives from official docs, record a conservative lower-bound default per primitive, and author device-runnable verification steps (completed 2026-06-18)
- [x] **Phase 2: Runtime Foundation & Artifact Translation** - The backend-agnostic spine plus the Bob-native emitter that converts GSD artifacts and handles primitive gaps (verified 9/9; gaps closed by 02-04, UAT 10/10, secure-phase threats_open: 0) (completed 2026-06-18)
- [x] **Phase 3: Installer** - One-line npx installer with local/global scope and manifest-safe clean/update modes (completed 2026-06-18)
- [x] **Phase 4: Core-Loop Port** - new-project → plan-phase → execute-phase → verify → progress running natively in Bob (completed 2026-06-19)
- [x] **Phase 5: Quality Gates & Upstream Readiness** - code-review, debug, audit ported parity-first, with the adapter audited to upstream-mergeable standard (completed 2026-06-19)
- [x] **Phase 6: On-Device Acceptance Verification** - The consolidated acceptance checklist and the single on-device pass the user runs on a real Bob machine (completed 2026-06-19)

**Milestone v2.0 — 1.6.1 Sync & Command Expansion (Phases 7–11):**

- [ ] **Phase 7: gsd-core 1.6.1 Sync** - Fully re-vendor the `gsd-core/` payload from 1.5.0 → 1.6.1 on one consistent version and re-validate the Bob integration against the new bin layer
- [ ] **Phase 8: Model Neutralization** - Add a converter pass so zero model references (structural directives + inline prose) reach emitted `.bob/` artifacts, guarded by a zero-literal invariant assertion
- [ ] **Phase 9: Command Expansion** - Grow the curated emitted command set from 10 to 28 by vendoring 18 capability-map-gated command sources, each emitting model-neutral output
- [ ] **Phase 10: Documentation** - Document the adapter to a maintainer standard: expanded README, per-command reference, Bob-vs-open-gsd architecture doc, and a gsd-core version-bump runbook
- [ ] **Phase 11: On-Device Acceptance Delta** - Extend the acceptance checklist with device-runnable steps for the new commands and the model-neutrality invariant (insert-only; v1 AC-01..AC-26 frozen)

## Phase Details

### Phase 1: Bob Capability Mapping

**Goal**: Resolve the load-bearing Bob primitives from Bob's official documentation — choosing a conservative lower-bound default for each so the adapter is designed against Bob's most constrained documented behavior — and author the device-runnable verification step that will later confirm or refute each assumption on real hardware. No live Bob is available, so this phase grounds the design in docs, not empirical demonstration.
**Depends on**: Nothing (first phase)
**Requirements**: SPIKE-01, SPIKE-02, SPIKE-03, SPIKE-04
**Success Criteria** (what must be TRUE):

  1. Bob's `command` tool group is reviewed in the docs, a conservative default for shelling out to `node gsd-tools.cjs` is recorded, and a device-runnable verification step (run a stub mode that calls `node gsd-tools.cjs` and check its output) is authored for the acceptance checklist (SPIKE-03 resolved).
  2. Bob's subagent model is reviewed in the docs and, absent confirmed isolated subagent spawning with completion signals, the conservative lower-bound default is recorded as **sequential inline execution (assume NO isolated subagents)**, with a device-runnable verification step authored to later confirm whether isolation actually exists (SPIKE-01 resolved).
  3. Bob's prompt primitives are reviewed in the docs and, absent a confirmed structured-choice primitive, the conservative lower-bound default is recorded as **conversational `text_mode` (assume NO structured prompts)**, with a device-runnable verification step authored to later confirm whether a richer prompt primitive exists (SPIKE-02 resolved).
  4. Bob's config-home path, env-override variable, and IDE-vs-Shell detection signal are read from the docs, a conservative default for each is recorded so detection and home-resolution can be built without guessing, and a device-runnable verification step is authored to confirm them on hardware (SPIKE-04 resolved).

**Plans**: 1/1 plans complete

- [x] 01-01-PLAN.md — Author CAPABILITY-MAP.md (4 SPIKE rows + 4 adjacent reference rows) and seed .planning/ACCEPTANCE-CHECKLIST.md with read-only AC-01..AC-04

### Phase 2: Runtime Foundation & Artifact Translation

**Goal**: Stand up the backend-agnostic runtime spine and the Bob-native emitter — the irreducible core of the package — so a converted GSD command/skill is provably correct against Bob's documented contract and `gsd-tools.cjs` resolves a `bob` runtime home, all verifiable without a live Bob.
**Depends on**: Phase 1
**Requirements**: RUNTIME-01, RUNTIME-02, RUNTIME-03, RUNTIME-04, TRANS-01, TRANS-02, TRANS-03, TRANS-04, TRANS-05
**Success Criteria** (what must be TRUE):

  1. `gsd_run query` resolves a `bob` runtime home via an env-overridable descriptor expressed in gsd-core's existing vocabulary — verified by unit test against the descriptor and by running the shim with `BOB_CONFIG_DIR` overridden in the Claude/Node runtime, with the live-Bob run captured as an acceptance-checklist step (RUNTIME-01, RUNTIME-02).
  2. A GSD command emitted as a Bob `.bob/commands/*.md` slash command and a GSD skill emitted as a `.bob/skills/<name>/SKILL.md` Agent Skill both conform to Bob's documented file/frontmatter contract (golden-file tests), with their in-Bob load captured as an acceptance-checklist step (TRANS-01, TRANS-02).
  3. An interactive `AskUserQuestion` prompt deterministically degrades to numbered `text_mode` text choices, verified by a golden test that the emitted flow asks and captures a validated answer in the Claude runtime, with the in-Bob run captured as an acceptance-checklist step (TRANS-03).
  4. A skill whose primitive Bob's docs cannot support is explicitly flagged/skipped — absent from the emitted set and any roster, or replaced by an "unsupported on Bob: <reason>" stub — never silently broken, verified by inspecting the emitted artifact set against the documented capability map (TRANS-04).
  5. A `.planning/` artifact produced by the Bob emitter is byte-compatible with one produced under Claude Code (golden diff), GSD core contains no model-backend branching (backend-neutrality grep), and `custom_modes.yaml` merges idempotently without overwriting user modes (merge unit test) (RUNTIME-03, RUNTIME-04, TRANS-05).

**Plans**: 4/4 plans complete
**Wave 1**

- [x] 02-01-PLAN.md — Scaffold gsd-bob (CJS package.json, vendored gsd-core) + backend-agnostic runtime spine: bob registry entry/descriptor/alias, descriptor resolution, byte-compat + backend-neutrality (RUNTIME-01..04)
- [x] 02-02-PLAN.md — Bob-native emitter: skill + command converters and the isolated bob-adapter module (gsd mode emitter, idempotent custom_modes.yaml merge, unsupported flag/skip gate) (TRANS-01, TRANS-02, TRANS-04, TRANS-05)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-03-PLAN.md — text_mode degradation via the existing seam (TRANS-03), full-suite phase gate + support roster, and AC-05+ device-runnable steps appended to the acceptance checklist

**Gap Closure** *(from 02-VERIFICATION.md — 7/9 must-haves)*

- [x] 02-04-PLAN.md — Close TRANS-01/02/04/05 gaps: add convertClaudeToBobContent body neutralization (.claude→.bob, gsd:→gsd-) to both Bob converters + update golden fixtures (Gap 1); guard mergeCustomModes non-mapping YAML root + null/nameless gateArtifact/roster candidates to fail loud (Gap 2)

### Phase 3: Installer

**Goal**: A single npx command installs gsd-bob into a Bob environment at the chosen scope, with update/clean operations that never destroy user customizations — all verifiable against a simulated `.bob/` target without a live Bob.
**Depends on**: Phase 2
**Requirements**: INSTALL-01, INSTALL-02, INSTALL-03, INSTALL-04, INSTALL-05
**Success Criteria** (what must be TRUE):

  1. A single `npx` command installs gsd-bob and the user can select local (`<project>/.bob/`) vs global (`~/.bob/`) scope with the resolved target path printed before writing — verified against a simulated/scratch `.bob/` target, with the on-Bob install captured as an acceptance-checklist step (INSTALL-01, INSTALL-02).
  2. A clean install onto a fresh scratch environment produces a working `.bob/` GSD layout matching the emitter contract end-to-end (INSTALL-03).
  3. Re-running the installer updates an existing install idempotently, preserving user-authored commands, rules, and `gsd-*` mode entries without duplication — verified by a fixture with pre-seeded user files (INSTALL-04).
  4. The installer tracks every file it writes via a manifest, so update and clean only ever touch tracked files and never blindly overwrite or orphan user files — verified by manifest-vs-filesystem assertions (INSTALL-05).

**Plans**: 4/4 plans complete

**Wave 1**

- [x] 03-01-PLAN.md — Manifest linchpin (sha256/schema/update+orphan classification, single source of truth) + adapter `unmergeCustomModes` sibling (INSTALL-05)
- [x] 03-02-PLAN.md — CLI plumbing: hand-parsed args (gsd-core flag mirror, no --clean/--update), scope→absolute-path via the vendored descriptor, end-of-run report buckets (INSTALL-01, INSTALL-02)

**Wave 2** *(blocked on Wave 1)*

- [x] 03-03-PLAN.md — Staging engine: structural pieces (gsd mode merge, vendored payload copy, roster) + roster-agnostic convertible loop + D-04 collision/D-05 orphan policy + config.json text_mode MERGE (INSTALL-03, INSTALL-04)

**Wave 3** *(blocked on Wave 2)*

- [x] 03-04-PLAN.md — Entry wiring `bin/gsd-bob.cjs` + package.json bin map + install/update/uninstall/dry-run dispatch + 4 end-to-end scratch-tmpdir tests + appended device-runnable AC-13..16 (INSTALL-01..05)

### Phase 4: Core-Loop Port

**Goal**: The essential GSD planning spine is ported to run under Bob, producing a `.planning/` tree byte-compatible with a Claude run — the Core Value gate — with development-time verification via Claude-runtime equivalence and artifact-contract tests, and the in-Bob run authored into the acceptance checklist.
**Depends on**: Phase 3
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05
**Success Criteria** (what must be TRUE):

  1. `/gsd-new-project` produces PROJECT.md → REQUIREMENTS.md → ROADMAP.md with real validated `text_mode` answers (not placeholders) in the artifacts — verified by Claude-runtime equivalence + golden diff, with the in-Bob run captured as an acceptance-checklist step (CORE-01).
  2. `/gsd-plan-phase` (and transitive `discuss-phase`) produces a PLAN.md whose structure matches the artifact contract — verified by golden test, with the in-Bob run on the acceptance checklist (CORE-02).
  3. `/gsd-execute-phase` (and `execute-plan`) executes plans with atomic commits under the assumed sequential-inline model — verified in the Claude runtime, with the in-Bob run on the acceptance checklist (CORE-03).
  4. `/gsd-verify` validates the completed phase against its goals — verified by equivalence test, with the in-Bob run on the acceptance checklist (CORE-04).
  5. `/gsd-progress` reports status and advances the workflow, and the produced `.planning/` tree sits at the workspace root next to `.bob/` with no nested second `.planning/` — verified by root-anchoring assertion, with the in-Bob run on the acceptance checklist (CORE-05).

**Plans**: 2/2 plans complete

**Wave 1**

- [x] 04-01-PLAN.md — Vendor the 8 core-loop command sources (checkpoint-gated fetch from gsd-core 1.5.0) + wire the convertible loop to the declared bob converters (emit `.bob/commands` + `.bob/skills`) + per-command equivalence/golden suite with the D-05 real-answer guard (CORE-01..05)

**Wave 2** *(blocked on Wave 1)*

- [x] 04-02-PLAN.md — End-to-end contract suite (PLAN.md/PROJECT.md structure CORE-02, atomic commits CORE-03) + root-anchoring suite (single root-anchored `.planning/`, CORE-05) + append device-runnable AC-17..AC-21 (CORE-01..05)

### Phase 5: Quality Gates & Upstream Readiness

**Goal**: The daily-driver review gates are ported parity-first, and the whole adapter is audited to a standard a gsd-core maintainer could review and lift upstream as a move, not a rewrite — all verifiable via contract tests, greps, and doc review without a live Bob.
**Depends on**: Phase 4
**Requirements**: QUAL-01, QUAL-02, QUAL-03, UP-01, UP-02
**Success Criteria** (what must be TRUE):

  1. `/gsd-code-review` (including `--fix`) reviews changed source — verified by Claude-runtime equivalence on a fixture diff, with the in-Bob run on the acceptance checklist (QUAL-01).
  2. `/gsd-debug` debugs with persistent debug state across resets — verified by state-persistence test, with the in-Bob run on the acceptance checklist (QUAL-02).
  3. `/gsd-audit` (`audit-fix` / `audit-uat`) runs natively, and every skill skipped under parity-first carries an explicit flagged reason — verified by inspecting the emitted roster against the capability map (QUAL-03).
  4. All Bob-specific code is isolated to one adapter component expressed in gsd-core's descriptor/converter vocabulary, a backend-neutrality grep finds zero model-name literals in core paths, and the targeted gsd-core version is recorded — so the work can be lifted upstream as a move (UP-01).
  5. The package ships a README documenting install, scope/modes, supported skills, and flagged gaps, to a standard a gsd-core maintainer could review (UP-02).

**Plans**: 3/3 plans complete

**Wave 1**

- [x] 05-01-PLAN.md — Vendor the 4 quality-gate command sources (code-review, debug, audit-fix, audit-uat) into commands/gsd/ so the unchanged installer auto-converts them; extend the roster generator to the full commands/gsd set + regenerate SUPPORT-ROSTER.md (QUAL-01, QUAL-03)

**Wave 2** *(blocked on Wave 1)*

- [x] 05-02-PLAN.md — Backend-agnostic verification suites: equivalence + real-installer contract (QUAL-01/03), debug state-persistence reset→continue→restore round-trip (QUAL-02), roster-vs-capmap inspection (QUAL-03), with frozen golden fixtures (QUAL-01, QUAL-02, QUAL-03)
- [x] 05-03-PLAN.md — UP-01 isolation audit + UPSTREAM.md 5-artifact move inventory (version 1.5.0); maintainer-standard README.md (roster-sourced skill list, no invented flags); append device-runnable AC-22..AC-26 (UP-01, UP-02)

### Phase 6: On-Device Acceptance Verification

**Goal**: Compensate for the absence of a local Bob throughout development by consolidating every phase's device-runnable steps into one acceptance checklist and running it once, unattended, on a real Bob-enabled machine — the single empirical gate that confirms the test-deferred build actually works on hardware.
**Depends on**: Phase 5
**Requirements**: VERIFY-01, VERIFY-02
**Success Criteria** (what must be TRUE):

  1. A single consolidated acceptance checklist exists with exact commands and expected outputs for every v1 success criterion across Phases 1–5, assembled from the device-runnable steps each earlier phase contributed (VERIFY-01).
  2. The checklist is structured so the user can run it unattended on their Bob machine and record an unambiguous pass/fail per item without needing to interpret or improvise (VERIFY-02).
  3. A mechanism exists to log any capability assumption that proved wrong on-device (e.g. Bob actually supports isolated subagents, or a structured prompt primitive exists) as a tracked follow-up enhancement rather than a silent gap (VERIFY-02).

**Plans**: 1/1 plans complete

- [x] 06-01-PLAN.md — Coverage matrix + hermetic traceability/presence test (VERIFY-01), insert-only run scaffolding (preamble + execution order + results roll-up) on the checklist, and the pre-seeded root-anchored ACCEPTANCE-FOLLOWUPS.md wrong-assumption log (VERIFY-02)

### Phase 7: gsd-core 1.6.1 Sync

**Goal**: Fully re-vendor the `gsd-core/` payload from 1.5.0 → 1.6.1 on one consistent version — the foundation everything downstream builds on — and re-validate the Bob descriptor and converter suites against the new bin layer, all without a live Bob. Between 1.5.0 and 1.6.1 the payload changes are substantial: 24 workflow files changed + 1 new workflow (`list-seeds.md`), 5 templates and 6 references changed + 5 new references, and 61 bin files changed + 14 new bin files.
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: SYNC-01, SYNC-02, SYNC-03
**Success Criteria** (what must be TRUE):

  1. The vendored `gsd-core/` payload is replaced wholesale at 1.6.1 — the 24 changed workflows plus the new `list-seeds.md`, the 5 changed templates, the 6 changed + 5 new references, and the 61 changed + 14 new bin files are all present — on a single consistent version with no residual 1.5.0/1.6.1 mix, verified by a payload version-consistency check (SYNC-01).
  2. The Bob runtime descriptor and converter suites re-run green against the 1.6.1 bin layer — existing golden/equivalence tests pass, or each diff is updated with a recorded justification — and `gsd_run query` still resolves the `bob` home under the new bin, verified in the Claude/Node runtime with the live-Bob run captured as an acceptance-checklist step (SYNC-02).
  3. `UPSTREAM.md` records gsd-core 1.6.1 as the targeted version and its 5-artifact move-inventory pointers are re-verified (file:line) against the 1.6.1 source (SYNC-03).

**Plans**: TBD
**Note**: The concrete re-vendor steps performed here (fetch, diff, stage, re-validate) are captured as raw notes to seed the Phase 10 MAINTAINING runbook (DOCS-04) — the runbook must reflect the real dance, not an aspirational one.

### Phase 8: Model Neutralization

**Goal**: Add a converter pass so zero model references reach emitted `.bob/` artifacts — Bob owns model routing. It must land before command expansion so every command added in Phase 9 is born model-neutral. The ~231 model mentions live in the vendored 1.6.1 payload and flow through the converter (gsd-bob's own code already carries zero model literals). Neutrality is verified by a zero-literal invariant assertion, not byte-golden, because prose rewriting is fuzzy and absence-of-X is the cleaner, more durable contract.
**Depends on**: Phase 7 (operates on the 1.6.1 payload)
**Requirements**: NEUTRAL-01, NEUTRAL-02, NEUTRAL-03
**Success Criteria** (what must be TRUE):

  1. The converter strips machine-readable model directives — frontmatter `model:`/`effort:` and the `model_profile`/`resolve_model_ids` structural keys — from every emitted `.bob/` artifact, verified by unit/golden tests on converter output (NEUTRAL-01).
  2. The converter rewrites inline model prose (`opus`/`sonnet`/`haiku` and equivalents) in emitted `.bob/` artifacts to model-neutral wording, verified by before/after converter tests over payload samples drawn from the ~231 known mentions (NEUTRAL-02).
  3. An invariant test asserts zero model literals (per a defined regex) across the entire emitted `.bob/` output set and fails loudly on any regression, passing against the full 1.6.1-derived emission — with this same invariant authored as a device-runnable acceptance step for Phase 11 (NEUTRAL-03).

**Plans**: TBD

### Phase 9: Command Expansion

**Goal**: Grow the curated emitted command set from 10 to 28 by vendoring 18 command sources into `commands/gsd/` (`new-milestone`, `complete-milestone`, `milestone-summary`, `quick`, `fast`, `ship`, `explore`, `spec-phase`, `mvp-phase`, `map-codebase`, `ui-phase`, `secure-phase`, `extract-learnings`, `docs-update`, `health`, `stats`, `resume-work`, `pause-work`). Each is vetted through the capability-map gate (subagent-heavy commands degrade to sequential-inline; prompts to `text_mode`); the existing roster + installer auto-emit; `SUPPORT-ROSTER.md` is regenerated; and the expanded set holds the `.planning/` artifact contract with model-neutral output.
**Depends on**: Phase 8 (new commands must emit model-neutral) and Phase 7 (operate on the 1.6.1 payload)
**Requirements**: CMD-01, CMD-02, CMD-03
**Success Criteria** (what must be TRUE):

  1. All 18 curated command sources are vendored into `commands/gsd/` and auto-emitted by the unchanged installer, bringing the emitted surface to 28 commands total, verified by counting emitted `.bob/commands` against the expected roster (CMD-01).
  2. Each added command passes the capability-map gate — Supported, or flagged-skip with an explicit reason (subagent-heavy → sequential-inline, prompts → `text_mode`) — and the regenerated `SUPPORT-ROSTER.md` reflects the full 28-command set (CMD-02).
  3. The expanded set holds the `.planning/` artifact contract, verified by per-command equivalence/golden tests with the real-answer guard, and every newly emitted command passes the Phase 8 model-neutrality invariant (CMD-03).

**Plans**: TBD

### Phase 10: Documentation

**Goal**: Document the adapter to a standard a gsd-core maintainer could review — written only once the final command set and neutralization behavior exist. Deliver an expanded README (install/scope/modes/full 28-command list sourced from the generated roster + flagged gaps), a per-command reference for all 28 commands, an architecture doc (Bob adapter vs traditional open-gsd), and a MAINTAINING runbook for the repeatable gsd-core version-bump procedure sourced from Phase 7's actual re-vendor.
**Depends on**: Phases 7, 8, 9 (documents the final command set, neutralization behavior, and the re-vendor procedure)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04
**Success Criteria** (what must be TRUE):

  1. `README.md` is expanded to maintainer standard — install, scope/modes, the full 28-command list, and flagged gaps — with the command list sourced from the generated `SUPPORT-ROSTER.md` (no hand-invented commands or flags), verified by doc-conformance against the roster (DOCS-01).
  2. A per-command reference doc briefly explains each of the 28 emitted commands, verified to cover exactly the roster set with no missing or extra entries (DOCS-02).
  3. An architecture doc explains the Bob adapter design versus traditional open-gsd — converter/descriptor model, capability-map gate, backend-neutrality, and `.planning/` interchange — reviewable as a standalone maintainer artifact (DOCS-03).
  4. A `MAINTAINING` runbook documents the repeatable gsd-core version-bump procedure with concrete steps, sourced from the actual 1.5.0 → 1.6.1 re-vendor performed in Phase 7 (DOCS-04).

**Plans**: TBD

### Phase 11: On-Device Acceptance Delta

**Goal**: Extend the existing `.planning/ACCEPTANCE-CHECKLIST.md` (v1's contribute-then-run-once-on-hardware pattern) with device-runnable steps for the newly added commands and a model-neutrality verification step — insert-only, without disturbing the frozen v1 AC-01..AC-26 items.
**Depends on**: Phases 8, 9 (covers the new commands and the neutrality invariant)
**Requirements**: ACCEPT-01, ACCEPT-02
**Success Criteria** (what must be TRUE):

  1. The acceptance checklist gains insert-only device-runnable steps (exact commands + expected outputs) for each newly added Phase 9 command, appended after the frozen AC-01..AC-26, verified by a presence/traceability test over the checklist (ACCEPT-01).
  2. The checklist gains a device-runnable model-neutrality verification step — the NEUTRAL-03 zero-literal invariant runnable against a real Bob install — with an exact command and expected zero-match output (ACCEPT-02).
  3. The frozen v1 items AC-01..AC-26 remain byte-unchanged (insert-only guarantee), verified by an anchor/diff assertion against the prior checklist.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

**Milestone v1.0 (complete):**

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bob Capability Mapping | 1/1 | Complete    | 2026-06-18 |
| 2. Runtime Foundation & Artifact Translation | 4/4 | Complete    | 2026-06-18 |
| 3. Installer | 4/4 | Complete   | 2026-06-18 |
| 4. Core-Loop Port | 2/2 | Complete    | 2026-06-19 |
| 5. Quality Gates & Upstream Readiness | 3/3 | Complete    | 2026-06-19 |
| 6. On-Device Acceptance Verification | 1/1 | Complete    | 2026-06-19 |

**Milestone v2.0 (in progress):**

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. gsd-core 1.6.1 Sync | 0/TBD | Not started | - |
| 8. Model Neutralization | 0/TBD | Not started | - |
| 9. Command Expansion | 0/TBD | Not started | - |
| 10. Documentation | 0/TBD | Not started | - |
| 11. On-Device Acceptance Delta | 0/TBD | Not started | - |
