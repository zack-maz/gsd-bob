# Phase 10: Documentation - Research

**Researched:** 2026-07-03
**Domain:** Technical documentation authoring + hermetic doc-conformance testing (no new machinery)
**Confidence:** HIGH (every claim grounded in a read file:symbol/line; no external/web dependency)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Flat root layout.** All four docs live at repo root: `README.md` (expand in place), `COMMANDS.md` (DOCS-02, new), `ARCHITECTURE.md` (DOCS-03, new), `MAINTAINING.md` (DOCS-04, new). Alternative `docs/` subdir allowed but flat-root is the default and matches the existing repo (`README.md`, `UPSTREAM.md`, `SUPPORT-ROSTER.md` already at root).
- **D-02 — Command lists + per-command blurbs are sourced from generated artifacts, never hand-authored.** The 28-command list in `README.md` and `COMMANDS.md` derives from `SUPPORT-ROSTER.md` (itself generated from `commands/gsd/*.md`). Each blurb is sourced from that command's pristine frontmatter `description:` in `commands/gsd/<name>.md`. Planner chooses generator-script vs authored-then-guarded; either way blurbs trace to source frontmatter.
- **D-03 — One hermetic doc-conformance test** (e.g. `test/docs-conformance.test.cjs`) asserting against the roster Supported set: (a) `README.md`'s 28-command list == roster exactly; (b) `COMMANDS.md` covers exactly the 28 — no missing, no extra; fail loud on drift.
- **D-04 — Expand `README.md` in place; do not rewrite.** Keep Install / Scope / Modes / Verification-posture intact. Grow "Supported skills" from 10 → 28 (grouped by cluster), keep flagged-gaps (`gsd-autonomous`, `gsd-parallel-fanout`), add a Documentation section linking the three new docs.
- **D-05 — `ARCHITECTURE.md` explains four axes**, each grounded in a real anchor: (1) converter/descriptor model, (2) capability-map gate (conservative lower-bound defaults), (3) backend-neutrality (model-neutralization pass), (4) `.planning/` interchange. Reference `UPSTREAM.md` for "move, not rewrite." **MUST NOT cite a live `CAPABILITY-MAP.md` path** — it was deleted (commit `459d992`); recover via git only if a verbatim quote is wanted.
- **D-06 — Distill `07-REVENDOR-NOTES.md` into a numbered, repeatable `MAINTAINING.md`** reflecting the real 1.5.0 → 1.6.1 dance (8 ordered steps). Cite actual scripts + Phase 7 artifacts as provenance.
- **D-07 — Ship only `README.md` in the npm tarball.** `ARCHITECTURE.md`/`COMMANDS.md`/`MAINTAINING.md` stay out of `package.json` `files` (maintainer/GitHub-facing).

### Claude's Discretion
User delegated all areas (`--auto`). Downstream may refine *how* each decision is implemented — generator-vs-guarded for `COMMANDS.md` (D-02), exact test shape (D-03), README cluster groupings (D-04), architecture depth/diagrams (D-05), plan/wave batching — **as long as the decisions above hold**. Research is explicitly invited to pressure-test: (a) whether frontmatter `description:` blurbs are rich enough for DOCS-02, and (b) flat-root vs `docs/`.

### Deferred Ideas (OUT OF SCOPE)
- Device-runnable acceptance steps for the docs/commands/neutrality → Phase 11 (ACCEPT-*).
- A `CONTRIBUTING.md` / contributor onboarding guide.
- Auto-generated `ARCHITECTURE.md` diagrams or a fully-generated `COMMANDS.md` pipeline.
- Documenting still-deferred long-tail commands (`transition`, `ai-integration-phase`, autonomy cluster, ~70-skill parity) — not emitted, correctly absent from the 28.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCS-01 | `README.md` expanded (install, scope/modes, full 28-command list, flagged gaps) to maintainer standard, command list sourced from the generated roster | §1 (exact roster contract, 28 names), §3 (conformance test to keep it honest), §4 README parse shape; README already has the skeleton (`README.md` L53-89) |
| DOCS-02 | Per-command reference doc briefly explaining each of the 28 emitted commands | §2 (frontmatter `description:` is a clean, VERIFIED source for all 28 blurbs), §3 (coverage test), stem→`gsd-<stem>` mapping table |
| DOCS-03 | Architecture doc: converter/descriptor model, capability-map gate, backend-neutrality, `.planning/` interchange | §4 with concrete file:symbol/line anchors for all four axes; deleted-`CAPABILITY-MAP.md` landmine documented |
| DOCS-04 | `MAINTAINING` runbook: repeatable gsd-core version-bump procedure, sourced from the real 1.5.0 → 1.6.1 re-vendor | §5 — the 8 distilled steps already exist verbatim in `07-REVENDOR-NOTES.md` L284-296; cross-checked against `scripts/apply-bob-patches.cjs` + `scripts/generate-support-roster.cjs` |
</phase_requirements>

## Summary

Phase 10 is a **consume-don't-create** documentation phase. Every input already exists on disk: the generated 28-entry `SUPPORT-ROSTER.md`, the 28 pristine command sources with clean frontmatter `description:` fields, the live adapter code (`src/bob-adapter.cjs`, `src/installer/stage.cjs`), the vendored converters, `UPSTREAM.md`, and the 298-line `07-REVENDOR-NOTES.md` that was purpose-built to seed `MAINTAINING.md`. There is no new machinery, no external package, no web research, and no live Bob. The work is: author/expand four flat-root docs and add **one** hermetic doc-conformance test that pins the command lists to the generated roster so they cannot drift.

The single highest-leverage deliverable is the D-03 conformance test — it is what makes "maintainer standard" durable. The project already has a battle-tested idiom for exactly this: `test/command-expansion.test.cjs` Group D (L225-244) parses `SUPPORT-ROSTER.md`'s `## Supported` section and asserts the directory-derived stem set is fully listed. The new test reuses that parser and adds README-set and COMMANDS-set equality assertions. The one real landmine is the **deleted** `CAPABILITY-MAP.md`: `ARCHITECTURE.md` is the one doc tempted to cite it and must instead anchor on live code (`gateArtifact`/`buildSupportRoster`) plus the git-recoverable original.

**Primary recommendation:** Plan four authored/expanded docs guarded by one directory+roster-derived conformance test, reusing `command-expansion.test.cjs`'s roster-parse idiom verbatim. Source every command blurb from `commands/gsd/<stem>.md` frontmatter `description:` (VERIFIED clean & non-empty for all 28). Distill `MAINTAINING.md` from the ready-made 8-step recipe at `07-REVENDOR-NOTES.md` L284-296. Cite live code (not the dead `CAPABILITY-MAP.md` path) throughout `ARCHITECTURE.md`. Leave the three new docs out of the `package.json` `files` allowlist.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Command-list rendering (README/COMMANDS) | Docs (authored markdown) | Generated artifact (`SUPPORT-ROSTER.md`) | Lists are *derived* from a generated source; docs restate it, the roster owns truth |
| Per-command blurbs | Docs (authored markdown) | Source frontmatter (`commands/gsd/*.md description:`) | Single source of truth is the pristine frontmatter, not invention |
| Drift prevention | Test harness (`test/*.test.cjs`, node:test) | Repo-root generated `SUPPORT-ROSTER.md` | The conformance test is the enforcement tier that keeps docs honest |
| Architecture explanation | Docs (authored markdown) | Live code + git history | `ARCHITECTURE.md` cites live symbols; no runtime component changes |
| Version-bump runbook | Docs (authored markdown) | Scripts (`apply-bob-patches.cjs`, `generate-support-roster.cjs`) + Phase 7 log | Runbook narrates real executable steps; scripts own the mechanics |
| Packaging | `package.json` `files` allowlist | — | Only README ships; new docs are repo-only (D-07) |

**Note:** No component in this phase touches emit logic, the gate, the converter, or the neutralization pass. Every tier above is either *docs* or the *read-only test/artifact* it consumes.

## §1 — The Exact Roster Contract (ground truth for DOCS-01 + DOCS-02)

`SUPPORT-ROSTER.md` (repo root) is `[VERIFIED: read in session]`. It is generated — the banner says *"GENERATED — do not hand-edit. Regenerate with `node scripts/generate-support-roster.cjs`."*

### The 28 Supported commands (verbatim, in roster order)

```
gsd-audit-fix        gsd-explore          gsd-new-milestone    gsd-secure-phase
gsd-audit-uat        gsd-extract-learnings gsd-new-project     gsd-ship
gsd-code-review      gsd-fast             gsd-pause-work       gsd-spec-phase
gsd-complete-milestone gsd-health         gsd-plan-phase       gsd-stats
gsd-debug            gsd-map-codebase     gsd-progress         gsd-ui-phase
gsd-discuss-phase    gsd-milestone-summary gsd-quick           gsd-verify-work
gsd-docs-update      gsd-mvp-phase        gsd-resume-work
gsd-execute-phase                          (28 total)
```

Full alphabetical list `[VERIFIED: SUPPORT-ROSTER.md L21-48]`: gsd-audit-fix, gsd-audit-uat, gsd-code-review, gsd-complete-milestone, gsd-debug, gsd-discuss-phase, gsd-docs-update, gsd-execute-phase, gsd-explore, gsd-extract-learnings, gsd-fast, gsd-health, gsd-map-codebase, gsd-milestone-summary, gsd-mvp-phase, gsd-new-milestone, gsd-new-project, gsd-pause-work, gsd-plan-phase, gsd-progress, gsd-quick, gsd-resume-work, gsd-secure-phase, gsd-ship, gsd-spec-phase, gsd-stats, gsd-ui-phase, gsd-verify-work.

### The 2 Unsupported entries + reasons (verbatim `[VERIFIED: SUPPORT-ROSTER.md L52-53]`)

- `gsd-autonomous: unsupported on Bob: requires isolated subagent orchestration that Bob runs sequentially inline`
- `gsd-parallel-fanout: unsupported on Bob: requires isolated subagents; Bob runs subagents sequentially inline`

### Critical structural facts for the planner

1. **`commands/gsd/` holds exactly 28 `.md` files** `[VERIFIED: ls | wc -l = 28]` — and all 28 are Supported. There is a **1:1 map**: every `commands/gsd/<stem>.md` → roster `gsd-<stem>`. Filename basename is the stem; emitted name is always `gsd-<stem>` (regardless of the source frontmatter `name: gsd:<stem>` colon form).
2. **The 2 Unsupported entries are NOT files in `commands/gsd/`.** They are the two *curated edge cases* injected by `scripts/generate-support-roster.cjs` L44-47 to exercise the gate's skip paths. So `Supported set == commands/gsd stems` exactly, and `Unsupported set == {gsd-autonomous, gsd-parallel-fanout}` exactly. The planner should not expect an `autonomous.md` under `commands/gsd/` — there isn't one.
3. **README already lists these 2 unsupported in its Flagged-gaps section** `[VERIFIED: README.md L82-85]`. The conformance test must therefore scope README's *supported* extraction to the "Supported skills" section only, so a flagged-gap mention doesn't leak into the supported set (see §3).

## §2 — Per-Command Blurb Source (D-02) — VERIFIED extractable

**Finding: every command source carries a clean, non-empty, single-line frontmatter `description:`.** Sampled directly `[VERIFIED: head of 6 files]`:

| Source file | frontmatter `name:` | frontmatter `description:` (verbatim) |
|---|---|---|
| `commands/gsd/new-project.md` | `gsd:new-project` | Initialize a new project with deep context gathering and PROJECT.md |
| `commands/gsd/ship.md` | `gsd:ship` | Create PR, run review, and prepare for merge after verification passes |
| `commands/gsd/map-codebase.md` | `gsd:map-codebase` | Analyze codebase with parallel mapper agents to produce .planning/codebase/ documents |
| `commands/gsd/stats.md` | `gsd:stats` | Display project statistics — phases, plans, requirements, git metrics, and timeline |
| `commands/gsd/health.md` | `gsd:health` | Diagnose planning directory health and optionally repair issues |
| `commands/gsd/resume-work.md` | `gsd:resume-work` | Resume work from previous session with full context restoration |

**All 28 have a non-empty description — this is VERIFIED, not sampled-and-assumed:** `test/command-expansion.test.cjs` Group A (L119-135) asserts `assert.match(fm, /^description:\s*\S/m, 'non-empty description')` for **every** stem, and the suite is green (Phase 9 CMD-01/02/03 = Complete per REQUIREMENTS.md L200-202). So a generator can safely extract a clean blurb for all 28 with no hand-authoring fallback required.

### Frontmatter shape the planner/generator must handle

- `description:` is always a single unquoted line `[VERIFIED: 6 samples]`. Extraction idiom: match `^description:\s*(.+)$` (multiline) on the frontmatter block (between the first `---` and the next `---`).
- Some sources also carry `argument-hint:` (e.g. `new-project`, `ship`, `map-codebase`, `health`) `[VERIFIED]` — optional; a richer COMMANDS.md *could* append it, but D-02 only requires the description.
- Sources carry `allowed-tools:`, sometimes `effort:` (`stats.md` has `effort: low`), and `requires:` — all irrelevant to blurbs and all stripped by the Bob converter anyway `[VERIFIED: command-expansion.test.cjs L130-134 asserts effort/allowed-tools/agent/type/requires stripped]`.

**Pressure-test answer (Discretion a):** The frontmatter descriptions ARE rich enough for DOCS-02's "briefly explains each." They are the same one-liners GSD already surfaces as skill descriptions and read as clean sentences. **Recommendation:** author `COMMANDS.md` by extracting `description:` per stem (a ~30-line `scripts/generate-command-reference.cjs` mirroring `generate-support-roster.cjs`, OR a table authored once and guarded by the D-03 coverage test). Either satisfies D-02; the generator is marginally more drift-proof and matches the project's generated-not-hand-edited discipline, but the coverage test makes the authored variant equally safe. No hand-written per-command sentences needed.

## §3 — The Doc-Conformance Test (D-03) — concrete shape

**Idiom is already in-repo.** `test/command-expansion.test.cjs` Group D (L225-244) is a working roster-parser the new test should reuse near-verbatim `[VERIFIED: read]`:

```js
// Slice out ONLY the Supported section (a stem in an Unsupported reason line must not falsely satisfy)
const supHeadingIdx = roster.search(/^##\s+Supported\b/m);
const afterSup = roster.slice(supHeadingIdx);
const nextHeadingIdx = afterSup.slice(1).search(/^##\s+/m);
const supportedSection = nextHeadingIdx >= 0 ? afterSup.slice(0, nextHeadingIdx + 1) : afterSup;
```

### Established test conventions to mirror (`[VERIFIED]`)

- `node:test` + `node:assert/strict` (`const test = require('node:test'); const assert = require('node:assert/strict');`).
- Repo root via `const { repoRoot } = require('./_helpers/vendor.cjs');` (`repoRoot` = two levels up from `test/_helpers/` `[VERIFIED: test/_helpers/vendor.cjs L18]`).
- **Directory-derived, never a hardcoded name list** — enumerate stems from `commands/gsd/*.md` (`command-expansion.test.cjs` L55-59; `roster-capmap.test.cjs` L53-67). The single pinned literal `28` lives in exactly one guard (`command-expansion.test.cjs` L220: `assert.equal(stems.length, 28, ...)`); every other count derives from `stems.length`.
- Test file glob: `test/**/*.test.cjs` run via `npm test` (`node --test`) `[VERIFIED: package.json L23]`.

### Recommended assertions for `test/docs-conformance.test.cjs`

The test should assert **set equality** three ways, all derived (no magic list):

1. **Roster Supported set == `commands/gsd` stem set.** Parse the roster Supported section (idiom above); build `rosterSupported = Set(lines matching /^-\s+(gsd-[a-z0-9-]+)\s*$/m)`; build `stemSet = Set(readdir stems mapped to 'gsd-'+stem)`; `assert.deepEqual([...rosterSupported].sort(), [...stemSet].sort())`. (This is the drift spine; it also re-proves §1 fact #1.)
2. **DOCS-01 — README supported list == roster Supported set.** Extract all unique `gsd-[a-z0-9-]+` tokens from README's *supported* section ONLY (scope between the `## Supported skills` heading and the next `##` heading — mirror the roster-slice idiom so the `## Flagged gaps` mentions of `gsd-autonomous`/`gsd-parallel-fanout` are excluded). Assert the extracted set equals `rosterSupported`. **Also (optional, stronger):** assert README's flagged-gaps section names exactly the 2 roster Unsupported entries.
3. **DOCS-02 — COMMANDS.md covers exactly the 28.** Extract all unique `gsd-[a-z0-9-]+` tokens from `COMMANDS.md`; assert the set equals `rosterSupported` — no missing, no extra. (If COMMANDS.md also documents the 2 unsupported in a separate section, scope the extraction to the supported section the same way.)

**Planner guidance on README parse robustness:** author the README "Supported skills" list so each command appears as a backticked/bulleted `gsd-<name>` token (the current README already does this: `` - `gsd-new-project` `` at L61-70). The regex `gsd-[a-z0-9-]+` then extracts cleanly regardless of cluster grouping/prose. Grouping commands under cluster subheads (D-04) does not break the flat-token extraction.

**Slotting:** new file `test/docs-conformance.test.cjs`, same directory and style as the other 20 root-level test files; picked up automatically by the `test/**/*.test.cjs` glob. No harness changes.

## §4 — Architecture Doc Anchors (D-05 / DOCS-03) — the four axes with live anchors

All anchors `[VERIFIED: read in session]`. `ARCHITECTURE.md` should cite these live symbols; do NOT cite `CAPABILITY-MAP.md` (deleted — see landmine below).

### Axis 1 — Converter/descriptor model (vendor-as-source, transform-at-emit)
- **Roster-agnostic staging loop:** `src/installer/stage.cjs` — the "convertible-artifact loop" (L252-295). For each `commands/gsd/<stem>.md` it emits TWO Bob artifacts: a flat command `commands/gsd-<stem>.md` (L282-285) and a nested skill `skills/gsd-<stem>/SKILL.md` (L287-289), each via the vendored converter then the neutralization post-pass.
- **The two vendored Bob converters:** `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — `convertClaudeCommandToBobCommand` (impl L2427, exported L2462) and `convertClaudeCommandToBobSkill` (impl L2399, exported L2461); HAND-EDIT banner at L2338 `[VERIFIED: UPSTREAM.md L70-71 + revendor notes L236]`. Skill frontmatter reduced to Bob's `name` + `description` only.
- **Descriptor:** the `"bob"` registry entry at `gsd-core/bin/lib/capability-registry.cjs` L2876-2940 (`configHome` `dot-home` `.bob` + `BOB_CONFIG_DIR` env; `artifactLayout`; `commandStyle: slash-hyphen`) `[VERIFIED: UPSTREAM.md L69]`.
- **Framing:** `UPSTREAM.md` L1-42 — "an inventory, not a proposal of new architecture … Most of the Bob support is a **move** … the only hand-written logic is a small pair of Bob converters plus one isolated adapter module." Use this for the "move, not rewrite" narrative.

### Axis 2 — Capability-map gate (conservative lower-bound defaults)
- **Gate authority:** `src/bob-adapter.cjs` — `gateArtifact` (L325-345) and `buildSupportRoster` (L356-371). A candidate is Supported iff every required primitive is in the capability declaration AND it is not on `BOB_SKIP_LIST` (L298-302).
- **Conservative lower bound:** `BOB_CAPABILITY_DECL = { isolatedSubagents: false, structuredPrompts: false }` `[VERIFIED: src/installer/stage.cjs L42; also generate-support-roster.cjs L26]`. Reasons at `PRIMITIVE_REASONS` (L308-313): "requires isolated subagents; Bob runs subagents sequentially inline" / "requires structured prompts; Bob supports text_mode prompting only."
- **The two defaults, in prose for the doc:** no isolated subagents → sequential-inline execution; no structured-choice prompt → `text_mode` (numbered text choices). These map to the two Unsupported roster entries.
- **Loud-not-silent invariant:** every excluded artifact gets an `unsupported on Bob: <reason>` line (`UNSUPPORTED_MARKER` L27; roster render L79-104 in stage.cjs). `test/roster-capmap.test.cjs` proves the roster reasons are gate-generated, not hand-typed.

### Axis 3 — Backend-neutrality (model-neutralization pass)
- **The pass:** `src/bob-adapter.cjs` `neutralizeModelReferences` (L103-112) — three ordered ReDoS-safe replacements: (1) collapse a full vendor-prefixed model id to "the configured model" (L105), (2) strip residual model-directive lines (L106), (3) rewrite bare capability-tier prose to neutral wording (L107-110). Applied as a post-pass in `stage.cjs` L284/L289.
- **The NEUTRAL-03 zero-literal invariant:** `scanModelLiterals` (L132-147) is the shared detector; the invariant test is `test/model-neutrality.test.cjs` (canonical-refs names `test/model-neutrality.test.cjs`; note the roster/README also reference `test/backend-neutrality.test.cjs` which brace-walks the `bob` registry block). Both are `[VERIFIED: present in test/ listing]`.
- **Design point for the doc:** the adapter itself embeds **no bare model-brand literal** — tier tokens are decoded from base64 at runtime (`MODEL_TIER_TOKENS`, L41-43) so this backend-neutral module never ships a brand string. Bob owns model routing (RUNTIME-04).

### Axis 4 — `.planning/` interchange
- **Byte-compatibility contract:** RUNTIME-03 — `.planning/` artifacts produced under Bob are byte-compatible with those produced under Claude Code (REQUIREMENTS.md L25). Tests: `test/planning-bytecompat.test.cjs`, `test/core-loop-equivalence.test.cjs` `[VERIFIED: test/ listing]`.
- **Never pruned:** the installer never sweeps `.planning/` (`stage.cjs` L305-308, L335 guard against pruning `.planning/`). Reinforces that the interchange surface is user-owned and runtime-independent.
- **Root-anchored:** `workspaceRoot = process.cwd()` where `.planning/` lives, kept strictly separate from the package `repoRoot` payload source (`stage.cjs` L14-22, L118).

### LANDMINE — the deleted `CAPABILITY-MAP.md`
`[VERIFIED]`: the live path `.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` does **not exist** (`ls` → "No such file or directory"). It was deleted in commit `459d992`. `git show 459d992~1:.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` **successfully recovers it** (exit 0; opens with "# Bob Capability Map — Phase 1 … per-primitive documented capability decision record … conservative lower-bound default"). **`ARCHITECTURE.md` must source the gate rationale from `src/bob-adapter.cjs` (live) + `SUPPORT-ROSTER.md` + ROADMAP/PROJECT decision records, and — only if a verbatim quote is wanted — from the `git show` command above. It must NOT link a live `CAPABILITY-MAP.md` path.** Note: `stage.cjs` comments say "CAPABILITY-MAP §1/§2" (L37-41, L192-194) as *prose section references* — these are historical comment strings, not file links, and the doc should not turn them into a path.

## §5 — MAINTAINING Runbook Source (D-06 / DOCS-04) — the real dance, ready to distill

**The distilled recipe already exists verbatim.** `07-REVENDOR-NOTES.md` L284-296 ("Runbook seed — the replayable recipe (for Phase 10 / DOCS-04)") is an 8-step, exact-command sequence purpose-written to become `MAINTAINING.md` `[VERIFIED: read in full]`. `MAINTAINING.md` is a distillation of this section, not a fresh authoring. The 8 ordered steps:

1. **Capture provenance + test baseline.** Record git HEAD short SHA, current `gsd-core/VERSION`, target version, date (real example: SHA `d832efa`, `1.5.0` → `1.6.1`, notes L11-20). Record the `npm test` baseline BEFORE any mutation (real example: **186 pass / 3 fail**, notes L24-53).
2. **Pack (immutable, D-04):** `npm pack @opengsd/gsd-core@<new>` into a scratch tmp dir; `tar -xzf`; confirm payload root `package/gsd-core/{bin,contexts,references,templates,workflows}` by `ls` BEFORE copying (never assume). *Note the tarball ships NO `VERSION` file — the patch script writes it.*
3. **Nuke (D-05):** `rm -rf gsd-core/{bin,contexts,references,templates,workflows}` (the tracked curated 5-subdir subset).
4. **Restage (D-06):** `cp -R` the identical 5 subdirs from the extracted tarball; curated-subset boundary unchanged.
5. **Re-inject the six local deltas:** `node scripts/apply-bob-patches.cjs`. Prove idempotency: `git add gsd-core/`, run the script a **2nd** time (every step reports "already applied — no-op" / "0 changed"), then `git diff --quiet gsd-core/` (clean).
6. **Re-sync drifted `commands/gsd/*.md` sources** to the target version (the Phase 9 version-consistency lesson — CONTEXT.md D-06 step 5; canonical-refs 09-CONTEXT.md).
7. **Regenerate the roster:** `node scripts/generate-support-roster.cjs`.
8. **Run suites + drift policy + version bump:** run invariants FIRST (`node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` — must pass unmodified); then `npm test`, subtract the recorded baseline, classify each non-baseline failure (expected-drift → regenerate that fixture + one-line justification keyed by fixture name; regression → fix). Then bump `gsd-core/VERSION` and update `UPSTREAM.md`'s targeted version + re-verify all 6 file:line pointers against the new source (never copy stale line numbers).

### The six deltas `apply-bob-patches.cjs` re-injects `[VERIFIED: scripts/apply-bob-patches.cjs L17-24]`
1. colon→hyphen command form (`gsd:<cmd>` → `gsd-<cmd>`) over the `.md` doc tree
2. home-path normalization (`~/.claude` → `$HOME/.claude`) over the `.md` doc tree
3. `"bob"` runtime registry block → `bin/lib/capability-registry.cjs`
4. Bob converter code block (~105 lines) → `bin/lib/runtime-artifact-conversion.cjs`
5. both aliases: `"bob"` in `bin/shared/runtime-aliases.manifest.json` **and** `bob` in `bin/lib/runtime-name-policy.cjs` `FALLBACK_ALIASES`
6. local `VERSION` file → `gsd-core/VERSION` (real run wrote `1.6.1`; `TARGET_VERSION` constant at L46)

`gsd-core/VERSION` currently reads `1.6.1` `[VERIFIED: cat]`.

### Environment-specific caveats the runbook MUST frame correctly (not as failures)
`[VERIFIED: 07-REVENDOR-NOTES.md L35-53, L273-281, L296]`:
- **3 pre-existing baseline `npm test` failures are environmental noise, not regressions** — they read archived `.planning/` fixtures absent from the working tree (`acceptance-coverage.test.cjs:114`, `:128`; `core-loop-contract.test.cjs:126`). The runbook must say: *subtract this baseline; only NEW test IDs are re-vendor deltas.* Never "fix" them in a bump.
- **The stock `legacy-cleanup.cjs:225` `1.5.0` comment is a permanent expected exception** — an immutable upstream historical comment (Codex migration), byte-identical in the tarball. Every version-residue grep must exclude it (`grep -v 'legacy-cleanup.cjs:225:'`). Editing it would introduce an undocumented 7th delta that breaks idempotency.
- **`npm pack` requires network** (registry-signed immutable tarball).
- **The converters are LOCAL hand-edits** — a "does the function still exist upstream?" check is meaningless; the re-injection contract (grep-absent in tarball, present post-script) is what matters.
- **The guaranteed golden drift** is `test/installer/staged-shim-loads.test.cjs` (the staged `package.json` version fixture flips old→new) — expected, regenerate with a one-line justification.

**Tone (from CONTEXT.md specifics):** MAINTAINING reads like a checklist a maintainer runs — numbered steps, exact commands — not a narrative retrospective. The raw log's per-step exact commands (notes L68-97, L109-126, L171-217) are the source; distill, keep the `<old>`/`<new>` placeholders so it's replayable for the next bump.

## §6 — Packaging (D-07)

`package.json` `files` allowlist `[VERIFIED: package.json L9-17]`: `["bin/", "src/", "gsd-core/", "commands/", "scripts/", "README.md", "LICENSE"]`.

- **Only `README.md` ships among the docs** — confirmed. `ARCHITECTURE.md`, `COMMANDS.md`, `MAINTAINING.md` are NOT listed, so adding them at repo root **automatically keeps them out of the npm tarball** with zero allowlist change. This satisfies D-07 by default — the planner does nothing to the allowlist.
- **`SUPPORT-ROSTER.md` is also not in the allowlist** — it is a dev/repo-facing generated artifact (the installer regenerates its own copy into `.bob/` at stage time, `stage.cjs` L250). README links to it as a GitHub-relative link; that is fine for a repo reader.
- **If the planner chooses a generator** (`scripts/generate-command-reference.cjs`), note `scripts/` **is** allowlisted — the generator would ship in the tarball. Harmless (it is a dev tool), consistent with `generate-support-roster.cjs` already shipping. No action needed, but the planner should be aware the *generated output* `COMMANDS.md` still won't ship (root `.md` not listed), only the script.
- **Recommendation:** leave `files` untouched. Do not add the three new docs. If the planner later judges `COMMANDS.md` belongs in the shipped package for end users, add it explicitly (D-07's stated escape hatch) rather than by accident.

## Common Pitfalls

### Pitfall 1: Hand-typed command lists drift from the generated roster
**What goes wrong:** README/COMMANDS list is edited by hand and silently diverges from what actually installs (the whole reason DOCS-01 says "sourced from the generated roster").
**How to avoid:** The D-03 conformance test (§3) is the guard. Extract command tokens from the docs and assert set-equality with the roster Supported set. Make it directory-derived with a single pinned `28`.
**Warning sign:** a doc lists a `gsd-<name>` not in `commands/gsd/`, or omits one that is.

### Pitfall 2: Citing the deleted `CAPABILITY-MAP.md` path
**What goes wrong:** `ARCHITECTURE.md` links `.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` — a dead path — which is itself a maintainer-standard failure.
**How to avoid:** Anchor the gate section on live `src/bob-adapter.cjs` symbols (§4 Axis 2). Use `git show 459d992~1:…` only for a verbatim quote, and label it as git-recovered history.
**Warning sign:** any `](.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md)` link, or a bare "see CAPABILITY-MAP.md."

### Pitfall 3: COMMANDS.md misses or double-counts a command
**What goes wrong:** 27 or 29 entries; a duplicate; a stem typo.
**How to avoid:** D-03 assertion (3) — `COMMANDS.md` token set must equal the roster Supported set exactly (no missing, no extra). Prefer generating COMMANDS.md from the same directory the roster derives from.

### Pitfall 4: MAINTAINING reads aspirational instead of reflecting the real Phase 7 run
**What goes wrong:** a clean idealized runbook that omits the real gotchas (baseline noise, stock `legacy-cleanup.cjs` exception, network-for-pack, converters-are-hand-edits).
**How to avoid:** Bind every step to `07-REVENDOR-NOTES.md` (§5). Include the four caveats verbatim in intent. Keep exact commands.
**Warning sign:** a runbook with no "subtract the baseline" step or no `legacy-cleanup.cjs` exception note.

### Pitfall 5: README section scoping lets flagged-gaps leak into the supported assertion
**What goes wrong:** README names `gsd-autonomous`/`gsd-parallel-fanout` in the Flagged-gaps section (L82-85); a naive whole-file token scan pulls them into the "supported" set and the test either falsely passes or falsely fails.
**How to avoid:** Scope the README supported-extraction to the "Supported skills" section only (slice heading-to-next-heading, mirroring `command-expansion.test.cjs` L230-234). Optionally assert the flagged-gaps section names exactly the 2 Unsupported entries.

### Pitfall 6: `commit_docs: false` — planning docs are not auto-committed
**What goes wrong:** expecting the phase's planning artifacts (and possibly the RESEARCH/PLAN files) to be auto-committed.
**How to avoid:** `[VERIFIED: .planning/config.json commit_docs=false]`. The *deliverable* docs (README/COMMANDS/ARCHITECTURE/MAINTAINING) and the test ARE source files and should be committed via the normal execution commits; only `.planning/` docs skip auto-commit. Plan tasks should explicitly commit the four docs + the test.

## Code Examples

### Extract a command blurb from source frontmatter (for a generator or the coverage test)
```js
// Source pattern verified against commands/gsd/*.md frontmatter (§2)
const src = fs.readFileSync(path.join(cmdDir, `${stem}.md`), 'utf8');
const fmEnd = src.indexOf('---', 3);
const fm = src.substring(3, fmEnd);
const desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim(); // always present for all 28
// emitted command name is always `gsd-${stem}` (ignore the source's colon `name:` field)
```

### Parse the roster Supported section (reuse verbatim from command-expansion.test.cjs L230-243)
```js
const roster = fs.readFileSync(path.join(repoRoot, 'SUPPORT-ROSTER.md'), 'utf8');
const supHeadingIdx = roster.search(/^##\s+Supported\b/m);
const afterSup = roster.slice(supHeadingIdx);
const nextHeadingIdx = afterSup.slice(1).search(/^##\s+/m);
const supportedSection = nextHeadingIdx >= 0 ? afterSup.slice(0, nextHeadingIdx + 1) : afterSup;
const rosterSupported = new Set(
  [...supportedSection.matchAll(/^-\s+(gsd-[a-z0-9-]+)\s*$/gm)].map((m) => m[1]),
);
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | doc-conformance test, generator, roster/patch scripts | ✓ | v25.6.1 (engines `>=22.15.0`) | — |
| npm | `npm test`, `npm pack` (MAINTAINING only) | ✓ | 11.9.0 | — |
| git | `git show 459d992~1:…` for CAPABILITY-MAP recovery (doc-authoring aid) | ✓ | 2.51.0 | — |
| Live IBM Bob | (nothing in this phase) | ✗ | — | Test-deferred: doc-conformance is hermetic, no Bob needed |

**Missing dependencies with no fallback:** none — Phase 10 is doc authoring + one hermetic node:test; no external service or new package.
**Note:** `npm pack` (MAINTAINING step 2) requires network, but that is a *documented* runbook step, not a Phase-10 execution dependency — the phase writes the runbook, it does not run a re-vendor.

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` `[VERIFIED: config.json]`. This is a docs + hermetic-test phase with no auth, no network handling, no user-supplied runtime input, and no crypto. Most ASVS categories are N/A.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access-control surface |
| V5 Input Validation | minor | The conformance test reads local repo files (`SUPPORT-ROSTER.md`, `commands/gsd/*.md`, the docs) via fixed relative paths from `repoRoot`; no external/untrusted input. Follow the existing `test/_helpers/vendor.cjs` `repoRoot` resolution rather than raw `process.cwd()` joins. |
| V6 Cryptography | no | None (never hand-roll — N/A here) |

### Known Threat Patterns for {node:test doc tooling}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal when a generator writes `COMMANDS.md` | Tampering | Write only to a fixed `repoRoot`-relative path (mirror `generate-support-roster.cjs` L99-100 `path.join(__dirname, '..', 'SUPPORT-ROSTER.md')`); never interpolate a stem into a write path unescaped |
| Regex ReDoS in doc parsers | Denial of Service | Use the linear, anchored patterns from §3/Code Examples; the project already enforces ReDoS-safe patterns (`bob-adapter.cjs` L49/L57 notes) |

## State of the Art

Not applicable in the usual sense (no framework/version churn). The only "current vs prior" relevant fact:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| README hand-lists 10 commands | README sources the full 28 from the generated roster, guarded by a conformance test | This phase (DOCS-01/D-03) | Docs provably cannot drift from what installs |
| Gate rationale lived in `CAPABILITY-MAP.md` | Rationale lives in live code (`gateArtifact`/`buildSupportRoster`); the map file was deleted in `459d992` | v2.0-start cleanup | ARCHITECTURE.md cites live code + git history, not a dead path |
| Targeted gsd-core `1.5.0` | Targeted gsd-core `1.6.1` (`gsd-core/VERSION`) | Phase 7 | MAINTAINING documents the exact 1.5.0→1.6.1 dance |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The neutrality invariant test file is named `test/model-neutrality.test.cjs` (canonical-refs) — README/roster instead reference `test/backend-neutrality.test.cjs`. Both exist in `test/`. | §4 Axis 3 | LOW — ARCHITECTURE.md should cite whichever it links by opening the file; both are present, so no dead link. Planner/executor: open the file before citing a specific assertion. |
| A2 | A generator for `COMMANDS.md` is optional (D-02 permits authored-then-guarded). Recommending generator as marginally safer, not mandatory. | §2 | LOW — either path is guarded by the D-03 coverage test; no requirement is missed. |

**All other claims are `[VERIFIED: read in session]` against real files/lines. This table is intentionally short.**

## Open Questions

1. **Flat-root vs `docs/` layout (Discretion b).**
   - What we know: D-01 defaults to flat root; the repo already keeps `README.md`/`UPSTREAM.md`/`SUPPORT-ROSTER.md` at root.
   - What's unclear: pure aesthetics; nothing technical forces `docs/`.
   - Recommendation: **flat root** — matches the repo, keeps cross-links simple, and the conformance test's paths stay trivial. Only move to `docs/` if the planner adds many more docs later (out of scope here).

2. **Generator script vs authored-then-guarded for COMMANDS.md (Discretion a).**
   - What we know: frontmatter descriptions are clean & complete for all 28 (§2, VERIFIED).
   - What's unclear: whether the maintainer audience prefers a visibly-generated file or a curated table.
   - Recommendation: a small `scripts/generate-command-reference.cjs` mirroring `generate-support-roster.cjs` (drift-proof, matches project discipline), OR an authored table guarded by the D-03 coverage test. Both acceptable; the coverage test makes them equivalently safe.

## Sources

### Primary (HIGH confidence) — all read in session
- `SUPPORT-ROSTER.md` — the 28 Supported + 2 Unsupported ground truth (L19-53)
- `src/bob-adapter.cjs` — `gateArtifact`/`buildSupportRoster`/`neutralizeModelReferences`/`scanModelLiterals`/`BOB_SKIP_LIST`/`PRIMITIVE_REASONS`
- `src/installer/stage.cjs` — convertible loop, roster render, `.planning/` guards, capability decl
- `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — anchors via UPSTREAM.md (converters L2399/L2427)
- `UPSTREAM.md` — move-not-rewrite framing + 6-artifact inventory with 1.6.1 file:lines
- `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` — the 8-step runbook seed (L284-296) + baseline/caveats
- `scripts/generate-support-roster.cjs` — roster generation + curated edge cases (L44-55)
- `scripts/apply-bob-patches.cjs` — the six deltas (L17-24), `TARGET_VERSION` (L46)
- `test/command-expansion.test.cjs` — roster-parse idiom (L225-244), directory-derived stems (L55-59), pinned-28 (L220)
- `test/roster-capmap.test.cjs` — candidate-derivation + gate-reason-traceability idiom
- `test/_helpers/vendor.cjs` — `repoRoot` resolution convention
- `commands/gsd/*.md` (6 sampled) — frontmatter `description:`/`name:`/`argument-hint:` shape
- `package.json` — `files` allowlist, test glob, engines
- `.planning/config.json` — `commit_docs:false`, `nyquist_validation:false`, `security_enforcement:true`
- `.planning/REQUIREMENTS.md` — DOCS-01..04 verbatim + traceability
- git: `git show 459d992~1:.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` (recovers deleted file, exit 0); `ls` confirms live path absent

### Secondary / Tertiary
- None. No web search or external source was needed or used — the phase is fully grounded in-repo.

## Metadata

**Confidence breakdown:**
- Roster contract (§1): HIGH — read verbatim, cross-checked against `commands/gsd/` count and the generator.
- Blurb source (§2): HIGH — sampled 6 + VERIFIED by the green `command-expansion.test.cjs` Group A assertion over all 28.
- Conformance test (§3): HIGH — reuses an existing, working in-repo idiom.
- Architecture anchors (§4): HIGH — every symbol read; deleted-file landmine verified both ways (ls absent + git recovers).
- MAINTAINING source (§5): HIGH — the 8-step recipe exists verbatim; cross-checked against both scripts.
- Packaging (§6): HIGH — `files` allowlist read directly.

**Research date:** 2026-07-03
**Valid until:** stable — no external deps; only invalidated if the roster/`commands/gsd/` set changes (which would be a new phase) or the adapter is refactored.
