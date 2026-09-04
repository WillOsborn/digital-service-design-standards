// Tests for tools/design-tokens.json and its use by render-mission.js
// Run from project root: node tools/renderers/test-design-tokens.js

'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
function assert(condition, label, detail) {
  if (condition) { console.log(`  PASS: ${label}`); passed++; }
  else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
function section(title) {
  console.log(`\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`);
}

const ROOT = path.join(__dirname, '..', '..');
const tokensPath = path.join(ROOT, 'tools/design-tokens.json');
const rendererPath = path.join(ROOT, 'tools/renderers/render-mission.js');

section('Tokens file');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
assert(tokens.colour && tokens.colour.light && tokens.colour.dark, 'has colour.light and colour.dark');
assert(tokens.typography && tokens.typography.fontFamily, 'has typography.fontFamily');
assert(tokens.spacing && typeof tokens.spacing.slideMargin === 'number', 'has spacing.slideMargin (points)');

const lightKeys = Object.keys(tokens.colour.light).sort();
const darkKeys = Object.keys(tokens.colour.dark).sort();
assert(JSON.stringify(lightKeys) === JSON.stringify(darkKeys), 'light and dark have identical key sets',
  `light-only: ${lightKeys.filter(k => !darkKeys.includes(k))}; dark-only: ${darkKeys.filter(k => !lightKeys.includes(k))}`);

const HEX = /^#[0-9a-f]{6}$/;
for (const mode of ['light', 'dark']) {
  const bad = Object.entries(tokens.colour[mode]).filter(([, v]) => !HEX.test(v)).map(([k]) => k);
  assert(bad.length === 0, `${mode} colours are lowercase #rrggbb`, bad.join(', '));
}

section('Every --c-* variable in render-mission.js has a token');
const src = fs.readFileSync(rendererPath, 'utf8');
const cssVars = [...new Set([...src.matchAll(/--c-([a-z-]+)/g)].map(m => m[1]))];
const toCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
assert(cssVars.length >= 18, 'renderer declares at least 18 --c-* variables', String(cssVars.length));
for (const v of cssVars) {
  assert(toCamel(v) in tokens.colour.light, `token for --c-${v} (${toCamel(v)})`);
}

section('Renderer reads tokens');
assert(src.includes("require('../design-tokens.json')"), 'render-mission.js requires ../design-tokens.json');
const { renderMission } = require('./render-mission');
const retail = JSON.parse(fs.readFileSync(path.join(ROOT, 'v2.0/examples/retail/mission-online-clothes-shopping.json'), 'utf8'));
const { html } = renderMission(retail, { mode: 'overview', standalone: false });
assert(html.includes(`--c-bg:${tokens.colour.light.bg};`), 'rendered CSS carries the light bg token verbatim');
assert(html.includes(`--c-touchpoint:${tokens.colour.dark.touchpoint};`), 'rendered CSS carries the dark touchpoint token verbatim');

section('Typography metrics');
const ff = tokens.typography.fontFamily;
assert(tokens.typography.metrics && tokens.typography.metrics[ff], `metrics exist for default font "${ff}"`);
const m = (tokens.typography.metrics || {})[ff] || {};
assert(m.avgCharWidthEm > 0.3 && m.avgCharWidthEm < 0.7, 'avgCharWidthEm is plausible (0.3–0.7)', String(m.avgCharWidthEm));
assert(m.lineHeightEm > 1.0 && m.lineHeightEm < 1.6, 'lineHeightEm is plausible (1.0–1.6)', String(m.lineHeightEm));
for (const k of ['display', 'h1', 'h2', 'h3', 'body', 'small', 'caption']) {
  assert(typeof tokens.typography.scale[k] === 'number', `scale.${k} is a number (points)`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
