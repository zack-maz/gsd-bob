'use strict';

/**
 * scope.test.cjs — INSTALL-01 (target resolution) coverage for
 * src/installer/scope.cjs.
 *
 * Mirrors test/descriptor.test.cjs: it requires the vendored resolver via
 * requireVendor('runtime-homes.cjs') to assert the underlying contract, and the
 * integration module src/installer/scope.cjs to prove it CALLS the resolver
 * rather than reimplementing path math. Hermetic where it matters: the -c
 * explicit-dir path is deterministic and env-independent.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

const { requireVendor } = require('../_helpers/vendor.cjs');
const { getGlobalConfigDir } = requireVendor('runtime-homes.cjs');
const { resolveTarget } = require('../../src/installer/scope.cjs');

test('INSTALL-01: local scope is always <cwd>/.bob (never via the descriptor)', () => {
  assert.equal(resolveTarget({ scope: 'local' }), path.join(process.cwd(), '.bob'));
});

test('INSTALL-01: global scope (no -c) delegates to getGlobalConfigDir("bob") → ~/.bob default', () => {
  const resolved = resolveTarget({ scope: 'global', explicitDir: undefined });
  // Equals the resolver's own output, and resolves to ~/.bob in a default env.
  assert.equal(resolved, getGlobalConfigDir('bob', undefined));
  assert.equal(resolved, path.join(os.homedir(), '.bob'));
});

test('INSTALL-01: -c override wins and is returned verbatim (deterministic, env-independent)', () => {
  assert.equal(resolveTarget({ scope: 'global', explicitDir: '/tmp/xbob' }), '/tmp/xbob');
});

test('INSTALL-01: -c with a leading tilde is expanded by the resolver (not left literal)', () => {
  const resolved = resolveTarget({ scope: 'global', explicitDir: '~/cbob' });
  assert.equal(resolved, path.join(os.homedir(), 'cbob'));
  assert.ok(!resolved.startsWith('~'), 'leading tilde must be expanded');
});

test('INSTALL-01: every resolved target is an absolute path string (the value the entry prints)', () => {
  for (const t of [
    resolveTarget({ scope: 'local' }),
    resolveTarget({ scope: 'global', explicitDir: undefined }),
    resolveTarget({ scope: 'global', explicitDir: '/tmp/xbob' }),
  ]) {
    assert.equal(typeof t, 'string');
    assert.ok(path.isAbsolute(t), `${t} must be absolute`);
  }
});
