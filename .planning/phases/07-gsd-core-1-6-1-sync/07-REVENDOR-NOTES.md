# 07 Re-vendor Notes — gsd-core 1.5.0 → 1.6.1 (live log)

**Started:** 2026-07-03
**Purpose:** Live raw log of the wholesale re-vendor (D-10/D-11), written as-the-work-happens.
This is the raw source Phase 10 (DOCS-04) turns into the MAINTAINING runbook — it must reflect
the real dance, not an aspirational one. Plans 07-02 and 07-03 APPEND to this file.

---

## Pre-vendor provenance anchor (Plan 07-01)

Captured BEFORE any payload mutation, so every post-vendor delta is attributable.

| Anchor | Value |
|--------|-------|
| Git HEAD (short SHA) | `d832efa` |
| `gsd-core/VERSION` | `1.5.0` (5 bytes, no trailing newline) |
| Target version | `1.6.1` (current `latest` dist-tag; `next` = `1.7.0-rc.2`) |
| Date | 2026-07-03 |

---

## Pre-vendor test baseline

`npm test` run on the current (1.5.0) tree BEFORE the re-vendor:

```
ℹ tests 189
ℹ pass  186
ℹ fail  3
```

**Baseline = 186 pass / 3 fail — this matches the RESEARCH-predicted baseline exactly.**

### The 3 failures are PRE-EXISTING ENVIRONMENTAL NOISE — NOT caused by the re-vendor

Per RESEARCH §"Golden-Fixture Drift Map" baseline note and Pitfall 5, these three failures
read archived `.planning/` fixtures that are absent from the current working tree. They belong
to archived phases and depend on planning fixtures that no longer exist. **Do NOT attempt to
"fix" these three in this phase** — only NEW failures introduced post-vendor are in scope for
the Plan 03 drift classification.

| # | Test | Assertion | Root cause (verbatim) |
|---|------|-----------|-----------------------|
| 1 | `test/acceptance-coverage.test.cjs` | `:114` — VERIFY-01 SC coverage | `REQUIREMENTS.md must contain the "## v2 Requirements" boundary` — reads an archived `.planning/` fixture layout absent from the working tree |
| 2 | `test/acceptance-coverage.test.cjs` | `:128` — VERIFY-01 AC references only real canonical requirement IDs | same `## v2 Requirements` boundary assertion in `canonicalSCs()` (`acceptance-coverage.test.cjs:68`) |
| 3 | `test/core-loop-contract.test.cjs` | `:126` — CORE-02 produced PLAN.md markers | `ENOENT` reading missing `.planning/phases/04-core-loop-port/04-01-PLAN.md` (archived phase fixture) |

**Attribution rule for Plan 03:** post-vendor, subtract this baseline. If `npm test` still shows
exactly these 3 failures (same test IDs), the re-vendor introduced zero regressions. Any NEW
failing test ID is a real re-vendor delta to classify under D-08 (expected-drift → regenerate +
justify; regression → fix).

---

## Command Log (appended live in Plans 02/03)

Chronological exact-command log of pack / extract / nuke / restage / patch / validate.
Each gotcha and dead-end recorded in the moment.

<!-- Plan 02 appends: npm pack, extract, nuke, restage, run apply-bob-patches.cjs, version-consistency check -->
<!-- Plan 03 appends: suite run, drift classification, UPSTREAM.md pointer re-verification -->

### Plan 02 — Task 1: pack + nuke + restage (2026-07-03)

**Pre-restage tracked count:** `git ls-files gsd-core/ | wc -l` → **382** (1.5.0 tree).

```bash
# 1) Immutable pack (D-04) into a scratch tmp dir
SCRATCH=$(mktemp -d /tmp/gsd161.XXXXXX)   # → /tmp/gsd161.INiYEs
cd "$SCRATCH"
npm pack @opengsd/gsd-core@1.6.1
#   → opengsd-gsd-core-1.6.1.tgz
#   → total files: 707  shasum: b68686cc04e654f449546010bb0d6dfa4dc2e464
#   → integrity: sha512-0SyHK3qGoIFgN...==

# 2) Extract + confirm payload root BEFORE copying (do not assume)
tar -xzf opengsd-gsd-core-1.6.1.tgz
ls package/gsd-core/       # → bin contexts references templates workflows  (5 subdirs, identical structure)
test -f package/gsd-core/VERSION           # → ABSENT (tarball ships no VERSION — RESEARCH §2, written in Task 2)
test -f package/gsd-core/workflows/list-seeds.md   # → PRESENT (1.6.1-only new file, proves wholesale replace)

# 3) NUKE the five curated tracked subdirs (D-05 — the only mechanic guaranteeing SYNC-01 no-mix)
cd <repo-root>
for d in bin contexts references templates workflows; do rm -rf "gsd-core/$d"; done

# 4) RESTAGE the identical curated subset from the extracted tarball (D-06 — boundary unchanged, 5 subdirs)
SRC="$SCRATCH/package/gsd-core"
for d in bin contexts references templates workflows; do cp -R "$SRC/$d" "gsd-core/$d"; done
#   NOTE: gsd-core/VERSION deliberately NOT restaged (tarball ships none; Task-2 script writes 1.6.1).
```

**Confirmed payload root path:** `package/gsd-core/{bin,contexts,references,templates,workflows}` (verified by `ls` before copy — no `package/` double-nesting, no new top-level dir; RESEARCH §5 structure-identical confirmed).

**Post-restage working-tree file count:** `find gsd-core -type f | wc -l` → **402** (+20 new 1.6.1 files land inside existing dirs, picked up by the recursive copy).

**Restage verify one-liner:** `test -f gsd-core/workflows/list-seeds.md && for d in bin contexts references templates workflows; do test -d "gsd-core/$d"; done` → `restage ok`.

**Pristine-state confirmation (BEFORE the Task-2 patch run — all expected):**
- `grep -c convertClaudeCommandToBobSkill gsd-core/bin/lib/runtime-artifact-conversion.cjs` → **0** (Bob converters absent in pristine — re-injected in Task 2).
- `grep -c '"id": "bob"' gsd-core/bin/lib/capability-registry.cjs` → **0** (bob registry absent — re-injected in Task 2).
- Colon command form still present (e.g. `gsd-core/workflows/autonomous.md`, `list-phase-assumptions.md`, `validate-phase.md`) — normalized in Task 2.
- `gsd-core/VERSION` still reads `1.5.0` (untouched by restage; overwritten to 1.6.1 by apply-bob-patches.cjs in Task 2).

**Gotchas/dead-ends:** none — pack, extract, nuke and restage all clean on the first pass. `npm pack` required network (immutable registry-signed tarball, D-04 / T-07-SC Approved).

### Plan 02 — Task 2: re-inject deltas + idempotency + seam re-verification (2026-07-03)

```bash
# RUN 1 — reproduce all six local deltas over the pristine 1.6.1 tree
node scripts/apply-bob-patches.cjs
#   [1] colon→hyphen: 90 file(s) changed
#   [2] ~/.claude→$HOME: 41 file(s) changed   (scanned 234 .md under workflows,references,templates,contexts)
#   [3] registry: "bob" block inserted before "claude" in const runtimes
#   [4a] converter block: inserted before module.exports
#   [4b] converter exports: 3 symbols added
#   [5a] alias manifest: "bob" key added
#   [5b] name-policy alias: "bob" entry added after "cline"
#   [6] VERSION: wrote 1.6.1

# IDEMPOTENCY PROOF (D-02) — compare run-1 output to run-2 output DIRECTLY (NOT vs HEAD).
git add gsd-core/                       # stage post-run-1 tree as the comparison baseline
node scripts/apply-bob-patches.cjs      # RUN 2 — every step reported "already applied — no-op" / "0 changed"
git diff --quiet gsd-core/              # → clean: second run is a pure no-op vs the staged post-run-1 tree
#   → "IDEMPOTENT: re-run made zero changes vs staged post-run-1 tree"
```

**Idempotency verdict:** PROVEN AT RUNTIME. Run 2 reported `[1] 0 changed`, `[2] 0 changed`, and every patch step `already applied — no-op`; `git diff --quiet gsd-core/` against the staged post-run-1 tree is clean. The colon→hyphen normalization is therefore at a fixed point — no real command-form `gsd:<cmd>` survived (the 3 intentional `gsd:...`/`gsd:X` placeholders and stock `bin/` colon strings are expected and untouched, per RESEARCH §1).

**Normalization scope reconfirmed against the live run (RESEARCH A2):**
- colon→hyphen: **90** .md files changed (RESEARCH predicted ~88 — within the doc-tree band; delta is `contexts/` now in scope).
- ~/.claude→$HOME: **41** .md files changed (RESEARCH A2 targeted ≈129 *lines*; file-count 41 is consistent — one file carries many lines).
- Post-run: `grep -rn '~/\.claude' gsd-core/{workflows,references,templates,contexts}` → **empty** (all doc-tree occurrences rewritten to `$HOME/.claude`). Stock `bin/` `~/.claude` comments/literals are NEVER normalized (RESEARCH §1) and are out of scope.

**SYNC-01 payload version-consistency (D-07):**
- `cat gsd-core/VERSION` → `1.6.1` ✅
- `grep -rn '1\.5\.0' gsd-core/` → **one hit only**: `gsd-core/bin/lib/legacy-cleanup.cjs:225` — a **STOCK UPSTREAM comment** (`// When Codex upgrades to gsd-core 1.5.0 it writes fresh skill files to`), verified byte-identical in the pristine 1.6.1 tarball. This is a historical Codex-migration reference, **NOT our payload's version marker**. See DEVIATION below. Scoped assertion `grep -rn '1\.5\.0' gsd-core/ | grep -v 'legacy-cleanup.cjs:225:'` → empty ✅ (no payload-version 1.5.0/1.6.1 mix).

**SYNC-02 seam re-verification (both seams):**
- Seam A — converter existence: `require('./gsd-core/bin/lib/runtime-artifact-conversion.cjs')` exposes both `convertClaudeCommandToBobSkill` and `convertClaudeCommandToBobCommand` as functions ✅.
- Seam B — registry + aliases: `require('./gsd-core/bin/lib/capability-registry.cjs')` loads clean; `runtimes.bob` resolves (`id=bob title="IBM Bob" configHome.name=.bob env=["BOB_CONFIG_DIR"]`); `runtime-aliases.manifest.json` `bob=["bob","bob-cli"]`; `runtime-name-policy.cjs` carries `bob:` alias ✅.
- `node --check` on all three patched `.cjs` (capability-registry, runtime-artifact-conversion, runtime-name-policy) → syntax OK ✅ (anchor inserts did not corrupt JS — mitigates T-07-04).

**DEVIATION [Rule 1-adjacent / research-premise correction] — stock 1.5.0 comment in 1.6.1:**
RESEARCH §7 asserted "the only place 1.5.0 could live is `gsd-core/VERSION`" — that fact was verified against the **1.5.0** pristine tarball. The **1.6.1** payload ships a NEW stock file line (`bin/lib/legacy-cleanup.cjs:225`) containing the literal `1.5.0` inside an upstream historical comment about Codex skill-migration (#1453). It is immutable stock upstream content, identical in the packed tarball, in the same class as the stock `bin/` `~/.claude` (~20) and `/gsd:` colon (~38) strings the plan already scopes OUT of its assertions. **Resolution: NOT edited.** Editing stock `bin/` code would (a) introduce an undocumented 7th delta the patch script does not reproduce → breaking D-02 idempotency and the Phase-10 runbook, and (b) corrupt the nuke-and-restage "pristine + exactly six deltas" integrity contract (T-07-03). The SYNC-01 semantic intent — the payload carries ONE consistent version with no 1.5.0/1.6.1 mix — holds: `VERSION`=1.6.1 and no version-marker residue. The literal must-have grep is refined to exclude this single stock historical-reference line. (Plan 03's residue sweep is doc/test-scoped and does not touch stock `bin/` either.)

---

---

## D-03 converter re-verification result (filled in Plan 02/03)

Re-verify `convertClaudeCommandToBobSkill` / `convertClaudeCommandToBobCommand` behavior after
re-injection into the 1.6.1 `runtime-artifact-conversion.cjs`. Per RESEARCH §3 these are LOCAL
hand-edited code (in-file banner `gsd-bob HAND-EDIT to this GENERATED file`), NOT stock gsd-core —
they must be re-injected wholesale by `apply-bob-patches.cjs`, not treated as upstream functions.

**D-03 VERDICT (Plan 02, 2026-07-03):** converters re-injected; `require('./gsd-core/bin/lib/runtime-artifact-conversion.cjs')` resolves BOTH `convertClaudeCommandToBobSkill` and `convertClaudeCommandToBobCommand` as functions — **no upstream rename break, because the converters were never stock upstream** (grep-confirmed absent from the pristine 1.6.1 tarball; present only after `apply-bob-patches.cjs` re-injects the ~105-line block + 3 exports). This is the re-injection contract holding, NOT a stock-function existence check. `node --check` on the patched file passes (anchor insert before `module.exports` + the 3 export symbols after `convertClaudeCommandToCursorCommand,` did not corrupt syntax). All block dependencies (`yamlQuote`, `extractFrontmatterAndBody`, `extractFrontmatterField`) survive in 1.6.1's file — the require resolves clean. Golden byte-equivalence of the converter OUTPUT is validated by the skill/command/text-mode suites in Plan 03.

---

## D-08 fixture-drift justifications (keyed by fixture name) (filled in Plan 03)

One-line recorded justification per regenerated golden fixture. Invariants
(`test/backend-neutrality.test.cjs`, `test/descriptor.test.cjs`) are NOT drift-eligible (D-09).
Expected guaranteed drift: `test/installer/staged-shim-loads.test.cjs` version `1.5.0` → `1.6.1`.

### Plan 03 — Task 1: suite re-run + drift classification (2026-07-03)

**Step 1 — D-09 invariants FIRST (unmodified):**
```bash
node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs
#   → tests 10  pass 10  fail 0   ✅ (both files UNMODIFIED)
```
backend-neutrality brace-walked the re-injected bob registry block (zero brand literals survived
the 1.6.1 re-injection); descriptor confirmed the shim resolves the `.bob` home under the 1.6.1
bin (RUNTIME-01/02, the SYNC-02 shim path). **No regression — invariants pass 10/10 unmodified.**

**Step 2 — full suite UNCHANGED against 1.6.1 (before any fixture edit):**
```bash
npm test
#   → tests 189  pass 185  fail 4
```
Diffed against the recorded **186 pass / 3 fail** baseline. The 4 failures decompose as **the 3
pre-existing baseline failures + exactly 1 new failure**:

| Failing test | Baseline? | Classification |
|--------------|-----------|----------------|
| `acceptance-coverage.test.cjs` :114 (VERIFY-01 SC coverage) | YES (noise #1) | pre-existing — NOT touched (Pitfall 5) |
| `acceptance-coverage.test.cjs` :128 (VERIFY-01 AC refs) | YES (noise #2) | pre-existing — NOT touched (Pitfall 5) |
| `core-loop-contract.test.cjs` :126 (CORE-02 PLAN.md markers, ENOENT archived fixture) | YES (noise #3) | pre-existing — NOT touched (Pitfall 5) |
| `installer/staged-shim-loads.test.cjs` :65 (`'1.6.1' !== '1.5.0'`) | **NO — new** | **EXPECTED DRIFT** (the one guaranteed golden) |

**No unexpected regressions.** The single new failure is the guaranteed version drift the RESEARCH
Drift Map predicted. The three converter/text goldens (`skill-golden`, `command-golden`,
`text-mode-golden`) stayed **GREEN** — confirming the converters + their helpers (`yamlQuote`,
`transformContentToHyphen`, `readCmdNames`) survived the verbatim re-injection into 1.6.1's
`runtime-artifact-conversion.cjs` (D-03 output byte-equivalence holds). `stage.test.cjs` writes its
own hermetic VERSION fixture and stayed green (not drift).

**Step 3 — apply the ONE guaranteed expected-drift + re-verify:**
```bash
# test/installer/staged-shim-loads.test.cjs L65: '1.5.0' → '1.6.1'
node --test test/installer/staged-shim-loads.test.cjs   # → pass 1
npm test                                                 # → tests 189  pass 186  fail 3
```
Post-fixture the suite is back to **exactly the 186/3 baseline** — the remaining 3 failures are the
identical pre-existing environmental-noise test IDs (same assertions), so the re-vendor introduced
**zero regressions**.

**Drift justification (keyed by fixture name):**

| Fixture | Old → New | Justification |
|---------|-----------|---------------|
| `test/installer/staged-shim-loads.test.cjs` (L65) | asserts `pkg.version` `1.5.0` → `1.6.1` | Vendored gsd-core version legitimately bumped 1.5.0→1.6.1 (SYNC-01); the staged `package.json` now stamps 1.6.1. Pure version-marker drift, not a converter/behavior change. |

No other golden was regenerated — no blanket regeneration (D-08 respected; T-07-05 mitigated).

---

## SYNC-03 pointer re-verification (filled in Plan 03)

Re-verify every `UPSTREAM.md` file:line pointer against the 1.6.1 source (5-artifact move
inventory + the undocumented name-policy alias, 4th data patch). Bump targeted version 1.5.0 →
1.6.1 and correct the "converters are stock upstream" framing (they are a vendored hand-edit).

### Plan 03 — Task 2: UPSTREAM.md → 1.6.1 pointer re-verification (2026-07-03)

Every pointer grep'd/inspected against the **re-vendored 1.6.1 source** (never copied from the
stale 1.5.0 numbers). Old (1.5.0) → New (1.6.1) file:line for each artifact:

| # | Artifact | 1.5.0 (old) | 1.6.1 (re-verified) | Command used |
|---|----------|-------------|---------------------|--------------|
| 1 | `"bob"` registry entry | `capability-registry.cjs` L3045–3109 | **L2876–2940** (configHome L2884–2888, artifactLayout L2892–2929, commandStyle L2930) | `grep -n '"bob": {' …capability-registry.cjs` → L2876; block closes at L2940 before `"claude"` L2941 |
| 2 | Command converter impl | `runtime-artifact-conversion.cjs` L763 (export L2016); registry L3077/L3095 | **impl L2427, export L2462**; registry **L2908 / L2926** | `grep -n 'function convertClaudeCommandToBobCommand\|convertClaudeCommandToBobCommand,'` |
| 3 | Skill converter impl | `runtime-artifact-conversion.cjs` L735 (export L2015); registry L3069/L3087 | **impl L2399, export L2461**; registry **L2900 / L2918**; HAND-EDIT banner **L2338** | `grep -n 'function convertClaudeCommandToBobSkill\|gsd-bob HAND-EDIT'` |
| 4 | Runtime alias (manifest) | `runtime-aliases.manifest.json` L79–82 | **L79–82** (unchanged) | `grep -n '"bob"' …runtime-aliases.manifest.json` |
| 5 | Runtime alias (name-policy) — **newly documented 4th data patch** | (absent from inventory) | `runtime-name-policy.cjs` **L41** (`bob: ['bob','bob-cli']` in `FALLBACK_ALIASES`) | `grep -n 'bob' …runtime-name-policy.cjs` |
| 6 | configHome / shim resolution | `runtime-homes.cjs` dot-home L83–91 | **L84–92** (`case 'dot-home'`); shim **0 bob refs** | `grep -n "case 'dot-home'"` + `grep -c -i 'bob' …gsd-tools.cjs` → 0 |

**Framing correction (SYNC-03 honesty fix):** the prior UPSTREAM.md claimed "No new converter
code … they already exist upstream." That is FALSE. The two Bob converters are a **local
~105-line hand-edit** (banner `gsd-bob HAND-EDIT to this GENERATED file` at L2338), grep-confirmed
ABSENT from the pristine 1.6.1 tarball and present only after `apply-bob-patches.cjs` re-injects
them (Plan 02 D-03 verdict). Reframed honestly: the registry entry + both aliases are pure-data
moves; the converters are a small parameterized rewrite of gsd-core's
`convertClaudeCommandTo<Runtime>{Skill,Command}` family a maintainer would fold upstream. The
inventory grew **5 → 6 artifacts** (added the name-policy alias, artifact #5). The
backend-neutrality guarantee section was left accurate (unchanged).

---

## Plan 03 — Task 3: final 1.5.0 sweep outside the payload (2026-07-03)

The payload itself was cleared in Plan 02 (VERSION=1.6.1; no version-marker residue). This task
swept the last 1.5.0 references OUTSIDE `gsd-core/`:

```bash
# README.md L93: "gsd-core 1.5.0" → "gsd-core 1.6.1" (+ reconciled the one-line move summary
#   to the corrected 6-artifact / two-converter framing)
# src/installer/stage.cjs L239: comment "gsd-core/VERSION → 1.5.0" → "→ 1.6.1"
#   (cosmetic only — L242 reads VERSION dynamically at runtime, so non-functional)
grep -n '1\.5\.0' README.md src/installer/stage.cjs   # → (none)
```

**SYNC-01 full assertion (scoped per Plan 02 deviation):**
```bash
cat gsd-core/VERSION                                        # → 1.6.1 ✅
grep -rn '1\.5\.0' gsd-core/ | grep -v 'legacy-cleanup.cjs:225:'   # → empty ✅
grep -q '1\.5\.0' README.md UPSTREAM.md src/installer/stage.cjs    # → no match ✅
```

**Remaining 1.5.0 mentions — INTENTIONALLY out of scope (a reviewer should NOT treat these as residue):**

| Location | Why it stays |
|----------|--------------|
| `gsd-core/bin/lib/legacy-cleanup.cjs:225` | Stock upstream historical comment (`// When Codex upgrades to gsd-core 1.5.0 …`), byte-identical in the 1.6.1 tarball. Editing it = an undocumented 7th delta that breaks `apply-bob-patches.cjs` idempotency + nuke-and-restage integrity (Plan 02 deviation / T-07-03). **LEAVE ALONE.** |
| `test/installer/stage.test.cjs:47` | Hermetic self-written VERSION fixture (`fs.writeFileSync(... 'VERSION'), '1.5.0')`) — the test synthesizes its OWN sandbox tree; NOT drift, NOT the real payload version. |
| `.claude/CLAUDE.md` (L28/L125/L141/L142) | Point-in-time research context ("gsd-core latest was 1.5.0 at research time") — a historical provenance note, not a live version marker. Out of the SYNC-01 sweep scope. |
| Root `*.tgz` publish artifacts + archived `.planning/` phase docs (e.g. ROADMAP historical PLAN lines) | Immutable historical artifacts / narrative history (RESEARCH Open Question 2). |

---

## Runbook seed — the replayable recipe (for Phase 10 / DOCS-04)

This is the executed dance, distilled to the exact replayable sequence a future gsd-core bump follows:

1. **Pack (immutable, D-04):** `npm pack @opengsd/gsd-core@<new>` into a scratch tmp dir; `tar -xzf`; confirm payload root `package/gsd-core/{bin,contexts,references,templates,workflows}` by `ls` BEFORE copying (never assume).
2. **Nuke (D-05):** `rm -rf gsd-core/{bin,contexts,references,templates,workflows}` (the tracked curated subset; VERSION is NOT in the tarball — the patch script writes it).
3. **Restage (D-06):** `cp -R` the identical 5 subdirs from the extracted tarball; keep the curated-subset boundary unchanged.
4. **Re-inject the six local deltas:** `node scripts/apply-bob-patches.cjs` (colon→hyphen, ~/.claude→$HOME, bob registry block, ~105-line converter block + 3 exports, both aliases, VERSION=<new>). Prove idempotency: `git add gsd-core/`, run the script a 2nd time (all no-ops), `git diff --quiet gsd-core/`.
5. **Run suites + apply the drift policy (D-08/D-09):** run the invariants FIRST (`node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` — must pass unmodified); then `npm test`, subtract the recorded baseline, and classify each non-baseline failure (expected-drift → regenerate that fixture + one-line justification keyed by fixture name; regression → fix). The guaranteed drift is the staged package.json version fixture.
6. **Update UPSTREAM.md (SYNC-03):** bump targeted version, re-verify all 6 pointers against the new source (never copy stale line numbers), keep the honest "converters are a vendored hand-edit, not stock" framing.
7. **Version-consistency check (SYNC-01):** `gsd-core/VERSION`=<new>; `grep -rn '<old>' gsd-core/` empty except the stock `legacy-cleanup.cjs` historical line; no `<old>` in README.md / UPSTREAM.md / stage.cjs comment.

**Gotchas carried forward for the runbook:** (a) the stock `legacy-cleanup.cjs` historical `1.5.0` comment is a permanent expected exception — scope every version grep to exclude it; (b) `npm pack` requires network; (c) the converters are LOCAL hand-edits, so a "does the function still exist upstream?" check is meaningless — the re-injection contract (grep-absent in tarball, present post-script) is what matters; (d) the 3 baseline `npm test` failures are pre-existing environmental noise (archived `.planning/` fixtures) — never in scope.

**Status:** Phase 07 re-vendor COMPLETE — payload at 1.6.1, six deltas re-injected + idempotent, suites at the 186/3 baseline (invariants 10/10 unmodified), UPSTREAM.md re-verified to 1.6.1, version-consistency clean.
