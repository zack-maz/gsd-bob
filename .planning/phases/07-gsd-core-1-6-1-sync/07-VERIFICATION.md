---
phase: 07-gsd-core-1-6-1-sync
verified: 2026-07-03T00:00:00Z
status: passed
score: 14/14 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  # Initial verification — no prior VERIFICATION.md existed
---

# Phase 7: gsd-core 1.6.1 Sync Verification Report

**Phase Goal:** Fully re-vendor the `gsd-core/` payload from 1.5.0 → 1.6.1 on one consistent version — the foundation everything downstream builds on — and re-validate the Bob descriptor and converter suites against the new bin layer, all without a live Bob.
**Verified:** 2026-07-03
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | (SYNC-01) `gsd-core/VERSION` reads exactly `1.6.1` | ✓ VERIFIED | `cat gsd-core/VERSION` → `1.6.1` (no trailing newline, matching pre-vendor file shape) |
| 2  | (SYNC-01) Payload replaced wholesale — 1.6.1-only `workflows/list-seeds.md` present | ✓ VERIFIED | `test -f gsd-core/workflows/list-seeds.md` → PRESENT |
| 3  | (SYNC-01) No residual `1.5.0` in payload except the ONE documented stock line | ✓ VERIFIED | `grep -rn '1\.5\.0' gsd-core/` returns exactly `bin/lib/legacy-cleanup.cjs:225` (stock upstream Codex-migration comment); scoped grep excluding it is empty — recorded exception, not a gap |
| 4  | (SYNC-01) `~/.claude` normalized to `$HOME` across the `.md` doc tree | ✓ VERIFIED | `grep -rn '~/\.claude' gsd-core/{workflows,references,templates,contexts}` → empty |
| 5  | (SYNC-01) No `1.5.0` residue outside payload (README, UPSTREAM, stage.cjs) | ✓ VERIFIED | grep of README.md / UPSTREAM.md / src/installer/stage.cjs for `1.5.0` → all clean |
| 6  | (SYNC-02) Both Bob converter functions exist and require resolves them | ✓ VERIFIED | `require('./gsd-core/bin/lib/runtime-artifact-conversion.cjs')` → `convertClaudeCommandToBobSkill: function`, `convertClaudeCommandToBobCommand: function` |
| 7  | (SYNC-02) Patched `.cjs` files are syntactically clean | ✓ VERIFIED | `node --check` passes on runtime-artifact-conversion, capability-registry, runtime-name-policy, and scripts/apply-bob-patches.cjs |
| 8  | (SYNC-02) `bob` runtime resolves with configHome `.bob` + env `BOB_CONFIG_DIR` | ✓ VERIFIED | `runtimes.bob` = `{id:bob, title:"IBM Bob", configHome:{kind:dot-home, name:.bob, env:[BOB_CONFIG_DIR]}, artifactLayout naming both converters}` |
| 9  | (SYNC-02) Both alias surfaces carry `bob` | ✓ VERIFIED | manifest `"bob":["bob","bob-cli"]`; runtime-name-policy.cjs L41 `bob: ['bob', 'bob-cli']` in FALLBACK_ALIASES |
| 10 | (SYNC-02) `gsd-tools.cjs query` resolves under the 1.6.1 bin | ✓ VERIFIED | `node gsd-core/bin/gsd-tools.cjs query roadmap.analyze --raw` returns valid JSON (phases parsed), exit 0 |
| 11 | (SYNC-02) Descriptor + neutrality invariants pass 10/10 UNMODIFIED | ✓ VERIFIED | `node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` → tests 10, pass 10, fail 0 |
| 12 | (SYNC-02) Full suite green at baseline; staged-shim-loads asserts 1.6.1 | ✓ VERIFIED | `npm test` → 189 tests / 186 pass / 3 fail (exact known baseline, zero new failures); staged-shim-loads.test.cjs:65 asserts `pkg.version === '1.6.1'` |
| 13 | (SYNC-03) `UPSTREAM.md` targets gsd-core 1.6.1 | ✓ VERIFIED | UPSTREAM.md L12 `**Targeted gsd-core version:** 1.6.1 (from gsd-core/VERSION)`; no `1.5.0` in file |
| 14 | (SYNC-03) Move-inventory pointers (file:line) resolve against the 1.6.1 source | ✓ VERIFIED | Spot-checked all: registry `"bob": {` @L2876; skill impl @L2399; command impl @L2427; name-policy `bob` @L41; runtime-homes dot-home case @L84 — every pointer matches the claimed location; name-policy alias documented as 6th artifact; HAND-EDIT converter framing present @L2338 |

**Score:** 14/14 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `gsd-core/VERSION` | reads 1.6.1 | ✓ VERIFIED | `1.6.1`, no trailing newline |
| `gsd-core/` payload | wholesale 1.6.1, six deltas re-injected | ✓ VERIFIED | list-seeds.md present; converters + registry + aliases re-injected; no version mix |
| `scripts/apply-bob-patches.cjs` | idempotent six-delta reproducer, node-builtins only | ✓ VERIFIED | node --check clean; imports `{transformContentToHyphen, readCmdNames}` from fix-slash-commands.cjs (not run as main); only `node:fs`/`node:path`; no child_process |
| `UPSTREAM.md` | 1.6.1 target + re-verified pointers + name-policy alias + honest converter framing | ✓ VERIFIED | targets 1.6.1; 6-artifact inventory; pointers resolve; hand-edit framing |
| `test/installer/staged-shim-loads.test.cjs` | version fixture 1.6.1 | ✓ VERIFIED | L65 asserts `1.6.1` |
| `07-REVENDOR-NOTES.md` | live log seeding Phase 10 runbook | ✓ VERIFIED | complete command log, baseline, D-03/D-08 records, pointer re-verification, runbook seed |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `src/installer/stage.cjs` L242 | `gsd-core/VERSION` | reads VERSION at stage time | ✓ WIRED | VERSION exists (1.6.1) — no ENOENT |
| `src/installer/stage.cjs` L268 | `runtime-artifact-conversion.cjs` | require-destructures both Bob converters | ✓ WIRED | both `convertClaudeCommandToBob{Skill,Command}` re-exported and resolve |
| `apply-bob-patches.cjs` | `fix-slash-commands.cjs` | imports exported pure transforms | ✓ WIRED | L39 named import of transformContentToHyphen + readCmdNames |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Converters requireable | `require(...).convertClaudeCommandToBob{Skill,Command}` | both `function` | ✓ PASS |
| bob runtime resolves | `require(capability-registry).runtimes.bob` | full descriptor (.bob / BOB_CONFIG_DIR) | ✓ PASS |
| Shim resolves under 1.6.1 bin | `node gsd-core/bin/gsd-tools.cjs query roadmap.analyze --raw` | valid JSON, exit 0 | ✓ PASS |
| Converter output equivalence | golden suites (skill/command/text-mode) | green (via full suite) | ✓ PASS |
| Descriptor + neutrality invariants | `node --test backend-neutrality descriptor` | 10/10 pass | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SYNC-01 | 07-01, 07-02, 07-03 | Payload fully replaced at 1.6.1, one consistent version | ✓ SATISFIED | Truths 1–5; VERSION=1.6.1, no mix, doc tree normalized |
| SYNC-02 | 07-01, 07-02, 07-03 | Descriptor + converter suites re-validated against 1.6.1 bin; shim resolves bob home | ✓ SATISFIED | Truths 6–12; invariants 10/10, suite at baseline, seams resolve |
| SYNC-03 | 07-03 | UPSTREAM.md → 1.6.1, 5-artifact pointers re-verified | ✓ SATISFIED | Truths 13–14; targets 1.6.1, all pointers resolve, +6th alias artifact |

No orphaned requirements — SYNC-01/02/03 all claimed by plans and all satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | none | — | No debt markers (TBD/FIXME/XXX) in phase-authored files; no child_process/network in the patch script |

### Human Verification Required

None. All truths are programmatically verifiable and were verified directly against the codebase. Live-Bob execution is out of scope for this phase (deferred to the consolidated on-device acceptance pass, ACCEPT-*/VERIFY-02) per the project's no-live-Bob constraint.

### Gaps Summary

No gaps. The phase goal is achieved in the codebase: the vendored `gsd-core/` payload is wholesale 1.6.1 with the six local deltas re-injected idempotently, no version mix (the single `legacy-cleanup.cjs:225` stock upstream comment is a recorded, verified exception — not a payload version marker), the Bob descriptor + converters + aliases all resolve against the 1.6.1 bin, the invariant suites pass 10/10 unmodified, the full suite is at the exact known 186/3 pre-existing baseline (zero new failures), and `UPSTREAM.md` accurately targets 1.6.1 with all move-inventory pointers re-verified against the actual source.

The 3 baseline `npm test` failures (2× VERIFY-01 on the missing `## v2 Requirements` boundary, 1× CORE-02 ENOENT on an archived phase-04 plan) predate this phase and were confirmed identical to the recorded baseline — correctly not attributed to Phase 7.

---

_Verified: 2026-07-03_
_Verifier: Claude (gsd-verifier)_
