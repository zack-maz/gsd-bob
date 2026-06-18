'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { requireVendor, repoRoot } = require('./_helpers/vendor.cjs');

// TRANS-01: GSD command -> .bob/commands/<name>.md, description+argument-hint only, $ARGUMENTS->$1.
const conv = requireVendor('runtime-artifact-conversion.cjs');

const fixDir = path.join(repoRoot, 'test', 'fixtures', 'command');
const input = fs.readFileSync(path.join(fixDir, 'input.md'), 'utf8');
const expected = fs.readFileSync(path.join(fixDir, 'expected.md'), 'utf8');

test('convertClaudeCommandToBobCommand is exported as a function', () => {
  assert.equal(typeof conv.convertClaudeCommandToBobCommand, 'function');
});

test('command output is byte-identical to the golden expected fixture', () => {
  const out = conv.convertClaudeCommandToBobCommand(input, 'gsd-help');
  assert.equal(out, expected);
});

test('command frontmatter contains ONLY description + argument-hint (unsupported keys stripped)', () => {
  const out = conv.convertClaudeCommandToBobCommand(input, 'gsd-help');
  const fmEnd = out.indexOf('---', 3);
  assert.ok(fmEnd > 0, 'frontmatter block present');
  const fm = out.substring(3, fmEnd);
  assert.match(fm, /^description:/m);
  assert.match(fm, /^argument-hint:/m);
  assert.doesNotMatch(fm, /^effort:/m);
  assert.doesNotMatch(fm, /^allowed-tools:/m);
  assert.doesNotMatch(fm, /^agent:/m);
});

test('$ARGUMENTS in the body is projected to $1', () => {
  const out = conv.convertClaudeCommandToBobCommand(input, 'gsd-help');
  assert.doesNotMatch(out, /\$ARGUMENTS/);
  assert.match(out, /\$1/);
});

test('a command with no source frontmatter still yields well-formed output (no crash)', () => {
  const bare = '# Bare command\n\nDoes $ARGUMENTS get projected? $1\n';
  const out = conv.convertClaudeCommandToBobCommand(bare, 'gsd-bare');
  assert.ok(out.startsWith('---\n'));
  assert.doesNotMatch(out, /\$ARGUMENTS/);
  assert.ok(out.includes('Bare command'));
});
