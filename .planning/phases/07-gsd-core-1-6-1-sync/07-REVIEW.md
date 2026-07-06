---
phase: 07-gsd-core-1-6-1-sync
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - scripts/apply-bob-patches.cjs
  - gsd-core/bin/lib/capability-registry.cjs
  - gsd-core/bin/lib/runtime-artifact-conversion.cjs
  - gsd-core/bin/lib/runtime-name-policy.cjs
  - gsd-core/bin/shared/runtime-aliases.manifest.json
  - src/installer/stage.cjs
  - test/installer/staged-shim-loads.test.cjs
findings:
  critical: 0
  warning: 5
  info: 2
  total: 7
status: issues_found
---

# Phase 7: Code Review Report

## Summary

Reviewed the six hand-injected "bob" deltas over the re-vendored `gsd-core@1.6.1` payload plus the new `apply-bob-patches.cjs` re-injection script (the highest-value target) and two residue-sweep edits. Idempotency verified empirically: a fresh run of `apply-bob-patches.cjs` reports all six steps as clean no-ops, and the injected converters load and execute. Anchor matching, JSON re-serialization, and fail-loud error handling are sound.

No BLOCKER-level defects. Confirmed by grep that no currently-shipping content triggers the latent bugs below (no `~/.claude-plugin`/`~/.claudeignore`-prefixed content in the convertible sources, and no command frontmatter description carries `gsd:` or `~/.claude`). The five WARNINGs are latent correctness/robustness defects that will bite on future content or future upstream re-vendors — precisely the maintenance scenario this script exists to survive.

**Orchestrator note (routing):** WR-01 and WR-02 describe behavior of the injected `convertClaudeToBobContent` / command converter, which Phase 2 established (mirroring the Antigravity content pass) and Phase 7 preserved **byte-identical** by mandate. They are pre-existing converter-design items, not Phase 7 regressions. Fixing them requires changing the vendored converter AND the `apply-bob-patches.cjs` CONVERTER_BLOCK in lockstep (to preserve idempotency), so they are follow-up work, not a Phase 7 gap.

## Warnings

### WR-01: Bob content converter corrupts `~/.claude-plugin` / `~/.claudeignore`

**File:** `scripts/apply-bob-patches.cjs:165-166,172-173` (injected `convertClaudeToBobContent`; also live at `gsd-core/bin/lib/runtime-artifact-conversion.cjs:2362`)
**Issue:** The bare-form replacements use a `\b` word boundary: `c.replace(/~\/\.claude\b/g, '.bob')`. `\b` matches between `claude` and `-`, so `~/.claude-plugin` → `.bob-plugin` and `~/.claudeignore` → `.bob...`. Confirmed empirically: `convertClaudeToBobContent("see ~/.claude-plugin/marketplace", false)` returns `"see .bob-plugin/marketplace"`. The sibling Windsurf converter (same file, lines 868-869) deliberately avoids this with a negative lookahead `(?![\w-])` "to preserve .claude-plugin and .claudeignore" — the Bob converter (mirroring the weaker Antigravity pattern) does not. Latent today (no triggering content in the payload) but the converter runs over arbitrary GSD command markdown, and `.claude-plugin` (the marketplace path) is a real GSD concept.
**Fix:** Match the Windsurf discipline in the injected `CONVERTER_BLOCK`:
```js
c = c.replace(/\$HOME\/\.claude(?![\w-])/g, '.bob');
c = c.replace(/~\/\.claude(?![\w-])/g, '.bob');
```

### WR-02: Bob command converter leaves frontmatter description un-neutralized

**File:** `scripts/apply-bob-patches.cjs:224-227` (injected `convertClaudeCommandToBobCommand`)
**Issue:** The command converter extracts `description`/`argument-hint` from the *raw* frontmatter and only neutralizes the body (`convertClaudeToBobContent(body, ...)`). The skill converter (line 199) neutralizes the *full* content first, then extracts. Result is an asymmetry confirmed empirically: for a description `"uses gsd:foo and ~/.claude/bar"`, the emitted Bob **skill** description becomes `"uses gsd-foo and .bob/bar"` (neutralized) but the emitted Bob **command** description stays `"uses gsd:foo and ~/.claude/bar"` — leaking the deprecated colon dialect and a `.claude` path that does not exist under a Bob install. Latent today (no command description carries those tokens) but silently wrong if one ever does.
**Fix:** Neutralize before extraction, mirroring the skill converter:
```js
const converted = convertClaudeToBobContent(content, isGlobal);
const { frontmatter, body } = extractFrontmatterAndBody(converted);
```
(then drop the separate body neutralize, since the body is already converted).

### WR-03: `patchNamePolicyAlias` anchor over-specifies the full `cline` alias array

**File:** `scripts/apply-bob-patches.cjs:411`
**Issue:** The anchor regex is `/^([ \t]*)cline: \['cline', 'cline-cli'\],$/m` — it pins not just the `cline:` key but the exact array contents and single-quote formatting. Any upstream change (adding a `cline` alias, switching to double quotes, or a prettier reflow) makes the anchor miss and the step `throw`s, breaking the re-vendor runbook. It fails loud (correct), but it is far more brittle than the injection requires: the key `cline:` alone is a sufficient, stable anchor.
**Fix:** Anchor on the key only and capture indent:
```js
const clineRe = /^([ \t]*)cline:\s*\[[^\]]*\],$/m;
```

### WR-04: Hardcoded `TARGET_VERSION` with no cross-check against the vendored payload

**File:** `scripts/apply-bob-patches.cjs:46,423-433`
**Issue:** `TARGET_VERSION = '1.6.1'` is written into `gsd-core/VERSION` unconditionally, and `stage.cjs:242` stamps that value into the synthetic `package.json` and into converted-artifact `version:` frontmatter. On a future bump (e.g. restaging the 1.7.0 tarball) an operator who forgets to edit this constant produces a silent split-brain: `capability-registry.cjs` version fields say `1.7.0` (from the tarball) while `VERSION`/`package.json`/frontmatter say `1.6.1`. Nothing asserts the constant matches the payload it is stamping.
**Fix:** Derive/validate the version from a source of truth the bump already touches (e.g. read the intended version from an env/arg or assert against a checked-in expectation), or at minimum fail loud if an existing `VERSION`/registry version disagrees with `TARGET_VERSION` rather than overwriting.

### WR-05: No post-injection validation that the patched module still loads

**File:** `scripts/apply-bob-patches.cjs:350-380` (`patchConverter`), `applyAll:439-448`
**Issue:** The script injects a ~105-line `CONVERTER_BLOCK` that depends on upstream helpers (`extractFrontmatterAndBody`, `extractFrontmatterField`, `yamlQuote`) living in the target file. Idempotency guards key on `function convertClaudeCommandToBobSkill` / export-symbol presence, but nothing verifies the resulting file actually parses/loads or that those helper symbols still exist post-vendor. An upstream rename of any helper would inject a block that is syntactically fine but throws at install/convert time — the failure surfaces far downstream from the patch, defeating the "bump → patch → validate" runbook's fast-feedback intent.
**Fix:** After writing, `require()` the patched module in a child check (or `delete require.cache` + require) and assert the three Bob exports are callable; fail loud from `applyAll` if not.

## Info

### IN-01: `$ARGUMENTS` → `$1` relies on the "no such capture group" fallback

**File:** `scripts/apply-bob-patches.cjs:237`
**Issue:** `neutralizedBody.replace(/\$ARGUMENTS\b/g, '$1')` — the replacement `$1` references capture group 1, which does not exist in the pattern. JS leaves it as the literal `$1`, which happens to be the intended Bob positional-arg token (verified: output is `Use $1 here`). Correct, but it works by relying on a fallback rather than by intent.
**Fix:** Use `'$$1'` (an escaped `$` + `1`) to emit `$1` explicitly and remove the dependence on the missing-group behavior.

### IN-02: `bob` registry block inserted immediately before `claude`, not in alphabetical order

**File:** `scripts/apply-bob-patches.cjs:340`; result at `gsd-core/bin/lib/capability-registry.cjs:2877`
**Issue:** `const runtimes` is alphabetical (`antigravity`, `augment`, `claude`, ...). Anchoring the insert on the first `"claude": {` places `bob` between `augment` and `claude` — out of alphabetical order (`bob` should precede `augment`). Purely cosmetic; no functional impact since lookup is keyed.
**Fix:** None required; if alphabetical parity with upstream matters for a future PR diff, anchor on `"augment": {` and insert before it instead.

---
_Reviewer: Claude (gsd-code-reviewer) — Depth: standard_
