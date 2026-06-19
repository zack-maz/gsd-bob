# Roadmap: GSD for IBM Bob (gsd-bob)

## Overview

gsd-bob makes the runtime-neutral GSD planning framework run natively inside IBM Bob, emitting the same `.planning/` artifact contract so Bob and Claude Code stay interchangeable. The journey is strictly dependency-ordered: first a documentation-grounded capability mapping resolves the documented-absent Bob primitives by choosing conservative lower-bound defaults that gate the whole design; then the backend-agnostic runtime foundation and the Bob-native artifact emitter are built together as the irreducible core; then a manifest-aware npx installer stages what the emitter produces; then the core planning loop (`new-project` → `verify`) runs end-to-end under Bob, proving the Core Value; then the daily-driver quality gates are ported parity-first and the whole adapter is audited to upstream-ready standard; finally a dedicated on-device acceptance phase runs the consolidated checklist against a real Bob install. Backend-neutrality, the flag-gap contract, and `.planning/` root-anchoring are established in the foundation phase and enforced through every later phase.

**Test-deferred cross-cutting principle:** No live Bob exists on the development device, and none ever will. Therefore every phase's success criteria must be verifiable WITHOUT a live Bob during development — via documentation conformance against Bob's official docs, unit/golden tests against the `.planning/` artifact contract, or Claude-runtime equivalence checks. Where a primitive is documented-absent, the design assumes the conservative lower bound (no isolated subagents → sequential inline; no structured prompts → `text_mode`) so it runs even on Bob's most constrained documented behavior. Every phase must additionally contribute its own device-runnable verification steps (exact commands + expected outputs) to a single consolidated on-device acceptance checklist, which the user runs once on a Bob-enabled machine in the final phase. Capability discovered to be richer than assumed on-device is logged as a follow-up enhancement, never a development prerequisite.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Bob Capability Mapping** - Resolve the documented-absent Bob primitives from official docs, record a conservative lower-bound default per primitive, and author device-runnable verification steps (completed 2026-06-18)
- [x] **Phase 2: Runtime Foundation & Artifact Translation** - The backend-agnostic spine plus the Bob-native emitter that converts GSD artifacts and handles primitive gaps (verified 9/9; gaps closed by 02-04, UAT 10/10, secure-phase threats_open: 0) (completed 2026-06-18)
- [x] **Phase 3: Installer** - One-line npx installer with local/global scope and manifest-safe clean/update modes (completed 2026-06-18)
- [ ] **Phase 4: Core-Loop Port** - new-project → plan-phase → execute-phase → verify → progress running natively in Bob
- [ ] **Phase 5: Quality Gates & Upstream Readiness** - code-review, debug, audit ported parity-first, with the adapter audited to upstream-mergeable standard
- [ ] **Phase 6: On-Device Acceptance Verification** - The consolidated acceptance checklist and the single on-device pass the user runs on a real Bob machine

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

**Plans**: TBD

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

**Plans**: TBD

### Phase 6: On-Device Acceptance Verification

**Goal**: Compensate for the absence of a local Bob throughout development by consolidating every phase's device-runnable steps into one acceptance checklist and running it once, unattended, on a real Bob-enabled machine — the single empirical gate that confirms the test-deferred build actually works on hardware.
**Depends on**: Phase 5
**Requirements**: VERIFY-01, VERIFY-02
**Success Criteria** (what must be TRUE):

  1. A single consolidated acceptance checklist exists with exact commands and expected outputs for every v1 success criterion across Phases 1–5, assembled from the device-runnable steps each earlier phase contributed (VERIFY-01).
  2. The checklist is structured so the user can run it unattended on their Bob machine and record an unambiguous pass/fail per item without needing to interpret or improvise (VERIFY-02).
  3. A mechanism exists to log any capability assumption that proved wrong on-device (e.g. Bob actually supports isolated subagents, or a structured prompt primitive exists) as a tracked follow-up enhancement rather than a silent gap (VERIFY-02).

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bob Capability Mapping | 1/1 | Complete    | 2026-06-18 |
| 2. Runtime Foundation & Artifact Translation | 4/4 | Complete    | 2026-06-18 |
| 3. Installer | 4/4 | Complete   | 2026-06-18 |
| 4. Core-Loop Port | 0/TBD | Not started | - |
| 5. Quality Gates & Upstream Readiness | 0/TBD | Not started | - |
| 6. On-Device Acceptance Verification | 0/TBD | Not started | - |
</content>
</invoke>
