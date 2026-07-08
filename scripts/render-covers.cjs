#!/usr/bin/env node
'use strict';

/**
 * render-covers.cjs — render covers/*.svg to covers/png/*.png at 2x.
 *
 * Why PNG exports exist: the cover SVGs declare 'IBM Plex Sans'/'IBM Plex Mono'
 * but do NOT embed the fonts (embedding full woff2 faces would grow a ~13 KB SVG
 * ~25x, and GitHub's <img> sandbox does not reliably honor data-URI @font-face).
 * Rendering locally with the installed IBM Plex family bakes real Plex into a
 * PNG that displays identically everywhere. The SVGs stay the editable source
 * of truth; the PNGs are generated output — regenerate after any SVG change.
 *
 * Requires: rsvg-convert (brew install librsvg) and the IBM Plex fonts
 * installed system-wide. Fails loud if the renderer is missing rather than
 * silently emitting fallback-font covers.
 *
 * Run: `node scripts/render-covers.cjs [cover.svg ...]`
 * With no args every covers/*.svg is rendered; pass filenames to render a subset.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const coversDir = path.join(__dirname, '..', 'covers');
const outDir = path.join(coversDir, 'png');
const RENDER_WIDTH = 1920; // 2x the 960 viewBox width

try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'pipe' });
} catch {
  console.error('render-covers: rsvg-convert not found (brew install librsvg). Refusing to emit nothing silently.');
  process.exit(1);
}

const requested = process.argv.slice(2).map((f) => path.basename(f));
const svgs = fs
  .readdirSync(coversDir)
  .filter((f) => f.endsWith('.svg'))
  .filter((f) => requested.length === 0 || requested.includes(f))
  .sort();

if (svgs.length === 0) {
  console.error(
    requested.length
      ? `render-covers: none of [${requested.join(', ')}] found in ${coversDir}`
      : `render-covers: no .svg files found in ${coversDir}`
  );
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const svg of svgs) {
  const src = path.join(coversDir, svg);
  const dest = path.join(outDir, `${path.basename(svg, '.svg')}.png`);
  execFileSync('rsvg-convert', ['-w', String(RENDER_WIDTH), '-o', dest, src], { stdio: 'inherit' });
  console.log(`rendered ${path.relative(process.cwd(), dest)} (${RENDER_WIDTH}px wide)`);
}
