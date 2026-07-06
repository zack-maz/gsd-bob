# Phase 7: gsd-core 1.6.1 Sync - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 8 (2 net-new, 4 vendored patch sites, 1 doc, 1 golden fixture)
**Analogs found:** 8 / 8

> This is a re-vendor/delta-replay phase, not a feature build. The only net-new source
> artifact is `scripts/apply-bob-patches.cjs`; everything else is `npm pack` + `fs` ops +
> re-running the existing 18-suite `test/` harness. RESEARCH.md **corrects** CONTEXT.md:
> the local delta is NOT "two data-only edits" — it is `pristine tarball + a normalization
> pass (colon→hyphen + ~/.claude→$HOME) + FOUR bob patches + a local VERSION file`, and the
> Bob converters are ~105 lines of local HAND-EDITED code, not stock gsd-core. Patterns below
> are grounded in the real current tree.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/apply-bob-patches.cjs` (NEW) | utility / build-script | transform (file-I/O, idempotent in-place rewrite) | `scripts/fix-slash-commands.cjs` + `scripts/generate-support-roster.cjs` | exact (role) |
| `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` (NEW) | doc (live log) | batch (append-as-you-go) | `07-CONTEXT.md` / `07-RESEARCH.md` (phase-dir markdown) | role-match |
| `gsd-core/VERSION` (WRITE) | config artifact | file-I/O | (self — `stage.cjs` L242 reads it) | exact |
| `gsd-core/bin/lib/capability-registry.cjs` (RE-INJECT bob block) | config/data (patch site #2) | transform (anchor-insert) | its own current `"bob"` block L3045+ | exact |
| `gsd-core/bin/shared/runtime-aliases.manifest.json` (RE-INJECT alias) | config/data (patch site #4) | transform (structured-JSON edit) | its own current `"bob"` key (tail) | exact |
| `gsd-core/bin/lib/runtime-artifact-conversion.cjs` (RE-INJECT ~105-line converter block) | code (patch site #3) | transform (anchor-insert + export) | its own current Bob block L674–778, exports L2014–2016 | exact |
| `gsd-core/bin/lib/runtime-name-policy.cjs` (RE-INJECT alias — UNDOCUMENTED 4th patch) | config/data (patch site #5) | transform (anchor-insert) | its own current `FALLBACK_ALIASES` L22/38–39 | exact |
| `UPSTREAM.md` (UPDATE → 1.6.1 + re-point + correct converter framing) | doc (move inventory) | transform | its own current 5-artifact table L49–75 | exact |
| `test/installer/staged-shim-loads.test.cjs` (golden drift: `1.5.0`→`1.6.1`) | test | request-response | sibling installer tests | exact |

## Pattern Assignments

### `scripts/apply-bob-patches.cjs` (NEW — utility, transform)

**Analogs:** `scripts/fix-slash-commands.cjs` (normalization engine + reuse target), `scripts/generate-support-roster.cjs` (script header/CLI/derive-from-source style).

**CJS module + node-builtins-only header** (from `fix-slash-commands.cjs` L1, 18-19; `generate-support-roster.cjs` L1-2, 18-19):
```javascript
#!/usr/bin/env node
'use strict';
/** apply-bob-patches.cjs — reproduce the full local-delta set idempotently over a
 *  freshly-restaged pristine 1.6.1 gsd-core/ payload. */
const fs = require('node:fs');
const path = require('node:path');
```
CLAUDE.md mandate: **node built-ins only** (`node:fs`, `node:path`) — no third-party deps, no network, no exec. Writes only under `gsd-core/`.

**REUSE the normalization transform — do NOT hand-roll a regex, and do NOT run `fix-slash-commands.cjs` as `main`** (its `require.main` block runs the WRONG direction, hyphen→colon; RESEARCH Pitfall 4). Import the exported pure transform + command-name reader (`fix-slash-commands.cjs` L88-92, 94-110, 152-159):
```javascript
const { transformContentToHyphen, readCmdNames } = require('./fix-slash-commands.cjs');
// colon→hyphen: transformContentToHyphen(src, readCmdNames()) — pure, longest-first,
// word-boundary-safe, leaves gsd-sdk/gsd-tools untouched. Naturally idempotent
// (no `gsd:` left after first pass).
```

**Directory-walk pattern for the normalization pass** — mirror `fix-slash-commands.cjs` `processDir`/`processFile` (L112-139): recursive `readdirSync(dir,{withFileTypes:true})`, skip `SKIP_DIRS`, read → transform → write-if-changed, log a per-file replacement count. Apply over `gsd-core/{workflows,references,templates,contexts}` (the same subdirs `SEARCH_DIRS` lists, L24-28). The `$HOME` transform is a second pure replace: `content.replace(/(^|[^\w$])~\/\.claude/g, '$1$HOME/.claude')` (idempotent — no `~/` left after first pass; verify exact 129-line delta against the live diff during execution).

**Derive-command-names-from-source + graceful-missing-dir pattern** (`fix-slash-commands.cjs` `readCmdNames` L94-110; `generate-support-roster.cjs` L32-38): read `commands/gsd/*.md` stems; swallow ONLY `ENOENT`, re-throw everything else. Same fail-loud discipline the executor should keep.

**Anchor-based string insertion (NOT line numbers — RESEARCH Pitfall 2)** for the 3 non-JSON patch sites. 1.6.1 shifted these ~1000 lines. Anchor on stable sibling tokens and guard each site for idempotency (skip if already present):
- **Registry block (#2)** → `capability-registry.cjs`: insert the `"bob": { … }` block inside `const runtimes = {` immediately before the `"claude": {` line. Guard: skip if `/"bob":\s*{/` already inside the runtimes object. Current canonical block lives at L3045–3109 of the vendored file (includes the `gsd-bob HAND-EDIT` banner comment L3040-3043).
- **Converter block (#3)** → `runtime-artifact-conversion.cjs`: insert the ~105-line block (banner L674 `// --- Bob converters (gsd-bob HAND-EDIT to this GENERATED file; …)` + `convertClaudeToBobContent` L698 + `convertClaudeCommandToBobSkill` L735 + `convertClaudeCommandToBobCommand` L763) before `module.exports = {`, and add the 3 export lines (`convertClaudeToBobContent,` `convertClaudeCommandToBobSkill,` `convertClaudeCommandToBobCommand,`) inside the exports object — anchor on the existing `convertClaudeCommandToCursorCommand,` export line. Function decls are hoisted, so block placement is flexible. Guard: skip if `convertClaudeCommandToBobSkill` already declared.
- **Name-policy alias (#5, UNDOCUMENTED)** → `runtime-name-policy.cjs`: insert `bob: ['bob', 'bob-cli'],` after the `cline: ['cline', 'cline-cli'],` line inside `FALLBACK_ALIASES` (L22 open, L38 cline). Guard: skip if `bob:` present.

**Structured-JSON edit (drift-proof, per RESEARCH §4) for the alias manifest (#4)** → `runtime-aliases.manifest.json`:
```javascript
const obj = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
if (!obj.bob) obj.bob = ['bob', 'bob-cli'];
fs.writeFileSync(aliasPath, JSON.stringify(obj, null, 2) + '\n'); // preserve 2-space indent + trailing \n
```
Current tail entry is `"cline"` then `"bob"` (2-space indent, trailing newline — match it).

**Write VERSION (#6 — load-bearing; tarball ships NO VERSION file, RESEARCH §2):**
```javascript
fs.writeFileSync(path.join(repoRoot, 'gsd-core', 'VERSION'), '1.6.1'); // no trailing newline (current file is 5 bytes)
```
`stage.cjs` L242 does `readFileSync(.../VERSION).trim()` and throws ENOENT if missing → this write is mandatory, not cosmetic.

**Idempotency contract (D-02):** each of the 6 steps is a guarded no-op on re-run. This is the executable core of the Phase-10 runbook (nuke → restage clean 1.6.1 → run this script → validate).

**Recommendation (Open Question 1):** keep the canonical registry-block and converter-block text as inline JS template-string constants in the script (self-contained, best for the runbook narrative) rather than a `scripts/bob-patches/` fixture dir.

---

### `07-REVENDOR-NOTES.md` (NEW — doc, batch/live-log)

**Analog:** phase-dir markdown convention (`07-CONTEXT.md`, `07-RESEARCH.md`) — same directory, dated header, `##`-sectioned. No special format exists; classify as a plain planning doc.

**Required contents (D-11):** chronological exact-command log (pack/extract/nuke/restage), each gotcha/dead-end, the D-03 converter-existence re-verification result, the D-08 fixture-drift justifications (keyed by fixture name), and the SYNC-03 pointer re-verification results. **Record the `npm test` baseline (186 pass / 3 fail) BEFORE the re-vendor** so post-vendor deltas are attributable (RESEARCH — the 3 failures are pre-existing environmental noise: `acceptance-coverage.test.cjs:114/:128`, `core-loop-contract.test.cjs:126`; do NOT try to fix them here). Written live as-the-work-happens (D-10), not reconstructed from commits.

---

### `UPSTREAM.md` (UPDATE — doc, transform)

**Analog:** its own current 5-artifact table (L49–75) and header (L9 `**Targeted gsd-core version:** \`1.5.0\``).

**SYNC-03 is MORE than a line-number refresh** (RESEARCH §8). Four actions:
1. Bump L9 `1.5.0` → `1.6.1`.
2. Re-point all 5 pointers to 1.6.1 anchors (registry now in `const runtimes` ~L2742+; converters relocate; alias JSON tail; `dot-home` ~L84).
3. **ADD the missing 4th data patch to the inventory:** `runtime-name-policy.cjs` `bob: ['bob','bob-cli']` (currently undocumented).
4. **CORRECT the false "No new converter code / already exist upstream" framing** (current L58-59, L71-75): the converters are local ~105-line hand-edited code (in-file banner literally reads `gsd-bob HAND-EDIT to this GENERATED file`), never stock upstream. The honest "move vs rewrite" story: the 4 data patches are moves; the converters are a small parameterized rewrite a maintainer would fold into the converter family.

---

### `test/installer/staged-shim-loads.test.cjs` (golden drift — test)

**Analog:** sibling `test/installer/*.test.cjs`.

**Guaranteed EXPECTED-DRIFT (D-08):** its assertion that the staged `package.json` `version === '1.5.0'` (from the real payload) → update to `'1.6.1'`, with the one-line recorded justification "vendored gsd-core version legitimately bumped 1.5.0→1.6.1 (SYNC-01)". This is the ONE guaranteed golden update. All other goldens (`skill-golden`, `command-golden`, `text-mode-golden`) should stay GREEN (converters re-injected verbatim + helpers survive) — classify per D-08, never blanket-regenerate (Pitfall 3). Note `test/installer/stage.test.cjs` writes its OWN hermetic `VERSION='1.5.0'` fixture → NOT drift; touch only cosmetically.

## Shared Patterns

### Node-builtins-only, dependency-free scripts
**Source:** `scripts/fix-slash-commands.cjs` L18-19, `scripts/generate-support-roster.cjs` L18-21
**Apply to:** `apply-bob-patches.cjs`
```javascript
const fs = require('node:fs');
const path = require('node:path');
```
CLAUDE.md: no CLI framework, no `fs-extra`/`cpy`, no YAML parser in the install/patch path. `node:fs` (`readFileSync`/`writeFileSync`/`readdirSync`) + `node:path` only.

### Fail-loud, swallow-only-ENOENT error discipline
**Source:** `scripts/fix-slash-commands.cjs` `readCmdNames` L99-109
**Apply to:** every filesystem read in `apply-bob-patches.cjs`
```javascript
} catch (err) {
  if (err.code !== 'ENOENT') throw err; // real misconfig must propagate
  return []; // only the missing-dir case is graceful
}
```

### Idempotent guarded in-place rewrite (write only if changed)
**Source:** `scripts/fix-slash-commands.cjs` `processFile` L112-123
**Apply to:** all 6 patch steps
```javascript
const replaced = transform(src, ...);
if (replaced !== src) {
  fs.writeFileSync(file, replaced, 'utf-8');
  console.log(`  ${count} replacements: ${path.relative(root, file)}`);
}
```
Extend with a presence-guard (skip if `runtimes.bob` / `convertClaudeCommandToBobSkill` / alias key already present) so re-runs are no-ops.

### Vendored payload is root-anchored, whole-dir recursive copy
**Source:** `src/installer/stage.cjs` L129 (`payloadSrc = path.join(repoRoot, 'gsd-core')`), L217 (`listFilesRel(payloadSrc)`), L242 (VERSION read), L268-270 (converter require)
**Apply to:** restage mechanics + subset confirmation (D-05/D-06)
- No hand-picked file list — the curated subset IS whatever lives under `gsd-core/`; restage all of `bin contexts references templates workflows` + write `VERSION`.
- `stage.cjs` hard-depends on `gsd-core/VERSION` (L242 throws ENOENT if missing) and on the two Bob converters being requireable (L268-270 destructure → crash if absent). Both are why `apply-bob-patches.cjs` must own the VERSION write and converter re-injection, not just the two data edits.

## No Analog Found

None. Every file has a strong in-tree analog (mostly itself, pre-nuke).

## Metadata

**Analog search scope:** `scripts/`, `src/installer/`, `gsd-core/bin/{lib,shared}/`, `test/installer/`, repo-root docs, phase dir.
**Files scanned:** ~12 (2 script analogs read in full; 4 patch sites + stage.cjs + UPSTREAM.md inspected via targeted grep/sed).
**Pattern extraction date:** 2026-07-03
