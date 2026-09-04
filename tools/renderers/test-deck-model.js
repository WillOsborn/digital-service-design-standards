// Tests for tools/renderers/pptx/deck-model.js
// Run from project root: node tools/renderers/test-deck-model.js

'use strict';

const fs = require('fs');
const path = require('path');
const { buildActorViewModel } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const dm = require('./pptx/deck-model');
const flow = require('./pptx/flow');
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
// Column geometry shared by the fix-round-1 checks below: mirrors buildSummarySlide's own math
// so tests can locate a given column's heading/caption/list elements by their x position.
const sumColW = (SLIDE.w - 2 * LAYOUT.margin - 2 * LAYOUT.gutter) / 3;
const sumColP = LAYOUT.summary.colPad;
const sumColX = i => LAYOUT.margin + i * (sumColW + LAYOUT.gutter) + sumColP;
const captionElAt = (slide, i) => slide.elements.find(e => e.type === 'text' && Math.abs(e.x - sumColX(i)) < 1e-6 && e.italic && !e.bold && e.size === theme.typography.scale.small);
const headingElAt = (slide, i) => slide.elements.find(e => e.type === 'text' && Math.abs(e.x - sumColX(i)) < 1e-6 && e.bold && e.colour === '#ffffff');
const listElAt = (slide, i) => slide.elements.find(e => e.type === 'text' && Math.abs(e.x - sumColX(i)) < 1e-6 && (e.paragraphs.some(p => p.bullet) || (e.paragraphs[0] && e.paragraphs[0].text === 'Nothing recorded yet')));
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
  const ctxCaptionEl = captionElAt(s, 1);
  const ctxHeadingEl = headingElAt(s, 1);
  assert(ctxCaptionEl && ctxCaptionEl.paragraphs[0].text.startsWith(adam.contexts[0].contextType + ' · '), 'context column caption starts with the context type');
  assert(ctxHeadingEl && !ctxHeadingEl.paragraphs[0].text.includes(`(${adam.contexts[0].contextType})`), 'context heading no longer carries "(contextType)"');
  for (let i = 0; i < 3; i++) {
    const capEl = captionElAt(s, i);
    const estimate = flow.estimateBlockHeight({ kind: 'paragraph', sectionId: 'c', text: capEl.paragraphs[0].text, style: { size: theme.typography.scale.small, colour: capEl.colour } }, sumColW - 2 * sumColP, metrics);
    assert(estimate <= capEl.h + 1e-9, `column ${i}: caption fits within its own box height`);
  }
  assert(s.notes.includes('Demographics') && s.notes.includes(adam.traits.demographics.background), 'speaker notes include a demographics block with the full background text');
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
{
  // Fix round 1, finding 1: a context title at the schema's 100-char max must not overflow its
  // one-line heading band — the band grows (up to colHeadMaxH) and, failing that, the heading
  // truncates at a word boundary with an ellipsis, staying within two wrapped lines.
  const longTitle = 'Senior Regional Operations Manager Responsible For Roadside Assistance Claims Across Northern Europe';
  const longFixture = JSON.parse(JSON.stringify(fixture));
  longFixture.contexts[0].title = longTitle;
  const vmLong = buildActorViewModel(longFixture);
  const d = buildDeck([vmLong], opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const s = d.slides[0];
  const headingEl = headingElAt(s, 1);
  const headingText = headingEl.paragraphs[0].text;
  assert(headingText.endsWith('…'), 'long context title heading is truncated with an ellipsis');
  assert(flow.estimateLines(headingText, sumColW - 2 * sumColP, theme.typography.scale.h3, metrics) <= 2, 'truncated heading fits within two wrapped lines');
  for (let i = 0; i < 3; i++) {
    const capEl = captionElAt(s, i);
    const listEl = listElAt(s, i);
    assert(capEl && listEl && listEl.y >= capEl.y + capEl.h - 1e-9, `column ${i}: list starts at or after the caption's bottom edge`);
  }
  assert(inBounds(s), 'summary slide with a max-length context title stays within bounds');
}
{
  // Fix round 1, finding 3: badgeWidth() sizes the type badge and the demographics strip is
  // placed after it, so a long type label (ORGANISATION) can never overlap the strip.
  const orgVm = buildActorViewModel({ ...sarah, actorType: 'organisation' });
  const d = buildDeck([orgVm], opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const s = d.slides[0];
  const badge = s.elements.find(e => e.type === 'rect' && Math.abs(e.y - 0.78) < 1e-9 && Math.abs(e.x - LAYOUT.summary.nameX) < 1e-9);
  const strip = s.elements.find(e => e.type === 'text' && Math.abs(e.y - 0.78) < 1e-9 && e.x > LAYOUT.summary.nameX + 0.01);
  assert(badge && strip, 'organisation badge and demographics strip both render');
  assert(strip.x >= badge.x + badge.w - 1e-9, 'demographics strip starts at or after the badge right edge (no overlap)');
}
{
  // Fix round 1, reviewer minor: the quote gets the same never-shrink, fitParagraph-based
  // truncation as the summary paragraph, and warns like the other summary slots.
  const longQuote = Array.from({ length: 10 }, (_, i) => `This is sentence number ${i} of a very long quote that keeps going on and on.`).join(' ');
  const vmQ = buildActorViewModel({ ...sarah, quote: longQuote });
  const d = buildDeck([vmQ], opts({ sections: { cover: false, index: false, summary: true, appendix: false } }));
  const s = d.slides[0];
  const quoteEl = s.elements.find(e => e.type === 'text' && Math.abs(e.x - LAYOUT.summary.quoteX) < 1e-9);
  assert(quoteEl && quoteEl.paragraphs[0].text.endsWith('…'), 'long quote is truncated with an ellipsis');
  assert(d.warnings.some(w => w.code === 'SUMMARY_TRUNCATED' && w.slot === 'quote'), 'quote truncation is warned');
}

section('Appendix — blocks');
{
  const vm = vmsOf([adam])[0];
  const ctx = { C: theme.colour.light, S: theme.typography.scale, metrics, warn: () => {} };
  const blocks = dm.appendixBlocks(vm, ctx);
  assert(blocks.length > 20, 'a real actor yields many blocks', String(blocks.length));
  assert(blocks.every(b => ['band', 'heading', 'paragraph', 'list'].includes(b.kind) && typeof b.sectionId === 'string' && b.style && b.style.size > 0), 'every block is well-formed');
  const bands = blocks.filter(b => b.kind === 'band').map(b => b.text);
  assert(bands[0] === 'Traits', 'first band is Traits');
  assert(bands.some(t => t.startsWith(adam.contexts[0].title)), 'a band per context, titled by the context');
  assert(bands.some(t => t.startsWith('What emerges')), 'emergence band nested after its context');
  assert(bands.indexOf(bands.find(t => t.startsWith('What emerges'))) > bands.indexOf(bands.find(t => t.startsWith(adam.contexts[0].title))), 'emergence follows its context');
  assert(bands.includes('Relationships'), 'relationships band present by default');
  assert(!bands.includes('Provenance') && !bands.includes('Governance'), 'provenance/governance absent by default');
  const headings = blocks.filter(b => b.kind === 'heading').map(b => b.text);
  assert(['Demographics', 'Needs', 'Frustrations', 'Technology'].every(h => headings.includes(h)), 'trait groups appear as headings under the Traits band');
  assert(headings.includes('Goals as experienced') && headings.includes('Pain points'), 'emergence sub-headings');
  const traitsBand = blocks.find(b => b.kind === 'band' && b.text === 'Traits');
  assert(traitsBand.style.fill === theme.colour.light.traits, 'traits band uses the traits layer colour');
  assert(blocks.find(b => b.kind === 'band' && b.text.startsWith('What emerges')).style.fill === theme.colour.light.emergence, 'emergence band uses the emergence colour');
}
{
  const vm = vmsOf([sarah], { sections: { provenance: true, governance: true } })[0];
  const blocks = dm.appendixBlocks(vm, { C: theme.colour.light, S: theme.typography.scale, metrics, warn: () => {} });
  const bands = blocks.filter(b => b.kind === 'band').map(b => b.text);
  assert(bands.includes('Provenance') && bands.includes('Governance'), 'provenance/governance bands when selected');
  assert(blocks.some(b => b.kind === 'heading' && b.text === 'Details'), 'context details rendered (Deviation 3)');
}
{
  const orphan = JSON.parse(JSON.stringify(fixture));
  orphan.emergence.push({ contextRef: 'ctx-missing', goalsAsExperienced: [{ goal: 'Orphan goal', source: 'traits', priority: 'primary' }], painPoints: [], opportunities: [], emotionalContext: '', useCases: [], successMetrics: [] });
  const vm = buildActorViewModel(orphan);
  const blocks = dm.appendixBlocks(vm, { C: theme.colour.light, S: theme.typography.scale, metrics, warn: () => {} });
  assert(blocks.some(b => b.kind === 'band' && b.text.includes('unattributed') && b.text.includes('ctx-missing')), 'unattributed emergence gets its own band naming the ref');
}

section('Appendix — slides');
{
  const d = buildDeck(vmsOf([adam]), opts({ sections: { cover: false, index: false, summary: false, appendix: true } }));
  const app = d.slides;
  assert(app.length >= 3 && app.length <= 12 && app.every(s => s.kind === 'appendix' && s.actorId === 'actor-adam-rees'), 'heaviest actor paginates to 3–12 appendix slides', String(app.length));
  assert(app.every(inBounds), 'every appendix slide within bounds');
  const all = app.map(textOf).join('\n');
  for (const n of adam.traits.needs) assert(all.includes(n.need), `need present: ${n.need.slice(0, 30)}…`);
  for (const f of adam.traits.frustrations) assert(all.includes(f.frustration), `frustration present: ${f.frustration.slice(0, 30)}…`);
  for (const g of adam.emergence[0].goalsAsExperienced) assert(all.includes(g.goal), `goal present: ${g.goal.slice(0, 30)}…`);
  assert(all.includes(adam.contexts[0].description), 'context description present');
  assert(app.slice(1).some(s => textOf(s).includes('(cont.)')), 'continuation bands appear');
  assert(app.every(s => textOf(s).includes('Adam Rees')), 'slim header names the actor on every appendix slide');
  assert(app.every(s => s.elements.every(e => e.type !== 'text' || e.size >= theme.typography.scale.caption)), 'no text below caption size');
  assert(app.every(s => textOf(s).includes(`${adam.id} · v${adam.version}`)), 'footer on every slide');
}
{
  const d = buildDeck(vmsOf([fixture]), opts({ sections: { cover: false, index: false, summary: false, appendix: true } }));
  const all = d.slides.map(textOf).join('\n');
  assert(['Alpha Role', 'Beta Role', 'Gamma Role'].every(t => all.includes(t)), 'all three contexts rendered');
  assert(all.includes('Beta goal') && all.includes('Alpha goal one'), 'each context carries its own emergence');
  const emBands = d.slides.flatMap(s => s.elements.filter(e => e.type === 'text').flatMap(e => e.paragraphs.map(p => p.text))).filter(t => t.startsWith('What emerges') && !t.includes('(cont.)'));
  assert(emBands.length === 2, 'exactly two emergence bands, continuation bands excluded (gamma has none)', String(emBands.length));
}
{
  const d = buildDeck(vmsOf([adam, daniel]), opts());
  const kinds = d.slides.map(s => s.kind);
  const nA = d.slides.filter(s => s.kind === 'appendix' && s.actorId === 'actor-adam-rees').length;
  const nD = d.slides.filter(s => s.kind === 'appendix' && s.actorId === 'actor-daniel-rees').length;
  assert(d.slides.length === 1 + 1 + 2 + nA + nD, 'slide-count formula: cover + index + N summaries + Σ appendix');
  assert(kinds.indexOf('appendix') > kinds.lastIndexOf('summary'), 'all summaries precede all appendices');
  assert(d.warnings.some(w => String(w.code).startsWith('APPENDIX_')), 'pagination warnings forwarded');
  const pages = d.slides.flatMap(s => s.elements.filter(e => e.type === 'text' && e.align === 'right' && e.y === LAYOUT.footerY).map(e => e.paragraphs[0].text));
  const expected = d.slides.map((s, i) => (s.kind === 'cover' ? null : String(i + 1))).filter(Boolean);
  assert(pages.join(',') === expected.join(','), 'footer page numbers equal the slide index on every non-cover slide, in order', pages.join(','));
}

module.exports = { assert, section, load, adam, daniel, sarah, fixture, theme, metrics, vmsOf, opts, textOf, inBounds, finish: () => { console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
if (require.main === module) module.exports.finish();
