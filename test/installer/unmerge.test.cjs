'use strict';

/**
 * unmerge.test.cjs — D-06 un-merge semantics for the isolated Bob adapter.
 *
 * unmergeCustomModes is the slug-removing sibling of mergeCustomModes (Open
 * Question Q2: un-merge belongs in the adapter so YAML handling stays confined
 * there, never entering the installer's node:fs-only staging path).
 *
 * House style mirrors test/merge.test.cjs: a yaml.load `modesBySlug` helper,
 * `assert.throws(/regex/)` for the fail-loud path, deepEqual on parsed
 * modes-by-slug for preservation/idempotency.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const yaml = require('js-yaml');
const { repoRoot } = require('../_helpers/vendor.cjs');

const adapter = require(path.join(repoRoot, 'src', 'bob-adapter.cjs'));

function modesBySlug(yamlText) {
  const doc = yaml.load(yamlText) || {};
  const out = {};
  for (const m of doc.customModes || []) out[m.slug] = m;
  return out;
}

test('unmerge of empty/undefined/null text never throws and removes nothing', () => {
  for (const empty of ['', undefined, null]) {
    const out = adapter.unmergeCustomModes(empty, ['gsd']);
    const bySlug = modesBySlug(out);
    assert.deepEqual(Object.keys(bySlug), [], 'no modes present after un-merge of empty input');
  }
});

test('unmerge preserves a sole user mode and adds no gsd entry', () => {
  const userOnly = yaml.dump({
    customModes: [{ slug: 'my-mode', name: 'Mine', groups: ['read'] }],
  });
  const out = adapter.unmergeCustomModes(userOnly, ['gsd']);
  const bySlug = modesBySlug(out);
  assert.ok(bySlug['my-mode'], 'user mode intact');
  assert.ok(!bySlug.gsd, 'no gsd entry introduced');
  assert.deepEqual(Object.keys(bySlug), ['my-mode']);
});

test('unmerge removes gsd and gsd-* owned slugs, preserves the user slug', () => {
  const mixed = yaml.dump({
    customModes: [
      { slug: 'my-mode', name: 'Mine', groups: ['read'] },
      { slug: 'gsd', name: 'GSD', groups: ['read', 'edit', 'command', 'mcp'] },
      { slug: 'gsd-legacy', name: 'Legacy', groups: ['read'] },
    ],
  });
  const before = modesBySlug(mixed);
  const out = adapter.unmergeCustomModes(mixed, ['gsd', 'gsd-legacy']);
  const after = modesBySlug(out);
  assert.ok(!after.gsd, 'gsd removed');
  assert.ok(!after['gsd-legacy'], 'gsd-legacy removed');
  assert.ok(after['my-mode'], 'user mode preserved');
  assert.deepEqual(after['my-mode'], before['my-mode']);
  assert.deepEqual(Object.keys(after), ['my-mode']);
});

test('unmerge default (omitted ownedSlugs) removes all isOwnedSlug entries', () => {
  const mixed = yaml.dump({
    customModes: [
      { slug: 'my-mode', name: 'Mine', groups: ['read'] },
      { slug: 'gsd', name: 'GSD', groups: ['command'] },
      { slug: 'gsd-extra', name: 'Extra', groups: ['read'] },
    ],
  });
  const out = adapter.unmergeCustomModes(mixed);
  const after = modesBySlug(out);
  assert.deepEqual(Object.keys(after), ['my-mode'], 'all owned slugs gone by default');
});

test('unmerge is idempotent (twice parses equal to once)', () => {
  const mixed = yaml.dump({
    customModes: [
      { slug: 'my-mode', name: 'Mine', groups: ['read'] },
      { slug: 'gsd', name: 'GSD', groups: ['command'] },
    ],
  });
  const once = adapter.unmergeCustomModes(mixed, ['gsd']);
  const twice = adapter.unmergeCustomModes(once, ['gsd']);
  assert.deepEqual(modesBySlug(twice), modesBySlug(once));
});

// D-06 / T-03-02: a non-mapping YAML root must FAIL LOUD, mirroring mergeCustomModes —
// never delete the file or silently drop user content.
test('unmerge throws loud on a sequence-root (non-mapping) custom_modes.yaml', () => {
  assert.throws(
    () => adapter.unmergeCustomModes('- one\n- two\n', ['gsd']),
    /mapping|non-mapping|not a mapping/i,
  );
});

test('unmerge throws loud (concrete, not opaque) on a scalar-root custom_modes.yaml', () => {
  assert.throws(
    () => adapter.unmergeCustomModes('just a scalar string', ['gsd']),
    /mapping|non-mapping|not a mapping/i,
  );
});
