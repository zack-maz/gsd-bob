---
status: testing
phase: 03-installer
source: [03-VERIFICATION.md]
started: 2026-06-18T16:30:00Z
updated: 2026-06-18T16:30:00Z
---

## Current Test

number: 1
name: AC-13..AC-16 on a real Bob machine — on-device install/update/uninstall/dry-run pass
expected: |
  On a real Bob runtime with a real ~/.bob:
  - AC-13: a single real `npx` install prints the absolute target path BEFORE writing and produces a working .bob/ GSD layout.
  - AC-14: re-running the installer is idempotent — the gsd custom-mode slug count stays at exactly 1, user-authored commands/rules/modes are preserved with no duplication.
  - AC-15: the manifest dotfile exists after install; --uninstall un-merges the gsd slices and leaves all user files and the project .planning/ intact.
  - AC-16: --dry-run writes nothing to disk.
awaiting: user response

## Tests

### 1. AC-13..AC-16 on a real Bob machine (Phase 6 on-device pass)
expected: Each AC step passes on a live Bob install. Deferred to Phase 6 per VERIFY-01/02 — there is no live Bob on the dev device, so all dev-time verification is doc-conformance / golden / equivalence against a simulated `.bob/` target. Steps AC-13..AC-16 are recorded in `.planning/ACCEPTANCE-CHECKLIST.md`.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
