---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: 1.6.1 Sync & Command Expansion
status: planning
last_updated: "2026-07-02T23:15:00.000Z"
last_activity: 2026-07-02
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-02)

**Core value:** A Bob user installs via a single command and runs the full GSD planning loop (new-project → plan-phase → execute-phase → verify) natively, producing the same `.planning/` artifacts GSD produces in Claude Code.
**Current focus:** Phase 7 — gsd-core 1.6.1 Sync (v2.0 roadmap approved; Phases 7–11 mapped)

## Current Position

Phase: 7 — gsd-core 1.6.1 Sync (not started)
Plan: —
Status: v2.0 roadmap created; ready to plan Phase 7
Last activity: 2026-07-02 — Milestone v2.0 roadmap created (Phases 7–11)

## Performance Metrics

**Velocity:**

- Total plans completed: 12
- Average duration: 2 min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 1 | - | - |
| 02 | 4 | - | - |
| 04 | 2 | - | - |
| 5 | 3 | - | - |
| 6 | 1 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01 P01 | 2 | 2 tasks | 2 files |
| Phase 02 P01 | 4 | 3 tasks | 10 files |
| Phase 02 P02 | 4min | 3 tasks | 12 files |
| Phase 02 P03 | 3min | 3 tasks | 5 files |
| Phase 02 P04 | 3min | 3 tasks | 10 files |
| Phase 03 P01 | 2 min | 2 tasks | 4 files |
| Phase 03 P02 | 6min | 3 tasks | 5 files |
| Phase 03 P03 | 3min | 2 tasks | 4 files |
| Phase 03 P04 | 6min | 3 tasks | 7 files |
| Phase 05 P01 | 3min | 2 tasks | 6 files |
| Phase 05 P02 | ~6min | 2 tasks | 12 files |
| Phase 05 P03 | 4min | 2 tasks | 3 files |
| Phase 06 P01 | 4 | 3 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap v2.0]: v2.0 continues phase numbering at 7 (does NOT reset) — Phases 7–11 map one REQ-category each: SYNC→7, NEUTRAL→8, CMD→9, DOCS→10, ACCEPT→11. Strict dependency chain: 1.6.1 re-vendor (7) is the foundation; model neutralization (8) lands before command expansion so new commands emit clean; expansion (9) grows the roster through the same capability-map gate; docs (10) are written only once the final command set + neutralization exist (MAINTAINING runbook sourced from Phase 7's real re-vendor); the acceptance delta (11) is insert-only over the frozen v1 AC-01..AC-26. All v1 cross-cutting principles carry forward unchanged.
- [Roadmap v2.0]: Model-neutrality is verified by a zero-literal INVARIANT assertion (zero model literals per regex across the whole emitted `.bob/` set), NOT byte-golden — absence-of-X is a cleaner, more durable contract than exact bytes. The ~231 model mentions live in the vendored 1.6.1 payload and flow through the converter; gsd-bob's own code already carries zero model literals.
- [Roadmap]: Test-deferred model — no live Bob exists on the dev device (and never will). Every phase's success criteria must be verifiable WITHOUT a live Bob (doc-conformance, golden/unit tests against the artifact contract, or Claude-runtime equivalence), and every phase contributes device-runnable steps to one consolidated acceptance checklist run once on hardware in Phase 6.
- [Roadmap]: Phase 1 reframed from an empirical "Bob Capability Spike" to a documentation-grounded "Bob Capability Mapping" — it can no longer demonstrate anything against a live Bob, so for each primitive it reviews the docs, records a conservative lower-bound default (assume NO isolated subagents → sequential inline; assume NO structured prompts → text_mode), and authors a device-runnable verification step.
- [Roadmap]: New final Phase 6 "On-Device Acceptance Verification" owns VERIFY-01/02 — the consolidated acceptance checklist plus the single unattended pass the user runs on a real Bob machine, including a mechanism to log assumptions that proved wrong as follow-ups.
- [Roadmap]: Runtime foundation and artifact translation combined into Phase 2 (coarse granularity) — the runtime descriptor is part of the same emitter component, so they ship together as the irreducible core.
- [Roadmap]: Upstream-readiness (UP-01/UP-02) folded into Phase 5 alongside the quality gates rather than given its own phase — it is a cross-cutting final audit that reads cleanest as the ship-ready close.
- [Phase 1]: Resolved all four Bob SPIKEs from live bob.ibm.com/docs into CAPABILITY-MAP.md (fixed-schema rows: citation + verbatim quote + confidence + state per row). Locked SPIKE-01 (sequential inline) and SPIKE-02 (text_mode) defaults recorded and sourced, not relitigated.
- [Phase 1]: SPIKE-04 split into 3 sub-findings: config home ~/.bob (Documented/HIGH), config-home env override dropped (UNKNOWN/LOW), IDE-vs-Shell via BOB_SHELL_CLI_IDE_SERVER_PORT (MEDIUM). No machine-readable bob descriptor built (D-03 deferred to Phase 2).
- [Phase 1]: Established D-07 cross-phase append convention — .planning/ACCEPTANCE-CHECKLIST.md at planning root, seeded read-only AC-01..AC-04, append target for Phases 2-6, run target for Phase 6.
- [Phase ?]: Bob skill converter never early-returns on missing frontmatter (emits empty description) so Bob does not silently ignore the skill
- [Phase 02]: mergeCustomModes filter is slug-equality scoped — a differently-named gsd-* slug is retained, not blanket-wiped
- [Phase ?]: bob runtime defaults workflow.text_mode:true via install-written .planning/config.json (Phase 3 installer must write it); TRANS-03 by reuse of gsd-core config+workflow seam, no converter rewriting
- [Phase ?]: SUPPORT-ROSTER.md generated from the bob-adapter gate (scripts/generate-support-roster.cjs), never hand-maintained (T-02-10)
- [Phase 02]: convertClaudeToBobContent mirrors the Antigravity content pass retargeted to the .bob home (global ~/.bob, local .bob) and translates gsd:->gsd-; backend-agnostic (no neutralizeAgentReferences); applied to both Bob converters — closes the TRANS-01/02 BLOCKER.
- [Phase 02]: bob-adapter fails loud: mergeCustomModes throws on a non-mapping YAML root (never drops the gsd mode); gateArtifact rejects null/nameless candidates; buildSupportRoster never emits an undefined: line (TRANS-04/05).
- [Phase 03]: Installer CLI plumbing (args/scope/report) is dependency-free — args.cjs hand-parses argv with no --clean/--update flag; scope.cjs delegates global resolution to the vendored getGlobalConfigDir('bob', …) and never reimplements path math.
- [Phase ?]: [Phase 03]: stage.cjs sources the vendored gsd-core/ payload exclusively from repoRoot (the gsd-bob package root), never cwd/workspaceRoot; a missing payload fails loud (cwd-independent under npx)
- [Phase ?]: [Phase 03]: config-merge.mergeTextMode is the SOLE text_mode guarantee; MERGEs into root-anchored .planning/config.json, never clobbers an unparseable user config
- [Phase ?]: [Phase 03]: orphan prune only touches installer-created dirs; untracked user paths and .planning/ are never removed
- [Phase ?]: [Phase 03]: bin/gsd-bob.cjs gates the text_mode merge on an existing workspace .planning/; a global install in a non-project cwd skips the write and emits a KNOWN-LIMITATION note (no stray .planning/, D-14/Q1)
- [Phase ?]: [Phase 03]: uninstall is manifest-driven — un-merge merged slices (custom_modes via adapter, config.json inline JSON), hash-match delete file entries, never delete .planning/ (D-06/D-07)
- [Phase 05]: Phase 5 quality gates port by conversion (D-01) — vendor 4 command sources; unchanged installer auto-emits commands+skills
- [Phase 05]: Roster candidate set derived from commands/gsd/*.md (D-06) — drift-proof, matches installer renderRoster; 4 quality gates Supported, zero new skip (D-03)
- [Phase ?]: [Phase 05]: UP-01 discharged as audit-not-refactor (D-07); UPSTREAM.md records the 5-artifact move inventory with verified file:line pointers + gsd-core 1.5.0; no code moved
- [Phase ?]: [Phase 05]: README skill list sourced from generated SUPPORT-ROSTER.md (never hand-typed); AC-22..26 appended one-per-SC in the AC-17..21 schema, AC-01..21 untouched
- [Phase 06]: Coverage matrix is a standalone phase-dir file (D-01) keeping the frozen checklist untouched; a hermetic acceptance-coverage.test.cjs re-derives REQUIREMENTS v1 IDs + checklist Confirms family-regex tokens at run time and fails on any orphan SC/AC (no frozen ID list).
- [Phase 06]: AC-15 uninstall ordered LAST as teardown (D-03); FU-03 SPIKE-04 config-home links a descriptive proposed enhancement (no invented v2 ID, Pitfall 5); followups presence test is structural only (does not assert rows stay 'unconfirmed').

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- No live Bob on the dev device: three primitives (subagent isolation, structured-choice prompts, config-home env-override + IDE-vs-Shell signal) cannot be empirically confirmed during development. Phase 1 resolves them from docs with conservative lower-bound defaults; empirical confirmation is deferred to the Phase 6 on-device acceptance pass, and any assumption proven wrong on hardware becomes a logged follow-up. v2.0 extends this same pass (Phase 11) with device-runnable steps for the new commands and the model-neutrality invariant.
- Backend-neutrality, the flag-gap contract, and `.planning/` root-anchoring are cross-cutting constraints established in Phase 2 and enforced through every later phase — including all of v2.0.
- v2.0 dependency risk: Phase 7's 1.6.1 re-vendor is the foundation for Phases 8–11; a mixed 1.5.0/1.6.1 payload (SYNC-01) would undermine neutralization (8), command expansion (9), the docs roster (10), and the acceptance delta (11). Keep the payload on one consistent version.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260619-ncs | Fix installer to stage gsd-core siblings (scripts/fix-slash-commands.cjs + synthesized package.json) so the staged `.bob/` shim loads out-of-tree; out-of-tree regression test added. On-device find during the Phase 6 acceptance pass. | 2026-06-19 | be4002a | [260619-ncs](./quick/260619-ncs-fix-gsd-bob-installer-to-stage-gsd-core-/) |
| 260619-ou0 | Prepare first npm publish: add `package.json` `files` allowlist (bin/, src/, gsd-core/, commands/, scripts/, README.md, LICENSE) + MIT LICENSE file. `npm pack` verified clean (no .planning/, test/, or .tgz; 405 files, 1.3 MB). Does not publish (login user-driven). | 2026-06-20 | 5e5686b | [260619-ou0](./quick/260619-ou0-npm-publish-packaging/) |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-02T23:15:00.000Z
Stopped at: Milestone v2.0 roadmap created (Phases 7–11); ready to plan Phase 7
Resume file: .planning/ROADMAP.md (Phase 7 — gsd-core 1.6.1 Sync)
