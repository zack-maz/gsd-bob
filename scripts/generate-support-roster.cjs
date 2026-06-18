#!/usr/bin/env node
'use strict';

/**
 * generate-support-roster.cjs — emit SUPPORT-ROSTER.md from the bob-adapter gate.
 *
 * The roster is GENERATED from `gateArtifact`/`buildSupportRoster` in
 * src/bob-adapter.cjs, never hand-maintained (T-02-10): a stale/silent roster
 * would hide a parity gap. The installer/emitter regenerates it for the full
 * skill set in Phases 4-5; for Phase 2 it proves the mechanism on a
 * representative candidate set.
 *
 * Each unsupported candidate is recorded as a loud `unsupported on Bob: <reason>`
 * line (D-10). Run: `node scripts/generate-support-roster.cjs`.
 */

const fs = require('node:fs');
const path = require('node:path');

const adapter = require(path.join(__dirname, '..', 'src', 'bob-adapter.cjs'));

// Bob's conservative lower bound (CAPABILITY-MAP §1): no isolated subagents, no
// structured prompts (text_mode only). The full capability declaration is owned
// by the installer in Phase 3; this is the representative Phase-2 declaration.
const bobCapabilityDecl = { isolatedSubagents: false, structuredPrompts: false };

// Representative candidate set proving the gate mechanism for Phase 2. Full-roster
// generation across every GSD skill rides with Phases 4-5 (per RESEARCH).
const candidates = [
  { name: 'gsd-help', requires: [] },
  { name: 'gsd-plan-phase', requires: [] },
  { name: 'gsd-execute-phase', requires: [] },
  // Curated skip-list entry — a hard dependency skill metadata cannot self-describe.
  { name: 'gsd-autonomous', requires: [] },
  // Unmet hard dependency — requires a primitive Bob lacks (isolated subagents).
  { name: 'gsd-parallel-fanout', requires: ['isolatedSubagents'] },
];

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
> **Scope:** Phase 2 proves the mechanism on a representative candidate set; full-roster
> generation across the whole GSD skill set rides with Phases 4-5.
`;

const supportedSection = supported.length
  ? supported.map((n) => `- ${n}`).join('\n')
  : '_(none in the representative set)_';

const unsupportedSection = unsupportedLines.length
  ? unsupportedLines.map((l) => `- ${l}`).join('\n')
  : '_(none unsupported in the representative set)_';

const body = `
## Supported (emitted to \`.bob/commands\` / \`.bob/skills\`)

${supportedSection}

## Unsupported on Bob (omitted from the loadable set, recorded loud)

${unsupportedSection}
`;

const outPath = path.join(__dirname, '..', 'SUPPORT-ROSTER.md');
fs.writeFileSync(outPath, `${header}${body}`);
process.stdout.write(`wrote ${outPath} (${unsupportedLines.length} unsupported, ${supported.length} supported)\n`);
