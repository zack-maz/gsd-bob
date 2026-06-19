'use strict';

/**
 * quality-gate-contract.test.cjs — QUAL-01 / QUAL-03 (real-installer e2e half).
 *
 * Mirrors test/core-loop-contract.test.cjs: drives the REAL entry
 * (bin/gsd-bob.cjs) against a scratch `.bob` target and asserts the Plan 05-01
 * wiring fires through the actual installer, not just the converter unit.
 *
 * Asserts two structural contracts:
 *
 *   1. COMMAND + SKILL EMISSION — the four quality-gate stems each emit BOTH a
 *      flat command (commands/gsd-<x>.md) and a nested Agent Skill
 *      (skills/gsd-<x>/SKILL.md): code-review, debug, audit-fix, audit-uat.
 *
 *   2. WORKFLOWS STAGED WHOLESALE — the underlying gsd-core/workflows/*.md the
 *      command bodies transitively load are staged verbatim: code-review.md,
 *      code-review-fix.md, debug.md, audit-fix.md, audit-uat.md. code-review-fix
 *      is WORKFLOW-ONLY (the --fix path dispatches it; it is never a command),
 *      so we additionally assert commands/gsd-code-review-fix.md is NOT emitted
 *      (the 05-01 scope correction).
 *
 * All scratch writes go to mkdtempSync temp dirs — never the tracked .planning/.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { repoRoot } = require('./_helpers/vendor.cjs');

const ENTRY = path.join(repoRoot, 'bin', 'gsd-bob.cjs');

// The four quality-gate stems vendored as commands/gsd/*.md in Plan 05-01.
const QUALITY_GATE_COMMANDS = [
  'gsd-code-review',
  'gsd-debug',
  'gsd-audit-fix',
  'gsd-audit-uat',
];

// The workflows reached transitively by the command bodies, staged wholesale
// under gsd-core/workflows/. code-review-fix is the --fix dispatch target.
const STAGED_WORKFLOWS = [
  'code-review.md',
  'code-review-fix.md',
  'debug.md',
  'audit-fix.md',
  'audit-uat.md',
];

function scratch(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gsdbob-${prefix}-`));
}

/** Run the entry with the given args from a scratch cwd; return captured stdout. */
function runEntry(args, cwd) {
  return execFileSync(process.execPath, [ENTRY, ...args], { cwd, encoding: 'utf8' });
}

// ---- Command + skill emission ---------------------------------------------

test('e2e: real installer emits the 4 quality-gate command + skill artifacts', () => {
  const target = path.join(scratch('qg-tgt'), '.bob');
  const cwd = scratch('qg-ws'); // scratch workspace, NO .planning/

  runEntry(['--bob', '--global', '-c', target], cwd);

  for (const name of QUALITY_GATE_COMMANDS) {
    assert.ok(
      fs.existsSync(path.join(target, 'commands', `${name}.md`)),
      `commands/${name}.md emitted by the real entry`,
    );
    assert.ok(
      fs.existsSync(path.join(target, 'skills', name, 'SKILL.md')),
      `skills/${name}/SKILL.md emitted by the real entry`,
    );
  }

  fs.rmSync(path.dirname(target), { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ---- Workflows staged wholesale + code-review-fix is workflow-only ---------

test('e2e: the 5 quality-gate workflows stage wholesale; code-review-fix is workflow-only (not a command)', () => {
  const target = path.join(scratch('qg-tgt'), '.bob');
  const cwd = scratch('qg-ws');

  runEntry(['--bob', '--global', '-c', target], cwd);

  for (const wf of STAGED_WORKFLOWS) {
    assert.ok(
      fs.existsSync(path.join(target, 'gsd-core', 'workflows', wf)),
      `gsd-core/workflows/${wf} staged wholesale`,
    );
  }

  // code-review-fix is reached transitively by code-review's --fix path; it is a
  // WORKFLOW, never a slash command (05-01 scope correction).
  assert.ok(
    !fs.existsSync(path.join(target, 'commands', 'gsd-code-review-fix.md')),
    'code-review-fix is a workflow, not a .bob command',
  );

  fs.rmSync(path.dirname(target), { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});
