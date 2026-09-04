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
  : e.w >= 0 && e.h >= 0 && e.x >= -1e-9 && e.y >= -1e-9 && e.x + e.w <= SLIDE.w + 1e-9 && e.y + e.h <= SLIDE.h + 1e-9);

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
  const pageOf = slide => {
    const e = slide.elements.find(x => x.type === 'text' && x.align === 'right' && Math.abs(x.y - LAYOUT.footerY) < 1e-9);
    return e ? e.paragraphs.map(p => p.text).join('') : undefined;
  };
  assert(pageOf(idx9[0]) === '2' && pageOf(idx9[1]) === '3', 'index slide footers carry the correct running page number (cover is page 1)');
  // One actor with 8 in-deck relationships whose targets are all on another index slide: the
  // off-slide list must cap at 3 lines (2 + a "+N more" summary) rather than driving the summary
  // box height negative. adamWith8Rels lands alone on slide 2; all eight targets are on slide 1.
  const eightFixtures = Array.from({ length: 8 }, (_, i) => ({ ...fixture, id: `actor-fx-${i}`, name: `Fixture ${i}`, relationships: [] }));
  const adamWith8Rels = { ...adam, relationships: Array.from({ length: 8 }, (_, i) => ({ target: `actor-fx-${i}`, type: 'collaborates_with', description: '' })) };
  const manyRels = buildDeck(vmsOf([...eightFixtures, adamWith8Rels]), opts({ sections: { cover: true, index: true, summary: false, appendix: false } }));
  const idxMany = manyRels.slides.filter(s => s.kind === 'index');
  assert(idxMany.length === 2, 'N=9 (8 fixtures + 1 many-relationship actor) → two index slides');
  assert(idxMany.every(inBounds), 'index slides within bounds even with 8 off-slide relationships');
  assert(textOf(idxMany[1]).includes('+6 more'), 'off-slide relationship list caps at 3 lines with a "+N more" summary');
  assert(idxMany.every(s => s.elements.every(e => !(e.type === 'text' && e.h < 0))), 'no text element has negative height');
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

section('Summary slide');
{
  const vms = vmsOf([adam, daniel]);
  const d = buildDeck(vms, opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  assert(d.slides.length === 2 && d.slides.every(s => s.kind === 'summary'), 'one summary per actor, nothing else');
  const s = d.slides[0];
  assert(s.actorId === 'actor-adam-rees', 'summary carries actorId');
  const t = textOf(s);
  assert(t.includes('Adam Rees') && t.includes(adam.quote) && t.includes(adam.summary), 'header: name, quote, summary paragraph');
  assert(t.includes(String(adam.traits.demographics.age)) && t.includes(adam.traits.demographics.location), 'header strip carries age and location');
  assert(t.includes('Enduring traits') && t.includes(`In context: ${adam.contexts[0].title}`) && t.includes('When traits meet context'), 'three column headings name their source');
  assert(t.includes('true of them in any situation') && t.includes('specific to this role') && t.includes('what each emerges from'), 'each column carries its caption');
  assert(t.includes(adam.contexts[0].contextType), 'context type shown with the context heading');
  assert(s.elements.some(e => e.type === 'ellipse'), 'avatar present');
  assert(inBounds(s), 'summary slide within bounds');
  assert(typeof s.notes === 'string' && s.notes.includes('Enduring traits') && s.notes.split('\n').length > 6, 'speaker notes carry the full lists');
  const listEls = s.elements.filter(e => e.type === 'text' && e.paragraphs.some(p => p.bullet));
  assert(listEls.length === 3, 'three bulleted lists');
  assert(listEls.every(e => e.paragraphs.filter(p => p.bullet).length <= 5 && e.paragraphs.filter(p => p.bullet).length >= 1), 'each list shows 1–5 items');
  assert(listEls.some(e => e.paragraphs.some(p => /\[(traits|context|collision)\]/.test(p.text))), 'emergent goals show their source badge');
  assert(t.includes('→ see appendix'), 'truncated columns point to the appendix');
  assert(d.warnings.some(w => w.code === 'SUMMARY_TRUNCATED' && w.actorId === 'actor-adam-rees'), 'truncation warned');
  assert(s.elements.every(e => e.type !== 'text' || e.size >= theme.typography.scale.caption), 'no text below caption size (never shrinks)');
}
{
  const d = buildDeck(vmsOf([fixture]), opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const t = textOf(d.slides[0]);
  assert(t.includes('+2 more contexts → appendix'), 'multi-context marker');
  assert(t.includes('In context: Alpha Role'), 'first context shown by default');
}
{
  const d = buildDeck(vmsOf([fixture], { context: 'ctx-gamma' }), opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const t = textOf(d.slides[0]);
  assert(t.includes('In context: Gamma Role') && t.includes('Nothing recorded yet'), 'context without emergence shows an explicit empty state, not a blank box');
}
{
  const noCtx = buildActorViewModel({ ...fixture, contexts: [], emergence: [] });
  const d = buildDeck([noCtx], opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  assert(d.slides.length === 1 && inBounds(d.slides[0]) && textOf(d.slides[0]).includes('No context recorded'), 'actor with no contexts still gets a summary slide with an explicit empty context');
}

module.exports = { assert, section, load, adam, daniel, sarah, fixture, theme, metrics, vmsOf, opts, textOf, inBounds, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
