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

_(empty — to be filled live during Plans 02/03)_

---

## D-03 converter re-verification result (filled in Plan 02/03)

Re-verify `convertClaudeCommandToBobSkill` / `convertClaudeCommandToBobCommand` behavior after
re-injection into the 1.6.1 `runtime-artifact-conversion.cjs`. Per RESEARCH §3 these are LOCAL
hand-edited code (in-file banner `gsd-bob HAND-EDIT to this GENERATED file`), NOT stock gsd-core —
they must be re-injected wholesale by `apply-bob-patches.cjs`, not treated as upstream functions.

_(to be filled live during Plan 02/03)_

---

## D-08 fixture-drift justifications (keyed by fixture name) (filled in Plan 03)

One-line recorded justification per regenerated golden fixture. Invariants
(`test/backend-neutrality.test.cjs`, `test/descriptor.test.cjs`) are NOT drift-eligible (D-09).
Expected guaranteed drift: `test/installer/staged-shim-loads.test.cjs` version `1.5.0` → `1.6.1`.

_(to be filled live during Plan 03)_

---

## SYNC-03 pointer re-verification (filled in Plan 03)

Re-verify every `UPSTREAM.md` file:line pointer against the 1.6.1 source (5-artifact move
inventory + the undocumented name-policy alias, 4th data patch). Bump targeted version 1.5.0 →
1.6.1 and correct the "converters are stock upstream" framing (they are a vendored hand-edit).

_(to be filled live during Plan 03)_
