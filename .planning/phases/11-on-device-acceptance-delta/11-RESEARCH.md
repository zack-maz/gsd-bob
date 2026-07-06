# Phase 11: On-Device Acceptance Delta - Research

**Researched:** 2026-07-04
**Domain:** Markdown-artifact authoring + hermetic `node:test` doc-parsing guards (no runtime code, no external packages)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Grounding facts (F-01..F-05):**
- **F-01** — `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` already exists (added in Phase 8) and already IS the device-runnable ACCEPT-02 step. Its `gsd-*` glob already covers the 18 new commands. The job is to make ACCEPT-02 *provably discharged*, not to add a duplicate grep. [VERIFIED: read `.planning/ACCEPTANCE-CHECKLIST.md` lines 267-272]
- **F-02** — The frozen range is exactly `AC-01..AC-26`; `AC-27` is a v2.0 (Phase 8) addition **outside** the frozen range, so its `Confirms:` line may be amended. [VERIFIED: ROADMAP §Phase 11 SC#3 + checklist line 267]
- **F-03** — The 18 new commands have NO functional AC step, and functional runs would violate T-01-SC (several mutate irreversibly / open PRs). On-device risk for these is "does Bob emit + recognize + is it neutral," not "does the workflow logic run." [VERIFIED]
- **F-04** — `test/acceptance-coverage.test.cjs` is the hermetic anti-drift coverage proof; it already admits `ACCEPT-01`/`ACCEPT-02` as declared v2.0 IDs. Mirror its derive-never-freeze discipline; compose with it. [VERIFIED: read test + REQUIREMENTS.md]
- **F-05** — The 28-command Supported set is generated into `SUPPORT-ROSTER.md` from `commands/gsd/*.md`. All 18 targets present. This is the drift-proof source for the delta-set. [VERIFIED: `ls commands/gsd/` = 28 files; roster Supported = 28 bullets]

**Decisions (D-01..D-07):**
- **D-01** — Append one AC step per new command (`AC-28..AC-45`, 18 steps), each a READ-ONLY emission + Bob-recognition check following the `AC-07`/`AC-08` pattern (`ls`/`cat .bob/commands/gsd-<name>.md`, confirm frontmatter, observe in Bob palette) — NOT a functional invocation. (Planner may weigh a single consolidated `AC-28` that `ls`-enumerates all 18; per-command is preferred for traceability fidelity.)
- **D-02** — Each new step's `Confirms:` line references `ACCEPT-01` (optionally `CMD-01`).
- **D-03** — Discharge ACCEPT-02 via the EXISTING `AC-27`; do NOT add a duplicate grep. Add `ACCEPT-02` to AC-27's `Confirms:` line (AC-27 is outside the frozen range). (Alternative: a thin cross-referencing `AC-46`.)
- **D-04** — Add a hermetic anchor/diff test asserting `AC-01..AC-26` step blocks are byte-unchanged against a committed snapshot fixture. Freeze scoped to the AC step blocks, not the whole file (roll-up table / Execution Order / How-to-Run may gain rows/notes).
- **D-05** — Add a presence/traceability test asserting every delta-command has a corresponding new AC step, deriving the delta-set drift-proof (not a frozen literal). Compose with, do not fork, the existing coverage suite.
- **D-06** — New steps are `AC-28..AC-45`, appended AFTER `AC-27`; extend the Results Roll-Up table and add a one-line note to Execution Order / How-to-Run (all outside the frozen step blocks).
- **D-07** — Every new `Cmd:` line is read-only (`ls`/`cat`/`grep`/`echo`), never a functional `/gsd-*` invocation. Misses log to the existing `.planning/ACCEPTANCE-FOLLOWUPS.md`.

### Claude's Discretion
All areas delegated (`--auto`). Refinable *how* (as long as D-01..D-07 hold): per-command vs consolidated step form (D-01), amend-AC-27 vs thin-append-AC-46 (D-03), snapshot-fixture vs embedded-hash for the freeze (D-04), exact drift-proof derivation of the delta-set (D-05). Research explicitly invited to pressure-test (a) AC-27 glob coverage of all 18, and (b) the emission-recognition-not-functional-run call — both discharged below.

### Deferred Ideas (OUT OF SCOPE)
- On-device acceptance for deferred long-tail commands (`transition`/LIFE-01, `ai-integration-phase`/SHAPE-01, autonomy cluster/AUTO-01, ~70-skill parity/PARITY-01) — not emitted → no AC step.
- Functional on-device runs of the 18 new commands (unattended-safety / T-01-SC).
- Install-time prose-neutralization of the raw `.bob/gsd-core/**` payload (carried from Phase 8; AC-27 scopes to the *converted* set by design).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACCEPT-01 | The on-device acceptance checklist gains device-runnable steps (exact commands + expected outputs) for the newly added commands | 18 command names verified present in `commands/gsd/` and in `SUPPORT-ROSTER.md` Supported (§Standard Stack). `AC-07`/`AC-08` read-only emission-recognition template documented (§Code Examples). Drift-proof delta-set derivation from the roster documented (§Architecture Patterns). Traceability test harness idiom documented (§Code Examples). |
| ACCEPT-02 | The checklist gains a device-runnable model-neutrality verification step (the NEUTRAL-03 invariant, runnable against a real Bob install) | AC-27 verified to already be that step; its `gsd-*` glob verified to cover all 18 (§Pressure-Tests A). Recommended discharge = amend AC-27 `Confirms:` (exact current line quoted, §Code Examples). |
</phase_requirements>

## Summary

Phase 11 is a **checklist-and-tests-only** phase — zero runtime code, zero external packages. The work is three moves against `.planning/ACCEPTANCE-CHECKLIST.md`: (1) append 18 read-only emission-recognition AC steps (`AC-28..AC-45`) for the newly added Phase 9 commands; (2) make ACCEPT-02 provably discharged by adding `ACCEPT-02` to the already-present `AC-27` `Confirms:` line (no duplicate grep); (3) lock the `AC-01..AC-26` freeze with a new hermetic anchor/diff test against a committed snapshot fixture. Two new `node:test` files back this: a presence/traceability guard (ACCEPT-01, SC#1) and an insert-only freeze guard (SC#3). The existing `test/acceptance-coverage.test.cjs` and `test/model-neutrality.test.cjs` stay green and must not be forked.

Every fact the CONTEXT relied on was verified against the live repo. The two open questions the CONTEXT flagged are **both resolved in favor of the locked decisions**: (A) AC-27's `gsd-*` glob genuinely covers all 18 new commands with zero scope gap — all 18 are in the Supported roster, so all 18 emit as `.bob/commands/gsd-<name>.md`, which `gsd-*.md` matches; (B) read-only emission-recognition is the correct, safe form — the 18 include irreversibly-mutating / PR-opening commands (`complete-milestone`, `new-milestone`, `ship`), a functional run of which would violate the T-01-SC read-only-by-default safety invariant, and the workflow logic is already exercised on-device by the core-loop steps `AC-17..AC-21`.

**Primary recommendation:** Author `AC-28..AC-45` (one read-only `ls`/`cat` emission-recognition step per command, `Confirms: ACCEPT-01`), amend AC-27's `Confirms:` to add `ACCEPT-02`, extend the Results Roll-Up + Execution Order prose (outside the frozen slice), and add two hermetic `node:test` guards: a roster-derived traceability test and a snapshot-fixture insert-only freeze test. Slice the freeze between the exact header anchors `## AC-01 — Subagent isolation` (inclusive) and `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` (exclusive).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Device-runnable AC steps for 18 new commands | `.planning/ACCEPTANCE-CHECKLIST.md` (authoring) | — | The checklist is the single root-anchored device-runnable artifact; steps are prose, not code |
| ACCEPT-02 model-neutrality on-device step | `.planning/ACCEPTANCE-CHECKLIST.md` AC-27 (already exists) | — | AC-27 already is the NEUTRAL-03 device-runnable grep; only a `Confirms:` token is added |
| ACCEPT-01 presence/traceability proof | `test/*.test.cjs` (hermetic `node:test`) | `SUPPORT-ROSTER.md` (source of truth) | Derives the command set from the generated roster at run time; no live Bob |
| SC#3 insert-only freeze proof | `test/*.test.cjs` + `test/fixtures/` snapshot | `.planning/ACCEPTANCE-CHECKLIST.md` (sliced) | Byte-diff of a header-anchored slice against a committed fixture |
| Wrong-assumption capture (on-device miss) | `.planning/ACCEPTANCE-FOLLOWUPS.md` (existing) | — | Reuse; D-07 adds no new follow-up machinery |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | Node `>=22.15.0` builtin | Test runner for both new guards | Every existing `test/*.test.cjs` uses it; `package.json` runs `node --test "test/**/*.test.cjs"` [VERIFIED: package.json] |
| `node:assert/strict` | builtin | Assertions | Repo convention across all test files [VERIFIED: read `acceptance-coverage.test.cjs`, `roster-capmap.test.cjs`] |
| `node:fs` / `node:path` | builtin | Read checklist / roster / fixture | Repo convention; dependency-free per CLAUDE.md [VERIFIED] |
| `./_helpers/vendor.cjs` (`repoRoot`) | local | Absolute-path resolution to repo root | Every test imports `{ repoRoot }` from here; `repoRoot = path.resolve(__dirname, '..', '..')` [VERIFIED: read `test/_helpers/vendor.cjs`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | This phase adds **no** packages. It authors markdown + two builtin-only test files. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Committed snapshot fixture (D-04) | Git `HEAD` diff of the checklist | HEAD-diff is non-hermetic and breaks the moment this phase commits (the slice changes as rows are appended elsewhere is fine, but the *fixture* must be immutable). A committed fixture stays deterministic forever. **Use the fixture.** |
| Committed snapshot fixture | Embedded expected SHA-256 hash | A hash is terser but yields an opaque failure ("hash mismatch") with no diff. A fixture gives a readable `assert.equal` diff on failure. **Prefer the fixture; hash is acceptable if terseness is valued.** |
| Separate new test file (D-05) | Editing `acceptance-coverage.test.cjs` in place | CONTEXT says "compose with, do not fork." A new file keeps the existing suite byte-stable and green, matches the one-concern-per-file convention in `test/`. **Use a new file.** |

**Installation:**
```bash
# None. Zero new dependencies. Tests run via the existing script:
npm test          # → node --test "test/**/*.test.cjs"
node --test test/acceptance-delta-coverage.test.cjs   # single new file
```

**Version verification:** No external packages installed → Package Legitimacy Audit is N/A (see below). Node floor `>=22.15.0` already the project engines floor [VERIFIED: CLAUDE.md].

## Package Legitimacy Audit

> Not applicable. This phase installs **zero external packages** — it authors markdown checklist steps and two builtin-only (`node:test`/`node:assert`/`node:fs`/`node:path`) test files. No registry lookup required.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                        SOURCE OF TRUTH (generated, drift-proof)
                        commands/gsd/*.md  ──►  scripts/generate-support-roster.cjs
                                                        │
                                                        ▼
                                            SUPPORT-ROSTER.md  (28 Supported: gsd-<name>)
                                                        │
             ┌──────────────────────────────────────────┼───────────────────────────────┐
             │ (authoring input)                         │ (test derives set at run time) │
             ▼                                            ▼                                │
   .planning/ACCEPTANCE-CHECKLIST.md          test/acceptance-delta-coverage.test.cjs      │
   ├─ AC-01..AC-26  (FROZEN slice)  ◄───────────┐  parse roster → for each gsd-<name>,     │
   ├─ AC-27  (+ ACCEPT-02 on Confirms)          │  assert ≥1 AC Cmd references             │
   ├─ AC-28..AC-45 (NEW: read-only              │  ".bob/commands/gsd-<name>.md"           │
   │   ls/cat emission-recognition,             │  + assert ACCEPT-01 & ACCEPT-02          │
   │   Confirms: ACCEPT-01)                      │  each referenced by ≥1 Confirms line     │
   ├─ Results Roll-Up (+ AC-28..AC-45 rows)      │                                          │
   └─ Execution Order / How-to-Run (+ note)      │                                          │
             │                                    │                                          │
             │ (frozen slice, header-anchored)    │                                          │
             ▼                                    ▼                                          │
   test/fixtures/acceptance/frozen-ac01-26.md ◄─ test/acceptance-insert-only.test.cjs        │
   (committed snapshot)                          slice live checklist between                 │
                                                 "## AC-01 — Subagent isolation" (incl.)      │
                                                 and "## AC-27 — …" (excl.); byte-equal? ─────┘

   KEPT GREEN (unchanged, must not regress):
     test/acceptance-coverage.test.cjs   (no-orphan-SC / no-orphan-AC / no-phantom-ref)
     test/model-neutrality.test.cjs      (hermetic NEUTRAL-03; AC-27 is its on-device twin)
```

### Recommended Project Structure
```
.planning/
├── ACCEPTANCE-CHECKLIST.md        # EDIT: append AC-28..AC-45; roll-up rows; AC-27 Confirms +ACCEPT-02
└── ACCEPTANCE-FOLLOWUPS.md        # reuse (no change) — existing wrong-assumption log
test/
├── acceptance-delta-coverage.test.cjs   # NEW: ACCEPT-01 presence/traceability (D-05)
├── acceptance-insert-only.test.cjs      # NEW: SC#3 freeze anchor/diff (D-04)
├── acceptance-coverage.test.cjs         # UNCHANGED: stays green
└── fixtures/
    └── acceptance/
        └── frozen-ac01-26.md            # NEW: committed snapshot of the frozen slice
```

### Pattern 1: Derive-never-freeze (anti-drift) traceability
**What:** Re-derive the command set at test time from the generated `SUPPORT-ROSTER.md` rather than hard-coding the 18 names.
**When to use:** The ACCEPT-01 presence test (D-05).
**Recommended derivation (drift-proof, self-contained, strictly stronger than "roster minus covered"):** Parse the `## Supported` section of `SUPPORT-ROSTER.md` (bullet lines `- gsd-<name>`), yielding all 28. For **each** Supported `gsd-<name>`, assert some AC step's `Cmd:` line contains the exact emitted filename `gsd-<name>.md`. This passes today for the 10 v1 commands (all referenced in `AC-17..AC-25`) and mechanically forces the 18 new steps — no frozen literal list. Using the full `.md` filename (not the bare name) avoids prefix collisions (`gsd-new-milestone.md` vs `gsd-complete-milestone.md` vs `gsd-milestone-summary.md` are all distinct). [VERIFIED: all 10 v1 commands referenced via `.bob/commands/gsd-<name>.md` in AC-17..AC-25; all 28 Supported bullets parsed from roster]

### Pattern 2: Header-anchored deterministic slicing for the freeze
**What:** Slice `AC-01..AC-26` out of the live checklist by exact `## AC-NN —` header anchors, then byte-compare to a committed fixture.
**When to use:** The SC#3 insert-only test (D-04).
**Exact anchors** [VERIFIED against live file line numbers]:
- **Start (inclusive):** `## AC-01 — Subagent isolation` (currently line 85)
- **End (exclusive):** `## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)` (currently line 267)
- The slice is everything from the start anchor up to (but not including) the end anchor. It captures `AC-01..AC-26` plus the single trailing blank line before `## AC-27`. Line numbers are illustrative only — the test must locate by `indexOf(anchor)`, never by hard-coded offsets.

### Anti-Patterns to Avoid
- **Duplicating AC-27:** Authoring a second model-neutrality grep for ACCEPT-02. AC-27 already covers the full 28-command `gsd-*` emission. Discharge by amend + reference (D-03). This is the single most likely mistake (per CONTEXT §specifics).
- **Functionally invoking any of the 18:** Violates T-01-SC. Even "safe-ish" ones (`health`, `stats`) must stay `ls`/`cat` for a uniform read-only schema (D-07).
- **Freezing the 18 names as a literal in the test:** Breaks the anti-drift discipline. Derive from the roster (D-05).
- **Editing anything inside the `AC-01..AC-26` slice:** Even whitespace fails the freeze test. Roll-up rows / Execution Order notes live *outside* the slice and are safe to add.
- **Forking `acceptance-coverage.test.cjs`:** Add a new file; keep that suite byte-stable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Which commands must the delta cover?" | A typed list of 18 names in the test | Parse `SUPPORT-ROSTER.md` `## Supported` at run time | The roster is generated from `commands/gsd/*.md`; a frozen list silently drifts (F-05, D-05) |
| Freeze snapshot mechanism | A bespoke git-plumbing HEAD-diff | A committed `test/fixtures/acceptance/frozen-ac01-26.md` + `assert.equal` | Hermetic, deterministic, readable diff on failure (D-04) |
| Wrong-assumption capture | A new `ACCEPTANCE-DELTA-FOLLOWUPS.md` | Existing `.planning/ACCEPTANCE-FOLLOWUPS.md` | D-07: no new follow-up machinery; the log already exists [VERIFIED] |
| ACCEPT-02 device step | A new grep step | Amend `AC-27` `Confirms:` (F-01/F-02/D-03) | AC-27 already is the NEUTRAL-03 device-runnable invariant with full `gsd-*` scope |

**Key insight:** Every artifact this phase touches already has a generated source of truth or a proven template. The phase is pure composition of existing patterns; inventing new machinery is the failure mode.

## Runtime State Inventory

> Not a rename/refactor/migration phase. Included briefly because the phase edits a shared long-lived artifact.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `.planning/` markdown only, no datastore | none |
| Live service config | None — no external service | none |
| OS-registered state | None | none |
| Secrets/env vars | None | none |
| Build artifacts | None — no compiled output; tests run from source `.cjs` | none |

**Nothing found in any category:** verified — this phase authors markdown and adds builtin-only test files; there is no runtime state, no install step, and no external dependency.

## Common Pitfalls

### Pitfall 1: Breaking `acceptance-coverage.test.cjs`'s structural-parity assertion
**What goes wrong:** That suite asserts `pairs.length === headers` — every `## AC-NN` header must have **exactly one** `Confirms:` line — and every requirement token on a `Confirms:` line must be a **declared** ID (above `## Future Requirements`).
**Why it happens:** Appending an AC step without a `Confirms:` line, or with two, or referencing an undeclared/typo'd ID, trips it.
**How to avoid:** Each of `AC-28..AC-45` gets exactly one `Confirms:` line referencing `ACCEPT-01` (declared v2.0 ID [VERIFIED: REQUIREMENTS.md line 121, above `## Future Requirements`]). `CMD-01` is also declared (line 104) and safe to add. The AC-27 amend adds `ACCEPT-02` (line 122, declared). The floor `>= 26` and parity both stay satisfied (26→44 headers, 26→44 Confirms). [VERIFIED: read the test's assertions at lines 164-181]
**Warning signs:** `every AC block must carry exactly one Confirms line` or `references "X", which is not a declared requirement` in test output.

### Pitfall 2: The freeze fixture captures the wrong boundary
**What goes wrong:** Including the Results Roll-Up table (which *will* gain `AC-28..AC-45` rows) or `AC-27` inside the frozen slice makes the freeze test fail as soon as the intended edits land.
**Why it happens:** Confusing "the whole file" with "the `AC-01..AC-26` step blocks."
**How to avoid:** Slice strictly between the two header anchors above. The roll-up table (lines ~54-81) sits *above* `## AC-01` and is outside the slice; `AC-27` is the exclusive end bound. [VERIFIED: roll-up table precedes the `---` at line 83, which precedes `## AC-01` at line 85]
**Warning signs:** Freeze test fails on a diff that shows a roll-up row or an AC-27 token.

### Pitfall 3: Substring collision in the traceability match
**What goes wrong:** Matching the bare command name (`gsd-map-codebase`) as a substring could false-positive against another line.
**Why it happens:** Loose `includes(name)` matching.
**How to avoid:** Match the full emitted filename `gsd-<name>.md`. All 28 filenames are mutually non-prefixing when the `.md` suffix is included. [VERIFIED: enumerated all 28]
**Warning signs:** A missing AC step passes the test (false green).

## Code Examples

### Existing AC-07/AC-08 read-only emission-recognition template (the pattern for AC-28..AC-45)
```
// Source: .planning/ACCEPTANCE-CHECKLIST.md AC-07 (VERIFIED, lines 127-132)
## AC-07 — GSD command is recognized under Bob with its description (TRANS-01)

Cmd:    On a real Bob machine, read-only inspect an emitted Bob slash command and confirm Bob
        recognizes it. List and read (no edits): `ls .bob/commands` then
        `cat .bob/commands/gsd-plan-phase.md`, and observe the command in Bob's slash-command
        palette / listing. No file is written, moved, or deleted.
Expect: `.bob/commands/<name>.md` exists with `description:` (and where applicable
        `argument-hint:`) frontmatter and a `$1` positional-arg body; Bob lists the command and
        shows its description. The command appears as `/gsd-<name>` (hyphen form).
Confirms: TRANS-01 — GSD commands emitted as Bob `.bob/commands/*.md` slash commands.
Result: [ ] pass  [ ] fail
```
**Per-command AC-28..AC-45 shape (recommended):** identical skeleton, with `Cmd:` = `ls .bob/commands/gsd-<name>.md && cat .bob/commands/gsd-<name>.md` (read-only), `Expect:` = frontmatter `description:` present + command shows in Bob palette as `/gsd-<name>`, `Confirms: ACCEPT-01` (optionally `, CMD-01`).

### The AC-27 Confirms amend (ACCEPT-02 discharge, D-03)
```
// Source: .planning/ACCEPTANCE-CHECKLIST.md line 271 (VERIFIED, current)
Confirms: NEUTRAL-03 — zero model literals across the emitted `.bob/` converted set, guarding regressions / SC#3. (on-device complement to test/model-neutrality.test.cjs, which enforces the same invariant hermetically via the real staging path)

// After amend (single-token add; AC-27 is OUTSIDE the frozen range per F-02):
Confirms: NEUTRAL-03, ACCEPT-02 — zero model literals across the emitted `.bob/` converted set, guarding regressions / SC#3. (on-device complement to test/model-neutrality.test.cjs, which enforces the same invariant hermetically via the real staging path)
```
Note: `acceptance-coverage.test.cjs` uses `GENERIC_ID_RE = /\b[A-Z]{2,}-\d+\b/g` for the token/declared check, so `ACCEPT-02` is captured and validated as declared. The canonical `ID_RE` (`SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP`) does **not** capture `NEUTRAL`/`ACCEPT`, so AC-27's `ids` set stays empty while its `tokens` set stays non-empty — the no-orphan-AC check uses `tokens.length > 0`, which holds. [VERIFIED: read test lines 111-129, 171-181]

### Traceability test harness idiom (new — mirror the repo convention)
```javascript
// Source: convention from test/roster-capmap.test.cjs + acceptance-coverage.test.cjs (VERIFIED)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

const ROSTER = path.join(repoRoot, 'SUPPORT-ROSTER.md');
const CHECKLIST = path.join(repoRoot, '.planning', 'ACCEPTANCE-CHECKLIST.md');

// Derive the Supported set at run time (anti-drift) — parse `## Supported` bullets.
function supportedCommands() {
  const md = fs.readFileSync(ROSTER, 'utf8');
  const start = md.indexOf('## Supported');
  const end = md.indexOf('## Unsupported');
  assert.ok(start >= 0 && end > start, 'roster must have Supported/Unsupported sections'); // fail-closed
  return md.slice(start, end)
    .split('\n')
    .map((l) => l.match(/^- (gsd-[a-z0-9-]+)\s*$/))
    .filter(Boolean)
    .map((m) => m[1]);
}

test('ACCEPT-01: every Supported command has >=1 AC step referencing its emitted artifact', () => {
  const checklist = fs.readFileSync(CHECKLIST, 'utf8');
  const cmds = supportedCommands();
  assert.ok(cmds.length >= 28, `expected >=28 supported commands, parsed ${cmds.length}`);
  for (const c of cmds) {
    assert.ok(checklist.includes(`${c}.md`), `no AC step references ${c}.md (missing device-runnable step)`);
  }
});

test('ACCEPT-01/ACCEPT-02: both phase reqs are referenced by >=1 AC Confirms line', () => {
  const checklist = fs.readFileSync(CHECKLIST, 'utf8');
  for (const id of ['ACCEPT-01', 'ACCEPT-02']) {
    assert.ok(checklist.includes(id), `${id} must appear on an AC Confirms line`);
  }
});
```

### Insert-only freeze test idiom (new — snapshot fixture)
```javascript
// Source: convention (node:test + repoRoot); D-04 mechanism
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

const CHECKLIST = path.join(repoRoot, '.planning', 'ACCEPTANCE-CHECKLIST.md');
const FROZEN = path.join(repoRoot, 'test', 'fixtures', 'acceptance', 'frozen-ac01-26.md');
const START = '## AC-01 — Subagent isolation';
const END = '## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)';

function frozenSlice(md) {
  const s = md.indexOf(START);
  const e = md.indexOf(END);
  assert.ok(s >= 0 && e > s, 'AC-01 start and AC-27 end anchors must both be present, in order'); // fail-closed
  return md.slice(s, e);
}

test('SC#3: AC-01..AC-26 step blocks are byte-unchanged (insert-only)', () => {
  const live = frozenSlice(fs.readFileSync(CHECKLIST, 'utf8'));
  const frozen = fs.readFileSync(FROZEN, 'utf8');
  assert.equal(live, frozen, 'the AC-01..AC-26 frozen slice diverged from the committed snapshot');
});
```
The fixture `frozen-ac01-26.md` is created **once** in this phase by writing exactly `frozenSlice(currentChecklist)` before any other edit, then committing it. Order matters: capture the fixture from the pristine `AC-01..AC-26` slice first, then append the new steps.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-maintained coverage lists | Derive sets at run time from generated source-of-truth (`SUPPORT-ROSTER.md`, `REQUIREMENTS.md`) | Established Phases 4-6 (`acceptance-coverage`, `roster-capmap`) | The delta test must follow suit (D-05) — no frozen literals |
| Per-phase scattered verification | Single root-anchored `.planning/ACCEPTANCE-CHECKLIST.md`, insert-only append | Phase 1 | Phase 11 appends `AC-28..AC-45`, never edits priors |

**Deprecated/outdated:**
- The legacy `/gsd:<cmd>` colon command form — deprecated upstream; only the `gsd-<cmd>` hyphen form is emitted/routable (per CLAUDE.md). New AC steps must use the hyphen form.

## Pressure-Tests (the two open questions the CONTEXT flagged)

### (A) Does AC-27's existing `gsd-*` glob genuinely cover all 18 new commands, zero scope gap? — CONFIRMED
**Evidence.** AC-27's exact `Cmd:` (VERIFIED, checklist line 269):
```
grep -rniE '\b(opus|sonnet|haiku)\b|^[[:space:]]*(model|effort|model_profile|resolve_model_ids)[[:space:]]*:' "$BOB_HOME"/commands/gsd-*.md "$BOB_HOME"/skills/gsd-*/SKILL.md
```
The glob `"$BOB_HOME"/commands/gsd-*.md` matches every emitted command file named `gsd-<name>.md`. All 18 new commands are in the `SUPPORT-ROSTER.md` **Supported** section (VERIFIED — the roster Supported list contains `gsd-new-milestone`, `gsd-complete-milestone`, `gsd-milestone-summary`, `gsd-quick`, `gsd-fast`, `gsd-ship`, `gsd-explore`, `gsd-spec-phase`, `gsd-mvp-phase`, `gsd-map-codebase`, `gsd-ui-phase`, `gsd-secure-phase`, `gsd-extract-learnings`, `gsd-docs-update`, `gsd-health`, `gsd-stats`, `gsd-resume-work`, `gsd-pause-work`), which means the installer emits each as `.bob/commands/gsd-<name>.md`. Therefore `gsd-new-milestone.md … gsd-pause-work.md` are all caught by `gsd-*.md`. **Zero scope gap. D-03 is sound — no AC-27 `Cmd:` change is needed.** [VERIFIED: roster Supported = 28 bullets incl. all 18; `commands/gsd/` = 28 `.md` files]

### (B) Is read-only emission-recognition (not a functional run) the correct/safe form for all 18? — CONFIRMED
**Evidence.**
1. **Safety invariant (T-01-SC):** the checklist header (VERIFIED, line 15) mandates every `Cmd:` be "read-only / side-effect-free … No install, write, delete, move, copy, or any state mutation." A functional `/gsd-*` invocation of the 18 mutates state.
2. **Nature of the commands:** the 18 include `complete-milestone` and `new-milestone` (rewrite `ROADMAP.md`/archive milestones) and `ship` (creates a PR / pushes) — irreversible, outward-reaching side effects unsafe to run unattended.
3. **Coverage already exists for workflow logic:** the core-loop workflow logic is exercised on-device by `AC-17..AC-21` (functional `/gsd-new-project → plan-phase → execute-phase → verify-work → progress`, VERIFIED lines 197-230). For the 18 source-only additions the untested on-device risk is "does Bob emit + recognize the converted artifact + is it neutral," which `ls`/`cat` (emission-recognition) + AC-27 (neutrality) fully cover.
**Conclusion:** none of the 18 needs a functional on-device run to satisfy ACCEPT-01's intent. **D-01/D-07 are sound.** [VERIFIED]

### ACCEPT-02 discharge: amend AC-27 vs new AC-46 — RECOMMENDATION
**Recommend: amend AC-27's `Confirms:` line to add `ACCEPT-02`.**
- **Why:** AC-27 is outside the frozen `AC-01..AC-26` range (F-02), so the single-token edit is permitted; it is the minimal, non-duplicating way to satisfy SC#2 ("the checklist gains a device-runnable model-neutrality verification step" — it already has one; making it *traceable* to ACCEPT-02 discharges the requirement). No redundant grep, no extra roll-up row.
- **Tradeoff:** amending touches AC-27 (acceptable — not frozen). If a reviewer prefers AC-27 to stay byte-stable, the alternative is a thin `AC-46` that cross-references AC-27's grep and `Confirms: ACCEPT-02` — but that adds a redundant step and a roll-up row for zero new device action. **Amend is cleaner; use it unless a reviewer explicitly wants AC-27 byte-frozen.**
- Either way, add the ACCEPT-02 assertion to the new traceability test (`checklist.includes('ACCEPT-02')`) so SC#2 is mechanically proven.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The installer emits every Supported-roster command as `.bob/commands/gsd-<name>.md` (used to justify AC-27 glob coverage and the traceability match on `.md` filenames) | Pressure-Test A, Pattern 1 | Low — consistent with AC-07/AC-13/AC-17..25 which all read `.bob/commands/gsd-<name>.md`; roster Supported == emitted set by the gate's definition. If an emitted filename differed, both the glob and the test would need the real path — but the `.bob/commands/gsd-*.md` convention is verified across 10 existing AC steps. |

**All other claims in this research were VERIFIED against the live repo (files read this session) or CITED from the checklist/requirements/roadmap.**

## Open Questions

1. **Per-command (18 steps) vs one consolidated `AC-28` enumerating all 18?**
   - What we know: D-01 recommends per-command for traceability fidelity and AC-07/AC-08 precedent; permits a consolidated form if 18 rows are judged too heavy.
   - What's unclear: reviewer tolerance for 18 new roll-up rows.
   - Recommendation: **per-command** — it makes the ACCEPT-01 traceability test a clean 1:1 (`gsd-<name>.md` ↔ AC step) and matches precedent. Planner may consolidate only if roll-up weight is a stated concern; the traceability test works either way as long as each `gsd-<name>.md` appears in some `Cmd:` line.

2. **Fixture vs embedded hash for the freeze (D-04).**
   - What we know: both hermetic; fixture gives a readable diff, hash is terser.
   - Recommendation: **committed fixture** `test/fixtures/acceptance/frozen-ac01-26.md`.

## Environment Availability

> Skipped in substance — this phase has no external dependencies. The only tool needed is Node `>=22.15.0`, which is the verified project engines floor and runs the existing `npm test`. No services, CLIs, or databases involved.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | running the two new `node:test` files | ✓ (project floor) | `>=22.15.0` | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

> Skipped — `.planning/config.json` sets `workflow.nyquist_validation: false` [VERIFIED]. The phase's own two guard tests (traceability + freeze) are the verification and are specified in §Code Examples.

## Security Domain

> `security_enforcement: true` in config, but this phase writes **no runtime code** — it authors markdown checklist steps and two read-only doc-parsing test files. No auth, session, access-control, cryptography, or untrusted-input handling is introduced.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no | Tests parse repo-local, trusted, committed markdown only — no external input |
| V6 Cryptography | no | No secrets/crypto |
| (all others) | no | No runtime surface |

### Relevant control for this phase
The one security-adjacent invariant is **T-01-SC (read-only-by-default)**: every new `Cmd:` line in the device-runnable checklist MUST be side-effect-free (`ls`/`cat`/`grep`/`echo`), because these commands run unattended on a real user machine. This is the STRIDE-Tampering mitigation for the checklist artifact and is enforced by keeping all 18 new steps emission-recognition (D-07). The planner should add a verification step confirming no new `Cmd:` line contains a functional `/gsd-*` invocation or any write/install/delete verb.

## Sources

### Primary (HIGH confidence) — files read this session
- `.planning/phases/11-on-device-acceptance-delta/11-CONTEXT.md` — locked decisions D-01..D-07, grounding facts F-01..F-05
- `.planning/ACCEPTANCE-CHECKLIST.md` — full read: schema (lines 9-15), T-01-SC (15), Execution Order (38-48), Results Roll-Up (50-81), AC-01..AC-27 blocks, AC-27 Cmd (269) + Confirms (271)
- `test/acceptance-coverage.test.cjs` — full read: derive-never-freeze discipline, `ID_RE`/`GENERIC_ID_RE`, declared-req derivation, parity + phantom-ref assertions
- `test/roster-capmap.test.cjs` — harness idiom + roster/`commands/gsd` derivation pattern
- `test/_helpers/vendor.cjs` — `repoRoot` helper
- `.planning/REQUIREMENTS.md` — ACCEPT-01 (121), ACCEPT-02 (122), CMD-01 (104), milestone boundaries, traceability
- `.planning/ROADMAP.md` §Phase 11 — goal, 3 success criteria, frozen AC-01..AC-26, depends on 8/9
- `SUPPORT-ROSTER.md` — 28 Supported bullets (all 18 present), 2 Unsupported
- `commands/gsd/` (dir listing) — 28 `.md` files incl. all 18 targets
- `.planning/config.json` — `nyquist_validation:false`, `security_enforcement:true`, `text_mode:true`
- `package.json` — `test: node --test "test/**/*.test.cjs"`

### Secondary (MEDIUM confidence)
- `.planning/ACCEPTANCE-FOLLOWUPS.md` — existence + header schema confirmed via `grep` (not full-read)

### Tertiary (LOW confidence)
- none

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero packages; builtin `node:test` convention verified across existing files
- Architecture / patterns: HIGH — derivation + slicing anchors verified against live file contents and line numbers
- Pitfalls: HIGH — each traced to a verified assertion in `acceptance-coverage.test.cjs` or a verified file boundary
- Pressure-tests (A/B): HIGH — glob coverage proven from roster + emitted-path convention; safety proven from T-01-SC text + command nature

**Research date:** 2026-07-04
**Valid until:** 2026-08-03 (stable — planning docs and test conventions change slowly; re-verify only if `SUPPORT-ROSTER.md`, `ACCEPTANCE-CHECKLIST.md`, or `acceptance-coverage.test.cjs` change before planning)
