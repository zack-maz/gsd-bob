'use strict';

/**
 * acceptance-insert-only.test.cjs — SC#3 insert-only freeze (Phase 11, D-04).
 *
 * The hermetic guarantee that the v1 AC-01..AC-26 step blocks are never edited.
 * A committed snapshot fixture (test/fixtures/acceptance/frozen-ac01-26.md) was
 * captured from the pristine slice BEFORE any Phase 11 edit; this test slices the
 * live checklist between the same two header anchors and byte-diffs it against
 * the fixture. Any change — even whitespace — inside the frozen slice fails CI.
 *
 * The slice boundaries are located by header anchor (indexOf), never by
 * hard-coded line offsets, so appends elsewhere in the file (roll-up rows,
 * AC-27+ steps) do not shift the frozen region. Fail CLOSED if either anchor is
 * missing or out of order. No new npm dependency.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

const CHECKLIST = path.join(repoRoot, '.planning', 'ACCEPTANCE-CHECKLIST.md');
const FROZEN = path.join(repoRoot, 'test', 'fixtures', 'acceptance', 'frozen-ac01-26.md');
// Em-dashes (U+2014) exact — must match the live headers byte-for-byte.
const START = '## AC-01 — Subagent isolation';
const END = '## AC-27 — model-neutrality zero-literal grep (NEUTRAL-03)';

function frozenSlice(md) {
  const s = md.indexOf(START);
  const e = md.indexOf(END);
  assert.ok(s >= 0 && e > s, 'AC-01 start and AC-27 end anchors must both be present, in order');
  return md.slice(s, e);
}

test('SC#3: AC-01..AC-26 step blocks are byte-unchanged (insert-only)', () => {
  const live = frozenSlice(fs.readFileSync(CHECKLIST, 'utf8'));
  const frozen = fs.readFileSync(FROZEN, 'utf8');
  assert.equal(live, frozen, 'the AC-01..AC-26 frozen slice diverged from the committed snapshot');
});
