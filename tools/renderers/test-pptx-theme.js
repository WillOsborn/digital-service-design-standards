// Tests for tools/renderers/pptx/theme.js
// Run from project root: node tools/renderers/test-pptx-theme.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadTheme, mergeTheme, resolveMetrics } = require('./pptx/theme');
const tokens = require('../design-tokens.json');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-theme-'));
const writeJson = (name, obj) => { const p = path.join(tmp, name); fs.writeFileSync(p, JSON.stringify(obj)); return p; };

section('Defaults');
{
  const { theme, warnings } = loadTheme();
  assert(theme.colour.light.bg === tokens.colour.light.bg, 'no path → tokens verbatim');
  assert(theme !== tokens && theme.colour !== tokens.colour, 'returns a deep copy, not the require cache');
  assert(warnings.length === 0, 'no warnings');
}

section('mergeTheme');
{
  const { merged, unknownKeys } = mergeTheme({ a: { b: 1, c: 2 }, d: 3 }, { a: { b: 9 } });
  assert(merged.a.b === 9 && merged.a.c === 2 && merged.d === 3, 'deep merge keeps untouched keys');
  assert(unknownKeys.length === 0, 'no unknown keys');
  const u = mergeTheme({ a: { b: 1 } }, { a: { bb: 1 }, zz: { y: 1 } });
  assert(u.unknownKeys.sort().join(',') === 'a.bb,zz', 'unknown keys reported with dotted paths', u.unknownKeys.join(','));
  assert(u.merged.a.bb === 1 && u.merged.zz.y === 1, 'unknown keys are still merged (warn, do not drop)');
  const fonts = mergeTheme({ typography: { metrics: { Calibri: { avgCharWidthEm: 0.47, lineHeightEm: 1.2 } } } },
    { typography: { metrics: { Inter: { avgCharWidthEm: 0.5, lineHeightEm: 1.3 } } } });
  assert(fonts.unknownKeys.length === 0 && fonts.merged.typography.metrics.Inter.lineHeightEm === 1.3, 'typography.metrics.<Font> is exempt from unknown-key reporting');
}

section('loadTheme with an override file');
{
  const p = writeJson('brand.json', { colour: { light: { bg: '#ffffff', traits: '#123456' } }, typography: { fontFamily: 'Arial' } });
  const { theme, warnings } = loadTheme(p);
  assert(theme.colour.light.bg === '#ffffff' && theme.colour.light.traits === '#123456', 'override applied');
  assert(theme.colour.light.text === tokens.colour.light.text, 'unspecified keys inherit defaults');
  assert(theme.typography.fontFamily === 'Arial' && warnings.length === 0, 'font override with known metrics → no warning');
  const p2 = writeJson('typo.json', { colour: { light: { backgroud: '#000000' } } });
  const r2 = loadTheme(p2);
  assert(r2.warnings.some(w => w.code === 'THEME_UNKNOWN_KEY' && w.message.includes('colour.light.backgroud')), 'typo produces THEME_UNKNOWN_KEY naming the path');
  const p3 = writeJson('font.json', { typography: { fontFamily: 'Comic Sans MS' } });
  const r3 = loadTheme(p3);
  assert(r3.warnings.some(w => w.code === 'THEME_METRICS_FALLBACK' && w.message.includes('Comic Sans MS')), 'unknown font → metrics fallback warning');
  assert(resolveMetrics(r3.theme).avgCharWidthEm === tokens.typography.metrics.Calibri.avgCharWidthEm, 'fallback metrics are Calibri');
}

section('loadTheme errors');
{
  let err;
  try { loadTheme(path.join(tmp, 'missing.json')); } catch (e) { err = e; }
  assert(err && err.code === 'THEME_UNREADABLE', 'missing file throws THEME_UNREADABLE');
  fs.writeFileSync(path.join(tmp, 'bad.json'), '{ not json');
  err = undefined;
  try { loadTheme(path.join(tmp, 'bad.json')); } catch (e) { err = e; }
  assert(err && err.code === 'THEME_UNREADABLE' && /bad\.json/.test(err.message), 'unparseable file throws THEME_UNREADABLE naming the file');
}

section('resolveMetrics');
assert(resolveMetrics(loadTheme().theme).lineHeightEm === tokens.typography.metrics.Calibri.lineHeightEm, 'default font resolves its own metrics');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
