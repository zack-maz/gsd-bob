---
phase: 10-documentation
plan: 03
subsystem: docs
tags: [documentation, maintenance, runbook, revendor, gsd-core]
status: complete
requires:
  - "07-REVENDOR-NOTES.md (the real 1.5.0 → 1.6.1 log distilled into the runbook)"
  - "scripts/apply-bob-patches.cjs (six-delta re-injection mechanic)"
  - "scripts/generate-support-roster.cjs (roster regeneration mechanic)"
provides:
  - "MAINTAINING.md — repeatable, numbered gsd-core version-bump runbook (DOCS-04, D-06)"
affects:
  - "future gsd-core version bumps (the mechanical replay procedure)"
tech-stack:
  added: []
  patterns:
    - "Distill-a-live-log-into-a-replayable-checklist (07-REVENDOR-NOTES.md → MAINTAINING.md)"
    - "<old>/<new> placeholder runbook (replayable for the next bump, not hardwired to 1.5.0/1.6.1)"
key-files:
  created:
    - "MAINTAINING.md"
  modified: []
decisions:
  - "Authored MAINTAINING.md as a checklist (numbered steps + exact commands), not a narrative retrospective (D-06 / RESEARCH §5 tone)"
  - "Kept <old>/<new> placeholders throughout so the runbook is replayable for the next bump"
  - "Did NOT add MAINTAINING.md to package.json files allowlist (D-07 — repo/GitHub-facing doc only)"
metrics:
  duration: "~5 min"
  completed: 2026-07-03
  tasks: 1
  files: 1
---

# Phase 10 Plan 03: MAINTAINING Runbook Summary

Authored `MAINTAINING.md` at the repo root — a repeatable, numbered gsd-core version-bump runbook distilled from the real `1.5.0 → 1.6.1` re-vendor recorded in `07-REVENDOR-NOTES.md`, citing the real scripts and carrying the four real environment caveats.

## What Was Built

`MAINTAINING.md` (DOCS-04, D-06): an 8-step replayable checklist a maintainer runs for the next gsd-core bump, with exact commands using `<old>`/`<new>` placeholders (mirroring `UPSTREAM.md`'s imperative maintainer voice):

1. Capture provenance (git HEAD short SHA, current `gsd-core/VERSION`, target, date) + record the `npm test` baseline BEFORE any mutation.
2. `npm pack @opengsd/gsd-core@<new>` into a scratch tmp dir, `tar -xzf`, confirm the payload root `package/gsd-core/{bin,contexts,references,templates,workflows}` by `ls` before copying (tarball ships NO `VERSION`).
3. `rm -rf gsd-core/{bin,contexts,references,templates,workflows}` (the tracked curated 5-subdir subset).
4. `cp -R` the identical 5 subdirs from the extracted tarball.
5. `node scripts/apply-bob-patches.cjs` to re-inject the six local Bob deltas (colon→hyphen, `~/.claude`→`$HOME/.claude`, bob registry block, ~105-line converter block + 3 exports, both aliases, local `VERSION`), then PROVE idempotency (`git add gsd-core/`, run a 2nd time = all no-ops, `git diff --quiet gsd-core/`).
6. Re-sync any drifted `commands/gsd/*.md` sources to `<new>` (the Phase 9 version-consistency lesson).
7. `node scripts/generate-support-roster.cjs` to regenerate the roster.
8. Run invariants FIRST (`node --test test/backend-neutrality.test.cjs test/descriptor.test.cjs` — unmodified), then `npm test`, subtract the baseline, classify each non-baseline failure (expected-drift → regenerate that fixture + one-line justification; regression → fix); then bump `gsd-core/VERSION` and update/re-verify `UPSTREAM.md`'s pointers against the new source.

The runbook includes the four real caveats verbatim in intent:
- **(a)** the pre-existing baseline `npm test` failures are environmental noise (archived `.planning/` fixtures) — subtract, never "fix" them.
- **(b)** the stock `legacy-cleanup.cjs:225` `1.5.0` comment is a permanent expected exception — grep-exclude it (editing it introduces an undocumented 7th delta that breaks idempotency).
- **(c)** `npm pack` requires network (registry-signed immutable tarball).
- **(d)** the converters are LOCAL hand-edits — the re-injection contract (grep-absent in tarball, present post-script) is what matters, not an upstream-existence check.

Plus the guaranteed golden drift: `test/installer/staged-shim-loads.test.cjs` (staged `package.json` version flips `<old>`→`<new>`) — regenerate with a one-line justification.

## Verification

All plan `<automated>` anchor greps pass:

```
test -f MAINTAINING.md
grep -q 'apply-bob-patches.cjs'      MAINTAINING.md  ✅
grep -q 'generate-support-roster.cjs' MAINTAINING.md  ✅
grep -q 'gsd-core/VERSION'           MAINTAINING.md  ✅
grep -q 'legacy-cleanup.cjs'         MAINTAINING.md  ✅
grep -q 'npm pack'                   MAINTAINING.md  ✅
grep -qE 'git diff --quiet'          MAINTAINING.md  ✅
```

- `staged-shim-loads.test.cjs` golden drift documented ✅
- `package.json` `files` allowlist does NOT list `MAINTAINING.md` (D-07 held) ✅

## Deviations from Plan

None — plan executed exactly as written.

## Acceptance Criteria

- MAINTAINING.md exists at repo root with numbered steps 1–8 in the recorded order ✅
- Cites `scripts/apply-bob-patches.cjs` (six-delta re-injection + idempotency) and `scripts/generate-support-roster.cjs` (roster regen) ✅
- Includes the four real caveats + the guaranteed `staged-shim-loads.test.cjs` golden drift ✅
- Steps use replayable `<old>`/`<new>` placeholders (not hardwired `1.5.0`/`1.6.1`) ✅
- `package.json` `files` still does not list `MAINTAINING.md` (D-07) ✅

## Known Stubs

None.

## Commits

- `cc20bcc` docs(10-03): add MAINTAINING.md gsd-core version-bump runbook (DOCS-04)

## Self-Check: PASSED

- MAINTAINING.md exists ✅
- 10-03-SUMMARY.md exists ✅
- Commit cc20bcc in history ✅
