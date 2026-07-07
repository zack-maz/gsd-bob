---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: 1.6.1 Sync & Command Expansion
current_phase: 0
status: Awaiting next milestone
stopped_at: Phase 11 context gathered
last_updated: "2026-07-06T21:49:33.590Z"
last_activity: 2026-07-06
last_activity_desc: Milestone v2.0 completed and archived
progress:
  total_phases: 11
  completed_phases: 5
  total_plans: 10
  completed_plans: 10
  percent: 45
current_phase_name: on-device-acceptance-delta
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-02)

**Core value:** A Bob user installs via a single command and runs the full GSD planning loop (new-project → plan-phase → execute-phase → verify) natively, producing the same `.planning/` artifacts GSD produces in Claude Code.
**Current focus:** Phase 11 — on-device-acceptance-delta

## Current Position

Phase: Milestone v2.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-07-06 — Milestone v2.0 completed and archived

## Performance Metrics

**Velocity:**

- Total plans completed: 21
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
| 07 | 3 | - | - |
| 8 | 1 | - | - |
| 9 | 2 | - | - |
| 10 | 3 | - | - |
| 11 | 1 | - | - |

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
| Phase 07 P01 | 25m | 2 tasks | 2 files |
| Phase 07 P02 | ~15m | 2 tasks | 3 files |
| Phase 07 P03 | ~20m | 3 tasks | 5 files |
| Phase 08 P01 | 9 min | 3 tasks | 5 files |
| Phase 09 P01 | ~15m | 2 tasks | 31 files |
| Phase 09 P01 | ~15m | 2 tasks | 31 files |
| Phase 09 P02 | 8min | 2 tasks | 1 files |
| Phase 10 P01 | 10min | 3 tasks | 4 files |
| Phase 10 P02 | 6m | 1 tasks | 1 files |
| Phase 10 P03 | 5m | 1 tasks | 1 files |
| Phase 11 P01 | 18min | 3 tasks | 5 files |

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
- [Phase 07]: 07-01: apply-bob-patches.cjs embeds bob blocks as per-line JSON.stringify arrays (byte-perfect, readable); six-delta model confirmed correcting D-01
- [Phase ?]: Phase 07-02 re-vendor: nuke-and-restage curated gsd-core/ subset from immutable 1.6.1 tarball; re-inject six deltas via apply-bob-patches.cjs; preserve stock upstream 1.5.0 comment in legacy-cleanup.cjs to keep idempotency + restage integrity
- [Phase ?]: UPSTREAM.md inventory grew 5 to 6 artifacts: documented the runtime-name-policy.cjs FALLBACK_ALIASES bob entry; corrected the converter framing to reflect a vendored hand-edit not stock upstream
- [Phase ?]: Phase 8 model-neutralization: one shared SOURCE regex in bob-adapter.cjs powers both neutralizeModelReferences and the NEUTRAL-03 invariant (D-03); scope locked to emitted converted set, raw payload excluded (D-01)
- [Phase ?]: acceptance-coverage.test.cjs Open Q1 resolved via option (a): fixed boundary to '## Milestone v2.0 Requirements' and added a declared-id (v1+v2.0) phantom-ref set so AC-27 -> NEUTRAL-03 is admitted while typos still fail
- [Phase ?]: Two-roster divergence Option A: CMD-02 verified against repo-root generated SUPPORT-ROSTER.md + count==28, not the installed 5-entry renderRoster list; stage.cjs untouched
- [Phase ?]: [Phase 10-01]: COMMANDS.md is generated (scripts/generate-command-reference.cjs) from commands/gsd/*.md frontmatter, never hand-authored — blurbs trace verbatim to source and the D-03 conformance guard keeps README + COMMANDS pinned to the generated SUPPORT-ROSTER Supported set.
- [Phase ?]: [Phase 10-01]: README cluster subheads are h3 so ## Flagged gaps stays the first h2 after ## Supported skills; package.json files allowlist untouched (D-07) — COMMANDS/ARCHITECTURE/MAINTAINING stay repo-only.
- [Phase ?]: ARCHITECTURE.md cites live src/bob-adapter.cjs + stage.cjs symbols; deleted CAPABILITY-MAP.md referenced only as git-recovered history (D-05)
- [Phase ?]: Authored MAINTAINING.md as a replayable version-bump checklist (D-06); kept <old>/<new> placeholders; excluded from package.json files allowlist (D-07)

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
| 260704-gmp | Bump version 0.1.2 → 0.2.0 for the milestone v2.0 release (1.6.1 sync, model neutralization, 28-command expansion, docs). `npm pack --dry-run` verified clean (0 .planning/test/.tgz entries; 445 files, 1.5 MB). Does not publish (user-driven `npm publish`). | 2026-07-04 | c18a156 | [260704-gmp](./quick/260704-gmp-bump-version-0-1-2-to-0-2-0-and-verify-n/) |
| 260706-j81 | Seed Bob's 270k context window into the installer config + document it. `mergeTextMode` now seeds top-level `context_window: 270000` (alongside `text_mode:true`) into `.planning/config.json` so gsd-core's read-depth/advisory scaling matches Bob's real shared window under sequential-inline execution (was silently defaulting to 200k). ARCHITECTURE.md (Axis 2) + README.md (Flagged gaps) updated. Tests 7/7. | 2026-07-06 | 4d25e93 | [260706-j81](./quick/260706-j81-seed-bob-270k-context-window/) |
| 260706-jwe | **Deliberate v2.0 re-baseline of the Phase 11 frozen AC-01..26 snapshot** (governance amend). Corrected the stale install package name `@opengsd/gsd-bob` → `@zack-maz/gsd-bob` in ACCEPTANCE-CHECKLIST.md (1 preamble + 4 in frozen steps AC-13..16) and regenerated the byte-exact freeze fixture in lockstep so the insert-only guard passes against the NEW baseline. Knowingly moves the frozen baseline — accountability is this task + commit, not the byte-freeze. All 3 acceptance guards green; full suite 321/1 (only pre-existing CORE-02). | 2026-07-06 | 0f1f0e2 | [260706-jwe](./quick/260706-jwe-rebaseline-frozen-ac13-16/) |
| 260707-ey1 | **Fix two P0 Bob-adapter bugs from HANDOFF-bob-docs-verification.md (full correction).** BUG 1: `emitGsdMode()` emitted invalid tool group `command` → `execute` (Bob has no `command` group; the gsd_run seam was dead) + valid-group-set freeze test. BUG 2: refuted "Bob runs subagents sequentially inline" — renamed primitive `isolatedSubagents` → `parallelSubagentFanout` (kept false) across all 12 coupling sites, un-gated `gsd-autonomous` (Bob HAS isolated subagents), regenerated SUPPORT-ROSTER (1 unsupported, 28 supported), re-baselined frozen AC-01+AC-10 in lockstep. Doc-model corrections folded into CLAUDE.md/README/ARCHITECTURE. Tests 323/320/3 (same 3 pre-existing fails, none new). Released as v0.2.2. | 2026-07-07 | 5019e6f..af6e5c1 | [260707-ey1](./quick/260707-ey1-fix-two-p0-bob-adapter-bugs-invalid-comm/) |
| 260707-fast | Update IBM-themed cover (covers/gsd-bob-architecture-ibm.svg) to the v0.2.2 capability model: "28 emitted · 1 withheld", gsd-autonomous withheld chip replaced with an isolation-confirmed note (spawn_subagent · isolated context window), gsd-parallel-fanout reason corrected to "parallel fan-out undocumented in Bob — unverified". SVG well-formed; 0 stale claims remain. (gsd-fast, no plan dir) | 2026-07-07 | 45951e4 | — |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-04T17:29:11.456Z
Stopped at: Phase 11 context gathered
Resume file: .planning/phases/11-on-device-acceptance-delta/11-CONTEXT.md

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
