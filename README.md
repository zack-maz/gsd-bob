# gsd-bob

**GSD for IBM Bob** — an installable adapter that makes [open-gsd](https://github.com/open-gsd/gsd-core),
the spec-driven "Getting Stuff Done" planning framework, run natively inside
[IBM Bob](https://bob.ibm.com). Install with one command and run the full GSD planning loop
(new-project → plan-phase → execute-phase → verify) as Bob-native slash commands and Agent
Skills, producing the same `.planning/` artifacts GSD produces in Claude Code — regardless
of which model backend Bob routes to.

## Install

```bash
npx -y --package=@zack-maz/gsd-bob@latest -- gsd-bob --bob --local
```

This stages GSD as Bob `.bob/commands/*.md` slash commands and `.bob/skills/<name>/SKILL.md`
Agent Skills.

## Scope

Pick where the artifacts are written with `--local` or `--global`:

| Flag | Target | Use when |
|------|--------|----------|
| `--local` / `-l` | `<project>/.bob/` | Per-project install, next to the project's `.planning/`. |
| `--global` / `-g` | `~/.bob/` | Available to every Bob session on the machine. |

The installer **prints the resolved absolute target path before writing** (e.g.
`Installing into: /…/.bob`), so you always know where artifacts land. A global install in a
non-project directory skips the per-project `text_mode` config write and emits a
known-limitation note (`text_mode` is a per-project guarantee written into
`<project>/.planning/config.json`, not enforced at the runtime/descriptor level).

## Modes: update and clean

There are **no dedicated update or clean flags** — gsd-bob mirrors gsd-core's convention exactly:

- **Update:** re-run the same install command. It re-stages artifacts idempotently,
  preserving your user-authored commands, rules, and any non-`gsd-*` custom modes (the `gsd`
  slug is replaced in place, never duplicated).
- **Clean:** run `--uninstall` and then install again:

  ```bash
  npx -y --package=@zack-maz/gsd-bob@latest -- gsd-bob --bob --local --uninstall
  npx -y --package=@zack-maz/gsd-bob@latest -- gsd-bob --bob --local
  ```

Uninstall is manifest-driven: it un-merges merged slices (the `gsd` custom mode, inline
config JSON) and hash-match deletes tracked file entries. It **never deletes `.planning/`**.

Use `--dry-run` on any install to print the full staging plan without writing anything.

## Supported skills

The skills below are the supported (emitted) set, sourced from
[`SUPPORT-ROSTER.md`](./SUPPORT-ROSTER.md) — the roster is **generated** from the bob-adapter
gate (`node scripts/generate-support-roster.cjs`), never hand-maintained, so this list cannot
silently drift from what actually installs. Each emits both a Bob slash command and an Agent
Skill:

- `gsd-new-project`
- `gsd-discuss-phase`
- `gsd-plan-phase`
- `gsd-execute-phase`
- `gsd-verify-work`
- `gsd-progress`
- `gsd-code-review`
- `gsd-debug`
- `gsd-audit-fix`
- `gsd-audit-uat`

This covers the GSD **core loop** (`new-project` → `discuss-phase` → `plan-phase` →
`execute-phase` → `verify-work`, plus `progress`) and the four **quality gates**
(`code-review`, `debug`, `audit-fix`, `audit-uat`).

## Flagged gaps (parity-first)

Skills that depend on a primitive Bob does not provide are **omitted from the loadable set
and recorded loud** in `SUPPORT-ROSTER.md` as `unsupported on Bob: <reason>` lines — never
silently broken. Current gaps:

- `gsd-autonomous` — *unsupported on Bob: requires isolated subagent orchestration that Bob
  runs sequentially inline.*
- `gsd-parallel-fanout` — *unsupported on Bob: requires isolated subagents; Bob runs
  subagents sequentially inline.*

Bob runs subagents sequentially inline (no isolated-subagent / `new_task` primitive), and
interactive prompts degrade to numbered `text_mode` choices rather than a structured-choice
payload. These are conservative, documented lower-bound defaults.

## Targeted gsd-core version

gsd-bob vendors and targets **gsd-core `1.5.0`**. See [`UPSTREAM.md`](./UPSTREAM.md) for the
file:line inventory of what lifts upstream as a clean move (one registry entry, one alias,
and the single `src/bob-adapter.cjs` adapter module).

## Verification posture (test-deferred)

There is no live IBM Bob on the development device. All dev-time verification is therefore
**doc-conformance, golden-diff, and Claude-runtime equivalence** — never an on-device Bob
run. The standing suites prove the contract holds without a live Bob:

- `test/backend-neutrality.test.cjs` — zero model-backend literals in the bob runtime entry
  and adapter.
- `test/quality-gate-equivalence.test.cjs` / `test/quality-gate-contract.test.cjs` — the
  four quality gates convert byte-identically and emit through the real installer.
- `test/debug-state-persistence.test.cjs` — debug start→reset→continue→restore round-trip.
- `test/core-loop-equivalence.test.cjs` / `test/core-loop-contract.test.cjs` — the core
  loop's golden + structural contract.

The on-device run is **deferred to a single unattended acceptance pass on real Bob hardware**.
Every device-runnable step lives in [`.planning/ACCEPTANCE-CHECKLIST.md`](./.planning/ACCEPTANCE-CHECKLIST.md)
(`AC-01..AC-26`), the on-device complement to these hermetic suites.

## Documentation

- [`.planning/ACCEPTANCE-CHECKLIST.md`](./.planning/ACCEPTANCE-CHECKLIST.md) — the consolidated,
  device-runnable on-device acceptance pass.
- [`UPSTREAM.md`](./UPSTREAM.md) — the 5-artifact upstream-move inventory for a gsd-core
  maintainer.
- [`SUPPORT-ROSTER.md`](./SUPPORT-ROSTER.md) — the generated supported / unsupported skill roster.
