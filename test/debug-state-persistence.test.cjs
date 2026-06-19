'use strict';

/**
 * debug-state-persistence.test.cjs — QUAL-02 / D-04 / D-05.
 *
 * Proves the /gsd-debug persistent-state contract survives a context reset by
 * modelling the EXISTING on-disk session file (gsd-core/workflows/debug.md:
 * `.planning/debug/{slug}.md`) under plain Node file I/O — the backend-agnostic
 * proxy for the deferred Bob run (D-09). No new state mechanism is introduced;
 * the test reads/writes that exact path and never stands up an alternative store
 * (D-04: persistence rides the existing session file).
 *
 * RESEARCH §4 / Pitfall 3: a "session starts" assertion alone is a FALSE
 * POSITIVE. This suite performs the FULL round-trip:
 *   (1) START   — write the session file with frontmatter + a Current Focus block
 *                 + Evidence / Eliminated sections (known entry counts).
 *   (2) RESET   — drop ALL in-memory references; the only surviving handle is the
 *                 file path string (modelling a fresh invocation / new context).
 *   (3) CONTINUE— re-read the file from disk (the `continue <slug>` seam: "the
 *                 existing file IS the context").
 *   (4) ASSERT  — status / hypothesis / next_action / Evidence-count /
 *                 Eliminated-count restored VERBATIM from disk, not memory.
 *   (5) SLUGS   — slug sanitization matching debug.md's list/status/continue
 *                 steps: `^[a-z0-9][a-z0-9-]*$`, max 30 chars, reject `..`/`/`/`\`.
 *                 Path-traversal rejection is the only security-relevant control
 *                 in this phase.
 *
 * Hermetic: the workspace is a mkdtempSync scratch root; the session file lives
 * at <scratch>/.planning/debug/<slug>.md and is rmSync'd. NEVER the tracked
 * .planning/.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * Slug sanitizer mirroring gsd-core/workflows/debug.md (Steps 1a/1b/1c):
 * strip whitespace, require `^[a-z0-9][a-z0-9-]*$`, max 30 chars, reject any
 * `..`, `/`, or `\`. Returns the trimmed slug iff valid, else null.
 */
function sanitizeSlug(raw) {
  if (typeof raw !== 'string') return null;
  const slug = raw.trim();
  if (slug.length === 0 || slug.length > 30) return null;
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) return null;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
  return slug;
}

/** Render a debug session file the way debug.md Step 3 / the session manager do. */
function renderSession({ status, trigger, symptoms, focus, evidence, eliminated }) {
  const evidenceBlock = evidence.map((e) => `- timestamp: ${e.timestamp}\n  note: ${e.note}`).join('\n');
  const eliminatedBlock = eliminated.map((h) => `- hypothesis: ${h}`).join('\n');
  return [
    '---',
    `status: ${status}`,
    `trigger: ${trigger}`,
    'created: 2026-06-19',
    'updated: 2026-06-19',
    '---',
    '',
    '# Debug Session',
    '',
    '## Symptoms',
    symptoms,
    '',
    '## Current Focus',
    `hypothesis: ${focus.hypothesis}`,
    `test: ${focus.test}`,
    `expecting: ${focus.expecting}`,
    `next_action: ${focus.next_action}`,
    `reasoning_checkpoint: ${focus.reasoning_checkpoint}`,
    `tdd_checkpoint: ${focus.tdd_checkpoint}`,
    '',
    '## Evidence',
    evidenceBlock,
    '',
    '## Eliminated',
    eliminatedBlock,
    '',
  ].join('\n');
}

/**
 * Parse a session file back into structured fields — models the `continue`
 * read-back (debug.md Step 1c) + the status/list field extraction (Step 1a/1b).
 * Counts Evidence (`- timestamp:`) and Eliminated (`- hypothesis:`) entries the
 * same way debug.md Step 1b prescribes.
 */
function parseSession(text) {
  const fmEnd = text.indexOf('---', 3);
  const fm = text.substring(3, fmEnd);
  const fmField = (k) => {
    const m = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  };
  const focusField = (k) => {
    const m = text.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  };
  const section = (header) => {
    const start = text.indexOf(`## ${header}`);
    if (start < 0) return '';
    const rest = text.slice(start + `## ${header}`.length);
    const next = rest.indexOf('\n## ');
    return next < 0 ? rest : rest.slice(0, next);
  };
  const evidenceCount = (section('Evidence').match(/^- timestamp:/gm) || []).length;
  const eliminatedCount = (section('Eliminated').match(/^- hypothesis:/gm) || []).length;
  return {
    status: fmField('status'),
    trigger: fmField('trigger'),
    hypothesis: focusField('hypothesis'),
    next_action: focusField('next_action'),
    evidenceCount,
    eliminatedCount,
  };
}

// ---- D-05 START → RESET → CONTINUE → RESTORE round-trip --------------------

test('D-05: debug state survives a simulated reset via continue/restore-from-disk', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdbob-debug-state-'));
  const slug = sanitizeSlug('auth-token-null');
  assert.equal(slug, 'auth-token-null', 'valid slug accepted');

  const sessionDir = path.join(workspace, '.planning', 'debug');
  fs.mkdirSync(sessionDir, { recursive: true });
  const sessionPath = path.join(sessionDir, `${slug}.md`);

  // (1) START — write the session with known field values + known counts.
  const written = {
    status: 'investigating',
    trigger: 'Login fails on mobile Safari with a null JWT',
    symptoms: 'Expected: auth succeeds. Actual: 500 from /auth. No errors logged.',
    focus: {
      hypothesis: 'JWT decode fails when token contains nested claims',
      test: 'Add logging at jwt.verify() call site',
      expecting: 'verify() throws on the nested-claim token',
      next_action: 'Add logging at jwt.verify() call site',
      reasoning_checkpoint: 'none',
      tdd_checkpoint: 'none',
    },
    evidence: [
      { timestamp: '2026-06-19T10:00:00Z', note: 'token has 3 segments' },
      { timestamp: '2026-06-19T10:05:00Z', note: 'verify() returns undefined' },
    ],
    eliminated: ['clock skew on the token exp claim'],
  };
  fs.writeFileSync(sessionPath, renderSession(written));
  assert.ok(fs.existsSync(sessionPath), 'session file written at .planning/debug/<slug>.md');

  // (2) RESET — drop ALL in-memory references. The ONLY surviving handle is the
  // path string; the write-time `written` object is explicitly discarded so a
  // restore that secretly reads memory cannot pass.
  const survivingPath = sessionPath;
  const survivingSlug = slug;
  // (the test deliberately reads nothing from `written` past this point)

  // (3) CONTINUE — re-read ONLY from disk (the `continue <slug>` seam).
  const restored = parseSession(fs.readFileSync(survivingPath, 'utf8'));

  // (4) ASSERT RESTORED VERBATIM FROM DISK.
  assert.equal(survivingSlug, 'auth-token-null');
  assert.equal(restored.status, 'investigating', 'status restored from disk');
  assert.equal(
    restored.hypothesis,
    'JWT decode fails when token contains nested claims',
    'hypothesis restored from disk',
  );
  assert.equal(
    restored.next_action,
    'Add logging at jwt.verify() call site',
    'next_action restored from disk',
  );
  assert.equal(restored.evidenceCount, 2, 'Evidence entry count restored from disk');
  assert.equal(restored.eliminatedCount, 1, 'Eliminated entry count restored from disk');

  fs.rmSync(workspace, { recursive: true, force: true });
});

// ---- Slug-sanitization edge cases (debug.md list/status/continue) ----------

test('slug sanitization rejects path-traversal and over-length slugs, accepts a valid slug', () => {
  // Rejected: path traversal and separators (the security-relevant control).
  assert.equal(sanitizeSlug('../etc-passwd'), null, '../-bearing slug rejected');
  assert.equal(sanitizeSlug('foo/bar'), null, '/-bearing slug rejected');
  assert.equal(sanitizeSlug('foo\\bar'), null, '\\-bearing slug rejected');
  assert.equal(sanitizeSlug('..'), null, 'bare .. rejected');
  // Rejected: over-length (>30 chars).
  assert.equal(sanitizeSlug('a'.repeat(31)), null, '>30-char slug rejected');
  // Rejected: leading hyphen / uppercase / empty (the regex contract).
  assert.equal(sanitizeSlug('-leading-hyphen'), null, 'leading-hyphen slug rejected');
  assert.equal(sanitizeSlug('Has-Uppercase'), null, 'uppercase slug rejected');
  assert.equal(sanitizeSlug(''), null, 'empty slug rejected');
  // Accepted: a canonical slug at the length boundary.
  assert.equal(sanitizeSlug('login-fails-on-mobile-safari'), 'login-fails-on-mobile-safari');
  assert.equal(sanitizeSlug('a'.repeat(30)), 'a'.repeat(30), '30-char slug accepted (boundary)');
});

// ---- A rejected slug never escapes the scratch .planning/debug/ root --------

test('a path-traversal slug cannot resolve outside the scratch debug dir (defense-in-depth)', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdbob-debug-traversal-'));
  const sessionDir = path.join(workspace, '.planning', 'debug');
  fs.mkdirSync(sessionDir, { recursive: true });

  const malicious = '../../../etc/shadow';
  // The sanitizer rejects it BEFORE any path is built — the only safe behavior.
  assert.equal(sanitizeSlug(malicious), null, 'traversal slug rejected by the sanitizer');

  // And had it (wrongly) been used, it would have escaped the debug dir — proving
  // why the sanitizer is the control. We assert the would-be path is outside the
  // session dir without ever writing it.
  const wouldBe = path.resolve(sessionDir, `${malicious}.md`);
  assert.ok(!wouldBe.startsWith(sessionDir + path.sep), 'unsanitized slug would escape the debug dir');

  fs.rmSync(workspace, { recursive: true, force: true });
});
