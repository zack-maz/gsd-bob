# Architecture Research

**Domain:** Runtime adapter — porting a runtime-neutral planning framework (open-gsd / gsd-core) to a new AI-coding-agent host (IBM Bob)
**Researched:** 2026-06-17
**Confidence:** HIGH on gsd-core abstraction (read from live source at `~/.claude/gsd-core/`); MEDIUM-HIGH on IBM Bob's extension model (read from official docs at bob.ibm.com + corroborating articles; a few seams flagged below).

---

## Executive Finding (read this first)

Two facts drive the entire architecture:

1. **gsd-core is already a runtime-adapter framework.** It does not hardcode Claude. Every supported runtime (16 today: claude, codex, gemini, cursor, opencode, cline, copilot, etc.) is a **declarative descriptor** in a generated `capability-registry.cjs`, plus an optional **converter function** that rewrites the runtime-neutral GSD source artifacts into that runtime's native format. Adding Bob is, structurally, *"add one runtime descriptor + one converter family + one installer surface"* — the same shape `codex` and `cline` already have. This is the seam the project description anticipated, and it is real and stable.

2. **IBM Bob is a Roo Code / Cline–family agent.** Its extension primitives — `.bob/commands/*.md` slash commands, `.bob/skills/<name>/SKILL.md` Agent Skills, `.bob/custom_modes.yaml`, `.bob/rules-{slug}/`, `.bob/mcp.json` — are nearly identical to formats gsd-core *already emits* for the cline/cursor/codebuddy/opencode families. **Bob's SKILL.md format is the Anthropic Agent Skills format gsd-core already targets.** This means the adapter is mostly a *mapping and packaging* exercise, not a from-scratch translation. The hard parts are (a) the few GSD primitives Bob lacks first-class equivalents for (subagent spawning, `AskUserQuestion`), and (b) the installer + descriptor that make Bob a first-class gsd-core runtime.

Net: this is **low architectural risk, medium integration risk**. The risk concentrates in primitive-gap handling and in keeping the work shaped for upstream merge.

---

## Part 1 — How IBM Bob loads and runs extensions

Sourced from bob.ibm.com/docs (custom-modes, slash-commands, skills, mcp, shell) and corroborating write-ups. Bob is an enterprise agentic SDLC tool that **routes work across multiple model backends (Anthropic Claude, Mistral, IBM Granite)** via an internal dispatcher — *GSD code must never branch on which backend Bob picks*; Bob owns routing entirely. (Note: public sources mention Claude/Mistral/Granite, **not Gemini** — the project brief's "Gemini" example is not confirmed for Bob; treat backend set as Bob-internal and opaque.)

### Bob's extension surface (the primitives GSD can target)

| Bob primitive | On-disk location (project / global) | Format | GSD analog | Confidence |
|---|---|---|---|---|
| **Slash command** | `.bob/commands/*.md` / `~/.bob/commands/*.md` | Markdown + optional frontmatter `description`, `argument-hint`; args via `$1`,`$2`; filename → `/name` | GSD slash commands (Claude `commands/gsd/*.md`) — **near-identical** | HIGH |
| **Skill** | `.bob/skills/<name>/SKILL.md` / `~/.bob/skills/` | YAML frontmatter (`name`, `description`) + markdown numbered steps with artifacts/verification | GSD skills / Anthropic Agent Skills — **same format family** | HIGH |
| **Custom mode** | `.bob/custom_modes.yaml` / global via Settings | `customModes[]`: `slug`, `name`, `roleDefinition`, `whenToUse`, `customInstructions`, `groups` | No 1:1 GSD analog; closest to an agent persona | HIGH |
| **Rules** | `.bob/rules-{slug}/*.md` or `.bob/rules/` | Plain markdown, auto-injected as instructions | Project-instruction files (CLAUDE.md / AGENTS.md) | HIGH |
| **MCP servers** | `.bob/mcp.json` (project takes precedence over global) | JSON `mcpServers{}` (`command`/`args`/`env` or `url`/`headers`) | Not needed for v1 GSD (gsd-tools is a local CLI, not MCP) | HIGH |
| **Tool groups** | inside a mode's `groups` | `read`, `edit` (w/ `fileRegex`), `command`, `browser`, `mcp`, `skill` | Permission model — `command` group = shell access GSD needs | HIGH |
| **BobShell** | terminal CLI, interactive + **non-interactive/headless** | shares `.bob/` config family; routes to backends like the IDE | A second host surface (CI) for the same artifacts | MEDIUM (config-sharing between IDE and BobShell not fully spelled out in docs — **flag**) |

### Critical primitive-gap findings (these shape the whole port)

- **No documented subagent / sub-task spawning API.** Bob has an *Orchestrator mode* that coordinates across modes, and modes "switch the entire AI context," but the docs do **not** expose a programmatic "spawn N parallel subagents with isolated context" primitive the way Claude Code's `Agent`/Task tool does. GSD leans on subagent fan-out (researchers, planners, executors, reviewers run as spawned agents). **Assumption (flagged):** v1 Bob port must run these as *inline sequential steps within one skill/command* (a single Bob context doing the work in order), OR via Orchestrator-mode handoffs — not true parallel subagents. This matches the PROJECT.md "parity-first; flag gaps" decision: skills that *require* parallel subagents get flagged, not faked.
- **No documented `AskUserQuestion` structured-prompt tool.** GSD's interactive gates use Claude's `AskUserQuestion`. Bob is a chat agent, so the equivalent is **conversational prompting** (ask in chat, wait for reply) — exactly the degradation gsd-core's converters already apply for other runtimes (`AskUserQuestion → "conversational prompting"` / `question`). Bob's `command`/`mcp`/chat model supports a "stop and ask" pattern. The brief lists `text_mode` fallback as *out of scope for v1*; conversational prompting is the natural Bob default and needs no `--text` flag plumbing.
- **`command` tool group = the load-bearing capability.** GSD's entire runtime-neutral core is a Node CLI (`gsd-tools.cjs`) invoked from shell. Bob's `command` tool group grants terminal execution, so a Bob mode/skill *can* shell out to `node .../gsd-tools.cjs ...`. **This is the keystone that makes the port viable** — without it, the descriptor-driven core couldn't run. Confidence HIGH that `command` exists; MEDIUM that it's unrestricted enough in default modes (may require Advanced Mode — see below).
- **Skills are "Advanced Mode only"** per one corroborating source. If true, GSD-as-skills implies users run GSD inside Advanced Mode (or a GSD custom mode that grants `skill`+`command`+`read`+`edit`). **Flag:** confirm during Phase 1 spike. This nudges the design toward shipping a **GSD custom mode** (grants the right tool groups) *plus* the commands/skills, so the GSD experience is self-contained.

---

## Part 2 — How gsd-core already abstracts runtimes (read from live source)

This is **not** assumed — it is read from `~/.claude/gsd-core/bin/lib/`. gsd-core's runtime layer is a **descriptor-driven, generated-registry** architecture. There is no `if (runtime === 'claude')` business logic; runtimes are data.

### The seam, end to end

```
RUNTIME-NEUTRAL SOURCE                      PER-RUNTIME DESCRIPTOR              EMITTED NATIVE ARTIFACTS
(authored once, Claude-flavored)            (data, in capability-registry)     (what the host loads)

  commands/gsd/*.md  ─┐                       runtimes[<id>].runtime = {          ~/.<runtime>/commands/…
  agents/*.md         ├─►  CONVERTER  ◄────── configHome  (dot-home | xdg | …)    ~/.<runtime>/skills/<name>/SKILL.md
  workflows/*.md      │    (per-family fn)    artifactLayout.global[] / .local[]  ~/.<runtime>/agents/…
  templates/*         ┘    e.g.               configFormat  (settings-json |       <runtime config>.toml / settings.json
                           convertClaude-     toml | markdown | none)
                           CommandTo<X>Skill  installSurface (settings-json |
                                              codex-toml | cline-rules | …)
                                              converter (name → conversion fn)
```

### The five abstraction mechanisms (each is a file in `bin/lib/`)

1. **`runtime-homes.cjs` — *where* artifacts go.** Resolves a runtime's global config dir from a `configHome` *descriptor* with four kinds: `dot-home` (e.g. `~/.codex`, env `CODEX_HOME`), `dot-home-nested` (e.g. `~/.gemini/antigravity`), `xdg` (`~/.config/<name>`), `generic-agents-root` (probe `~/.config/agents` then `~/.agents`). Env-var overrides per runtime. **A Bob descriptor is trivially `dot-home` (`~/.bob`, env `BOB_CONFIG_DIR`)** — confirmed by Bob using `~/.bob/`.

2. **`runtime-artifact-layout.cjs` — *what shape* artifacts take.** Reads `artifactLayout.global[]`/`.local[]` from the descriptor and maps each entry (`kind: commands|agents|skills|kimi-agents`) to a staging builder. Skills entries **require a converter**; commands/agents can be raw-copy or converted. Bob would declare `kind: skills, destSubpath: skills, converter: convertClaudeCommandToBobSkill` and `kind: commands, destSubpath: commands, converter: convertClaudeCommandToBobCommand`.

3. **`runtime-artifact-conversion.cjs` — the *emitter*.** ~60 converter functions, one family per runtime (`convertClaudeCommandToCodexSkill`, `…ToClineSkill`, `…ToCursorSkill`, `…ToCodebuddySkill`, etc.). Each rewrites GSD's Claude-flavored markdown into the target's flavor: remaps tool names (`AskUserQuestion → question`/`conversational prompting`), rewrites slash-command cross-references, adjusts frontmatter, injects an adapter header. **A Bob converter slots in here as `convertClaudeCommandToBobSkill` / `…ToBobCommand`** — and because Bob's SKILL.md == Anthropic Agent Skills, it can largely reuse the existing `convertClaudeCommandToClaudeSkill` logic with Bob-specific tool-name + path tweaks.

4. **`runtime-config-adapter-registry.cjs` — *install-phase config mutations*.** Per-runtime `installSurface` (`settings-json`, `codex-toml`, `cline-rules`, `cursor-hooks-json`, `copilot-instructions`, `profile-marker-only`) and `writesSharedSettings` / `permissionWriter` axes. Bob would add an install surface (e.g. `bob-modes-yaml` to write `custom_modes.yaml`, or reuse `profile-marker-only` if no config mutation is needed beyond dropping files).

5. **`runtime-name-policy.cjs` — *identity/aliases*.** Canonicalizes runtime names + aliases (`claude`→[claude, claude-code, claude-cli]). Bob adds `bob: ['bob', 'ibm-bob', 'bobshell']`.

### What stays runtime-neutral (the part Bob inherits for free)

- **`gsd-tools.cjs`** — the ~2,240-line CLI that *is* the GSD core logic (state, phases, roadmap, verify, init, templates, commits, research-plan seams). It is pure Node, host-agnostic. Runtimes invoke it via shell. Bob's `command` tool group runs it unchanged.
- **The `.planning/` artifact contract** — `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json`, phase dirs. These are produced/consumed by `gsd-tools.cjs`, not by the host. *This is exactly what keeps Bob and Claude interchangeable.*
- **`config.json`** carries the runtime-neutral switches: `mode: interactive`, `workflow.text_mode`, gates, parallelization. **Key observation:** `config.json` already has a `workflow.text_mode` flag and a `claude_md_path` field — i.e. instruction-file selection is *config-driven*, not hardcoded. A Bob install sets these appropriately (e.g. point instructions at `.bob/rules/`).
- **The launcher snippet** (`workflows/_runtime-launcher.snippet.sh`) is a long `if/elif` chain probing each runtime's `gsd-core/bin/gsd-tools.cjs` location. **Adding Bob = adding one `elif` branch** for `${BOB_CONFIG_DIR:-$HOME/.bob}/gsd-core/bin/gsd-tools.cjs`.

### Instruction-file selection (AGENTS.md vs CLAUDE.md)

gsd-core does not bake one filename in. Agent prompts say *"Read ./CLAUDE.md or ./.claude/CLAUDE.md … Check .claude/skills/ or .agents/skills/"* — i.e. it probes multiple conventions. `config.json.claude_md_path` is the configurable pointer. For Bob, the equivalent is **`.bob/rules/`** (auto-injected) — the Bob converter rewrites instruction-file references to the Bob convention, and the installer can drop a GSD rules file there.

---

## Part 3 — Proposed gsd-bob component boundaries

The package mirrors gsd-core's seam *as a standalone package first*, structured so each piece can later be lifted into gsd-core as the canonical Bob runtime.

### System overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  HOST: IBM Bob (IDE + BobShell)  — owns model routing (Claude/Mistral/ │
│                                     Granite); GSD never sees this       │
│   loads:  .bob/commands/*.md   .bob/skills/<n>/SKILL.md                 │
│           .bob/custom_modes.yaml   .bob/rules/   (~/.bob/* for global)  │
└───────────────▲────────────────────────────────────────────────────────┘
                │ Bob runs a GSD command/skill → its `command` tool group
                │ shells out to:  node …/gsd-core/bin/gsd-tools.cjs <cmd>
┌───────────────┴────────────────────────────────────────────────────────┐
│  ② BOB-NATIVE EMITTER / ADAPTER  (the only Bob-specific code)           │
│   • Bob runtime descriptor   (configHome=~/.bob, artifactLayout, …)     │
│   • Bob converters           (convertClaudeCommandToBob{Command,Skill}) │
│   • Bob install surface      (drop files + optional custom_modes.yaml)  │
│   • Bob launcher branch      (elif for ~/.bob/gsd-core/bin/…)           │
│   • Primitive-gap policy     (subagent→inline; AskUserQuestion→chat)    │
└───────────────▲────────────────────────────────────────────────────────┘
                │ wraps / re-publishes (gsd-core = source of truth)
┌───────────────┴────────────────────────────────────────────────────────┐
│  ① RUNTIME-NEUTRAL GSD CORE  (vendored/depended-on from gsd-core)       │
│   • gsd-tools.cjs + bin/lib/*  (state, phase, roadmap, verify, init)    │
│   • commands/gsd/*.md  agents/*.md  workflows/*.md  templates/*         │
│   • UNMODIFIED — Bob inherits all of this                              │
└───────────────▲────────────────────────────────────────────────────────┘
                │ produces / consumes
┌───────────────┴────────────────────────────────────────────────────────┐
│  ④ .planning/ ARTIFACT CONTRACT  (host-agnostic; the interop guarantee) │
│   PROJECT.md  REQUIREMENTS.md  ROADMAP.md  STATE.md  config.json  phases│
│   ← identical whether produced under Claude or Bob → interchangeable    │
└─────────────────────────────────────────────────────────────────────────┘
                ▲
┌───────────────┴────────────────────────────────────────────────────────┐
│  ③ INSTALLER  (npx/Node, local|global, clean|update)                    │
│   resolves ~/.bob | .bob → stages converted artifacts → writes config   │
│   → drops gsd-core/ runtime → registers launcher branch                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component responsibilities

| # | Component | Owns | Must NOT do |
|---|---|---|---|
| ① | **Runtime-neutral GSD core** | All planning logic (`gsd-tools.cjs`), the source artifacts, the `.planning/` schema. Sourced from gsd-core unmodified. | Know that Bob exists. No Bob branches here — that's what makes it upstreamable. |
| ② | **Bob emitter/adapter** | The Bob *descriptor* (homes, layout, name aliases), the Bob *converters* (markdown rewriting to `.bob/commands` + `.bob/skills`), the *primitive-gap policy* (subagent→inline, prompt→chat), the launcher branch. | Reimplement core logic. It only *translates and routes*. |
| ③ | **Installer** | One-line `npx` entry; scope (local `.bob/` vs global `~/.bob/`); modes (clean install / update / clean-uninstall); staging converted artifacts; writing the GSD custom mode + rules; dropping the `gsd-core/` runtime under `~/.bob/gsd-core/`. | Contain translation logic — it calls the emitter. |
| ④ | **`.planning/` contract** | The interop boundary. Same files, same `config.json` schema across hosts. | Drift from gsd-core's schema — divergence breaks Claude↔Bob interchangeability (the project's hard constraint). |

### Why this exact boundary (the upstream-contributability test)

The boundary is drawn so that **component ② is literally the set of files gsd-core would need to absorb to make Bob a first-class runtime**: one entry in `capabilities/bob/capability.json` (→ regenerates `capability-registry.cjs`), a `convertClaudeCommandToBob*` family appended to `runtime-artifact-conversion.cjs`, one `elif` in the launcher snippet, one alias line in `runtime-name-policy.cjs`. If the standalone package keeps ② as a clean descriptor+converter (and resists adding Bob `if`s into ①/③/④), the eventual upstream PR is a *move*, not a *rewrite*. **Design rule: every Bob-specific decision lives in ②, expressed in the same vocabulary gsd-core already uses (`configHome` kinds, `installSurface` enums, converter fns).**

---

## Data flow — a GSD command becomes a Bob invocation and yields `.planning/` artifacts

Trace of `/gsd-plan-phase` (representative of the core loop):

1. **User** types `/gsd-plan-phase 3` in Bob chat (IDE or BobShell). Bob resolves it to `.bob/commands/gsd-plan-phase.md` (emitted by ②).
2. The command body (converted GSD markdown) instructs Bob, running in the **GSD custom mode** (grants `command`,`read`,`edit`,`skill`), to execute the plan-phase workflow.
3. Bob's `command` tool group shells out via the **launcher snippet** → `node ~/.bob/gsd-core/bin/gsd-tools.cjs init plan-phase 3`. ① returns runtime-neutral JSON context (phase, requirements, state).
4. Where the GSD workflow would spawn a **planner subagent**, the **primitive-gap policy** (②) has rewritten it to an **inline sequential step** (or an Orchestrator-mode handoff): Bob itself does the planning work in-context. Where it would call `AskUserQuestion`, the converter emitted **conversational prompting** — Bob asks in chat and waits.
5. The workflow writes `phases/phase-3-*/PLAN.md` and calls `gsd-tools.cjs` to update `STATE.md`, `ROADMAP.md` progress, and commit — **all through ①**, writing the **④ `.planning/` contract** unchanged.
6. Result: the `.planning/` tree is byte-compatible with a Claude-produced one. A teammate on Claude Code can `/gsd-execute-phase 3` against the same repo. **Interchangeability achieved.**

The only Bob-specific things that happened: command/skill *file format* (②), *where* they live (②/③), and *how interactive prompts and subagents degrade* (②). The *logic and artifacts* were 100% ①/④.

---

## Suggested build order (dependencies between components/phases)

Ordered by hard dependency. Each phase is gated on the prior producing a verifiable artifact. Maps directly onto the PROJECT.md build order (Bob arch research → adapter design → installer → core-loop port → quality-gate port).

```
P0 Bob primitive spike ──► P1 Adapter/descriptor ──► P2 Installer ──► P3 Core-loop port ──► P4 Quality-gate port
   (resolve the 3 flags)     (emitter + converter)     (npx, scopes)     (new-proj→verify)     (review/debug/audit)
        │                          │                        │                   │                     │
        └ MUST exist first ────────┴── MUST exist before ───┴── before ─────────┴── before ───────────┘
```

| Phase | Builds | Depends on | Gate / exit artifact | Why this order |
|---|---|---|---|---|
| **P0 — Bob primitive spike** | A hand-written `.bob/commands/hello.md` + `.bob/skills/hello/SKILL.md` + a GSD custom mode that shells out to a stub `gsd-tools.cjs`. | Nothing (research done). | Confirmed answers to the 3 flags: (a) can a default/GSD mode run `command` shell-out, (b) is Advanced/skill access required, (c) does conversational prompting suffice for gates. BobShell config-sharing confirmed. | The whole adapter design hinges on these. Building the converter before confirming `command` works risks a wasted emitter. **Cheapest possible de-risk.** |
| **P1 — Adapter / descriptor + emitter** | Bob runtime descriptor (homes/layout/aliases) + `convertClaudeCommandToBob{Command,Skill}` + primitive-gap rewrites (subagent→inline, AskUserQuestion→chat) + launcher branch. | P0 (knows what Bob accepts). | A converted GSD command + skill that Bob loads and that successfully invokes `gsd-tools.cjs` against a real repo. | The emitter is the irreducible core of the package. Everything downstream packages or exercises it. |
| **P2 — Installer** | npx/Node installer: scope (local/global), modes (clean/update/clean-uninstall), stages emitter output, writes GSD mode + rules, drops `gsd-core/` runtime, registers launcher. | P1 (has something to stage). | `npx … --bob --local` and `--global` both produce a working `.bob/`/`~/.bob/` GSD install; `--update` is idempotent. | Can't install what the emitter hasn't produced. Mirrors gsd-core's installer surface so it's upstream-shaped. |
| **P3 — Core-loop port** | new-project, plan-phase, execute-phase, verify, progress — run end-to-end under Bob. | P2 (installable). | Full `.planning/` tree produced under Bob, byte-compatible with a Claude run; one phase planned + executed + verified. | This is the Core Value gate. Quality gates aren't useful until the loop runs. |
| **P4 — Quality-gate port** | review, debug, audit (daily-driver subset). Flag/skip skills needing primitives Bob lacks. | P3 (loop exists to gate). | Each ported gate runs natively; each skipped skill has an explicit flagged reason. | Parity-first: only port what Bob fully supports; the loop must exist first to apply gates to. |

**Cross-cutting constraint (applies to every phase):** keep all Bob-specific code inside component ② in gsd-core's own vocabulary, so the v1 standalone package can later be PR'd to gsd-core as a `capabilities/bob/` descriptor + converter family with no logic rewrite. Validate this each phase by asking *"could this file move into gsd-core unchanged?"*

---

## Architectural patterns to follow

### Pattern 1: Descriptor-over-branching (mirror gsd-core exactly)
**What:** Express Bob as *data* (a `configHome` kind, an `artifactLayout`, an `installSurface` enum, a named converter) — never as `if (runtime === 'bob')` inside core logic.
**When:** Always, for anything Bob-specific.
**Trade-off:** Slightly more ceremony up front; pays off as direct upstream-mergeability and zero core-logic divergence.

### Pattern 2: Converter reuse from the SKILL.md family
**What:** Bob's `SKILL.md` is the Anthropic Agent Skills format. Build `convertClaudeCommandToBobSkill` by adapting the existing `convertClaudeCommandToClaudeSkill` (path/tool-name deltas), not from scratch.
**When:** P1.
**Trade-off:** Coupling to gsd-core's converter internals — acceptable because gsd-core *is* the source of truth.

### Pattern 3: Primitive-gap as an explicit, centralized policy
**What:** All "Bob lacks primitive X" decisions (subagent→inline/Orchestrator, AskUserQuestion→chat, skill-needs-Advanced-Mode) live in one documented module in ②, each with a flag for skipped skills.
**When:** P1, enforced through P3/P4.
**Trade-off:** Some GSD skills are flagged/skipped in v1 — accepted by the "parity-first, flag gaps" decision.

## Anti-patterns to avoid

- **Forking gsd-core's core logic.** Re-implementing `gsd-tools.cjs` or the workflows for Bob destroys interchangeability and upstreamability. Vendor/depend, don't fork ①.
- **Faking parallel subagents.** Don't pretend Bob spawns isolated subagents if it can't — that produces silent fidelity loss. Flag and inline instead.
- **Branching on the model backend.** GSD must be agnostic to whether Bob routed to Claude/Mistral/Granite. Any backend-specific behavior violates the core design principle and the v1 scope.
- **Letting `.planning/`/`config.json` schema drift.** Any Bob-only field breaks Claude↔Bob interop — the hardest project constraint.

---

## Open seams to confirm during P0 (explicitly flagged)

| Seam | Status | How to confirm |
|---|---|---|
| Can a non-Advanced (or GSD custom) mode use the `command` tool group to shell out to `gsd-tools.cjs`? | MEDIUM — keystone assumption | P0 spike: GSD mode with `groups:[command,read,edit,skill]` runs `node`. |
| Are Skills gated to Advanced Mode? (affects whether GSD ships as skills, commands, or both) | MEDIUM | P0: load a `.bob/skills/*/SKILL.md` from a standard mode. |
| Does BobShell share the IDE's `.bob/` config (commands/skills/modes/mcp)? | MEDIUM — affects CI story | P0: run a `.bob/commands/*.md` via BobShell non-interactive. |
| Bob global path + env override (`~/.bob` confirmed; `BOB_CONFIG_DIR` assumed) | HIGH path / MEDIUM env name | P0: inspect Bob settings for an env override. |
| Bob's model-backend set (Gemini unconfirmed; Claude/Mistral/Granite per public sources) | N/A to design (backend is opaque) | Not needed — GSD never touches routing. |
| Mid-task interactive prompts ("stop and ask user") reliability in skills | MEDIUM | P0: a skill that asks a question mid-flow and waits. |

---

## Confidence assessment

| Area | Confidence | Basis |
|---|---|---|
| gsd-core runtime abstraction (descriptors, converters, installer surfaces, launcher) | **HIGH** | Read directly from `~/.claude/gsd-core/bin/lib/*.cjs` + registry dump |
| Bob extension primitives (commands/skills/modes/rules/mcp file formats + paths) | **HIGH** | bob.ibm.com/docs (custom-modes, slash-commands, skills, mcp) + 2 corroborating articles |
| Bob's `command` shell-out viability as GSD's keystone | **MEDIUM-HIGH** | `command` tool group documented; default-mode access + Advanced-Mode gating not fully confirmed → P0 spike |
| Subagent/`AskUserQuestion` gaps and chosen degradations | **MEDIUM-HIGH** | Gaps confirmed by absence in docs; degradation pattern proven in gsd-core's existing converters |
| BobShell ↔ IDE config sharing (CI story) | **MEDIUM** | Docs confirm headless BobShell but don't confirm shared `.bob/` config |

## Sources

- gsd-core live source: `~/.claude/gsd-core/bin/lib/{runtime-homes,runtime-artifact-layout,runtime-artifact-conversion,runtime-config-adapter-registry,runtime-name-policy,capability-registry}.cjs`, `bin/gsd-tools.cjs`, `workflows/_runtime-launcher.snippet.sh`, `templates/config.json`
- [IBM Bob](https://bob.ibm.com/) · [Docs home](https://bob.ibm.com/docs/ide) · [Custom modes](https://bob.ibm.com/docs/ide/configuration/custom-modes) · [Slash commands](https://bob.ibm.com/docs/ide/features/slash-commands) · [MCP in Bob](https://bob.ibm.com/docs/ide/configuration/mcp/mcp-in-bob) · [BobShell](https://bob.ibm.com/docs/shell)
- [Modes vs Skills (Garza Chequer)](https://medium.com/@victor.chequer/ibm-bob-modes-vs-skills-the-complete-guide-to-reliable-ai-assisted-development-c5d528ff4fac) · [Inception/custom Bob Mode (Airom)](https://alain-airom.medium.com/inception-mode-how-i-got-ibm-bob-to-build-his-own-custom-bob-mode-10c78925a861)
- [IBM launches Bob — multi-model routing (VentureBeat)](https://venturebeat.com/orchestration/ibm-launches-bob-with-multi-model-routing-and-human-checkpoints-to-turn-ai-coding-into-a-secure-production-system) · [The New Stack](https://thenewstack.io/ibm-bob-agentic-development/)
