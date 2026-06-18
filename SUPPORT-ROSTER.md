# Bob Support Roster

> **GENERATED — do not hand-edit.** Regenerate with `node scripts/generate-support-roster.cjs`.
> This roster is produced from the bob-adapter gate (`gateArtifact` / `buildSupportRoster`
> in `src/bob-adapter.cjs`), not maintained by hand (T-02-10): a stale or silent roster
> would hide a parity gap. Every GSD artifact Bob cannot support is recorded LOUD as an
> `unsupported on Bob: <reason>` line so the gap is never silent (D-10, TRANS-04, parity-first).
>
> **Caveat (Pitfall 5 — YAML comment loss):** the idempotent `custom_modes.yaml` merge
> re-emits via js-yaml, which DROPS comments on dump. The merge invariant is slug-level
> idempotency (replace-in-place, never duplicate, never touch non-gsd slugs), NOT comment
> fidelity. Any comments a user placed in `~/.bob/custom_modes.yaml` are not preserved
> across a gsd-bob merge.
>
> **Scope:** Phase 2 proves the mechanism on a representative candidate set; full-roster
> generation across the whole GSD skill set rides with Phases 4-5.

## Supported (emitted to `.bob/commands` / `.bob/skills`)

- gsd-help
- gsd-plan-phase
- gsd-execute-phase

## Unsupported on Bob (omitted from the loadable set, recorded loud)

- gsd-autonomous: unsupported on Bob: requires isolated subagent orchestration that Bob runs sequentially inline
- gsd-parallel-fanout: unsupported on Bob: requires isolated subagents; Bob runs subagents sequentially inline
