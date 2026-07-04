'use strict';

/**
 * acceptance-delta-coverage.test.cjs — ACCEPT-01 / ACCEPT-02 (Phase 11, D-05).
 *
 * The presence/traceability guard for the v2.0 acceptance delta. Like
 * acceptance-coverage.test.cjs and roster-capmap.test.cjs, it derives its input
 * set at run time from the generated source of truth (SUPPORT-ROSTER.md) rather
 * than trusting a hand-maintained list — so a newly added or renamed command
 * cannot silently escape coverage (anti-drift, never freeze the 18 names).
 *
 * Two assertions:
 *   (ACCEPT-01) every Supported command in SUPPORT-ROSTER.md has >=1 AC step in
 *      .planning/ACCEPTANCE-CHECKLIST.md referencing its emitted artifact
 *      (matched on the full `gsd-<name>.md` filename to avoid prefix collisions
 *      — Pitfall 3).
 *   (ACCEPT-01/ACCEPT-02) both phase requirement IDs are referenced by >=1 AC
 *      Confirms line.
 *
 * Pure read-only doc parsing. Composes with — does not fork —
 * acceptance-coverage.test.cjs. No new npm dependency.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

const ROSTER = path.join(repoRoot, 'SUPPORT-ROSTER.md');
const CHECKLIST = path.join(repoRoot, '.planning', 'ACCEPTANCE-CHECKLIST.md');

/**
 * Derive the Supported command set at run time (anti-drift). Slice the roster
 * from `## Supported` to `## Unsupported`, fail CLOSED if either marker is
 * missing or out of order, then match the `- gsd-<name>` bullet lines.
 */
function supportedCommands() {
  const md = fs.readFileSync(ROSTER, 'utf8');
  const start = md.indexOf('## Supported');
  const end = md.indexOf('## Unsupported');
  assert.ok(start >= 0 && end > start, 'roster must have Supported/Unsupported sections in order');
  return md
    .slice(start, end)
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
    assert.ok(
      checklist.includes(`${c}.md`),
      `no AC step references ${c}.md (missing device-runnable emission/recognition step)`,
    );
  }
});

test('ACCEPT-01/ACCEPT-02: both phase reqs are referenced by an AC Confirms line', () => {
  const checklist = fs.readFileSync(CHECKLIST, 'utf8');
  for (const id of ['ACCEPT-01', 'ACCEPT-02']) {
    assert.ok(checklist.includes(id), `${id} must appear on an AC Confirms line`);
  }
});
