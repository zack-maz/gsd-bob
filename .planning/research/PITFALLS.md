# Pitfalls Research

**Domain:** Porting a Claude-Code-native skill/agent framework (open-gsd) to IBM Bob via a standalone, upstream-contributable adapter, with a cross-runtime npx installer
**Researched:** 2026-06-17
**Confidence:** MEDIUM-HIGH

> **Grounding note.** Bob facts come from official docs at `bob.ibm.com/docs` (custom modes, custom rules, slash commands, install, modes) and the IBM/VentureBeat launch coverage — HIGH confidence on what is *documented*, but several primitives (subagent isolation, structured prompts, scope semantics) are **documented-absent**, i.e. the docs neither confirm nor deny them. Treat "documented-absent" as a research task for Phase 1, not a settled fact. Installer hazards are grounded in the actual gsd-core `gsd-tools.cjs` and its `bin/lib/` modules (`runtime-homes.cjs`, `runtime-name-policy.cjs`, `config-loader.cjs`), which this adapter mirrors.

## Key Bob findings that drive these pitfalls

| GSD primitive | Bob equivalent (from docs) | Verdict |
|---|---|---|
| Slash command / skill | Markdown files in `.bob/commands/` or `~/.bob/commands/` | **Clean parity** |
| Custom mode/persona | `custom_modes.yaml` (`slug`, `roleDefinition`, `groups`, `whenToUse`, `customInstructions`) — Roo/Cline-shaped | **Clean parity** |
| Always-on rules | `.bobrules` / `.bob/rules/` (global `~/.bob/rules/` + workspace) | **Clean parity** |
| Tool extension | MCP servers | **Parity (for the `gsd-tools` CLI seam)** |
| `AskUserQuestion` (structured multiple-choice prompt) | **None documented** — interaction is conversational; "Checkpointing" exists but is approval-style | **GAP** |
| Subagent / Task spawning (isolated context window, returns result) | Orchestrator mode "delegates to specialized modes" — docs do **not** confirm isolated context or boomerang return; reads as in-session mode switching | **GAP (probable)** |

These two gaps (`AskUserQuestion`, real subagents) are the load-bearing risk for the whole port. Everything below orbits them.

---

## Critical Pitfalls

### Pitfall 1: Treating Bob's Orchestrator mode as a subagent-spawning primitive

**What goes wrong:**
GSD's core loop leans on Claude Code subagents — separate context windows that do work and return a structured result (researchers, planners, executors run in parallel, each isolated). The team sees Bob's Orchestrator mode "delegating to specialized modes" and assumes it is the same primitive. It is not: Bob's docs describe Orchestrator as **switching modes within one session**, with no confirmed context isolation and no confirmed boomerang return value. Ported skills that assume "spawn N isolated agents, collect N results" silently run as one long single-context conversation. The failure mode is not a crash — it is context-window exhaustion, cross-task bleed (one task's output poisons the next), and loss of the parallelism that makes `execute-phase` and the research fan-out tractable.

**Why it happens:**
The vocabulary collides. "Orchestrator," "delegate," "subtask," and "mode" all *sound* like Claude's Agent/Task tooling, so the gap is invisible until runtime. Bob's docs are documented-absent on isolation, which reads as "probably fine" under deadline pressure.

**How to avoid:**
- In Phase 1 (Bob research), make "Does Orchestrator give isolated context + a returned result?" a **must-answer, must-prove** question — verify empirically (run a delegation, inspect whether the parent sees only a summary or the full child transcript), not from docs alone.
- Build a single **subagent-capability probe** the adapter consults (mirror gsd-core's capability descriptors). Skills that require true isolation are gated on it.
- Under parity-first, if isolation is unconfirmed, **flag/skip** subagent-dependent skills for v1 rather than emit them and hope.
- Keep the core loop's fan-out points behind one abstraction so a future "Bob subagent" capability can light them up without rewriting skills.

**Warning signs:**
- A ported `execute-phase`/research step produces correct output once but degrades over a long run (later tasks reference earlier unrelated tasks).
- Token/context warnings on workflows that were comfortably parallel in Claude Code.
- Docs/spec say "delegates" but you cannot point to where the child's result is returned to the parent as data.

**Phase to address:** Phase 1 (Bob research) — capability probe; Phase 3/4 (core-loop port) — gate fan-out skills on the probe.

---

### Pitfall 2: Porting `AskUserQuestion` flows as if Bob has a structured-prompt primitive

**What goes wrong:**
GSD's interactive skills (`new-project`, `discuss-phase`, config) depend on `AskUserQuestion` — a structured, multiple-choice, single-turn prompt the runtime renders and whose selection it returns deterministically. Bob has **no documented equivalent**: interaction is free-form conversational, plus an approval-style "Checkpointing." If skills are ported assuming the structured primitive exists, they either (a) reference a tool Bob can't render and stall, or (b) emit a wall of "please answer questions 1–7" text the model then mis-parses, producing malformed answers that corrupt downstream `.planning/` artifacts.

**Why it happens:**
`AskUserQuestion` is so woven into GSD's interactive skills that it reads as ambient, not as a runtime capability that must be re-provisioned. gsd-core already has a `workflow.text_mode` toggle for exactly this — easy to forget it exists and must be wired for Bob.

**How to avoid:**
- Reuse gsd-core's existing seam: Bob is a `text_mode: true` runtime. The interactive skills already have a text-mode path; the adapter's job is to **set that flag and verify the text-mode prompts are coherent**, not invent a new mechanism.
- **Important strategy nuance:** PROJECT.md lists "text-mode graceful degradation" as *deferred* (parity-first chosen). For *structured subagent gaps* that is right — flag/skip. But for `AskUserQuestion`, text-mode is not a degraded fallback to defer; it is **the only way an interactive skill can run at all on Bob**. Conflating the two strategies risks shipping a `new-project` that cannot ask anything. Decide explicitly per-skill: interactive skills MUST use text_mode now; subagent-dependent skills MAY be flagged/skipped.
- For each ported interactive skill, encode the question set as numbered, machine-checkable text and validate the parsed answers before writing artifacts.

**Warning signs:**
- A ported `new-project` or `discuss-phase` "completes" but writes a PROJECT.md with placeholder/garbled answers.
- The mode emits a tool call or token referencing a question UI that never appears.
- Free-text answers map to the wrong fields downstream.

**Phase to address:** Phase 1 (confirm no structured-prompt primitive) + Phase 3 (core-loop port) — wire `text_mode`, validate parsed answers.

---

### Pitfall 3: Parity-first silently becoming "broken-first" — flagged skills that look installed

**What goes wrong:**
The chosen v1 strategy is "parity-first; flag gaps rather than degrade." The hazard is the **flag being invisible**. A skill whose primitive Bob lacks gets skipped, but its slash-command file is still present in `.bob/commands/`, or it appears in a roster, or its name is referenced by another skill. The user types `/gsd-<skill>` and gets a confusing no-op or a half-run, instead of a clear "not supported on Bob (reason)." Parity-first only works if the gap is *loud*.

**Why it happens:**
Skipping at the catalog/translation layer (don't emit the file) and skipping at the user-facing layer (emit a stub that explains itself) are different jobs; doing only the first leaves dangling references, doing only the second leaves dead commands. gsd-core's command roster and cluster/surface machinery make it easy to half-skip.

**How to avoid:**
- Define the flag-gap contract in Phase 2 (adapter design): a skipped skill is (a) absent from the emitted command set AND (b) absent from any roster/cluster the adapter generates AND (c) if discoverable, replaced by an explicit "unsupported on Bob: <reason>" stub.
- Generate the supported/unsupported manifest from the **capability probe**, not a hand-maintained list (hand lists drift from reality).
- Add an install-time summary: "Installed N skills; skipped M (reasons)."

**Warning signs:**
- `/`-menu shows a GSD command that errors or does nothing.
- A supported skill calls a skipped one by name.
- "Supported skills" list is maintained by hand in a markdown file.

**Phase to address:** Phase 2 (adapter design) — flag-gap contract; every port phase enforces it.

---

### Pitfall 4: Installer scope collision — local vs global writing to the wrong `~/.bob` / project tree

**What goes wrong:**
The installer mirrors gsd-core's npx flow with local vs global scope. Bob's own layout has **both** a global home (`~/.bob/commands/`, `~/.bob/rules/`, `~/.bob/custom_modes.yaml`) and a project layout (`.bob/commands/`, `.bob/rules/`, `.bob/custom_modes.yaml`). The hazard: a global install writes GSD commands into `~/.bob/` for *every* project, or a local install pollutes the repo's `.bob/` and gets committed. Worse, gsd-core resolves config homes via env-overridable descriptors (`runtime-homes.cjs`) and `--config-dir`; a Bob adapter that hardcodes `~/.bob` ignores a user's `BOB_CONFIG_DIR`-style override and writes to the wrong home, so the install "succeeds" but Bob never sees the files.

**Why it happens:**
Two scope dimensions (install scope × Bob's global/project layout) multiply into four cases, and the env-override path is invisible until a user with a custom home reports "installed but nothing shows up." gsd-core solves this with descriptor-based home resolution; a from-scratch Bob installer that skips that pattern reintroduces the bug.

**How to avoid:**
- In Phase 5 (installer), reuse gsd-core's home-resolution pattern: resolve Bob's config home through an env-overridable descriptor (honor any `BOB_*` config-dir env var and a `--config-dir` flag) rather than a literal `~/.bob`.
- Make scope explicit and confirmed: global → `~/.bob/`, local → `<project>/.bob/`. Never write project files during a global install or vice versa.
- For local installs, detect and offer to gitignore `.bob/` GSD artifacts so they aren't accidentally committed.
- Print the exact resolved target path before writing.

**Warning signs:**
- "Install succeeded but `/gsd-*` commands don't appear in Bob."
- GSD command files showing up in unrelated repos' `.bob/`.
- A user with a relocated Bob home reports nothing works.

**Phase to address:** Phase 5 (installer) — scope + home-resolution; Phase 1 confirms Bob's exact config-home env-override behavior.

---

### Pitfall 5: Update/clean modes destroying user customizations under managed directories

**What goes wrong:**
The installer ships clean and update modes. GSD writes into directories Bob *also* lets users customize (`.bob/commands/`, `.bob/rules/`, `custom_modes.yaml` entries). A naive `clean` (`rm -rf` the GSD subtree) or a naive `update` (overwrite all managed files) wipes user-authored commands, rules, or custom-mode entries that live alongside GSD's. `custom_modes.yaml` is especially dangerous: it is a **shared single file** (user modes + GSD modes in one YAML), so blind overwrite deletes user modes; blind append duplicates GSD modes on every update.

**Why it happens:**
gsd-core solved this with a **file manifest** (`detect-custom-files` walks managed dirs against `gsd-file-manifest.json` and preserves anything not tracked — see `gsd-tools.cjs` `detect-custom-files` / `saveLocalPatches`). A Bob installer built fresh tends to skip the manifest and treat the whole GSD subtree as disposable. Shared-file formats (one YAML for all modes) break the "GSD owns a subtree" assumption the manifest relies on.

**How to avoid:**
- Phase 5: port gsd-core's manifest pattern — every GSD-emitted file is tracked; `update` only touches tracked files; `clean` only removes tracked files; anything untracked under a managed dir is preserved and reported.
- For the shared `custom_modes.yaml`, **never overwrite the file** — parse it, replace only GSD-namespaced entries (e.g. `gsd-*` slugs), preserve user entries, and make GSD-entry replacement idempotent (no duplicate-on-update).
- Back up before destructive ops; dry-run by default for `clean`.

**Warning signs:**
- A user reports their custom mode/command vanished after `update`.
- `custom_modes.yaml` accumulates duplicate `gsd-*` entries across updates.
- `clean` removes files the installer didn't create.

**Phase to address:** Phase 5 (installer modes) — manifest + idempotent YAML merge.

---

### Pitfall 6: Runtime-detection false positives — installing into the wrong host or a look-alike

**What goes wrong:**
gsd-core detects runtimes by probing config homes and canonicalizing aliases (`runtime-name-policy.cjs`, `runtime-homes.cjs`), and its docs already record look-alike traps (e.g. **Trae IDE vs trae-agent** are different products sharing a name; Kimi resolves a generic `~/.config/agents/skills`). "Bob" is a *very* common name and IBM Bob is new — a detector that keys on the bare string `bob`, or that assumes `~/.bob` always means IBM Bob Shell, can install into an unrelated tool's directory or claim Bob is present when only the IDE (not the Shell) is installed. The launch coverage also shows Bob has **IDE and Shell** as distinct surfaces with overlapping config — detecting "Bob" without disambiguating IDE vs Shell installs commands the active surface won't load.

**Why it happens:**
Name collisions and multi-surface products are exactly the class of bug gsd-core already hit and documented. A fresh detector re-learns it the hard way. "Probe for `~/.bob`" feels sufficient until a non-IBM tool or a different Bob surface owns that path.

**How to avoid:**
- Phase 1: pin down Bob Shell's *authoritative* detection signal (a specific binary, version string, or a file unique to Bob Shell — not just `~/.bob` existence) and disambiguate IDE vs Shell.
- Reuse gsd-core's alias-canonicalization approach; require a positive Bob-specific signal, not a substring match.
- Make detection overridable (`--runtime bob`, env var) so a mis-detect is always recoverable by the user.
- Refuse to write if the detected target is ambiguous; ask rather than guess.

**Warning signs:**
- Installer reports "Bob detected" on a machine without Bob Shell.
- Commands install but the user's Bob surface (IDE vs Shell) doesn't see them.
- Detection relies on a bare `~/.bob` existence check.

**Phase to address:** Phase 1 (Bob research) — authoritative signal; Phase 5 (installer) — detection + override.

---

### Pitfall 7: Nesting `.git` / `.planning` incorrectly relative to Bob's project root

**What goes wrong:**
GSD's artifact contract is a `.planning/` tree at the project root, resolved via worktree/monorepo logic in `gsd-tools.cjs` (it walks up to find `.planning`, handles linked worktrees, respects monorepo sub-repos). Bob has its **own** notion of project/workspace root (`.bob/` at workspace root). If the adapter resolves the project root differently from how Bob resolves *its* workspace, `.planning/` lands in a different directory than `.bob/` — so GSD commands run from Bob can't find their own state, or create a second nested `.planning/` inside a subdir. The classic failure: installer or a command initializes `.planning/` in the cwd Bob happens to launch from (which may be a subdir or a worktree), not the repo root, fragmenting state across runs.

**Why it happens:**
Two root-resolution algorithms (GSD's `.planning` walk vs Bob's workspace concept) are assumed to agree and don't, especially in monorepos and git worktrees — a case gsd-tools.cjs already handles with care but a Bob bridge can re-break by passing the wrong cwd.

**How to avoid:**
- Phase 1/2: determine how Bob defines workspace root and **anchor `.planning/` resolution to the same root** (e.g. co-locate `.planning/` with `.bob/`, or pass Bob's resolved workspace path into `gsd-tools --cwd`).
- Reuse `gsd-tools.cjs`'s existing worktree/monorepo root resolution rather than reimplementing a root walk in the Bob bridge.
- Add a guard: if a command would create a second `.planning/` nested under an existing one, refuse and point to the existing root.
- Never auto-`git init`; respect the existing repo boundary.

**Warning signs:**
- A second `.planning/` appears in a subdirectory.
- State "resets" depending on which directory Bob was launched from.
- `.planning/` and `.bob/` live in different directories.

**Phase to address:** Phase 2 (adapter design) — root-anchoring contract; verified in Phase 3 core-loop port.

---

### Pitfall 8: Backend-agnostic drift — the core branching on which model Bob routed to

**What goes wrong:**
The design principle is "core shouldn't branch on the model backend; emit Bob-native artifacts and let Bob route." Drift creeps in subtly: a ported skill says "if Claude, do X" because Bob *can* route to Claude; prompts get tuned for Claude's tool-call style; a researcher relies on Anthropic-specific MCP tool names; defaults assume Claude context-window sizes. Because Bob multiplexes Claude + Mistral + Granite **per-task and invisibly**, any such branch produces nondeterministic behavior — the same GSD command behaves differently run-to-run depending on Bob's routing, which is unobservable to the user and undebuggable.

**Why it happens:**
GSD's source is Claude-Code-native, so Claude-shaped assumptions are the path of least resistance during translation. And it's tempting to "optimize" for Claude since Bob often routes complex tasks there. The branch feels harmless because it's "just a fallback."

**How to avoid:**
- Phase 2: write the backend-neutrality rule into the adapter's design contract and into a CI/lint check — grep emitted artifacts and bridge code for model-name strings (`claude`, `anthropic`, `gemini`, `granite`, `mistral`, model IDs) and fail on them in core paths.
- Express capabilities by **Bob capability** (does Bob support primitive X) not by **model** (is the backend Claude). The capability probe is the only legitimate branch.
- Don't resolve concrete model IDs in the core; let Bob own routing. (gsd-core has `resolve_model_ids` — for Bob this should stay off / Bob-owned.)
- Phase 6 (upstream-prep) re-audits for neutrality since maintainers will reject model-coupled code.

**Warning signs:**
- Any `if (backend === 'claude')` or model-name literal in core/emitted artifacts.
- A GSD command behaves differently across runs for the same input.
- Prompts reference Anthropic-specific tool semantics.

**Phase to address:** Phase 2 (design contract + lint) — enforced continuously; re-audited Phase 6.

---

### Pitfall 9: Upstream-rejection — divergence from gsd-core conventions, duplicated logic, version skew

**What goes wrong:**
The adapter is meant to be contribution-ready as a first-class Bob runtime in gsd-core. Three ways it gets rejected: (1) **Divergence** — it invents its own translation/config-home/capability patterns instead of plugging into gsd-core's existing seams (`runtime-homes.cjs` descriptors, `runtime-name-policy.cjs` aliases, capability registry, `text_mode`), so a maintainer sees a parallel system to maintain. (2) **Duplicated logic** — it copy-pastes installer/manifest/root-resolution code from `gsd-tools.cjs` into a fork that immediately drifts. (3) **Version skew** — gsd-core is the source of truth and evolves; an adapter pinned to a snapshot of its skills/templates silently falls behind, and the PR arrives built against a stale gsd-core.

**Why it happens:**
Standalone-first (the chosen v1 path) optimizes for shipping without coordinating with maintainers, which is correct for speed but actively *invites* divergence and duplication — the very things review rejects. The seams to plug into aren't obvious without reading gsd-core internals closely.

**How to avoid:**
- Phase 1/2: explicitly inventory gsd-core's runtime-extension seams (config-home descriptors, alias policy, capability registry, `text_mode`, runtime-slash/runtime-artifact-layout, file manifest) and design the Bob runtime to **register into them** rather than beside them. Even standalone, structure the code so "becoming a gsd-core runtime" is adding a descriptor, not a rewrite.
- Don't fork installer logic — depend on / mirror gsd-core's modules in a way that a future PR can collapse to a thin Bob descriptor.
- Track the exact gsd-core version the adapter targets; build/test against current gsd-core, not a frozen copy. Treat gsd-core skills/templates as upstream inputs, not vendored snapshots.
- Phase 6 (upstream-prep): match naming, file layout, and contribution conventions; open a design issue early so the eventual PR isn't a surprise.

**Warning signs:**
- The adapter has its own runtime registry / config-home logic parallel to gsd-core's.
- Installer code is a copy of `gsd-tools.cjs` chunks, already edited.
- "Built against gsd-core vX" where X is months behind `main`.
- A maintainer would have to learn a second mental model to review it.

**Phase to address:** Phase 2 (seam-aligned design) and Phase 6 (upstream-prep) — primarily; version-skew guard is continuous.

---

### Pitfall 10: Over-committing to under-documented / unstable Bob internals

**What goes wrong:**
IBM Bob is brand-new (GA April 2026, fast-moving changelog) and several primitives this port depends on are **documented-absent** (subagent isolation, structured prompts, exact config-home env-override, IDE-vs-Shell detection signal). Building the translation design on assumptions about these — or on undocumented behavior discovered by experiment that IBM may change — produces an adapter that breaks on the next Bob release. The worst case: the whole subagent strategy is built on an Orchestrator behavior that was incidental and gets changed.

**Why it happens:**
A new enterprise tool's docs lag its behavior; experimentation fills the gap; experimental findings get baked in as load-bearing assumptions without being marked as fragile.

**How to avoid:**
- Phase 1: separate **documented/stable** Bob facts from **observed/undocumented** ones, and confine the v1 design to documented-stable primitives (modes, `.bob/commands/*.md`, `.bobrules`, MCP, slash commands, YAML/JSON config). These are well-documented and low-risk; build the port on them.
- Treat anything observed-but-undocumented (Orchestrator isolation, hidden prompt mechanisms) as **probe-gated and flaggable**, never as a foundation — consistent with parity-first.
- Pin and record the Bob version researched; re-verify probes on Bob upgrades (mirror gsd-core's drift-guard mindset).
- Prefer the most standard, slowest-moving surfaces (markdown commands + rules) over the newest (Orchestrator delegation internals).

**Warning signs:**
- The design doc cites a Bob behavior with no doc URL.
- A core decision rests on Orchestrator's internal delegation semantics.
- No record of which Bob version was researched.

**Phase to address:** Phase 1 (Bob research) — stable/unstable split; every later phase respects it.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `~/.bob` instead of env-overridable home descriptor | Faster installer | Breaks relocated homes; diverges from gsd-core → upstream rejection | Never (cheap to do right by reusing `runtime-homes` pattern) |
| Skip the file manifest; treat GSD subtree as disposable on clean/update | Simpler installer modes | Destroys user customizations; shared `custom_modes.yaml` data loss | Never |
| Copy-paste `gsd-tools.cjs` installer chunks into a fork | Ship standalone fast | Immediate drift → version skew → upstream rejection | Only with an explicit plan to collapse to a descriptor before PR |
| Emit skipped-skill command files anyway (no flag-gap contract) | Roster looks complete | Dead/no-op commands, confused users — defeats parity-first | Never |
| Port AskUserQuestion skills without wiring `text_mode` | Looks ported | Interactive skills can't actually ask; corrupt artifacts | Never (text_mode is mandatory for these, not optional degradation) |
| Tune prompts for Claude because Bob "usually routes there" | Better one-off results | Backend drift; nondeterministic per-routing behavior; upstream rejection | Never |
| Build subagent strategy on Orchestrator's observed delegation | Unlocks fan-out now | Breaks on Bob upgrade; undocumented foundation | Only as a probe-gated, flaggable experiment |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Bob `custom_modes.yaml` (shared file) | Overwrite whole file on update | Parse, replace only `gsd-*` entries idempotently, preserve user modes |
| Bob `.bob/commands/` | Assume global install = per-project commands | Honor scope: global→`~/.bob/`, local→`<proj>/.bob/`; print resolved path |
| Bob config home | Probe bare `~/.bob` existence to detect Bob | Require a Bob-Shell-specific signal; honor config-dir env override; disambiguate IDE vs Shell |
| Bob Orchestrator | Treat as isolated-context subagent spawner | Probe empirically; gate fan-out skills on confirmed isolation; else flag/skip |
| Bob interaction | Call a structured `AskUserQuestion`-style primitive | None exists — run interactive skills via `text_mode` with validated parsed answers |
| Bob MCP | Expose `gsd-tools` as model-specific tools | Keep the CLI seam backend-neutral; one MCP/CLI surface for all routed models |
| gsd-core source of truth | Vendor a snapshot of skills/templates | Treat gsd-core as live upstream input; track targeted version; test against current |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No real subagent isolation → single-context fan-out | Long runs degrade; cross-task bleed; context warnings | Gate parallel skills on isolation probe; flag/skip if absent | As soon as a workflow that was parallel in Claude (execute-phase, research fan-out) runs end-to-end on Bob |
| `custom_modes.yaml` duplicate-append on every update | YAML grows; mode selector clutters; parse slows | Idempotent merge keyed on `gsd-*` slug | After a few `update` cycles |
| Re-walking project root in the bridge instead of reusing gsd-tools | Wrong `.planning/` root in monorepos/worktrees | Reuse `gsd-tools.cjs` root resolution; pass `--cwd` | In monorepos and git worktrees |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `clean`/`update` deletes outside the GSD-managed file set | User data loss in shared `.bob/` dirs | Manifest-scoped destructive ops; dry-run default for clean; backup |
| Trusting `~/.bob` ownership without a Bob-specific signal | Writing GSD files into an unrelated tool's directory (name collision) | Positive Bob-Shell detection; refuse on ambiguity |
| npx installer runs with broad FS reach, hardcoded paths | Writing to unexpected homes; clobbering across projects | Resolve targets via descriptors; print path; confirm scope before write |
| Emitting model-name/credential assumptions in artifacts | Backend coupling; leaking routing assumptions | Backend-neutral lint; no model IDs/keys in core or emitted files |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent skill skip (no stub, dangling references) | `/gsd-x` no-ops; confusion | Explicit "unsupported on Bob: <reason>" stub + install summary |
| Interactive skill dumps unparseable question wall | Garbled answers → corrupt PROJECT.md | text_mode numbered questions + answer validation before write |
| Install "succeeds" but commands invisible | User thinks it's broken | Detect IDE-vs-Shell surface; print resolved target; verify discovery |
| Scope ambiguity (global vs local) unannounced | Repo pollution or missing commands | Prompt/confirm scope; print exactly what was written where |

## "Looks Done But Isn't" Checklist

- [ ] **Subagent fan-out:** Ran once — verify it survives a *long* end-to-end run without cross-task context bleed.
- [ ] **Interactive skill:** "Completes" — verify the written PROJECT.md/SPEC fields are real answers, not placeholders, under `text_mode`.
- [ ] **Flag-gap:** Supported-skill list looks full — verify skipped skills are absent from the roster AND have no dangling references AND show an explicit stub.
- [ ] **Installer update:** Re-ran update — verify user-authored commands/rules/modes still present and `custom_modes.yaml` has no duplicate `gsd-*` entries.
- [ ] **Scope:** Global install done — verify nothing landed in the current repo's `.bob/`, and vice versa.
- [ ] **Root anchoring:** `.planning/` created — verify it sits at Bob's workspace root next to `.bob/`, not in a launch-cwd subdir; no nested second `.planning/`.
- [ ] **Backend neutrality:** Skills run — grep core + emitted artifacts for model-name literals; confirm none.
- [ ] **Upstream-readiness:** Adapter "works" — verify it registers into gsd-core seams (descriptors/aliases/capabilities), not beside them, and records the targeted gsd-core version.
- [ ] **Detection:** "Bob detected" — verify it's IBM Bob Shell specifically (not a name-collision tool, not IDE-only).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Subagent assumption wrong (built fan-out on Orchestrator) | HIGH | Gate behind capability probe; demote affected skills to flagged/skipped; rework fan-out abstraction |
| `custom_modes.yaml` overwritten user data | HIGH | Restore from backup if taken; else manual recovery — motivates manifest+merge upfront |
| Backend drift shipped | MEDIUM | Lint-driven sweep for model literals; replace model-branches with capability checks |
| Wrong `.planning/` root proliferated | MEDIUM | Consolidate to workspace root; add nested-root guard; migrate state |
| Standalone forked installer drifted from gsd-core | MEDIUM-HIGH | Refactor to descriptor/seam registration before PR; re-sync to current gsd-core |
| Detection false-positive install | LOW | `--runtime`/env override; uninstall via manifest; add positive signal |
| Interactive skill garbled answers | LOW-MEDIUM | Add answer validation; re-run skill; the data contract catches it next time |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Orchestrator ≠ subagent | Phase 1 (Bob research) → probe; Phase 3/4 gate | Empirical delegation test shows isolation + returned result, or skill is flagged |
| 2. AskUserQuestion gap | Phase 1 confirm; Phase 3 wire text_mode | Interactive skill writes real validated answers |
| 3. Parity-first becomes broken-first | Phase 2 (flag-gap contract) | No dangling refs; explicit stubs; install summary lists skips |
| 4. Scope collision | Phase 5 (installer) | Resolved path printed; global never writes project tree |
| 5. Update/clean destroys customizations | Phase 5 (installer modes) | Re-run update preserves user files; no `gsd-*` dupes |
| 6. Detection false positive | Phase 1 signal; Phase 5 detection | Bob-Shell-specific signal; `--runtime` override works |
| 7. `.git`/`.planning` nesting | Phase 2 root-anchoring; Phase 3 verify | `.planning/` at workspace root; nested-root guard fires |
| 8. Backend-agnostic drift | Phase 2 (contract + lint) | grep finds zero model literals in core/artifacts |
| 9. Upstream rejection | Phase 2 seam-aligned design; Phase 6 prep | Registers into gsd-core seams; targeted version recorded |
| 10. Under-documented Bob internals | Phase 1 (stable/unstable split) | Design cites doc URLs; undocumented behavior is probe-gated only |

Suggested phases referenced: **Phase 1 Bob research → Phase 2 adapter design → Phase 3 core-loop port → Phase 4 quality-gate port → Phase 5 installer → Phase 6 upstream-prep.** (Installer can run parallel to/after core-loop; root-anchoring and flag-gap contracts from Phase 2 are prerequisites for the port phases.)

## Sources

- IBM Bob docs — Custom modes (Shell): https://bob.ibm.com/docs/shell/configuration/custom-modes-bobshell (HIGH — `slug`/`roleDefinition`/`groups`/`whenToUse`/`customInstructions`, `.bob/custom_modes.yaml` + `~/.bob/`)
- IBM Bob docs — Custom rules (Shell): https://bob.ibm.com/docs/shell/configuration/bobshell-custom-rules (HIGH — `.bobrules`, `.bob/rules/`, `~/.bob/rules/`, global vs workspace scope)
- IBM Bob docs — Slash commands: https://bob.ibm.com/docs/ide/features/slash-commands (HIGH — markdown commands in `.bob/commands/` + `~/.bob/commands/`)
- IBM Bob docs — Modes / Orchestrator: https://bob.ibm.com/docs/ide/features/modes (HIGH for built-in modes; MEDIUM/documented-absent on subagent isolation)
- IBM Bob docs — Bob Shell overview & install: https://bob.ibm.com/docs/shell , https://bob.ibm.com/docs/shell/getting-started/install-and-setup (HIGH — MCP extension, Node 22.15+, npm/pnpm/yarn/install-script; documented-absent on global-vs-local install + project init)
- VentureBeat — Bob launch, multi-model routing + human checkpoints: https://venturebeat.com/orchestration/ibm-launches-bob-with-multi-model-routing-and-human-checkpoints-to-turn-ai-coding-into-a-secure-production-system (HIGH — Claude/Mistral/Granite per-task routing, human-in-the-loop)
- IBM newsroom — Bob GA announcement: https://newsroom.ibm.com/2026-04-28-introducing-ibm-bob-ai-development-partner-that-takes-enterprises-from-ai-assisted-coding-to-production-ready-software (HIGH — GA timing, scope)
- gsd-core `bin/gsd-tools.cjs` (installer, `--cwd` root resolution, `detect-custom-files`/`saveLocalPatches` manifest, worktree/monorepo handling) — local source, HIGH
- gsd-core `bin/lib/runtime-homes.cjs` (env-overridable config-home descriptors; documented look-alike traps: Trae IDE vs trae-agent, Kimi generic roots) — local source, HIGH
- gsd-core `bin/lib/runtime-name-policy.cjs` (alias canonicalization) and `config-loader.cjs` (`workflow.text_mode` seam) — local source, HIGH

---
*Pitfalls research for: open-gsd → IBM Bob adapter port + cross-runtime installer*
*Researched: 2026-06-17*
