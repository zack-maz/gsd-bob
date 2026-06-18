'use strict';

/**
 * config-merge.test.cjs — INSTALL-03 text_mode guarantee (RESEARCH Pattern 3,
 * Pitfall 2: the descriptor does NOT enforce text_mode, this write is the SOLE
 * mechanism). Root-anchored at <workspaceRoot>/.planning/config.json (CORE-05).
 *
 * Hermetic: each case runs against a scratch tmpdir workspaceRoot. The
 * parse-fail case asserts the on-disk bytes are byte-identical before and after
 * the call (never clobber an unparseable user file — D-13 / anti-pattern #22).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { repoRoot } = require('../_helpers/vendor.cjs');

const { mergeTextMode } = require(path.join(repoRoot, 'src', 'installer', 'config-merge.cjs'));

function scratchWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsdbob-cfg-'));
}

function cfgPath(ws) {
  return path.join(ws, '.planning', 'config.json');
}

function seedConfig(ws, raw) {
  fs.mkdirSync(path.join(ws, '.planning'), { recursive: true });
  fs.writeFileSync(cfgPath(ws), raw, 'utf8');
}

test('creates .planning/config.json with workflow.text_mode:true when absent', () => {
  const ws = scratchWorkspace();
  const res = mergeTextMode(ws);
  assert.equal(res.written, true);
  assert.equal(res.path, cfgPath(ws));
  const parsed = JSON.parse(fs.readFileSync(cfgPath(ws), 'utf8'));
  assert.deepEqual(parsed, { workflow: { text_mode: true } });
});

test('preserves user keys and sets workflow.text_mode:true', () => {
  const ws = scratchWorkspace();
  seedConfig(ws, JSON.stringify({ workflow: { granularity: 'coarse' }, other: 1 }, null, 2) + '\n');
  const res = mergeTextMode(ws);
  assert.equal(res.written, true);
  const parsed = JSON.parse(fs.readFileSync(cfgPath(ws), 'utf8'));
  assert.equal(parsed.workflow.granularity, 'coarse', 'user workflow key preserved');
  assert.equal(parsed.workflow.text_mode, true, 'text_mode set');
  assert.equal(parsed.other, 1, 'top-level user key preserved');
});

test('is idempotent — byte-identical output on the second run', () => {
  const ws = scratchWorkspace();
  mergeTextMode(ws);
  const first = fs.readFileSync(cfgPath(ws));
  mergeTextMode(ws);
  const second = fs.readFileSync(cfgPath(ws));
  assert.ok(first.equals(second), 'second run produces byte-identical bytes');
});

test('coerces a non-object workflow into a fresh object before setting text_mode', () => {
  const ws = scratchWorkspace();
  seedConfig(ws, JSON.stringify({ workflow: 'oops', keep: true }) + '\n');
  const res = mergeTextMode(ws);
  assert.equal(res.written, true);
  const parsed = JSON.parse(fs.readFileSync(cfgPath(ws), 'utf8'));
  assert.deepEqual(parsed.workflow, { text_mode: true });
  assert.equal(parsed.keep, true);
});

test('parse failure → warns and leaves the bytes UNCHANGED (never clobber)', () => {
  const ws = scratchWorkspace();
  const broken = '{ this is not json ';
  seedConfig(ws, broken);
  const before = fs.readFileSync(cfgPath(ws));

  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  let res;
  try {
    res = mergeTextMode(ws);
  } finally {
    console.warn = origWarn;
  }

  const after = fs.readFileSync(cfgPath(ws));
  assert.ok(before.equals(after), 'on-disk bytes are byte-identical before/after');
  assert.equal(res.written, false, 'signals nothing was written');
  assert.ok(
    warnings.some((w) => w.includes(cfgPath(ws))),
    'warns naming the offending config path',
  );
});

test('dryRun computes the result but writes nothing to disk', () => {
  const ws = scratchWorkspace();
  const res = mergeTextMode(ws, { dryRun: true });
  assert.equal(res.written, false, 'dryRun does not write');
  assert.equal(fs.existsSync(cfgPath(ws)), false, 'no config.json created on disk');
  assert.ok(res.bytes && res.bytes.includes('text_mode'), 'would-be bytes still computed');
});

test('path is always <workspaceRoot>/.planning/config.json — never under a scope dir', () => {
  const ws = scratchWorkspace();
  const res = mergeTextMode(ws);
  assert.equal(res.path, path.join(ws, '.planning', 'config.json'));
  assert.equal(fs.existsSync(path.join(ws, '.bob')), false, 'never writes under .bob');
});
