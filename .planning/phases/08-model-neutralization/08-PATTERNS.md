# Phase 8: Model Neutralization - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 4 (2 modify, 1 create, 1 modify-doc)
**Analogs found:** 4 / 4 (all in-repo, exact/role matches)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/bob-adapter.cjs` (MODIFY) | utility (content transform + shared constants) | transform (string→string) | same-file exports `gateArtifact` / `buildSupportRoster` | exact (same file, same export idiom) |
| `src/installer/stage.cjs` (MODIFY) | service (staging engine) | transform → file-I/O | same-file convertible loop L263-291 (calls `gateArtifact`, `mergeCustomModes`) | exact (same file, same call-adapter idiom) |
| `test/model-neutrality.test.cjs` (CREATE) | test (invariant) | request-response (drive real staging, scan output) | `test/installer/stage.test.cjs` (real-staging harness) + `test/backend-neutrality.test.cjs` (zero-literal loud assert) | role + data-flow match |
| `.planning/ACCEPTANCE-CHECKLIST.md` (MODIFY) | config/doc (device-runnable acceptance) | batch (append-only step) | AC-22..AC-26 step structure + `test/acceptance-coverage.test.cjs` traceability | exact (same doc, frozen-append idiom) |

## Pattern Assignments

### `src/bob-adapter.cjs` (utility, transform) — ADD `neutralizeModelReferences` + shared regex constants + `scanModelLiterals`

**Analog:** the existing exported helpers in this same file. Copy the module-level-const → pure-function → `module.exports` object shape.

**Header/module doc convention** (lines 3-22): file opens with a jsdoc block that names the isolation invariant and lists each export with a one-line contract, then declares module-level constants (`UNSUPPORTED_MARKER`). New constants (`MODEL_TIER_RE_SOURCE`, `MODEL_DIRECTIVE_RE_SOURCE`, `MODEL_TIER_REPLACEMENTS`) and the two new function jsdoc lines should be added to this header list to match.

**Export/signature style** (lines 200-246): pure functions taking primitive args, returning plain values, no side effects, no I/O. `gateArtifact(candidate, capabilityDecl)` returns `{supported, reason}`; `buildSupportRoster` returns `string[]`. Mirror this: `neutralizeModelReferences(content)` returns a string; `scanModelLiterals(content)` returns `Array<{line, token}>`.

**Existing `module.exports` block to extend** (lines 248-256):
```javascript
module.exports = {
  UNSUPPORTED_MARKER,
  BOB_SKIP_LIST,
  emitGsdMode,
  mergeCustomModes,
  unmergeCustomModes,
  gateArtifact,
  buildSupportRoster,
  // ADD: MODEL_TIER_RE_SOURCE, MODEL_DIRECTIVE_RE_SOURCE,
  //      MODEL_TIER_REPLACEMENTS, neutralizeModelReferences, scanModelLiterals
};
```

**Shape to implement** (from RESEARCH.md Pattern 1, D-03 — export SOURCE strings, never a shared `/g` RegExp instance):
```javascript
const MODEL_TIER_RE_SOURCE = '\\b(opus|sonnet|haiku)\\b';
const MODEL_DIRECTIVE_RE_SOURCE = '^[ \\t]*(model|effort|model_profile|resolve_model_ids)[ \\t]*:.*$';
const MODEL_TIER_REPLACEMENTS = { opus: 'a higher-capability model', sonnet: 'a balanced model', haiku: 'a faster model' };
// neutralizeModelReferences: (1) model-ID pre-collapse (Pitfall 1), (2) strip directive lines, (3) rewrite tier prose
// scanModelLiterals: per-line, construct fresh RegExp / reset lastIndex; return {line, token}
```

**Concrete rule the planner must cite:** NEVER edit the vendored converter `gsd-core/bin/lib/runtime-artifact-conversion.cjs` (D-02). The neutralizer is a wrapper only.

---

### `src/installer/stage.cjs` (service, transform → file-I/O) — wrap both converter outputs in the convertible loop

**Analog:** the convertible loop already in this file (lines 263-291) and its adapter-require block (lines 27-30+).

**Require pattern to extend** (lines 27-30): `stage.cjs` destructures adapter functions from `../bob-adapter.cjs` at top of file — add `neutralizeModelReferences` to that same destructure.

**Exact call sites to wrap** (lines 278-286) — the two `stageFile(...)` calls currently emit raw converter output:
```javascript
stageFile(
  path.join('commands', `${name}.md`),
  Buffer.from(convertClaudeCommandToBobCommand(content, name)),
);
stageFile(
  path.join('skills', name, 'SKILL.md'),
  Buffer.from(convertClaudeCommandToBobSkill(content, name)),
);
```
Wrap each converter call: `Buffer.from(neutralizeModelReferences(convertClaudeCommandToBobCommand(content, name)))` and the skill equivalent. Do NOT touch structural piece 2 (the raw `.bob/gsd-core/**` byte-copy) — D-01 excludes it.

**Idiom being followed** (lines 264-275): the loop lazily requires the vendored converter, gates each candidate via `gateArtifact(candidate, BOB_CAPABILITY_DECL).supported`, then emits. The neutralizer slots in as a post-pass inside the already-gated branch — `stage.cjs` calls the adapter, never inlines rewrite logic (matches how it calls `gateArtifact` / `mergeCustomModes`).

---

### `test/model-neutrality.test.cjs` (test, invariant) — CREATE

**Analog A — real-staging harness:** `test/installer/stage.test.cjs` (lines 1-129). Copy verbatim:
- Requires: `node:test`, `node:assert/strict`, `node:fs`, `node:os`, `node:path`, and `const { repoRoot: pkgRoot } = require('../_helpers/vendor.cjs');` (line 19).
- `const { stage } = require(path.join(pkgRoot, 'src', 'installer', 'stage.cjs'));` (line 21) + `newReport` (line 22) + `manifestMod` (line 23).
- `scratch(prefix)` = `fs.mkdtempSync(path.join(os.tmpdir(), ...))` (lines 28-30).
- `freshManifest(target)` → `manifestMod.buildManifest({scope:'local', configHome:target, gsdBobVersion:'0.0.0-test', entries:[]})` (lines 106-113).
- `baseOpts(overrides)` → `{target, scope:'local', workspaceRoot, dryRun:false, manifest, report, repoRoot}` (lines 115-129).
- **Key difference for full real emission:** set `repoRoot = pkgRoot` (not `fixtureRepoRoot()`) so ALL real `commands/gsd/*.md` sources convert (mirrors `test/installer/install-clean.test.cjs`). Then `stage(baseOpts({ repoRoot: pkgRoot, target }))`.

**Analog B — zero-literal loud-assert idiom:** `test/backend-neutrality.test.cjs` (lines 74-90). Copy the `hits`-collector → `assert.deepEqual(hits, [], <message>)` shape. Difference: NEUTRAL-03 message must be actionable `file:line:token` (not a JSON count), and it imports `scanModelLiterals` from `bob-adapter.cjs` rather than a base64 token set (the shared-regex mandate D-03 replaces the programmatic-token trick).

**Enumeration scope (Pitfall 3 — D-01):** scan ONLY `path.join(target,'commands')` (gsd-*.md) + `path.join(target,'skills')` (gsd-*/SKILL.md). NEVER `target/gsd-core`. Build `hits` as `` `${path.join(root, rel)}:${h.line}:${h.token}` `` then `assert.deepEqual(hits, [], ...)`.

---

### `.planning/ACCEPTANCE-CHECKLIST.md` (config/doc, append-only) — append AC-27

**Analog:** the frozen AC-22..AC-26 blocks (lines 232-264). Each block is exactly:
```
## AC-NN — <title> (FAMILY-NN)

Cmd:    <device-runnable shell, read-only where possible>
Expect: <observable pass condition>
Confirms: <FAMILY-NN> — <prose> / SC#N. (complement to test/...)
Result: [ ] pass  [ ] fail
```
Append `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` AFTER AC-26. Keep AC-01..AC-26 byte-unchanged (Pitfall 4).

**Device-runnable Cmd to embed** (RESEARCH.md L295-297) — grep returning zero lines = PASS:
```bash
grep -rniE '\b(opus|sonnet|haiku)\b|^[[:space:]]*(model|effort|model_profile|resolve_model_ids)[[:space:]]*:' \
  "$BOB_HOME"/commands/gsd-*.md "$BOB_HOME"/skills/gsd-*/SKILL.md
```

**⚠ CROSS-SUITE COUPLING (highest-risk integration point — RESEARCH.md Open Q1 / Pitfall 4):** `test/acceptance-coverage.test.cjs` derives canonical IDs from the v1 section only via `ID_RE = /\b(SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP)-\d+\b/g` (line 44) and validates every `Confirms:` token with `GENERIC_ID_RE = /\b[A-Z]{2,}-\d+\b/g` (line 50). `NEUTRAL-*` is a v2 family, NOT canonical there → a bare `Confirms: NEUTRAL-03` line makes the phantom-ref check FAIL. `canonicalSCs()` (lines 65-76) slices at `md.indexOf('## v2 Requirements')`. The planner MUST decide one of: (a) teach `acceptance-coverage.test.cjs` to admit v2 families below the boundary, (b) author AC-27 without a canonical-family token, or (c) defer to Phase 11. Recommendation in RESEARCH.md = (a).

## Shared Patterns

### Single-source shared regex (D-03)
**Source:** new constants in `src/bob-adapter.cjs` (`MODEL_TIER_RE_SOURCE`, `MODEL_DIRECTIVE_RE_SOURCE`).
**Apply to:** BOTH `neutralizeModelReferences` (the pass) and `test/model-neutrality.test.cjs` (via `scanModelLiterals`). Export SOURCE strings; construct fresh `RegExp` per use (never share a `/g` instance — `lastIndex` state causes intermittent misses).

### Adapter-isolation invariant (D-02 / UP-01)
**Source:** file-header contract in `src/bob-adapter.cjs` (lines 3-17) + `stage.cjs` header (lines 3-22, "It CALLS the verified primitives … it never reimplements").
**Apply to:** all Bob-specific logic lives in `bob-adapter.cjs`; `stage.cjs` only calls it. The vendored converter stays byte-verbatim.

### Loud zero-literal assertion (RUNTIME-04 → NEUTRAL-03)
**Source:** `test/backend-neutrality.test.cjs` lines 74-83 (`assert.deepEqual(hits, [], <message>)` + a self-check test that the token/regex set is non-empty, lines 109-114).
**Apply to:** `test/model-neutrality.test.cjs` — include a sibling self-check asserting the shared regex sources are non-empty so the invariant can't vacuously pass.

## No Analog Found

None. Every file has an in-repo analog; no RESEARCH.md-only fallback patterns are required.

## Metadata

**Analog search scope:** `src/`, `src/installer/`, `test/`, `test/installer/`, `.planning/`
**Files scanned:** `src/bob-adapter.cjs`, `src/installer/stage.cjs`, `test/backend-neutrality.test.cjs`, `test/installer/stage.test.cjs`, `test/acceptance-coverage.test.cjs`, `.planning/ACCEPTANCE-CHECKLIST.md`
**Pattern extraction date:** 2026-07-03
