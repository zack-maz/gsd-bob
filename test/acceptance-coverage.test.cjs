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
 *   2. checklist refs — every `(FAMILY)-NN` requirement ID on each `Confirms:`
 *      line in .planning/ACCEPTANCE-CHECKLIST.md, paired to its `## AC-NN` header.
 *
 * Three assertions:
 *   (VERIFY-01a) every canonical v1 SC is referenced by >=1 AC step (no orphan SC).
 *   (VERIFY-01b) every AC step references >=1 canonical requirement ID (no orphan AC).
 *   (VERIFY-02 / D-06) the root-anchored follow-up log exists with the required
 *      columns and the watch-list rows — STRUCTURAL/presence only (the runner
 *      flips `Status` post-pass; the SPIKE-04 config-home row links a descriptive
 *      enhancement, NOT a non-existent v2 ID, so no v2-ID existence is asserted).
 *
 * Pure read-only doc parsing. Does not run the installer, write scratch files,
 * or touch the checklist / followups it inspects.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

// Matches SPIKE-01, RUNTIME-02, TRANS-03, INSTALL-04, CORE-05, QUAL-03, UP-01, …
const ID_RE = /\b(SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP)-\d{2}\b/g;

const REQUIREMENTS = path.join(repoRoot, '.planning', 'REQUIREMENTS.md');
const CHECKLIST = path.join(repoRoot, '.planning', 'ACCEPTANCE-CHECKLIST.md');
const FOLLOWUPS = path.join(repoRoot, '.planning', 'ACCEPTANCE-FOLLOWUPS.md');

/**
 * Source of truth #1: the canonical Phase 1–5 requirement IDs. Take every
 * family ID ABOVE the `## v2 Requirements` boundary and drop the `VERIFY-*`
 * IDs (this phase's own reqs, not a Phase 1–5 SC). Derived, never frozen.
 */
function canonicalSCs() {
  const md = fs.readFileSync(REQUIREMENTS, 'utf8');
  const v2Idx = md.indexOf('## v2 Requirements');
  const v1Section = v2Idx >= 0 ? md.slice(0, v2Idx) : md;
  return new Set([...v1Section.matchAll(ID_RE)].map((m) => m[0]));
  // VERIFY-* is not in the (SPIKE|RUNTIME|TRANS|INSTALL|CORE|QUAL|UP) family,
  // so it is excluded by construction; no extra filter needed.
}

/**
 * Source of truth #2: each AC step's `Confirms:` line paired to its `## AC-NN`
 * header, with the Set of `(FAMILY)-NN` IDs it references (matchAll collects
 * ALL — so AC-06 -> {RUNTIME-01,RUNTIME-02}, AC-13 -> {INSTALL-01..03}, etc.).
 */
function checklistRefs() {
  const lines = fs.readFileSync(CHECKLIST, 'utf8').split('\n');
  const pairs = []; // { ac: 'AC-06', ids: Set<string> }
  let currentAc = null;
  for (const l of lines) {
    const h = l.match(/^##\s+(AC-\d{2})\b/);
    if (h) {
      currentAc = h[1];
    } else if (l.startsWith('Confirms:') && currentAc) {
      pairs.push({ ac: currentAc, ids: new Set([...l.matchAll(ID_RE)].map((m) => m[0])) });
      currentAc = null; // one Confirms line per AC block
    }
  }
  return pairs;
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

// ---- VERIFY-01: no orphan AC -------------------------------------------------

test('VERIFY-01: every AC step references >=1 canonical requirement ID (no orphan AC)', () => {
  const pairs = checklistRefs();
  assert.equal(pairs.length, 26, `expected 26 AC Confirms lines, parsed ${pairs.length}`);
  for (const { ac, ids } of pairs) {
    assert.ok(ids.size > 0, `orphan AC: ${ac} references no canonical requirement ID`);
  }
});

// ---- VERIFY-02 / D-06: follow-up log presence (structural only) --------------

test('VERIFY-02: the follow-up log exists with the required columns and the watch-list rows (D-06 presence)', () => {
  assert.ok(fs.existsSync(FOLLOWUPS), '.planning/ACCEPTANCE-FOLLOWUPS.md must exist (root-anchored)');
  const md = fs.readFileSync(FOLLOWUPS, 'utf8');

  // The header row carries every required column (order is declared in the doc
  // schema block; presence is what the test guards).
  const headerRow = md.split('\n').find((l) => l.includes('| ID |') && l.includes('| Links |'));
  assert.ok(headerRow, 'a table header row containing the ID..Links columns must exist');
  for (const col of ['ID', 'Assumption', 'Observed on-device', 'Impact', 'Proposed enhancement', 'Links']) {
    assert.ok(headerRow.includes(col), `follow-up log header must contain the "${col}" column`);
  }

  // The three primary watch-list tokens are present in the body. (No assertion
  // that any row is still `unconfirmed` — the runner flips it post-pass — and no
  // assertion that a v2 ID exists for the SPIKE-04 config-home row: it links a
  // descriptive enhancement by design.)
  for (const tok of ['SPIKE-01', 'SPIKE-02', 'SPIKE-04']) {
    assert.ok(md.includes(tok), `follow-up watch-list must seed a ${tok} row`);
  }
});
