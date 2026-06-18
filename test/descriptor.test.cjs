'use strict';

/**
 * descriptor.test.cjs — RUNTIME-01 (config-home resolution) + RUNTIME-02
 * (data-only bob runtime descriptor) coverage.
 *
 * Hermetic: injects env/home directly into resolveConfigHomeFromDescriptor
 * (no real filesystem, no live Bob). Exercises the VENDORED registry copy via
 * test/_helpers/vendor.cjs so it proves the extended (bob-carrying) registry,
 * not the global install.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

const { requireVendor } = require('./_helpers/vendor.cjs');

const { resolveConfigHomeFromDescriptor } = requireVendor('runtime-homes.cjs');
const { runtimes } = requireVendor('capability-registry.cjs');
const { resolveInstallPlan } = requireVendor('runtime-config-adapter-registry.cjs');

const bobDescriptor = { kind: 'dot-home', name: '.bob', env: ['BOB_CONFIG_DIR'] };

test('RUNTIME-01: bob descriptor resolves to ~/.bob by default (leading dot preserved)', () => {
  const resolved = resolveConfigHomeFromDescriptor(bobDescriptor, { env: {}, home: '/home/u' });
  assert.equal(resolved, path.join('/home/u', '.bob'));
  assert.equal(resolved, '/home/u/.bob');
});

test('RUNTIME-01: BOB_CONFIG_DIR env override wins over the default home', () => {
  const resolved = resolveConfigHomeFromDescriptor(bobDescriptor, {
    env: { BOB_CONFIG_DIR: '/tmp/x' },
    home: '/home/u',
  });
  assert.equal(resolved, '/tmp/x');
});

test('RUNTIME-01: BOB_CONFIG_DIR with a leading tilde is expanded to a home-anchored path', () => {
  // gsd-core's dot-home branch expands a leading "~/" via expandTilde, which
  // uses os.homedir() (NOT the injected `home`). Assert tilde expansion against
  // the real homedir — the env value's "~/" must resolve under $HOME, not stay literal.
  const resolved = resolveConfigHomeFromDescriptor(bobDescriptor, {
    env: { BOB_CONFIG_DIR: '~/cbob' },
    home: '/home/u',
  });
  assert.equal(resolved, path.join(os.homedir(), 'cbob'));
  assert.ok(!resolved.startsWith('~'), 'leading tilde must be expanded, not left literal');
});

test('RUNTIME-02: the vendored registry exposes a bob runtime', () => {
  assert.ok(runtimes.bob, 'runtimes.bob must exist in the vendored registry');
  assert.equal(runtimes.bob.role, 'runtime');
});

test('RUNTIME-02: bob configHome.name carries the leading dot (Pitfall 1 regression guard)', () => {
  assert.equal(runtimes.bob.runtime.configHome.name, '.bob');
  assert.equal(runtimes.bob.runtime.configHome.kind, 'dot-home');
  assert.equal(runtimes.bob.runtime.configHome.env[0], 'BOB_CONFIG_DIR');
});

test('RUNTIME-02: resolveInstallPlan("bob") does not throw (valid install axes)', () => {
  let plan;
  assert.doesNotThrow(() => {
    plan = resolveInstallPlan('bob');
  });
  assert.equal(plan.installSurface, 'profile-marker-only');
  assert.equal(plan.sandboxTier, 'none');
  assert.equal(plan.hooksSurface, 'none');
});

test('RUNTIME-02: bob configHome resolution also works against the real os.homedir shape', () => {
  // Using the descriptor straight out of the registry (not a hand-built one)
  // proves the registry literal — not just a local copy — resolves correctly.
  const fromRegistry = runtimes.bob.runtime.configHome;
  const resolved = resolveConfigHomeFromDescriptor(fromRegistry, { env: {}, home: os.homedir() });
  assert.equal(resolved, path.join(os.homedir(), '.bob'));
});
