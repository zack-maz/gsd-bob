---
phase: 09-command-expansion
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - test/command-expansion.test.cjs
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-07-03
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `test/command-expansion.test.cjs`, the sole hand-written source added in Phase 9 — a directory-derived `node:test` suite (Groups A–D) covering structural equivalence, model-literal neutrality, emitted count (CMD-01), and roster reflection (CMD-02). The suite is well-structured: it is drift-proof (enumerates stems from `commands/gsd/` rather than a hardcoded list), pins the count `28` in exactly one place (line 205), programmatically constructs forbidden tokens so the file's own prose never trips its own detectors, and correctly slices the `## Supported` section so an Unsupported-line stem cannot false-satisfy Group D.

No correctness-breaking bugs or security issues were found. The findings are quality/robustness defects: the harness leaks scratch temp dirs (no cleanup on success or failure — violates the stated hermetic-cleanup convention), the neutrality group validates the pre-neutralization converter output rather than the actually-emitted (staged, neutralized) artifact, and the argument-hint oracle scans the whole source but asserts only against the frontmatter. Two info items note a near-tautological assertion and an unescaped-stem regex.

I confirmed the 28 stems do not include `autonomous`, so `BOB_SKIP_LIST['gsd-autonomous']` in the staging gate does not silently reduce Group C's emitted count below `stems.length` — the count assertion is currently sound.

## Warnings

### WR-01: Scratch temp dirs are never cleaned up (leak on both success and failure)

**File:** `test/command-expansion.test.cjs:71-73, 84-97, 187-189`
**Issue:** `scratch()` creates a `mkdtempSync` directory under `os.tmpdir()` on every call and nothing ever removes it. There is no `after()`/`afterEach()` hook, no `t.after()`, and no `rmSync`. Group C alone leaks two dirs per run (`scratch('count')` for `target`, plus `scratch('ws')` created inside `baseOpts` because `workspaceRoot` is not overridden), and `stage()` then populates the target dir with a full `gsd-core/` payload copy, 28 commands, 28 skills, and a synthesized `package.json`. This directly violates the stated convention that "scratch dirs must be created and cleaned up hermetically." It leaks into `os.tmpdir()` (not the tracked `.bob/`/`.planning/`, so no correctness impact), but repeated runs accumulate populated temp trees indefinitely.
**Fix:** Track created scratch dirs and remove them in a cleanup hook so cleanup runs even when an assertion throws:
```js
const scratchDirs = [];
function scratch(prefix) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
  scratchDirs.push(d);
  return d;
}
test.after(() => {
  for (const d of scratchDirs) fs.rmSync(d, { recursive: true, force: true });
});
```

### WR-02: Neutrality group asserts on raw converter output, not the emitted (neutralized) artifact

**File:** `test/command-expansion.test.cjs:166-183`
**Issue:** Group B calls `scanModelLiterals` on `conv.convertClaudeCommandToBobCommand(...)`/`...ToBobSkill(...)` directly. But the artifact `stage.cjs` actually emits wraps every converter output in `neutralizeModelReferences(...)` (see `src/installer/stage.cjs:284,289`). Group B therefore validates the *pre*-neutralization text, while Group C (the only test that runs the real `stage()` pipeline) checks *only counts*, never content. Consequence: (a) the emitted, neutralized artifact's zero-literal property is never asserted in this suite — a regression in `neutralizeModelReferences` would not be caught here; and (b) it is a false-red risk — if a future command *body* introduced a tier token, Group B would fail even though `stage()` would neutralize it and emit clean output. It passes today only because command frontmatter is stripped by the converter and no body contains a tier token/model id. (Partially mitigated: `test/model-neutrality.test.cjs` covers `neutralizeModelReferences` directly.)
**Fix:** Assert neutrality on the neutralized output to match what ships, e.g. wrap with the same post-pass the installer uses:
```js
const { neutralizeModelReferences } = require(path.join(repoRoot, 'src', 'bob-adapter.cjs'));
const cmd = neutralizeModelReferences(conv.convertClaudeCommandToBobCommand(source, name));
```
Or add a content-neutrality assertion inside Group C that reads the staged files back and runs `scanModelLiterals` on them.

### WR-03: `argument-hint` oracle scans the whole source but asserts only the frontmatter (detection asymmetry)

**File:** `test/command-expansion.test.cjs:105, 113-117`
**Issue:** `sourceHasArgumentHint = /^argument-hint:/m.test(source)` matches a line beginning `argument-hint:` *anywhere* in the raw source (frontmatter or body). The paired assertion, however, only inspects the extracted frontmatter slice `fm`. A GSD meta-command whose body documents the `argument-hint:` frontmatter field in prose (entirely plausible for commands like `plan-phase`/`spec-phase` that describe frontmatter) would flip `sourceHasArgumentHint` to `true` and then force `assert.match(fm, /^argument-hint:/m)` to fail even though the converter behaved correctly. This is a brittle oracle producing a false failure. It is latent today — all 28 sources carry `argument-hint:` only in frontmatter — but the mismatch is a defect in the test's own logic.
**Fix:** Detect against the frontmatter block only, symmetric with the assertion target:
```js
const srcFmEnd = source.indexOf('---', 3);
const srcFm = srcFmEnd > 0 ? source.substring(3, srcFmEnd) : '';
const sourceHasArgumentHint = /^argument-hint:/m.test(srcFm);
```

## Info

### IN-01: `sawHyphenForm` is a near-tautological assertion

**File:** `test/command-expansion.test.cjs:158, 161`
**Issue:** `name = 'gsd-<stem>'` is passed into both converters and is embedded in the emitted `name:`/title, so `cmd.includes('gsd-')` (i.e. `hyphenForm`) is effectively always true regardless of any neutralization behavior. The `sawHyphenForm` half of the "positive neutralization proof" therefore provides no real signal — only the `sawBobHome` half is meaningful.
**Fix:** Drop the `sawHyphenForm` check, or make it meaningful by asserting the hyphen form appears in a location the converter *rewrote* (e.g. a rewritten config-home command reference) rather than the injected name.

### IN-02: Unescaped stem interpolated into a RegExp in Group D

**File:** `test/command-expansion.test.cjs:222`
**Issue:** `new RegExp('^-\\s+' + hyphenForm + stem + '\\s*$', 'm')` interpolates the raw `stem` into a pattern. Current stems are `[a-z-]` only, so this is safe today, but a future command filename containing a regex metacharacter (`.`, `+`, etc.) would silently over- or under-match the roster line.
**Fix:** Escape the interpolated stem (e.g. `stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) or slice the Supported section into lines and compare `=== '- ' + hyphenForm + stem` literally.

---

_Reviewed: 2026-07-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
