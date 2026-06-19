---
phase: quick-260619-ncs
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/installer/stage.cjs
  - test/installer/staged-shim-loads.test.cjs
autonomous: true
requirements: [INSTALL-03, INSTALL-05]
must_haves:
  truths:
    - "A real install into a fresh scratch dir produces a self-sufficient .bob/ layout"
    - "Running the STAGED shim out of tree (cwd = scratch, not the dev repo) returns JSON with exit code 0"
    - "scripts/fix-slash-commands.cjs is staged under .bob/scripts/ and tracked in the manifest"
    - ".bob/package.json is a minimal synthesized file stamping the vendored gsd-core VERSION (1.5.0), tracked in the manifest"
    - "Update is idempotent and uninstall removes both staged siblings (manifest is sole source of truth, INSTALL-05)"
  artifacts:
    - path: "src/installer/stage.cjs"
      provides: "Staging of the two gsd-core sibling files (scripts/fix-slash-commands.cjs + synthesized package.json) through the existing manifest-tracked stageFile() path"
    - path: "test/installer/staged-shim-loads.test.cjs"
      provides: "Out-of-tree regression test that drives a real install then runs the staged shim from a scratch cwd"
  key_links:
    - from: "src/installer/stage.cjs"
      to: ".bob/scripts/fix-slash-commands.cjs"
      via: "stageFile() copies repoRoot/scripts/fix-slash-commands.cjs verbatim into target/scripts/"
      pattern: "fix-slash-commands"
    - from: "src/installer/stage.cjs"
      to: ".bob/package.json"
      via: "stageFile() writes a synthesized {name, version-from-gsd-core/VERSION} JSON into target/package.json"
      pattern: "gsd-core.*VERSION|package\\.json"
---

<objective>
Fix the gsd-bob installer so the staged `.bob/` layout is self-sufficient: the vendored gsd-core shim must load on a real install, from any cwd, without depending on dev-repo siblings.

The vendored gsd-core eagerly requires two files that resolve to SIBLINGS of `gsd-core/` (three `../` up from `gsd-core/bin/lib/`):
1. `scripts/fix-slash-commands.cjs` — `gsd-core/bin/lib/command-roster.cjs:9` (eager `require`)
2. `package.json` — `gsd-core/bin/lib/runtime-artifact-conversion.cjs:24`, used only at line 367 as `pkg.version` to stamp `version:` into converted-artifact frontmatter

The installer stages `gsd-core/` into `<scope>/.bob/gsd-core/` but does NOT stage these siblings. On a real install, `node .bob/gsd-core/bin/gsd-tools.cjs query <anything>` crashes with `Cannot find module '../../../scripts/fix-slash-commands.cjs'`. The crash chain (verified by reproduction) is: `gsd-tools.cjs` → `loop-resolver.cjs` → `capability-state.cjs` → `surface.cjs` → `runtime-artifact-layout.cjs` → `runtime-artifact-conversion.cjs` → `command-roster.cjs` → the missing sibling. It only worked in the dev repo because the repo root provides both files; the hermetic tests all run from the dev repo root, so none caught it.

Purpose: Restore the core value (a Bob user installs via one command and runs the GSD loop natively) by making the staged payload runnable out of tree. Closes the INSTALL-03 "clean install works end-to-end" gap that the existing suite missed.
Output: Two staged + manifest-tracked siblings under `.bob/`, plus a regression test that runs the staged shim out of tree.

OUT OF SCOPE (do not touch): the two LAZY `../../../bin/install.js` requires (`commands.cjs:371`, `runtime-artifact-layout.cjs:39`) — Claude-runtime-only / guarded; do NOT vendor `bin/install.js`. No runtime/adapter/converter behavior change beyond staging two siblings + tracking them in the manifest. CommonJS `.cjs`, Node built-ins only, no new deps.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md

# The file to modify (the staging engine) — read its stageFile() helper and the
# repoRoot/payload-copy section before editing.
@src/installer/stage.cjs

# The crash sites (vendored gsd-core, DO NOT EDIT) — proof of the eager requires.
@gsd-core/bin/lib/command-roster.cjs

# The installer entry — shows how stage() is invoked with repoRoot and how the
# manifest is read/written/used by uninstall.
@bin/gsd-bob.cjs

# Test conventions to mirror (real-install via child_process, scratch mkdtemp,
# node:test/node:assert, repoRoot helper).
@test/installer/install-clean.test.cjs
@test/_helpers/vendor.cjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Stage the two gsd-core siblings (scripts/fix-slash-commands.cjs + synthesized package.json) through the manifest</name>
  <files>src/installer/stage.cjs</files>
  <read_first>
    - src/installer/stage.cjs — the `stageFile(relPath, bytes)` helper (lines ~157-188) is the ONLY mechanism that writes a tracked file AND records/refreshes its manifest entry through the D-04 collision policy. Both new siblings MUST go through it so they are recorded with sha256 + path exactly like every other staged file. Note `payloadSrc = path.join(repoRoot, 'gsd-core')` (line ~129) and the existing `Structural piece 2` payload copy loop (lines ~213-222) — the siblings are sourced from the SAME `repoRoot`, never cwd/workspaceRoot.
    - gsd-core/bin/lib/command-roster.cjs:9 — the eager `require('../../../scripts/fix-slash-commands.cjs')` that crashes when the sibling is absent.
    - gsd-core/VERSION (single line `1.5.0`, no trailing newline) — the source of the stamped `version:`.
  </read_first>
  <action>
    Add a fourth structural staging step to `stage()` in src/installer/stage.cjs, placed AFTER the `Structural piece 2` vendored-payload copy loop and BEFORE (or alongside) `Structural piece 3` (SUPPORT-ROSTER.md). Both files MUST be staged via the existing `stageFile(relPath, bytes)` helper — do NOT special-case them outside the manifest, do NOT write them with raw `fs.writeFileSync`. This guarantees each is recorded in `manifest.entries` with `{ path, sha256, kind: 'file' }`, participates in the D-04 collision policy (user-edit skip), and is swept on orphan/uninstall.

    Both files are sourced from `repoRoot` (the gsd-bob PACKAGE root already threaded into `stage()`), the SAME root the vendored `gsd-core/` payload is sourced from — NEVER from cwd/workspaceRoot/`process.cwd()`.

    (a) Copy `scripts/fix-slash-commands.cjs` VERBATIM:
        - read bytes from `path.join(repoRoot, 'scripts', 'fix-slash-commands.cjs')`
        - stage to relative path `path.join('scripts', 'fix-slash-commands.cjs')` (lands at `<target>/scripts/fix-slash-commands.cjs`)
        - pass the read Buffer straight to `stageFile` (verbatim copy, byte-for-byte).

    (b) Write a MINIMAL synthesized `<target>/package.json`:
        - read the vendored payload version from `path.join(repoRoot, 'gsd-core', 'VERSION')` and trim it (the file is the single token `1.5.0` with no trailing newline; apply `.trim()` defensively).
        - build the object `{ name: '@opengsd/gsd-core', version: <trimmed VERSION> }` and serialize with `JSON.stringify(obj, null, 2)` (deterministic bytes). Stamp ONLY name + version — this is the file `runtime-artifact-conversion.cjs` reads as `pkg.version` to write `version:` into converted-artifact frontmatter, so it must reflect the VENDORED payload (1.5.0), NOT gsd-bob's own `0.1.0`.
        - DO NOT copy gsd-bob's own `package.json`. DO NOT read or reference `repoRoot/package.json`.
        - stage to relative path `'package.json'` (lands at `<target>/package.json`) via `stageFile`.

    Reachability note: the version string is sourced from `gsd-core/VERSION`, which exists in the vendored payload (confirmed present). If you prefer to avoid a second file read, the VERSION file is the canonical source — do not hardcode `1.5.0`.

    Guard each source read consistent with the existing fail-loud style: the payload-source existence is already asserted at the top of `stage()` (`payloadSrc` check). `gsd-core/VERSION` and `scripts/fix-slash-commands.cjs` are part of the same vendored package, so a plain read is acceptable; if either is genuinely absent the read throws loud (acceptable — a broken package must not silently stage an unrunnable shim).
  </action>
  <verify>
    <automated>cd /Users/zackmaz/Documents/Claude/Projects/open-gsd-bob && npm test 2>&1 | grep -E "^. (tests|pass|fail)" </automated>
  </verify>
  <acceptance_criteria>
    - `<target>/scripts/fix-slash-commands.cjs` exists after a stage() run and is byte-identical to `repoRoot/scripts/fix-slash-commands.cjs`.
    - `<target>/package.json` exists, parses as JSON, equals `{"name":"@opengsd/gsd-core","version":"1.5.0"}` (version from gsd-core/VERSION), and is NOT a copy of gsd-bob's own package.json (version is 1.5.0, not 0.1.0).
    - Both files appear as `kind: 'file'` entries in `manifest.entries` with a sha256, recorded via stageFile (not special-cased).
    - All 188 existing tests still pass (no regression in stage.test.cjs, install-clean.test.cjs, idempotent-update.test.cjs, uninstall.test.cjs).
  </acceptance_criteria>
  <done>stage() emits and manifest-tracks both gsd-core siblings under .bob/, sourced from repoRoot; existing suite stays fully green.</done>
</task>

<task type="auto">
  <name>Task 2: Regression test — drive a real install, run the STAGED shim out of tree, assert JSON exit 0 + manifest tracking</name>
  <files>test/installer/staged-shim-loads.test.cjs</files>
  <read_first>
    - test/installer/install-clean.test.cjs — mirror its shape EXACTLY: `const { repoRoot } = require('../_helpers/vendor.cjs')`, `ENTRY = path.join(repoRoot, 'bin', 'gsd-bob.cjs')`, a `scratch(prefix)` helper using `fs.mkdtempSync(path.join(os.tmpdir(), ...))`, and a `runEntry(args, cwd)` that calls `execFileSync(process.execPath, [ENTRY, ...args], { cwd, encoding: 'utf8' })`. Use `--bob --global -c <target>` to install into an explicit scratch `.bob` target while cwd is a distinct scratch workspace.
    - test/_helpers/vendor.cjs — `repoRoot` is the gsd-bob package root (two levels up from test/_helpers/). This is the ONLY allowed reference to the dev repo; the STAGED-shim invocation must NOT see dev-repo siblings.
  </read_first>
  <action>
    Create `test/installer/staged-shim-loads.test.cjs` using `node:test` + `node:assert/strict`, CommonJS `.cjs`, mirroring install-clean.test.cjs conventions. This is the crux: the existing suite missed the bug because every case runs from the dev repo root where `scripts/` and `package.json` happen to exist. This test must isolate the staged shim from the dev repo.

    Test body:
    1. Create a fresh scratch target `const target = path.join(scratch('tgt'), '.bob')` and a DISTINCT scratch workspace `const cwd = scratch('ws')` (no .planning/ needed — the KNOWN-LIMITATION path is fine).
    2. Drive a REAL install via the entry: `runEntry(['--bob', '--global', '-c', target], cwd)`. (Using `--global -c <target>` mirrors install-clean.test.cjs and avoids writing into the dev repo.)
    3. Assert the two siblings were staged:
       - `fs.existsSync(path.join(target, 'scripts', 'fix-slash-commands.cjs'))` is true.
       - `fs.existsSync(path.join(target, 'package.json'))` is true; parse it and assert `name === '@opengsd/gsd-core'` and `version === '1.5.0'`.
    4. Assert BOTH appear in the written manifest: read `path.join(target, '.gsd-bob-manifest.json')`, JSON.parse, and assert `entries` contains an entry with `path === path.join('scripts', 'fix-slash-commands.cjs')` and one with `path === 'package.json'`, each `kind === 'file'` with a 64-hex sha256.
    5. THE OUT-OF-TREE LOAD (the regression): run the STAGED shim via child_process with `cwd` set to the SCRATCH target's parent (or the scratch workspace) — anywhere that is NOT the dev repo and whose ancestor chain contains NO `scripts/fix-slash-commands.cjs` or `package.json` other than the ones the installer placed under `.bob/`:
       - `const res = spawnSync(process.execPath, [path.join(target, 'gsd-core', 'bin', 'gsd-tools.cjs'), 'query', 'state.load'], { cwd: <scratch dir>, encoding: 'utf8' })` (require `spawnSync` from `node:child_process`).
       - assert `res.status === 0` (include `res.stderr` in the assertion message so a regression prints the `Cannot find module` chain).
       - assert `res.stdout` is non-empty and `JSON.parse(res.stdout)` succeeds (it returns the state/config JSON; do not assert specific keys beyond it being a parseable object).
       - IMPORTANT: pick the `cwd` so the ONLY `scripts/` + `package.json` visible to the staged shim are the staged ones. The scratch target dir (`path.dirname(target)`) is a clean mkdtemp dir with no siblings — use it as the shim cwd, or the scratch workspace `cwd`. Do NOT run with `cwd` = repoRoot.

    Do NOT mock the shim, do NOT stub the requires, do NOT add the siblings by hand in the test — the installer (Task 1) must place them. The test fails RED against the pre-Task-1 installer (Cannot find module) and passes GREEN after.
  </action>
  <verify>
    <automated>cd /Users/zackmaz/Documents/Claude/Projects/open-gsd-bob && node --test test/installer/staged-shim-loads.test.cjs 2>&1 | grep -E "^. (tests|pass|fail)" </automated>
  </verify>
  <acceptance_criteria>
    - `node --test test/installer/staged-shim-loads.test.cjs` passes.
    - The test drives the real entry `bin/gsd-bob.cjs` via execFileSync into a fresh mkdtemp scratch `.bob` target (no hand-placed siblings).
    - The staged shim is invoked OUT OF TREE (cwd is a scratch dir, never repoRoot) and returns exit 0 with stdout that `JSON.parse` accepts.
    - The test asserts both `<target>/scripts/fix-slash-commands.cjs` and `<target>/package.json` exist AND appear as `kind:'file'` entries in the written `.gsd-bob-manifest.json`.
    - The test would FAIL (Cannot find module) if Task 1 were reverted (proves it guards the real bug).
  </acceptance_criteria>
  <done>A new out-of-tree regression test drives a real install and proves the staged shim loads + both siblings are manifest-tracked; full `npm test` is green.</done>
</task>

</tasks>

<verification>
- `npm test` is fully green: 188 existing tests + the new staged-shim-loads test all pass, zero failures.
- Manual on-device check: install into a tmpdir and run the staged shim out of tree:
  ```
  TMP=$(mktemp -d)
  node bin/gsd-bob.cjs --bob --global -c "$TMP/.bob"
  (cd "$TMP" && node "$TMP/.bob/gsd-core/bin/gsd-tools.cjs" query state.load)
  # expected: JSON on stdout, exit code 0 (NOT "Cannot find module")
  rm -rf "$TMP"
  ```
- `<TMP>/.bob/scripts/fix-slash-commands.cjs` and `<TMP>/.bob/package.json` exist, and both appear as `file` entries in `<TMP>/.bob/.gsd-bob-manifest.json`.
- `<TMP>/.bob/package.json` stamps version `1.5.0` (vendored gsd-core), not `0.1.0` (gsd-bob).
- No edits to vendored `gsd-core/` files; `bin/install.js` is NOT vendored; the two lazy `bin/install.js` requires are untouched.
</verification>

<success_criteria>
A real `gsd-bob --bob` install produces a self-sufficient `.bob/` layout whose vendored gsd-core shim loads from any cwd: `node <scope>/.bob/gsd-core/bin/gsd-tools.cjs query state.load` returns JSON with exit 0. Both staged siblings are tracked in the manifest so update is idempotent and uninstall removes them (INSTALL-05). A regression test runs the staged shim out of tree so this gap can never silently reappear.
</success_criteria>

<output>
Create `.planning/quick/260619-ncs-fix-gsd-bob-installer-to-stage-gsd-core-/260619-ncs-SUMMARY.md` when done.
</output>
