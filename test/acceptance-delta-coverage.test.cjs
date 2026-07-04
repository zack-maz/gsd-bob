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
 *      .planning/ACCEPTANCE-CHECKLIST.md whose `Cmd:` line references its emitted
 *      artifact (matched on the full `gsd-<name>.md` filename to avoid prefix
 *      collisions — Pitfall 3). Scoping to `Cmd:` lines (not the whole file)
 *      stops a bare name-drop in prose / a roll-up row / another step's example
 *      from satisfying coverage vacuously.
 *   (ACCEPT-01/ACCEPT-02) both phase requirement IDs are referenced by >=1 AC
 *      `Confirms:` line (scoped, not a file-wide substring — a header mention
 *      alone must not satisfy it).
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
  const section = md.slice(start, end);
  const parsed = section
    .split('\n')
    .map((l) => l.match(/^- (gsd-[a-z0-9-]+)\s*$/))
    .filter(Boolean)
    .map((m) => m[1]);
  // Cross-check the cleanly-parsed count against the raw `- gsd-` bullet count so
  // a malformed bullet (trailing char, inline comment, uppercase) fails LOUD
  // instead of being silently skipped by the strict regex and escaping coverage
  // under the `>= 28` floor (anti-drift; the floor alone is a lower bound).
  const rawBullets = section.split('\n').filter((l) => /^- gsd-/.test(l)).length;
  assert.equal(
    parsed.length,
    rawBullets,
    `roster has ${rawBullets} '- gsd-' bullets but only ${parsed.length} parsed cleanly — a malformed bullet would escape coverage`,
  );
  return parsed;
}

test('ACCEPT-01: every Supported command has >=1 AC step referencing its emitted artifact', () => {
  const checklist = fs.readFileSync(CHECKLIST, 'utf8');
  // Scope to `Cmd:` lines: coverage means a runnable device step, not a bare
  // filename appearing anywhere in the 50 KB doc (a prose aside, a roll-up row,
  // or another command's example must NOT satisfy it — false-negative guard).
  const cmdLines = checklist.split('\n').filter((l) => /^Cmd:/.test(l));
  const cmds = supportedCommands();
  assert.ok(cmds.length >= 28, `expected >=28 supported commands, parsed ${cmds.length}`);
  for (const c of cmds) {
    assert.ok(
      cmdLines.some((l) => l.includes(`${c}.md`)),
      `no AC Cmd: line references ${c}.md (missing device-runnable emission/recognition step)`,
    );
  }
});

test('ACCEPT-01/ACCEPT-02: both phase reqs are referenced by an AC Confirms line', () => {
  const confirmsLines = fs
    .readFileSync(CHECKLIST, 'utf8')
    .split('\n')
    .filter((l) => /^Confirms:/.test(l));
  for (const id of ['ACCEPT-01', 'ACCEPT-02']) {
    assert.ok(
      confirmsLines.some((l) => l.includes(id)),
      `${id} must appear on an AC Confirms line`,
    );
  }
});
