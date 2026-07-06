# Phase 9: Command Expansion - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 3 categories (22 vendored sources, 1 regenerated roster, 8 regenerated fixtures, 1 new test)
**Analogs found:** 4 / 4 (every touched artifact has a concrete in-repo analog)

## Orientation for the planner

This is a **source-only, mechanical** phase (per RESEARCH). The machinery (converter, `stage.cjs` loop, `gateArtifact`, roster generator, NEUTRAL-03 invariant) is untouched and roster-agnostic. Do NOT map or edit `src/installer/stage.cjs`, `src/bob-adapter.cjs`, or `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — RESEARCH confirms zero machinery edits.

The 22 vendored `.md` files share ONE analog (they are pristine upstream, no authoring). The highest-value mapping is the **new verification test** — it has NO existing directory-derived equivalence analog, so it must be assembled from three real harness idioms already in the repo.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `commands/gsd/<18 new stems>.md` | config (vendored source) | file-I/O (verbatim copy) | any existing `commands/gsd/*.md` (e.g. `commands/gsd/progress.md`) | exact (same shape) |
| `commands/gsd/{code-review,debug,audit-fix,audit-uat}.md` (re-sync) | config (vendored source) | file-I/O (in-place replace) | their own current content vs 1.6.1 tarball | exact (same file) |
| `SUPPORT-ROSTER.md` (regenerated) | config (generated artifact) | transform (script output) | current `SUPPORT-ROSTER.md` + `scripts/generate-support-roster.cjs` | exact (same generator) |
| `test/fixtures/quality-gates/*.{command,skill}.expected.md` (8, regenerated) | test fixture | transform (converter output frozen) | the same 8 files + `test/quality-gate-equivalence.test.cjs` | exact (same producer) |
| `test/command-expansion.test.cjs` (NEW) | test | request-response (read dir → convert → assert) | `test/quality-gate-equivalence.test.cjs` + `test/model-neutrality.test.cjs` + `test/roster-capmap.test.cjs` | composed (no single directory-derived analog) |

## Pattern Assignments

### `commands/gsd/*.md` — the 18 new + 4 re-synced (config, file-I/O)

**Analog:** any existing source; representative = `commands/gsd/progress.md` (lines 1-14).

These are **pristine verbatim upstream** files. Copy them byte-for-byte from the `@opengsd/gsd-core@1.6.1` tarball; the converter does all Bob rewrites at emit time (F-02). Do NOT pre-transform. The analog shows the exact shape every vendored source must retain — **colon command form** (`name: gsd:progress`) and **full frontmatter** (`effort`, `allowed-tools`, `requires`) that the converter strips downstream:

```yaml
---
name: gsd:progress
description: Check progress, advance workflow, or dispatch freeform intent ...
argument-hint: "[--forensic | --next ...]"
effort: low
allowed-tools:
  - Read
  - Bash
  ...
requires: [phase]
---
```

**Fetch + byte-identity checkpoint** (RESEARCH Q1 — documented manual sequence, NOT a persistent script):
```bash
cd "$(mktemp -d)" && npm pack @opengsd/gsd-core@1.6.1
tar xzf opengsd-gsd-core-1.6.1.tgz                       # → ./package/commands/gsd/*.md
for c in <22 stems>; do cp package/commands/gsd/$c.md <repo>/commands/gsd/$c.md; done
for c in <22 stems>; do diff -q <repo>/commands/gsd/$c.md package/commands/gsd/$c.md || echo "DRIFT: $c"; done
```
18 new stems: `new-milestone complete-milestone milestone-summary quick fast ship explore spec-phase mvp-phase map-codebase ui-phase secure-phase extract-learnings docs-update health stats resume-work pause-work`. 4 re-sync stems: `code-review debug audit-fix audit-uat`.

---

### `SUPPORT-ROSTER.md` (config, generated)

**Analog:** `scripts/generate-support-roster.cjs` — the generator itself (do NOT hand-edit the roster).

Regenerate via `node scripts/generate-support-roster.cjs`. It is already directory-derived (`generate-support-roster.cjs:32-38`), so adding the 18 sources auto-produces the 28-supported + 2-skip roster with zero script edits:

```javascript
// generate-support-roster.cjs:32-38 — candidate set derived from commands/gsd/*.md
const commandsDir = path.join(__dirname, '..', 'commands', 'gsd');
const derivedCandidates = fs.existsSync(commandsDir)
  ? fs.readdirSync(commandsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ name: `gsd-${path.basename(f, '.md')}`, requires: [] }))
  : [];
```
The two curated skip fixtures (`gsd-autonomous`, `gsd-parallel-fanout`) are appended by the generator itself (`:44-47`) — the phase does nothing here. Commit the regenerated roster as a generated artifact.

---

### `test/fixtures/quality-gates/*.{command,skill}.expected.md` (8 files, regenerated)

**Analog:** `test/quality-gate-equivalence.test.cjs` — the consumer that byte-diffs these fixtures.

The 1.6.1 re-sync of the 4 drifted sources removes trailing blank lines, changing the emitted body — the frozen fixtures will no longer byte-match (RESEARCH Q5, Pitfall 1). Regenerate by running the vendored converter on the new sources and freezing output. There is **no generator script**; produce the exact output the test reads via `conv.convertClaudeCommandToBobCommand` / `...Skill`:

```javascript
// quality-gate-equivalence.test.cjs:39, 64-73 — how the fixtures are produced/consumed
const conv = requireVendor('runtime-artifact-conversion.cjs');
const out = conv.convertClaudeCommandToBobCommand(source, `gsd-${stem}`);   // → *.command.expected.md
const skill = conv.convertClaudeCommandToBobSkill(source, `gsd-${stem}`);   // → *.skill.expected.md
```
Regeneration recipe: for each of `code-review debug audit-fix audit-uat`, read the re-synced `commands/gsd/<stem>.md`, run both converters, write the output to `test/fixtures/quality-gates/<stem>.{command,skill}.expected.md`. Then `test/quality-gate-equivalence.test.cjs` (unchanged) goes green. Sequence this tightly with the re-sync — the suite is RED between re-sync and fixture regen.

---

### `test/command-expansion.test.cjs` (NEW test — highest-value mapping)

No existing test iterates the whole `commands/gsd/` directory for equivalence (RESEARCH Q4). Compose it from three real idioms:

**1. Directory-derived structural assertions** — adapt the per-stem loop and the programmatic-forbidden-token discipline from `test/quality-gate-equivalence.test.cjs`, but iterate the FULL directory instead of a hardcoded 4-name list, and drop the byte-golden diff (structural only):

```javascript
// Header/imports pattern — quality-gate-equivalence.test.cjs:32-53
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { requireVendor, repoRoot } = require('./_helpers/vendor.cjs');
const conv = requireVendor('runtime-artifact-conversion.cjs');

// Iterate the directory (NOT a hardcoded list) — the drift-proof spine
const cmdSrcDir = path.join(repoRoot, 'commands', 'gsd');
const stems = fs.readdirSync(cmdSrcDir).filter((f) => f.endsWith('.md'))
  .map((f) => path.basename(f, '.md'));

// Forbidden/required tokens built PROGRAMMATICALLY so this file's prose can't self-trip
const claudeHomePath = ['.', 'claude', '/'].join('');
const colonDialect = ['gsd', ':'].join('');
const bobHome = ['.', 'bob'].join('');
const hyphenForm = ['gsd', '-'].join('');
```
Per-stem structural assertions to copy verbatim from `quality-gate-equivalence.test.cjs:76-111`:
- command frontmatter: non-empty `description`, `argument-hint` IFF source declared one (`sourceHasArgumentHint = /^argument-hint:/m.test(source)`), strips `effort`/`allowed-tools`/`agent` (also strip `type`/`requires` per RESEARCH Q4a);
- skill frontmatter: `name` + non-empty `description` only, no `argument-hint`;
- bodies: no `claudeHomePath`, no `colonDialect`; carry `bobHome` + `hyphenForm`.

**2. Model-literal scan** — reuse `scanModelLiterals` (RESEARCH Q4a) exactly as `model-neutrality.test.cjs` imports it:
```javascript
// model-neutrality.test.cjs:36-42
const { scanModelLiterals } = require(path.join(repoRoot, 'src', 'bob-adapter.cjs'));
// then per converted output: assert.deepEqual(scanModelLiterals(out).map(...), [])
```

**3. `count == 28` assertion via a scratch `stage()` run** — reuse the scratch-tmpdir harness from `model-neutrality.test.cjs`:
```javascript
// model-neutrality.test.cjs:33, 48-50, 228-231 — scratch stage() harness
const { stage } = require(path.join(repoRoot, 'src', 'installer', 'stage.cjs'));
function scratch(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`)); }
// (see baseOpts/freshManifest at model-neutrality.test.cjs:67-74 for the stage opts shape)

const target = scratch('count');
stage(baseOpts({ target, repoRoot }));
const cmds = fs.readdirSync(path.join(target, 'commands')).filter((f) => /^gsd-.*\.md$/.test(f));
// Derive expected from source count; pin 28 in exactly ONE guard (Pitfall 4)
assert.equal(cmds.length, stems.length, 'emitted .bob/commands == source count');
assert.equal(stems.length, 28, 'CMD-01: commands/gsd/ holds exactly 28 sources');   // the single magic-28 guard
```
Also assert `skills/gsd-*/SKILL.md` count === 28 (mirror the emitted-path check at `model-neutrality.test.cjs:211-217`).

**Note on `baseOpts`/`freshManifest`:** read `test/model-neutrality.test.cjs:67-90` (and `test/installer/stage.test.cjs`) for the exact `stage()` options object (`scope`, `configHome`, `report`, `manifest`) before writing the count test — those helpers construct the report/manifest `stage()` requires.

**Real-answer guard:** do NOT author 11 bespoke real-answer goldens (RESEARCH Q4 forbids it). The existing Phase-4 guard in `test/core-loop-equivalence.test.cjs:114` still runs and covers the text_mode-capture contract. Optional single representative golden (`spec-phase` SPEC.md) is discretionary only.

## Shared Patterns

### Vendor-as-source, transform-at-emit (F-02)
**Source:** `commands/gsd/progress.md` (colon form + full frontmatter, verbatim upstream)
**Apply to:** all 22 vendored sources — copy pristine, never pre-transform; verify `diff -q` against the tarball.

### Directory-derived candidate set (drift-proof spine)
**Source:** `scripts/generate-support-roster.cjs:32-38`; mirrored in `test/roster-capmap.test.cjs:53-67`
**Apply to:** the roster regen AND the new test's stem enumeration. Never hardcode the 28-name list; derive from `readdirSync(commands/gsd)`. Pin the literal `28` in exactly one CMD-01 guard.

### Programmatic forbidden-token construction
**Source:** `test/quality-gate-equivalence.test.cjs:49-53`
**Apply to:** the new test — build `.claude/`, `gsd:`, `.bob`, `gsd-` via `.join('')` so the test prose never self-trips its own assertions.

### Scratch-tmpdir `stage()` emission harness
**Source:** `test/model-neutrality.test.cjs:33,48-50,67-74,228-231`
**Apply to:** the `count==28` assertion — reuse `mkdtempSync` scratch + real `stage()`, never re-implement emission. All scratch writes stay under `os.tmpdir()`.

### Vendored converter access (hermetic)
**Source:** `test/_helpers/vendor.cjs` (`requireVendor`, `repoRoot`)
**Apply to:** the new test — resolve `runtime-artifact-conversion.cjs` and `repoRoot` through this helper so it exercises the vendored gsd-core (carries the `bob` runtime), never the global install.

## No Analog Found

None. Every touched artifact has a concrete in-repo analog. The new `test/command-expansion.test.cjs` is the only "new" file, and it is fully composable from the three harness idioms above — no RESEARCH-example fallback needed.

## Metadata

**Analog search scope:** `commands/gsd/`, `test/`, `test/installer/`, `test/_helpers/`, `scripts/`, `test/fixtures/quality-gates/`
**Files scanned:** `commands/gsd/progress.md`, `scripts/generate-support-roster.cjs`, `test/quality-gate-equivalence.test.cjs`, `test/model-neutrality.test.cjs`, `test/roster-capmap.test.cjs`, `test/_helpers/vendor.cjs`, dir listings
**Pattern extraction date:** 2026-07-03
