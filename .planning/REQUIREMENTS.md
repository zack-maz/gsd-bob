# Requirements: GSD for IBM Bob (gsd-bob)

**Defined:** 2026-06-17
**Core Value:** A Bob user installs via a single command and runs the full GSD planning loop (new-project → plan-phase → execute-phase → verify) natively, producing the same `.planning/` artifacts GSD produces in Claude Code.

## v1 Requirements

Requirements for the initial release. Each maps to roadmap phases. v1 scope = Bob capability mapping → runtime foundation + translation → core loop → quality gates → npx installer → on-device acceptance, kept upstream-contributable throughout.

### Bob Capability Spike

Resolve the documented-absent Bob primitives from Bob's official docs before the adapter is designed (no live Bob is available, so empirical confirmation is deferred to on-device acceptance). For each, choose a conservative lower-bound default so the design runs even on Bob's most constrained documented behavior, and author a device-runnable verification step. (Per research: these gate the entire translation strategy.)

- [x] **SPIKE-01**: Confirm whether Bob supports isolated subagent spawning with completion signals, or only in-session mode switching (decides parallel-isolated vs sequential-inline execution)
- [x] **SPIKE-02**: Confirm whether Bob exposes any structured-choice prompt primitive, or whether interactive flows must ride conversational `text_mode`
- [x] **SPIKE-03**: Confirm a GSD-shipped Bob mode/command can use Bob's `command` tool group to shell out to `node gsd-tools.cjs`
- [x] **SPIKE-04**: Determine Bob's config-home path and env-override variable (`~/.bob`, `BOB_CONFIG_DIR`?) and the IDE-vs-Shell detection signal

### Runtime Foundation

The backend-agnostic spine that everything else runs on.

- [x] **RUNTIME-01**: The `gsd-tools.cjs` shim resolves a `bob` runtime home so `gsd_run query` works when invoked under Bob
- [x] **RUNTIME-02**: A `bob` runtime descriptor (config home, artifact layout, aliases) is added using gsd-core's existing descriptor vocabulary
- [x] **RUNTIME-03**: `.planning/` artifacts produced under Bob are byte-compatible with those produced under Claude Code (Claude↔Bob interchange holds)
- [x] **RUNTIME-04**: The GSD core contains no branching on the model backend — Bob owns model routing, gsd-bob never references Claude/Gemini/Granite

### Artifact Translation

Convert GSD's Claude-native artifacts into Bob-native ones, handling primitive gaps.

- [x] **TRANS-01**: GSD commands are emitted as Bob `.bob/commands/*.md` slash commands (frontmatter + `$1` args)
- [x] **TRANS-02**: GSD skills are emitted as Bob `.bob/skills/<name>/SKILL.md` Agent Skills where that is the right surface
- [x] **TRANS-03**: Interactive `AskUserQuestion` prompts degrade to `text_mode` (numbered text choices) under Bob so interactive flows can still ask
- [x] **TRANS-04**: Skills that require primitives Bob cannot support are explicitly flagged/skipped (parity-first), never silently broken
- [x] **TRANS-05**: `custom_modes.yaml` (and any shared Bob config) is merged idempotently — installing gsd-bob never overwrites or duplicates user-defined modes

### Core Loop Port

The essential planning spine running natively in Bob.

- [x] **CORE-01**: `new-project` runs natively in Bob, producing PROJECT.md → REQUIREMENTS.md → ROADMAP.md
- [x] **CORE-02**: `plan-phase` (and transitive `discuss-phase`) produces a PLAN.md natively in Bob
- [x] **CORE-03**: `execute-phase` (and `execute-plan`) executes plans natively in Bob with atomic commits
- [x] **CORE-04**: `verify` (`verify-work` / `verify-phase`) runs natively in Bob against phase goals
- [x] **CORE-05**: `progress` reports status and advances the workflow natively in Bob

### Quality Gates

The daily-driver review subset beyond the core loop.

- [ ] **QUAL-01**: `code-review` (including `--fix`) runs natively in Bob
- [ ] **QUAL-02**: `debug` runs natively in Bob with persistent debug state
- [ ] **QUAL-03**: `audit` (`audit-fix` / `audit-uat`) runs natively in Bob

### Installer

One-line npx install matching gsd-core's UX.

- [x] **INSTALL-01**: A single `npx` command installs gsd-bob into a Bob environment
- [x] **INSTALL-02**: The user can select local (project `.bob/`) vs global (`~/.bob/`) scope
- [x] **INSTALL-03**: A clean install onto a fresh environment works end-to-end
- [x] **INSTALL-04**: Re-running the installer updates an existing install without destroying user customizations
- [x] **INSTALL-05**: The installer tracks its own files via a manifest so update/clean never blindly overwrite or orphan user files

### Upstream Readiness

Keep the work mergeable into gsd-core.

- [ ] **UP-01**: All Bob-specific code is isolated to one adapter component, expressed in gsd-core's descriptor/converter vocabulary, so it can later be lifted upstream as a move rather than a rewrite
- [ ] **UP-02**: The package ships a README documenting install, scope/modes, supported skills, and flagged gaps — to a standard a gsd-core maintainer could review

### On-Device Verification

Compensate for the absence of a local Bob install by accumulating verification into one acceptance pass run on a real Bob machine.

- [ ] **VERIFY-01**: Each phase contributes concrete, device-runnable verification steps (exact commands + expected outputs) to a consolidated on-device acceptance checklist, so nothing depends on live testing during development
- [ ] **VERIFY-02**: A final on-device acceptance pass runs the full checklist against a real Bob install, records pass/fail per v1 success criterion, and logs any capability assumption that proved wrong (e.g. Bob actually supports isolated subagents) as a follow-up enhancement

## v2 Requirements

Deferred to future releases. Tracked but not in the current roadmap.

### Broader Skill Coverage

- **LIFE-01**: Lifecycle cluster (`new-milestone`, `complete-milestone`, `transition`) ported to Bob
- **SHAPE-01**: Phase-shaping cluster (`spec-phase`, `mvp-phase`, `ui-phase`, `ai-integration-phase`) ported to Bob
- **AUTO-01**: Autonomy cluster (`autonomous`, `manager`, `workstreams`) ported to Bob
- **PARITY-01**: Full ~70-skill parity with Claude Code GSD

### Richer Native Integration

- **NATIVE-01**: Map flagged primitive gaps to rich Bob-native equivalents (modes/agents) instead of flag/skip
- **PAR-01**: Worktree-isolated parallel execution once Bob's spawning model proves it supports isolation + completion signals

### Upstream Merge

- **MERGE-01**: Actual PR merging the Bob runtime into open-gsd/gsd-core upstream

## Out of Scope

Explicitly excluded for v1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Per-backend (Gemini/Claude/Granite) behavior tuning | v1 core is backend-agnostic; Bob owns routing |
| Broad graceful-degradation as the porting philosophy | v1 is parity-first (flag/skip gaps); only interactive prompts use text_mode out of necessity |
| Rich Bob-native re-modeling of subagents/prompts | Deferred to v2 NATIVE-01; v1 flags these gaps |
| Full ~70-skill parity | v1 = core loop + quality gates only; long tail deferred |
| Merging upstream during v1 | Ships standalone first; the upstream PR is a follow-on (MERGE-01) |
| Knowledge graph / mempalace / map-codebase | Subagent-heavy, off the core loop; deferred |
| Live-Bob testing during development | No Bob on the dev device; all dev-time verification is doc-conformance / golden / equivalence, consolidated into one on-device acceptance pass (VERIFY-01/02) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPIKE-01 | Phase 1 | Complete |
| SPIKE-02 | Phase 1 | Complete |
| SPIKE-03 | Phase 1 | Complete |
| SPIKE-04 | Phase 1 | Complete |
| RUNTIME-01 | Phase 2 | Complete |
| RUNTIME-02 | Phase 2 | Complete |
| RUNTIME-03 | Phase 2 | Complete |
| RUNTIME-04 | Phase 2 | Complete |
| TRANS-01 | Phase 2 | Complete |
| TRANS-02 | Phase 2 | Complete |
| TRANS-03 | Phase 2 | Complete |
| TRANS-04 | Phase 2 | Complete |
| TRANS-05 | Phase 2 | Complete |
| INSTALL-01 | Phase 3 | Complete |
| INSTALL-02 | Phase 3 | Complete |
| INSTALL-03 | Phase 3 | Complete |
| INSTALL-04 | Phase 3 | Complete |
| INSTALL-05 | Phase 3 | Complete |
| CORE-01 | Phase 4 | Complete |
| CORE-02 | Phase 4 | Complete |
| CORE-03 | Phase 4 | Complete |
| CORE-04 | Phase 4 | Complete |
| CORE-05 | Phase 4 | Complete |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |
| QUAL-03 | Phase 5 | Pending |
| UP-01 | Phase 5 | Pending |
| UP-02 | Phase 5 | Pending |
| VERIFY-01 | Phase 6 | Pending |
| VERIFY-02 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 30 total (SPIKE 4 + RUNTIME 4 + TRANS 5 + CORE 5 + QUAL 3 + INSTALL 5 + UP 2 + VERIFY 2 = 30)
- Mapped to phases: 30 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-17*
*Last updated: 2026-06-17 after test-deferred revision (added VERIFY-01/02 → Phase 6; v1 count 28 → 30; Phase 1 reframed to documentation-grounded capability mapping)*
</content>
