#!/usr/bin/env node
'use strict';

/**
 * generate-support-roster.cjs — emit SUPPORT-ROSTER.md from the bob-adapter gate.
 *
 * The roster is GENERATED from `gateArtifact`/`buildSupportRoster` in
 * src/bob-adapter.cjs, never hand-maintained (T-02-10): a stale/silent roster
 * would hide a parity gap. As of Phase 5 the candidate set is DERIVED from the
 * emitted `commands/gsd/*.md` source set — the same source `src/installer/stage.cjs`
 * iterates — so the standalone script and the installer's `renderRoster()` agree
 * and the list cannot drift (full-roster generation, D-06).
 *
 * Each unsupported candidate is recorded as a loud `unsupported on Bob: <reason>`
 * line (D-10). Run: `node scripts/generate-support-roster.cjs`.
 */

const fs = require('node:fs');
const path = require('node:path');

const adapter = require(path.join(__dirname, '..', 'src', 'bob-adapter.cjs'));

// Bob's conservative lower bound (CAPABILITY-MAP §1): Bob HAS isolated subagents;
// the primitive that stays unsupported is parallel subagent fan-out (unverified),
// plus no structured prompts (text_mode only). The full capability declaration is
// owned by the installer in Phase 3; this is the representative Phase-2 declaration.
const bobCapabilityDecl = { parallelSubagentFanout: false, structuredPrompts: false };

// Candidate set DERIVED from `commands/gsd/*.md` — the same source the installer
// iterates (`src/installer/stage.cjs` L239-266) — so the standalone script and the
// installer's `renderRoster()` agree and the list cannot drift (D-06, full-roster).
// Each `<stem>.md` maps to `{ name: 'gsd-' + stem, requires: [] }`.
const commandsDir = path.join(__dirname, '..', 'commands', 'gsd');
const derivedCandidates = fs.existsSync(commandsDir)
  ? fs
      .readdirSync(commandsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ name: `gsd-${path.basename(f, '.md')}`, requires: [] }))
  : [];

// Preserve the single curated edge-case entry that exercises the gate's skip path
// so the roster keeps proving the mechanism:
//   - gsd-parallel-fanout: unmet hard dependency — requires a primitive Bob lacks
//     (parallel subagent fan-out; Bob has isolated subagents but not parallel spawning).
const curatedEdgeCases = [
  { name: 'gsd-parallel-fanout', requires: ['parallelSubagentFanout'] },
];

// De-duplicate by name (curated entries win if a derived source shares the name).
const candidates = (() => {
  const byName = new Map();
  for (const c of derivedCandidates) byName.set(c.name, c);
  for (const c of curatedEdgeCases) byName.set(c.name, c);
  return [...byName.values()];
})();

const supported = candidates
  .filter((c) => adapter.gateArtifact(c, bobCapabilityDecl).supported)
  .map((c) => c.name);
const unsupportedLines = adapter.buildSupportRoster(candidates, bobCapabilityDecl);

const header = `# Bob Support Roster

> **GENERATED — do not hand-edit.** Regenerate with \`node scripts/generate-support-roster.cjs\`.
> This roster is produced from the bob-adapter gate (\`gateArtifact\` / \`buildSupportRoster\`
> in \`src/bob-adapter.cjs\`), not maintained by hand (T-02-10): a stale or silent roster
> would hide a parity gap. Every GSD artifact Bob cannot support is recorded LOUD as an
> \`unsupported on Bob: <reason>\` line so the gap is never silent (D-10, TRANS-04, parity-first).
>
> **Caveat (Pitfall 5 — YAML comment loss):** the idempotent \`custom_modes.yaml\` merge
> re-emits via js-yaml, which DROPS comments on dump. The merge invariant is slug-level
> idempotency (replace-in-place, never duplicate, never touch non-gsd slugs), NOT comment
> fidelity. Any comments a user placed in \`~/.bob/custom_modes.yaml\` are not preserved
> across a gsd-bob merge.
>
> **Scope:** the candidate set is now DERIVED from the emitted \`commands/gsd/*.md\` source
> set (the same source the installer iterates), plus the two curated edge cases that exercise
> the gate's skip paths — full-roster generation (Phase 5, D-06).
`;

const supportedSection = supported.length
  ? supported.map((n) => `- ${n}`).join('\n')
  : '_(none in the candidate set)_';

const unsupportedSection = unsupportedLines.length
  ? unsupportedLines.map((l) => `- ${l}`).join('\n')
  : '_(none unsupported in the candidate set)_';

const body = `
## Supported (emitted to \`.bob/commands\` / \`.bob/skills\`)

${supportedSection}

## Unsupported on Bob (omitted from the loadable set, recorded loud)

${unsupportedSection}
`;

const outPath = path.join(__dirname, '..', 'SUPPORT-ROSTER.md');
fs.writeFileSync(outPath, `${header}${body}`);
process.stdout.write(`wrote ${outPath} (${unsupportedLines.length} unsupported, ${supported.length} supported)\n`);
