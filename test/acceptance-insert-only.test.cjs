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
// START uses the exact em-dash (U+2014) title so it byte-anchors the first
// frozen header. END anchors on the AC-27 ID PREFIX only (not its full title):
// AC-27 lives OUTSIDE the frozen range and is legitimately editable, so keying
// the boundary to its mutable description would make a benign AC-27 title reword
// falsely fail this frozen-region guard. `## AC-27` occurs once as a header and
// starts at the identical byte offset as the full title, so the slice is
// unchanged and the committed fixture still matches byte-for-byte.
const START = '## AC-01 — Subagent isolation';
const END = '## AC-27';

function frozenSlice(md) {
  const s = md.indexOf(START);
  const e = md.indexOf(END);
  assert.ok(s >= 0 && e > s, 'AC-01 start and AC-27 end anchors must both be present, in order');
  return md.slice(s, e);
}

/** `## AC-27` must resolve to exactly one header so the end anchor is unambiguous. */
function assertSingleAc27Header(md) {
  const headers = (md.match(/^## AC-27\b/gm) || []).length;
  assert.equal(headers, 1, `expected exactly one '## AC-27' header, found ${headers}`);
}

test('SC#3: AC-01..AC-26 step blocks are byte-unchanged (insert-only)', () => {
  const md = fs.readFileSync(CHECKLIST, 'utf8');
  assertSingleAc27Header(md);
  const live = frozenSlice(md);
  const frozen = fs.readFileSync(FROZEN, 'utf8');
  assert.equal(live, frozen, 'the AC-01..AC-26 frozen slice diverged from the committed snapshot');
});
