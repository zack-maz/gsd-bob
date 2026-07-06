# Phase 9: Command Expansion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 9-command-expansion
**Mode:** `--auto` (Claude auto-selected the recommended option for every area; no interactive prompts)
**Areas discussed:** Source & version consistency, Capability-map gating, Verification strategy, Roster & count contract

---

## Source & version consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch 18 from 1.6.1 tarball + re-sync the 4 drifted existing sources to 1.6.1 | Vendor all 18 from `@opengsd/gsd-core@1.6.1` `package/commands/gsd/`; also converge the 4 drifted existing sources (`code-review`, `debug`, `audit-fix`, `audit-uat`) to 1.6.1 so all 28 sources are one version | ✓ |
| Fetch 18 from 1.6.1 tarball only | Add the 18 but leave the 4 drifted existing sources at 1.5.0 | |
| Hand-author Bob-shaped sources | Write pre-transformed sources directly | |

**Choice:** Fetch 18 from the immutable 1.6.1 tarball (same discipline as Phase 7) + re-sync the 4 drifted sources → all 28 on one consistent 1.6.1 version.
**Notes:** Scouting found 6 existing sources byte-identical to 1.6.1 but 4 drifted (vendored at 1.5.0 in Phase 5). Honors SYNC-01 "no residual 1.5.0/1.6.1 mix." Sources land pristine; the converter + Phase 8 pass do the Bob transforms at emit time (F-02).

---

## Capability-map gating (CMD-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Supported by default; degrade subagents→inline / prompts→text_mode | Emit all 18; flag-skip only a command that cannot function without isolated subagents + completion signals | ✓ |
| Per-command manual skip decision | Decide Supported vs skip case-by-case without a default | |
| Skip all subagent-heavy commands | Flag-skip anything declaring `Agent` | |

**Choice:** Supported by default; degrade under the capability-map contract; flag-skip only the `autonomous`/`parallel-fanout`-class (none of the 18 is in that cluster).
**Notes:** `map-codebase` uses `Agent` but so does the already-Supported `new-project` (F-04). Expectation: all 18 Supported. Any skip must carry a LOUD `unsupported on Bob: <reason>` roster line. Research must classify each of the 18 against the gate.

---

## Verification strategy (CMD-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Extend the roster-derived table-driven harness + rely on Phase 8 invariant; assert count==28 | Iterate the full `commands/gsd/*` set through the existing equivalence/golden harness; Phase 8 NEUTRAL-03 auto-covers neutrality; assert 28 emitted | ✓ |
| 18 bespoke golden files | One hand-authored golden per new command | |
| Spot-check a sample | Verify a representative subset only | |

**Choice:** Extend the existing roster-derived harness (Phase 5 D-06 drift-proof discipline), keep the real-answer guard, rely on the Phase 8 invariant for neutrality (zero new wiring), assert exactly 28 emitted commands.
**Notes:** The Phase 8 NEUTRAL-03 test already enumerates the emitted converted set via real staging (F-05) — it auto-covers the 18 and must stay green + catch any new inline model prose.

---

## Roster & count contract (CMD-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Regenerate via `generate-support-roster.cjs`; no hand-edit | Candidate set already derived from `commands/gsd/*.md`; regeneration auto-produces the full 28-command split | ✓ |
| Hand-edit the roster | Manually add 18 rows | |

**Choice:** Regenerate `SUPPORT-ROSTER.md` from the `commands/gsd/*.md` candidate set; commit as a generated artifact; never hand-edit.
**Notes:** Regeneration auto-picks up the 18 additions (F-05). Assert the full 28-command roster and the Supported/skip split match the emitted `.bob/commands`.

---

## Claude's Discretion

User delegated all areas via `--auto`. Every decision above is Claude's recommended option. Downstream research/planning may refine implementation details — exact per-command gate classification, precise harness parametrization, and plan/wave batching of the 18 vendors + 4 re-syncs — as long as the CONTEXT.md decisions hold. Research is explicitly invited to pressure-test: (a) the "all 18 Supported" expectation, and (b) the blanket re-sync of the 4 drifted sources to 1.6.1.

## Deferred Ideas

- `transition` (LIFE-01 remainder) — not among the 18.
- `ai-integration-phase` (SHAPE-01 remainder) — not among the 18.
- Autonomy cluster `autonomous`/`manager`/`workstreams` (AUTO-01) — orchestration-locked; deferred.
- Full ~70-skill parity (PARITY-01) — long tail beyond the 28.
- Install-time prose-neutralization of the copied `.bob/gsd-core/**` payload — carried from Phase 8's deferred list.
