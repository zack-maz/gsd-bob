# Project Research Summary

**Project:** gsd-bob — porting open-gsd (GSD) to IBM Bob
**Domain:** Cross-runtime adapter / CLI installer for a spec-driven AI planning framework
**Researched:** 2026-06-17
**Confidence:** MEDIUM-HIGH

## Executive Summary

gsd-bob is a runtime-adapter package that makes the GSD spec-driven planning framework — today a Claude Code skill/agent system — run natively inside IBM Bob, emitting the same `.planning/` artifact contract so the two runtimes stay interchangeable. The single most important research finding, confirmed across all four files, is that **this is fundamentally a mapping-and-packaging exercise, not a from-scratch translation.** gsd-core is already a descriptor-driven runtime-adapter framework (16 runtimes today, expressed as data, not `if (runtime===...)` logic), and IBM Bob is a Roo/Cline-family agent whose extension primitives — `.bob/commands/*.md` slash commands and `.bob/skills/<name>/SKILL.md` Agent Skills (the Anthropic Agent Skills format gsd-core already emits) — are nearly identical to formats gsd-core already produces for Cursor/Codex/Cline. Adding Bob upstream is, in the ideal case, five small artifacts: one runtime descriptor, two converter functions, one alias entry, one config-home mapping, and one launcher-snippet branch.

The recommended approach is to **mirror gsd-core's exact stack** (plain Node CommonJS, near-zero dependencies, descriptor-over-branching, `node:fs`/`path`/`os` built-ins only) so the standalone v1 package is upstream-mergeable by construction. The runtime-neutral GSD core (`gsd-tools.cjs` + the `.planning/` contract) is inherited unchanged and is the interchangeability guarantee; the only Bob-specific code is a thin emitter/adapter component. Node `>=22.15.0` satisfies both gsd-core (`>=22`) and BobShell (`>=22.15.0`).

The risk is concentrated and well-understood: two GSD primitives — **subagent spawning** (load-bearing for execute-phase parallelism and quality gates) and **structured prompts** (`AskUserQuestion`, used by 45+ workflows) — have **no documented Bob equivalent.** These are "documented-absent" (neither confirmed nor denied), so a cheap upfront Bob spike must resolve them empirically before the adapter is designed. The mitigations already exist in gsd-core: interactive prompts ride the existing `text_mode` seam (mandatory for Bob, not optional), and subagent-dependent skills are flagged/skipped under the project's parity-first strategy rather than faked on Bob's Orchestrator mode (which is in-session mode-switching, not isolated subagents).

## Key Findings

### Recommended Stack

Mirror gsd-core's stack exactly to maximize upstream-mergeability and minimize audit/security surface. The installer and staging path use only Node built-ins; no CLI framework, copy library, or YAML parser is needed for v1 (frontmatter is hand-sliced like every existing gsd-core converter). Ship standalone first by vendoring the GSD payload under `gsd-bob/gsd-core/`, with code structured so the eventual upstream PR is a *move*, not a *rewrite*.

**Core technologies:**
- **Node.js `>=22.15.0`**: installer + `gsd-tools.cjs` runtime — tighter of gsd-core's (`>=22`) and BobShell's (`>=22.15.0`) floors; one constraint covers both.
- **CommonJS (`.cjs`)**: module format — gsd-core ships CJS; ESM breaks verbatim shim-resolver reuse and the upstream-merge story. (Optionally TS-source → publish-CJS per gsd-core's ADR-457.)
- **npm + npx**: distribution — `npx -y --package=@opengsd/gsd-bob@latest -- gsd-bob --bob --<scope>`; identical zero-install UX to existing GSD users.
- **Node built-ins only** (`node:fs`/`path`/`os`/`child_process`): staging + home resolution — dependency-free install path. Do NOT depend on `@anthropic-ai/claude-agent-sdk` in the Bob path (violates backend-agnostic principle).

### Expected Features

The "features" are GSD's own capabilities the port must reproduce. v1 scope = core loop + quality gates + the subagents they spawn, plus a `bob`-aware installer. Every command composes three primitives: interactive prompt, subagent spawning, and the shell `gsd-tools.cjs` shim. The shim + `.planning/` contract are backend-agnostic and port cleanly (the foundation); the two host-specific primitives are where risk lives.

**Must have (table stakes):**
- Shim + launcher with a `bob` runtime branch — backend-agnostic foundation; nothing runs without `gsd_run query` (no `bob` branch exists today).
- `.planning/` artifact contract — identical templates so Claude↔Bob stay interchangeable.
- Core loop: `new-project`, `plan-phase` (+ transitive `discuss-phase`), `execute-phase` (+ `execute-plan`), `verify-work`/`verify-phase`, `progress`.
- Quality gates: `code-review` (+`--fix`), `debug`, `audit-fix`/`audit-milestone`/`audit-uat`.
- The ~9 subagent types the table-stakes commands spawn (executor, planner, plan-checker, phase-researcher, verifier, debugger, debug-session-manager, code-reviewer, code-fixer).
- Minimal `config.json` surface (`text_mode`, `parallelization`, `model_profile: inherit`).
- One-line npx installer (local/global scope, clean/update modes) mirroring gsd-core.

**Should have (competitive / v1.x):**
- Lifecycle cluster (`new-milestone`, `complete-milestone`, `transition`) — once a first milestone completes in Bob.
- Worktree-isolated parallelism — once Bob's spawning model is proven to support isolation + completion signals.
- Spec/MVP/UI/AI phase-shaping cluster — once users want richer phase contracts.

**Defer (v2+):**
- Autonomy cluster (`autonomous`, `manager`, `workstreams`) — until single-phase execution parity is rock-solid.
- Knowledge graph / mempalace / map-codebase (subagent-heavy, off the core loop) and cross-AI review.
- Full ~70-skill parity; the actual upstream PR to gsd-core.

### Architecture Approach

Four components with a deliberate boundary: all Bob-specific decisions live in one emitter/adapter component expressed in gsd-core's own vocabulary (configHome kinds, installSurface enums, named converters), so the standalone v1 can later be lifted into gsd-core unchanged. Data flow: a `/gsd-*` command resolves to a converted `.bob/commands/*.md` file; Bob's `command` tool group shells out via the launcher to `gsd-tools.cjs`, which does all logic and writes the byte-compatible `.planning/` tree. The keystone assumption is that Bob's `command` tool group can shell out to `node gsd-tools.cjs` — HIGH that it exists, MEDIUM whether default modes allow it (may require Advanced Mode or a shipped GSD custom mode).

**Major components:**
1. **Runtime-neutral GSD core** (`gsd-tools.cjs` + source artifacts) — all planning logic; inherited unmodified; must never know Bob exists.
2. **Bob emitter/adapter** (the only Bob-specific code) — descriptor (homes/layout/aliases), two converters (`convertClaudeCommandToBob{Command,Skill}`), primitive-gap policy (subagent→inline, AskUserQuestion→chat/text_mode), launcher branch.
3. **Installer** (npx/Node, local|global, clean|update) — resolves config home via env-overridable descriptor, stages converted artifacts, drops `gsd-core/` runtime, registers launcher branch.
4. **`.planning/` contract** — the host-agnostic interop boundary; schema must not drift.

### Critical Pitfalls

1. **Treating Bob's Orchestrator as a subagent spawner** — it is in-session mode-switching with no confirmed context isolation or boomerang return. Avoid: empirically probe isolation+returned-result in the spike; gate fan-out skills on a capability probe; flag/skip rather than fake.
2. **Porting `AskUserQuestion` as if Bob has a structured-prompt primitive** — none exists. Avoid: wire gsd-core's existing `text_mode` seam (mandatory for interactive skills on Bob, not deferred degradation); validate parsed answers before writing artifacts.
3. **Parity-first silently becoming "broken-first"** — skipped skills leaving dangling command files / roster references. Avoid: a flag-gap contract (absent from emitted set AND roster, or replaced by an explicit "unsupported on Bob: <reason>" stub); generate the manifest from the capability probe; install-time skip summary.
4. **Installer scope/home collision** — hardcoding `~/.bob` ignores env overrides; global writing project trees or vice versa. Avoid: reuse gsd-core's env-overridable home descriptors; print the resolved path; offer to gitignore local `.bob/`.
5. **Update/clean destroying user customizations** — especially the shared `custom_modes.yaml`. Avoid: port gsd-core's file-manifest pattern (only touch tracked files); never overwrite shared YAML — parse and idempotently replace only `gsd-*` entries.

(Also flagged: backend-agnostic drift, `.planning/` root-anchoring vs Bob's workspace root, runtime-detection false positives, upstream-rejection from divergence, and over-committing to under-documented Bob internals.)

## Implications for Roadmap

Based on research, the suggested phase structure follows hard dependencies — each phase gated on the prior producing a verifiable artifact. This maps directly onto PROJECT.md's build order.

### Phase 1: Bob Primitive Spike
**Rationale:** The whole adapter design hinges on three documented-absent primitives; building the converter before confirming them risks a wasted emitter. Cheapest possible de-risk.
**Delivers:** A hand-written `.bob/commands/hello.md` + `.bob/skills/hello/SKILL.md` + a GSD custom mode that shells out to a stub `gsd-tools.cjs`, plus answers to: (a) can a mode run `command` shell-out, (b) is skill access Advanced-Mode-gated, (c) does conversational prompting suffice for gates, (d) does BobShell share `.bob/` config, (e) Bob's config-home env-override + IDE-vs-Shell detection signal.
**Avoids:** Pitfalls 1, 2, 6, 10 (Orchestrator≠subagent, AskUserQuestion gap, detection false positives, over-committing to undocumented internals).

### Phase 2: Adapter Design + Emitter
**Rationale:** The emitter is the irreducible core of the package; everything downstream packages or exercises it. Must follow the spike.
**Delivers:** Bob runtime descriptor (homes/layout/aliases), `convertClaudeCommandToBob{Command,Skill}`, primitive-gap policy module, launcher branch — plus the flag-gap contract, root-anchoring contract, and a backend-neutrality lint.
**Uses:** gsd-core's descriptor/converter seams (reuse `convertClaudeCommandToClaudeSkill` as the basis since Bob SKILL.md == Anthropic Agent Skills).
**Implements:** Component 2 (Bob emitter/adapter).
**Avoids:** Pitfalls 3, 7, 8, 9 (flag-gap contract, root-anchoring, backend drift lint, seam-aligned-for-upstream design).

### Phase 3: Installer
**Rationale:** Can't install what the emitter hasn't produced; mirrors gsd-core's installer surface so it's upstream-shaped.
**Delivers:** npx/Node installer with local/global scope, clean/update/uninstall modes, env-overridable home resolution, file-manifest-scoped destructive ops, idempotent `custom_modes.yaml` merge, resolved-path printing.
**Uses:** gsd-core's `runtime-homes.cjs` descriptor pattern + `detect-custom-files`/manifest pattern.
**Avoids:** Pitfalls 4, 5 (scope collision, update/clean destroying customizations).

### Phase 4: Core-Loop Port
**Rationale:** The Core Value gate — quality gates aren't useful until the loop runs.
**Delivers:** `new-project`, `plan-phase`, `execute-phase`, `verify`, `progress` running end-to-end under Bob, producing a `.planning/` tree byte-compatible with a Claude run; one phase planned + executed + verified.
**Addresses:** Table-stakes core loop from FEATURES.md.
**Avoids:** Verifies Pitfalls 2 and 7 (text_mode answers are real; `.planning/` anchored at workspace root).

### Phase 5: Quality-Gate Port
**Rationale:** Parity-first — only port what Bob fully supports; the loop must exist first to apply gates to.
**Delivers:** `code-review`, `debug`, `audit-*` running natively; each skipped skill has an explicit flagged reason.
**Addresses:** Quality-gate table stakes; enforces the flag-gap contract.

### (Cross-cutting) Phase 6: Upstream-Prep
**Rationale:** Contribution-readiness is a stated goal; maintainers reject divergence and model-coupled code.
**Delivers:** Re-audited backend-neutrality, seam-registration verification, recorded targeted gsd-core version, naming/layout matching gsd-core conventions.

### Phase Ordering Rationale
- **Spike-first** because three load-bearing primitives are documented-absent; the converter and installer are wasted effort if the keystone (`command` shell-out, prompt/subagent behavior) doesn't hold.
- **Emitter before installer** because you can't stage what hasn't been produced; **installer before port** because the loop must be installable to exercise end-to-end.
- **Core loop before quality gates** because gates attach to a completed phase — the loop is the Core Value gate.
- Backend-neutrality, flag-gap, and root-anchoring contracts are established in Phase 2 and enforced through every later phase.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (spike):** Bob's primitives are documented-absent (subagent isolation, structured prompts, config-home env override, IDE-vs-Shell signal, BobShell config-sharing). This phase IS the research — empirical probes, not docs.
- **Phase 2 (adapter design):** converter internals of gsd-core's SKILL.md family and the precise primitive-gap rewrites warrant close reading of `runtime-artifact-conversion.cjs`.

Phases with standard patterns (skip research-phase):
- **Phase 3 (installer):** gsd-core's installer, home-resolution, and manifest patterns are read directly from live source — mirror, don't research.
- **Phases 4–5 (ports):** mechanics are well-understood once the spike resolves; the work is translation against a known contract.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against live `~/.claude/gsd-core/` v1.5.0 source + npm registry; BobShell Node floor from official docs. |
| Features | HIGH | Enumeration grounded in live gsd-core source (74 workflows, 12 core subagents, primitive grep counts). |
| Architecture | HIGH (gsd-core) / MEDIUM-HIGH (Bob) | gsd-core abstraction read from source; Bob extension model from official docs, a few seams flagged. |
| Pitfalls | MEDIUM-HIGH | Installer hazards grounded in gsd-core source; key Bob primitives are "documented-absent" (research tasks, not settled facts). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Subagent isolation in Bob:** unconfirmed (Orchestrator is probably in-session). Handle: empirical probe in Phase 1; gate fan-out skills on a capability probe; flag/skip if absent.
- **Structured-prompt primitive:** none documented. Handle: wire `text_mode` in Phase 2/4; validate parsed answers.
- **`command` shell-out in default modes:** keystone; HIGH it exists, MEDIUM whether Advanced Mode is required. Handle: Phase 1 spike; ship a GSD custom mode granting `command`+`read`+`edit`+`skill` if needed.
- **Bob config-home env-override name** (`BOB_CONFIG_DIR` assumed) and **IDE-vs-Shell detection signal:** unconfirmed. Handle: Phase 1 inspection; descriptor drops the env override if none exists; require a positive Bob-specific signal + `--runtime`/`--config-dir` overrides.
- **BobShell ↔ IDE `.bob/` config sharing** (CI story): unconfirmed. Handle: Phase 1 non-interactive BobShell test.
- **Skill→command / skill→skill invocation** (GSD workflows chain skills): unverified. Handle: spike-test; flag any GSD skill depending on it.

## Sources

### Primary (HIGH confidence)
- Live source `~/.claude/gsd-core/` v1.5.0 — `bin/lib/{runtime-homes,runtime-artifact-conversion,runtime-config-adapter-registry,runtime-name-policy,capability-registry,package-identity}.cjs`, `bin/gsd-tools.cjs` (`detect-custom-files`/manifest, `--cwd` root resolution), `bin/install.js`, `workflows/*.md` (74 recipes + `execute-phase.md` 12-type registry), `workflows/_runtime-launcher.snippet.sh` (no `bob` branch — confirmed), `templates/config.json`.
- npm registry `@opengsd/gsd-core` — version `1.5.0`, `bin`, `engines` (node `>=22`, npm `>=10`), deps.
- IBM Bob docs (bob.ibm.com) — Skills (`.bob/skills`, `SKILL.md` `name`+`description`), Slash commands (`.bob/commands`, `description`+`argument-hint`, `$1/$2`), Custom modes (`custom_modes.yaml`), Rules (`.bobrules`/`.bob/rules/`), MCP, BobShell (Node `>=22.15.0`, `--auth-method api-key`).

### Secondary (MEDIUM confidence)
- VentureBeat / IBM newsroom / The New Stack — Bob multi-model routing (Claude/Mistral/Granite, not Gemini), GA April 2026, human checkpoints.
- Medium write-ups (Garza Chequer "Modes vs Skills", Airom "custom Bob Mode") — Bob extension behavior corroboration; Skills possibly "Advanced Mode only".

### Tertiary (LOW confidence — needs validation)
- Bob subagent/Orchestrator isolation semantics — documented-absent; probe in Phase 1.
- `BOB_CONFIG_DIR` env-override name and exact IDE-vs-Shell detection signal — assumed; confirm in Phase 1.

---
*Research completed: 2026-06-17*
*Ready for roadmap: yes*
