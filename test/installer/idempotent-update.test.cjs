'use strict';

/**
 * idempotent-update.test.cjs — INSTALL-04. Re-running the entry updates an
 * existing install idempotently: a pre-seeded user mode survives, the gsd slug
 * count stays exactly 1 (no duplication), an untracked user file is left
 * untouched, and a user-edited copy of a tracked file is reported skipped
 * (collision policy D-04), never clobbered.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { repoRoot } = require('../_helpers/vendor.cjs');

const ENTRY = path.join(repoRoot, 'bin', 'gsd-bob.cjs');
const USER_SEEDED = path.join(repoRoot, 'test', 'fixtures', 'custom_modes', 'user-seeded.yaml');

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

function runEntry(args, cwd) {
  return execFileSync(process.execPath, [ENTRY, ...args], { cwd, encoding: 'utf8' });
}

test('re-run preserves user mode, no gsd duplication, untracked + edited files honored', () => {
  const target = path.join(scratch('tgt'), '.bob');
  const cwd = scratch('ws');
  fs.mkdirSync(target, { recursive: true });

  // Pre-seed a user-authored custom_modes.yaml carrying a `my-mode` slug.
  fs.copyFileSync(USER_SEEDED, path.join(target, 'custom_modes.yaml'));

  // Pre-seed an untracked user file the installer must never touch.
  const userFile = path.join(target, 'user-notes.txt');
  fs.writeFileSync(userFile, 'my private notes', 'utf8');

  // First install.
  runEntry(['--bob', '--global', '-c', target], cwd);

  // Now user-edit a tracked payload file; the second run must skip (not clobber) it.
  const trackedPayload = path.join(target, 'gsd-core', 'bin', 'gsd-tools.cjs');
  assert.ok(fs.existsSync(trackedPayload), 'payload file present after first install');
  const userEdit = '// USER EDIT — must be preserved\n';
  fs.writeFileSync(trackedPayload, userEdit, 'utf8');

  // Second install (re-run = update).
  const out2 = runEntry(['--bob', '--global', '-c', target], cwd);

  const modes = fs.readFileSync(path.join(target, 'custom_modes.yaml'), 'utf8');
  assert.ok(modes.includes('slug: my-mode'), 'user my-mode survives the re-run');
  const gsdCount = (modes.match(/slug: gsd$/gm) || []).length;
  assert.equal(gsdCount, 1, 'gsd slug appears exactly once (no duplication)');

  assert.equal(fs.readFileSync(userFile, 'utf8'), 'my private notes', 'untracked user file untouched');

  assert.equal(
    fs.readFileSync(trackedPayload, 'utf8'),
    userEdit,
    'user-edited tracked file is preserved (skip-warn), not overwritten',
  );
  assert.ok(/Skipped/.test(out2), 'the re-run reports a skipped bucket');
});
