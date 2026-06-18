'use strict';

/**
 * report.cjs — end-of-run installer report buckets.
 *
 * The staging engine (Plan 03) accumulates outcomes into a mutable report; the
 * entry (Plan 04) prints it once at the end. Three buckets:
 *   written  — files the installer created or refreshed
 *   skipped  — user-modified files preserved (collision policy D-04)
 *   removed  — orphaned files swept (orphan policy D-05)
 *
 * Deterministic and side-effect-free except for console output. Node builtins
 * only — no third-party deps (no color/spinner/arg-parsing packages).
 */

/**
 * Create a fresh, mutable accumulator for an install run.
 * @returns {{written: string[], skipped: string[], removed: string[]}}
 */
function newReport() {
  return { written: [], skipped: [], removed: [] };
}

/**
 * Print the three buckets and a one-line tally via console.log.
 *
 * @param {{written: string[], skipped: string[], removed: string[]}} report
 * @param {{dryRun?: boolean}} [opts]
 */
function printReport(report, { dryRun = false } = {}) {
  const written = report?.written ?? [];
  const skipped = report?.skipped ?? [];
  const removed = report?.removed ?? [];

  if (dryRun) {
    console.log('PLAN (dry-run — nothing written)');
  } else {
    console.log('Install report');
  }

  printBucket('Written', written);
  printBucket('Skipped (user-modified, preserved)', skipped);
  printBucket('Removed (orphaned)', removed);

  console.log(
    `Summary: ${written.length} written, ${skipped.length} skipped, ${removed.length} removed`,
  );
}

function printBucket(header, items) {
  console.log(`\n${header} (${items.length})`);
  for (const item of items) {
    console.log(`  ${item}`);
  }
}

module.exports = { newReport, printReport };
