'use strict';

/**
 * manifest-path-safety.test.cjs — CR-01 regression (Phase 3 verification gap).
 *
 * The manifest is the SOLE source of truth (D-03) and is consumed unvalidated by
 * the destructive orphan-sweep (stage.cjs) and uninstall (gsd-bob.cjs) loops. A
 * parseable manifest whose entry path contains `..` (corruption, a partial
 * overwrite, or a manifest carried over from a differently-rooted prior install)
 * must NEVER drive an out-of-root `fs.rmSync`. `path.join(target, entry.path)`
 * does not neutralise `..`, so the "never touch user files / never orphan"
 * promise (SC#4 / INSTALL-05) was defeated by a `../../victim` entry. These tests
 * pin the fix:
 *   1. safeJoin(base, rel) refuses any rel that escapes base (LOUD throw).
 *   2. readManifest throws LOUD on a poisoned manifest (absolute / `..` entry).
 *   3. End-to-end: --uninstall against a poisoned manifest deletes NOTHING
 *      outside the install root and exits non-zero (fail loud).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { repoRoot } = require('../_helpers/vendor.cjs');
const {
  safeJoin,
  readManifest,
  writeManifest,
  buildManifest,
  sha256,
} = require('../../src/installer/manifest.cjs');

const ENTRY = path.join(repoRoot, 'bin', 'gsd-bob.cjs');

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

test('safeJoin returns a contained absolute path for a normal relative entry', () => {
  const base = scratch('safejoin-ok');
  assert.equal(safeJoin(base, 'gsd-core/bin/x.cjs'), path.join(base, 'gsd-core', 'bin', 'x.cjs'));
  // Normalises interior `..` but stays inside the root.
  assert.equal(safeJoin(base, 'a/../b'), path.join(base, 'b'));
});

test('safeJoin refuses a rel path that escapes the install root (CR-01)', () => {
  const base = scratch('safejoin-bad');
  assert.throws(() => safeJoin(base, '../escape.txt'), /escape|containment|CR-01/i);
  assert.throws(() => safeJoin(base, '../../etc/passwd'), /escape|containment|CR-01/i);
  assert.throws(() => safeJoin(base, 'gsd-core/../../escape.txt'), /escape|containment|CR-01/i);
  // An absolute path that points outside the root is refused too.
  assert.throws(() => safeJoin(base, '/etc/passwd'), /escape|containment|CR-01/i);
});

test('readManifest throws LOUD on a manifest entry that escapes the install root (CR-01)', () => {
  const home = scratch('poison');
  const manifest = buildManifest({
    gsdBobVersion: '0.0.0',
    scope: 'global',
    configHome: home,
    entries: [{ path: '../../victim.txt', sha256: 'deadbeef', kind: 'file' }],
  });
  writeManifest(home, manifest);
  assert.throws(() => readManifest(home), /escape|\.\.|absolute|CR-01/i);
});

test('readManifest throws LOUD on an absolute manifest entry path (CR-01)', () => {
  const home = scratch('poison-abs');
  const manifest = buildManifest({
    gsdBobVersion: '0.0.0',
    scope: 'global',
    configHome: home,
    entries: [{ path: '/etc/passwd', sha256: 'deadbeef', kind: 'file' }],
  });
  writeManifest(home, manifest);
  assert.throws(() => readManifest(home), /absolute|escape|CR-01/i);
});

test('readManifest accepts a normal manifest with only contained relative paths', () => {
  const home = scratch('clean');
  const manifest = buildManifest({
    gsdBobVersion: '0.0.0',
    scope: 'global',
    configHome: home,
    entries: [
      { path: 'gsd-core/bin/gsd-tools.cjs', sha256: 'abc', kind: 'file' },
      { path: 'custom_modes.yaml', sha256: 'def', kind: 'merged' },
      { path: '.planning/config.json', sha256: 'ghi', kind: 'merged' },
    ],
  });
  writeManifest(home, manifest);
  const loaded = readManifest(home);
  assert.equal(loaded.entries.length, 3);
});

test('--uninstall with a poisoned `..` manifest deletes NOTHING outside the install root and fails loud (CR-01)', () => {
  const tgtParent = scratch('tgt');
  const target = path.join(tgtParent, '.bob');
  fs.mkdirSync(target, { recursive: true });
  const cwd = scratch('ws');

  // A victim file OUTSIDE the install root (a sibling of .bob).
  const victim = path.join(tgtParent, 'victim-secret.txt');
  fs.writeFileSync(victim, 'do not delete me', 'utf8');
  const victimHash = sha256(fs.readFileSync(victim));

  // Hand-craft a poisoned manifest: an entry whose `..` path resolves to the
  // victim, with a hash matching it (so an unguarded classifyOrphan would say
  // 'remove'). Written directly to the dotfile to bypass any write-side guard.
  const poisoned = buildManifest({
    gsdBobVersion: '0.0.0',
    scope: 'global',
    configHome: target,
    entries: [{ path: path.join('..', 'victim-secret.txt'), sha256: victimHash, kind: 'file' }],
  });
  fs.writeFileSync(
    path.join(target, '.gsd-bob-manifest.json'),
    JSON.stringify(poisoned, null, 2) + '\n',
    'utf8',
  );

  // Run uninstall — it MUST refuse loudly, not delete the victim.
  let threw = false;
  try {
    execFileSync(
      process.execPath,
      [ENTRY, '--bob', '--global', '-c', target, '--uninstall'],
      { cwd, encoding: 'utf8', stdio: 'pipe' },
    );
  } catch {
    threw = true; // non-zero exit = fail loud
  }
  assert.ok(threw, 'uninstall against a poisoned manifest must exit non-zero (fail loud)');
  assert.ok(fs.existsSync(victim), 'victim file OUTSIDE the install root must NOT be deleted (CR-01 containment)');
  assert.equal(fs.readFileSync(victim, 'utf8'), 'do not delete me', 'victim file contents intact');
});
