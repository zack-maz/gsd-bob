# Phase 8: Model Neutralization - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** `--auto` (Claude selected the recommended option for every gray area; each is logged in `08-DISCUSSION-LOG.md`)

<domain>
## Phase Boundary

Add a **model-neutralization pass + a durable zero-literal invariant** so the Bob-native artifacts gsd-bob *emits through its converters* carry zero model-routing references — Bob owns model routing. This must land before Phase 9 so every one of the 18 commands added there is "born clean" and provably neutral.

**In scope:** NEUTRAL-01 (strip machine-readable model directives — frontmatter `model:`/`effort:` and structural `model_profile`/`resolve_model_ids` — from emitted artifacts), NEUTRAL-02 (rewrite inline model prose `opus`/`sonnet`/`haiku` and equivalents to model-neutral wording in emitted artifacts), NEUTRAL-03 (a zero-literal invariant test over the emitted converted-artifact set that fails loudly on regression, plus the same invariant authored as an insert-only device-runnable acceptance step for Phase 11 / ACCEPT-02).

**Out of scope (own phases / explicitly excluded):**
- Adding the 18 new commands (Phase 9, CMD-*) — Phase 8 only builds the pass+invariant they will be validated against.
- The MAINTAINING runbook / per-command docs (Phase 10, DOCS-*).
- Running the acceptance step on hardware (Phase 11) — Phase 8 *authors* the step, insert-only.
- **Neutralizing the vendored `gsd-core/` runtime & config substrate** (`bin/`, and the `model_profile`/`resolve_model_ids` config vocabulary in `workflows/`+`references/`) — see D-01 for the reasoned boundary. The vendored source payload stays 1.6.1-verbatim (Phase 7 invariant preserved).

**Cross-cutting invariants (carried forward, must stay true):** backend-neutral (zero model-brand literals in core paths + `bob-adapter.cjs`), `.planning/` root-anchored, capability-map flag-gap contract, test-deferred (no live Bob — every criterion verifiable via unit/golden tests on converter output, Claude-runtime equivalence, or doc-conformance; device-runnable steps accrue to the acceptance checklist).

</domain>

<decisions>
## Implementation Decisions

### Grounding facts discovered during scouting (drive every decision below)
- **F-01 (emission architecture):** `src/installer/stage.cjs` emits three kinds of output under the `.bob/` target: (a) **converted artifacts** — `.bob/commands/gsd-*.md` (via `convertClaudeCommandToBobCommand`) and `.bob/skills/gsd-*/SKILL.md` (via `convertClaudeCommandToBobSkill`), produced by running `commands/gsd/*.md` through the vendored gsd-core converters; (b) the **verbatim raw-copied vendored payload** `.bob/gsd-core/**` (structural piece 2 — a byte copy, NOT converter-fed); (c) structural files (`custom_modes.yaml`, `SUPPORT-ROSTER.md`, synthesized `package.json`, `scripts/`). Only bucket (a) flows through a converter.
- **F-02 (frontmatter already neutral):** the existing Bob converters **already reduce frontmatter** — commands to `description`+`argument-hint`, skills to `name`+`description` — so `model:`/`effort:` are **already stripped** from today's emitted artifacts. Verified by running `convertClaudeCommandToBobCommand`/`Skill` over all 10 current sources.
- **F-03 (bodies already near-clean):** across all 10 current commands, the only surviving model-ish literal in emitted bodies is the word **"gemini" in `progress.md`**, and it is a **legitimate peer-AI-CLI reference** (the cross-AI plan-review/convergence reviewers), NOT a model-routing directive. Anthropic tier names (`opus`/`sonnet`/`haiku`) do not survive into the current emitted set.
- **F-04 (why the phase still matters):** the ~231 model mentions the roadmap cites live overwhelmingly in the **vendored payload** — `bin/` (122, the executable `model-resolver`/`model-catalog`/`model-profiles` runtime), `workflows/` (56), `references/` (52), `templates/` (1). Phase 8's value is the **durable invariant + neutralization pass built now**, so the Phase 9 commands (which pull in far more inline model prose) are caught automatically rather than leaking.

- **D-01 — Invariant/neutralization SCOPE = the emitted converted artifacts only.** NEUTRAL-01/02 neutralize, and NEUTRAL-03 asserts over, the **converted Bob-native artifact set**: `.bob/commands/gsd-*.md` + `.bob/skills/gsd-*/SKILL.md`. The raw-copied `.bob/gsd-core/**` payload is **explicitly excluded**.
- **Why (three independent reasons):** (1) `.bob/gsd-core/bin/**` is **executable runtime** — the model-resolver/catalog/profiles machinery must keep functioning; stripping its model literals would break `gsd-tools.cjs`. (2) `model_profile`/`resolve_model_ids` in `workflows/`+`references/` (e.g. `new-project.md` ×21, `settings.md` ×15) are the **GSD configuration system's own vocabulary** — how a user *configures* a profile — not per-artifact routing directives; "Bob owns model routing" means Bob picks the concrete model, while the config-profile abstraction is orthogonal and stays. (3) The requirement text for NEUTRAL-01/02 says "**the converter** … emitted `.bob/` artifacts" — the converted set is precisely what the converter emits; the payload is *copied*, a different verb. This reading also **preserves Phase 7's verbatim-payload invariant** (the source `gsd-core/` stays 1.6.1-clean).
- **⚠ OPEN QUESTION for research (highest priority):** the roadmap goal prose says "the ~231 model mentions … **flow through the converter**," which is factually looser than F-01 (payload is raw-copied, not converter-fed). Research MUST (a) confirm F-01 against the live `stage.cjs`, (b) confirm no emitted converted artifact **inlines** payload prose (today they reference workflows *by path*, so payload prose never enters bucket (a)), and (c) if a maintainer intends payload prose to also be neutralized, evaluate an **install-time prose-neutralization pass over the copied `workflows/references/templates` (never `bin/`)** as a scoped follow-up — but only if it can be done without mangling the `model_profile` config vocabulary. Default remains D-01 (converted-set scope) unless research surfaces a hard reason to widen it.

- **D-02 — Neutralizer placement: isolated in `bob-adapter.cjs`, applied as a post-pass in `stage.cjs`.** Add a new exported function **`neutralizeModelReferences(content)`** to `src/bob-adapter.cjs`. Apply it in `stage.cjs`'s convertible loop as a **post-pass wrapping the converter output** — `neutralizeModelReferences(convertClaudeCommandToBobCommand(content, name))` (and the skill equivalent) — so it runs on the final emitted bytes.
- **Why:** keeps the "all Bob-specific logic isolated to `src/bob-adapter.cjs` + two data-only registry edits" invariant intact (the upstream "move not rewrite" story). **Never edit the vendored converter** in `runtime-artifact-conversion.cjs` — that would fork gsd-core and break the move-not-rewrite guarantee. The post-pass composes cleanly and lets the pass + invariant evolve independently of the vendored payload.

- **D-03 — One shared "model literal" regex, powering BOTH the pass and the invariant.** Define a single canonical **model-literal regex** used by both `neutralizeModelReferences` and the NEUTRAL-03 invariant, so they can never drift. It matches: word-boundary Anthropic tier tokens `\b(opus|sonnet|haiku)\b` (case-insensitive), plus any residual frontmatter `^(model|effort):` line and structural `model_profile`/`resolve_model_ids` keys **if they ever appear in a converted artifact** (defense-in-depth; F-02 shows the converter already strips frontmatter, but the invariant must still guard regressions).
- **Explicit allowlist / carve-outs** (must NOT trip the invariant, must NOT be rewritten): (i) peer-AI **CLI/tool names used as external reviewers** — e.g. the "gemini"/"codex" CLI references in `progress.md` (F-03); (ii) the generic English word "model" on its own; (iii) GSD config-vocabulary keys where they are legitimately naming the config system rather than routing an artifact. The allowlist is the crux that keeps the invariant honest — encode it as explicit patterns, not incidental.
- **Prose rewrite (NEUTRAL-02):** a curated replacement map from tier name → **capability-neutral wording** that preserves the author's *relative* intent without a brand — recommended default: `opus`→"a higher-capability model", `sonnet`→"a balanced model", `haiku`→"a faster model". Research may instead flatten all to "the configured model" if preserving tiering proves fragile; either is acceptable as long as the invariant then reads zero literals.

- **D-04 — Invariant as a loud `node:test` suite + insert-only acceptance step.** Implement NEUTRAL-03 as a new `node:test` suite (recommended name `test/model-neutrality.test.cjs`) that **enumerates the emitted converted set via the real staging path** (reuse the existing staging/scratch-tmpdir harness the installer tests already use — do not re-implement emission), applies the D-03 regex, and **fails loudly listing every offending `file:line:token`** (never a bare count). It must pass against the **full 1.6.1-derived emission**.
- **Phase 11 hook (ACCEPT-02):** author the *same* check as a **device-runnable acceptance step appended insert-only** to `.planning/ACCEPTANCE-CHECKLIST.md` after the frozen AC-01..AC-26 — an exact shell one-liner (a `grep -rniE '<regex>'` over a real `.bob/` install) with the expected **zero-match** output. Mirror the Phase 6 acceptance-coverage traceability pattern; do not disturb frozen items.

### Claude's Discretion
- User delegated all areas (`--auto` for everything) — every decision above is Claude's recommended option, logged in `08-DISCUSSION-LOG.md`. Downstream research/planning may refine *how* each is implemented (exact replacement wording in D-03; exact allowlist pattern set; the precise test-harness reuse in D-04) as long as the decisions above hold. The one decision research is explicitly invited to *challenge* with evidence is **D-01's scope** (see its OPEN QUESTION).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap (the phase contract)
- `.planning/ROADMAP.md` §"Phase 8: Model Neutralization" — goal, the 3 success criteria, the ~231-mention framing, and the "born model-neutral before Phase 9" ordering rationale.
- `.planning/REQUIREMENTS.md` — NEUTRAL-01, NEUTRAL-02, NEUTRAL-03 (verbatim requirement text) + the "Emitted artifacts carry zero model references — Bob owns model routing" section header.

### The emission path being neutralized (D-01, D-02)
- `src/installer/stage.cjs` — the staging engine. The **convertible loop** (~L251-291) is where D-02's post-pass wraps `convertClaudeCommandToBobCommand`/`convertClaudeCommandToBobSkill`; **structural piece 2** (~L213-222) is the raw verbatim `.bob/gsd-core/**` payload copy that D-01 excludes.
- `src/bob-adapter.cjs` — the single isolated Bob-logic module; home of the new `neutralizeModelReferences()` (D-02). Current exports: `emitGsdMode`, `mergeCustomModes`, `unmergeCustomModes`, `gateArtifact`, `buildSupportRoster`.
- `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — the vendored converters (`convertClaudeCommandToBobCommand`/`Skill`). **Read-only reference** — must NOT be edited (D-02); already reduces frontmatter (F-02).
- `commands/gsd/*.md` — the 10 current converter *inputs* (the Phase 9 additions will land here too).

### The neutrality contract & existing invariants to mirror
- `test/backend-neutrality.test.cjs` — the **existing** RUNTIME-04 neutrality test (scans the `bob` registry block + `bob-adapter.cjs` for brand literals via a base64-encoded forbidden-token set). Study its structure — the NEUTRAL-03 invariant is a sibling with a different scope (emitted converted artifacts, not core paths) and should reuse its "programmatic token set / loud assert" idioms.
- `test/installer/` + the scratch-tmpdir staging harness used by the installer tests — reuse this to drive real emission in the NEUTRAL-03 suite (D-04).
- `.planning/ACCEPTANCE-CHECKLIST.md` — target of the D-04 insert-only ACCEPT-02 step; frozen AC-01..AC-26 must stay byte-unchanged.
- `test/acceptance-coverage.test.cjs` — the Phase 6 traceability/presence pattern to mirror when authoring the acceptance step.

### Upstream framing (keep consistent)
- `UPSTREAM.md` (repo root) — the 5-artifact move inventory + backend-neutrality guarantee (targeted version now 1.6.1). D-02's isolation keeps the neutralization pass consistent with this "move not rewrite" story; confirm whether the new `neutralizeModelReferences` seam should be noted here as bob-adapter surface.

### Prior context (carried forward)
- `.planning/phases/07-gsd-core-1-6-1-sync/07-CONTEXT.md` — establishes the verbatim-vendored-payload invariant (D-05/D-07 nuke-and-restage-clean) that D-01 must not violate, and the isolation principle D-02 relies on.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`test/backend-neutrality.test.cjs`** — proven template for a "zero brand literals" assertion (programmatic/base64 token set so the test file doesn't self-trip; loud `assert.deepEqual(hits, [])`). The NEUTRAL-03 suite is a scope-shifted sibling.
- **Existing installer staging harness (`test/installer/`, scratch-tmpdir)** — already drives a real emission into a temp `.bob/`; reuse it to enumerate the emitted converted set for the invariant instead of re-implementing emission.
- **The vendored converters already reduce frontmatter (F-02)** — NEUTRAL-01's frontmatter obligation is largely pre-satisfied; the invariant primarily *guards* it against regression rather than doing new stripping.

### Established Patterns
- **All Bob-specific logic isolated to `src/bob-adapter.cjs` + two data-only registry edits** — `neutralizeModelReferences` belongs in `bob-adapter.cjs`; `stage.cjs` calls it, never inlines rewriting logic (mirrors how `stage.cjs` calls `gateArtifact`/`mergeCustomModes` rather than reimplementing them).
- **Vendored payload is verbatim and sourced from repo root** (Phase 3/7) — D-01 preserves this: neutralization is an emit-time transform on converted output, not an edit to the vendored source tree.
- **Generated-not-hand-edited artifacts** (`SUPPORT-ROSTER.md`) — follow the same "single source of truth" discipline for the shared D-03 regex (one exported constant, consumed by both the pass and the test).

### Integration Points
- **New export:** `neutralizeModelReferences(content)` in `src/bob-adapter.cjs` (D-02).
- **New call site:** `stage.cjs` convertible loop — wrap both converter outputs before `stageFile(...)`.
- **New test:** `test/model-neutrality.test.cjs` (D-04) — drives real staging, applies the shared regex, fails loud with `file:line:token`.
- **New acceptance step:** appended insert-only to `.planning/ACCEPTANCE-CHECKLIST.md` (D-04 → Phase 11 ACCEPT-02).

</code_context>

<specifics>
## Specific Ideas

- The neutralization pass is **insurance for Phase 9, not a big cleanup of today's output** — the current 10-command emission is already effectively neutral (F-02/F-03). Plan the pass + invariant so that the moment Phase 9 vendors an inline-`opus`/`sonnet`/`haiku` command, the invariant catches it and the pass cleans it, with zero extra wiring in Phase 9.
- The **allowlist is where correctness lives** (D-03): the "gemini"/"codex" peer-CLI references and the `model_profile` config vocabulary are true-negatives that a naive brand-grep would flag. The regex must be brand-tier-scoped (`opus`/`sonnet`/`haiku`) with explicit carve-outs, not a broad "any AI word" match — otherwise the invariant is noisy and gets muted, defeating its purpose.
- Keep the invariant's **failure message actionable** (`file:line:token`) so a Phase 9 regression is a one-glance fix, not a hunt.

</specifics>

<deferred>
## Deferred Ideas

- **Install-time prose-neutralization of the copied `.bob/gsd-core/workflows|references|templates`** — considered and deferred (see D-01 OPEN QUESTION). Only revisit if research/maintainer intent shows the copied prose must also be literal-free AND it can be done without corrupting the `model_profile`/`resolve_model_ids` config vocabulary. Never neutralize `.bob/gsd-core/bin/**` (executable model-resolution runtime).

*(No scope-creep ideas surfaced — discussion stayed within the phase boundary. Command expansion, docs, and acceptance-delta steps are already scoped to Phases 9–11.)*

</deferred>

---

*Phase: 8-model-neutralization*
*Context gathered: 2026-07-03*
