'use strict';

/**
 * scope.cjs — resolve an install scope to an absolute target path.
 *
 * INTEGRATION ANALOG, do not reimplement: global resolution is delegated to the
 * vendored gsd-core resolver `getGlobalConfigDir('bob', explicitDir)`, which
 * owns the descriptor-driven `~/.bob` default, the `BOB_CONFIG_DIR` env
 * override, and leading-tilde expansion of an explicit `-c` value. We never
 * hand-roll home resolution or path math here — that keeps the security surface
 * on the vetted resolver and the behaviour identical to gsd-core (T-03-05).
 *
 * Local scope is ALWAYS `<cwd>/.bob`, NOT via the descriptor.
 *
 * The returned absolute path is the value the entry point (Plan 04) PRINTS
 * before any write, so the user sees exactly where the install lands (INSTALL-01).
 *
 * Note: `scope === null` is resolved to 'local'/'global' by the entry's
 * interactive prompt BEFORE calling this function — it is not handled here.
 *
 * @param {{scope: ('local'|'global'), explicitDir?: (string|undefined)}} opts
 * @returns {string} absolute target directory path
 */

const path = require('node:path');
const { getGlobalConfigDir } = require('../../gsd-core/bin/lib/runtime-homes.cjs');

function resolveTarget({ scope, explicitDir } = {}) {
  if (scope === 'local') {
    return path.join(process.cwd(), '.bob');
  }
  if (scope === 'global') {
    // Resolver handles -c / BOB_CONFIG_DIR / tilde — do NOT reimplement.
    return getGlobalConfigDir('bob', explicitDir);
  }
  throw new Error(
    `resolveTarget: scope must be 'local' or 'global' (got ${JSON.stringify(scope)}); ` +
      'a null scope must be resolved by the prompt before calling resolveTarget',
  );
}

module.exports = { resolveTarget };
