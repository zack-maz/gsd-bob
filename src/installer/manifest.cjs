'use strict';

/**
 * manifest.cjs — INSTALL-05 install manifest, the SOLE source of truth for what
 * gsd-bob owns on disk (D-01..D-05).
 *
 * Dependency discipline: node:fs / node:path / node:crypto ONLY. This module
 * NEVER requires js-yaml — YAML stays confined to bob-adapter.cjs, so the
 * installer's node:fs-only staging path keeps the YAML parser out of its
 * audit surface.
 *
 * The manifest is the single source of truth (D-03): classification is driven
 * EXCLUSIVELY by recorded entries[]. There is deliberately NO function that
 * scans a directory to discover removable files — a path absent from entries[]
 * is never classified for removal, so a user file is never swept.
 *
 * Hashing rule (Pitfall 3): the manifest hash is sha256 of the EXACT bytes
 * written to disk (post-conversion, post-merge), never the source. On update /
 * orphan-sweep the on-disk bytes are read back and re-hashed, so an untouched
 * gsd-bob file matches and a user-edited one does not.
 *
 * Manifest schema (D-01):
 *   { schemaVersion, gsdBobVersion, scope, configHome, generatedAt, entries[] }
 *   entry = { path, sha256, kind: 'file' | 'merged' }
 */

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

/** The on-disk manifest dotfile, stored under the runtime config home. */
const MANIFEST_FILENAME = '.gsd-bob-manifest.json';

/** Current manifest schema version. */
const SCHEMA_VERSION = 1;

/**
 * sha256 of the exact byte buffer (bytes-as-written, never the source).
 * @param {Buffer|string} buf
 * @returns {string} 64-char lowercase hex digest
 */
function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Absolute path to the manifest dotfile under a config home.
 * @param {string} configHome
 * @returns {string}
 */
function manifestPath(configHome) {
  return path.join(configHome, MANIFEST_FILENAME);
}

/**
 * Read and parse the manifest. Returns `null` when absent (ENOENT). Throws
 * LOUD on a corrupt/non-parseable manifest (T-03-01): silently treating a
 * broken manifest as empty would orphan every tracked file.
 * @param {string} configHome
 * @returns {object|null}
 */
function readManifest(configHome) {
  const file = manifestPath(configHome);
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `manifest: ${file} is present but is not valid JSON (refusing to treat a ` +
        `corrupt manifest as empty, which would orphan every tracked file): ${err.message}`,
    );
  }
}

/**
 * Serialize and write the manifest byte-stably (2-space JSON + trailing newline)
 * so a re-run hashes identically.
 * @param {string} configHome
 * @param {object} manifestObj
 * @returns {string} the absolute path written
 */
function writeManifest(configHome, manifestObj) {
  const file = manifestPath(configHome);
  fs.writeFileSync(file, JSON.stringify(manifestObj, null, 2) + '\n', 'utf8');
  return file;
}

/**
 * Build a D-01 manifest object. `entries` are passed through verbatim (each
 * `{ path, sha256, kind }`); the caller computes per-entry hashes from the
 * bytes it wrote.
 * @param {{schemaVersion?:number, gsdBobVersion:string, scope:string, configHome:string, entries?:Array}} opts
 * @returns {object}
 */
function buildManifest({ schemaVersion = SCHEMA_VERSION, gsdBobVersion, scope, configHome, entries = [] }) {
  return {
    schemaVersion,
    gsdBobVersion,
    scope,
    configHome,
    generatedAt: new Date().toISOString(),
    entries,
  };
}

/**
 * Hash the bytes currently on disk at `absPath`, or `null` if the file is
 * missing (ENOENT). Any other read error propagates.
 * @param {string} absPath
 * @returns {string|null}
 */
function hashOnDisk(absPath) {
  let bytes;
  try {
    bytes = fs.readFileSync(absPath);
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
  return sha256(bytes);
}

/**
 * Update collision policy (D-04). Reads the file back and re-hashes:
 *   - missing on disk        → 'rewrite'   (re-stage the owned file)
 *   - on-disk hash === entry → 'overwrite' (untouched gsd-bob file, refresh it)
 *   - on-disk hash differs   → 'skip-warn' (user-modified, do NOT clobber)
 * @param {{sha256:string}} entry
 * @param {string} absPath
 * @returns {'rewrite'|'overwrite'|'skip-warn'}
 */
function classifyOnUpdate(entry, absPath) {
  const onDisk = hashOnDisk(absPath);
  if (onDisk === null) return 'rewrite';
  if (onDisk === entry.sha256) return 'overwrite';
  return 'skip-warn';
}

/**
 * Orphan-sweep policy (D-05) for an entry no longer staged this run:
 *   - missing on disk        → 'remove'    (already gone, drop the entry)
 *   - on-disk hash === entry → 'remove'    (untouched gsd-bob file, safe to delete)
 *   - on-disk hash differs   → 'keep-warn' (user-modified, leave it and warn)
 * @param {{sha256:string}} entry
 * @param {string} absPath
 * @returns {'remove'|'keep-warn'}
 */
function classifyOrphan(entry, absPath) {
  const onDisk = hashOnDisk(absPath);
  if (onDisk === null) return 'remove';
  if (onDisk === entry.sha256) return 'remove';
  return 'keep-warn';
}

module.exports = {
  MANIFEST_FILENAME,
  SCHEMA_VERSION,
  sha256,
  manifestPath,
  readManifest,
  writeManifest,
  buildManifest,
  classifyOnUpdate,
  classifyOrphan,
};
