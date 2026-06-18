'use strict';

/**
 * stage.test.cjs — INSTALL-03 (clean .bob/ layout end-to-end) + INSTALL-04
 * (idempotent re-run preserving user files). Hermetic: every case runs against
 * scratch tmpdir `target` / `workspaceRoot` / fixture `repoRoot`, no live Bob.
 *
 * The repoRoot vs workspaceRoot distinction is load-bearing (T-03-09b): the
 * vendored gsd-core/ payload is copied from repoRoot (the package root), NEVER
 * from cwd/workspaceRoot. The cwd-independence case proves it by pointing all
 * three at distinct scratch dirs.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { repoRoot: pkgRoot } = require('../_helpers/vendor.cjs');

const { stage } = require(path.join(pkgRoot, 'src', 'installer', 'stage.cjs'));
const { newReport } = require(path.join(pkgRoot, 'src', 'installer', 'report.cjs'));
const manifestMod = require(path.join(pkgRoot, 'src', 'installer', 'manifest.cjs'));

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

/**
 * Build a fixture gsd-bob PACKAGE root with a minimal vendored gsd-core/ payload
 * (just enough that <repoRoot>/gsd-core/bin/gsd-tools.cjs exists to be copied).
 */
function fixtureRepoRoot() {
  const root = scratch('repo');
  const binDir = path.join(root, 'gsd-core', 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(path.join(binDir, 'gsd-tools.cjs'), '// vendored payload marker\n', 'utf8');
  return root;
}

function freshManifest(target) {
  return manifestMod.buildManifest({
    scope: 'local',
    configHome: target,
    gsdBobVersion: '0.0.0-test',
    entries: [],
  });
}

function baseOpts(overrides = {}) {
  const target = overrides.target || scratch('target');
  const workspaceRoot = overrides.workspaceRoot || scratch('ws');
  const repoRoot = overrides.repoRoot || fixtureRepoRoot();
  return {
    target,
    scope: 'local',
    workspaceRoot,
    dryRun: false,
    manifest: overrides.manifest || freshManifest(target),
    report: overrides.report || newReport(),
    repoRoot,
    ...overrides,
  };
}

function countSlug(text, slug) {
  const re = new RegExp(`slug:\\s*${slug}(?![\\w-])`, 'g');
  return (text.match(re) || []).length;
}

test('clean stage: custom_modes.yaml (one gsd slug) + payload + roster + manifest entries', () => {
  const opts = baseOpts();
  stage(opts);

  const modesPath = path.join(opts.target, 'custom_modes.yaml');
  assert.ok(fs.existsSync(modesPath), 'custom_modes.yaml exists at the home root');
  const modesText = fs.readFileSync(modesPath, 'utf8');
  assert.equal(countSlug(modesText, 'gsd'), 1, 'exactly one gsd slug');

  assert.ok(
    fs.existsSync(path.join(opts.target, 'gsd-core', 'bin', 'gsd-tools.cjs')),
    'vendored payload copied so gsd-tools.cjs resolves',
  );
  assert.ok(fs.existsSync(path.join(opts.target, 'SUPPORT-ROSTER.md')), 'roster regenerated');

  const kinds = opts.manifest.entries.map((e) => e.kind);
  assert.ok(kinds.includes('merged'), 'manifest has a merged entry (custom_modes.yaml)');
  assert.ok(kinds.includes('file'), 'manifest has file entries (payload/roster)');
  const merged = opts.manifest.entries.find((e) => e.path === 'custom_modes.yaml');
  assert.ok(merged && merged.kind === 'merged', 'custom_modes.yaml tracked as merged');
});

test('repoRoot-sourced payload is cwd-independent (target, workspaceRoot, repoRoot all distinct)', () => {
  const target = scratch('target');
  const workspaceRoot = scratch('ws');
  const repoRoot = fixtureRepoRoot();
  // workspaceRoot has NO gsd-core/ — if stage read the payload from cwd it would fail.
  assert.ok(!fs.existsSync(path.join(workspaceRoot, 'gsd-core')), 'workspaceRoot has no payload');

  const opts = baseOpts({ target, workspaceRoot, repoRoot });
  stage(opts);

  assert.ok(
    fs.existsSync(path.join(target, 'gsd-core', 'bin', 'gsd-tools.cjs')),
    'payload resolves from repoRoot, not cwd/workspaceRoot',
  );
});

test('missing payload at repoRoot fails loud (does not silently stage an empty payload)', () => {
  const repoRoot = scratch('emptyrepo'); // no gsd-core/ inside
  const opts = baseOpts({ repoRoot });
  assert.throws(() => stage(opts), /repoRoot|gsd-core|payload/i);
});

test('idempotent re-run: unchanged custom_modes.yaml re-hashed, gsd slug stays 1', () => {
  const opts = baseOpts();
  stage(opts);
  const firstModes = fs.readFileSync(path.join(opts.target, 'custom_modes.yaml'), 'utf8');

  // Re-run with the SAME manifest (now populated) and a fresh report.
  const opts2 = baseOpts({
    target: opts.target,
    workspaceRoot: opts.workspaceRoot,
    repoRoot: opts.repoRoot,
    manifest: opts.manifest,
    report: newReport(),
  });
  stage(opts2);
  const secondModes = fs.readFileSync(path.join(opts.target, 'custom_modes.yaml'), 'utf8');
  assert.equal(countSlug(secondModes, 'gsd'), 1, 'no duplicate gsd slug after re-run');
  assert.equal(firstModes, secondModes, 'unchanged modes re-emitted byte-identically');
});

test('user-modified tracked file is SKIPPED (hash differs), not clobbered', () => {
  const opts = baseOpts();
  stage(opts);

  // Find a tracked payload file entry and user-edit it.
  const fileEntry = opts.manifest.entries.find(
    (e) => e.kind === 'file' && e.path.includes('gsd-tools.cjs'),
  );
  assert.ok(fileEntry, 'a tracked payload file entry exists');
  const abs = path.join(opts.target, fileEntry.path);
  fs.writeFileSync(abs, '// USER EDITED THIS\n', 'utf8');

  const report = newReport();
  stage(baseOpts({
    target: opts.target,
    workspaceRoot: opts.workspaceRoot,
    repoRoot: opts.repoRoot,
    manifest: opts.manifest,
    report,
  }));

  assert.equal(fs.readFileSync(abs, 'utf8'), '// USER EDITED THIS\n', 'user edit preserved');
  assert.ok(
    report.skipped.some((s) => s.includes('gsd-tools.cjs')),
    'skip recorded in report.skipped',
  );
});

test('pre-seeded user mode is preserved through staging', () => {
  const opts = baseOpts();
  fs.mkdirSync(opts.target, { recursive: true });
  fs.writeFileSync(
    path.join(opts.target, 'custom_modes.yaml'),
    'customModes:\n  - slug: my-mode\n    name: My Mode\n',
    'utf8',
  );
  stage(opts);
  const modesText = fs.readFileSync(path.join(opts.target, 'custom_modes.yaml'), 'utf8');
  assert.ok(modesText.includes('my-mode'), 'user slug preserved');
  assert.equal(countSlug(modesText, 'gsd'), 1, 'gsd slug added exactly once');
});

test('empty convertible roster: no commands/gsd/ source → zero convertible artifacts, no throw', () => {
  // The fixture repoRoot deliberately has NO commands/gsd/ source.
  const opts = baseOpts();
  assert.doesNotThrow(() => stage(opts), 'completes cleanly with an absent convertible source');
  // No skills/commands dirs are required to exist when the source is empty.
  assert.ok(fs.existsSync(path.join(opts.target, 'custom_modes.yaml')), 'structural pieces still staged');
});

test('orphan sweep: hash-match orphan removed + dropped; diverged orphan kept+warned; .planning untouched', () => {
  const opts = baseOpts();
  stage(opts);

  // Inject two orphan 'file' entries into the manifest, both pointing under target.
  const orphanMatchAbs = path.join(opts.target, 'orphan-match.md');
  const orphanDiffAbs = path.join(opts.target, 'orphan-diff.md');
  const matchBytes = Buffer.from('orphan match content\n');
  fs.writeFileSync(orphanMatchAbs, matchBytes);
  fs.writeFileSync(orphanDiffAbs, Buffer.from('orphan content\n'));
  opts.manifest.entries.push({
    path: 'orphan-match.md',
    sha256: manifestMod.sha256(matchBytes),
    kind: 'file',
  });
  opts.manifest.entries.push({
    path: 'orphan-diff.md',
    sha256: manifestMod.sha256(Buffer.from('original content\n')), // differs from disk
    kind: 'file',
  });

  // A .planning dir under target must NEVER be pruned.
  const planningDir = path.join(opts.target, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'keep.md'), 'never prune me\n');

  const report = newReport();
  stage(baseOpts({
    target: opts.target,
    workspaceRoot: opts.workspaceRoot,
    repoRoot: opts.repoRoot,
    manifest: opts.manifest,
    report,
  }));

  assert.ok(!fs.existsSync(orphanMatchAbs), 'hash-match orphan removed');
  assert.ok(
    !opts.manifest.entries.some((e) => e.path === 'orphan-match.md'),
    'removed orphan dropped from entries[]',
  );
  assert.ok(report.removed.some((r) => r.includes('orphan-match.md')), 'recorded in report.removed');

  assert.ok(fs.existsSync(orphanDiffAbs), 'diverged orphan left on disk');
  assert.ok(report.skipped.some((s) => s.includes('orphan-diff.md')), 'diverged orphan warned');

  assert.ok(fs.existsSync(path.join(planningDir, 'keep.md')), '.planning never pruned');
});

test('user-dir prune safety: untracked dir + file under target survive an orphan sweep', () => {
  const opts = baseOpts();
  stage(opts);

  // A user-created, manifest-absent dir + file.
  const userDir = path.join(opts.target, 'my-stuff');
  const userFile = path.join(userDir, 'notes.txt');
  fs.mkdirSync(userDir, { recursive: true });
  fs.writeFileSync(userFile, 'my private notes\n');

  // Inject a removable orphan to force a sweep+prune pass.
  const orphanAbs = path.join(opts.target, 'gone.md');
  const orphanBytes = Buffer.from('gone\n');
  fs.writeFileSync(orphanAbs, orphanBytes);
  opts.manifest.entries.push({
    path: 'gone.md',
    sha256: manifestMod.sha256(orphanBytes),
    kind: 'file',
  });

  stage(baseOpts({
    target: opts.target,
    workspaceRoot: opts.workspaceRoot,
    repoRoot: opts.repoRoot,
    manifest: opts.manifest,
    report: newReport(),
  }));

  assert.ok(fs.existsSync(userDir), 'untracked user dir survives');
  assert.ok(fs.existsSync(userFile), 'untracked user file survives');
  assert.ok(!fs.existsSync(orphanAbs), 'the tracked orphan was still swept');
});

test('dryRun populates report buckets but writes/copies/removes nothing', () => {
  const target = scratch('target');
  const opts = baseOpts({ target, dryRun: true });
  stage(opts);

  assert.equal(fs.existsSync(path.join(target, 'custom_modes.yaml')), false, 'no modes written');
  assert.equal(fs.existsSync(path.join(target, 'gsd-core')), false, 'no payload copied');
  assert.equal(fs.existsSync(path.join(target, 'SUPPORT-ROSTER.md')), false, 'no roster written');
  assert.ok(opts.report.written.length > 0, 'report.written populated with the PLAN');
});
