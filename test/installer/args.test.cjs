'use strict';

/**
 * args.test.cjs — INSTALL-02 (flag contract) coverage for src/installer/args.cjs.
 *
 * Locks the gsd-core-mirrored flag set, the null-scope-for-prompt default, and
 * the no-`--clean`/`--update` negative gate. Pure transform: no env, no fs.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs } = require('../../src/installer/args.cjs');

test('INSTALL-02: --local resolves scope=local with all defaults off', () => {
  assert.deepEqual(parseArgs(['--bob', '--local']), {
    scope: 'local',
    explicitDir: undefined,
    dryRun: false,
    uninstall: false,
    help: false,
  });
});

test('INSTALL-02: -g and --global both resolve scope=global', () => {
  assert.equal(parseArgs(['--bob', '-g']).scope, 'global');
  assert.equal(parseArgs(['--bob', '--global']).scope, 'global');
  assert.equal(parseArgs(['--bob', '-l']).scope, 'local');
});

test('INSTALL-02: no scope flag → scope=null (signals the interactive prompt)', () => {
  assert.equal(parseArgs(['--bob']).scope, null);
});

test('INSTALL-02: -c and --config-dir consume the next token as explicitDir', () => {
  assert.equal(parseArgs(['--bob', '-c', '/tmp/x']).explicitDir, '/tmp/x');
  assert.equal(parseArgs(['--config-dir', '/tmp/x']).explicitDir, '/tmp/x');
});

test('INSTALL-02: -u/--uninstall, --dry-run, --help/-h set their flags', () => {
  assert.equal(parseArgs(['--bob', '-u']).uninstall, true);
  assert.equal(parseArgs(['--bob', '--uninstall']).uninstall, true);
  assert.equal(parseArgs(['--bob', '--dry-run']).dryRun, true);
  assert.equal(parseArgs(['--help']).help, true);
  assert.equal(parseArgs(['-h']).help, true);
});

test('INSTALL-02: --clean is rejected as an unknown flag (no such flag exists)', () => {
  assert.throws(() => parseArgs(['--bob', '--clean']), /--clean/);
});

test('INSTALL-02: --update is rejected as an unknown flag (re-run = update)', () => {
  assert.throws(() => parseArgs(['--bob', '--update']), /--update/);
});

test('INSTALL-02: a junk flag is rejected with a concrete error naming it', () => {
  assert.throws(() => parseArgs(['--bob', '--frobnicate']), /--frobnicate/);
});

test('INSTALL-02: -c with no following token throws naming the flag', () => {
  assert.throws(() => parseArgs(['--bob', '-c']), /-c|config-dir/);
});
