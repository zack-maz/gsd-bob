---
phase: 07-gsd-core-1-6-1-sync
plan: 02
subsystem: vendored-payload-resync
tags: [re-vendor, nuke-and-restage, bob-patches, idempotency, sync-01, sync-02]
status: complete
requires:
  - scripts/apply-bob-patches.cjs (Plan 07-01)
  - .planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md (Plan 07-01 seed)
provides:
  - gsd-core/ payload restaged at 1.6.1 with six local deltas re-injected
  - gsd-core/VERSION = 1.6.1
  - live re-vendor command log + D-03 verdict + SYNC-01 consistency result in 07-REVENDOR-NOTES.md
affects:
  - Phase 07 Plan 03 (suite re-run, D-08 drift classification, SYNC-03 UPSTREAM.md pointer re-verification, doc/test 1.5.0 residue sweep)
  - Phase 10 DOCS-04 (MAINTAINING runbook — this is the executed dance the runbook narrates)
tech-stack:
  added: []
  patterns:
    - "Nuke-and-restage the whole curated subset (D-05) as the only mechanic guaranteeing SYNC-01 no-version-mix"
    - "Idempotency proven at runtime by comparing run-1 output to run-2 output via a staged baseline (git add), NOT working-tree-vs-HEAD"
    - "Version-consistency scoped to payload identity (VERSION + doc tree + patched files), excluding immutable stock bin/ historical-reference strings"
key-files:
  created: []
  modified:
    - gsd-core/ (216 files in restage commit, 109 in re-inject commit; net 402 tracked at 1.6.1)
    - gsd-core/VERSION (1.5.0 → 1.6.1)
    - gsd-core/bin/lib/capability-registry.cjs (bob runtime block)
    - gsd-core/bin/lib/runtime-artifact-conversion.cjs (~105-line Bob converter block + 3 exports)
    - gsd-core/bin/lib/runtime-name-policy.cjs (bob alias)
    - gsd-core/bin/shared/runtime-aliases.manifest.json (bob alias)
    - .planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md (live log appended)
decisions:
  - "Did NOT edit the stock upstream 1.5.0 comment in bin/lib/legacy-cleanup.cjs:225 — editing it would introduce an undocumented 7th delta that breaks apply-bob-patches.cjs idempotency and corrupts the nuke-and-restage integrity contract (T-07-03); it is an immutable historical Codex-migration reference, same class as stock bin/ ~/.claude and /gsd: strings the plan already scopes out"
  - "Scoped the SYNC-01 version-consistency assertion to the payload's version identity, excluding the single stock legacy-cleanup.cjs historical line — the semantic intent (one consistent version, no 1.5.0/1.6.1 mix) holds"
metrics:
  duration: ~15m
  completed: 2026-07-03
  tasks: 2
  files: 3
---

# Phase 07 Plan 02: Destructive 1.6.1 Re-vendor Summary

Executed the destructive core of the phase: nuked-and-restaged the entire vendored `gsd-core/` payload (was 382 files at 1.5.0) with the pristine `@opengsd/gsd-core@1.6.1` curated subset, then ran the Plan-01 `apply-bob-patches.cjs` to re-inject all six local deltas idempotently, and re-verified both SYNC-02 integration seams plus SYNC-01 payload version-consistency — logging every command live into `07-REVENDOR-NOTES.md`.

## What Was Built

### Task 1 — Pack + nuke-and-restage the pristine 1.6.1 subset
- `npm pack @opengsd/gsd-core@1.6.1` into a scratch tmp dir → `opengsd-gsd-core-1.6.1.tgz` (707 files, shasum `b68686cc…`), extracted and payload root confirmed at `package/gsd-core/{bin,contexts,references,templates,workflows}` by directory listing BEFORE copy (not assumed).
- Nuked the five tracked curated subdirs and restaged the identical subset from the tarball (D-05 no-mix / D-06 boundary unchanged). `gsd-core/VERSION` deliberately NOT restaged (tarball ships none — RESEARCH §2).
- Wholesale-replace proven: 1.6.1-only file `workflows/list-seeds.md` present; working-tree file count 382 → **402** (+20 new 1.6.1 files land inside existing dirs). Pristine-state confirmed pre-patch: Bob converters absent, bob registry absent, colon form + `~/.claude` present, VERSION still 1.5.0.

### Task 2 — Re-inject six local deltas, prove idempotency, re-verify seams
- `node scripts/apply-bob-patches.cjs` reproduced all six deltas: colon→hyphen (**90** .md files), `~/.claude`→`$HOME` (**41** .md files), the `"bob"` registry block, the ~105-line Bob converter block + 3 exports, both aliases, and `VERSION`=1.6.1.
- **D-02 idempotency proven at runtime**: staged the post-run-1 tree (`git add gsd-core/`), ran the script a SECOND time (every step `already applied — no-op` / `0 changed`), and `git diff --quiet gsd-core/` against that staged baseline reported zero changes — the colon→hyphen normalization is at a fixed point.

## Verification Evidence

- **SYNC-01 version-consistency:** `gsd-core/VERSION` = `1.6.1`; `grep -rn '1\.5\.0' gsd-core/` returns exactly one hit — a stock upstream comment (see Deviations) — and nothing else; `grep -rn '~/\.claude' gsd-core/{workflows,references,templates,contexts}` is empty.
- **SYNC-02 seam A (converters):** `require('./gsd-core/bin/lib/runtime-artifact-conversion.cjs')` exposes both `convertClaudeCommandToBobSkill` and `convertClaudeCommandToBobCommand` as functions.
- **SYNC-02 seam B (registry + aliases):** `require('./gsd-core/bin/lib/capability-registry.cjs')` loads clean; `runtimes.bob` resolves (`id=bob`, `title="IBM Bob"`, `configHome.name=.bob`, `env=["BOB_CONFIG_DIR"]`); `runtime-aliases.manifest.json` `bob=["bob","bob-cli"]`; `runtime-name-policy.cjs` carries the `bob:` alias.
- **Syntax integrity (mitigates T-07-04):** `node --check` passes on all three anchor-patched `.cjs` files.

## Deviations from Plan

### 1. [Rule 1-adjacent — research-premise correction] Stock 1.5.0 comment in 1.6.1 payload
- **Found during:** Task 2 SYNC-01 version-consistency check.
- **Issue:** RESEARCH §7 stated "the only place 1.5.0 could live is `gsd-core/VERSION`" — a fact verified against the **1.5.0** pristine tarball. The **1.6.1** payload ships a NEW stock file line, `bin/lib/legacy-cleanup.cjs:225`, containing the literal `1.5.0` inside an upstream historical comment about Codex skill-migration (`// When Codex upgrades to gsd-core 1.5.0 it writes fresh skill files to`). Verified byte-identical in the packed tarball.
- **Resolution:** NOT edited. Editing stock `bin/` code would introduce an undocumented 7th delta that `apply-bob-patches.cjs` does not reproduce — breaking D-02 idempotency and the Phase-10 runbook — and would corrupt the nuke-and-restage "pristine + exactly six deltas" integrity contract (T-07-03). It is immutable historical-reference content, the same class as the stock `bin/` `~/.claude` (~20) and `/gsd:` colon (~38) strings the plan already scopes OUT of its assertions. The SYNC-01 *semantic* intent (payload carries one consistent version, no 1.5.0/1.6.1 mix) holds: VERSION=1.6.1, no version-marker residue. The literal must-have grep is refined to exclude this single stock line.
- **Files modified:** none (deviation is a NON-edit + a scoped assertion).
- **Commit:** documented in 07-REVENDOR-NOTES.md (commit `0b5e67f`).

## Known Stubs

None — the payload is complete and requireable; all seams resolve. Plan 03 owns the suite re-run, D-08 drift classification, SYNC-03 UPSTREAM.md re-verification, and the doc/test-scoped 1.5.0 residue sweep (out of scope here).

## Threat Flags

None — no new network endpoint, auth path, or trust-boundary surface introduced. The two registered threats were mitigated as planned: T-07-03 (restage integrity) by copying exclusively from the immutable extracted tarball and confirming payload root + a 1.6.1-only file; T-07-04 (anchor patch corruption) by `node --check` + require-smoke on all three patched `.cjs` and the idempotency double-run guarding against double-insertion.

## Self-Check: PASSED

- `gsd-core/VERSION` = `1.6.1` — FOUND
- `gsd-core/workflows/list-seeds.md` (1.6.1-only) — FOUND
- Commit `507a48f` (restage) — FOUND in git log
- Commit `0b5e67f` (re-inject) — FOUND in git log
- `07-REVENDOR-NOTES.md` Task 1 + Task 2 + D-03 verdict sections — FOUND
