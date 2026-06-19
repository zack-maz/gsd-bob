# Upstreaming gsd-bob into gsd-core

> **Audience:** a `@opengsd/gsd-core` maintainer evaluating a PR that adds `bob` as a
> first-class runtime. This document is an **inventory, not a proposal of new architecture**:
> gsd-core is already built to absorb new runtimes, and the Bob support added here is a
> **move, not a rewrite**. Everything below already lives in this repo's vendored
> `gsd-core/` copy plus one isolated adapter module — lifting it upstream is mechanical.

**Targeted gsd-core version:** `1.5.0` (from `gsd-core/VERSION`).

## Why this is a move, not a rewrite

gsd-core's runtime architecture is data-driven. A runtime is defined by a **registry
entry** (a descriptor) and an **alias**; artifact conversion is performed by gsd-core's
**generic, registry-parameterized** converters, and config-home resolution is handled by a
**generic `dot-home` resolver**. Adding Bob therefore required:

- **One new registry entry** (`"bob"`) describing Bob's surface (`.bob/skills`,
  `.bob/commands`, `slash-hyphen` command style, `BOB_CONFIG_DIR` env override).
- **One new alias** (`--bob` / `bob-cli`).
- **No new converter code** — Bob reuses gsd-core's generic
  `convertClaudeCommandToBob{Skill,Command}` converters, which are parameterized by the
  registry entry. (These converter functions are named in the registry; they are gsd-core's
  universal source-format converters, not Bob-specific logic.)
- **No new config-home resolver** — Bob's `dot-home` descriptor is resolved by the generic
  `dot-home` case already in `runtime-homes.cjs`; the `gsd-tools.cjs` shim resolves the
  `.bob` home generically with **no Bob-specific branch**.

The **only net-new substance module** is `src/bob-adapter.cjs` (the support-roster gate +
idempotent `custom_modes.yaml` merge). Everything else is descriptor + alias data.

## Backend-neutrality guarantee (RUNTIME-04)

The `"bob"` registry entry and `src/bob-adapter.cjs` contain **zero model-backend brand
literals** (no `Claude` / `Gemini` / `Granite` / `GPT`). Bob owns model routing; gsd-bob is
backend-agnostic. This is enforced by `test/backend-neutrality.test.cjs`, which
brace-walks the `"bob"` block out of `capability-registry.cjs` and scans `bob-adapter.cjs`
against a programmatically-built forbidden-token set (stripping comment lines and the
universal `convertClaudeCommandTo<Runtime>` converter-name prefix, which is a source-format
token, not a backend reference).

```
$ node --test test/backend-neutrality.test.cjs
✔ RUNTIME-04: the bob registry entry contains no model-backend brand literal
✔ RUNTIME-04: the bob adapter module (when present) contains no brand literal
✔ RUNTIME-04 self-check: the forbidden-token set is non-empty and built programmatically
```

## The 5-artifact upstream-move inventory

All pointers verified against the current files (gsd-core `1.5.0`). The active runtime
registry object in `capability-registry.cjs` is the second object in the file (the first is
a partial earlier object without `bob`); the live `"bob"` entry is at the lines below.

| # | Artifact | File:line | Role in the move | Net-new? |
|---|----------|-----------|------------------|----------|
| 1 | `"bob"` registry entry | `gsd-core/bin/lib/capability-registry.cjs` **L3045–3109** | The runtime descriptor: `configHome` `dot-home` `.bob` + `BOB_CONFIG_DIR` env (L3053–3059), `artifactLayout` global+local naming the 2 converters (L3061–3098), `commandStyle: slash-hyphen` (L3099) | **YES** (data only) |
| 2 | Command converter | `convertClaudeCommandToBobCommand` — named in registry **L3077 / L3095**; impl in `gsd-core/bin/lib/runtime-artifact-conversion.cjs` **L763** (exported L2016) | Claude command → `.bob/commands/gsd-<x>.md` | No — gsd-core's generic converter, parameterized by the registry entry |
| 3 | Skill converter | `convertClaudeCommandToBobSkill` — named in registry **L3069 / L3087**; impl in `gsd-core/bin/lib/runtime-artifact-conversion.cjs` **L735** (exported L2015) | Claude command → `.bob/skills/gsd-<x>/SKILL.md` (frontmatter reduced to `name` + `description`) | No — gsd-core's generic converter, parameterized by the registry entry |
| 4 | Runtime alias | `gsd-core/bin/shared/runtime-aliases.manifest.json` **L79–82** (`"bob": ["bob", "bob-cli"]`) | CLI flag/alias routing for `--bob` | **YES** (data only) |
| 5 | configHome / shim resolution | `gsd-core/bin/lib/runtime-homes.cjs` generic `dot-home` case **L83–91** (+ `gsd-tools.cjs` shim, which resolves generically — **no bob-specific branch**) | Resolves the `bob` home so `gsd_run query` works under Bob | No — generic resolver already handles `dot-home` descriptors |

**Plus the single net-new substance module:**

| Module | File | Role |
|--------|------|------|
| Bob adapter | `src/bob-adapter.cjs` | The gate (`gateArtifact`) + support-roster builder (`buildSupportRoster`) + idempotent `custom_modes.yaml` merge (`mergeCustomModes`). The one isolated Bob-specific component (D-07). Fails loud: throws on a non-mapping YAML root, rejects null/nameless candidates, never emits an `undefined:` roster line. |

### What a maintainer actually lifts

- **Add to `capability-registry.cjs`:** the `"bob"` entry (artifact #1) — copy the L3045–3109 block.
- **Add to `runtime-aliases.manifest.json`:** the `"bob"` alias (artifact #4) — copy L79–82.
- **No converter changes:** artifacts #2/#3 are gsd-core's existing generic converters; the
  registry entry references them by name. They already exist upstream.
- **No resolver changes:** artifact #5 is the existing generic `dot-home` case; the shim
  resolves the `.bob` home with no new branch.
- **Decide on `bob-adapter.cjs`:** the support-roster gate + `custom_modes.yaml` merge is
  the only new logic. Upstream can vendor it as-is or fold its gate into the generic
  install path; it is self-contained and dependency-light.

Because four of the five inventory items are either pure descriptor data or a reference to
existing generic code, the upstream PR diff is pre-scoped to: one registry block, one alias
block, and one self-contained adapter module — a clean **move**.
