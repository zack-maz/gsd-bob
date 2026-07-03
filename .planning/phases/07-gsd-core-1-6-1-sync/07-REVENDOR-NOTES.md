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
