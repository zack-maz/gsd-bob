---
phase: 08-model-neutralization
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/bob-adapter.cjs
  - src/installer/stage.cjs
  - test/model-neutrality.test.cjs
  - test/acceptance-coverage.test.cjs
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
resolved:
  - WR-01  # fixed in commit 3bcefe5 — detector asymmetry closed + regression test added
deferred:
  - WR-02  # narrows locked D-03 blanket-rewrite design (false-positive vs false-negative tradeoff) — user decision; latent (no trigger tokens in current corpus)
  - WR-03  # same class as WR-02; converter already strips frontmatter model:/effort:, body-line risk is latent
  - IN-01  # cosmetic grammar
  - IN-02  # not-a-defect (seeded WIRING test carries the discriminating power)
status: issues_found
---

> **Disposition (Phase 8 execution):** WR-01 (a false-green in the NEUTRAL-03 invariant) was fixed and committed as `3bcefe5`. WR-02/WR-03/IN-01/IN-02 were deferred — they are latent (no trigger tokens in the current 10-command corpus) and WR-02/WR-03 would narrow the locked D-03 rewrite design (a false-positive/false-negative tradeoff the user owns). Re-run `/gsd-code-review 8 --fix` to address them if desired.


# Phase 8: Code Review Report

**Reviewed:** 2026-07-03
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the model-reference neutralization pass. The four project invariants I was asked to guard all **hold**:

- **Backend-neutrality:** `bob-adapter.cjs` contains no bare model-brand literal; tiers are decoded from base64 (`opus`/`sonnet`/`haiku`) at load time. Not flagged as obfuscation per instructions.
- **D-03 single-source:** `neutralizeModelReferences` and `scanModelLiterals` both build fresh (non-shared) RegExps from the same exported SOURCE strings. No shared `/g` instance and no `lastIndex` bleed — `scanModelLiterals` resets `tier.lastIndex = 0` per line and uses a non-global directive regex with `.test()`. Correct.
- **D-01 scope:** neutralization is applied only in the convertible loop (`stage.cjs:282-289`); the raw `gsd-core/**` payload copy (`stage.cjs:218-223`) is written with untouched bytes. Correct.
- **Test validity:** `commands/gsd/` holds 10 real command files, and the WIRING test seeds a body with tier prose + a directive line, so the suite is not vacuous. All 9 tests pass.

No BLOCKERs. However, the neutralization regexes have real correctness gaps in both directions (false-negatives that leave broken residue, and false-positives that corrupt legitimate prose). These are currently *latent* — the shipped command bodies happen not to contain the trigger tokens — but the pass exists specifically to sanitize prose-heavy command bodies, so the gaps matter.

## Warnings

### WR-01: `MODEL_ID_RE` misses numeric/date-infixed model IDs, leaving mangled residue and a surviving brand that the detector cannot see

**File:** `src/bob-adapter.cjs:66,97-106,116-128`

**Issue:** `MODEL_ID_RE_SOURCE = [A-Za-z]+-(opus|sonnet|haiku)[\w.-]*` only matches when a tier token immediately follows the vendor prefix. Real dated IDs put a version segment between vendor and tier, so the pre-collapse misses them; step 3 then rewrites only the inner tier token, producing broken output with the vendor brand intact. Demonstrated:

```
"Runs on claude-3-opus-20240229 today."
  => "Runs on claude-3-a higher-capability model-20240229 today."   scan: []
```

Critically, `MODEL_ID_RE` participates in the *rewrite* but has **no counterpart in `scanModelLiterals`** (the detector only knows tier tokens + directive lines). So this mangled residue — including the surviving `claude` brand — returns `[]` from `scanModelLiterals` and passes the NEUTRAL-03 invariant. The invariant gives a false green on exactly the failure mode the ID pre-collapse was added to prevent.

**Fix:** Broaden the pre-collapse to tolerate intervening id segments before the tier, e.g. anchor on the vendor+tier co-occurrence within a token run rather than requiring adjacency:
```js
// vendor prefix, optional version segments, then the tier, then trailing id chars
const MODEL_ID_RE_SOURCE = `[A-Za-z]+(?:[.-][A-Za-z0-9]+)*[.-](${MODEL_TIER_TOKENS.join('|')})[\\w.-]*`;
```
and/or add the ID shape to `scanModelLiterals` so any surviving vendor-prefixed id is *detected*, closing the rewrite/detector asymmetry.

### WR-02: Tier alternation and `MODEL_ID_RE` over-match ordinary English words, silently corrupting legitimate command prose

**File:** `src/bob-adapter.cjs:49,66,97-106`

**Issue:** `\b(opus|sonnet|haiku)\b` (case-insensitive) rewrites these tokens anywhere in prose, but all three are common English words, and `haiku`/`sonnet` in particular are ordinary vocabulary a GSD command body could legitimately use. `MODEL_ID_RE` compounds it by collapsing any `word-tier-suffix` hyphenation. Demonstrated:

```
"Write a haiku describing the change."      => "Write a a faster model describing the change."
"This is his magnum opus, a sonnet."        => "This is his magnum a higher-capability model, a a balanced model."
"a my-haiku-poem here"                       => "a the configured model here"
```

Because the pass runs on every converted command/skill body and the substitution is unconditional, any such prose is silently destroyed with no signal. It is latent today only because the current 10 command bodies contain none of these tokens (`grep` confirms), but the pass's whole purpose is to run over free prose.

**Fix:** Constrain the tier rewrite to model-referring contexts instead of blanket word substitution — e.g. require an adjacent model cue (`model`, `claude-`, a `-N-` version segment, or a directive line) rather than matching a bare English word. At minimum, document the accepted corpus constraint and add a guard so a benign hyphenated compound (`my-haiku-poem`) is not collapsed by `MODEL_ID_RE`.

### WR-03: Directive strip deletes any body line beginning `model:`/`effort:`, dropping legitimate content entirely

**File:** `src/bob-adapter.cjs:57-58,100`

**Issue:** `MODEL_DIRECTIVE_RE_SOURCE` includes the bare keys `model` and `effort`, and step 2 deletes the entire matching line (plus its newline). A body line that is not an AI-routing directive is removed with no trace. Demonstrated:

```
"model: the User entity schema"  => ""      (a data-model doc line, gone)
"  model: opus"                   => ""       (indented — leading-whitespace anchor still matches)
```

`effort` is also live GSD frontmatter vocabulary; if it ever appears in a body (or a converter that stops stripping frontmatter is swapped in), the line is silently dropped. The converter currently removes frontmatter `effort:`/`model:`, so this is defense-in-depth over the body only — but the blast radius (whole-line deletion on two very common English keys) is wider than the "AI routing directive" intent.

**Fix:** Tighten the directive match to only fire when the value side is model-shaped (a tier token or vendor id), or restrict the bare-`model`/`effort` keys so an arbitrary `model: <prose>` line is not deleted:
```js
// only strip a directive whose value is actually a model reference
const MODEL_DIRECTIVE_RE_SOURCE =
  `^[ \\t]*(model|effort|model_profile|resolve_model_ids)[ \\t]*:[ \\t]*(?=.*(?:${MODEL_TIER_TOKENS.join('|')}|profile|balanced|high|low|max)).*$`;
```
(or narrow the key list). Keep the change mirrored in the single SOURCE constant so D-03 parity holds.

## Info

### IN-01: Naive token substitution produces ungrammatical output

**File:** `src/bob-adapter.cjs:78-81,101-104`

**Issue:** Replacing a bare tier token with a noun phrase yields broken grammar when the surrounding prose already supplies a noun or article:
```
"The OPUS model"  => "The a higher-capability model model"   (double "model"; stray article)
```
Cosmetic, but the emitted command is user-facing text.

**Fix:** Accept as a known limitation, or map tiers to adjective-only wording (`higher-capability`, `balanced`, `faster`) so it reads correctly inside an existing noun phrase.

### IN-02: NEUTRAL-03 over the real corpus is currently non-discriminating

**File:** `test/model-neutrality.test.cjs:200-225`

**Issue:** The current 10 converted command bodies contain zero tier tokens *before* the pass runs (`grep` confirms none in `commands/gsd/` bodies; frontmatter `effort:` is stripped by the converter). So test (c) passes identically whether or not `neutralizeModelReferences` executes on the real corpus — its discriminating power rests entirely on the seeded (b) WIRING test. Not a defect, but the invariant does not currently exercise a real rewrite.

**Fix:** No change required while (b) carries a seeded fixture. If the real corpus is expected to grow model references, keep (b) as the load-bearing regression and treat (c) as a floor.

---

_Reviewed: 2026-07-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
