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

// Bob's conservative lower bound (CAPABILITY-MAP §1): Bob HAS isolated subagents;
// the gated primitive is parallel subagent fan-out (unverified), plus no structured
// prompts (text_mode only).
const bobDecl = { parallelSubagentFanout: false, structuredPrompts: false };

// BUG 1 freeze: emitGsdMode().groups must be a SUBSET of Bob's documented valid
// tool-group set AND must include `execute` (Bob's terminal-command token; Bob has
// NO `command` group). Build the invalid token programmatically so this test file's
// own prose never trips a negative grep on the bare literal.
test('emitGsdMode().groups is a subset of the Bob valid-group set and includes execute', () => {
  const VALID_GROUPS = [
    'read', 'edit', 'execute', 'mcp', 'skill', 'workflow', 'todo', 'subtask', 'subagent', 'mode',
  ];
  const { groups } = adapter.emitGsdMode();
  assert.ok(Array.isArray(groups), 'groups is an array');
  for (const g of groups) {
    assert.ok(VALID_GROUPS.includes(g), `group "${g}" is in Bob's documented valid set`);
  }
  assert.ok(groups.includes('execute'), 'groups includes the execute terminal-command token');
  const invalidToken = ['comm', 'and'].join('');
  assert.ok(!groups.includes(invalidToken), 'groups does not include the invalid legacy token');
});

test('a fully-supported candidate is included with no roster entry', () => {
  const candidate = { name: 'gsd-help', requires: [] };
  const res = adapter.gateArtifact(candidate, bobDecl);
  assert.equal(res.supported, true);
  assert.ok(!res.reason, 'no reason on supported');
});

test('a candidate requiring an unmet hard dependency is excluded with a concrete reason', () => {
  const candidate = { name: 'gsd-parallel-fanout', requires: ['parallelSubagentFanout'] };
  const res = adapter.gateArtifact(candidate, bobDecl);
  assert.equal(res.supported, false);
  assert.ok(typeof res.reason === 'string' && res.reason.length > 0);
  assert.match(res.reason, /parallelSubagentFanout|parallel|fan-?out|subagent/i);
});

test('the curated skip-list mechanism is present and consulted by gateArtifact', () => {
  // BOB_SKIP_LIST is intentionally empty now (Bob supports isolated subagents, so
  // gsd-autonomous is emittable), but the MECHANISM must survive: the adapter still
  // exposes the skip-list object AND gateArtifact still consults it. Prove the
  // mechanism by seeding a throwaway skip entry locally and asserting the gate honors
  // it, without depending on a real curated entry.
  const skipList = adapter.BOB_SKIP_LIST || {};
  assert.equal(typeof skipList, 'object', 'adapter exposes the BOB_SKIP_LIST object');
  const throwaway = '__gsd-throwaway-skip__';
  skipList[throwaway] = 'seeded skip reason';
  try {
    const res = adapter.gateArtifact({ name: throwaway, requires: [] }, bobDecl);
    assert.equal(res.supported, false, 'gateArtifact consults BOB_SKIP_LIST');
    assert.equal(res.reason, 'seeded skip reason');
  } finally {
    delete skipList[throwaway];
  }
});

test('buildSupportRoster emits a loud marker line for each unsupported candidate', () => {
  const candidates = [
    { name: 'gsd-help', requires: [] },
    { name: 'gsd-parallel-fanout', requires: ['parallelSubagentFanout'] },
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
    { name: 'gsd-parallel-fanout', requires: ['parallelSubagentFanout'] },
  ];
  const supported = candidates.filter((c) => adapter.gateArtifact(c, bobDecl).supported);
  const names = supported.map((c) => c.name);
  assert.ok(names.includes('gsd-help'));
  assert.ok(!names.includes('gsd-parallel-fanout'));
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
    { requires: ['parallelSubagentFanout'] }, // nameless, also unsupported
    null, // malformed
  ];
  const roster = adapter.buildSupportRoster(candidates, bobDecl);
  assert.ok(Array.isArray(roster), 'roster is an array');
  assert.ok(!roster.some((l) => l.includes(undefinedPrefix)), 'no malformed undefined: line');
});
