# Upstreaming gsd-bob into gsd-core

> **Audience:** a `@opengsd/gsd-core` maintainer evaluating a PR that adds `bob` as a
> first-class runtime. This document is an **inventory, not a proposal of new architecture**:
> gsd-core is already built to absorb new runtimes. Most of the Bob support is a
> **move** — pure descriptor + alias data. The **only** hand-written logic is a small
> pair of Bob converters (a parameterized rewrite of gsd-core's per-runtime converter
> family) plus one isolated adapter module. Everything below already lives in this repo's
> vendored `gsd-core/` copy — lifting it upstream is mostly mechanical, with the converters
> being the one piece a maintainer would fold into gsd-core's converter family.

**Targeted gsd-core version:** `1.6.1` (from `gsd-core/VERSION`).

## Mostly a move, with two small converters

gsd-core's runtime architecture is data-driven. A runtime is defined by a **registry
entry** (a descriptor) and **aliases**; config-home resolution is handled by a **generic
`dot-home` resolver**. Adding Bob therefore required:

- **One new registry entry** (`"bob"`) describing Bob's surface (`.bob/skills`,
  `.bob/commands`, `slash-hyphen` command style, `BOB_CONFIG_DIR` env override).
- **Two new aliases** — the CLI/flag alias in `runtime-aliases.manifest.json`
  (`"bob": ["bob", "bob-cli"]`) and the name-policy `FALLBACK_ALIASES` entry in
  `runtime-name-policy.cjs` (`bob: ['bob', 'bob-cli']`). Both are pure data.
- **A small pair of Bob converters** — `convertClaudeCommandToBobSkill` and
  `convertClaudeCommandToBobCommand`. These are **not stock upstream**: they are a
  ~105-line local hand-edit vendored into `runtime-artifact-conversion.cjs` (marked in-file
  `gsd-bob HAND-EDIT to this GENERATED file`). They are a **parameterized rewrite** of the
  same shape as gsd-core's existing `convertClaudeCommandTo<Runtime>{Skill,Command}` family
  (reusing its helpers — `yamlQuote`, `extractFrontmatterAndBody`, `extractFrontmatterField`),
  reducing skill frontmatter to Bob's `name` + `description`. A maintainer would fold these
  into gsd-core's per-runtime converter family rather than lift them verbatim.
- **No new config-home resolver** — Bob's `dot-home` descriptor is resolved by the generic
  `dot-home` case already in `runtime-homes.cjs`; the `gsd-tools.cjs` shim resolves the
  `.bob` home generically with **no Bob-specific branch** (grep-confirmed: zero `bob`
  references in the shim).

The **net-new substance** is therefore the two vendored converters plus one isolated
adapter module, `src/bob-adapter.cjs` (the support-roster gate + idempotent
`custom_modes.yaml` merge). Everything else — the registry entry and both aliases — is
descriptor + alias data.

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

## The 6-artifact upstream-move inventory

All pointers **re-verified against the re-vendored 1.6.1 source** (gsd-core `1.6.1`). The
`"bob"` registry entry lives in the active runtime object of `capability-registry.cjs`
(inside `const runtimes`, immediately before the `"claude"` entry); the live `"bob"` entry
is at the lines below.

| # | Artifact | File:line | Role in the move | Net-new? |
|---|----------|-----------|------------------|----------|
| 1 | `"bob"` registry entry | `gsd-core/bin/lib/capability-registry.cjs` **L2876–2940** | The runtime descriptor: `configHome` `dot-home` `.bob` + `BOB_CONFIG_DIR` env (L2884–2888), `artifactLayout` global+local naming the 2 converters (L2892–2929), `commandStyle: slash-hyphen` (L2930) | **YES** (data only) |
| 2 | Command converter | `convertClaudeCommandToBobCommand` — named in registry **L2908 / L2926**; impl in `gsd-core/bin/lib/runtime-artifact-conversion.cjs` **L2427** (exported **L2462**) | Claude command → `.bob/commands/gsd-<x>.md` | **YES** — vendored ~105-line hand-edit (banner L2338), a parameterized rewrite of gsd-core's converter family |
| 3 | Skill converter | `convertClaudeCommandToBobSkill` — named in registry **L2900 / L2918**; impl in `gsd-core/bin/lib/runtime-artifact-conversion.cjs` **L2399** (exported **L2461**) | Claude command → `.bob/skills/gsd-<x>/SKILL.md` (frontmatter reduced to `name` + `description`) | **YES** — vendored ~105-line hand-edit (banner L2338), a parameterized rewrite of gsd-core's converter family |
| 4 | Runtime alias (manifest) | `gsd-core/bin/shared/runtime-aliases.manifest.json` **L79–82** (`"bob": ["bob", "bob-cli"]`) | CLI flag/alias routing for `--bob` | **YES** (data only) |
| 5 | Runtime alias (name-policy) | `gsd-core/bin/lib/runtime-name-policy.cjs` **L41** (`bob: ['bob', 'bob-cli']` in `FALLBACK_ALIASES`) | Name-policy fallback so `--bob` / `bob-cli` normalize to the `bob` runtime | **YES** (data only) |
| 6 | configHome / shim resolution | `gsd-core/bin/lib/runtime-homes.cjs` generic `dot-home` case **L84–92** (+ `gsd-tools.cjs` shim, which resolves generically — **no bob-specific branch**, grep-confirmed 0 refs) | Resolves the `bob` home so `gsd_run query` works under Bob | No — generic resolver already handles `dot-home` descriptors |

**Plus the single net-new substance module:**

| Module | File | Role |
|--------|------|------|
| Bob adapter | `src/bob-adapter.cjs` | The gate (`gateArtifact`) + support-roster builder (`buildSupportRoster`) + idempotent `custom_modes.yaml` merge (`mergeCustomModes`). The one isolated Bob-specific component (D-07). Fails loud: throws on a non-mapping YAML root, rejects null/nameless candidates, never emits an `undefined:` roster line. |

### What a maintainer actually lifts

- **Add to `capability-registry.cjs`:** the `"bob"` entry (artifact #1) — copy the L2876–2940 block.
- **Add to `runtime-aliases.manifest.json`:** the `"bob"` alias (artifact #4) — copy L79–82.
- **Add to `runtime-name-policy.cjs`:** the `bob` `FALLBACK_ALIASES` entry (artifact #5) — copy L41.
- **Fold in the two converters:** artifacts #2/#3 are the one piece of net-new logic —
  a ~105-line hand-edited block (`gsd-bob HAND-EDIT to this GENERATED file`, banner at
  `runtime-artifact-conversion.cjs` L2338) that mirrors gsd-core's existing
  `convertClaudeCommandTo<Runtime>{Skill,Command}` family and reuses its helpers. A maintainer
  would fold this into gsd-core's converter family (parameterizing on the registry entry)
  rather than vendor it verbatim. It is **not** stock upstream — it must be added.
- **No resolver changes:** artifact #6 is the existing generic `dot-home` case; the shim
  resolves the `.bob` home with no new branch.
- **Decide on `bob-adapter.cjs`:** the support-roster gate + `custom_modes.yaml` merge is
  the other new logic. Upstream can vendor it as-is or fold its gate into the generic
  install path; it is self-contained and dependency-light.

Four of the six inventory items are pure descriptor/alias data or a reference to an existing
generic resolver; the net-new logic is the two Bob converters plus the self-contained adapter
module. The upstream PR diff is pre-scoped to: one registry block, two alias entries, one
converter pair folded into the converter family, and one adapter module — a mostly-**move**
change with a small, well-bounded converter rewrite.
