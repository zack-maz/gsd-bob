# Feature Research

**Domain:** Dev-tooling / AI-agent planning framework port (open-gsd → IBM Bob adapter)
**Researched:** 2026-06-17
**Confidence:** HIGH (enumeration grounded in live `~/.claude/gsd-core/` v1.5.0 source — workflows, bin shim, agent registry, templates)

> **Framing note.** The "features" here are GSD's *own* capabilities that a Bob port must reproduce, not end-user product features. "Table stakes" = the v1 must-port set (core loop + quality gates). "Differentiators" = the broader GSD skill set, deferred. "Anti-features" = GSD capabilities we deliberately do NOT port in v1. For each, the load-bearing column is **Primitive dependency** (interactive prompt / subagent / shell / pure-artifact) and the resulting **Bob parity risk**.

## GSD Surface Area (grounded enumeration)

Source of truth inspected: `~/.claude/gsd-core/` @ `VERSION 1.5.0`.

| Surface | Where it lives | Count / detail |
|---------|----------------|----------------|
| Slash commands / skills | `workflows/*.md` (one file per command; the Skill tool surfaces the same files as `gsd-*` skills) | **74** workflow `.md` files |
| Subagent types | Registered in `.claude/agents/` (or runtime equivalent); enumerated authoritatively inside `execute-phase.md` `<available_agent_types>` | **12** core types + 3 specialist types referenced in workflows (`gsd-code-reviewer`, `gsd-code-fixer`, `gsd-debug-session-manager`) |
| Workflows | Same as slash commands (GSD "workflow" = the `.md` recipe a command runs) | multi-step `<process>` recipes; some have sub-dirs (`discuss-phase/`, `execute-phase/steps`, `help/modes`) |
| Artifact contract | `templates/*.md` + `contexts/*.md` | `.planning/` files: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json, phase plans (PLAN.md/SUMMARY.md/VERIFICATION.md/CONTEXT.md/RESEARCH.md), plus DEBUG.md, REVIEW.md, UAT.md, SECURITY.md, AI-SPEC.md, UI-SPEC.md, VALIDATION.md |
| CLI shim | `bin/gsd-tools.cjs` (+ `check-latest-version.cjs`, `verify-reapply-patches.cjs`, `lib/`, `shared/`) | Node CLI invoked as `gsd_run query <verb>` via a runtime-detecting launcher snippet |

**12 core subagent types** (verbatim from `execute-phase.md`):
`gsd-executor`, `gsd-verifier`, `gsd-planner`, `gsd-phase-researcher`, `gsd-plan-checker`, `gsd-debugger`, `gsd-codebase-mapper`, `gsd-integration-checker`, `gsd-nyquist-auditor`, `gsd-ui-researcher`, `gsd-ui-checker`, `gsd-ui-auditor`.

### The three Claude-specific primitives (the parity risks)

Every GSD command is a composition of three primitives. The port's entire risk surface reduces to how Bob supports each.

| Primitive | What it is | GSD usage footprint | Existing GSD degradation seam | Bob parity risk |
|-----------|------------|---------------------|-------------------------------|-----------------|
| **Interactive prompt** (`AskUserQuestion`) | Structured multiple-choice question UI; blocks for a typed/selected answer | **45+** workflows call it (incl. every core-loop entry point: new-project, plan-phase, execute-phase interactive mode, verify-work, discuss-phase) | **`workflow.text_mode`** — when true, workflows replace `AskUserQuestion` with a plain-text numbered list + typed reply. Supported in **40+** workflows already. | MEDIUM — text_mode already exists as the fallback path; if Bob lacks a structured-choice UI the port rides the existing text_mode seam. Parity-first goal wants native structured prompts where Bob offers them. |
| **Subagent spawning** (`Agent(subagent_type=...)`) | Spawns an isolated agent that runs a sub-recipe and returns a result; enables wave-based parallelism + worktree isolation | **40+** workflows; **load-bearing** for `execute-phase` (wave parallelism), `code-review`, `debug`, `verify-phase`, `plan-phase` (planner/checker), audits | Documented **runtime-specific fallback**: Copilot can't reliably signal subagent completion → forces **sequential inline execution** instead of spawning. `isolation="worktree"` is Claude-only and auto-degrades. | **HIGH — the dominant parity risk.** Whether Bob can spawn agents that return completion signals determines whether execute-phase parallelism and the quality gates run isolated or inline. If Bob lacks reliable spawning, port inherits Copilot's "sequential inline" pattern (works, but loses parallelism + isolation). |
| **Shell + `gsd-tools.cjs` shim** (Bash `gsd_run query ...`) | Deterministic logic offloaded to a Node CLI (state load, config, roadmap analysis, model resolution, progress bar, JSON contracts) | **Near-universal** — virtually every workflow opens with the launcher snippet and calls `gsd_run query ...` | The launcher snippet already probes ~18 runtime config dirs to locate the shim | LOW-to-MEDIUM — pure deterministic Node CLI; backend-agnostic by construction. Risk is only: (a) does Bob expose a Bash/shell tool, and (b) Bob is **not yet a known runtime** in the launcher snippet (no `bob` branch; only `claude` etc. detected). A `bob` detection branch must be added. |

> **Backend-agnostic vs host-specific split.** The shim + `.planning/` artifact contract are **backend-agnostic** (pure files + deterministic Node — port cleanly, this is the interchange guarantee in PROJECT.md). The two host-specific primitives are **interactive prompt** and **subagent spawning** — these are where Bob's extension architecture must provide an equivalent or the port falls back to GSD's existing degradation seams.

## Feature Landscape

### Table Stakes (v1 MUST port — core loop + quality gates)

Per PROJECT.md Active requirements: core loop = new-project, plan-phase, execute-phase, verify, progress; quality gates = review, debug, audit.

| Feature (GSD command) | Why it MUST port | Primitive dependency | Bob parity risk | Complexity |
|---------|------------------|----------------------|-----------------|------------|
| `new-project` | Entry point; produces PROJECT.md + config.json — the artifact contract that makes the two runtimes interchangeable | Interactive (heavy: 8+ AskUserQuestion blocks) + Shell. Spawns researchers optionally. | MEDIUM — interactive-prompt-heavy; rides text_mode if Bob lacks structured choices | HIGH |
| `plan-phase` | Core loop; produces PLAN.md (+ optional RESEARCH.md). Heart of "spec-driven" | Interactive + **Subagent** (gsd-planner, gsd-plan-checker, gsd-phase-researcher) + Shell | HIGH — subagent-dependent for planner/checker | HIGH |
| `execute-phase` | Core loop; the build step. Wave-based parallel execution via gsd-executor | **Subagent (load-bearing — parallelism + worktree isolation)** + Shell + Interactive (interactive mode) | **HIGH — top risk.** Falls back to sequential inline if Bob can't spawn/signal | HIGH |
| `verify-work` / `verify-phase` | Core loop "verify"; conversational UAT (`verify-work`) + automated gate check (`verify-phase`, spawns gsd-verifier) | Interactive (verify-work) + **Subagent** (verify-phase → gsd-verifier) + Shell | MEDIUM-HIGH — verify-work is mostly interactive+artifact; verify-phase needs subagent | MEDIUM |
| `progress` | Core loop; the unified situational/dispatch command. Reads state, routes to next action | Shell (heavy `gsd_run query` orchestration) + light Interactive. No subagent. | LOW — mostly deterministic shim calls + artifact reads | MEDIUM |
| `code-review` (review) | Quality gate; spawns gsd-code-reviewer, writes REVIEW.md. `--fix` delegates to gsd-code-fixer | **Subagent** (gsd-code-reviewer, gsd-code-fixer) + Shell | HIGH — subagent-dependent | MEDIUM |
| `debug` | Quality gate; persistent DEBUG.md state, spawns gsd-debug-session-manager / gsd-debugger | **Subagent** + Interactive + Shell | HIGH — subagent-dependent | MEDIUM |
| `audit-fix` / `audit-milestone` / `audit-uat` (audit) | Quality gate; find→classify→fix→test→commit and milestone/UAT audits. Spawn audit/integration agents | **Subagent** + Shell (`audit-uat` is mostly shim/artifact) | MEDIUM-HIGH — mixed; audit-uat is the cheapest to port | MEDIUM |

**Implied transitive table stakes** (these commands invoke them, so they must exist for the loop to function):
- `discuss-phase` — plan-phase's upstream context-gathering (Interactive + Subagent). The core loop's quality depends on it.
- `execute-plan` — the per-plan recipe gsd-executor runs inside execute-phase (Subagent payload).
- The **12 core subagent types** above — table-stakes infrastructure, not optional, because the table-stakes commands spawn them.

### Differentiators (the broader GSD skill set — deferred to v1.x / v2)

Valuable GSD capabilities NOT in the v1 must-port set. Defer per PROJECT.md "Out of Scope: Full parity of all ~70 GSD skills."

| Feature (GSD command cluster) | Value proposition | Primitive dependency | Bob parity risk | Complexity |
|---------|-------------------|----------------------|-----------------|------------|
| Spec/discovery cluster: `spec-phase`, `discovery-phase`, `mvp-phase`, `ai-integration-phase`, `ui-phase` | Richer phase-shaping (ambiguity scoring, MVP slicing, AI/UI design contracts) | Interactive + Subagent | Inherits core-loop risks; defer | HIGH |
| Ideation cluster: `explore`, `sketch`, `spike`, `capture`/`plant-seed` | Pre-planning thinking + idea routing | Interactive + Subagent (explore) | Mostly interactive; portable later | MEDIUM |
| Knowledge/context cluster: `map-codebase`, `graphify`, `docs-update`, `extract-learnings`, `mempalace-*`, `thread` | Codebase intel + persistent knowledge graph | Subagent (mappers) + Shell | Subagent-heavy; defer | HIGH |
| Lifecycle cluster: `new-milestone`, `complete-milestone`, `milestone-summary`, `transition`, `stats`, `cleanup` | Multi-milestone project management | Interactive + Shell | Mostly artifact/shim; portable but out of v1 scope | MEDIUM |
| Autonomy cluster: `autonomous`, `quick`, `fast`, `manager`, `workstreams`, `workspace` | Unattended runs + parallel workstream management | **Subagent (heavy)** | HIGH — depends on robust spawning; defer until execute-phase parity proven | HIGH |
| Advanced review/validation: `secure-phase`, `validate-phase`, `eval-review`, `ui-review`, `plan-review-convergence`, `review` (cross-AI) | Deeper quality gates beyond the v1 trio | Subagent + Shell + external AI CLIs | HIGH + external-CLI dependency; defer | HIGH |
| Maintenance: `import`, `ingest-docs`, `pr-branch`, `ship`, `inbox`, `undo`, `resume-work`, `pause-work`, `forensics` | Repo/PR plumbing + session continuity | Mixed (Shell-heavy) | LOW-MEDIUM individually; out of v1 scope | MEDIUM |
| Config/help: `config`/`settings`/`settings-*`, `help`, `surface`, `update`, `health`, `profile-user` | Tooling around the framework | Shell + Interactive | LOW; some needed minimally (config.json must exist for core loop) | LOW |

> **Carve-out:** `config`/`settings` write `config.json`, which the core loop reads (`workflow.text_mode`, `parallelization`, `model_profile`, etc.). A **minimal config surface** is effectively table-stakes even though the full settings UX is a differentiator — the port needs config.json populated, but not the whole settings menu.

### Anti-Features (deliberately NOT port in v1)

| Feature | Why it seems in-scope | Why NOT in v1 | What to do instead |
|---------|----------------------|---------------|--------------------|
| Per-backend model tuning (Gemini-/Claude-specific behavior) | Bob routes to multiple model CLIs | PROJECT.md Out-of-Scope: v1 core is backend-agnostic; per-backend richness deferred | Emit backend-neutral artifacts; let Bob own routing (`model_profile: inherit`) |
| Rich Bob-native re-modeling of missing primitives (deep mode/agent equivalents for prompts + subagents) | "Native fidelity" is the goal | PROJECT.md Out-of-Scope: held for a later milestone | **Parity-first: flag/skip** skills whose primitives Bob lacks; do not build deep equivalents yet |
| "Text mode" graceful-degradation as the v1 *strategy* | text_mode already exists in 40+ workflows and is the obvious cheap path | PROJECT.md Out-of-Scope: parity-first is the v1 strategy, not degradation-first | Use text_mode only as a **fallback** where Bob genuinely lacks a primitive — not as the default design |
| Full ~70-skill parity | "Just port everything" | PROJECT.md Out-of-Scope: prove the pattern on a useful subset first | Port the 8-command table-stakes set + their 12 subagents; defer the long tail |
| Upstreaming/merging to gsd-core during v1 | Contribution-readiness is a stated goal | PROJECT.md Out-of-Scope: ship standalone first, PR is a follow-on | Keep code contribution-ready (naming/structure) but ship `gsd-bob` standalone |
| Worktree-isolated parallelism in v1 | execute-phase uses it on Claude | `isolation="worktree"` is Claude-Code-specific and already auto-degrades for other runtimes | Run executors sequential/inline (the documented non-Claude fallback) until Bob's spawning model is understood |

## Feature Dependencies

```
new-project ──produces──> config.json + PROJECT.md  (artifact contract — the interchange guarantee)
       │
       └──enables──> progress (reads STATE.md/ROADMAP.md, routes)
                         │
discuss-phase ──feeds──> plan-phase ──produces──> PLAN.md
       (Interactive+Subagent)   │  (spawns gsd-planner, gsd-plan-checker)
                                 ▼
                          execute-phase ──spawns──> gsd-executor (runs execute-plan) ──produces──> SUMMARY.md
                                 │  (wave parallelism — Subagent, load-bearing)
                                 ▼
                          verify-phase ──spawns──> gsd-verifier ──produces──> VERIFICATION.md
                          verify-work  (Interactive UAT) ──produces──> UAT.md

Quality gates (attach to a completed phase):
   code-review ──spawns──> gsd-code-reviewer ──produces──> REVIEW.md ──(--fix)──> gsd-code-fixer
   debug       ──spawns──> gsd-debug-session-manager/gsd-debugger ──produces──> DEBUG.md
   audit-*     ──spawns──> audit/integration agents ──produces──> audit artifacts

ALL of the above ──require──> gsd-tools.cjs shim (Bash gsd_run query ...) + .planning/ artifacts
                              └── shim has NO 'bob' runtime branch yet (must be added)
```

### Dependency Notes

- **Everything requires the shim + artifact contract.** These are backend-agnostic and port cleanly — they are the foundation phase. The launcher snippet must gain a `bob` detection branch (currently absent).
- **execute-phase requires reliable subagent spawning** for its core value (wave parallelism). Without it, the port inherits the documented "sequential inline" fallback. This single dependency is the v1 critical path.
- **plan-phase requires discuss-phase** for context quality, and requires gsd-planner/gsd-plan-checker subagents. discuss-phase is therefore transitively table-stakes.
- **Quality gates require their named specialist subagents** (gsd-code-reviewer, gsd-code-fixer, gsd-debugger, gsd-debug-session-manager). Porting the gates means porting these agents.
- **Interactive prompts conflict with non-interactive backends** — but the conflict is already resolved by `text_mode`. Bob's prompt capability decides whether the port uses native prompts or rides text_mode.

## MVP Definition

### Launch With (v1)

- [ ] **Shim + launcher with a `bob` runtime branch** — backend-agnostic foundation; nothing runs without `gsd_run query`. (Shell; LOW-MED risk)
- [ ] **`.planning/` artifact contract** — same templates GSD emits, so the two runtimes stay interchangeable per the compatibility constraint. (Pure-artifact; LOW risk)
- [ ] **Bob's interactive-prompt mapping** — decide native structured prompt vs text_mode fallback per Bob's capability. (Host-specific; MEDIUM risk)
- [ ] **Bob's subagent-spawning mapping** — the critical-path decision (parallel-isolated vs sequential-inline). (Host-specific; HIGH risk)
- [ ] **Core loop:** `new-project`, `plan-phase`, `execute-phase` (+ `execute-plan`), `verify-work`/`verify-phase`, `progress`, plus transitive `discuss-phase`.
- [ ] **Quality gates:** `code-review` (+`code-review-fix`), `debug`, `audit-fix`/`audit-milestone`/`audit-uat`.
- [ ] **The required subagent types:** gsd-executor, gsd-planner, gsd-plan-checker, gsd-phase-researcher, gsd-verifier, gsd-debugger, gsd-debug-session-manager, gsd-code-reviewer, gsd-code-fixer (the subset the table-stakes commands actually spawn).
- [ ] **Minimal config surface** — enough `config.json` (text_mode, parallelization, model_profile=inherit) for the core loop to read.
- [ ] **One-line npx/Node installer** (local/global, clean/update) mirroring gsd-core.

### Add After Validation (v1.x)

- [ ] Lifecycle cluster (`new-milestone`, `complete-milestone`, `transition`) — trigger: a full project completes its first milestone in Bob.
- [ ] Spec/MVP/UI/AI phase-shaping cluster — trigger: users want richer phase contracts.
- [ ] Worktree-isolated parallelism — trigger: Bob's spawning model proven to support isolation + completion signals.
- [ ] Full settings/config UX, `help`, `surface`.

### Future Consideration (v2+)

- [ ] Autonomy cluster (`autonomous`, `manager`, `workstreams`) — defer until single-phase execution parity is rock-solid.
- [ ] Knowledge graph / mempalace / map-codebase — defer; subagent-heavy and not on the core loop.
- [ ] Cross-AI review (`review`, `plan-review-convergence`) and external-CLI integrations.
- [ ] Upstream PR to gsd-core as a first-class Bob runtime.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Shim + `bob` launcher branch | HIGH | LOW | P1 |
| `.planning/` artifact contract | HIGH | LOW | P1 |
| Subagent-spawning mapping | HIGH | HIGH | P1 |
| Interactive-prompt mapping | HIGH | MEDIUM | P1 |
| `progress` | HIGH | MEDIUM | P1 |
| `new-project` | HIGH | HIGH | P1 |
| `plan-phase` + `discuss-phase` | HIGH | HIGH | P1 |
| `execute-phase` + `execute-plan` | HIGH | HIGH | P1 |
| `verify-work` / `verify-phase` | HIGH | MEDIUM | P1 |
| `code-review`, `debug`, `audit-*` | HIGH | MEDIUM | P1 |
| Minimal config surface | MEDIUM | LOW | P1 |
| npx installer (local/global, clean/update) | HIGH | MEDIUM | P1 |
| Lifecycle cluster | MEDIUM | MEDIUM | P2 |
| Worktree isolation | MEDIUM | HIGH | P2 |
| Spec/MVP/UI/AI phase-shaping | MEDIUM | HIGH | P2 |
| Autonomy / knowledge-graph / cross-AI clusters | LOW-MED | HIGH | P3 |

**Priority key:** P1 = must have for launch · P2 = should have, add when possible · P3 = nice to have, future.

## Competitor Feature Analysis

GSD already abstracts runtimes; the relevant "competitors" are the **existing runtime adapters** baked into gsd-core. They are the proof-of-pattern and the reference design for the Bob port.

| Concern | Claude Code (reference) | Copilot (degraded reference) | Codex/Gemini (text-mode reference) | Bob port (our plan) |
|---------|--------------------------|------------------------------|-------------------------------------|---------------------|
| Subagent spawning | `Agent(subagent_type=...)`, parallel, worktree-isolated | Can't reliably signal completion → **sequential inline** fallback | Mapped to `spawn_agent`; worktree fails closed | Parity-first if Bob supports it; else inherit the Copilot inline pattern |
| Interactive prompt | Native `AskUserQuestion` | Native | **text_mode** numbered lists | Native structured prompt if Bob offers; else text_mode |
| Shell/shim | Bash + `gsd-tools.cjs` | Bash | Bash | Bash + add `bob` branch to launcher (currently missing) |
| Runtime detection | `.claude/` dir | `.copilot/` etc. | `.codex/`,`.gemini/` | **Not yet present — must add a Bob config-dir branch** |

## Sources

- `~/.claude/gsd-core/` @ `VERSION 1.5.0` — live framework source (HIGH confidence, primary)
  - `workflows/*.md` (74 command/workflow recipes; sizes & primitive grep verified)
  - `workflows/execute-phase.md` `<available_agent_types>` (authoritative 12-type subagent registry)
  - `workflows/_runtime-launcher.snippet.sh` (runtime detection; confirmed **no `bob` branch**)
  - `bin/gsd-tools.cjs` + `lib/` + `shared/` (the shim; `grep bob` → no match)
  - `templates/*.md`, `contexts/*.md` (the `.planning/` artifact contract)
- `.planning/PROJECT.md` — v1 scope, Out-of-Scope list, constraints (HIGH confidence, primary)
- Primitive footprint measured by grep across `workflows/*.md`: AskUserQuestion (45+), Agent/subagent (40+), gsd-tools (near-universal), text_mode (40+)

---
*Feature research for: open-gsd → IBM Bob adapter port*
*Researched: 2026-06-17*
