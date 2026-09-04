// Tests for tools/renderers/pptx/writer.js and tools/renderers/render-pptx.js
// Run from project root: node tools/renderers/test-render-pptx.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildActorViewModel } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const { buildDeck } = require('./pptx/deck-model');
const { writeDeck, slideTexts, slideNotes } = require('./pptx/writer');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }
const ROOT = path.join(__dirname, '..', '..');
const load = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const adam = load('v2.0/examples/roadside/actor-adam-rees.json');
const daniel = load('v2.0/examples/roadside/actor-daniel-rees.json');
const { theme } = loadTheme();
const metrics = resolveMetrics(theme);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-pptx-'));

async function writerTests() {
  section('Writer — round trip through the .pptx');
  const ids = [adam.id, daniel.id];
  const vms = [adam, daniel].map(a => buildActorViewModel(a, { deck: { actorIds: ids } }));
  const deck = buildDeck(vms, { theme, metrics, generatedAt: '2026-09-04T00:00:00Z', sources: ['roadside'], sections: {}, images: {} });
  const buf = await writeDeck(deck.slides, theme, { outputType: 'buffer' });
  assert(Buffer.isBuffer(buf) && buf.length > 10000, 'returns a non-trivial Buffer', String(buf && buf.length));
  assert(buf.slice(0, 2).toString() === 'PK', 'buffer is a zip (PK header)');
  const texts = await slideTexts(buf);
  assert(texts.length === deck.slides.length, `one XML slide per slide description (${deck.slides.length})`, String(texts.length));
  assert(texts[0].includes('Actors · 2'), 'cover text survives');
  assert(texts[1].includes('Adam Rees') && texts[1].includes('Daniel Rees'), 'index text survives');
  const sIdx = deck.slides.findIndex(s => s.kind === 'summary');
  assert(texts[sIdx].includes('Enduring traits') && texts[sIdx].includes(adam.quote.slice(0, 20)), 'summary text survives');
  const notes = await slideNotes(buf);
  assert(notes[sIdx] && notes[sIdx].includes('Enduring traits'), 'speaker notes written on the summary slide');
  const allText = texts.join('\n');
  for (const n of adam.traits.needs) assert(allText.includes(n.need), `appendix carries need: ${n.need.slice(0, 28)}…`);
  // No invented text: every text run on every slide must come from the slide description
  const expected = new Set(deck.slides.flatMap(s => s.elements.filter(e => e.type === 'text').flatMap(e => e.paragraphs.map(p => p.text))));
  const runsOnSlides = await slideTexts(buf, { asRuns: true });
  const foreign = runsOnSlides.flat().filter(r => r.trim() && ![...expected].some(t => t.includes(r)));
  assert(foreign.length === 0, 'no text in the file that is not in the slide descriptions', foreign.slice(0, 3).join(' | '));

  section('Writer — file output');
  const fn = path.join(tmp, 'roadside.pptx');
  const written = await writeDeck(deck.slides, theme, { outputType: 'file', fileName: fn });
  assert(written === fn && fs.existsSync(fn) && fs.statSync(fn).size > 10000, 'writes the file and returns its path');

  section('Writer — element coverage');
  const one = { kind: 'cover', background: '#ffffff', elements: [
    { type: 'rect', x: 1, y: 1, w: 2, h: 1, fill: '#123456', line: { colour: '#000000', width: 1 }, radius: 0.1 },
    { type: 'ellipse', x: 4, y: 1, w: 1, h: 1, fill: '#654321' },
    { type: 'line', x1: 1, y1: 3, x2: 5, y2: 2, colour: '#ff0000', width: 2 },
    { type: 'line', x1: 1, y1: 4, x2: 5, y2: 5, colour: '#ff0000', width: 2 },
    { type: 'text', x: 1, y: 5, w: 5, h: 1, paragraphs: [{ text: 'Alpha', bold: true }, { text: 'Beta', bullet: true }, { text: 'Gamma', bullet: true }], size: 12, colour: '#000000' },
    { type: 'image', path: path.join(tmp, 'px.png'), x: 7, y: 1, w: 1, h: 1 }
  ], notes: 'note text' };
  fs.writeFileSync(path.join(tmp, 'px.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
  const b2 = await writeDeck([one], theme, { outputType: 'buffer' });
  const t2 = await slideTexts(b2);
  assert(t2[0].includes('Alpha') && t2[0].includes('Beta') && t2[0].includes('Gamma'), 'all element types write without throwing; text present');
  assert((await slideNotes(b2))[0].includes('note text'), 'notes present');
}

module.exports = { assert, section, ROOT, load, tmp, theme, metrics, adam, daniel, writerTests, execFileSync,
  finish: () => { fs.rmSync(tmp, { recursive: true, force: true }); console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };

if (require.main === module) {
  (async () => {
    await writerTests();
    if (module.exports.cliTests) await module.exports.cliTests();   // Task 12 attaches this
    module.exports.finish();
  })().catch(e => { console.error(e); process.exit(1); });
}
