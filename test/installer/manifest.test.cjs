'use strict';

/**
 * manifest.test.cjs — INSTALL-05 manifest primitive (D-01..D-05).
 *
 * The manifest is the SOLE source of truth (D-03): classification is driven
 * only by entries[], never by scanning the filesystem to invent entries.
 * Hermetic where it can be; read/write round-trips use a scratch tmpdir.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { repoRoot } = require('../_helpers/vendor.cjs');

const manifest = require(path.join(repoRoot, 'src', 'installer', 'manifest.cjs'));

function scratchHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsdbob-'));
}

test('MANIFEST_FILENAME is the literal dotfile name', () => {
  assert.equal(manifest.MANIFEST_FILENAME, '.gsd-bob-manifest.json');
});

test('sha256 is deterministic and a 64-char hex string', () => {
  const a = manifest.sha256(Buffer.from('abc'));
  const b = manifest.sha256(Buffer.from('abc'));
  assert.equal(a, b, 'stable across calls');
  assert.match(a, /^[0-9a-f]{64}$/, '64-char lowercase hex');
  // Known SHA-256 of "abc".
  assert.equal(a, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('buildManifest returns the D-01 schema object', () => {
  const m = manifest.buildManifest({
    scope: 'local',
    configHome: '/tmp/x/.bob',
    gsdBobVersion: '0.1.0',
    entries: [{ path: 'commands/gsd.md', sha256: 'deadbeef', kind: 'file' }],
  });
  assert.equal(m.schemaVersion, 1);
  assert.equal(m.gsdBobVersion, '0.1.0');
  assert.equal(m.scope, 'local');
  assert.equal(m.configHome, '/tmp/x/.bob');
  assert.match(m.generatedAt, /^\d{4}-\d{2}-\d{2}T.*Z$/, 'ISO generatedAt');
  assert.deepEqual(m.entries, [{ path: 'commands/gsd.md', sha256: 'deadbeef', kind: 'file' }]);
});

test('writeManifest then readManifest round-trips entries[] (ignoring timestamp)', () => {
  const home = scratchHome();
  const entries = [
    { path: 'commands/gsd.md', sha256: manifest.sha256(Buffer.from('one')), kind: 'file' },
    { path: 'settings/custom_modes.yaml', sha256: manifest.sha256(Buffer.from('two')), kind: 'merged' },
  ];
  const built = manifest.buildManifest({
    scope: 'global', configHome: home, gsdBobVersion: '0.1.0', entries,
  });
  manifest.writeManifest(home, built);
  const read = manifest.readManifest(home);
  assert.deepEqual(read.entries, entries);
  assert.equal(read.scope, 'global');
  assert.equal(read.schemaVersion, 1);
});

test('readManifest returns null when the manifest is absent (ENOENT)', () => {
  const home = scratchHome();
  assert.equal(manifest.readManifest(home), null);
});

test('readManifest throws loud on a corrupt/non-JSON manifest (T-03-01)', () => {
  const home = scratchHome();
  fs.writeFileSync(path.join(home, manifest.MANIFEST_FILENAME), '{ this is not json ', 'utf8');
  assert.throws(() => manifest.readManifest(home), /manifest|json|parse/i);
});

test('classifyOnUpdate: missing→rewrite, match→overwrite, differ→skip-warn (D-04)', () => {
  const home = scratchHome();
  const abs = path.join(home, 'tracked.md');
  const bytes = Buffer.from('owned content\n');
  const entry = { path: 'tracked.md', sha256: manifest.sha256(bytes), kind: 'file' };

  assert.equal(manifest.classifyOnUpdate(entry, abs), 'rewrite', 'missing file → rewrite');

  fs.writeFileSync(abs, bytes);
  assert.equal(manifest.classifyOnUpdate(entry, abs), 'overwrite', 'untouched → overwrite');

  fs.writeFileSync(abs, Buffer.from('user edited this\n'));
  assert.equal(manifest.classifyOnUpdate(entry, abs), 'skip-warn', 'user-modified → skip-warn');
});

test('classifyOrphan: match→remove, differ→keep-warn, missing→remove (D-05)', () => {
  const home = scratchHome();
  const abs = path.join(home, 'orphan.md');
  const bytes = Buffer.from('orphan content\n');
  const entry = { path: 'orphan.md', sha256: manifest.sha256(bytes), kind: 'file' };

  assert.equal(manifest.classifyOrphan(entry, abs), 'remove', 'missing → remove (already gone)');

  fs.writeFileSync(abs, bytes);
  assert.equal(manifest.classifyOrphan(entry, abs), 'remove', 'untouched → remove');

  fs.writeFileSync(abs, Buffer.from('user kept editing\n'));
  assert.equal(manifest.classifyOrphan(entry, abs), 'keep-warn', 'user-modified → keep-warn');
});

test('API never invents entries for a path NOT in entries[] (D-03 sole source of truth)', () => {
  const home = scratchHome();
  const entries = [{ path: 'tracked.md', sha256: manifest.sha256(Buffer.from('x')), kind: 'file' }];
  const built = manifest.buildManifest({
    scope: 'local', configHome: home, gsdBobVersion: '0.1.0', entries,
  });
  manifest.writeManifest(home, built);

  // An unrelated user file exists on disk but is absent from entries[].
  const userPath = path.join(home, 'user-untracked.md');
  fs.writeFileSync(userPath, 'user owned, never tracked\n');

  const read = manifest.readManifest(home);
  const trackedPaths = read.entries.map((e) => e.path);
  assert.ok(!trackedPaths.includes('user-untracked.md'), 'untracked path never appears in entries');
  // No exported function scans a directory to discover removable files.
  assert.equal(typeof manifest.scanForRemovable, 'undefined');
});
