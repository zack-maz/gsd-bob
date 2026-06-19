'use strict';

/**
 * acceptance-coverage.test.cjs — VERIFY-01 / VERIFY-02 / D-02 / D-06.
 *
 * The hermetic completeness proof for the on-device acceptance gate. No live
 * Bob is involved (and none exists during development) — this suite parses the
 * repo-local planning docs and re-proves coverage at test time, exactly as
 * roster-capmap.test.cjs re-derives the support roster from its source of truth
 * rather than trusting a hand-maintained list.
 *
 * Two sources of truth, both derived at run time (anti-drift — never freeze an
 * ID list):
 *   1. canonical SCs — the v1 requirement IDs in .planning/REQUIREMENTS.md ABOVE
 *      the `## v2 Requirements` boundary, minus this phase's own `VERIFY-*` reqs.
 *   2. checklist refs — every requirement ID on each `Confirms:` line in
 *      .planning/ACCEPTANCE-CHECKLIST.md, paired to its `## AC-NN` header.
 *
 * Three assertions:
 *   (VERIFY-01a) every canonical v1 SC is referenced by >=1 AC step (no orphan SC).
 *   (VERIFY-01b) every AC step references >=1 canonical requirement ID AND every
 *      ID it references is a real canonical v1 SC — a typo'd or unrecognised
 *      token (e.g. `RUNTIME-99`, a new `DOCS-01` family) fails loudly, not
 *      silently (no orphan AC, no phantom ref).
 *   (VERIFY-02 / D-06) the root-anchored follow-up log exists with the required
 *      columns IN ORDER and the watch-list rows — STRUCTURAL/presence only (the
 *      runner flips `Status` post-pass; the SPIKE-04 config-home row links a
 *      descriptive enhancement, NOT a non-existent v2 ID, so no v2-ID existence
 *      is asserted).
 *
 * Pure read-only doc parsing. Does not run the installer, write scratch files,
 * or touch the checklist / followups it inspects.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

// Canonical family IDs: SPIKE-01, RUNTIME-2, TRANS-03, INSTALL-04, CORE-5,
// QUAL-03, UP-01, … `\d+` (not `\d{2}`) so a 1- or 3-digit ID is never silently
// dropped on a future edit (the anti-drift point of this suite). WR-04.
const ID_RE = /\b(SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP)-\d+\b/g;

// Generic requirement-ID shape (any UPPER family). Used ONLY to scan the
// controlled `Confirms:` lines so a token from an UNKNOWN family (e.g. a future
// `DOCS-01`) or a typo'd in-family token surfaces as "not canonical" instead of
// being invisible to the closed ID_RE. WR-01 / WR-03.
const GENERIC_ID_RE = /\b[A-Z]{2,}-\d+\b/g;

const REQUIREMENTS = path.join(repoRoot, '.planning', 'REQUIREMENTS.md');
const CHECKLIST = path.join(repoRoot, '.planning', 'ACCEPTANCE-CHECKLIST.md');
const FOLLOWUPS = path.join(repoRoot, '.planning', 'ACCEPTANCE-FOLLOWUPS.md');

/**
 * Source of truth #1: the canonical Phase 1–5 requirement IDs. Take every
 * family ID ABOVE the `## v2 Requirements` boundary and drop the `VERIFY-*`
 * IDs (this phase's own reqs, not a Phase 1–5 SC). Derived, never frozen.
 *
 * Fails CLOSED on a missing boundary (WR-02): without the assert, a reworded
 * heading makes `indexOf` return -1 and the whole document (incl. the v2
 * section) would be scanned as "v1", masking real orphan-SC drift.
 */
function canonicalSCs() {
  const md = fs.readFileSync(REQUIREMENTS, 'utf8');
  const v2Idx = md.indexOf('## v2 Requirements');
  assert.ok(
    v2Idx >= 0,
    'REQUIREMENTS.md must contain the "## v2 Requirements" boundary — the v1/v2 split is load-bearing for canonical SC derivation',
  );
  const v1Section = md.slice(0, v2Idx);
  return new Set([...v1Section.matchAll(ID_RE)].map((m) => m[0]));
  // VERIFY-* is not in the (SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP) family,
  // so it is excluded by construction; no extra filter needed.
}

/**
 * Source of truth #2: each AC step's `Confirms:` line paired to its `## AC-NN`
 * header. `ids` are the canonical-family matches; `tokens` are ALL generic
 * requirement-ID tokens on the line (so an unrecognised-family / typo'd ref is
 * captured for the no-orphan-AC validity check, not silently skipped).
 */
function checklistRefs() {
  const lines = fs.readFileSync(CHECKLIST, 'utf8').split('\n');
  const pairs = []; // { ac, ids:Set, tokens:string[] }
  let currentAc = null;
  for (const l of lines) {
    const h = l.match(/^##\s+(AC-\d+)\b/);
    if (h) {
      currentAc = h[1];
    } else if (l.startsWith('Confirms:') && currentAc) {
      pairs.push({
        ac: currentAc,
        ids: new Set([...l.matchAll(ID_RE)].map((m) => m[0])),
        tokens: [...l.matchAll(GENERIC_ID_RE)].map((m) => m[0]),
      });
      currentAc = null; // one Confirms line per AC block
    }
  }
  return pairs;
}

/** Count `## AC-NN` headers — the structural denominator for the parity check. */
function acHeaderCount() {
  return fs
    .readFileSync(CHECKLIST, 'utf8')
    .split('\n')
    .filter((l) => /^##\s+AC-\d+\b/.test(l)).length;
}

// ---- VERIFY-01: no orphan SC -------------------------------------------------

test('VERIFY-01: every v1 SC (Phases 1-5) is referenced by >=1 AC Confirms line (no orphan SC)', () => {
  const canonical = canonicalSCs();
  const referenced = new Set();
  for (const { ids } of checklistRefs()) {
    for (const id of ids) referenced.add(id);
  }
  assert.ok(canonical.size > 0, 'parsed >0 canonical v1 requirement IDs from REQUIREMENTS.md');
  for (const id of canonical) {
    assert.ok(referenced.has(id), `orphan SC: ${id} has no AC step referencing it`);
  }
});

// ---- VERIFY-01: no orphan AC (and no phantom ref) ----------------------------

test('VERIFY-01: every AC step references only real canonical requirement IDs, >=1 each (no orphan AC, no phantom ref)', () => {
  const canonical = canonicalSCs();
  const pairs = checklistRefs();
  const headers = acHeaderCount();

  // Structural parity instead of a brittle magic count: every `## AC-NN` block
  // has exactly one `Confirms:` line, and the set is at least the known-complete
  // floor of 26 (Phases 1–5). A dropped Confirms line trips the parity check; a
  // future append still satisfies the floor. WR (magic-26).
  assert.equal(
    pairs.length,
    headers,
    `every AC block must carry exactly one Confirms line — ${headers} AC headers but ${pairs.length} Confirms lines`,
  );
  assert.ok(pairs.length >= 26, `expected >=26 AC Confirms lines (Phases 1-5 floor), parsed ${pairs.length}`);

  for (const { ac, tokens } of pairs) {
    assert.ok(tokens.length > 0, `orphan AC: ${ac} references no requirement ID`);
    for (const tok of tokens) {
      assert.ok(
        canonical.has(tok),
        `AC ${ac} references "${tok}", which is not a canonical v1 SC — typo or unrecognised family. ` +
          `Fix the Confirms line or add the requirement to REQUIREMENTS.md (v1).`,
      );
    }
  }
});

// ---- VERIFY-02 / D-06: follow-up log presence (structural only) --------------

test('VERIFY-02: the follow-up log exists with the required columns (in order) and the watch-list rows (D-06 presence)', () => {
  assert.ok(fs.existsSync(FOLLOWUPS), '.planning/ACCEPTANCE-FOLLOWUPS.md must exist (root-anchored)');
  const md = fs.readFileSync(FOLLOWUPS, 'utf8');

  // Validate the header row's column SEQUENCE (not just presence) — the doc
  // schema declares an exact order, so split on `|` and compare cells. WR-05.
  const headerRow = md.split('\n').find((l) => l.includes('| ID |') && l.includes('| Links |'));
  assert.ok(headerRow, 'a table header row containing the ID..Links columns must exist');
  const cells = headerRow.split('|').map((c) => c.trim()).filter(Boolean);
  assert.deepEqual(
    cells,
    ['ID', 'Status', 'Assumption', 'Observed on-device', 'Impact', 'Proposed enhancement', 'Links'],
    'follow-up log header columns must match the declared schema, in order',
  );

  // The three primary watch-list tokens are present in the body. (No assertion
  // that any row is still `unconfirmed` — the runner flips it post-pass — and no
  // assertion that a v2 ID exists for the SPIKE-04 config-home row: it links a
  // descriptive enhancement by design.)
  for (const tok of ['SPIKE-01', 'SPIKE-02', 'SPIKE-04']) {
    assert.ok(md.includes(tok), `follow-up watch-list must seed a ${tok} row`);
  }
});
