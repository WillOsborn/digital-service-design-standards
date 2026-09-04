// Tests for tools/renderers/pptx/deck-model.js
// Run from project root: node tools/renderers/test-deck-model.js

'use strict';

const fs = require('fs');
const path = require('path');
const { buildActorViewModel } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const dm = require('./pptx/deck-model');
const { SLIDE, LAYOUT, buildDeck, buildCover, buildIndexSlides, fitParagraph } = dm;

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }

const ROOT = path.join(__dirname, '..', '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const adam = load('v2.0/examples/roadside/actor-adam-rees.json');
const daniel = load('v2.0/examples/roadside/actor-daniel-rees.json');
const sarah = load('v2.0/examples/retail/actor-sarah-martinez.json');
const fixture = load('tools/tests/fixtures/actor-multi-context.json');
const { theme } = loadTheme();
const metrics = resolveMetrics(theme);
const vmsOf = (actors, extra) => {
  const ids = actors.map(a => a.id);
  return actors.map(a => buildActorViewModel(a, Object.assign({ deck: { actorIds: ids } }, extra || {})));
};
const opts = (o) => Object.assign({ theme, metrics, generatedAt: '2026-09-04T00:00:00Z', sources: ['v2.0/examples/roadside/'], sections: { cover: true, index: true, summary: true, appendix: true }, images: {} }, o || {});
const textOf = slide => slide.elements.filter(e => e.type === 'text').flatMap(e => e.paragraphs.map(p => p.text)).join('\n');
const inBounds = slide => slide.elements.every(e => e.type === 'line'
  ? [e.x1, e.x2].every(x => x >= -1e-9 && x <= SLIDE.w + 1e-9) && [e.y1, e.y2].every(y => y >= -1e-9 && y <= SLIDE.h + 1e-9)
  : e.x >= -1e-9 && e.y >= -1e-9 && e.x + e.w <= SLIDE.w + 1e-9 && e.y + e.h <= SLIDE.h + 1e-9);

section('Constants and helpers');
assert(SLIDE.w === 13.333 && SLIDE.h === 7.5, '16:9 slide in inches');
assert(LAYOUT.index.perSlide === 8, 'eight actors per index slide (spec §5)');
{
  const style = { size: 9, colour: '#000000' };
  const short = fitParagraph('One sentence.', 3, 2, style, metrics);
  assert(short.text === 'One sentence.' && short.truncated === false, 'fitParagraph keeps text that fits');
  const long = fitParagraph(Array.from({ length: 40 }, (_, i) => `Sentence ${i} is here.`).join(' '), 2, 0.6, style, metrics);
  assert(long.truncated === true && long.text.length > 0 && /\.$/.test(long.text), 'fitParagraph truncates at a sentence boundary and flags it');
}

section('Cover');
{
  const vms = vmsOf([adam, daniel]);
  const cover = buildCover(vms, { theme, C: theme.colour.light, S: theme.typography.scale, font: theme.typography.fontFamily, metrics, images: {}, nameById: new Map(), page: () => 1, title: undefined, generatedAt: '2026-09-04T00:00:00Z', sources: ['v2.0/examples/roadside/'] });
  assert(cover.kind === 'cover' && inBounds(cover), 'cover slide within bounds');
  const t = textOf(cover);
  assert(t.includes('Actors · 2'), 'default title "Actors · N"');
  assert(t.includes('2026-09-04'), 'generated date shown');
  assert(t.includes('v2.0/examples/roadside/'), 'sources listed');
}

section('Index — count formula and content');
{
  const one = buildDeck(vmsOf([sarah]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  assert(one.slides.filter(s => s.kind === 'index').length === 0, 'N=1 → no index slide');
  const two = buildDeck(vmsOf([adam, daniel]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  const idx = two.slides.filter(s => s.kind === 'index');
  assert(idx.length === 1, 'N=2 → one index slide');
  assert(textOf(idx[0]).includes('Adam Rees') && textOf(idx[0]).includes('Daniel Rees'), 'index names both actors');
  assert(idx[0].elements.some(e => e.type === 'ellipse'), 'index cards carry avatars');
  assert(idx[0].elements.some(e => e.type === 'line'), 'in-deck relationship drawn as a line');
  assert(textOf(idx[0]).includes('serves') || textOf(idx[0]).includes('served by'), 'link is labelled with the relationship type');
  assert(inBounds(idx[0]), 'index slide within bounds');
  // Nine actors: adam first, daniel last → they land on different index slides
  const nine = [adam, ...Array.from({ length: 7 }, (_, i) => ({ ...fixture, id: `actor-fx-${i}`, name: `Fixture ${i}`, relationships: [] })), daniel];
  const big = buildDeck(vmsOf(nine), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  const idx9 = big.slides.filter(s => s.kind === 'index');
  assert(idx9.length === 2, 'N=9 → two index slides', String(idx9.length));
  assert(textOf(idx9[0]).includes('1 of 2') && textOf(idx9[1]).includes('2 of 2'), 'index slides numbered "n of N"');
  assert(!idx9[0].elements.some(e => e.type === 'line') && !idx9[1].elements.some(e => e.type === 'line'), 'no line when the related actor is on another index slide');
  assert(textOf(idx9[0]).includes('Daniel Rees') && textOf(idx9[0]).includes('serves'), 'off-slide relationship listed as text under the card');
  assert(idx9.every(inBounds), 'all index slides within bounds');
  const off = buildDeck(vmsOf([adam, daniel]), opts({ sections: { cover: true, index: false, summary: false, appendix: false } }));
  assert(off.slides.every(s => s.kind !== 'index'), 'sections.index=false suppresses the index');
}

section('buildDeck — footer and warnings plumbing');
{
  const d = buildDeck(vmsOf([adam, daniel]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  assert(d.slides[0].kind === 'cover' && d.slides[1].kind === 'index', 'cover then index');
  assert(Array.isArray(d.warnings), 'warnings array returned');
  assert(d.slides.every(s => typeof s.background === 'string' && /^#[0-9a-f]{6}$/.test(s.background)), 'every slide has a background colour');
}

module.exports = { assert, section, load, adam, daniel, sarah, fixture, theme, metrics, vmsOf, opts, textOf, inBounds, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
