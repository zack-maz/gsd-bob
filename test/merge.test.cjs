'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { repoRoot } = require('./_helpers/vendor.cjs');

// TRANS-05: idempotent, slug-scoped custom_modes.yaml merge in the isolated adapter.
const adapter = require(path.join(repoRoot, 'src', 'bob-adapter.cjs'));

const seeded = fs.readFileSync(
  path.join(repoRoot, 'test', 'fixtures', 'custom_modes', 'user-seeded.yaml'),
  'utf8',
);

function modesBySlug(yamlText) {
  const doc = yaml.load(yamlText) || {};
  const out = {};
  for (const m of doc.customModes || []) out[m.slug] = m;
  return out;
}

test('emitGsdMode returns the locked gsd mode shape', () => {
  const m = adapter.emitGsdMode();
  assert.equal(m.slug, 'gsd');
  assert.equal(m.name, 'GSD');
  assert.deepEqual(m.groups, ['read', 'edit', 'command', 'mcp']);
  assert.ok(typeof m.roleDefinition === 'string' && m.roleDefinition.length > 0);
  assert.ok(typeof m.whenToUse === 'string' && m.whenToUse.length > 0);
  assert.ok(typeof m.customInstructions === 'string' && m.customInstructions.length > 0);
});

test('groups omit skill and browser (v1 lock)', () => {
  const m = adapter.emitGsdMode();
  assert.ok(!m.groups.includes('skill'));
  assert.ok(!m.groups.includes('browser'));
});

test('merge into empty/undefined text yields a single gsd entry', () => {
  const out = adapter.mergeCustomModes('', adapter.emitGsdMode());
  const bySlug = modesBySlug(out);
  assert.ok(bySlug.gsd, 'gsd present');
  assert.deepEqual(bySlug.gsd.groups, ['read', 'edit', 'command', 'mcp']);
});

test('merge preserves a pre-seeded non-gsd user mode (by parsed entry)', () => {
  const out = adapter.mergeCustomModes(seeded, adapter.emitGsdMode());
  const before = modesBySlug(seeded);
  const after = modesBySlug(out);
  assert.deepEqual(after['my-mode'], before['my-mode']);
});

test('merge replaces (not duplicates) an existing gsd slug', () => {
  const out = adapter.mergeCustomModes(seeded, adapter.emitGsdMode());
  const doc = yaml.load(out) || {};
  const gsdEntries = (doc.customModes || []).filter((m) => m.slug === 'gsd');
  assert.equal(gsdEntries.length, 1);
  // the surviving entry is the FRESH one, not the stale fixture one
  assert.deepEqual(gsdEntries[0].groups, ['read', 'edit', 'command', 'mcp']);
});

test('merge is idempotent (twice parses equal to once)', () => {
  const once = adapter.mergeCustomModes(seeded, adapter.emitGsdMode());
  const twice = adapter.mergeCustomModes(once, adapter.emitGsdMode());
  assert.deepEqual(modesBySlug(twice), modesBySlug(once));
});

test('merge removes a stale gsd-* owned slug matching the entry slug only when slug matches', () => {
  // A gsd-legacy entry has a DIFFERENT slug than the emitted 'gsd', so it is NOT
  // removed (filter is slug-equality scoped, not blanket ownership wipe).
  const withLegacy = yaml.dump({
    customModes: [{ slug: 'gsd-legacy', name: 'Legacy', groups: ['read'] }],
  });
  const out = adapter.mergeCustomModes(withLegacy, adapter.emitGsdMode());
  const bySlug = modesBySlug(out);
  assert.ok(bySlug['gsd-legacy'], 'differently-slugged gsd-* entry retained');
  assert.ok(bySlug.gsd, 'new gsd entry added');
});
