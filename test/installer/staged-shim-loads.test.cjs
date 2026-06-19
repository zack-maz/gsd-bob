'use strict';

/**
 * staged-shim-loads.test.cjs — INSTALL-03 regression: a REAL install must produce
 * a self-sufficient .bob/ layout whose vendored gsd-core shim loads from ANY cwd.
 *
 * Why this exists (the gap the prior suite missed): the vendored gsd-core eagerly
 * requires two SIBLINGS of gsd-core/ (three `../` up from gsd-core/bin/lib/):
 *   - scripts/fix-slash-commands.cjs   (command-roster.cjs:9)
 *   - package.json                     (runtime-artifact-conversion.cjs, pkg.version)
 * The installer staged gsd-core/ but not those siblings, so a real install crashed
 * with `Cannot find module '../../../scripts/fix-slash-commands.cjs'`. Every prior
 * case ran from the dev repo root, where scripts/ + package.json happen to exist,
 * so none caught it. This test ISOLATES the staged shim from the dev repo:
 *   1. drive a REAL install into a fresh mkdtemp .bob target (no hand-placed siblings),
 *   2. run the STAGED shim OUT OF TREE (cwd = a scratch dir, never repoRoot) via
 *      child_process — asserting exit 0 + parseable JSON,
 *   3. assert both staged siblings exist AND are tracked in the written manifest.
 *
 * It fails RED (Cannot find module) against the pre-fix installer and passes GREEN
 * once stage() places both siblings.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { repoRoot } = require('../_helpers/vendor.cjs');

// repoRoot (the dev package root) is the ONLY allowed reference to the dev repo —
// it locates the entry. The STAGED-shim invocation below must NOT see dev-repo
// siblings; its cwd is a clean scratch dir whose ancestry has no scripts/ or
// package.json other than the ones the installer placed under .bob/.
const ENTRY = path.join(repoRoot, 'bin', 'gsd-bob.cjs');
const HEX64 = /^[0-9a-f]{64}$/;

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

/** Run the entry with the given args from a scratch cwd; return captured stdout. */
function runEntry(args, cwd) {
  return execFileSync(process.execPath, [ENTRY, ...args], { cwd, encoding: 'utf8' });
}

test('real install: staged gsd-core shim loads OUT OF TREE (exit 0 + JSON) with both siblings manifest-tracked', () => {
  const target = path.join(scratch('tgt'), '.bob');
  const cwd = scratch('ws'); // distinct scratch workspace, NO .planning/ needed

  // ---- 1. drive a REAL install via the entry (no hand-placed siblings) -------
  runEntry(['--bob', '--global', '-c', target], cwd);

  // ---- 2. both gsd-core siblings were staged -------------------------------
  const scriptsRel = path.join('scripts', 'fix-slash-commands.cjs');
  assert.ok(
    fs.existsSync(path.join(target, scriptsRel)),
    'scripts/fix-slash-commands.cjs staged under .bob/',
  );
  const pkgAbs = path.join(target, 'package.json');
  assert.ok(fs.existsSync(pkgAbs), 'package.json staged under .bob/');
  const pkg = JSON.parse(fs.readFileSync(pkgAbs, 'utf8'));
  assert.equal(pkg.name, '@opengsd/gsd-core', 'package.json stamps the vendored payload name');
  assert.equal(pkg.version, '1.5.0', 'package.json stamps the vendored gsd-core version (not gsd-bob 0.1.0)');

  // ---- 3. both siblings recorded in the WRITTEN manifest --------------------
  const manifest = JSON.parse(
    fs.readFileSync(path.join(target, '.gsd-bob-manifest.json'), 'utf8'),
  );
  const findFile = (p) =>
    manifest.entries.find((e) => e.path === p && e.kind === 'file');
  const scriptsEntry = findFile(scriptsRel);
  const pkgEntry = findFile('package.json');
  assert.ok(scriptsEntry, 'fix-slash-commands.cjs tracked as a file manifest entry');
  assert.match(scriptsEntry.sha256, HEX64, 'fix-slash-commands entry has a 64-hex sha256');
  assert.ok(pkgEntry, 'package.json tracked as a file manifest entry');
  assert.match(pkgEntry.sha256, HEX64, 'package.json entry has a 64-hex sha256');

  // ---- 4. THE OUT-OF-TREE LOAD (the regression) ----------------------------
  // Run the STAGED shim with cwd = the scratch target's parent — a clean mkdtemp
  // dir whose ancestry contains NO scripts/ or package.json except the staged
  // ones under .bob/. NEVER cwd = repoRoot (that is exactly what masked the bug).
  const shimCwd = path.dirname(target);
  const shim = path.join(target, 'gsd-core', 'bin', 'gsd-tools.cjs');
  const res = spawnSync(process.execPath, [shim, 'query', 'state.load'], {
    cwd: shimCwd,
    encoding: 'utf8',
  });

  assert.equal(
    res.status,
    0,
    `staged shim must load out of tree (exit 0); got status=${res.status}\nstderr:\n${res.stderr}`,
  );
  assert.ok(res.stdout && res.stdout.trim().length > 0, 'staged shim emits stdout');
  let parsed;
  assert.doesNotThrow(() => {
    parsed = JSON.parse(res.stdout);
  }, 'staged shim stdout is parseable JSON');
  assert.equal(typeof parsed, 'object', 'parsed shim output is a JSON object');
});
