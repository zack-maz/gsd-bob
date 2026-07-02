# GSD for IBM Bob (gsd-bob)

## What This Is

A standalone, installable adapter package that makes **open-gsd** — the GSD ("Getting Stuff Done") spec-driven planning framework, today a Claude Code skill/agent system — run natively inside **IBM Bob** (bob.ibm.com). It audits GSD's primitives (slash commands, subagents, workflows, templates), maps Bob's extension architecture, and translates GSD into Bob-native artifacts that work regardless of which model backend Bob routes to (Claude Code CLI, Gemini, etc.). It ships with a one-line npx installer (local/global scope, update/clean modes) and is built clean enough to eventually be contributed upstream as a first-class Bob runtime in gsd-core.

## Core Value

A Bob user can install via a single command and run the full GSD planning loop — new-project → plan-phase → execute-phase → verify — natively, producing the same `.planning/` artifacts GSD produces in Claude Code.

## Current Milestone: v2.0 — 1.6.1 Sync & Command Expansion

**Goal:** Bring gsd-bob up to gsd-core 1.6.1 on one consistent vendored version, make every emitted artifact fully model-neutral, roughly triple the emitted command surface (10 → 28) to cover the daily-driver GSD workflow, and document the adapter to a maintainer standard — including a repeatable runbook for future gsd-core version bumps.

**Target features:**
- Full re-vendor of the `gsd-core/` payload from 1.5.0 → 1.6.1, with the Bob descriptor + converters re-validated against the new bin layer
- A model-neutralization converter pass so zero `opus`/`sonnet`/`haiku` (or model directives) reach emitted `.bob/` artifacts — Bob owns model routing
- Curated expansion of the emitted command set from 10 to 28, each vetted through the capability-map gate
- Documentation: expanded README, per-command reference, Bob-vs-open-gsd architecture doc, and a maintainer runbook for gsd-core version bumps
- On-device acceptance delta covering the new commands and the model-neutrality invariant

## Requirements

### Validated

- [x] Port quality-gate skills to Bob: review, debug, audit (the daily-driver subset beyond the core loop) — *Validated in Phase 5: Quality Gates & Upstream Readiness (QUAL-01/02/03)*
- [x] Keep the adapter contribution-ready so it can later be proposed upstream to open-gsd/gsd-core as a supported Bob runtime — *Validated in Phase 5 (UP-01/UP-02: README + UPSTREAM.md 5-artifact move inventory, backend-neutrality grep green, gsd-core 1.5.0 recorded)*
- [x] Audit open-gsd/gsd-core primitives and define a backend-agnostic translation layer — *Validated across Phases 1–2 (SPIKE/RUNTIME/TRANS)*
- [x] Port the core planning loop to Bob (new-project, plan-phase, execute-phase, verify, progress) — *Validated in Phase 4 (CORE-01..05)*
- [x] Parity-first primitive mapping with explicit flag/skip for unsupported primitives — *Validated in Phase 2 (TRANS-04) and enforced through Phase 5*
- [x] One-line npx/Node installer with local/global scope and clean/update modes; standalone `gsd-bob` package with own versioning — *Validated in Phase 3 (INSTALL-01..05)*
- [x] End-to-end: install one-liner + full planning loop native in Bob + upstream-ready — *v1.0 milestone complete (Phases 1–6, 15 plans); on-device acceptance checklist assembled in Phase 6 (VERIFY-01/02)*

### Active (v2.0)

- [ ] Re-vendor the gsd-core payload to 1.6.1 on one consistent version and re-validate the Bob integration against the new bin layer
- [ ] Neutralize all model references in emitted artifacts (structural directives + inline prose), verified by an invariant assertion
- [ ] Expand the curated emitted command set from 10 to 28, each capability-map-gated
- [ ] Document the adapter to a maintainer standard: README, per-command reference, architecture (Bob vs open-gsd), and a gsd-core version-bump runbook
- [ ] Extend the on-device acceptance checklist to cover the new commands and the model-neutrality invariant

### Out of Scope

- Multi-backend-specific tuning per model (Gemini-specific, Claude-specific behavior) — v1 core is backend-agnostic; per-backend richness is deferred
- Rich "map to Bob-native equivalents" for primitives Bob lacks (e.g. deep mode/agent re-modeling of interactive prompts and subagents) — held as a later-milestone enhancement; v1 flags these gaps instead
- "Text mode" graceful-degradation fallback — not the v1 strategy (parity-first instead); may be revisited if parity proves too restrictive
- Full parity of all ~70 GSD skills — v1 is core loop + quality gates only; the long tail is deferred
- Merging upstream during v1 — the package ships standalone first; the actual PR/merge to gsd-core is a follow-on activity

## Context

- **GSD is self-hosting here**: this project is being planned *by* GSD running in Claude Code, so the source framework is directly inspectable at `~/.claude/gsd-core/` (skills, workflows, templates, agents, the `gsd-tools.cjs` CLI shim) and on GitHub at https://github.com/open-gsd/gsd-core.
- **gsd-core already abstracts runtimes**: its installer and shim already detect/support Claude, Codex, Gemini, Cursor, OpenCode, and others, and it has a `text_mode` concept for runtimes lacking `AskUserQuestion`. This is the existing seam a Bob runtime would plug into — useful both as a model for the standalone package and for the eventual upstream contribution.
- **IBM Bob** (bob.ibm.com) is the target host. Its extension/command/mode/agent architecture is the primary unknown and must be researched fresh from its docs before the translation design is locked.
- **Backend neutrality is a design principle**: Bob can drive multiple model CLIs; the GSD logic should not branch on which one. We emit Bob-native artifacts and let Bob route.
- **Open-source contribution is an explicit goal**, so naming, structure, and code quality should anticipate maintainer review from day one.
- **Development is test-deferred**: there is no Bob install on the dev device, so the build leans heavily on Bob's official docs (bob.ibm.com) and the close mapping to gsd-core's existing Cline/Cursor-family converters. Conservative assumptions are chosen so the package runs even on Bob's most constrained documented behavior; richer capability discovered on-device is an enhancement, not a prerequisite.

## Constraints

- **Compatibility**: Must produce the same `.planning/` artifact contract GSD produces today (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json, phase plans) so the two runtimes stay interchangeable.
- **Tech stack**: Installer is npx/Node, mirroring gsd-core's `npx @opengsd/...` pattern — cross-platform, familiar to existing GSD users.
- **Dependencies**: Bound to IBM Bob's actual extension capabilities (unknown until researched) and to gsd-core's evolving structure (it is the upstream source of truth).
- **Contribution-readiness**: Adapter must be structured and documented to a standard the open-gsd maintainers would plausibly accept.
- **No local Bob for testing**: IBM Bob is not available on the development device and won't be. All work is built against Bob's documented behavior plus conservative lower-bound assumptions; empirical validation happens once, in a final on-device acceptance pass run by the user on a Bob-enabled machine. Every phase must therefore emit device-runnable verification steps (commands + expected outputs) rather than relying on live testing during development.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ship a standalone `gsd-bob` package first, upstream to gsd-core later | Move fast and prove the translation before negotiating a maintainer merge | — Pending |
| Research Bob's architecture fresh from its docs | Its internals aren't known; the translation design depends on them | — Pending |
| v1 scope = core loop + quality gates (not full parity) | Prove the pattern end-to-end on a useful subset before scaling to ~70 skills | — Pending |
| Backend-agnostic core; Bob owns model routing | Avoids per-model branching; keeps GSD logic portable | — Pending |
| Parity-first; flag gaps rather than degrade | Keep a high "native" fidelity bar for v1; defer rich Bob-native re-modeling | — Pending |
| npx/Node installer (local/global, clean/update) | Matches existing GSD install UX; lowest friction for current users | — Pending |
| Develop test-deferred against docs + conservative defaults; verify once on-device | No Bob on the dev device; assume the constrained lower bound (no isolated subagents, no structured prompts) so it runs anywhere, then validate on a Bob machine | — Pending |
| (v2.0) Full re-vendor to gsd-core 1.6.1 rather than cherry-picking content | One consistent payload version; curated commands and bin layer stay in lockstep; avoids a franken-version | — Pending |
| (v2.0) Verify model-neutrality by invariant assertion (zero model literals in emitted `.bob/`), not byte-golden | Prose rewriting is fuzzy; absence-of-X is a cleaner, more durable contract than exact bytes | — Pending |
| (v2.0) Expand emitted commands 10 → 28 via curated high-value tier, not emit-all | Keeps the roster meaningful and lets each command earn a hand-written doc entry; parity-first gate preserved | — Pending |
| (v2.0) Author a MAINTAINING runbook sourced from Phase-1's real re-vendor | The vendoring model requires this dance every gsd-core release; a battle-tested playbook beats aspirational docs | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-02 — v1.0 milestone complete (Phases 1–6, 15 plans); starting milestone v2.0 (1.6.1 Sync & Command Expansion).*
