# Phase 7: gsd-core 1.6.1 Sync - Research

**Researched:** 2026-07-03
**Domain:** Vendored-payload re-sync (npm tarball extraction + local-delta re-application + golden/equivalence re-validation)
**Confidence:** HIGH (every load-bearing claim verified against the real `@opengsd/gsd-core@1.6.1` tarball, packed and inspected in a scratch dir)

## Summary

I obtained the real published payload (`npm pack @opengsd/gsd-core@1.6.1`, and `@1.5.0` for provenance) into a scratch dir and diffed it against the current vendored `gsd-core/` tree. The re-vendor is mechanically straightforward **but the CONTEXT.md model of "the local delta = two data-only edits" is materially incomplete.** The vendored 1.5.0 tree is not the pristine tarball — it is `pristine tarball + a normalization pass + FOUR bob patches + a local VERSION file`. A naive "nuke-and-restage the raw 1.6.1 tarball + re-inject two patches" (the D-02/D-05 recipe as written) would silently drop three of those deltas and leave the payload broken under Bob (deprecated colon command form leaks back in, `require()` of the missing Bob converters crashes `stage.cjs`, and `stage.cjs` throws on the missing `VERSION` file).

The good news: every gsd-core seam this phase depends on **survives** in 1.6.1. The generic `dot-home` resolver still resolves the `.bob` home (SYNC-02 shim path is safe), the per-runtime converter family still exports the same way, and the two converter helper dependencies (`yamlQuote`, `command-roster.cjs`) are intact. There is **no upstream integration break** in the D-03 sense — but there is a **documentation accuracy break**: the Bob converters were never "stock gsd-core" (the in-file banner literally reads `gsd-bob HAND-EDIT to this GENERATED file`), so UPSTREAM.md's "No new converter code / already exist upstream" claim is false and SYNC-03 must correct it, not just bump line numbers.

**Primary recommendation:** Scope `scripts/apply-bob-patches.cjs` (D-02) to reproduce the *entire* local-delta set idempotently — normalization pass + all four bob patches + `VERSION` write — not just the two data edits. Treat the version bump in `staged-shim-loads.test.cjs` as the one guaranteed expected-drift; run the 18 suites and expect the 2 golden clusters to stay green (converters re-injected verbatim; only helper-behavior change could drift them). The 3 currently-failing baseline tests are pre-existing environmental noise (missing archived `.planning/` fixtures), NOT caused by the re-vendor.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Bob support is data-only in-place edits added by commit `f20e328` with no injection script: the `"bob"` registry block in `capability-registry.cjs` and the `"bob"` alias in `runtime-aliases.manifest.json`. A wholesale replace overwrites both. *(Research finding: this enumeration is INCOMPLETE — see "Confirmed Facts" §1. There are four patch sites plus normalization plus VERSION.)*
- **D-02:** Preserve via a new idempotent re-injection script `scripts/apply-bob-patches.cjs` (nuke → restage clean 1.6.1 → run this script → validate). Chosen over manual 3-way re-apply and over out-of-tree refactor. This becomes the executable core of the Phase 10 MAINTAINING runbook.
- **D-03:** Registry names converters `convertClaudeCommandToBobSkill` / `convertClaudeCommandToBobCommand`; SYNC-02 MUST re-verify they still exist in 1.6.1's `runtime-artifact-conversion.cjs`. If renamed/removed, that is a real integration break to resolve, not a fixture update. *(Research finding: they are NOT stock gsd-core; they are local code. See §1/§3.)*
- **D-04:** Obtain 1.6.1 via `npm pack @opengsd/gsd-core@1.6.1` (immutable tarball), not a git checkout.
- **D-05:** Nuke-and-restage (not surgical): delete tracked vendored subdirs, restage the identical curated subset (`bin/ workflows/ templates/ references/ contexts/ VERSION`) from the tarball, bump `gsd-core/VERSION` to `1.6.1`.
- **D-06:** Keep the curated-subset boundary unchanged; include a new top-level dir only if 1.6.1 adds one the shim/workflows reference. Confirm subset against `stage.cjs` + `generate-support-roster.cjs`.
- **D-07:** A payload version-consistency check asserts `VERSION == 1.6.1` and no file carries a 1.5.0 marker/residue.
- **D-08:** Run existing suites unchanged against 1.6.1 first, then classify each failure: expected drift → regenerate that fixture with a one-line recorded justification; regression → a bug to fix in this phase. Never blanket-regenerate.
- **D-09:** `test/backend-neutrality.test.cjs` and `test/descriptor.test.cjs` are invariants, not drift-eligible — must pass unmodified. Justifications for regenerated goldens live in `07-REVENDOR-NOTES.md` keyed by fixture name.
- **D-10:** Capture concrete re-vendor steps as live raw notes written as-the-work-happens.
- **D-11:** Notes file: `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` (chronological command log, gotchas/dead-ends, D-03 converter re-verification result, D-08 drift justifications, SYNC-03 pointer re-verification).

### Claude's Discretion
- User delegated all four areas ("auto for everything"). Downstream research/planning may refine *how* each is implemented (e.g., the exact re-injection technique in `apply-bob-patches.cjs`: anchor-based string insertion vs AST vs structured-JSON edit for the alias) as long as the locked decisions hold.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope. Model neutralization (Phase 8, NEUTRAL-*), command expansion (Phase 9, CMD-*), the MAINTAINING runbook document itself (Phase 10, DOCS-04 — this phase produces only the raw notes), and acceptance-delta steps (Phase 11) are separate phases.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **SYNC-01** | Vendored `gsd-core/` payload fully replaced at 1.6.1 — one consistent version, no 1.5.0/1.6.1 mix | Confirmed: curated subset = the whole `gsd-core/` dir (stage.cjs copies it recursively); 1.6.1 tree is structurally identical (no new dirs); only residual `1.5.0` string in the payload is `gsd-core/VERSION` (1 occurrence). Version-consistency check = `VERSION==1.6.1` AND `grep -r 1.5.0 gsd-core/` empty. §5, §7 |
| **SYNC-02** | Descriptor + converter suites re-validated against 1.6.1 bin layer; golden/equivalence pass or diffs updated with justification; shim still resolves `bob` home | Confirmed: `dot-home` resolver survives (1.6.1 `runtime-homes.cjs` L84); converters re-injected verbatim → goldens should stay green; invariants pass 10/10 at baseline; one guaranteed expected-drift (`staged-shim-loads.test.cjs` version). §3, §6 |
| **SYNC-03** | `UPSTREAM.md` records 1.6.1 with 5-artifact move-inventory pointers re-verified file:line | All 5 pointers shifted (registry now in `const runtimes` L2742+; converters relocate; alias manifest tail; dot-home ~L84). PLUS a factual correction: converters are local code, not "stock upstream"; and an undocumented 4th patch (`runtime-name-policy.cjs`). §8 |
</phase_requirements>

## Architectural Responsibility Map

This is a build/re-vendor phase; the "tiers" are the pipeline stages, not runtime tiers.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Obtain immutable 1.6.1 payload | Acquisition (`npm pack`) | — | Deterministic published tarball is the source of truth (D-04) |
| Replace vendored subset wholesale | Payload staging (fs nuke + copy) | — | Only nuke-and-restage guarantees SYNC-01 no-mix |
| Reproduce local deltas | Patch tooling (`scripts/apply-bob-patches.cjs`) | Normalization pass | 4 bob patches + colon→hyphen + `$HOME` + VERSION must survive the replace |
| Re-validate contract | Test harness (`test/` 18 suites) | Invariants (backend-neutrality, descriptor) | Existing goldens/equivalence are the SYNC-02 acceptance surface (D-08) |
| Record the move inventory | Docs (`UPSTREAM.md`) | Raw notes (`07-REVENDOR-NOTES.md`) | SYNC-03 pointer re-verification + Phase-10 runbook seed |

## Confirmed Facts (the point of this research: assumptions → facts)

> All facts below are `[VERIFIED: npm pack @opengsd/gsd-core@1.6.1]` unless tagged otherwise. Scratch dir used: `/tmp/gsd161.*` (re-pack with `npm pack @opengsd/gsd-core@1.6.1` — 1.6.1 is the current `latest` dist-tag; `next` is `1.7.0-rc.2`).

### §1 — The TRUE local-delta set (corrects D-01)

A full recursive diff of the current vendored `gsd-core/` against the pristine **1.5.0** tarball proves the vendored tree = `pristine tarball + normalization + 4 patches + VERSION`. All 127 differing `.md` files differ **only** by normalization tokens (0 lines of real content drift). The complete delta the re-vendor must reproduce over pristine 1.6.1:

| # | Delta | File(s) | Kind | In D-01? |
|---|-------|---------|------|----------|
| 1a | colon→hyphen command form: `/gsd:<cmd>`/`gsd:<cmd>` → `gsd-<cmd>` (995 changed lines, ~88 workflow files + refs + templates) | `gsd-core/{workflows,references,templates}/**/*.md` | normalization | ❌ omitted |
| 1b | home-path: `~/.claude` → `$HOME/.claude` (129 changed lines) | same tree | normalization | ❌ omitted |
| 2 | `"bob"` runtime descriptor block | `bin/lib/capability-registry.cjs` (in `const runtimes`) | data | ✅ |
| 3 | Bob converter code block (~105 lines: banner + `convertClaudeToBobContent` + 2 public converters) | `bin/lib/runtime-artifact-conversion.cjs` | **CODE** | ⚠️ mislabeled "data-only / stock" |
| 4 | `"bob": ["bob","bob-cli"]` alias | `bin/shared/runtime-aliases.manifest.json` | data | ✅ |
| 5 | `bob: ['bob','bob-cli']` alias | `bin/lib/runtime-name-policy.cjs` (alias map) | data | ❌ **UNDOCUMENTED** |
| 6 | `VERSION` file = version string | `gsd-core/VERSION` | local artifact | ⚠️ implied by D-05, but see §2 |

**Confirmed:** pristine **1.6.1** still ships the colon `gsd:` form (88 workflow files) and still uses `~/.claude` (not `$HOME`). Neither normalization is a version-upgrade freebie — **both remain local deltas that must be re-applied to 1.6.1.**

### §2 — `gsd-core/VERSION` is a gsd-bob-LOCAL file, not shipped by the tarball `[VERIFIED]`

Neither the 1.5.0 nor the 1.6.1 tarball contains `gsd-core/VERSION` (both ship only `bin/ contexts/ references/ templates/ workflows/`). The current repo's `gsd-core/VERSION` (`1.5.0`, 5 bytes) was created locally during the original vendoring. **Nuke-and-restage from the tarball will NOT recreate it.** This is load-bearing: `src/installer/stage.cjs` L242 does `fs.readFileSync(path.join(repoRoot,'gsd-core','VERSION'),'utf8').trim()` and **throws ENOENT** if it is missing (it stamps the synthesized `package.json` version). The re-vendor MUST explicitly write `gsd-core/VERSION` = `1.6.1`.

### §3 — Converter survival (D-03, highest risk) — RESOLVED `[VERIFIED]`

- The functions `convertClaudeCommandToBobSkill` / `convertClaudeCommandToBobCommand` **do NOT exist in the pristine 1.6.1 tarball** (`grep -c Bob` = 0 in both 1.5.0 and 1.6.1 `runtime-artifact-conversion.cjs`). They exist ONLY in the vendored tree (22 "Bob" mentions).
- gsd-core uses a **per-runtime converter family** (`convertClaudeCommandToCursorSkill`, `…ToAntigravitySkill`, etc.) — there is no single generic Bob-capable function. The Bob pair was **written locally, modeled on the Antigravity converter** (confirmed by STATE.md Phase-02 note and the in-file banner at vendored L674: `// --- Bob converters (gsd-bob HAND-EDIT to this GENERATED file; vendored-payload approach) ---`).
- **Interpretation for the planner:** This is NOT a "renamed/removed upstream" integration break. It is the opposite — the functions were never upstream, so the re-vendor must **re-inject the whole ~105-line block** (banner + `convertClaudeToBobContent` helper + the two public converters) into 1.6.1's file, and add the two names to `module.exports`. All of the block's dependencies survive in 1.6.1: `yamlQuote` (in-module hoisted function), and `command-roster.cjs` exporting `readGsdCommandNames` + `transformContentToHyphen` (verified present). Golden output should therefore be byte-identical unless one of those helpers changed behavior between 1.5.0→1.6.1 (the golden suites will surface it; see §6).

### §4 — Bob-patch anchors in 1.6.1 (D-01/D-02 re-injection) `[VERIFIED]`

| Patch | 1.6.1 target location | Recommended technique |
|-------|----------------------|-----------------------|
| Registry block (#2) | Inside `const runtimes = {` (starts **L2742**). Sibling runtime entries: `antigravity` L2743, `augment` L2803, `claude` L2872. `bob` sorts between `augment` and `claude`. The first big object `const capabilities` (L9–~2020) is NOT the runtime map — do not insert there (matches UPSTREAM.md's "second object" note). | **Anchor-based string insertion** keyed on the `"claude": {` runtime line (insert the `"bob": { … }` block immediately before it). Line numbers are useless — they shifted ~1000 lines vs the vendored file. |
| Converter block (#3) | Insert the ~105-line block before `module.exports = {` (**L2338**), and add `convertClaudeCommandToBobSkill,` + `convertClaudeCommandToBobCommand,` inside the exports object (anchor on the existing `convertClaudeCommandToCursorCommand,` export line, **L2355**). Function declarations are hoisted, so block placement is flexible. | **Anchor-based string insertion** (2 anchors: before `module.exports`, and inside it). |
| Alias manifest (#4) | Pure JSON; last entry is `"cline"` before the closing `}`. | **Structured-JSON edit** (`JSON.parse` → add `bob` key → `JSON.stringify(obj, null, 2)` + trailing `\n`). Most robust — no line fragility. Preserve gsd-core's 2-space indent + trailing newline. |
| Name-policy alias (#5) | `.cjs` alias map at **L25–40**; last entry `cline: ['cline', 'cline-cli'],`. | **Anchor-based string insertion** after the `cline:` line inside the map. |

**Idempotency (D-02):** guard each site — skip if `runtimes.bob` exists / `convertClaudeCommandToBobSkill` already declared / alias key present. The two normalizations are naturally idempotent (`transformContentToHyphen` finds no `gsd:` in already-hyphenated text; `~/.claude`→`$HOME` finds no `~/` after the first pass).

### §5 — Curated subset (D-05/D-06) — unchanged `[VERIFIED]`

- `stage.cjs` (structural piece 2, L217–222) copies the **entire** `gsd-core/` dir recursively via `listFilesRel(payloadSrc)`; `payloadSrc = repoRoot/gsd-core`. There is **no hand-picked file list** — the curated subset *is* whatever lives under `gsd-core/`.
- `find . -type d` diff between pristine 1.6.1 `gsd-core/` and the vendored tree is **empty** → identical directory structure, no new top-level or `bin/` subdir in 1.6.1. The new files the roadmap mentions (`workflows/list-seeds.md`, +14 bin files) land inside existing dirs and are picked up automatically by the recursive copy.
- `generate-support-roster.cjs` derives candidates from `commands/gsd/*.md` (gsd-bob's own sources), **not** from the gsd-core payload — the re-vendor does not change the roster input.
- **Conclusion:** the D-06 subset is confirmed unchanged. Restage all five subdirs (`bin contexts references templates workflows`) + write `VERSION`.

### §6 — Shim resolution (SYNC-02) — survives `[VERIFIED]`

- 1.6.1 `runtime-homes.cjs` still has the generic `case 'dot-home':` (L84) inside `resolveConfigHomeFromDescriptor` — resolves env-override → `path.join(home, name)`. Bob's `dot-home` descriptor resolves with **no bob-specific branch**. (Note: 1.6.1 `runtime-homes.cjs` is now a **TS-compiled** artifact — `node_path_1.default` markers — but it is not a patch site, so compiled-ness is irrelevant to the re-injection.)
- `gsd-tools.cjs` in 1.6.1 has **0** `bob` references (confirmed generic).
- **Baseline invariant run is GREEN:** `node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` → 10 pass / 0 fail. These are the D-09 invariants; re-verify they stay green post-patch.

### §7 — Version-consistency surface (SYNC-01/D-07) `[VERIFIED]`

- `grep -rn "1\.5\.0" gsd-core/` → **1 hit**: `gsd-core/VERSION` only. So the check is trivially: `VERSION==1.6.1` AND `grep -rn "1\.5\.0" gsd-core/` returns nothing.
- `1.5.0` also appears OUTSIDE the payload and must be swept in this phase where semantically the version: `UPSTREAM.md` (SYNC-03 target), `src/installer/stage.cjs` L239 (stale **comment** only — code reads VERSION dynamically), `README.md`, and two installer tests (§6 drift). The stage.cjs mention is a comment; update for hygiene but it is not functional.

### §8 — UPSTREAM.md 5-artifact re-verification (SYNC-03) `[VERIFIED shifts]`

| # | Artifact | UPSTREAM.md (1.5.0) pointer | 1.6.1 reality | Action |
|---|----------|-----------------------------|---------------|--------|
| 1 | `"bob"` registry entry | `capability-registry.cjs` L3045–3109 | Insert into `const runtimes` (L2742+), between `augment`/`claude` | Re-point to new anchor; block is ADDED (not present in pristine) |
| 2 | `convertClaudeCommandToBobCommand` | registry L3077/3095; impl `runtime-artifact-conversion.cjs` L763 (export L2016) | Impl absent from pristine 1.6.1; re-inject; new export line near L2355 | **Correct the "already exist upstream / No new converter code" claim — it is false** |
| 3 | `convertClaudeCommandToBobSkill` | registry L3069/3087; impl L735 (export L2015) | same as #2 | same correction |
| 4 | Runtime alias | `runtime-aliases.manifest.json` L79–82 | JSON tail (last key `cline`); add `bob` key | Re-point |
| 5 | configHome / shim | `runtime-homes.cjs` `dot-home` L83–91 (+ shim) | `dot-home` now ~L84 in compiled `resolveConfigHomeFromDescriptor` | Re-point |
| — | **(missing)** name-policy alias | not listed | `runtime-name-policy.cjs` L39 `bob: ['bob','bob-cli']` | **ADD to inventory** — this 4th data patch is undocumented |

**SYNC-03 is more than a line-number refresh.** It must (a) bump the targeted version to `1.6.1`, (b) re-point all 5 pointers, (c) add the missing name-policy alias artifact, and (d) correct the "converters are stock/no new code" framing to reflect that they are a vendored hand-edit (the honest "move vs rewrite" story is: 4 data patches are moves; the converters are a small parameterized rewrite that a maintainer would fold into the converter family).

## Recommended `apply-bob-patches.cjs` Design (D-02)

Scope it as **"restore all local deltas over a pristine restaged payload,"** idempotent, node-builtins-only (CLAUDE.md: no deps). Suggested ordered steps (mirrors the Phase-10 runbook dance):

1. **Normalization pass** over `gsd-core/{workflows,references,templates,contexts}`:
   - colon→hyphen: reuse `transformContentToHyphen(src, readGsdCommandNames())` from `scripts/fix-slash-commands.cjs` (already exported, pure, word-boundary-safe, keyed on `commands/gsd/*.md`). ⚠️ Do NOT run `fix-slash-commands.cjs` as `main` — its `require.main` block runs the *forward* (hyphen→colon) direction, the opposite of what is needed.
   - home-path: `content.replace(/(^|[^\w$])~\/\.claude/g, '$1$HOME/.claude')` (simple, idempotent). Verify the exact pattern set against the diff during execution (129 lines; also covers `@~/.claude/...` mandatory-read references).
2. **Registry patch** (#2) — anchor-insert the `"bob"` block into `const runtimes`.
3. **Converter patch** (#3) — anchor-insert the ~105-line block + 2 export lines.
4. **Alias patches** (#4 structured-JSON, #5 anchor-insert).
5. **Write `gsd-core/VERSION`** = `1.6.1`.
6. Each step guarded to be a no-op if already applied (idempotent re-run).

Keep the canonical Bob-block source (registry block text + converter block text) somewhere the script reads — either inlined constants in the script, or extracted from a checked-in `scripts/bob-patches/` fixture directory. Inlined constants are simplest and keep the script self-contained (recommended for the runbook story).

## Golden-Fixture Drift Map (D-08)

| Suite / fixture | Reads | Drift expectation |
|-----------------|-------|-------------------|
| `test/installer/staged-shim-loads.test.cjs` L65 | asserts staged `package.json` `version == '1.5.0'` from real payload | **EXPECTED DRIFT — guaranteed.** Update to `'1.6.1'`, justification: "vendored gsd-core version legitimately bumped 1.5.0→1.6.1 (SYNC-01)." |
| `test/skill-golden.test.cjs`, `test/command-golden.test.cjs`, `test/text-mode-golden.test.cjs` | convert `commands/gsd/*.md` (gsd-bob's OWN sources, unchanged) through the re-injected converters | **Should stay GREEN.** Converters re-injected verbatim + helpers survive. Only a behavior change in `yamlQuote`/`transformContentToHyphen`/`readGsdCommandNames` between 1.5.0→1.6.1 could drift them → then classify: diff the helper, if the new behavior is correct it's expected-drift (regenerate + justify), else it's a regression (fix). |
| `test/unsupported-gate.test.cjs`, `test/roster-capmap.test.cjs`, `test/merge.test.cjs`, `test/quality-gate-*.test.cjs`, `test/core-loop-*.test.cjs` | adapter gate + roster + custom_modes (all in `src/`, untouched by re-vendor) | Should stay GREEN — independent of the payload swap. |
| `test/backend-neutrality.test.cjs`, `test/descriptor.test.cjs` | brace-walks the `"bob"` registry block; shim resolves `.bob` home | **INVARIANTS (D-09) — must pass unmodified.** Baseline 10/10 green. |
| `test/installer/stage.test.cjs` L47 | writes its OWN `gsd-core/VERSION='1.5.0'` into a scratch fixture | **NOT drift** — hermetic self-written fixture; stays green. Update the `1.5.0` token only for cosmetic consistency (optional). |

**Baseline (current tree, 1.5.0):** `npm test` → 189 tests, **186 pass / 3 fail**. The 3 failures are **pre-existing environmental noise**, NOT re-vendor-related:
- `acceptance-coverage.test.cjs:114` and `:128` (VERIFY-01 SC/AC coverage — read archived `.planning/` files not present in the working tree)
- `core-loop-contract.test.cjs:126` (CORE-02 reads missing `.planning/phases/04-core-loop-port/04-01-PLAN.md`)

The planner should record this 186/3 baseline in `07-REVENDOR-NOTES.md` BEFORE the re-vendor so post-vendor deltas are attributable. Do NOT try to "fix" these 3 in this phase (they belong to archived phases and depend on planning fixtures).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| colon→hyphen command normalization | a fresh regex sweep | `transformContentToHyphen` exported from `scripts/fix-slash-commands.cjs` | Already pure, longest-first, word-boundary-safe, leaves `gsd-sdk`/`gsd-tools` untouched; tested |
| Obtaining 1.6.1 | git tag checkout / manual download | `npm pack @opengsd/gsd-core@1.6.1` | Immutable, deterministic, mirrors distribution (D-04) |
| Alias JSON edit | line-anchored string splice | `JSON.parse`/`JSON.stringify(…,null,2)` | Pure JSON; structured edit is drift-proof |
| Version stamping the staged package.json | hardcoding | leave `stage.cjs` reading `gsd-core/VERSION` dynamically | Already dynamic (L242); just write the VERSION file |
| Re-equivalence framework | new test harness | the existing 18 `test/` suites | SYNC-02's acceptance surface is these suites (D-08) |

**Key insight:** the entire re-vendor is a *deterministic delta-replay*, not a design task. The only new artifact is `apply-bob-patches.cjs`; everything else is `npm pack` + `fs` + running existing tests.

## Common Pitfalls

### Pitfall 1: Trusting "two data-only edits" and dropping three deltas
**What goes wrong:** Restage raw 1.6.1 + re-inject only the registry block and alias manifest. Result: converters missing → `stage.cjs` L267 `require(...)` destructures `undefined` → convertible loop crashes; `VERSION` missing → `stage.cjs` L242 throws ENOENT; colon form leaks → staged `.bob/gsd-core/workflows/*.md` carry unroutable `gsd:` commands.
**How to avoid:** Reproduce the full §1 delta set. Make `apply-bob-patches.cjs` own all six.
**Warning signs:** `npm test` errors with `Cannot find module` / `undefined is not a function` in the convertible loop; `grep -rn "gsd:" gsd-core/workflows` returns hits post-vendor.

### Pitfall 2: Line-number-based insertion of the registry/converter blocks
**What goes wrong:** UPSTREAM.md's `L3045` etc. are 1.5.0 numbers; 1.6.1 shifted them ~1000 lines and the file structure differs.
**How to avoid:** Anchor on stable sibling tokens (`"claude": {` under `runtimes`; `module.exports = {`; `convertClaudeCommandToCursorCommand,`).
**Warning signs:** patch lands mid-object / breaks JS syntax; `node -e "require('./gsd-core/bin/lib/capability-registry.cjs')"` throws.

### Pitfall 3: Blanket-regenerating goldens to make the suite green
**What goes wrong:** masks a real converter/helper regression (defeats the goldens — D-08).
**How to avoid:** classify each failure. Expected-drift = version bump or a verified-correct helper-behavior change → regenerate that fixture + one-line justification. Regression = fix. Invariants never regenerated (D-09).

### Pitfall 4: Running `fix-slash-commands.cjs` as a script
**What goes wrong:** its `main` runs hyphen→colon (WRONG direction), re-introducing the deprecated colon form.
**How to avoid:** call the exported `transformContentToHyphen` directly from `apply-bob-patches.cjs`.

### Pitfall 5: Attributing the 3 baseline failures to the re-vendor
**What goes wrong:** wasted effort "fixing" archived-phase coverage tests.
**How to avoid:** record the 186/3 baseline first; only investigate NEW failures.

## Runtime State Inventory

> This is a re-vendor/refactor phase — inventory of state that a file-tree replace does NOT capture.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no datastore keys reference the vendored version. | None (verified: only `gsd-core/VERSION` carries the version literal). |
| Live service config | None — no external service embeds the payload version. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None — no secret/env references the payload version. | None. |
| Build artifacts / installed state | Two stale root tarballs (`opengsd-gsd-bob-0.1.0.tgz`, `0.1.1.tgz`, `zack-maz-gsd-bob-0.1.2.tgz`) embed a 1.5.0 payload but are historical publish artifacts, not consumed by tests. The synthesized `.bob/package.json` (version stamp) is regenerated on each install from `gsd-core/VERSION` — no manual migration. | None required for correctness; optionally note the stale tgz in notes. |

**The canonical question — after the payload files are replaced, what still carries 1.5.0?** Only `gsd-core/VERSION` (write it), and doc/test references outside the payload (`UPSTREAM.md`, `README.md`, `staged-shim-loads.test.cjs`, stage.cjs comment) — all covered in §7/§6.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `npm pack` (registry access) | D-04 tarball fetch | ✓ | npm present, `@opengsd/gsd-core@1.6.1` is `latest` | offline: reuse a cached `.tgz` |
| Node.js | run tests + patch script | ✓ | v25.6.1 (repo engines `>=22.15.0`) | — |
| `@opengsd/gsd-core@1.6.1` | the payload | ✓ | 1.6.1 (published; 707 files) | — |
| `node --test` runner | SYNC-02 suites | ✓ | built-in | — |

**No blocking gaps.** All external dependencies resolve. (No live Bob is required — SYNC-02 is verified via doc-conformance + golden/equivalence, per the project's test-deferred model.)

## Package Legitimacy Audit

Only one external package is involved — the vendored payload itself.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@opengsd/gsd-core@1.6.1` | npm | current `latest` | established (the upstream GSD core; project's source of truth) | github.com/open-gsd/gsd-core | OK | Approved — vendored, not a runtime dependency |

`[VERIFIED: npm registry]` — `npm view @opengsd/gsd-core version` → `1.6.1`; dist-tags `{ latest: 1.6.1, next: 1.7.0-rc.2 }`; tarball packs cleanly (707 files); `engines` node `>=22`, deps `@anthropic-ai/claude-agent-sdk@^0.2.84` + `ws@^8.21.0` (unchanged from 1.5.0). This is the same package CLAUDE.md already vendors; no new packages are introduced.

**Packages removed due to SLOP:** none. **Packages flagged SUS:** none.

## Security Domain

`security_enforcement` is enabled (ASVS-1), but this phase installs no runtime code paths and accepts no untrusted input at runtime. The only relevant control is **supply-chain integrity of the vendored payload**:

| Concern | Control |
|---------|---------|
| Payload authenticity | Fetch via `npm pack @opengsd/gsd-core@1.6.1` (immutable, registry-signed) — never a mutable git branch (D-04 already encodes this). |
| Patch-script safety | `apply-bob-patches.cjs` is node-builtins-only, writes only under `gsd-core/`, and is idempotent — no network, no exec (CLAUDE.md dependency discipline). |
| Backend-neutrality (RUNTIME-04, cross-cutting invariant) | Enforced by `test/backend-neutrality.test.cjs` — must stay green after the registry/converter re-injection. |

No ASVS V2–V6 categories apply (no auth/session/crypto/input-validation surface introduced). STRIDE: the only relevant vector is **Tampering** of the payload, mitigated by the immutable-tarball source.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Reproducing the colon→hyphen + `$HOME` normalization on the vendored payload is functionally required (staged `.bob/gsd-core/` workflows must be routable under Bob). | §1, apply-bob design | If the staged payload is never directly referenced with commands, normalization could be cosmetic — but current committed tree IS normalized and goldens were baselined against it, so reproducing it is the safe, parity-preserving choice. `[ASSUMED]` functional-necessity; `[VERIFIED]` that it is a real committed delta. |
| A2 | The `$HOME` transform pattern is exactly `~/.claude` → `$HOME/.claude` (plus `@~/…` mandatory-read forms). Exact regex should be re-derived from the live diff during execution. | §1 (1b) | Under/over-matching could touch unintended `~/` occurrences; executor should diff before/after and confirm 129-line delta. `[ASSUMED]` exact pattern. |
| A3 | Golden suites (skill/command/text-mode) stay green because converter helpers (`yamlQuote`, `transformContentToHyphen`, `readGsdCommandNames`) behave identically in 1.6.1. Existence verified; byte-for-byte behavior not diffed. | §3, §6 | If a helper's output changed, goldens drift → classify per D-08. Low risk; suites will surface it deterministically. `[ASSUMED]` behavior-identical. |

**All other findings in this document are `[VERIFIED]` against the packed 1.6.1/1.5.0 tarballs and the live repo.**

## Open Questions

1. **Where should the canonical Bob-block text live for `apply-bob-patches.cjs`?**
   - What we know: the script must insert a ~105-line converter block + a registry block verbatim.
   - What's unclear: inline as JS template constants vs. a `scripts/bob-patches/*.txt` fixture dir.
   - Recommendation: inline constants (self-contained, best for the Phase-10 runbook narrative). Planner's call.

2. **Should the stale root `.tgz` artifacts and `stage.cjs` L239 comment be swept in this phase?**
   - What we know: they are non-functional 1.5.0 references.
   - Recommendation: update the `stage.cjs` comment and `README.md`/`UPSTREAM.md` (SYNC-03) here; leave the historical `.tgz` files alone (publish artifacts, out of scope).

## State of the Art

| Old (assumed in CONTEXT.md) | Current (verified) | Impact |
|--------------|------------------|--------|
| "Bob = two data-only in-place edits; only local mods" | Four patch sites + two normalizations + a local VERSION file | `apply-bob-patches.cjs` scope triples; recipe must add normalization + VERSION + converter re-injection |
| "Converters are stock gsd-core, parameterized by the registry" | Converters are local hand-edited code (~105 lines), never upstream | UPSTREAM.md correction required (SYNC-03); no upstream-rename break exists |
| "Bump `gsd-core/VERSION`" (implies it exists in tarball) | Tarball ships no VERSION; it is a local file `stage.cjs` hard-depends on | Re-vendor must WRITE it or `stage.cjs` throws |

## Sources

### Primary (HIGH confidence)
- `npm pack @opengsd/gsd-core@1.6.1` + `@1.5.0` — full tarball extraction & recursive diff against vendored tree (converter absence, normalization deltas, registry structure, resolver survival, VERSION absence). Scratch: `/tmp/gsd161.*`.
- `npm view @opengsd/gsd-core version` / `dist-tags` — `1.6.1` = `latest`, `next` = `1.7.0-rc.2`.
- Live repo: `src/installer/stage.cjs` (whole-dir copy L217, VERSION read L242, converter require L267), `scripts/fix-slash-commands.cjs` (transform directions), `scripts/generate-support-roster.cjs`, `UPSTREAM.md`, `gsd-core/bin/lib/runtime-artifact-conversion.cjs` (Bob block L674–778, exports L2015–2016).
- `npm test` baseline (186 pass / 3 fail) + `node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` (10/10).

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` Phase-02 decisions (converter modeled on Antigravity; gsd:→gsd- at emit time) — corroborates §3.

### Tertiary (LOW confidence)
- None — all claims tool-verified this session.

## Metadata

**Confidence breakdown:**
- Delta set / patch anchors: HIGH — direct tarball diff + grep against real 1.6.1.
- Converter survival: HIGH — proven absent from pristine tarball, present only in vendored tree.
- Golden drift map: MEDIUM-HIGH — expected-drift (version) certain; helper-behavior parity assumed, suite-verifiable.
- Normalization necessity: MEDIUM — verified as a real committed delta; functional necessity reasoned (A1).

**Research date:** 2026-07-03
**Valid until:** ~2026-08-03 for the 1.6.1 facts (immutable tarball — stable). Re-check if the phase retargets a newer gsd-core (e.g., 1.7.0).
