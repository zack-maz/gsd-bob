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
  let doc;
  if (existingYamlText) {
    const parsed = yaml.load(existingYamlText);
    // TRANS-05 (WR-01): a non-empty file must parse to a MAPPING. A scalar, array,
    // or other non-object root means a malformed/hand-broken custom_modes.yaml —
    // FAIL LOUD rather than silently dropping the gsd mode (or throwing opaquely
    // when we later try to assign `doc.customModes`). `null` is the one allowed
    // non-object: a file of only comments/whitespace yields `null` and is treated
    // as an empty mapping (no user modes to preserve, nothing to lose).
    if (parsed === null || parsed === undefined) {
      doc = {};
    } else if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      const got = Array.isArray(parsed) ? 'sequence' : typeof parsed;
      throw new Error(
        `mergeCustomModes: custom_modes.yaml root is not a mapping (got ${got}); ` +
          'refusing to silently drop the gsd mode',
      );
    } else {
      doc = parsed;
    }
  } else {
    doc = {};
  }
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

/**
 * Curated skip-list (D-10) backing cases skill metadata cannot self-describe.
 * Maps a candidate name -> a concrete reason. A small, explicit list keeps the
 * parity-first gap LOUD: anything here is omitted from the loadable set and
 * recorded in the support roster, never emitted broken.
 *
 * Kept intentionally tiny for v1 (proves the mechanism); full-set gating across
 * the whole skill roster rides with Phases 4-5.
 */
const BOB_SKIP_LIST = {
  // Example representative: a workflow whose hard dependency on isolated subagent
  // fan-out cannot be expressed purely in skill metadata.
  'gsd-autonomous': 'requires isolated subagent orchestration that Bob runs sequentially inline',
};

/**
 * Human-readable reasons for each conservative-lower-bound primitive Bob lacks.
 * @type {Record<string,string>}
 */
const PRIMITIVE_REASONS = {
  isolatedSubagents:
    'requires isolated subagents; Bob runs subagents sequentially inline',
  structuredPrompts:
    'requires structured prompts; Bob supports text_mode prompting only',
};

/**
 * Programmatic flag/skip gate (D-10, TRANS-04). A candidate is SUPPORTED iff
 * every required primitive is supported by the bob capability declaration AND
 * the candidate name is not on the curated skip-list. Otherwise it is EXCLUDED
 * from the loadable set and a concrete reason is returned for the roster.
 *
 * @param {{name:string, requires?:string[]}} candidate  artifact + required primitives
 * @param {Record<string,boolean>} capabilityDecl  bob's supported-primitive map
 * @returns {{supported:true} | {supported:false, reason:string}}
 */
function gateArtifact(candidate, capabilityDecl) {
  const decl = capabilityDecl || {};
  // TRANS-04 (WR-04): a null/malformed candidate must NEVER be admitted as
  // supported. Guard the candidate shape FIRST (before skip-list/primitive checks)
  // so a missing or non-string name is excluded with a concrete reason.
  if (!candidate || typeof candidate.name !== 'string' || candidate.name.length === 0) {
    return { supported: false, reason: 'invalid candidate: missing or non-string name' };
  }
  // Curated skip-list takes precedence (covers what metadata can't express).
  if (Object.prototype.hasOwnProperty.call(BOB_SKIP_LIST, candidate.name)) {
    return { supported: false, reason: BOB_SKIP_LIST[candidate.name] };
  }
  const required = (candidate && Array.isArray(candidate.requires)) ? candidate.requires : [];
  for (const primitive of required) {
    if (!decl[primitive]) {
      const reason = PRIMITIVE_REASONS[primitive] || `requires unsupported primitive '${primitive}'`;
      return { supported: false, reason };
    }
  }
  return { supported: true };
}

/**
 * Build a loud support roster (D-10): one `unsupported on Bob: <reason>` line
 * per EXCLUDED candidate so the parity gap is never silent. Supported candidates
 * produce no line (they are emitted to .bob/commands / .bob/skills as usual).
 *
 * @param {Array<{name:string, requires?:string[]}>} candidates
 * @param {Record<string,boolean>} capabilityDecl
 * @returns {string[]} roster lines for the unsupported candidates
 */
function buildSupportRoster(candidates, capabilityDecl) {
  const lines = [];
  for (const candidate of candidates || []) {
    const res = gateArtifact(candidate, capabilityDecl);
    if (!res.supported) {
      // TRANS-04 (WR-04): never interpolate a possibly-undefined name (which would
      // emit a malformed `undefined:` line). Fall back to a fixed placeholder label.
      const label =
        candidate && typeof candidate.name === 'string' && candidate.name.length > 0
          ? candidate.name
          : '<unnamed candidate>';
      lines.push(`${label}: ${UNSUPPORTED_MARKER} ${res.reason}`);
    }
  }
  return lines;
}

module.exports = {
  UNSUPPORTED_MARKER,
  BOB_SKIP_LIST,
  emitGsdMode,
  mergeCustomModes,
  gateArtifact,
  buildSupportRoster,
};
