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
 * CR-01 lexical guard: assert a manifest entry path is relative and stays inside
 * the install root. The manifest is the SOLE source of truth and its entries
 * drive destructive fs ops, so a `..`/absolute entry (corruption, a partial
 * overwrite, or a manifest carried from a differently-rooted prior install) must
 * fail LOUD here rather than silently driving an out-of-root delete.
 * `path.join(target, entry.path)` does NOT neutralise `..`, which is exactly the
 * adversarial input the "never touch user files / never orphan" promise exists
 * to defend against.
 * @param {string} relPath
 * @param {string} [manifestFile] for a more actionable error
 * @returns {string} the path, unchanged, when safe
 */
function assertSafeRelpath(relPath, manifestFile) {
  const where = manifestFile ? ` in ${manifestFile}` : '';
  if (typeof relPath !== 'string' || relPath.length === 0) {
    throw new Error(`manifest: entry.path must be a non-empty string${where} (CR-01 guard)`);
  }
  if (path.isAbsolute(relPath)) {
    throw new Error(
      `manifest: entry.path "${relPath}" is absolute${where} — refusing ` +
        '(an absolute path would drive an out-of-root delete; CR-01 guard)',
    );
  }
  // Fold both separators so a `..\\` segment is caught on POSIX too, then
  // normalise: any path that still begins with `..` climbs out of the root.
  const normalized = path.normalize(relPath).replace(/\\/g, '/');
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(
      `manifest: entry.path "${relPath}" escapes the install root after ` +
        `normalization ("${normalized}")${where} — refusing (CR-01 guard)`,
    );
  }
  return relPath;
}

/**
 * CR-01 containment guard: join `rel` onto `base` and assert the resolved path
 * stays strictly inside `base`. Separator-correct on the running platform
 * (resolve-based), so it catches `..` climbs AND absolute `rel`. This is the
 * defense-in-depth applied before every destructive fs op (orphan sweep,
 * uninstall) even though `readManifest` already validates on load.
 * @param {string} base  the install root the result must stay within
 * @param {string} rel   untrusted relative path from the manifest
 * @returns {string} absolute path guaranteed inside base
 */
function safeJoin(base, rel) {
  const baseResolved = path.resolve(base);
  const abs = path.resolve(baseResolved, rel);
  const rootWithSep = baseResolved.endsWith(path.sep) ? baseResolved : baseResolved + path.sep;
  if (!abs.startsWith(rootWithSep)) {
    throw new Error(
      `manifest: path "${rel}" escapes the install root ${baseResolved} ` +
        `(resolved to ${abs}) — refusing (CR-01 containment guard)`,
    );
  }
  return abs;
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
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `manifest: ${file} is present but is not valid JSON (refusing to treat a ` +
        `corrupt manifest as empty, which would orphan every tracked file): ${err.message}`,
    );
  }
  // CR-01: validate every entry path stays inside the install root BEFORE any
  // consumer drives a destructive fs op from it. A poisoned manifest (a `..` or
  // absolute entry) fails LOUD here rather than silently deleting out-of-root.
  if (parsed && Array.isArray(parsed.entries)) {
    for (const entry of parsed.entries) {
      if (entry && typeof entry === 'object' && 'path' in entry) {
        assertSafeRelpath(entry.path, file);
      }
    }
  }
  return parsed;
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
  assertSafeRelpath,
  safeJoin,
  readManifest,
  writeManifest,
  buildManifest,
  classifyOnUpdate,
  classifyOrphan,
};
