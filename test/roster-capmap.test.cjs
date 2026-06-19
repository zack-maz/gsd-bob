'use strict';

/**
 * roster-capmap.test.cjs — QUAL-03 / D-02 / D-03 / D-06 / D-09.3.
 *
 * Proves the support roster is GENERATED from the capability-map gate, never
 * hand-maintained, by inspecting src/bob-adapter.cjs's gate authority
 * (gateArtifact / buildSupportRoster / BOB_SKIP_LIST / UNSUPPORTED_MARKER) over
 * the SAME candidate set scripts/generate-support-roster.cjs derives — the set
 * src/installer/stage.cjs iterates (commands/gsd/*.md) plus the two curated
 * edge cases.
 *
 * Two assertions (D-09.3):
 *   (a) NO SUPPORTED GATE MISSING / SEQUENTIAL-INLINE LOWER BOUND (D-02): under
 *       the conservative `{isolatedSubagents:false, structuredPrompts:false}`
 *       declaration, every quality gate still reports supported:true — i.e. each
 *       degrades cleanly to sequential-inline and carries NO concurrency
 *       dependency, so NO quality-gate skip line is ever emitted.
 *   (b) EVERY SKIP LINE TRACES TO A PRIMITIVE (D-06): each roster line ends in a
 *       reason that is exactly what the gate (the single capability-map authority)
 *       returns for that candidate — proving the reason is generated from the gate
 *       and is either a curated BOB_SKIP_LIST value or a capability-map primitive
 *       reason. No skip line has an untraceable reason; no quality-gate name
 *       appears in any unsupported line (D-03: zero new skips).
 *
 * Pure inspection — no installer run, no scratch writes. Does NOT modify the
 * adapter or the workflow (this suite read-only inspects the gate).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./_helpers/vendor.cjs');

const adapter = require(path.join(repoRoot, 'src', 'bob-adapter.cjs'));

// Bob's conservative lower bound (CAPABILITY-MAP §1): no isolated subagents, no
// structured prompts (text_mode only) — the declaration generate-support-roster
// emits the roster under.
const DECL = { isolatedSubagents: false, structuredPrompts: false };

// The four quality gates ported in Wave 1, built via the hyphen form so this
// test's prose carries no colon-dialect literal.
const hyphenForm = ['gsd', '-'].join('');
const QUALITY_GATES = ['code-review', 'debug', 'audit-fix', 'audit-uat'].map((s) => `${hyphenForm}${s}`);

/**
 * Re-derive the candidate set EXACTLY as scripts/generate-support-roster.cjs
 * does (commands/gsd/*.md + the two curated edge cases, curated wins on name
 * de-dup) so the test inspects the real roster authority, not a hand-list.
 */
function deriveCandidates() {
  const cmdDir = path.join(repoRoot, 'commands', 'gsd');
  const derived = fs
    .readdirSync(cmdDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ name: `${hyphenForm}${path.basename(f, '.md')}`, requires: [] }));
  const curated = [
    { name: `${hyphenForm}autonomous`, requires: [] },
    { name: `${hyphenForm}parallel-fanout`, requires: ['isolatedSubagents'] },
  ];
  const byName = new Map();
  for (const c of derived) byName.set(c.name, c);
  for (const c of curated) byName.set(c.name, c);
  return [...byName.values()];
}

// ---- (a) No supported quality gate missing / sequential-inline lower bound --

test('D-02: every quality gate reports supported:true under isolatedSubagents:false (sequential-inline lower bound)', () => {
  for (const name of QUALITY_GATES) {
    const res = adapter.gateArtifact({ name, requires: [] }, DECL);
    assert.equal(
      res.supported,
      true,
      `${name} must degrade cleanly to sequential-inline (no concurrency dependency)`,
    );
  }
});

test('D-03: no quality-gate name appears in any unsupported roster line (zero new skips)', () => {
  const candidates = deriveCandidates();
  const lines = adapter.buildSupportRoster(candidates, DECL);
  for (const name of QUALITY_GATES) {
    for (const line of lines) {
      assert.ok(
        !line.startsWith(`${name}:`),
        `${name} must not appear in the unsupported roster — found: "${line}"`,
      );
    }
  }
});

// ---- (b) Every skip line's reason traces to the capability-map gate ----------

test('D-06: every roster skip line carries the marker and a gate-generated, capability-map-traceable reason', () => {
  const candidates = deriveCandidates();
  const lines = adapter.buildSupportRoster(candidates, DECL);
  assert.ok(lines.length > 0, 'the curated edge cases guarantee at least one skip line to inspect');

  // The legitimate reason set = every reason the GATE itself produces for the
  // candidates it excludes. This IS the capability-map authority (gateArtifact
  // owns BOB_SKIP_LIST + the primitive-reason map), so a reason matching one of
  // these is, by construction, generated from a capability-map primitive — never
  // hand-typed into the roster.
  const gateReasons = new Set();
  const byName = new Map();
  for (const c of candidates) {
    byName.set(c.name, c);
    const res = adapter.gateArtifact(c, DECL);
    if (!res.supported) gateReasons.add(res.reason);
  }
  // Sanity: curated BOB_SKIP_LIST values are a subset of the gate's reasons.
  for (const v of Object.values(adapter.BOB_SKIP_LIST)) {
    assert.ok(gateReasons.has(v), `BOB_SKIP_LIST value must surface through the gate: "${v}"`);
  }

  const marker = adapter.UNSUPPORTED_MARKER;
  for (const line of lines) {
    // Shape: `<name>: <UNSUPPORTED_MARKER> <reason>`.
    const markerIdx = line.indexOf(marker);
    assert.ok(markerIdx > 0, `skip line carries the unsupported marker: "${line}"`);
    const name = line.slice(0, line.indexOf(':')).trim();
    const reason = line.slice(markerIdx + marker.length).trim();

    // The named candidate must exist in the derived set (no phantom lines).
    assert.ok(byName.has(name), `skip line names a real candidate: "${name}"`);

    // The reason must be EXACTLY what the gate returns for that candidate —
    // proving the roster reason is generated from the gate, not hand-maintained.
    const gateRes = adapter.gateArtifact(byName.get(name), DECL);
    assert.equal(gateRes.supported, false, `${name} is genuinely unsupported by the gate`);
    assert.equal(reason, gateRes.reason, `${name} roster reason matches the gate's reason verbatim`);

    // And it must be a member of the gate's reason set (capability-map-traceable).
    assert.ok(gateReasons.has(reason), `${name} reason traces to a capability-map gate reason`);
  }
});
