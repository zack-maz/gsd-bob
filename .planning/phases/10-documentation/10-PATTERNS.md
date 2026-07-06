# Phase 10: Documentation - Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 6 (1 modify, 5 create — one optional)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `README.md` (MODIFY) | doc | transform (roster→prose) | `README.md` itself (§Supported skills L53-90) | exact (self) |
| `COMMANDS.md` (CREATE) | doc | transform (frontmatter→reference) | `SUPPORT-ROSTER.md` + `commands/gsd/*.md` frontmatter | role-match |
| `ARCHITECTURE.md` (CREATE) | doc | request-response (maintainer narrative) | `UPSTREAM.md` | exact (role) |
| `MAINTAINING.md` (CREATE) | doc | batch (numbered runbook) | `07-REVENDOR-NOTES.md` L284-296 (runbook seed) | exact (purpose-built) |
| `test/docs-conformance.test.cjs` (CREATE) | test | transform (parse+set-equality) | `test/command-expansion.test.cjs` Group D (L225-244) | exact |
| `scripts/generate-command-reference.cjs` (OPTIONAL CREATE) | script | transform (dir→markdown) | `scripts/generate-support-roster.cjs` | exact |

## Pattern Assignments

### `test/docs-conformance.test.cjs` (test, transform) — HIGHEST VALUE

**Analog:** `test/command-expansion.test.cjs` (esp. Group D roster parser, L225-244)

**Imports + repoRoot convention** (command-expansion.test.cjs L40-59). Copy this header block verbatim; the doc test needs `fs`, `path`, `repoRoot`, and the directory-derived stem spine:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');   // repoRoot = two levels up from test/_helpers/ (vendor.cjs L18)

// The drift-proof spine: enumerate stems from the directory, NEVER a hardcoded 28-name list.
const cmdSrcDir = path.join(repoRoot, 'commands', 'gsd');
const stems = fs
  .readdirSync(cmdSrcDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => path.basename(f, '.md'));
```
Note: the doc test does NOT need `requireVendor`/`stage`/`newReport`/`manifest` (those are for emission harnesses). Drop them — it only reads markdown files.

**Roster Supported-section slice** (command-expansion.test.cjs L226-234) — reuse near-verbatim; this is the load-bearing parser that prevents an Unsupported-reason stem from falsely satisfying an assertion:
```js
const roster = fs.readFileSync(path.join(repoRoot, 'SUPPORT-ROSTER.md'), 'utf8');
const supHeadingIdx = roster.search(/^##\s+Supported\b/m);
assert.ok(supHeadingIdx >= 0, 'SUPPORT-ROSTER.md has a Supported section');
const afterSup = roster.slice(supHeadingIdx);
const nextHeadingIdx = afterSup.slice(1).search(/^##\s+/m);
const supportedSection = nextHeadingIdx >= 0 ? afterSup.slice(0, nextHeadingIdx + 1) : afterSup;
```
The analog asserts per-stem with a regex (L236-243). The doc test should instead build a `Set` from the roster (`/^-\s+(gsd-[a-z0-9-]+)\s*$/gm`) and use `assert.deepEqual([...set].sort(), ...)` for README/COMMANDS set-equality (research §3 recommends this — RESEARCH.md L264-266).

**Single-pinned-literal discipline** (command-expansion.test.cjs L219-220) — the ONLY hardcoded `28` lives in one guard; every other count derives from `stems.length`:
```js
assert.equal(stems.length, 28, 'CMD-01: commands/gsd/ holds exactly 28 sources');
```
Carry this exact discipline: derive `rosterSupported`, `readmeSet`, `commandsSet` all from parsing; assert set-equality against the directory-derived `stems.map((s) => 'gsd-'+s)`.

**Three assertions to implement** (RESEARCH.md §3 L137-139): (1) roster Supported set == `commands/gsd` stem set; (2) README supported-section token set == roster Supported set (scope README extraction to `## Supported skills`→next `##` heading using the SAME slice idiom, so `## Flagged gaps` mentions of `gsd-autonomous`/`gsd-parallel-fanout` don't leak — Pitfall 5); (3) `COMMANDS.md` `gsd-[a-z0-9-]+` token set == roster Supported set (no missing, no extra).

**Cleanup convention:** the doc test reads only committed files — no `mkdtempSync`/`test.after` scratch cleanup needed (unlike command-expansion.test.cjs L74-85). Slotted into `test/**/*.test.cjs` glob, picked up by `npm test` automatically (package.json L23) — no harness change.

---

### `scripts/generate-command-reference.cjs` (script, transform) — OPTIONAL (D-02 permits authored-then-guarded)

**Analog:** `scripts/generate-support-roster.cjs`

**Directory-derived candidate enumeration** (generate-support-roster.cjs L32-38) — the exact enumerate-stems idiom to reuse:
```js
const commandsDir = path.join(__dirname, '..', 'commands', 'gsd');
const derived = fs.existsSync(commandsDir)
  ? fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'))
      .map((f) => ({ name: `gsd-${path.basename(f, '.md')}`, stem: path.basename(f, '.md') }))
  : [];
```

**Frontmatter `description:` extraction** (RESEARCH.md §Code-Examples L250-254) — the blurb source (single unquoted line, present for all 28, VERIFIED):
```js
const src = fs.readFileSync(path.join(commandsDir, `${stem}.md`), 'utf8');
const fmEnd = src.indexOf('---', 3);           // same fm-slice idiom as command-expansion.test.cjs L122-123
const fm = src.substring(3, fmEnd);
const desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim();
// emitted name is always `gsd-${stem}` — ignore the source's colon `name: gsd:<stem>` field
```

**"GENERATED — do not hand-edit" banner + fixed-path write** (generate-support-roster.cjs L62-64, L99-101) — copy the banner header shape and the `repoRoot`-relative write (never interpolate a stem into a write path — Security §Path-traversal):
```js
const header = `# Bob Command Reference

> **GENERATED — do not hand-edit.** Regenerate with \`node scripts/generate-command-reference.cjs\`.
`;
const outPath = path.join(__dirname, '..', 'COMMANDS.md');
fs.writeFileSync(outPath, `${header}${body}`);
```
Note (D-07 / RESEARCH.md §6 L213): `scripts/` IS allowlisted so this generator ships in the tarball (harmless, matches `generate-support-roster.cjs`); the generated `COMMANDS.md` at repo root still won't ship (root `.md` not in `files`).

---

### `README.md` (doc, transform — MODIFY in place)

**Analog:** `README.md` itself — the existing `## Supported skills` section (L53-90) is the structure to EXTEND, not rewrite (D-04).

**Current supported-list shape** (README.md L61-70) — the backticked-bullet token form the conformance test regex (`gsd-[a-z0-9-]+`) extracts cleanly; keep this exact token style when growing 10→28, grouped by cluster:
```markdown
- `gsd-new-project`
- `gsd-discuss-phase`
...
```
**Keep intact** (do NOT rewrite): Install (L10-17), Scope (L19-33), Modes (L34-51), Flagged gaps (L76-90, already names the 2 Unsupported — Pitfall 5 relies on this staying in its own `## Flagged gaps` section), Verification posture (L98-114). **Grow** the Supported list to 28 grouped by cluster (core loop, quality gates, milestone lifecycle, planning aids, context & maintenance). **Add** to the Documentation section (L116-122) links to the three new docs. The roster-sourced framing prose already exists (L55-59) — extend it.

---

### `COMMANDS.md` (doc, transform — CREATE)

**Analogs:** `SUPPORT-ROSTER.md` (generated-artifact tone) + `commands/gsd/*.md` frontmatter (blurb source) + `UPSTREAM.md` (maintainer-doc register).

Per-command entry = `gsd-<stem>` heading/row + the frontmatter `description:` one-liner (extraction idiom above). Must cover EXACTLY the 28 roster Supported entries (guarded by conformance-test assertion 3). If authored (not generated), scope any Unsupported mention to a separate section so the token-extraction assertion stays clean. Table form (stem → `gsd-<stem>` → description) reads cleanest for a maintainer per RESEARCH.md §2 L112.

---

### `ARCHITECTURE.md` (doc, request-response — CREATE)

**Analog:** `UPSTREAM.md` — the audience blockquote + "inventory, not a proposal" register (UPSTREAM.md L3-10) and the file:line-anchored table (L67-74) are the tone/structure to mirror.

Four axes, each anchored to LIVE code (RESEARCH.md §4 L149-169):
1. **Converter/descriptor model** — `src/installer/stage.cjs` convertible loop (L252-295), the two vendored converters `gsd-core/bin/lib/runtime-artifact-conversion.cjs` (`convertClaudeCommandToBobCommand` L2427, `convertClaudeCommandToBobSkill` L2399), `"bob"` registry entry `capability-registry.cjs` L2876-2940. Use UPSTREAM.md L1-42 "move, not rewrite" framing.
2. **Capability-map gate** — `src/bob-adapter.cjs` `gateArtifact` (L325-345) / `buildSupportRoster` (L356-371), `BOB_CAPABILITY_DECL` conservative lower bound (`stage.cjs` L42), `PRIMITIVE_REASONS` (L308-313).
3. **Backend-neutrality** — `src/bob-adapter.cjs` `neutralizeModelReferences` (L103-112), `scanModelLiterals` (L132-147), NEUTRAL-03 invariant in `test/model-neutrality.test.cjs` (open the file before citing a specific assertion — Assumption A1; `test/backend-neutrality.test.cjs` also exists).
4. **`.planning/` interchange** — RUNTIME-03 byte-compat (`test/planning-bytecompat.test.cjs`, `test/core-loop-equivalence.test.cjs`), `.planning/` never pruned (`stage.cjs` L305-308).

**LANDMINE (Pitfall 2):** MUST NOT link a live `.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` — it was deleted (commit `459d992`). Anchor the gate section on live `src/bob-adapter.cjs`; for a verbatim quote only, use `git show 459d992~1:.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` labeled as git-recovered history.

---

### `MAINTAINING.md` (doc, batch runbook — CREATE)

**Analog:** `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` (23KB raw log) — the "Runbook seed" at L284-296 is a purpose-written 8-step recipe to distill (D-06). Mirror `UPSTREAM.md`'s numbered/imperative maintainer register but as a CHECKLIST, not a retrospective.

8 ordered steps (RESEARCH.md §5 L176-185), keep `<old>`/`<new>` placeholders replayable:
1. Capture provenance (git HEAD SHA, current `gsd-core/VERSION`, target) + record `npm test` baseline.
2. `npm pack @opengsd/gsd-core@<new>` → tmp, `tar -xzf`, confirm `package/gsd-core/{bin,contexts,references,templates,workflows}` (tarball ships NO `VERSION`).
3. `rm -rf gsd-core/{bin,contexts,references,templates,workflows}`.
4. `cp -R` the 5 subdirs from the extracted tarball.
5. `node scripts/apply-bob-patches.cjs` (re-injects 6 deltas — `apply-bob-patches.cjs` L17-24), prove idempotency (run 2nd time = no-op, `git diff --quiet gsd-core/`).
6. Re-sync drifted `commands/gsd/*.md` to target (Phase 9 lesson).
7. `node scripts/generate-support-roster.cjs`.
8. Run invariants first, then `npm test`, subtract baseline, classify drift, bump `gsd-core/VERSION`, update `UPSTREAM.md` version + re-verify its 6 file:line pointers.

**MUST include the four real caveats (Pitfall 4, RESEARCH.md L197-203):** 3 pre-existing baseline failures are environmental noise (subtract, never "fix"); stock `legacy-cleanup.cjs:225` `1.5.0` comment is a permanent expected exception (grep-exclude it); `npm pack` needs network; converters are LOCAL hand-edits (re-injection contract, not upstream existence); guaranteed golden drift is `test/installer/staged-shim-loads.test.cjs` (regenerate w/ justification).

## Shared Patterns

### Directory-derived, never hardcoded (drift-proof spine)
**Source:** `test/command-expansion.test.cjs` L55-59; `scripts/generate-support-roster.cjs` L32-38
**Apply to:** the conformance test, the optional generator
Enumerate `commands/gsd/*.md` stems at runtime; single pinned literal `28` in exactly one guard; every other count/list derives from `stems.length`.

### repoRoot resolution (never raw process.cwd())
**Source:** `test/_helpers/vendor.cjs` L18 (`repoRoot` = two levels up from `test/_helpers/`); scripts use `path.join(__dirname, '..', …)`
**Apply to:** the conformance test (`require('./_helpers/vendor.cjs')`), the generator (`path.join(__dirname, '..', 'COMMANDS.md')`)

### GENERATED — do not hand-edit banner
**Source:** `scripts/generate-support-roster.cjs` L62-64, L99-101; `SUPPORT-ROSTER.md` head
**Apply to:** any generated doc (`COMMANDS.md` if generator route). Fixed `repoRoot`-relative write path, never a stem-interpolated path.

### node:test + node:assert/strict hermetic idiom
**Source:** `test/command-expansion.test.cjs` L40-41
**Apply to:** `test/docs-conformance.test.cjs` — reads committed files only, no scratch tmpdir/cleanup needed.

### Section-slice extraction (heading → next `##`)
**Source:** `test/command-expansion.test.cjs` L228-234
**Apply to:** BOTH roster parsing AND README/COMMANDS supported-token scoping — the shared guard against Flagged-gaps leakage (Pitfall 5).

## No Analog Found

None. Every file has a strong in-repo analog. `commit_docs:false` means only `.planning/` docs skip auto-commit — the four deliverable docs + the test are source files committed via normal execution commits (Pitfall 6).

## Metadata

**Analog search scope:** `test/`, `scripts/`, repo root (`README.md`, `UPSTREAM.md`, `SUPPORT-ROSTER.md`), `.planning/phases/07-*`
**Files scanned:** command-expansion.test.cjs, generate-support-roster.cjs, README.md, UPSTREAM.md, vendor.cjs, SUPPORT-ROSTER.md (tail), 07-REVENDOR-NOTES.md (metadata)
**Pattern extraction date:** 2026-07-04
