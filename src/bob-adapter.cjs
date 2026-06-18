'use strict';

/**
 * bob-adapter — the SINGLE isolated module carrying all net-new Bob substance
 * (D-07 / UP-01: "Bob-specific code isolated to one adapter component").
 *
 * It is the ONLY file in the project permitted to `require('js-yaml')` (D-04):
 * the install/staging path stays node:fs-only, so the YAML parser never enters
 * the installer's dependency/audit surface. js-yaml v4's default schema is the
 * SAFE schema — `yaml.load` does NOT execute arbitrary tags (T-02-04 control).
 *
 * Exports:
 *   - emitGsdMode()                          the gsd custom-mode object
 *   - mergeCustomModes(existingText, entry)  idempotent, slug-scoped merge
 *   - gateArtifact(candidate, capabilityDecl) unsupported-primitive flag/skip
 *   - buildSupportRoster(candidates, capabilityDecl)  loud "unsupported on Bob"
 */

const yaml = require('js-yaml');

/** The exact marker recorded for every primitive Bob cannot support (D-10). */
const UNSUPPORTED_MARKER = 'unsupported on Bob:';

/**
 * The single gsd custom mode (D-01). Groups are locked to
 * `[read, edit, command, mcp]` (D-02) — `skill`/`browser` are omitted for v1
 * because the GSD seam is command -> gsd_run, not skill -> skill.
 * Prose (roleDefinition/whenToUse/customInstructions) is Claude's discretion
 * (D-03): minimal, pointing users at the /gsd-* slash commands and noting that
 * planning artifacts live in .planning/ and that the mode shells out via the
 * command tool.
 *
 * @returns {{slug:string,name:string,roleDefinition:string,whenToUse:string,customInstructions:string,groups:string[]}}
 */
function emitGsdMode() {
  return {
    slug: 'gsd',
    name: 'GSD',
    roleDefinition:
      'You are a GSD (Getting Stuff Done) spec-driven planning operator. You drive ' +
      'the GSD planning loop — new-project, plan-phase, execute-phase, verify — and ' +
      'keep the .planning/ artifact contract (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, ' +
      'STATE.md, config.json, phase plans) in sync.',
    whenToUse:
      'Use this mode for any GSD planning or execution work. Invoke the /gsd-* slash ' +
      'commands (e.g. /gsd-plan-phase, /gsd-execute-phase, /gsd-verify-work) to run a ' +
      'specific workflow.',
    customInstructions:
      'All planning state lives under .planning/. Run GSD tooling by shelling out via ' +
      'the command tool (e.g. `node gsd-core/bin/gsd-tools.cjs query ...`). Prefer the ' +
      '/gsd-* slash commands as entry points; never edit .planning/ artifacts outside a ' +
      'GSD workflow unless explicitly asked.',
    groups: ['read', 'edit', 'command', 'mcp'],
  };
}

/**
 * Is `slug` a gsd-owned slug? (D-05: ownership = exactly `gsd` or `gsd-*`.)
 * @param {*} slug
 * @returns {boolean}
 */
function isOwnedSlug(slug) {
  return slug === 'gsd' || (typeof slug === 'string' && slug.startsWith('gsd-'));
}

/**
 * Merge the gsd mode into an existing custom_modes.yaml, idempotently and
 * scoped by slug (D-05/D-06). Replaces the gsd entry IN PLACE (removes the
 * owned slug that === the incoming entry's slug, then appends the fresh entry)
 * and NEVER touches non-gsd user slugs. Comments are NOT preserved on re-emit
 * (Pitfall 5 — the invariant is slug-level idempotency, not comment fidelity).
 *
 * @param {string} existingYamlText  current custom_modes.yaml text (may be empty)
 * @param {object} gsdModeEntry      the mode object from emitGsdMode()
 * @returns {string} the merged YAML text
 */
function mergeCustomModes(existingYamlText, gsdModeEntry) {
  // js-yaml v4 default = SAFE schema; does not execute arbitrary tags (T-02-04).
  const doc = existingYamlText ? (yaml.load(existingYamlText) || {}) : {};
  const modes = Array.isArray(doc.customModes) ? doc.customModes : [];
  // Remove only the owned slug that matches the incoming entry's slug — leaves
  // every other slug (including differently-named gsd-* slugs) untouched.
  const filtered = modes.filter(
    (m) => !(m && isOwnedSlug(m.slug) && m.slug === gsdModeEntry.slug),
  );
  filtered.push(gsdModeEntry);
  doc.customModes = filtered;
  return yaml.dump(doc, { lineWidth: -1 });
}

module.exports = {
  UNSUPPORTED_MARKER,
  emitGsdMode,
  mergeCustomModes,
};
