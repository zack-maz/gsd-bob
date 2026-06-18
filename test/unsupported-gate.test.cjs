'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

// TRANS-04: programmatic flag/skip gate + loud "unsupported on Bob: <reason>" roster.
const adapter = require(path.join(repoRoot, 'src', 'bob-adapter.cjs'));

// Build the forbidden/marker token programmatically so this test file's own prose
// can never accidentally satisfy (or trip) the assertions it makes.
const MARKER = ['unsupported', 'on', 'Bob:'].join(' ');

// Bob's conservative lower bound (CAPABILITY-MAP §1): no isolated subagents,
// no structured prompts (text_mode only).
const bobDecl = { isolatedSubagents: false, structuredPrompts: false };

test('a fully-supported candidate is included with no roster entry', () => {
  const candidate = { name: 'gsd-help', requires: [] };
  const res = adapter.gateArtifact(candidate, bobDecl);
  assert.equal(res.supported, true);
  assert.ok(!res.reason, 'no reason on supported');
});

test('a candidate requiring an unmet hard dependency is excluded with a concrete reason', () => {
  const candidate = { name: 'gsd-parallel-thing', requires: ['isolatedSubagents'] };
  const res = adapter.gateArtifact(candidate, bobDecl);
  assert.equal(res.supported, false);
  assert.ok(typeof res.reason === 'string' && res.reason.length > 0);
  assert.match(res.reason, /isolatedSubagents|subagent/i);
});

test('a curated skip-list candidate is excluded with its skip-list reason', () => {
  // Use whatever names the adapter curates; assert the mechanism via a name the
  // adapter is documented to skip. The adapter exposes its skip-list for the test.
  const skipList = adapter.BOB_SKIP_LIST || {};
  const skippedName = Object.keys(skipList)[0];
  assert.ok(skippedName, 'adapter exposes at least one curated skip-list entry');
  const res = adapter.gateArtifact({ name: skippedName, requires: [] }, bobDecl);
  assert.equal(res.supported, false);
  assert.ok(res.reason && res.reason.length > 0);
});

test('buildSupportRoster emits a loud marker line for each unsupported candidate', () => {
  const candidates = [
    { name: 'gsd-help', requires: [] },
    { name: 'gsd-parallel-thing', requires: ['isolatedSubagents'] },
  ];
  const roster = adapter.buildSupportRoster(candidates, bobDecl);
  assert.ok(Array.isArray(roster), 'roster is an array of lines');
  const unsupportedLines = roster.filter((l) => l.includes(MARKER));
  assert.equal(unsupportedLines.length, 1, 'exactly one unsupported line');
  assert.match(unsupportedLines[0], new RegExp(MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  // the supported candidate produces no marker line
  assert.ok(!roster.some((l) => l.includes('gsd-help') && l.includes(MARKER)));
});

test('the unsupported candidate is OMITTED from the loadable (supported) set', () => {
  const candidates = [
    { name: 'gsd-help', requires: [] },
    { name: 'gsd-parallel-thing', requires: ['isolatedSubagents'] },
  ];
  const supported = candidates.filter((c) => adapter.gateArtifact(c, bobDecl).supported);
  const names = supported.map((c) => c.name);
  assert.ok(names.includes('gsd-help'));
  assert.ok(!names.includes('gsd-parallel-thing'));
});

test('gateArtifact is exported from bob-adapter', () => {
  assert.equal(typeof adapter.gateArtifact, 'function');
});

// TRANS-04 (WR-04): a null/malformed candidate must NEVER be admitted as supported,
// and a nameless candidate must never corrupt the roster as an `undefined:` line.
test('gateArtifact(null) is excluded (supported:false) with a concrete reason, not {supported:true}', () => {
  const res = adapter.gateArtifact(null, bobDecl);
  assert.equal(res.supported, false);
  assert.ok(typeof res.reason === 'string' && res.reason.length > 0, 'concrete reason present');
});

test('gateArtifact on a nameless candidate is excluded with a concrete reason', () => {
  const res = adapter.gateArtifact({ requires: ['structuredPrompts'] }, bobDecl);
  assert.equal(res.supported, false);
  assert.ok(typeof res.reason === 'string' && res.reason.length > 0, 'concrete reason present');
});

test('buildSupportRoster never emits a malformed undefined-prefixed line', () => {
  // Build the forbidden token programmatically so this test file cannot self-trip it.
  const undefinedPrefix = ['undefined', ':'].join('');
  const candidates = [
    { name: 'gsd-help', requires: [] },
    { requires: ['isolatedSubagents'] }, // nameless, also unsupported
    null, // malformed
  ];
  const roster = adapter.buildSupportRoster(candidates, bobDecl);
  assert.ok(Array.isArray(roster), 'roster is an array');
  assert.ok(!roster.some((l) => l.includes(undefinedPrefix)), 'no malformed undefined: line');
});
