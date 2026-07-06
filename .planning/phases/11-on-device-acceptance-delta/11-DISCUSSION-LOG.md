# Phase 11: On-Device Acceptance Delta - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 11-on-device-acceptance-delta
**Mode:** `--auto --chain` (Claude auto-selected the recommended option for every gray area; no interactive prompts)
**Areas discussed:** Step granularity for the 18 new commands, ACCEPT-02 discharge, insert-only guarantee, traceability derivation, safety/read-only posture

---

## Step granularity for the 18 new commands (ACCEPT-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Per-command read-only emission-recognition step (AC-28..AC-45) | One AC step per new command, `ls`/`cat .bob/commands/gsd-<name>.md` + palette observation (AC-07/AC-08 pattern). 18 steps, clean 1:1 traceability, read-only/T-01-SC safe. | ✓ |
| Single consolidated step | One AC-28 that `ls`-enumerates all 18 in one command. +1 roll-up row but weaker per-command traceability. | |
| Per-command functional runs | Actually invoke each `/gsd-*` command on-device. Violates T-01-SC read-only safety; several of the 18 mutate irreversibly / open PRs. Rejected. | |

**Claude's choice (auto):** Per-command read-only emission-recognition steps (D-01/D-02).
**Notes:** Functional runs rejected on safety grounds (F-03). Consolidated form logged as the planner's fallback if 18 roll-up rows is judged too heavy.

---

## ACCEPT-02 model-neutrality step

| Option | Description | Selected |
|--------|-------------|----------|
| Discharge via existing AC-27 + amend its Confirms line | AC-27 (added in Phase 8) already IS the NEUTRAL-03 grep; its `gsd-*` glob already covers the 18 new commands. Add `ACCEPT-02` to AC-27's `Confirms:` line (AC-27 is outside the frozen AC-01..26 range). No duplicate step. | ✓ |
| Add a new duplicate grep step | Author a second model-neutrality grep as a fresh AC. Redundant with AC-27. Rejected. | |
| Thin cross-referencing AC-46 | Append a tiny step pointing to AC-27 and Confirming ACCEPT-02. Valid alternative if amending AC-27 is judged less clean. | |

**Claude's choice (auto):** Discharge via AC-27 + one-token Confirms amend (D-03).
**Notes:** F-01/F-02 — AC-27 pre-satisfies ACCEPT-02's substance; the phase makes it *provably traceable* rather than duplicating it.

---

## Insert-only guarantee over AC-01..AC-26 (SC#3)

| Option | Description | Selected |
|--------|-------------|----------|
| Hermetic snapshot-fixture anchor/diff test | Freeze the AC-01..AC-26 step-block slice as a committed fixture; assert byte-equality against the live checklist. Deterministic post-commit. | ✓ |
| git-HEAD diff | Diff against `git show HEAD:...`. Not hermetic after the phase commits. | |

**Claude's choice (auto):** Snapshot-fixture anchor/diff test scoped to the AC step blocks (D-04).
**Notes:** Freeze scoped to step blocks only — roll-up table / execution-order prose may gain rows/notes outside the frozen range.

---

## Traceability test derivation (ACCEPT-01, SC#1)

| Option | Description | Selected |
|--------|-------------|----------|
| Derive delta-set drift-proof from roster/commands-dir | Compute the covered-command set from AC-01..AC-27 and require every remaining Supported command to have a delta step. Mirrors acceptance-coverage.test.cjs anti-drift discipline. | ✓ |
| Freeze the 18 names as a literal list | Simpler but violates the derive-never-freeze precedent. | |

**Claude's choice (auto):** Drift-proof derivation, composed with (not forking) the existing coverage suite (D-05).
**Notes:** Exact derivation (roster-minus-covered vs. commands-dir-minus-covered) left to planning; invariant is "derived, never a frozen literal."

---

## Safety / read-only posture (T-01-SC)

| Option | Description | Selected |
|--------|-------------|----------|
| All new Cmd lines read-only | `ls`/`cat`/`grep`/`echo` only; refutations logged to existing ACCEPTANCE-FOLLOWUPS.md. | ✓ |
| Mixed (functional for safe subset) | Run the safe-ish commands (`health`, `stats`) functionally. Rejected — non-uniform schema, weakens unattended-safety. | |

**Claude's choice (auto):** Uniform read-only (D-06/D-07).

---

## Claude's Discretion

User delegated all areas via `--auto`. All decisions above are Claude's recommended options. Research is invited to pressure-test: (a) AC-27's `gsd-*` glob genuinely covers all 18 new commands with zero scope gap (D-03), and (b) none of the 18 needs an on-device functional step to satisfy ACCEPT-01's intent (D-01).

## Deferred Ideas

- On-device acceptance for the deferred long-tail commands (`transition`, `ai-integration-phase`, autonomy cluster, full ~70-skill parity) — not emitted, no AC step.
- Supervised functional smoke of a safe subset of the 18 — manual follow-up, not a development deliverable.
- Install-time prose-neutralization of the copied `.bob/gsd-core/**` raw payload — carried from Phase 8's deferred list.
