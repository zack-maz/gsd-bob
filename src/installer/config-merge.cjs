'use strict';

/**
 * config-merge.cjs — the SOLE text_mode guarantee (RESEARCH Pitfall 2).
 *
 * The bob runtime descriptor does NOT enforce workflow.text_mode; this MERGE
 * into the workspace-root .planning/config.json is the only mechanism that
 * turns text_mode on for a Bob install. It is root-anchored at
 * `<workspaceRoot>/.planning/config.json` (CORE-05) — NEVER written under the
 * scope/.bob dir.
 *
 * Dependency discipline: node:fs / node:path ONLY (no js-yaml — config.json is
 * JSON, not YAML). Fail-loud, never-clobber discipline mirrors the adapter's
 * mergeCustomModes (bob-adapter.cjs:82-95): an UNPARSEABLE existing config is
 * left byte-for-byte untouched with a concrete warning (D-13 / anti-pattern
 * #22), never silently rewritten.
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * Merge `workflow.text_mode:true` into the root-anchored .planning/config.json.
 *
 * Behavior:
 *   - missing config.json            → create `{ workflow: { text_mode: true } }`
 *   - existing config with user keys → preserve them, set workflow.text_mode:true
 *   - non-object workflow value      → coerce to a fresh object, then set the key
 *   - re-run                         → byte-identical (idempotent)
 *   - UNPARSEABLE config.json        → warn (naming the path) + return WITHOUT
 *                                      writing (no clobber)
 *   - dryRun                         → compute the would-be bytes, write nothing
 *
 * @param {string} workspaceRoot  the cwd where .planning/ is anchored
 * @param {{dryRun?: boolean}} [opts]
 * @returns {{written: boolean, path: string, bytes: (string|undefined)}}
 *   `bytes` is the serialized would-be/just-written content (for the caller to
 *   record a `merged` manifest entry via sha256(bytes)); `undefined` only when
 *   the file was an unparseable user file we refused to touch.
 */
function mergeTextMode(workspaceRoot, { dryRun = false } = {}) {
  const planningCfg = path.join(workspaceRoot, '.planning', 'config.json');

  let cfg = {};
  let raw;
  try {
    raw = fs.readFileSync(planningCfg, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      raw = undefined; // start from {}
    } else {
      throw err;
    }
  }

  if (raw !== undefined) {
    try {
      cfg = JSON.parse(raw);
    } catch (err) {
      // Never clobber an unparseable user file: warn naming the path and bail.
      console.warn(
        `gsd-bob: ${planningCfg} is present but is not valid JSON — preserving it ` +
          `as-is and NOT writing text_mode (${err.message})`,
      );
      return { written: false, path: planningCfg, bytes: undefined };
    }
    // A non-object parse result (array/scalar) is not a config mapping; start
    // fresh rather than crashing on property assignment.
    if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
      cfg = {};
    }
  }

  cfg.workflow =
    cfg.workflow && typeof cfg.workflow === 'object' && !Array.isArray(cfg.workflow)
      ? cfg.workflow
      : {};
  cfg.workflow.text_mode = true;

  // Byte-stable serialization so the manifest hash is reproducible across runs.
  const bytes = JSON.stringify(cfg, null, 2) + '\n';

  if (dryRun) {
    return { written: false, path: planningCfg, bytes };
  }

  fs.mkdirSync(path.dirname(planningCfg), { recursive: true });
  fs.writeFileSync(planningCfg, bytes, 'utf8');
  return { written: true, path: planningCfg, bytes };
}

module.exports = { mergeTextMode };
