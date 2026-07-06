# Phase 8: Model Neutralization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 8-model-neutralization
**Mode:** `--auto` (Claude auto-selected the recommended option for every gray area; no interactive prompts)
**Areas discussed:** Invariant/neutralization scope, Neutralizer placement, Model-literal regex & prose rewrite, Invariant test semantics + acceptance hook

---

## Invariant / Neutralization Scope (→ CONTEXT D-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Converted artifacts only | Neutralize + assert over `.bob/commands` + `.bob/skills` (the converter output); exclude raw-copied `.bob/gsd-core/**` | ✓ |
| Full emitted tree incl. payload prose | Also run an install-time prose-neutralizer over copied `workflows`/`references`/`templates` (never `bin/`) | |
| Everything under `.bob/` incl. `bin/` | Literal reading of "entire emitted output set" | |

**Choice:** Converted artifacts only (recommended default).
**Notes:** Grounded in scout facts F-01..F-04. Option 3 is impossible — `.bob/gsd-core/bin/**` is the executable model-resolver/catalog runtime that must keep working. Option 2 risks mangling the `model_profile`/`resolve_model_ids` **config vocabulary** in `new-project.md`/`settings.md` (those are config-system keys, not routing directives) and would break the verbatim-payload invariant from Phase 7. Requirement text NEUTRAL-01/02 says "the converter … emitted artifacts," which is exactly the converted set. **Flagged as the #1 research question** because the roadmap goal prose ("~231 mentions flow through the converter") is looser than the actual raw-copy architecture — research must confirm F-01 and may challenge this scope with evidence.

## Neutralizer Placement (→ CONTEXT D-02)

| Option | Description | Selected |
|--------|-------------|----------|
| New fn in `bob-adapter.cjs`, post-pass in `stage.cjs` | `neutralizeModelReferences()` wraps converter output before `stageFile` | ✓ |
| Edit the vendored converter | Add neutralization inside `runtime-artifact-conversion.cjs` | |

**Choice:** New function in `src/bob-adapter.cjs`, applied as a post-pass in the `stage.cjs` convertible loop (recommended default).
**Notes:** Preserves the "all Bob logic isolated to bob-adapter + two registry edits" invariant and the upstream "move not rewrite" story. Editing the vendored converter would fork gsd-core and break Phase 7's clean-payload guarantee.

## Model-literal Regex & Prose Rewrite (→ CONTEXT D-03)

| Option | Description | Selected |
|--------|-------------|----------|
| One shared brand-tier regex + explicit allowlist + capability-neutral map | `\b(opus\|sonnet\|haiku)\b` + residual `model:`/`effort:`; allowlist peer-CLI names + config keys; tier→"higher-capability/balanced/faster model" | ✓ |
| Broad "any AI word" grep | Match any model/AI-brand token | |
| Flatten all tiers to "the model" | Simpler rewrite, drops relative-capability intent | |

**Choice:** Shared brand-tier regex with explicit allowlist + curated capability-neutral replacement map (recommended default).
**Notes:** The allowlist is where correctness lives — the "gemini"/"codex" peer-CLI references (legit external reviewers, F-03) and `model_profile` config vocabulary are true-negatives a naive grep would flag. One exported regex constant powers BOTH the pass and the invariant so they cannot drift. Flattening (Option 3) is an acceptable fallback if tiering proves fragile.

## Invariant Test Semantics + Acceptance Hook (→ CONTEXT D-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Loud `node:test` over real staged emission + insert-only acceptance one-liner | `test/model-neutrality.test.cjs` fails with `file:line:token`; same grep appended to ACCEPTANCE-CHECKLIST.md for Phase 11 | ✓ |
| Byte-golden fixtures | Freeze neutralized output as goldens | |

**Choice:** Loud `node:test` suite driving the real staging harness + insert-only ACCEPT-02 acceptance step (recommended default).
**Notes:** Roadmap explicitly rejects byte-golden ("prose rewriting is fuzzy; absence-of-X is the cleaner, more durable contract"). Reuse the installer scratch-tmpdir harness for real emission and mirror `test/acceptance-coverage.test.cjs` for the traceable, insert-only checklist append (frozen AC-01..AC-26 untouched).

---

## Claude's Discretion

- User delegated all four areas (`--auto` for everything). All selections above are Claude's recommended options. Refinement latitude at planning time: exact replacement wording (D-03), exact allowlist pattern set, and precise test-harness reuse (D-04). Research is explicitly invited to challenge D-01's scope with evidence.

## Deferred Ideas

- Install-time prose-neutralization of copied `.bob/gsd-core/workflows|references|templates` — deferred pending the D-01 research question; never touch `.bob/gsd-core/bin/**`.
