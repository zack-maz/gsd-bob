# Phase 9: Command Expansion - Research

**Researched:** 2026-07-03
**Domain:** Vendoring pristine gsd-core command sources + proving existing roster-agnostic gates hold at 28 commands (source-only phase, no machinery)
**Confidence:** HIGH (all findings verified by reading the live code + the immutable `@opengsd/gsd-core@1.6.1` tarball this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **F-01..F-05 (grounding facts, drive every decision):** sources ship at `package/commands/gsd/*.md` in the 1.6.1 tarball (69 total, all 18 present); `commands/gsd/*.md` are VERBATIM upstream (colon form, `~/.claude`, full frontmatter) with all Bob rewrites done at EMIT time; the 10 current sources are version-mixed (6 byte-identical, 4 drifted); `Agent`-using commands stay Supported (degrade to sequential-inline), only autonomy-cluster is flag-skip; the roster + NEUTRAL-03 invariant auto-cover additions with zero new wiring.
- **D-01 — Vendor all 18 from the immutable `@opengsd/gsd-core@1.6.1` tarball's `commands/gsd/`**, dropped in pristine, using the `npm pack @1.6.1` fetch discipline Phase 7 established (node-builtins, no hand-authoring of command bodies).
- **D-02 — Re-sync the 4 DRIFTED existing sources** (`code-review`, `debug`, `audit-fix`, `audit-uat`) to their 1.6.1 tarball versions in the same pass, so all 28 sources land on one consistent 1.6.1 version (SYNC-01 spirit). Research may narrow this only if a specific 1.6.1 change breaks a Bob assumption — default is converge to 1.6.1.
- **D-03 — Default every one of the 18 to Supported; degrade, don't skip.** Subagent orchestration degrades to sequential-inline, prompts to `text_mode`; converter emits unchanged.
- **D-04 — Flag-skip ONLY a command that cannot function at all without isolated subagents + completion signals** (autonomy precedent). Expectation: all 18 Supported. Any skip carries an explicit `unsupported on Bob: <reason>` roster line.
- **D-05 — Extend the existing roster-derived, table-driven equivalence/golden harness to iterate the full `commands/gsd/*` set** rather than authoring 18 bespoke goldens. Keep the real-answer guard on any command that captures user input.
- **D-06 — Rely on the Phase 8 NEUTRAL-03 invariant** to cover model-neutrality with zero new wiring; confirm it stays green at 28 and catches any inline `opus`/`sonnet`/`haiku` a new source drags in.
- **D-07 — Assert the emitted count is exactly 28** (`.bob/commands/gsd-*.md`) against the expected roster, plus the Supported/skip split matches the regenerated roster.
- **D-08 — Regenerate `SUPPORT-ROSTER.md` via `node scripts/generate-support-roster.cjs`; never hand-edit.** Commit the regenerated roster as a generated artifact.

### Claude's Discretion
User delegated all areas (`--auto`). Downstream may refine HOW each decision is implemented — exact per-command gate classification, precise harness parametrization, plan/wave batching, and whether the 4-source re-sync is its own plan or folded into the vendor plan — as long as the decisions hold. Research was explicitly invited to pressure-test (a) D-04's "all 18 Supported" and (b) D-02's blanket "converge the 4 drifted to 1.6.1." **Both pressure-tests PASS with evidence (see Q2, Q5 below).**

### Deferred Ideas (OUT OF SCOPE)
- `transition` (LIFE-01 remainder), `ai-integration-phase` (SHAPE-01 remainder) — not among the 18.
- Autonomy cluster `autonomous`/`manager`/`workstreams` (AUTO-01) — orchestration-locked; deferred (`autonomous` already a roster flag-skip).
- Full ~70-skill parity (PARITY-01).
- Install-time prose-neutralization of the copied `.bob/gsd-core/**` payload (Phase 8 deferred D-01).
- Any change to the converter, installer staging engine, or capability-map gate logic — this phase adds *sources*, not machinery.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMD-01 | Vendor the 18 into `commands/gsd/`; unchanged installer emits; 10→28 total | Q1 (exact fetch mechanism), Q3 (emission is purely additive — zero gate/stage change), Q4b (count==28 assertion) |
| CMD-02 | Each passes the capability-map gate (Supported or flag-skip w/ reason); regenerated `SUPPORT-ROSTER.md` reflects all 28 | Q2 (per-command gate table — all 18 Supported), Q3 (gate is name+`requires[]` based, not tool-inspecting), Q4/Q6 (roster regen + two-roster note) |
| CMD-03 | Expanded set holds `.planning/` contract (per-command equivalence/golden + real-answer guard) + model-neutral output | Q4 (harness extension), Q5 (re-sync forces fixture regen), Q6 (neutrality auto-covers; all 18 already zero-literal) |
</phase_requirements>

## Summary

Phase 9 is a **source-only, mechanical vendoring phase**. Every piece of machinery it needs — the converter, the roster-agnostic staging loop, the capability gate, the roster generator, and the Phase 8 model-neutrality invariant — already exists and is **derived from `commands/gsd/*.md` on disk**, so it auto-consumes new sources with zero code change. I verified this directly: `stage.cjs`'s convertible loop (`src/installer/stage.cjs:264-295`) iterates `commands/gsd/*.md`, gates each with `requires: []`, and emits `commands/gsd-<stem>.md` + `skills/gsd-<stem>/SKILL.md` wrapped in `neutralizeModelReferences(...)`. `scripts/generate-support-roster.cjs` derives its candidate set from the same directory. All 18 targets are confirmed present in the `@opengsd/gsd-core@1.6.1` tarball, and **none carries a model literal** except `stats` (an `effort: low` frontmatter line that the converter strips at emit anyway).

The two pressure-tests CONTEXT invited both pass. **(Q2/D-04)** The gate does NOT inspect `allowed-tools`/`Agent`/`AskUserQuestion` — it decides "unsupported" solely via a name-based `BOB_SKIP_LIST` (only `gsd-autonomous`) plus an explicit `requires[]` primitive array that the derived candidates always set to `[]`. Therefore all 18 (including `map-codebase`'s 5 Agents, `resume-work`'s `SlashCommand`, and every `AskUserQuestion` command) classify **Supported** by construction — none is in the autonomy cluster, none hits the skip list. **(Q5/D-02)** The 4 drifted sources changed only trivially 1.5.0→1.6.1: added frontmatter keys (`requires`, `type: prompt`) that the converter strips, and removed 1-2 trailing blank lines. No new subagent dependency, prompt primitive, or model directive enters the emitted body. Converging to 1.6.1 is safe — **but the trailing-blank-line removal changes the emitted body, so the 8 frozen quality-gate golden fixtures MUST be regenerated** (this is the one non-obvious task the re-sync introduces).

**Primary recommendation:** Two coarse plans — (1) a vendor+re-sync plan (fetch 18 pristine + re-sync 4, regenerate roster, regenerate the 8 quality-gate fixtures), (2) a verification plan (a new directory-derived structural equivalence suite over all 28, a `count==28` assertion, and a re-run of the NEUTRAL-03 invariant). No `src/` or `gsd-core/` edits. Surface one decision to the planner: the installed `.bob/SUPPORT-ROSTER.md` (from `stage.cjs renderRoster`) uses a hardcoded 5-entry representative list, NOT the directory — so it will NOT show 28 unless the staging engine is touched (see Q6 Open Question).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch pristine 1.6.1 sources | Build/tooling (`npm pack` + node:fs) | — | Immutable-tarball discipline from Phase 7; no runtime involvement |
| Vendor drop into `commands/gsd/` | Source tree | — | F-02: sources are verbatim upstream; transform happens later |
| Colon→hyphen, `.claude`→`.bob`, frontmatter reduction | Converter (`gsd-core/bin/lib/runtime-artifact-conversion.cjs`) | — | Emit-time transform; READ-ONLY this phase |
| Model neutralization | Adapter (`src/bob-adapter.cjs` `neutralizeModelReferences`) | Staging loop wrap | Phase 8 post-pass; auto-applies to new emissions |
| Support classification (Supported/skip) | Adapter gate (`gateArtifact`) | Roster generator | Name + `requires[]` based; not tool-inspecting |
| Emission (commands + skills) | Staging engine (`src/installer/stage.cjs`) | — | Roster-agnostic directory loop; READ-ONLY this phase |
| Roster generation | `scripts/generate-support-roster.cjs` | — | Directory-derived; RUN (regenerate), not rewrite |
| Verification | `test/**` | — | Extend with directory-derived structural suite + count + neutrality re-run |

## Standard Stack

No external packages are added or evaluated this phase. The toolchain is fixed by CLAUDE.md and already present: **Node `>=22.15.0`** (verified `package.json engines`), **CommonJS `.cjs`**, **node builtins only** (`node:fs`, `node:path`, `node:child_process`), single runtime dep `js-yaml@4.1.0` (adapter-only). Test runner is `node --test "test/**/*.test.cjs"` (built-in `node:test` + `node:assert/strict`) — verified `package.json scripts.test`. `npm pack` is a build-time fetch of an already-vetted vendored package, not a new dependency.

**Version verification:** `@opengsd/gsd-core@1.6.1` fetched via `npm pack @opengsd/gsd-core@1.6.1` this session `[VERIFIED: npm registry]`; tarball ships `package/commands/gsd/*.md` (69 files) `[VERIFIED: tar tzf this session]`; all 18 targets present (18/18) `[VERIFIED: this session]`.

## Package Legitimacy Audit

Not applicable. This phase installs **no external packages**. `@opengsd/gsd-core@1.6.1` is the project's own already-vendored upstream (verified present in the local tree and on the npm registry, `[VERIFIED]` in Phase 7); `js-yaml@4.1.0` is a pre-existing, adapter-scoped dependency, unchanged. No new `dependencies` or `devDependencies` are introduced.

## Architecture Patterns

### System Data-Flow Diagram

```
                 npm pack @opengsd/gsd-core@1.6.1  (immutable tarball, build-time)
                                 │
                                 ▼
             tar extract  →  package/commands/gsd/<stem>.md  (69 pristine sources)
                                 │  copy 18 targets (+ re-sync 4) via node:fs
                                 ▼
   commands/gsd/*.md  ──────────────────────────────────  (VERBATIM upstream; 10 → 28)
        │                                                            │
        │ (a) roster path                            (b) emit path   │
        ▼                                                            ▼
  scripts/generate-support-roster.cjs                    src/installer/stage.cjs
   derives candidates from dir                            convertible loop (L264-295)
   → gateArtifact(requires:[])                            for each *.md:
   → SUPPORT-ROSTER.md (repo root, 28)                      gateArtifact({name,requires:[]})  ── Supported ──┐
                                                             convertClaudeCommandToBobCommand ─┐             │
                                                             convertClaudeCommandToBobSkill  ──┤             │
                                                                    │                          ▼             ▼
                                                                    │             neutralizeModelReferences (Phase 8 post-pass)
                                                                    ▼                          │
                                                    .bob/commands/gsd-<stem>.md (28)  ◄────────┘
                                                    .bob/skills/gsd-<stem>/SKILL.md (28)
                                                                    │
                                                                    ▼
                                          test/model-neutrality.test.cjs (NEUTRAL-03)
                                          scans commands/ + skills/ → ZERO model literals
```

The gate authority (`gateArtifact`) and the converter are shared by BOTH paths, so the roster and the emitted set can never disagree on which commands are Supported.

### Recommended Project Structure (touched/created files)
```
commands/gsd/                       # +18 new .md, 4 re-synced (source tree; the only "product" change)
SUPPORT-ROSTER.md                   # regenerated (repo root; 10→28 supported)
test/fixtures/quality-gates/        # 8 fixtures REGENERATED after re-sync (blank-line drift)
test/command-expansion.test.cjs     # NEW: directory-derived structural equivalence + count==28
test/model-neutrality.test.cjs      # UNCHANGED (auto-covers the 18; re-run to confirm green)
```

### Pattern 1: Directory-derived candidate set (the drift-proof spine)
**What:** Both the roster generator and the staging loop read `commands/gsd/*.md` from disk and map each `<stem>.md → { name: 'gsd-'+stem, requires: [] }`. Adding a source file is the ENTIRE product change; every gate/emit/roster consumer picks it up automatically.
**When to use:** Every task in this phase. Never hardcode the 28-name list anywhere new — derive it.
```javascript
// Source: scripts/generate-support-roster.cjs:32-38 (verified this session)
const derivedCandidates = fs.readdirSync(commandsDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ name: `gsd-${path.basename(f, '.md')}`, requires: [] }));
```

### Pattern 2: Vendor-as-source, transform-at-emit (F-02)
**What:** `commands/gsd/*.md` stay byte-verbatim upstream (colon `name: gsd:<cmd>`, `~/.claude`, full `allowed-tools`/`type`/`requires` frontmatter). The converter reduces frontmatter to the Bob whitelist (`description` + `argument-hint` for commands; `name` + `description` for skills) and rewrites `.claude→.bob`, `gsd:→gsd-`, `$ARGUMENTS→$1` at emit; the Phase 8 post-pass neutralizes model refs. **Never pre-transform a vendored source.**

### Anti-Patterns to Avoid
- **Editing the converter or `stage.cjs` to "wire in" the 18.** They already iterate the directory — any edit forks gsd-core and breaks the move-not-rewrite story (CLAUDE.md: `runtime-artifact-conversion.cjs` must NOT be edited).
- **Authoring 18 bespoke byte-golden fixtures.** D-05 forbids it; use a directory-derived structural suite.
- **Hand-editing `SUPPORT-ROSTER.md`.** It is generated; regenerate via the script (D-08).
- **Hardcoding `28` in multiple places.** Derive expected count from `commands/gsd/*.md` length; keep exactly ONE explicit "28 sources exist" guard to nail CMD-01.
- **Hand-writing the re-synced quality-gate fixtures.** Regenerate them by running the converter on the new 1.6.1 sources and freezing the output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pull pristine sources | A bespoke downloader/patcher script | `npm pack @opengsd/gsd-core@1.6.1` + `tar` + `node:fs` copy | Immutable, reproducible, node-builtins; matches Phase 7 discipline (CLAUDE.md: no unnecessary scripts) |
| Colon→hyphen / path / frontmatter rewrite | Any new transform | The vendored converters (auto-run by `stage.cjs`) | Already exist, tested, READ-ONLY |
| Model neutralization for new commands | A second neutrality check | The Phase 8 `neutralizeModelReferences` post-pass + NEUTRAL-03 invariant | Auto-covers the 18 (F-05) |
| Support classification | Tool/frontmatter inspection logic | `gateArtifact` (name + `requires[]`) | Deliberately conservative; adding it would BE a machinery change (out of scope) |
| Roster | Hand-typed 28-line list | `node scripts/generate-support-roster.cjs` | Directory-derived, drift-proof (D-08) |

**Key insight:** In this codebase the "expensive" work was done in Phases 2-8. Phase 9's correct posture is to add 18 files, run two generators, regenerate 8 fixtures, and add ~3 assertions — nothing more.

## Open Questions

Answers to the 6 questions the planner needs:

### Q1 — Fetch mechanism (D-01): exact reproducible node-builtins pull

The reference is `scripts/apply-bob-patches.cjs` (Phase 7): it re-injects local deltas *over* a restaged tarball but does NOT itself fetch. Fetching in Phase 7 was done manually via `npm pack` (07-02 plan: "npm pack @1.6.1 → nuke-and-restage the curated subset"). **A dedicated helper script is NOT warranted** (CLAUDE.md: no unnecessary scripts) — the operation is a one-time bounded copy of 22 files, best expressed as a documented manual sequence that the plan runs and a test verifies byte-identity. Exact sequence (verified working this session):

```bash
# 1. Fetch the immutable tarball into a scratch dir (NOT the repo tree)
cd "$(mktemp -d)" && npm pack @opengsd/gsd-core@1.6.1
tar xzf opengsd-gsd-core-1.6.1.tgz          # → ./package/commands/gsd/*.md

# 2. Copy the 18 NEW targets pristine into the repo (node:fs cpSync or cp)
#    stems: new-milestone complete-milestone milestone-summary quick fast ship
#    explore spec-phase mvp-phase map-codebase ui-phase secure-phase
#    extract-learnings docs-update health stats resume-work pause-work
for c in <18 stems>; do cp package/commands/gsd/$c.md <repo>/commands/gsd/$c.md; done

# 3. Re-sync the 4 DRIFTED sources (D-02) from the SAME tarball
for c in code-review debug audit-fix audit-uat; do cp package/commands/gsd/$c.md <repo>/commands/gsd/$c.md; done
```

**Byte-identity verification (the checkpoint gate):** after copy, assert each vendored file is byte-identical to the tarball source:
```bash
for c in <all 22 stems>; do diff -q <repo>/commands/gsd/$c.md package/commands/gsd/$c.md || echo "DRIFT: $c"; done
```
Optionally add a hermetic test that re-runs `npm pack` in a scratch dir and diffs — but a plan-time checkpoint is sufficient and avoids a network dependency in the test suite (tests must stay offline/hermetic per the existing suite convention). **Recommendation:** documented manual sequence + a plan checkpoint that runs the `diff -q` loop and shows zero drift. Do NOT write a persistent fetch script.

### Q2 — Per-command capability-gate classification (all 18 + 2 skip fixtures)

`allowed-tools`, `Agent`/`AskUserQuestion` usage, and predicted verdict (verified from the 1.6.1 tarball this session). **The gate does not read any of these columns** (see Q3) — they are shown to *pressure-test* D-04, not because the gate consumes them:

| # | Command | `allowed-tools` | Uses `Agent` | Uses `AskUserQuestion` | Predicted verdict |
|---|---------|-----------------|:---:|:---:|-------------------|
| 1 | new-milestone | Read Write Bash Agent AskUserQuestion | ✓ | ✓ | **Supported** |
| 2 | complete-milestone | Read Write Bash (`type: prompt`) | — | — | **Supported** |
| 3 | milestone-summary | Read Write Bash Grep Glob (`type: prompt`) | — | — | **Supported** |
| 4 | quick | Read Write Edit Glob Grep Bash Agent AskUserQuestion | ✓ | ✓ | **Supported** |
| 5 | fast | Read Write Edit Bash Grep Glob | — | — | **Supported** |
| 6 | ship | Read Bash Grep Glob Write AskUserQuestion | — | ✓ | **Supported** |
| 7 | explore | Read Write Bash Grep Glob Agent AskUserQuestion | ✓ | ✓ | **Supported** |
| 8 | spec-phase | Read Write Bash Glob Grep AskUserQuestion | — | ✓ | **Supported** |
| 9 | mvp-phase | Read Write Bash Glob Grep Agent AskUserQuestion | ✓ | ✓ | **Supported** |
| 10 | map-codebase | Read Bash Glob Grep Write Agent (5 Agent refs) | ✓ | — | **Supported** (F-04 precedent) |
| 11 | ui-phase | Read Write Bash Glob Grep Agent WebFetch AskUserQuestion mcp__context7__* | ✓ | ✓ | **Supported** |
| 12 | secure-phase | Read Write Edit Bash Glob Grep Agent AskUserQuestion | ✓ | ✓ | **Supported** |
| 13 | extract-learnings | Read Write Bash Grep Glob Agent (`type: prompt`) | ✓ | — | **Supported** |
| 14 | docs-update | Read Write Edit Bash Glob Grep Agent AskUserQuestion | ✓ | ✓ | **Supported** |
| 15 | health | Read Bash Write AskUserQuestion | — | ✓ | **Supported** |
| 16 | stats | Read Bash (`effort: low`) | — | — | **Supported** |
| 17 | resume-work | Read Bash Write AskUserQuestion SlashCommand | — | ✓ | **Supported** |
| 18 | pause-work | Read Write Bash | — | — | **Supported** |
| — | gsd-autonomous (skip fixture) | n/a | n/a | n/a | **flag-skip** (`BOB_SKIP_LIST` name match) |
| — | gsd-parallel-fanout (skip fixture) | n/a | n/a | n/a | **flag-skip** (`requires: ['isolatedSubagents']`, unmet) |

**Verdict: all 18 Supported — D-04's expectation confirmed with evidence.** None of the 18 is `gsd-autonomous` or `gsd-parallel-fanout`; none carries a `requires[]` pointing at an unmet primitive (the derived candidate always uses `requires: []`). `map-codebase` (5 Agents) is exactly the F-04 precedent — `new-project` (already Supported) also uses `Agent`. **Two items to note (not skips, but flag for the planner):**
- `resume-work` declares the `SlashCommand` tool (skill→command invocation). CLAUDE.md lists "whether Bob skills can invoke a slash command" as UNVERIFIED. Under the conservative gate it is still Supported (the orchestration degrades at runtime), but this is a genuine on-device unknown worth an ACCEPT-* note in Phase 11.
- `ui-phase` declares `mcp__context7__*` (an MCP tool) and `WebFetch`. Both are stripped from the emitted frontmatter; no gate impact.

### Q3 — Gate reality-check: how does a command become "unsupported"?

**The gate does NOT inspect `allowed-tools`, `Agent`, or `AskUserQuestion`.** Verified from `src/bob-adapter.cjs:325-345`. `gateArtifact(candidate, decl)` returns `unsupported` on exactly three conditions, in order:
1. `candidate` is null / has no string `name` (defensive; WR-04).
2. `candidate.name` is a key in the hardcoded `BOB_SKIP_LIST` — currently the SINGLE entry `'gsd-autonomous'` (`bob-adapter.cjs:298-302`).
3. `candidate.requires[]` contains a primitive that `decl` marks false (`isolatedSubagents`/`structuredPrompts` both false under Bob's lower bound).

Both the roster generator (`generate-support-roster.cjs:37`) and the staging loop (`stage.cjs:275`) construct derived candidates with **`requires: []` hardcoded**, so condition 3 can never fire for a directory-derived command. The only skip vectors are the name-based skip list and the two *manually-injected* curated edge-case fixtures (`gsd-autonomous`, `gsd-parallel-fanout`) that the generator/roster-tests add on top of the derived set to keep exercising the skip paths.

**Consequence for the planner:** adding 18 Supported commands is **purely additive — ZERO gate change, ZERO stage change**. No new `BOB_SKIP_LIST` entry, no `requires[]` wiring. This is the single most load-bearing fact for scoping: the phase cannot need a gate edit unless one of the 18 were genuinely orchestration-locked, and none is (Q2).

### Q4 — Verification harness extension (CMD-03, D-05)

Current state of the relevant harness (all verified this session):
- **Equivalence/golden is NOT yet directory-derived.** `test/core-loop-equivalence.test.cjs` hardcodes a 6-name list; `test/quality-gate-equivalence.test.cjs` hardcodes a 4-name list; each references frozen per-stem `.expected.md` byte fixtures under `test/fixtures/`. So the original 10 have byte-goldens; there is NO existing test that iterates the whole `commands/gsd/*.md` directory for equivalence.
- **The roster tests ARE directory-derived.** `test/roster-capmap.test.cjs:53-67` re-derives candidates from the directory exactly like the generator — so the roster/skip assertions auto-cover the 18 with no change (they just need re-running).
- **`test/model-neutrality.test.cjs` IS directory/emission-derived** (group (c) scans the full real `stage()` emission of `commands/` + `skills/`) — auto-covers the 18 (F-05, D-06). No change; re-run to confirm green.
- **There is NO existing `count == N` assertion for emitted commands.** `test/installer/install-clean.test.cjs` runs the real entry into a scratch `.bob/` and checks structural presence (roster written, manifest non-empty, one `gsd` slug) but never counts `commands/gsd-*.md`.

**(a) Extend equivalence/golden to the full 28 — table-driven, drift-proof (D-05).** Author ONE new suite (e.g. `test/command-expansion.test.cjs`) that reads `commands/gsd/*.md` from disk, converts each with `convertClaudeCommandToBobCommand`/`...Skill`, and asserts the STRUCTURAL contract per command — the same assertions the existing equivalence suites make, minus frozen byte-goldens:
  - command frontmatter has a non-empty `description`, keeps `argument-hint` IFF the source declared one, strips `effort`/`allowed-tools`/`agent`/`type`/`requires`;
  - skill frontmatter has `name` + non-empty `description` only;
  - body carries no `.claude/` path ref and no `gsd:` colon dialect; carries `.bob` + `gsd-` hyphen form;
  - the emitted output has zero model literals (reuse `scanModelLiterals`).
  This auto-covers additions forever. Keep the existing core-loop/quality-gate byte-golden suites as regression anchors for the original 10 (do NOT add 18 more byte fixtures).

**(b) Assert emitted count == 28.** Run `stage()` into a scratch target (reuse the `test/model-neutrality.test.cjs` / `test/installer/stage.test.cjs` scratch-tmpdir harness) and assert:
  - `commands/gsd-*.md` count === number of `commands/gsd/*.md` sources that gate Supported (== 28), AND
  - `skills/gsd-*/SKILL.md` count === 28, AND
  - one explicit guard that `commands/gsd/` contains exactly 28 `.md` files (nails CMD-01's "10→28"; mirror `acceptance-coverage.test.cjs`'s "structural parity, not a brittle magic count" style by deriving the emitted-vs-source equality, then pin the 28 once).

**(c) Neutrality invariant auto-covers.** `test/model-neutrality.test.cjs` group (c) already scans the full emission. Re-run it; it will stay green because all 18 sources are zero-literal (Q6). No wiring.

**Real-answer guard — which of the 18 need it.** The D-05 real-answer guard (Phase 4) is a *golden-artifact* check: `core-loop-equivalence.test.cjs:114` asserts a frozen `PROJECT.md` carries a sentinel real answer and no `TODO`/`placeholder`/`{{` markers — proving `text_mode` capture yields a real artifact, not a stub. Among the 18, the commands that **capture user input** (`AskUserQuestion` → degrade to `text_mode`) are: new-milestone, quick, ship, explore, spec-phase, mvp-phase, ui-phase, secure-phase, docs-update, health, resume-work (11 of 18). **However**, most of these don't produce a single canonical golden artifact the way `new-project` produces `PROJECT.md`, and authoring 11 real-answer goldens would reintroduce the bespoke-golden burden D-05 forbids. **Recommendation:** the structural suite (a) + neutrality (c) + count (b) are the primary CMD-03 gates; keep the *existing* Phase-4 real-answer guard as-is (it still runs and proves the text_mode-capture contract for the core loop). Optionally add ONE representative real-answer golden for a single new interactive command (e.g. `spec-phase`'s SPEC.md) if the planner wants explicit CMD-03 coverage of a Phase-9 command — but this is discretionary, not required by the decisions.

### Q5 — Version-reconciliation risk (D-02): what changed 1.5.0→1.6.1 in the 4 drifted

Full diffs captured this session (repo 1.5.0 `<` vs tarball 1.6.1 `>`):

| Command | Change 1.5.0 → 1.6.1 | Bob-hostile? | Emitted-body impact |
|---------|----------------------|:---:|---------------------|
| code-review | +`requires: [config, import, phase, quick, review]` frontmatter; −2 trailing blank lines | No | Frontmatter key STRIPPED by converter; blank-line removal DOES change body |
| debug | −2 trailing blank lines only | No | Blank-line removal changes body |
| audit-fix | +`type: prompt`; +`requires: [audit-uat]`; −2 trailing blank lines | No | Both frontmatter keys STRIPPED; blank-line removal changes body |
| audit-uat | −2 trailing blank lines only | No | Blank-line removal changes body |

**Verdict: D-02's "converge to 1.6.1" is safe — no Bob-hostile construct.** No new subagent dependency in any body, no prompt primitive, no model directive (all 4 scan clean for `opus`/`sonnet`/`haiku` and `model:`/`effort:` — verified). The added `type: prompt` and `requires` keys are Claude-side classification that the Bob converter drops (it reconstructs frontmatter from the `description`+`argument-hint` whitelist only).

**The one real consequence:** the trailing-blank-line removal changes the emitted command/skill BODY, so the **8 frozen quality-gate golden fixtures** (`test/fixtures/quality-gates/{code-review,debug,audit-fix,audit-uat}.{command,skill}.expected.md`) will no longer byte-match and `quality-gate-equivalence.test.cjs` will FAIL until they are regenerated. There is no fixture-generator script (verified — `scripts/` has only apply-bob-patches, fix-slash-commands, generate-support-roster). **The plan MUST include a task to regenerate + re-freeze these 8 fixtures** by running the vendored converter on the new 1.6.1 sources and capturing the output. This is the subtle, must-not-miss item of the re-sync.

### Q6 — Plan/wave decomposition (granularity: coarse)

Recommended: **two coarse plans**, matching the phase's natural "produce, then prove" split:

- **Plan 09-01 — Vendor + re-sync + regenerate (the product change).**
  1. Fetch the 1.6.1 tarball (Q1), copy the 18 pristine + re-sync the 4 drifted into `commands/gsd/`.
  2. Checkpoint: `diff -q` all 22 against the tarball → zero drift (byte-identity gate).
  3. Regenerate `SUPPORT-ROSTER.md` via `node scripts/generate-support-roster.cjs` (→ 28 supported + 2 skip); commit as generated artifact.
  4. Regenerate the 8 quality-gate golden fixtures (Q5) and re-freeze.
  - *Fold the 4-source re-sync into this plan* (not a separate plan) — same fetch, same tarball, same regenerate step; splitting would duplicate the fetch.

- **Plan 09-02 — Verification (prove the gates hold at 28).**
  1. New directory-derived structural equivalence suite over all `commands/gsd/*.md` (Q4a).
  2. `count == 28` assertion via a scratch `stage()` run (Q4b).
  3. Re-run NEUTRAL-03 invariant + `roster-capmap` + `quality-gate-equivalence` (with regenerated fixtures) → all green (Q4c, Q6-neutrality).

**Ordering constraints (hard):**
- Roster regen (09-01.3) and fixture regen (09-01.4) MUST follow the vendor/re-sync (09-01.1).
- The count/equivalence/neutrality assertions (09-02) MUST follow emission (i.e. after 09-01 lands the sources).
- The quality-gate golden byte-diff test will be RED between 09-01.1 (re-sync) and 09-01.4 (fixture regen) — sequence those two tightly within the same plan so the suite is never left red across a plan boundary.

**A single coarse plan is defensible** given how little code changes, but the two-plan split keeps the "product change" commit (sources + generated artifacts) cleanly separable from the "test change" commit, which helps the Phase-11 acceptance delta and Phase-10 docs cite a stable roster.

### Open Question for the planner: the two-roster divergence (surface before planning)

There are **two** `SUPPORT-ROSTER.md` producers, and they do NOT agree:
1. `scripts/generate-support-roster.cjs` → **repo-root `SUPPORT-ROSTER.md`**, directory-derived (currently 10 supported + 2 skip). D-08 regenerates THIS → 28 supported + 2 skip. This is the roster CMD-02 and Phase-10 DOCS-01 treat as source of truth.
2. `stage.cjs renderRoster()` → the **installed `.bob/SUPPORT-ROSTER.md`**, built from a HARDCODED 5-entry `ROSTER_CANDIDATES` list (`stage.cjs:51-57`: gsd-help, gsd-plan-phase, gsd-execute-phase, gsd-autonomous, gsd-parallel-fanout) described in-code as a "representative set."

So after this phase the repo-root roster shows 28 but the **installed** roster still shows 5 representative entries. CMD-02's wording ("the regenerated `SUPPORT-ROSTER.md`", D-08 pinning the script) points at roster #1, so CMD-02 is satisfiable without touching #2. **But** the planner should CONSCIOUSLY decide:
- **Option A (in-scope, minimal):** leave `stage.cjs renderRoster` alone. CMD-02 verified against the repo-root roster + the `count==28` emission gate. Honors the "no staging-engine change" boundary strictly. *Recommended default* — it satisfies every success criterion as written.
- **Option B (arguably in-spirit, small edit):** make `renderRoster` directory-derived (mirror the generator's `fs.readdirSync(commands/gsd)`), so the installed roster also shows 28. Truer parity and removes a latent inconsistency, but it TOUCHES the staging engine, which CONTEXT lists as out of scope — needs explicit user/planner blessing.

Flagging this because it is the one place where a literal reading of "regenerate the roster to reflect 28" could be mistaken for requiring a `stage.cjs` edit. It does not — but the divergence should be a stated, accepted decision rather than a silent gap.

## Runtime State Inventory

This is a source-vendoring phase, not a rename/refactor/migration. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a renamed string. **None — verified: the only mutations are new/updated files under `commands/gsd/`, a regenerated `SUPPORT-ROSTER.md`, regenerated test fixtures, and new test files. No datastore, service, or OS registration is involved.**

## Common Pitfalls

### Pitfall 1: Forgetting to regenerate the 8 quality-gate fixtures after re-sync
**What goes wrong:** `quality-gate-equivalence.test.cjs` byte-diffs against frozen `.expected.md`; the 1.6.1 trailing-blank-line removal changes the body → test goes RED.
**Why:** No auto-regeneration; fixtures were hand-frozen in Phase 5.
**How to avoid:** Make fixture regen an explicit task in the same plan as the re-sync (Q5/Q6).
**Warning signs:** `command converts byte-identically...` assertions failing for code-review/debug/audit-fix/audit-uat.

### Pitfall 2: Trying to "wire in" the 18 by editing stage.cjs or the converter
**What goes wrong:** Wasted effort + a forked converter that breaks the upstream move-story and violates CLAUDE.md.
**Why:** The loop is already directory-driven; nothing needs wiring.
**How to avoid:** Confirm the emission by running `stage()` in a scratch dir and counting — the 18 appear with zero code change.

### Pitfall 3: Asserting `28` against the installed `.bob/SUPPORT-ROSTER.md`
**What goes wrong:** The installed roster is the 5-entry representative set; a `28` assertion against it fails.
**Why:** `stage.cjs renderRoster` uses hardcoded `ROSTER_CANDIDATES`, not the directory (Q6 Open Question).
**How to avoid:** Assert 28 against emitted `.bob/commands/gsd-*.md` count and the repo-root generated roster.

### Pitfall 4: Adding a magic `28` in multiple test spots
**What goes wrong:** Brittle; every future command change breaks several assertions.
**Why:** The codebase convention (`acceptance-coverage.test.cjs:160`) is "structural parity, not a brittle magic count."
**How to avoid:** Derive expected from `commands/gsd/*.md` length; pin `28` in exactly one CMD-01 guard.

### Pitfall 5: Pre-transforming a vendored source (colon→hyphen, path rewrite) before dropping it in
**What goes wrong:** Double-transform or diverging from upstream; breaks byte-identity with the tarball.
**Why:** F-02 — the converter does all rewrites at emit; sources stay verbatim.
**How to avoid:** Copy pristine; verify `diff -q` against the tarball == zero drift.

## Code Examples

### Confirm the 18 emit with zero code change (scratch stage run)
```javascript
// Pattern from test/model-neutrality.test.cjs:227-252 (verified)
const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdbob-count-'));
stage(baseOpts({ target, repoRoot: pkgRoot }));
const cmds = fs.readdirSync(path.join(target, 'commands')).filter(f => /^gsd-.*\.md$/.test(f));
assert.equal(cmds.length, 28, 'emitted .bob/commands == 28');
```

### The gate that makes all 18 Supported (why it's purely additive)
```javascript
// Source: src/bob-adapter.cjs:325-345 (verified this session)
function gateArtifact(candidate, capabilityDecl) {
  if (!candidate || typeof candidate.name !== 'string' || candidate.name.length === 0)
    return { supported: false, reason: 'invalid candidate: missing or non-string name' };
  if (Object.prototype.hasOwnProperty.call(BOB_SKIP_LIST, candidate.name)) // only 'gsd-autonomous'
    return { supported: false, reason: BOB_SKIP_LIST[candidate.name] };
  const required = Array.isArray(candidate.requires) ? candidate.requires : []; // derived => always []
  for (const primitive of required) if (!capabilityDecl[primitive]) return { supported: false, reason: ... };
  return { supported: true };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-command bespoke byte-golden fixtures (Phase 4/5 for the 10) | Directory-derived structural equivalence over the full set | Phase 9 (D-05) | Additions auto-covered; no fixture churn per new command |
| Roster hand-list | Directory-derived candidate set | Phase 5 D-06 | Roster can't go stale |
| Model neutrality per-command check | One emission-wide NEUTRAL-03 invariant | Phase 8 D-04 | New commands born clean, auto-scanned |

**Deprecated/outdated:** nothing new. The 4 drifted sources' 1.5.0 vendoring is the only stale artifact — D-02 retires it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Bob supports skill→slash-command invocation (`resume-work`'s `SlashCommand` tool) | Q2 | LOW — command still Supported/degrades; only an on-device unknown for Phase 11 ACCEPT-*. CLAUDE.md already flags this UNVERIFIED. |
| A2 | Regenerating the 8 quality-gate fixtures produces stable output (no other converter drift 1.5.0→1.6.1 beyond blank lines) | Q5 | LOW — diffs captured show only blank-line + stripped-frontmatter changes; verify by re-running the converter and diffing the regenerated fixture against expectation. |

All other findings in this document are `[VERIFIED: this session]` against the live code and the 1.6.1 tarball.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | staging, converter, tests | ✓ | >=22.15.0 (engines) | — |
| npm (`npm pack`) | fetch the 1.6.1 tarball | ✓ | >=10 | — |
| `tar` | extract the tarball | ✓ (used this session) | system | node:zlib+tar if absent |
| network (one-time) | `npm pack` fetch | ✓ (build-time only) | — | already-vendored copy exists if offline |
| `@opengsd/gsd-core@1.6.1` | pristine command sources | ✓ | 1.6.1 | — |

**Missing dependencies with no fallback:** none. **Missing with fallback:** none required — all verified present this session.

## Validation Architecture

*(`.planning/config.json` was not read as a blocker; nyquist_validation treated as enabled — include this section.)*

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (built-in) |
| Config file | none — glob in `package.json` |
| Quick run command | `node --test test/command-expansion.test.cjs` (the new suite) |
| Full suite command | `npm test` (`node --test "test/**/*.test.cjs"`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01 | 28 sources vendored; installer emits 28 commands | integration | `node --test test/command-expansion.test.cjs` | ❌ Wave 0 (new count==28 suite) |
| CMD-02 | Each Supported / skip w/ reason; roster reflects 28 | unit | `node --test test/roster-capmap.test.cjs` | ✅ (directory-derived; auto-covers) |
| CMD-03 | Contract held + model-neutral | unit/golden | `node --test test/command-expansion.test.cjs test/model-neutrality.test.cjs` | ❌ new structural suite; ✅ neutrality |
| D-02 re-sync | 4 fixtures match regenerated 1.6.1 output | golden | `node --test test/quality-gate-equivalence.test.cjs` | ✅ (fixtures must be regenerated) |

### Sampling Rate
- **Per task commit:** the new suite + neutrality (`node --test test/command-expansion.test.cjs test/model-neutrality.test.cjs`)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/command-expansion.test.cjs` — directory-derived structural equivalence over all 28 + `count==28` assertion (covers CMD-01, CMD-03)
- [ ] Regenerate `test/fixtures/quality-gates/*.{command,skill}.expected.md` (8 files) after the D-02 re-sync
- [ ] (optional/discretionary) one representative real-answer golden for a Phase-9 interactive command (e.g. `spec-phase` SPEC.md)
- Framework install: none needed (`node:test` is built in)

## Security Domain

`security_enforcement` is not disabled in config; include a minimal assessment. This phase adds **no runtime code, no network endpoints, no user-input parsing, no new dependencies** — it copies vetted upstream markdown and runs generators/tests.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | marginal | vendored sources are byte-verified against the immutable tarball (`diff -q`), preventing a tampered/hand-edited source slipping in |
| V6 Cryptography | no | (manifest sha256 exists in the installer, unchanged) |
| V12 File/Resource | yes | copies confined to `commands/gsd/`; converter/staging path stays node:fs-only; no `child_process` in the runtime path |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered vendored source (supply-chain) | Tampering | Fetch from the immutable `@opengsd/gsd-core@1.6.1` tarball + byte-identity `diff -q` checkpoint before commit |
| Model literal leaking into emitted artifact (backend-neutrality regression) | Information disclosure | NEUTRAL-03 invariant re-run over the full 28-command emission |
| Silent parity gap (a command that can't run on Bob emitted anyway) | Repudiation | `gateArtifact` + loud `unsupported on Bob:` roster line; all 18 verified Supported |

## Sources

### Primary (HIGH confidence — read directly this session)
- `src/bob-adapter.cjs` — `gateArtifact` (L325-345), `BOB_SKIP_LIST` (L298-302), `neutralizeModelReferences`, `scanModelLiterals`
- `src/installer/stage.cjs` — convertible loop (L264-295), `ROSTER_CANDIDATES` (L51-57), `renderRoster` (L79-104)
- `scripts/generate-support-roster.cjs` — directory-derived candidate set (L32-55)
- `scripts/apply-bob-patches.cjs` — Phase 7 immutable-tarball delta discipline (fetch reference)
- `test/model-neutrality.test.cjs`, `test/core-loop-equivalence.test.cjs`, `test/quality-gate-equivalence.test.cjs`, `test/roster-capmap.test.cjs`, `test/installer/install-clean.test.cjs`, `test/fixtures/` listing
- `@opengsd/gsd-core@1.6.1` tarball via `npm pack` — `package/commands/gsd/*.md` (69 files); frontmatter + model-literal scan of the 18 targets and 4 drifted sources; full diffs of the 4 drifted
- `SUPPORT-ROSTER.md`, `package.json` (engines/scripts/deps)

### Secondary (MEDIUM confidence)
- `.planning/phases/07-*` and `08-*` CONTEXT (carried-forward discipline) — read via CONTEXT canonical refs

### Tertiary (LOW confidence)
- none — every claim is tool-verified against the live tree or the tarball this session.

## Metadata

**Confidence breakdown:**
- Fetch mechanism (Q1): HIGH — reproduced `npm pack` + extract this session
- Gate classification (Q2/Q3): HIGH — read the gate code + all 18 frontmatters; gate is name/`requires[]`-based
- Harness extension (Q4): HIGH — read every relevant test; confirmed no directory-derived equivalence or count test exists yet
- Version reconciliation (Q5): HIGH — captured full diffs; only blank-line + stripped-frontmatter changes
- Plan decomposition (Q6): HIGH — grounded in the codebase's two-producer structure and ordering constraints
- Two-roster divergence: HIGH — read both producers

**Research date:** 2026-07-03
**Valid until:** 2026-08-02 (stable — internal codebase + a pinned immutable 1.6.1 tarball; only a gsd-core version bump would invalidate)
