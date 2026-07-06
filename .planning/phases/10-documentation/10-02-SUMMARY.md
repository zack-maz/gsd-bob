---
phase: 10-documentation
plan: 02
subsystem: docs
tags: [documentation, architecture, maintainer, bob-adapter]
requires:
  - src/bob-adapter.cjs (gateArtifact, buildSupportRoster, neutralizeModelReferences, scanModelLiterals)
  - src/installer/stage.cjs (convertible loop, BOB_CAPABILITY_DECL, .planning guards)
  - UPSTREAM.md (move-not-rewrite framing, 6-artifact inventory)
provides:
  - ARCHITECTURE.md — standalone maintainer-reviewable architecture doc for the Bob adapter (DOCS-03, D-05)
affects:
  - repo-root documentation surface (GitHub-facing; not shipped in npm tarball per D-07)
tech-stack:
  added: []
  patterns:
    - "file:symbol-anchored maintainer doc mirroring UPSTREAM.md register"
    - "deleted-file referenced as git-recovered history, never a live markdown link"
key-files:
  created:
    - ARCHITECTURE.md
  modified: []
decisions:
  - "Cited live src/bob-adapter.cjs + stage.cjs symbols for the gate rationale; sourced the deleted CAPABILITY-MAP.md only via `git show 459d992~1:...` labelled git-recovered history (D-05, Pitfall 2)"
  - "Cited both test/model-neutrality.test.cjs (NEUTRAL-03) and test/backend-neutrality.test.cjs (RUNTIME-04) after opening both (Assumption A1 resolved — both exist)"
  - "Left package.json files allowlist untouched so ARCHITECTURE.md stays repo/GitHub-facing (D-07)"
metrics:
  duration: ~6m
  completed: 2026-07-03
  tasks: 1
  files: 1
status: complete
---

# Phase 10 Plan 02: ARCHITECTURE.md Summary

Authored `ARCHITECTURE.md` at the repo root — a standalone, maintainer-reviewable document explaining the Bob adapter versus traditional open-gsd along the four axes DOCS-03/D-05 name (converter/descriptor model, capability-map gate, backend-neutrality, `.planning/` interchange), every architectural claim anchored to a live `file:symbol` and with no dead capability-map link.

## What Was Built

A single deliverable, `ARCHITECTURE.md`, structured in `UPSTREAM.md`'s maintainer register (audience blockquote + a `file:line`-anchored axis table + prose sections):

- **Axis 1 — Converter/descriptor model:** cites the roster-agnostic convertible-artifact loop in `src/installer/stage.cjs`, the two vendored converters `convertClaudeCommandToBobCommand` / `convertClaudeCommandToBobSkill` in `gsd-core/bin/lib/runtime-artifact-conversion.cjs`, and the `"bob"` registry entry in `gsd-core/bin/lib/capability-registry.cjs`. Reuses `UPSTREAM.md`'s "move, not rewrite" framing.
- **Axis 2 — Capability-map gate:** cites `src/bob-adapter.cjs` `gateArtifact` / `buildSupportRoster`, the `BOB_CAPABILITY_DECL` conservative lower bound (`isolatedSubagents: false`, `structuredPrompts: false`) in `src/installer/stage.cjs`, and `PRIMITIVE_REASONS`. Explains the two defaults in prose (no isolated subagents → sequential-inline; no structured prompts → `text_mode`) and maps them to the two Unsupported roster entries (`gsd-autonomous`, `gsd-parallel-fanout`).
- **Axis 3 — Backend-neutrality:** cites `neutralizeModelReferences` / `scanModelLiterals`, the base64-decoded tier tokens (no bare brand literal in source), the NEUTRAL-03 invariant in `test/model-neutrality.test.cjs`, and the RUNTIME-04 invariant in `test/backend-neutrality.test.cjs`.
- **Axis 4 — `.planning/` interchange:** explains the RUNTIME-03 byte-compatibility contract, the `workspaceRoot` (cwd) vs `repoRoot` (package payload) split, and the installer's never-prune-`.planning/` guards in `stage.cjs`.
- **A one-screen "where the substance lives" recap** tying the descriptor/aliases (move), the two converters, the isolated adapter, and the staging engine together.

## Landmine Handled (D-05, Pitfall 2)

The original Phase 1 capability-map document was deleted in commit `459d992`. The doc references it **only** as git-recovered history via an inline-code `git show 459d992~1:...` command and explicitly labels it as such — it contains **no** markdown link whose target resolves to the deleted path. The gate rationale is instead sourced from live `src/bob-adapter.cjs` (`PRIMITIVE_REASONS` + `BOB_CAPABILITY_DECL`), `SUPPORT-ROSTER.md`, and the decision records. The `stage.cjs` "CAPABILITY-MAP §1/§2" comments are called out in the doc as historical prose, not links.

## Verification

- `test -f ARCHITECTURE.md` and all live-anchor greps (`src/bob-adapter.cjs`, `gateArtifact`, `neutralizeModelReferences`, `stage.cjs`, `UPSTREAM.md`) → PASS.
- `grep -cE '\]\([^)]*CAPABILITY-MAP\.md' ARCHITECTURE.md` → `0` (no dead capability-map link).
- `package.json` `files` allowlist unchanged; `ARCHITECTURE.md` not listed (D-07 satisfied by default).

## Deviations from Plan

None - plan executed exactly as written. Assumption A1 was resolved by opening both `test/model-neutrality.test.cjs` and `test/backend-neutrality.test.cjs` (both present) before citing them.

## Self-Check: PASSED

- `ARCHITECTURE.md` exists at repo root (FOUND).
- Commit `55fef08` exists (FOUND).
