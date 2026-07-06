# Phase 8: Model Neutralization - Research

**Researched:** 2026-07-03
**Domain:** Content-transformation pass + durable invariant test over emitted Bob artifacts (Node.js, `node:test`, no external deps)
**Confidence:** HIGH (every load-bearing claim verified directly against live source this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Scope = emitted converted artifacts only.** NEUTRAL-01/02 neutralize, and NEUTRAL-03 asserts over, `.bob/commands/gsd-*.md` + `.bob/skills/gsd-*/SKILL.md`. The raw-copied `.bob/gsd-core/**` payload is **explicitly excluded**. (Research was invited to challenge this — see "D-01 Scope Resolution" below; the evidence **affirms** it.)
- **D-02 — Neutralizer placement.** Add `neutralizeModelReferences(content)` to `src/bob-adapter.cjs`. Apply it as a **post-pass wrapping the converter output** in `stage.cjs`'s convertible loop. **Never edit the vendored converter** `gsd-core/bin/lib/runtime-artifact-conversion.cjs`.
- **D-03 — One shared "model literal" regex** powers BOTH the pass and the invariant so they cannot drift. Matches word-boundary tier tokens `opus|sonnet|haiku` (case-insensitive) + residual frontmatter `model:`/`effort:` + structural `model_profile`/`resolve_model_ids`. Explicit allowlist: peer-AI CLI names (`gemini`/`codex`/`claude` reviewer flags), the generic word "model", and GSD config-vocabulary keys.
- **D-04 — Invariant = loud `node:test` suite** (`test/model-neutrality.test.cjs`) that enumerates the emitted set via the **real staging path**, fails loud listing every `file:line:token`, and passes against the full 1.6.1-derived emission. Same check authored as an **insert-only device-runnable acceptance step** appended after frozen AC-01..AC-26.

### Claude's Discretion
- User delegated all areas (`--auto`). Downstream may refine *how* each decision is implemented (exact replacement wording, exact allowlist pattern set, precise test-harness reuse) as long as the decisions above hold. The one decision research was explicitly invited to challenge with evidence is **D-01's scope**.

### Deferred Ideas (OUT OF SCOPE)
- **Install-time prose-neutralization of the copied `.bob/gsd-core/workflows|references|templates`** — deferred (D-01 open question). Only revisit if maintainer intent shows the copied prose must also be literal-free AND it can be done without corrupting the `model_profile`/`resolve_model_ids` config vocabulary. **Never** neutralize `.bob/gsd-core/bin/**` (executable model-resolution runtime).
- Adding the 18 new commands (Phase 9). The MAINTAINING runbook / per-command docs (Phase 10). Running the acceptance step on hardware (Phase 11).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NEUTRAL-01 | Converter strips machine-readable model directives (frontmatter `model:`/`effort:`, `model_profile`/`resolve_model_ids`) from emitted `.bob/` artifacts | **Already pre-satisfied for frontmatter** — verified: both Bob converters rebuild frontmatter from a whitelist (command→`description`+`argument-hint`; skill→`name`+`description`), stripping `model:`/`effort:` by omission. Deliverable is the durable *guard* + defense-in-depth line-strip in the post-pass. |
| NEUTRAL-02 | Converter rewrites inline model prose (`opus`/`sonnet`/`haiku` and equivalent) in emitted `.bob/` artifacts | New `neutralizeModelReferences` post-pass with a tier→capability-neutral replacement map. Converter preserves bodies verbatim, so any tier prose a Phase 9 command carries survives into the emitted body unless this pass rewrites it. |
| NEUTRAL-03 | Invariant test asserts zero model literals (per defined regex) across the emitted `.bob/` set, guarding regressions | New `node:test` suite driving real staging + shared D-03 regex + loud `file:line:token` failure. Verified today's full 10-command emission is already zero-literal, so the suite is green on landing. |
</phase_requirements>

## Summary

Phase 8 is **insurance for Phase 9, not a cleanup of today's output.** I verified — by running the two vendored Bob converters over all 10 current command sources this session — that the emitted `.bob/` set already carries **zero** `opus`/`sonnet`/`haiku` tokens and **zero** residual `model:`/`effort:` directives. The converters reduce frontmatter to a hard whitelist, so machine-readable model directives are stripped by omission (NEUTRAL-01 is largely pre-satisfied). The ~231 model mentions the roadmap cites live overwhelmingly in the **raw-copied vendored payload** (`bin/` 122, `workflows/` 56, `references/` 52, `templates/` 1 lines of tier tokens) — which is byte-copied, not converter-fed, and is out of scope per D-01.

The deliverable is therefore a small, composable **post-pass** (`neutralizeModelReferences`) wrapping each converter's output in `stage.cjs`, plus a **durable loud invariant** (`test/model-neutrality.test.cjs`) that enumerates the emitted converted set via the real staging path and fails on any surviving literal. Both share ONE regex/constant module so they can never drift. When Phase 9 vendors a command whose body inlines "use opus for deep analysis," the invariant catches it and the pass rewrites it — with zero extra wiring in Phase 9.

**Primary recommendation:** Affirm D-01 (converted-set scope). Add `neutralizeModelReferences` + shared regex constants to `src/bob-adapter.cjs`; wrap both converter calls in `stage.cjs`'s convertible loop (L278-286); author `test/model-neutrality.test.cjs` reusing the `stage.test.cjs` scratch-tmpdir harness with `repoRoot = pkgRoot` for a real full emission; append one insert-only acceptance step after AC-26.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Strip machine-readable model directives (`model:`/`effort:`) | Vendored converter (already does it) | Post-pass (defense-in-depth line-strip) | Converter frontmatter whitelist already omits them; post-pass guards regression without editing the vendored converter (D-02). |
| Rewrite inline tier prose (`opus`/`sonnet`/`haiku`) | Emit-time post-pass (`bob-adapter.cjs`) | — | Converters preserve bodies verbatim; only a post-pass on emitted bytes can catch prose (D-02). |
| Enforce zero-literal invariant | Test tier (`node:test`) | — | Verified via real staging path, no live Bob (test-deferred contract). |
| Device-runnable acceptance | Docs/device tier (`ACCEPTANCE-CHECKLIST.md`) | — | Phase 11 runs it on hardware; Phase 8 only authors it insert-only. |
| Model routing itself | **Bob runtime** (out of scope) | — | "Bob owns model routing" — gsd-bob emits neutral artifacts and lets Bob pick the concrete model. |

## D-01 Scope Resolution (the critical open question — RESOLVED: affirm D-01)

The roadmap goal prose says "the ~231 model mentions … **flow through the converter**." This is **factually looser than reality.** Verified against live `src/installer/stage.cjs`:

1. **Emission architecture confirmed (F-01 ✓).** `stage.cjs` emits three buckets under the `.bob/` target:
   - **(a) Converted artifacts** — the convertible loop (L263-291) runs each `commands/gsd/*.md` through `convertClaudeCommandToBobCommand` (→ `commands/gsd-<stem>.md`, L278-281) and `convertClaudeCommandToBobSkill` (→ `skills/gsd-<stem>/SKILL.md`, L283-286). **This is the ONLY converter-fed bucket.**
   - **(b) Raw-copied payload** — structural piece 2 (L213-222) `listFilesRel(payloadSrc)` byte-copies the ENTIRE vendored `gsd-core/**` verbatim via `stageFile(destRel, bytes)`. **No converter touches it.** `[VERIFIED: src/installer/stage.cjs L217-221]`
   - **(c) Structural files** — `custom_modes.yaml`, synthesized `package.json`, `scripts/fix-slash-commands.cjs`, `SUPPORT-ROSTER.md`.

2. **Converted artifacts do NOT inline payload prose (✓).** The 10 current command bodies reference workflows *by path* (e.g. `.bob/gsd-core/workflows/<stem>.md`) — they never inline the workflow prose. Verified: `grep -rniE '\b(opus|sonnet|haiku)\b' commands/gsd/` returns **zero body hits** (only three `effort:` frontmatter lines, which the converter strips). `[VERIFIED: grep over commands/gsd/]`

3. **Converter simulation proves today's emitted set is already clean (✓).** I ran both Bob converters over all 10 sources this session; scanning every emitted command + skill for `\b(opus|sonnet|haiku)\b` and `^(model|effort):` yielded **zero hits** ("scan complete", no offenders). `[VERIFIED: node simulation over gsd-core/bin/lib/runtime-artifact-conversion.cjs converters]`

4. **The payload is legitimately model-referencing and must NOT be neutralized:**
   - `.bob/gsd-core/bin/**` is **executable runtime** (`model-resolver`/`model-catalog`/`model-profiles`); stripping its literals breaks `gsd-tools.cjs`.
   - `model_profile`/`resolve_model_ids` in `workflows/`+`references/` are the **GSD config system's own vocabulary** (how a user *configures* a profile), not per-artifact routing directives — orthogonal to "Bob owns routing."

**Verdict:** Affirm D-01. Scope NEUTRAL-01/02/03 to buckets (a) only. The roadmap "flow through the converter" phrasing describes the *intended guard surface*, and bucket (a) is precisely what the converter emits; the payload is *copied* (a different verb), preserving Phase 7's verbatim-payload invariant. No hard reason surfaced to widen scope. `[VERIFIED]`

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | Node ≥22 built-in | The NEUTRAL-03 invariant suite | Project's sole test runner (`package.json`: `node --test "test/**/*.test.cjs"`). Zero new deps — matches the "installer/test path stays dependency-free" invariant. `[VERIFIED: package.json]` |
| `node:assert/strict` | built-in | Loud `deepEqual(hits, [])` assertions | Exact idiom used by `test/backend-neutrality.test.cjs`. `[VERIFIED]` |
| `node:fs` / `node:path` / `node:os` | built-in | Scratch-tmpdir staging + emitted-file enumeration | Same primitives `stage.test.cjs` / `install-clean.test.cjs` already use. `[VERIFIED]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `js-yaml` | 4.1.0 (already a dep) | — | NOT needed for this phase. The pass operates on raw markdown strings; no YAML parsing. `[VERIFIED: package.json dependencies]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Post-pass in `bob-adapter.cjs` | Editing the vendored converter | **Rejected by D-02** — forks gsd-core, breaks the "move not rewrite" upstream story. |
| Shared regex constant | Duplicate regex in test + pass | Guaranteed drift; the whole point of D-03 is one source of truth. |
| `node:test` invariant | Byte-golden fixtures | **Rejected in roadmap** — prose rewriting is fuzzy; absence-of-X is the durable contract. |

**Installation:** None. No packages added, removed, or upgraded this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs **zero external packages**. It uses Node built-ins (`node:test`, `node:assert`, `node:fs`, `node:path`, `node:os`) and the already-vendored converter. The single runtime dependency (`js-yaml@4.1.0`) is untouched. No registry lookups required.

## Architecture Patterns

### Data-flow diagram (emit-time)

```
commands/gsd/<stem>.md  (Claude source, may carry model prose/directives)
        │
        ▼   stage.cjs convertible loop (L271-291)
  ┌─────────────────────────────────────────────────────────────┐
  │ convertClaudeCommandToBobCommand(content, name)              │  ← vendored, UNCHANGED
  │   → frontmatter reduced to description+argument-hint          │     (strips model:/effort:)
  │   → body: .claude→.bob, gsd:→gsd-, $ARGUMENTS→$1              │
  └─────────────────────────────────────────────────────────────┘
        │  converter output bytes
        ▼   NEW post-pass (D-02)
  ┌─────────────────────────────────────────────────────────────┐
  │ neutralizeModelReferences(convertedContent)                  │  ← NEW, in bob-adapter.cjs
  │   1. strip residual directive lines (model:/effort:/…)        │
  │   2. rewrite tier prose opus/sonnet/haiku → neutral wording   │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼   stageFile(...)               (same for the SKILL branch)
  .bob/commands/gsd-<stem>.md   +   .bob/skills/gsd-<stem>/SKILL.md
        │
        ▼   (enumerated by)
  test/model-neutrality.test.cjs  ──uses──►  shared D-03 regex constants
        │                                     (same module the pass imports)
        ▼
  assert.deepEqual(hits, [])   →  fails loud with [ "relpath:line:token", … ]

  .bob/gsd-core/**  ── raw byte-copy (bucket b) ── NOT scanned, NOT neutralized  (D-01)
```

### Recommended structure
```
src/bob-adapter.cjs        # + neutralizeModelReferences() + shared regex/replacement constants + scanModelLiterals()
src/installer/stage.cjs    # convertible loop: wrap both converter calls with neutralizeModelReferences()
test/model-neutrality.test.cjs   # NEW — real staging + shared regex + loud file:line:token
.planning/ACCEPTANCE-CHECKLIST.md # + one insert-only AC-27 step after AC-26 (frozen AC-01..AC-26 untouched)
```

### Pattern 1: Shared single-source regex + replacement constants (D-03)
**What:** One module owns the pattern SOURCES and the replacement map; both the pass and the invariant import them. Export sources as strings (or a scan helper), not a shared stateful `RegExp` object — a `/g` RegExp carries `lastIndex` and mis-behaves if reused across calls.
**Example (recommended shape for `src/bob-adapter.cjs`):**
```javascript
// Source: recommended — mirrors backend-neutrality.test.cjs "single token-set" idiom
// Word-boundary Anthropic tier tokens. The prose pass rewrites these; the
// invariant flags any survivor. Case-insensitive.
const MODEL_TIER_RE_SOURCE = '\\b(opus|sonnet|haiku)\\b';

// Machine-readable model directives, LINE-ANCHORED `key:` form. Line anchor +
// colon means a PROSE mention of "model_profile" (config vocabulary — allowlisted)
// never trips; only a literal `model_profile:` directive line does (defense-in-depth,
// since the converter already strips frontmatter).
const MODEL_DIRECTIVE_RE_SOURCE = '^[ \\t]*(model|effort|model_profile|resolve_model_ids)[ \\t]*:.*$';

// Tier → capability-neutral wording (preserves the author's relative intent, no brand).
const MODEL_TIER_REPLACEMENTS = { opus: 'a higher-capability model', sonnet: 'a balanced model', haiku: 'a faster model' };

function neutralizeModelReferences(content) {
  let c = content;
  // (1) NEUTRAL-01 defense-in-depth: drop any residual directive line entirely.
  c = c.replace(new RegExp(`${MODEL_DIRECTIVE_RE_SOURCE}\\r?\\n?`, 'gim'), '');
  // (2) NEUTRAL-02: rewrite tier prose to neutral wording (case-insensitive).
  c = c.replace(new RegExp(MODEL_TIER_RE_SOURCE, 'gi'), (m) => MODEL_TIER_REPLACEMENTS[m.toLowerCase()]);
  return c;
}

// Detection helper the invariant reuses so the pass + test share ONE definition.
function scanModelLiterals(content) {
  const hits = [];
  const lines = content.split('\n');
  const tier = new RegExp(MODEL_TIER_RE_SOURCE, 'gi');
  const directive = new RegExp(MODEL_DIRECTIVE_RE_SOURCE, 'i'); // per-line, no /g state
  lines.forEach((line, i) => {
    let m;
    tier.lastIndex = 0;
    while ((m = tier.exec(line)) !== null) hits.push({ line: i + 1, token: m[0] });
    if (directive.test(line)) hits.push({ line: i + 1, token: line.trim().slice(0, 40) });
  });
  return hits;
}

module.exports = { /* …existing… */ MODEL_TIER_RE_SOURCE, MODEL_DIRECTIVE_RE_SOURCE,
  MODEL_TIER_REPLACEMENTS, neutralizeModelReferences, scanModelLiterals };
```

### Pattern 2: Post-pass wiring in `stage.cjs` (D-02)
**What:** Wrap each converter output in the loop; do not touch the converter or the raw-copy bucket.
**Example (edit at `stage.cjs` L267-286):**
```javascript
// add to the existing require from '../bob-adapter.cjs'
const { emitGsdMode, mergeCustomModes, gateArtifact, buildSupportRoster,
        neutralizeModelReferences } = require('../bob-adapter.cjs');
// …
stageFile(
  path.join('commands', `${name}.md`),
  Buffer.from(neutralizeModelReferences(convertClaudeCommandToBobCommand(content, name))),
);
stageFile(
  path.join('skills', name, 'SKILL.md'),
  Buffer.from(neutralizeModelReferences(convertClaudeCommandToBobSkill(content, name))),
);
```

### Pattern 3: Real-staging invariant harness (D-04)
**What:** Stage against the REAL package root into a scratch target, enumerate ONLY `commands/gsd-*.md` + `skills/gsd-*/SKILL.md`, apply `scanModelLiterals`, assert `deepEqual(hits, [])`. Reuse `stage.test.cjs`'s `baseOpts`/`freshManifest`/`newReport` scaffolding; set `repoRoot = pkgRoot` so all real command sources convert (mirrors how `install-clean.test.cjs` exercises the real payload).
**Example (recommended `test/model-neutrality.test.cjs`):**
```javascript
const { stage } = require(path.join(pkgRoot, 'src', 'installer', 'stage.cjs'));
const { scanModelLiterals } = require(path.join(pkgRoot, 'src', 'bob-adapter.cjs'));
// stage into scratch target with repoRoot = pkgRoot (real 10→28 command set) …
const scanRoots = ['commands', 'skills'];              // D-01: NEVER 'gsd-core'
const hits = [];
for (const root of scanRoots) {
  for (const rel of listFilesRel(path.join(target, root))) {
    if (!/^gsd-/.test(path.basename(path.dirname(rel)) + path.basename(rel))) continue;
    const abs = path.join(target, root, rel);
    for (const h of scanModelLiterals(fs.readFileSync(abs, 'utf8'))) {
      hits.push(`${path.join(root, rel)}:${h.line}:${h.token}`);   // actionable file:line:token
    }
  }
}
assert.deepEqual(hits, [], `emitted .bob/ set must contain ZERO model literals; found:\n${hits.join('\n')}`);
```

### Anti-Patterns to Avoid
- **Editing `runtime-artifact-conversion.cjs`** — forks the vendored converter; breaks D-02 and the upstream "move" story. The pass MUST be a wrapper.
- **Scanning `.bob/gsd-core/**`** — trips on legitimate config vocabulary + executable runtime; violates D-01. Scope the enumerator to `commands/` + `skills/`.
- **A bare-word `model_profile`/`resolve_model_ids` match (not line-anchored)** — flags legitimate prose ("set the model_profile in config.json"). Anchor to the `^…key:` directive form.
- **Sharing one `/g` RegExp instance between pass and scanner** — `lastIndex` state causes intermittent missed matches. Share the SOURCE string; construct fresh RegExps per use (or reset `lastIndex`).
- **Bare-count failure message** — the roadmap/D-04 require `file:line:token`, not "3 offenders".

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Driving a real `.bob/` emission | A bespoke mini-emitter in the test | `stage()` + `stage.test.cjs` scaffolding (`baseOpts`, `freshManifest`, `newReport`) | The real staging path IS the contract (D-04); a re-implementation would diverge from what ships. |
| Frontmatter model-key stripping | New frontmatter parser | The vendored converter's existing whitelist reduction | Already strips `model:`/`effort:` by omission (verified); the pass only needs defense-in-depth. |
| Scratch tmpdir + manifest wiring | Hand-rolled temp management | `fs.mkdtempSync` + `manifest.cjs`/`report.cjs` helpers | Exactly what every `test/installer/*.test.cjs` reuses. |
| "Zero brand literal" assertion idiom | Novel assertion style | `test/backend-neutrality.test.cjs` `deepEqual(hits, [])` + programmatic token set | Proven sibling; NEUTRAL-03 is a scope-shifted twin. |

**Key insight:** Almost everything this phase needs already exists — the vendored converter does the hard frontmatter work, and the installer test harness already stages real emissions. The net-new surface is ~30 lines in `bob-adapter.cjs` + one test + one checklist line.

## Common Pitfalls

### Pitfall 1: Hyphenated model-ID strings mangled by the tier rewrite
**What goes wrong:** A Phase 9 body containing a full model ID like `claude-opus-4-1` → `\bopus\b` matches the inner "opus" (hyphen is a word boundary) → rewrite yields `claude-a higher-capability model-4-1`. The invariant then reads zero literals (contract holds) but the prose is ugly.
**Why it happens:** Tier tokens are substrings of model IDs; word boundaries fire on `-`.
**How to avoid:** Add a **pre-collapse rule** in `neutralizeModelReferences` BEFORE the bare-tier rewrite: `c = c.replace(/\bclaude-(opus|sonnet|haiku)[\w.-]*/gi, 'the configured model')`. Today's emitted set has **zero** model-ID strings (verified `grep`), so this is speculative insurance for Phase 9 — but cheap to add now.
**Warning signs:** Readable-but-wrong sentences in a Phase 9 diff; the invariant stays green so it won't self-flag.

### Pitfall 2: Peer-CLI reviewer flags false-positive
**What goes wrong:** `progress.md` body carries `--codex --gemini --claude --opencode --ollama …` reviewer flags (verified L28). A naive "any AI word" regex would flag these.
**Why it happens:** These are external-reviewer CLI names, not model routing.
**How to avoid:** The D-03 regex is **tier-scoped** (`opus|sonnet|haiku`) + line-anchored directives ONLY — it never matches `gemini`/`codex`/`claude`/`opencode`. `\bopus\b` does NOT match `opencode` (word boundary). Confirmed safe against the current body. Keep the allowlist implicit by NOT widening the pattern.
**Warning signs:** Invariant flags a `--gemini`/`--claude` line → the regex was over-broadened; revert to tier-scoped.

### Pitfall 3: The invariant accidentally scans the raw payload
**What goes wrong:** Enumerator walks the whole `target/` → hits `gsd-core/bin/**` (122 tier lines) → thousands of false failures.
**Why it happens:** `listFilesRel(target)` includes bucket (b).
**How to avoid:** Restrict the enumerator to `target/commands` + `target/skills` and to `gsd-*` names (D-01). Never `target/gsd-core`.
**Warning signs:** Failure list contains `gsd-core/...` paths.

### Pitfall 4: Frozen acceptance items drift
**What goes wrong:** Editing AC-01..AC-26 while adding the neutrality step.
**Why it happens:** Renumbering or reflowing the checklist.
**How to avoid:** **Append only.** Add `## AC-27` after AC-26 with its own `Confirms:` line referencing NEUTRAL-03. `acceptance-coverage.test.cjs` asserts one `Confirms:` per `## AC-NN` header and a ≥26 floor — a new AC-27 must carry its own `Confirms:` line, and its referenced ID must be canonical **in that suite's ID family**. NOTE: `acceptance-coverage.test.cjs`'s `ID_RE` is scoped to v1 families `(SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP)` and its canonical set is derived from the section ABOVE `## v2 Requirements`. NEUTRAL-* is a v2 family → **it is NOT canonical there** → an AC-27 `Confirms: NEUTRAL-03` would make that suite's `GENERIC_ID_RE` "phantom ref" check FAIL. See Open Question 1 — the acceptance-coverage suite likely needs a companion update (or the ACCEPT phase owns v2 coverage). **This is the single highest-risk integration point.**
**Warning signs:** `acceptance-coverage.test.cjs` fails with "references NEUTRAL-03, which is not a canonical v1 SC."

### Pitfall 5: `model_profile` in `.planning/config.json` is unrelated
**What goes wrong:** Someone points the invariant at `.planning/config.json` (which has `"model_profile": "balanced"`) and flags it.
**Why it happens:** Over-broad enumeration.
**How to avoid:** The invariant scans only staged `.bob/commands` + `.bob/skills`, never `.planning/`. The config `model_profile` is GSD config vocabulary and out of scope entirely.

## Code Examples

### Verifying today's emitted set is already clean (reproducible)
```bash
# Source: this session's verification — returns "scan complete" with no offenders
node -e "
const {convertClaudeCommandToBobCommand,convertClaudeCommandToBobSkill}=require('./gsd-core/bin/lib/runtime-artifact-conversion.cjs');
const fs=require('fs');
for(const f of fs.readdirSync('commands/gsd')){
  const c=fs.readFileSync('commands/gsd/'+f,'utf8'), stem=f.replace(/\.md$/,'');
  for(const out of [convertClaudeCommandToBobCommand(c,'gsd-'+stem), convertClaudeCommandToBobSkill(c,'gsd-'+stem)]){
    const t=out.match(/\b(opus|sonnet|haiku)\b/gi)||[], d=out.match(/^(model|effort):/gmi)||[];
    if(t.length||d.length) console.log(stem, t, d);
  }
}
console.log('scan complete');"
```

### Device-runnable acceptance step (NEUTRAL-03 / ACCEPT-02 seed, insert-only)
```bash
# Source: recommended — mirrors the D-04 "grep over a real .bob/ install" pattern.
# Expected output: (no matches) and exit code 1 from grep → step PASSES.
grep -rniE '\b(opus|sonnet|haiku)\b|^[[:space:]]*(model|effort|model_profile|resolve_model_ids)[[:space:]]*:' \
  "$BOB_HOME"/commands/gsd-*.md "$BOB_HOME"/skills/gsd-*/SKILL.md
# PASS when zero lines are printed. (Scope excludes $BOB_HOME/gsd-core/** by construction — D-01.)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Byte-golden fixtures for neutrality | Zero-literal invariant assertion | Roadmap v2.0 decision | Durable "absence-of-X" contract survives prose churn; no fixture regeneration on every wording tweak. |
| `gsd:` colon command dialect | `gsd-` hyphen form | gsd-core #2808 | Converter already rewrites `gsd:`→`gsd-`; unrelated to model neutrality but confirms the converter-body-rewrite mechanism the pass composes with. |

**Deprecated/outdated:** none relevant to this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 9's added command bodies MAY inline tier prose (`opus`/`sonnet`/`haiku`) that survives conversion | Summary / NEUTRAL-02 | If Phase 9 sources are also already clean, the pass is pure insurance (still correct, just no-op today). Low risk — the pass is defensive by design. |
| A2 | The `model_profile:`/`resolve_model_ids:` directive form (line-anchored) is the only legitimate machine-directive shape to strip inside converted artifacts; bare-word prose is config vocabulary | Pattern 1 / Pitfall 5 | If a maintainer wants bare-word `model_profile` prose also flagged, the allowlist widens and could false-positive on config-help text. Flag for discuss if Phase 9 adds config-heavy commands. |
| A3 | Tier→neutral wording (`opus`→"a higher-capability model", etc.) is acceptable; flattening to "the configured model" is an allowed fallback | D-03 / Pattern 1 | Cosmetic only — the invariant enforces the zero-literal contract regardless of chosen wording. |

**All three are LOW-to-MEDIUM risk and cosmetic/forward-looking; none blocks planning.**

## Open Questions

1. **Does `acceptance-coverage.test.cjs` need a companion update to admit an `AC-27 → NEUTRAL-03` row?**
   - What we know: that suite derives canonical IDs from the v1 section ONLY and asserts every `Confirms:` token is canonical; NEUTRAL-* lives below `## v2 Requirements`, so a v2-family `Confirms:` token would fail its phantom-ref check. `[VERIFIED: test/acceptance-coverage.test.cjs L44-50, L144-153]`
   - What's unclear: whether Phase 8 should (a) extend that suite to cover v2 families, (b) author AC-27 WITHOUT a canonical-family `Confirms:` token (e.g. reference `NEUTRAL-03` as prose the suite's `GENERIC_ID_RE` still catches → still fails), or (c) defer the acceptance-coverage integration to Phase 11 (ACCEPT owns v2 coverage) and have Phase 8 append only the runnable step text.
   - Recommendation: **Plan for (a) as the minimal change** — teach `acceptance-coverage.test.cjs` to treat v2 families (`SYNC|NEUTRAL|CMD|DOCS|ACCEPT`) as canonical when they appear below the v2 boundary, OR scope its phantom-ref check to only-known families. Confirm with the planner before writing AC-27; this is the one cross-suite coupling that can turn green→red. (Note: `REQUIREMENTS.md` uses `## Milestone v2.0 Requirements`, while the suite greps for `## v2 Requirements` — verify the exact boundary string the suite keys on still matches, independent of this phase.)

2. **Should the model-ID pre-collapse rule (Pitfall 1) ship in Phase 8 or wait for Phase 9?**
   - What we know: today's emitted set has zero model-ID strings; the rule is speculative.
   - Recommendation: Ship it now (one extra `.replace`), so Phase 9 inherits it with zero wiring — matches the "born clean" intent.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `node:test` runner, staging | ✓ (project engine ≥22) | — | — |
| No external tools | — | — | — | — |

No external services, CLIs, or runtimes beyond Node. The phase is pure code + test + a doc append.

## Security Domain

> `security_enforcement: true` (config.json). This phase adds no network/auth/data surface; the only relevant control is input-handling of the regex over file content.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes (minor) | The neutralization regexes run over trusted, repo-vendored markdown. Keep patterns **linear-time** (no nested quantifiers / catastrophic backtracking). The recommended patterns (`\b(opus\|sonnet\|haiku)\b`, line-anchored `^…key:.*$`) are ReDoS-safe (no ambiguous repetition). |
| V2/V3/V4/V6 | no | No auth, session, access-control, or crypto surface in this phase. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| ReDoS via crafted content | Denial of Service | Use the linear patterns above; avoid `(.*)+`-style constructs. Input is vendored (not attacker-controlled), so risk is minimal, but keep patterns simple. |
| Silent neutrality regression (a real threat model directive leaks into an emitted artifact) | Tampering / Info-disclosure of routing intent | The NEUTRAL-03 invariant IS the mitigation — loud `file:line:token` failure blocks the leak in CI. |

## Sources

### Primary (HIGH confidence — read/executed directly this session)
- `src/installer/stage.cjs` — convertible loop (L263-291), raw-copy bucket (L213-222), `stageFile` semantics. Confirms F-01.
- `gsd-core/bin/lib/runtime-artifact-conversion.cjs` L2362-2442 — `convertClaudeToBobContent`, `convertClaudeCommandToBobCommand/Skill` frontmatter-whitelist reduction. Confirms F-02.
- Live converter simulation over all 10 `commands/gsd/*.md` — zero tier tokens / zero directives in emitted output. Confirms F-03.
- `grep` counts over vendored payload: `bin/`=122, `workflows/`=56, `references/`=52, `templates/`=1 tier lines. Confirms F-04.
- `src/bob-adapter.cjs` — current exports + isolation invariant (home of `neutralizeModelReferences`).
- `test/backend-neutrality.test.cjs` — programmatic token-set + `deepEqual(hits,[])` loud-assert idiom to mirror.
- `test/installer/stage.test.cjs` — scratch-tmpdir harness, `baseOpts`/`freshManifest`, `seedConvertibleSource` symlink trick, converter-output equality tests.
- `test/installer/install-clean.test.cjs` — real-payload staging via the entry (`repoRoot`-sourced).
- `test/acceptance-coverage.test.cjs` — canonical-ID derivation + phantom-ref check (the AC-27 coupling risk).
- `.planning/ACCEPTANCE-CHECKLIST.md` — frozen AC-01..AC-26 structure (append-only target).
- `.planning/config.json` — `nyquist_validation:false`, `security_enforcement:true`, `model_profile:"balanced"`.
- `package.json` — test script, `js-yaml@4.1.0` sole dep.

### Secondary / Tertiary
- None. No web or package research was needed — this phase is entirely internal-codebase-verified.

## Metadata

**Confidence breakdown:**
- Scope resolution (D-01): HIGH — verified against live `stage.cjs` + converter simulation.
- Standard stack: HIGH — dependency-free, all built-ins, verified in `package.json`.
- Architecture/wiring: HIGH — exact call sites and existing harnesses read directly.
- Pitfalls: HIGH for 2/3/4/5 (verified); MEDIUM for 1 (forward-looking model-ID edge case, zero occurrences today).
- Acceptance-coverage coupling (Open Q1): MEDIUM — behavior of `acceptance-coverage.test.cjs` verified, but the chosen remediation is a planner decision.

**Nyquist Validation section:** OMITTED — `workflow.nyquist_validation: false` in config.json.

**Research date:** 2026-07-03
**Valid until:** 2026-08-02 (stable — internal codebase; re-verify only if `stage.cjs` convertible loop or the Bob converters change).
