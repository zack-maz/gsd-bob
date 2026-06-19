# Stack Research

**Domain:** Cross-runtime adapter / CLI installer that ports the open-gsd (GSD) spec-driven planning framework to IBM Bob (bob.ibm.com)
**Researched:** 2026-06-17
**Confidence:** HIGH for gsd-core mechanics and the Node/installer stack (verified against live `~/.claude/gsd-core/` source and npm registry); MEDIUM-HIGH for IBM Bob's extension formats (verified against official bob.ibm.com docs, but Bob is young and some on-disk details are doc-stated rather than tested locally).

---

## Executive Frame

The single most important finding: **IBM Bob's "Agent Skills" are structurally near-identical to Claude Code skills, and gsd-core already has a runtime-adapter abstraction designed for exactly this.** Bob skills are `SKILL.md` files with YAML frontmatter (`name`, `description`) living in `.bob/skills/<name>/` (project) and `~/.bob/skills/` (global) — the *same flat layout* gsd-core already emits for Cursor/Codex/Cline. Bob slash commands are markdown files in `.bob/commands/` with `description` + `argument-hint` frontmatter and `$1/$2` positional args — again matching the shape gsd-core already converts to. This means **gsd-bob is mostly a new runtime descriptor + two converter functions, not a new framework.** The honest path is to mirror gsd-core's installer and (ideally) upstream a `bob` runtime entry rather than reinvent.

This makes the stack decision easy and low-risk: **mirror gsd-core's exact stack** (plain Node CJS, near-zero dependencies, descriptor-driven runtime registry) so the package is upstream-mergeable by construction.

---

## How gsd-core Actually Works (verified from live source)

This is the load-bearing research — gsd-bob mirrors it, so it is documented precisely.

**Package coordinates** (`bin/lib/package-identity.cjs`, npm registry):
- Name: `@opengsd/gsd-core`, latest **`1.5.0`** (dist-tag `next`: `1.5.0-rc.5`).
- `bin` map: `gsd-core` → `bin/install.js` (the npx installer entry), `gsd-tools` → `gsd-core/bin/gsd-tools.cjs`, `gsd_run` → `gsd-core/bin/gsd_run`.
- `engines`: **node `>=22.0.0`, npm `>=10.0.0`**.
- Runtime deps: only `@anthropic-ai/claude-agent-sdk@^0.2.84` and `ws@^8.21.0`. (Effectively dependency-light; the install/runtime core is plain Node.)

**Install invocation pattern** (`package-identity.cjs` `formatManualInstall`):
```
npx -y --package=@opengsd/gsd-core@latest -- gsd-core --<runtime> --<scope>
```
- `--<runtime>`: `--claude`, `--codex`, `--gemini`, `--cursor`, `--opencode`, `--copilot`, `--antigravity`, `--cline`, `--kilo`, `--kimi`, `--windsurf`, `--augment`, `--trae`, `--qwen`, `--hermes`, `--codebuddy`, plus `--all` / `--both`. No runtime flag → interactive prompt.
- `--<scope>`: `--local`/`-l` (install into `./<dir>` in the project) or `--global`/`-g` (install into the runtime's home dir).
- Other flags: `--config-dir`/`-c <path>` (explicit override), `--profile=<core|standard|full>` (`--minimal`/`--core-only` alias core), `--uninstall`/`-u`, `--dry-run`, `--portable-hooks`, `--force-statusline`, `--help`.
- **There is no separate `--clean`/`--update` flag** in the install entry. "Update" = re-run the same install command (the installer re-stages artifacts and reads the persisted active profile via `writeActiveProfile()`/read marker); the dedicated `/gsd-update` workflow drives version checks via `bin/check-latest-version.cjs` (which hardcodes the package name as a constant so the model can't query the wrong name). "Clean" = `--uninstall` then install. **gsd-bob should replicate exactly this convention** (re-run = update, uninstall+install = clean) rather than invent new flags — this keeps UX identical and upstreaming trivial.

**Runtime abstraction — the seam gsd-bob plugs into:**

1. **Capability Registry** (`bin/lib/capability-registry.cjs`, generated from `scripts/gen-capability-registry.cjs`). Each runtime is a `role:"runtime"` entry with a `runtime` descriptor:
   - `configHome` — a typed descriptor (`dot-home` / `dot-home-nested` / `xdg` / `generic-agents-root`) resolved by `bin/lib/runtime-homes.cjs` into an absolute home dir, honoring an env override (e.g. `CLAUDE_CONFIG_DIR`, `CODEX_HOME`).
   - `artifactLayout.global[]` and `.local[]` — list of `{ kind: "skills"|"commands"|"agents", destSubpath, prefix:"gsd-", nesting:"flat"|"nested", recursive, converter:"<fnName>" }`.
   - `configFormat` (`settings-json` / `codex-toml` / `none`), `commandStyle` (`slash-hyphen`), `hooksSurface`, `hookEvents`, `supportTier`, `installSurface`, `writesSharedSettings`.
2. **Converters** (`bin/lib/runtime-artifact-conversion.cjs`) — one function per (runtime × artifact kind), e.g. `convertClaudeCommandToCursorSkill(content, skillName)`. They transform the canonical Claude-flavored skill markdown into the target's dialect (strip/rewrite frontmatter, rewrite slash-command references, adjust tool names). Cursor's are the closest analog to what Bob needs.
3. **Aliases** (`bin/shared/runtime-aliases.manifest.json` + `bin/lib/runtime-name-policy.cjs`) — canonicalizes `--bob`/`bob-cli`/`bobshell` → `bob`.
4. **Config adapter** (`bin/lib/runtime-config-adapter-registry.cjs`) — decides per-runtime whether to write a `settings.json`, a TOML, or nothing.
5. **The `gsd-tools.cjs` shim preamble** — the long resolver block every workflow bash step emits. It walks a list of candidate config homes (`~/.claude`, `~/.codex`, `~/.cursor`, `~/.opencode`, …) to locate `gsd-core/bin/gsd-tools.cjs`. **Bob is currently absent from this list** (verified: no `.bob`/`BOBSHELL`/`BOB_CONFIG` reference in `gsd-tools.cjs`), confirming gsd-bob must add a `${BOB_CONFIG_DIR:-$HOME/.bob}/gsd-core/bin/gsd-tools.cjs` branch.

**Implication:** adding Bob upstream is, in the ideal case, (a) one registry entry, (b) two converter functions (`convertClaudeCommandToBobSkill`, `convertClaudeCommandToBobCommand`), (c) one alias entry, (d) one `getDirName`/`configHome` mapping, (e) one shim-preamble branch. gsd-bob v1 ships these as a standalone package that vendors the gsd-core payload; the same five artifacts are the upstream PR.

---

## IBM Bob Extension Surface (verified from bob.ibm.com docs)

| Bob primitive | On-disk format | Location (project / global) | Maps to GSD primitive |
|---|---|---|---|
| **Agent Skill** | `SKILL.md`, YAML frontmatter `name` + `description` (only two documented fields); supports nested `scripts/`, `references/`, `assets/` | `.bob/skills/<name>/SKILL.md` / `~/.bob/skills/<name>/SKILL.md` | GSD skill (`SKILL.md`) — **direct 1:1**, near-identical to Claude/Cursor layout |
| **Slash command** | `<name>.md`, frontmatter `description` + `argument-hint`; filename → command name; `$1`/`$2` positional args | `.bob/commands/<name>.md` / `~/.bob/commands/<name>.md` | GSD slash command (workflow entry) |
| **Custom Mode** | YAML entries in `customModes[]` with `slug`, `name`, `roleDefinition`, `whenToUse`, `customInstructions` | `~/.bob/settings/custom_modes.yaml` (IDE); BobShell variant under `/docs/shell/configuration/custom-modes-bobshell` | GSD "modes" / context partitioning (optional, v2) |
| **Bob Rules** | plain-text rule files; `.bobrules-{mode-slug}` single-file form supported | `.bobrules/` folder or `.bobrules-*` in workspace root | GSD project rules / always-on instructions |
| **AGENTS.md** | markdown context files generated by `/init`, one per mode + root | `.bob/` | GSD `AGENTS.md`/context convention (already aligned across the ecosystem) |
| **MCP** | MCP server config | Bob MCP config | GSD MCP-tool surface (e.g. context7) — Bob-native |
| **BobShell (`bob`)** | terminal CLI; `--auth-method api-key` + `BOBSHELL_API_KEY` for headless/CI; install via curl script, npm/pnpm/yarn, or IDE palette | n/a | the host runtime gsd-bob targets for non-interactive flows |

**Backend routing:** Bob owns model routing (Modes/IDE settings; BobShell auth chooses IBMid or API key). Docs do not pin Bob to a single backend — it is explicitly multi-backend (the project's "backend-agnostic core" principle is satisfied by emitting Bob-native artifacts and letting Bob route). **gsd-bob must not branch on the underlying model**; it emits skills/commands and Bob decides.

**Critical compatibility win:** Bob requires **Node.js `>=22.15.0`** for BobShell — fully compatible with gsd-core's `node >=22`. One engine constraint covers both.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Node.js** | `>=22.15.0` (engines `>=22`) | Installer + `gsd-tools.cjs` runtime | Matches gsd-core (`>=22.0.0`) AND Bob Shell (`>=22.15.0`) exactly; `>=22.15.0` is the tighter of the two and the correct floor. Use Node 22 LTS ("Jod") as the baseline; works on 24/25. |
| **CommonJS (`.cjs`)** | n/a | Module format for installer + tools | gsd-core ships CJS (`gsd-tools.cjs`, `install.js`, `bin/lib/*.cjs`). To be upstream-mergeable and to reuse the shim resolver verbatim, gsd-bob's runtime/installer code must also be CJS. (gsd-core authors in TypeScript and *compiles to .cjs at publish* per ADR-457 — adopt the same source-of-truth-TS → publish-CJS pattern only if you want type safety; pure hand-written CJS is also acceptable for a small adapter.) |
| **npm + npx** | npm `>=10` | Distribution channel | Mirrors `npx -y --package=@opengsd/gsd-bob@latest -- gsd-bob --bob --<scope>`. Zero-install UX identical to existing GSD users. |
| **Node built-ins only** (`node:fs`, `node:path`, `node:os`, `node:child_process`) | n/a | Filesystem staging, home-dir resolution, runtime detection | gsd-core's installer and `runtime-homes.cjs` use *only* built-ins. Keeping gsd-bob dependency-free for install/staging is the single biggest contribution-readiness and security win. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **(none for the installer)** | — | — | Default position. Do NOT add a CLI framework, a copy lib, or a YAML lib for the installer path. gsd-core proves you don't need them. |
| `js-yaml` | `^4.1.0` | Read/emit Bob `custom_modes.yaml` *if* you port Modes | ONLY if v2 adds custom-mode emission. v1 (skills + commands) needs no YAML parser — frontmatter is hand-sliced like gsd-core's converters do. Defer. |
| `@anthropic-ai/claude-agent-sdk` | `^0.2.84` | (Inherited only if vendoring gsd-core payload that uses it) | Do not add directly. It is gsd-core's dep for Claude-backed agent spawning; gsd-bob is backend-agnostic and should not depend on a Claude SDK. If the vendored payload references it, isolate it so the Bob path never requires it. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **TypeScript** (`^5.x`) + `tsc` | Optional: author runtime descriptor/converters as `.cts`, compile to `.cjs` at publish | Matches gsd-core's ADR-457 "build-at-publish" pattern (`*.cts` → gitignored `.cjs` at same require path). Adopt for upstream parity; skip for a thin standalone adapter. |
| **Vitest** or **node:test** | Unit tests for the converter + path resolver | gsd-core tests assert on typed enums/records, never raw console text — mirror that to be PR-acceptable. `node:test` keeps zero deps. |
| **Biome** or **ESLint** | Lint | Match whatever gsd-core's `CONTRIBUTING.md` mandates before opening an upstream PR. |
| **npm `prepublishOnly`** | Stage the vendored gsd-core payload + compile | gsd-bob bundles the GSD skill/workflow payload at publish time, like gsd-core bundles `gsd-core/`. |

## Installation (gsd-bob's own, mirroring gsd-core)

```bash
# End-user one-liner (the UX we ship)
npx -y --package=@opengsd/gsd-bob@latest -- gsd-bob --bob --local    # project scope
npx -y --package=@opengsd/gsd-bob@latest -- gsd-bob --bob --global   # ~/.bob scope
npx -y --package=@opengsd/gsd-bob@latest -- gsd-bob --bob --global --uninstall   # clean
# "update" = re-run the install command (re-stages, reads persisted profile)

# Dev dependencies for building gsd-bob itself (only if adopting the TS-at-publish pattern)
npm install -D typescript@^5 vitest   # or rely on node:test for zero deps
```

`package.json` essentials to copy from gsd-core:
```jsonc
{
  "name": "@opengsd/gsd-bob",
  "bin": { "gsd-bob": "bin/install.js" },
  "engines": { "node": ">=22.15.0", "npm": ">=10.0.0" },
  "files": ["bin/", "gsd-core/"],         // vendored GSD payload
  "dependencies": {}                       // keep empty for the install/staging path
}
```

## What gsd-bob Adds (the deliverable, in gsd-core's vocabulary)

1. **Runtime descriptor** `bob`:
   - `configHome`: `{ kind: "dot-home", name: ".bob", env: ["BOB_CONFIG_DIR"] }` (Bob uses `~/.bob`; `.bob/` in project for local).
   - `artifactLayout.global`/`.local`: `[{ kind:"skills", destSubpath:"skills", prefix:"gsd-", nesting:"nested", recursive:true, converter:"convertClaudeCommandToBobSkill" }, { kind:"commands", destSubpath:"commands", prefix:"gsd-", nesting:"flat", recursive:false, converter:"convertClaudeCommandToBobCommand" }]`. (Bob skills live in `.bob/skills/<name>/SKILL.md` → nested; commands are flat `.bob/commands/<name>.md`.)
   - `configFormat:"none"` (Bob skills/commands need no shared settings.json write for v1), `commandStyle:"slash-hyphen"`, `supportTier: 2`.
2. **Two converters** modeled on the Cursor pair:
   - `convertClaudeCommandToBobSkill(content, skillName)` → keep `name`+`description`, drop unsupported frontmatter keys (`effort`, `allowed-tools`, `argument-hint` for skills), rewrite `/gsd-*` references, neutralize Claude-only tool names.
   - `convertClaudeCommandToBobCommand(content, name)` → keep `description`+`argument-hint`, map `$ARGUMENTS`→`$1`/positional (Bob already uses `$1/$2`, so this is close to a no-op).
3. **Alias entry**: `"bob": ["bob", "bob-cli", "bobshell", "ibm-bob"]`.
4. **Shim-preamble branch**: add `${BOB_CONFIG_DIR:-$HOME/.bob}/gsd-core/bin/gsd-tools.cjs` to the resolver chain in the per-file preamble.
5. **`getDirName('bob') → '.bob'`** in the installer's directory map.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Mirror gsd-core's plain-Node CJS installer | Build a fresh installer with a CLI framework (`commander`, `oclif`, `yargs`) | Never for v1. A framework adds deps and *diverges* from gsd-core, hurting upstreamability. gsd-core proves arg-parsing-by-hand is sufficient. Reconsider only if gsd-bob grows a large standalone CLI surface unrelated to GSD. |
| Vendor gsd-core payload into gsd-bob, ship standalone | Depend on `@opengsd/gsd-core` as an npm dependency and shell into its installer | Tempting, but gsd-core's installer doesn't know `bob` yet, so you'd still fork the registry. Vendoring (v1) decouples release cadence and is the project's stated decision; switch to a dependency-on + upstreamed-`bob`-runtime once the PR lands. |
| TS-source → publish-CJS (ADR-457) | Hand-written `.cjs` only | Hand-written CJS is fine for a thin adapter and lowers the build toolchain. Adopt TS only when you intend the converters to be merged into gsd-core's own TS tree (then matching ADR-457 is required). |
| Bob **Agent Skills** as the primary target | Bob **Custom Modes** as the primary target | Skills are the right v1 vehicle: per-skill activation by description matches GSD's ~70 skills 1:1 and needs no global config surgery. Modes (`custom_modes.yaml`) are a heavier, IDE-global construct — defer to v2 for orchestrator-style flows. |
| Bob slash commands for explicit invocation | Skills-only (rely on Bob auto-activating by description) | Ship BOTH where GSD has both (gsd-core already emits skills+commands for Cursor/Codex). Commands give users the explicit `/gsd-plan-phase` entry; skills give auto-activation. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ESM (`"type":"module"`) for the installer/tools | gsd-core ships CJS; the `gsd_run` shim and `gsd-tools.cjs` resolver are CJS; ESM breaks the verbatim-reuse + upstream-merge story | CommonJS `.cjs` (optionally TS-compiled-to-CJS) |
| A CLI framework (`commander`/`oclif`/`yargs`) | Adds dependencies, diverges from gsd-core's hand-rolled `selectRuntimesFromArgs()`, hurts mergeability and audit surface | Hand-parse `process.argv` exactly as `bin/install.js` does |
| `fs-extra`, `copyfiles`, `cpy` | Unnecessary deps; gsd-core stages with `node:fs` (`cpSync`/`mkdirSync`) only | `node:fs` built-ins |
| A YAML parser in the v1 install path | v1 emits skills/commands (markdown + frontmatter), which are hand-sliced like every gsd-core converter; no YAML emitted until Modes (v2) | Defer `js-yaml` to the Modes milestone |
| `chalk`/`ora`/heavy TTY libs | Dependency weight for cosmetic output; gsd-core keeps installer output plain | Plain `console.log` / minimal ANSI if needed |
| Depending on `@anthropic-ai/claude-agent-sdk` in the Bob path | Violates backend-agnostic principle; couples gsd-bob to Claude | Emit Bob-native artifacts; let Bob route the model |
| Inventing new `--clean`/`--update` flags | gsd-core has no such flags (re-run = update, `--uninstall`+install = clean); diverging breaks UX parity and upstreaming | Replicate gsd-core's convention exactly |
| The legacy `/gsd:<cmd>` colon command form | gsd-core deprecated it (#2808); only `gsd-<cmd>` hyphen form is routable | Hyphen form `gsd-<cmd>` (matches Bob filename→command rules) |
| Targeting `trae-agent`-style YAML configs by analogy | Bob is NOT config-file-routed like some CLIs; it's skills/commands/rules-driven | Use Bob's documented `.bob/skills`, `.bob/commands`, `.bobrules`, `custom_modes.yaml` |

## Stack Patterns by Variant

**If shipping v1 standalone (the chosen path):**
- Vendor the GSD payload under `gsd-bob/gsd-core/`, hand-write or TS-compile a `bob` runtime descriptor + 2 converters, own version/installer.
- Because: decouples from gsd-core release cadence and lets you prove the translation before negotiating a merge (project's Key Decision).

**If/when upstreaming to gsd-core:**
- Submit the 5 artifacts (registry entry, 2 converters, alias, configHome/getDirName, shim branch) as a PR; switch gsd-bob to depend on `@opengsd/gsd-core` and drop the vendored copy.
- Because: gsd-core's whole architecture is built to absorb new runtimes this way; a merged `bob` runtime is the long-term home.

**If Bob's Agent-Skill frontmatter diverges from observed (`name`/`description` only):**
- The converter must *strip* unsupported keys (`effort`, `allowed-tools`, `argument-hint` on skills) rather than pass them through, to avoid Bob ignoring or erroring on the skill.
- Because: Bob docs say only `name`+`description` are read; extra keys are at best inert, at worst cause the skill to be skipped (a skill *without* a usable description "is ignored").

**If targeting BobShell (headless/CI) vs Bob IDE:**
- Same `.bob/skills` + `.bob/commands` artifacts work for both; for CI use `--auth-method api-key` + `BOBSHELL_API_KEY`. No artifact difference — only the host launch differs.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| gsd-core `1.5.0` | Node `>=22.0.0`, npm `>=10` | Current latest; mirror its engines. |
| Bob Shell (`bob`) | Node `>=22.15.0` | Tighter floor than gsd-core; adopt `>=22.15.0` as gsd-bob's engine to satisfy both. |
| gsd-bob installer | `node:fs`/`node:path`/`node:os` only | No third-party runtime deps in the install/staging path — keeps the security/audit surface minimal and matches gsd-core. |
| `@anthropic-ai/claude-agent-sdk@^0.2.84` | gsd-core internal only | Do not introduce into gsd-bob's Bob path; backend-agnostic by design. |
| Bob SKILL.md frontmatter (`name`,`description`) | Claude/Cursor flat skill layout | Converter must reduce GSD's richer frontmatter to these two fields. |

## Open Items / Assumptions to Validate in a Spike

- **Assumption (MEDIUM):** Bob global skills live at `~/.bob/skills/` and project skills at `.bob/skills/` (doc-stated; confirmed across multiple sources). Validate the exact env-var override name for the Bob home (assumed `BOB_CONFIG_DIR`; not documented — may not exist, in which case `~/.bob` is fixed and the descriptor drops the env override).
- **Assumption (MEDIUM):** Bob slash-command frontmatter supports only `description` + `argument-hint` (no `allowed-tools`/`model`). Converter should not rely on others.
- **Unverified:** Whether Bob skills can programmatically *invoke* a slash command or another skill (GSD workflows chain skills). If Bob lacks skill→command invocation, the parity-first rule flags any GSD skill that depends on it. Test in a Bob spike before locking the port list.
- **Unverified:** Whether Bob enforces a max description length (Claude caps ~1024 chars). GSD descriptions are short, so low risk.
- **Unverified:** BobShell non-interactive supports the same skill auto-activation as the IDE. Headless skill activation must be spike-tested for the CI story.

## Sources

- Live source `~/.claude/gsd-core/` v1.5.0 — `bin/lib/package-identity.cjs`, `runtime-homes.cjs`, `runtime-name-policy.cjs`, `capability-registry.cjs`, `runtime-artifact-conversion.cjs`, `runtime-config-adapter-registry.cjs`, `runtime-slash.cjs`, `bin/gsd_run`, `bin/shared/runtime-aliases.manifest.json`, installed skill frontmatter — HIGH confidence (read directly).
- npm registry `npm view @opengsd/gsd-core` — version `1.5.0`, `bin`, `engines` (node `>=22`, npm `>=10`), deps (`@anthropic-ai/claude-agent-sdk@^0.2.84`, `ws@^8.21.0`), dist-tags — HIGH.
- `bin/install.js` (GitHub raw, open-gsd/gsd-core@main) — installer flags (`--local/--global`, runtime flags, `--config-dir`, `--profile`, `--uninstall`, `--dry-run`), runtime selection, scope resolution, staging steps — HIGH.
- IBM Bob docs — Skills (`bob.ibm.com/docs/ide/features/skills`): `.bob/skills` + `~/.bob/skills`, `SKILL.md` `name`+`description`, nested resources, project-over-global precedence — HIGH (official).
- IBM Bob docs — Slash commands (`bob.ibm.com/docs/ide/features/slash-commands`): `.bob/commands` + `~/.bob/commands`, filename→command, `description`+`argument-hint`, `$1/$2` — HIGH (official).
- IBM Bob docs — Custom modes (`~/.bob/settings/custom_modes.yaml`, `customModes[]` shape), Rules (`.bobrules`/`.bobrules-{mode-slug}`), Bob Shell install (`bob` CLI, Node `>=22.15.0`, `--auth-method api-key` + `BOBSHELL_API_KEY`) — MEDIUM-HIGH (official docs, some via search synthesis).
- Verified Bob absent from gsd-core's `gsd-tools.cjs` shim (no `.bob`/`BOBSHELL` reference) — HIGH, confirms gsd-bob must add the runtime.

---
*Stack research for: gsd-bob — porting open-gsd to IBM Bob*
*Researched: 2026-06-17*
