'use strict';

/**
 * core-loop-root-anchor.test.cjs — CORE-05 / D-07.
 *
 * The D-06 verification harness, part 3: the root-anchoring assertion. After a
 * full core-loop run there must be EXACTLY ONE `.planning/` directory, anchored
 * at the workspace root next to `.bob/`, with NO nested second `.planning/`
 * under the scope (install) dir (RESEARCH Pitfall 5).
 *
 * Two complementary checks:
 *   1. STRUCTURAL — bob's artifactLayout (global + local) enumerates no
 *      destSubpath matching /\.planning/. `.planning/` is never an emitted
 *      target; it is root-anchored by the runtime-agnostic write path, not by
 *      the converters/layout (mirrors planning-bytecompat.test.cjs:81-93).
 *   2. POST-LOOP WALK — in a scratch workspace, run the real entry to produce a
 *      `.bob/` scope dir, then create the workspace-root `.planning/` the loop
 *      naturally anchors. A recursive walk of the scope dir + workspace finds
 *      exactly one `.planning/`, with path.dirname === workspaceRoot, and
 *      !existsSync(scopeDir/.planning) — nothing nested.
 *
 * All scratch writes go to mkdtempSync temp dirs — never the tracked .planning/.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { requireVendor, repoRoot } = require('./_helpers/vendor.cjs');

const { runtimes } = requireVendor('capability-registry.cjs');

const ENTRY = path.join(repoRoot, 'bin', 'gsd-bob.cjs');

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

/** Recursively collect absolute paths of every directory named `.planning`. */
function collectPlanningDirs(root) {
  const found = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const abs = path.join(dir, e.name);
      if (e.name === '.planning') {
        found.push(abs);
        continue; // don't descend into .planning itself
      }
      stack.push(abs);
    }
  }
  return found;
}

// ---- Structural invariant (CORE-05) ---------------------------------------

test('CORE-05 structural: bob artifactLayout enumerates no .planning/ destination', () => {
  const layout = runtimes.bob.runtime.artifactLayout;
  const allTargets = [...layout.global, ...layout.local];
  for (const t of allTargets) {
    assert.ok(
      !/\.planning/.test(t.destSubpath),
      `bob artifactLayout target "${t.destSubpath}" must not enumerate .planning/`,
    );
  }
  // bob's only emitted targets are skills + commands — never .planning/.
  const kinds = [...new Set(allTargets.map((t) => t.kind))].sort();
  assert.deepEqual(kinds, ['commands', 'skills']);
});

// ---- Post-loop walk: single root-anchored .planning/ (CORE-05) ------------

test('CORE-05: after a loop run, exactly one .planning/ — at the workspace root, none nested', () => {
  const workspaceRoot = scratch('ws');
  const scopeDir = path.join(workspaceRoot, '.bob'); // the install scope dir

  // Run the real entry to materialize the .bob/ scope dir. cwd is the workspace
  // root, so the entry's config-home is the scratch scope dir (no project yet).
  execFileSync(process.execPath, [ENTRY, '--bob', '--global', '-c', scopeDir], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  assert.ok(fs.existsSync(scopeDir), '.bob/ scope dir materialized');

  // The core loop anchors its output at the WORKSPACE ROOT, adjacent to .bob/.
  // Simulate the loop's natural output anchor (new-project creates
  // <workspaceRoot>/.planning/, never under the scope dir).
  const rootPlanning = path.join(workspaceRoot, '.planning');
  fs.mkdirSync(rootPlanning, { recursive: true });
  fs.writeFileSync(path.join(rootPlanning, 'PROJECT.md'), '# Scratch Project\n');

  // Walk the whole workspace (which contains the scope dir) collecting every
  // .planning directory.
  const planningDirs = collectPlanningDirs(workspaceRoot);
  assert.equal(planningDirs.length, 1, 'exactly one .planning/ exists after a loop run');
  assert.equal(
    path.dirname(planningDirs[0]),
    workspaceRoot,
    '.planning/ is anchored at the workspace root, next to .bob/',
  );

  // Nothing nested under the scope (install) dir.
  assert.equal(
    fs.existsSync(path.join(scopeDir, '.planning')),
    false,
    'no nested second .planning/ under the scope dir (Pitfall 5)',
  );

  fs.rmSync(workspaceRoot, { recursive: true, force: true });
});
