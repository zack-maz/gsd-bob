#!/usr/bin/env node
'use strict';

/**
 * generate-command-reference.cjs — emit COMMANDS.md from commands/gsd/*.md frontmatter.
 *
 * A per-command reference GENERATED from the emitted `commands/gsd/*.md` source
 * set — the same directory the installer iterates and the source-of-truth for the
 * roster (D-02, generated-not-hand-edited discipline). Each `<stem>.md` maps to an
 * emitted `gsd-<stem>` command whose one-line description is lifted VERBATIM from
 * the source frontmatter `description:` field (never invented). Mirrors
 * `scripts/generate-support-roster.cjs`: directory enumeration, a GENERATED banner,
 * and a fixed `repoRoot`-relative write path (a stem is NEVER interpolated into the
 * write path — path-traversal mitigation, T-10-01).
 *
 * Run: `node scripts/generate-command-reference.cjs`.
 */

const fs = require('node:fs');
const path = require('node:path');

// Candidate set DERIVED from `commands/gsd/*.md` — never a hardcoded name list, so
// the reference cannot drift from what actually emits (D-02, drift-proof spine).
const commandsDir = path.join(__dirname, '..', 'commands', 'gsd');
const stems = fs.existsSync(commandsDir)
  ? fs
      .readdirSync(commandsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.basename(f, '.md'))
      .sort()
  : [];

/**
 * Extract the single-line frontmatter `description:` from a source command file.
 * Slices the frontmatter block (between the first `---` and the next `---`, the
 * same fm-slice idiom as command-expansion.test.cjs) then matches the anchored,
 * linear pattern `^description:\s*(.+)$` (ReDoS-safe, no nested quantifiers).
 */
function extractDescription(stem) {
  const src = fs.readFileSync(path.join(commandsDir, `${stem}.md`), 'utf8');
  const fmEnd = src.indexOf('---', 3);
  const fm = fmEnd > 0 ? src.substring(3, fmEnd) : '';
  const desc = (fm.match(/^description:\s*(.+)$/m) || [])[1];
  return desc ? desc.trim() : '';
}

const rows = stems.map((stem) => {
  const desc = extractDescription(stem);
  // The emitted command name is always `gsd-<stem>`; the source's colon
  // `name: gsd:<stem>` field is ignored (Bob uses the hyphen form).
  return `| \`gsd-${stem}\` | ${desc} |`;
});

const header = `# Bob Command Reference

> **GENERATED — do not hand-edit.** Regenerate with \`node scripts/generate-command-reference.cjs\`.
> One row per emitted command, derived from the \`commands/gsd/*.md\` source set. Each
> description is lifted VERBATIM from the source frontmatter \`description:\` field, so this
> reference cannot silently drift from what actually installs (D-02). The set-equality drift
> guard \`test/docs-conformance.test.cjs\` pins this list to the generated \`SUPPORT-ROSTER.md\`
> Supported set.
`;

const body = `
| Command | Description |
| ------- | ----------- |
${rows.join('\n')}
`;

const outPath = path.join(__dirname, '..', 'COMMANDS.md');
fs.writeFileSync(outPath, `${header}${body}`);
process.stdout.write(`wrote ${outPath} (${rows.length} commands)\n`);
