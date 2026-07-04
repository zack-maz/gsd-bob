'use strict';

/**
 * model-neutrality.test.cjs — NEUTRAL-01 / NEUTRAL-02 / NEUTRAL-03.
 *
 * The durable zero-literal invariant for the Bob-native artifacts gsd-bob EMITS
 * THROUGH ITS CONVERTERS. Four groups:
 *   (a) UNIT      — neutralizeModelReferences before/after over payload-shaped
 *                   samples (tier rewrite, directive strip, vendor-id pre-collapse,
 *                   peer-CLI allowlist). NEUTRAL-01/02.
 *   (b) WIRING    — a seeded source carrying inline tier prose + a directive line,
 *                   staged through the REAL stage.cjs seam, emerges neutral —
 *                   proving the post-pass runs in the converter+stage path.
 *   (c) INVARIANT — the FULL real emission (repoRoot = pkgRoot) is scanned; ONLY
 *                   commands/ + skills/ (NEVER gsd-core/, D-01/Pitfall 3); fails
 *                   loud listing every file:line:token. NEUTRAL-03.
 *   (d) SELF-CHECK — the shared regex SOURCE constants are non-empty so the scan
 *                   can never vacuously pass.
 *
 * The suite NEVER hardcodes the tier tokens — it reuses the shared SOURCE via
 * scanModelLiterals and derives sample tokens from MODEL_TIER_REPLACEMENTS keys
 * (D-03: one source of truth). It reuses stage.test.cjs's scratch-tmpdir harness
 * rather than re-implementing emission.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { repoRoot: pkgRoot } = require('./_helpers/vendor.cjs');

const { stage } = require(path.join(pkgRoot, 'src', 'installer', 'stage.cjs'));
const { newReport } = require(path.join(pkgRoot, 'src', 'installer', 'report.cjs'));
const manifestMod = require(path.join(pkgRoot, 'src', 'installer', 'manifest.cjs'));
const {
  neutralizeModelReferences,
  scanModelLiterals,
  MODEL_TIER_REPLACEMENTS,
  MODEL_TIER_RE_SOURCE,
  MODEL_DIRECTIVE_RE_SOURCE,
} = require(path.join(pkgRoot, 'src', 'bob-adapter.cjs'));

// Sample tier token + its neutral wording, derived from the shared map so this
// file carries no bare brand literal (D-03 single-source).
const [SAMPLE_TIER, SAMPLE_NEUTRAL] = Object.entries(MODEL_TIER_REPLACEMENTS)[0];

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

/** Recursively list every FILE under `dir` as a path relative to `dir`. */
function listFilesRel(dir) {
  const out = [];
  const walk = (abs, rel) => {
    for (const name of fs.readdirSync(abs)) {
      const childAbs = path.join(abs, name);
      const childRel = rel ? path.join(rel, name) : name;
      if (fs.statSync(childAbs).isDirectory()) walk(childAbs, childRel);
      else out.push(childRel);
    }
  };
  walk(dir, '');
  return out;
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
  return {
    target,
    scope: 'local',
    workspaceRoot,
    dryRun: false,
    manifest: overrides.manifest || freshManifest(target),
    report: overrides.report || newReport(),
    repoRoot: overrides.repoRoot || pkgRoot,
    ...overrides,
  };
}

/**
 * Build a fixture PACKAGE root that symlinks the real vendored tree (so the
 * converter's transitive requires resolve), then seed a commands/gsd/<stem>.md
 * whose BODY inlines a tier-prose mention AND a model-directive line — the exact
 * regression the post-pass must catch. Returns the sample stem.
 */
function seedModelSource(stem) {
  const root = scratch('repo');
  for (const link of ['gsd-core', 'scripts', 'package.json']) {
    fs.symlinkSync(path.join(pkgRoot, link), path.join(root, link));
  }
  const dir = path.join(root, 'commands', 'gsd');
  fs.mkdirSync(dir, { recursive: true });
  const content = [
    '---',
    `name: gsd-${stem}`,
    `description: Demo ${stem} command for the neutrality wiring test`,
    'argument-hint: <topic>',
    '---',
    '',
    `# ${stem}`,
    '',
    `Prefer ${SAMPLE_TIER} for the deep-analysis step of ${stem}.`,
    `model: ${SAMPLE_TIER}`,
    'effort: high',
    'Then continue.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, `${stem}.md`), content, 'utf8');
  return { repoRoot: root, stem };
}

// ---- (a) UNIT — NEUTRAL-01/02 -----------------------------------------------

test('NEUTRAL-02: inline tier prose is rewritten to capability-neutral wording (before/after)', () => {
  assert.equal(
    neutralizeModelReferences(`Use ${SAMPLE_TIER} for deep analysis.`),
    `Use ${SAMPLE_NEUTRAL} for deep analysis.`,
  );
  // Case-insensitive: an upper-cased tier prose still rewrites, brand gone.
  const upper = SAMPLE_TIER.charAt(0).toUpperCase() + SAMPLE_TIER.slice(1);
  assert.equal(
    neutralizeModelReferences(`Prefer ${upper} here.`),
    `Prefer ${SAMPLE_NEUTRAL} here.`,
  );
});

test('NEUTRAL-01: a residual model-directive line is stripped entirely (defense-in-depth)', () => {
  assert.equal(neutralizeModelReferences(`model: ${SAMPLE_TIER}\neffort: high\nbody`), 'body');
  // A line-anchored config key is stripped; an inline PROSE mention is untouched.
  assert.equal(neutralizeModelReferences('model_profile: balanced\nkeep'), 'keep');
  assert.equal(
    neutralizeModelReferences('set the model_profile in config'),
    'set the model_profile in config',
  );
});

test('NEUTRAL-02 (Pitfall 1): a vendor-prefixed model id collapses cleanly, no mangled inner token', () => {
  const id = ['vendorx', SAMPLE_TIER, '4', '1'].join('-');
  assert.equal(neutralizeModelReferences(`Runs on ${id} today.`), 'Runs on the configured model today.');
  // No mangled residue like "vendorx-a higher-capability model-4-1".
  assert.ok(!neutralizeModelReferences(`Runs on ${id} today.`).includes(SAMPLE_NEUTRAL));
});

test('NEUTRAL-02/03 (WR-01): a date-infixed vendor id collapses cleanly AND the detector flags any survivor', () => {
  // A real dated model-id shape: a version segment BETWEEN the vendor prefix and
  // the tier token (e.g. `vendorx-3-<tier>-20240229`) — the pre-fix blind spot.
  // `vendorx` is a synthetic stand-in so this file carries no bare brand literal.
  const vendor = 'vendorx';
  const dated = [vendor, '3', SAMPLE_TIER, '20240229'].join('-');

  // (1) Rewrite parity: the WHOLE id collapses. Pre-fix, MODEL_ID_RE missed this
  //     shape, so step 3 rewrote only the inner tier and left a mangled residue
  //     (`vendorx-3-<neutral>-20240229`) with the vendor brand still surviving.
  const out = neutralizeModelReferences(`Runs on ${dated} today.`);
  assert.equal(out, 'Runs on the configured model today.');
  assert.ok(!out.includes(vendor), 'no surviving vendor brand in the rewritten output');
  assert.ok(!out.includes(SAMPLE_NEUTRAL), 'no mangled inner-tier residue');
  assert.deepEqual(scanModelLiterals(out), [], 'the rewritten output scans clean');

  // (2) Detector parity (the important half): if the id ever SURVIVES un-rewritten
  //     (a rewrite regression), scanModelLiterals must flag it AS THE FULL ID —
  //     not just the inner tier the pre-fix detector happened to catch. Pre-fix,
  //     the detector had no id shape at all, so the mangled residue scanned as [].
  const hits = scanModelLiterals(`Runs on ${dated} today.`);
  assert.ok(
    hits.some((h) => h.token === dated),
    'scanModelLiterals must report the full vendor-prefixed id (rewrite/detector parity)',
  );
});

test('allowlist: peer-AI CLI reviewer flags are left untouched (tier-scoped regex)', () => {
  const flags = 'run --opencode --gemini --codex --ollama';
  assert.equal(neutralizeModelReferences(flags), flags);
  assert.deepEqual(scanModelLiterals(flags), []);
});

test('scanModelLiterals: clean text -> []; a tier mention -> one hit with 1-based line', () => {
  assert.deepEqual(scanModelLiterals('clean text\nmore'), []);
  const hits = scanModelLiterals(`line one\nhas ${SAMPLE_TIER} here`);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 2);
  assert.equal(hits[0].token.toLowerCase(), SAMPLE_TIER.toLowerCase());
});

test('idempotence: a second neutralization pass is a no-op', () => {
  const id = ['vendorx', SAMPLE_TIER, '4'].join('-');
  const sample = `Use ${SAMPLE_TIER} and ${id}\nmodel: ${SAMPLE_TIER}\ntail`;
  const once = neutralizeModelReferences(sample);
  assert.equal(neutralizeModelReferences(once), once);
  assert.deepEqual(scanModelLiterals(once), []);
});

// ---- (b) WIRING — NEUTRAL-01/02 end-to-end through the converter+stage seam --

test('WIRING: a seeded tier-prose + directive source emerges neutral through stage.cjs', () => {
  const { repoRoot, stem } = seedModelSource('demo');
  const opts = baseOpts({ repoRoot });
  stage(opts);

  const emitted = [
    path.join('commands', `gsd-${stem}.md`),
    path.join('skills', `gsd-${stem}`, 'SKILL.md'),
  ];
  for (const rel of emitted) {
    const abs = path.join(opts.target, rel);
    assert.ok(fs.existsSync(abs), `${rel} emitted`);
    const out = fs.readFileSync(abs, 'utf8');
    const hits = scanModelLiterals(out).map((h) => `${rel}:${h.line}:${h.token}`);
    assert.deepEqual(hits, [], `${rel} must be neutral; found:\n${hits.join('\n')}`);
    assert.ok(out.includes(SAMPLE_NEUTRAL), `${rel} carries the capability-neutral wording`);
  }
});

// ---- (c) INVARIANT — NEUTRAL-03 over the FULL real emission ------------------

test('NEUTRAL-03: the full emitted .bob/ converted set contains ZERO model literals', () => {
  const target = scratch('target');
  const opts = baseOpts({ target, repoRoot: pkgRoot });
  stage(opts);

  const hits = [];
  for (const root of ['commands', 'skills']) {
    const rootAbs = path.join(target, root);
    if (!fs.existsSync(rootAbs)) continue;
    for (const rel of listFilesRel(rootAbs)) {
      // D-01 / Pitfall 3: only the gsd- converted artifacts; NEVER gsd-core/**.
      const base = path.basename(rel);
      const parent = path.basename(path.dirname(rel));
      if (!base.startsWith('gsd-') && !parent.startsWith('gsd-')) continue;
      const abs = path.join(rootAbs, rel);
      for (const h of scanModelLiterals(fs.readFileSync(abs, 'utf8'))) {
        hits.push(`${path.join(root, rel)}:${h.line}:${h.token}`);
      }
    }
  }
  assert.deepEqual(
    hits,
    [],
    `emitted .bob/ converted set must contain ZERO model literals; found:\n${hits.join('\n')}`,
  );
});

// ---- (d) SELF-CHECK — the shared regex sources are non-empty ------------------

test('NEUTRAL-03 self-check: the shared regex SOURCE constants are non-empty strings', () => {
  assert.equal(typeof MODEL_TIER_RE_SOURCE, 'string');
  assert.ok(MODEL_TIER_RE_SOURCE.length > 0);
  assert.equal(typeof MODEL_DIRECTIVE_RE_SOURCE, 'string');
  assert.ok(MODEL_DIRECTIVE_RE_SOURCE.length > 0);
});
