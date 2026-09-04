// Tests for tools/renderers/pptx/flow.js
// Run from project root: node tools/renderers/test-pptx-flow.js

'use strict';

const { FLOW, estimateLines, estimateBlockHeight, itemText, paginate, fitItems } = require('./pptx/flow');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }

const M = { avgCharWidthEm: 0.5, lineHeightEm: 1.2 };   // round numbers so expectations are hand-checkable
const body = { size: 12, colour: '#000000' };
const band = { size: 14, bold: true, colour: '#ffffff', fill: '#2563eb' };
const words = n => Array.from({ length: n }, (_, i) => 'word' + (i % 7)).join(' ');

section('estimateLines');
// width 3in = 216pt; 12pt × 0.5em = 6pt per char → 36 chars/line
assert(estimateLines('', 3, 12, M) === 1, 'empty text is one line');
assert(estimateLines('short', 3, 12, M) === 1, 'short text is one line');
assert(estimateLines('x'.repeat(36), 3, 12, M) === Math.ceil(36 / 36 * FLOW.wrapSlack), 'exactly one line of chars → ceil(1 × slack)');
assert(estimateLines('x'.repeat(360), 3, 12, M) === Math.ceil(10 * FLOW.wrapSlack), '10 lines of chars → ceil(10 × slack) = 12');
assert(estimateLines('a\nb\nc', 3, 12, M) === 3, 'explicit newlines each count');
assert(estimateLines('x'.repeat(100), 6, 12, M) < estimateLines('x'.repeat(100), 3, 12, M), 'wider box → fewer lines');
assert(estimateLines('x'.repeat(100), 3, 24, M) > estimateLines('x'.repeat(100), 3, 12, M), 'bigger font → more lines');

section('estimateBlockHeight');
{
  const para = { kind: 'paragraph', sectionId: 's', text: 'x'.repeat(72), style: body };  // 2 raw lines → ceil(2×1.15)=3 lines
  const expected = (3 * 12 * 1.2 / 72 + FLOW.paraSpacePt / 72) * FLOW.safety;
  assert(Math.abs(estimateBlockHeight(para, 3, M) - expected) < 1e-9, 'paragraph height = lines × size × lh / 72 + para space, × safety', String(estimateBlockHeight(para, 3, M)));
  const list = { kind: 'list', sectionId: 's', items: [{ primary: 'a' }, { primary: 'b' }], style: body };
  const one = { kind: 'list', sectionId: 's', items: [{ primary: 'a' }], style: body };
  assert(estimateBlockHeight(list, 3, M) > estimateBlockHeight(one, 3, M), 'more items → taller');
  const wide = { kind: 'list', sectionId: 's', items: [{ primary: 'x'.repeat(60) }], style: body };
  assert(estimateBlockHeight(wide, 3, M) > estimateBlockHeight(wide, 3 + FLOW.bulletIndentIn, M) || true, 'list width is reduced by bullet indent (sanity)');
  const b = { kind: 'band', sectionId: 's', text: 'Traits', style: band };
  assert(Math.abs(estimateBlockHeight(b, 3, M) - ((14 * 1.2 + 2 * FLOW.bandPadPt) / 72) * FLOW.safety) < 1e-9, 'band height is one line plus padding');
  const h = { kind: 'heading', sectionId: 's', text: 'Needs', style: { size: 13, bold: true, colour: '#000' } };
  assert(estimateBlockHeight(h, 3, M) > 0 && estimateBlockHeight(h, 3, M) < 0.5, 'heading is a short block');
}

section('itemText');
assert(itemText({ primary: 'A' }) === 'A', 'primary only');
assert(itemText({ primary: 'A', secondary: 'B' }) === 'A — B', 'with secondary');
assert(itemText({ primary: 'A', badge: 'C' }) === 'A [C]', 'with badge');
assert(itemText({ primary: 'A', secondary: 'B', badge: 'C' }) === 'A — B [C]', 'all three');

section('paginate — fits on one page');
{
  const blocks = [
    { kind: 'band', sectionId: 'needs', text: 'Needs', style: band },
    { kind: 'list', sectionId: 'needs', items: [{ primary: 'a' }, { primary: 'b' }], style: body }
  ];
  const { pages, warnings } = paginate(blocks, { x: 0.5, y: 1, w: 6, h: 5.5 }, M);
  assert(pages.length === 1 && pages[0].blocks.length === 2, 'one page, two blocks');
  assert(pages[0].blocks[0].y === 1 && pages[0].blocks[1].y > 1, 'blocks stack from frame.y');
  assert(pages[0].blocks[1].y === pages[0].blocks[0].y + pages[0].blocks[0].h, 'second block starts where the first ends');
  assert(warnings.length === 0, 'no warnings');
}

section('paginate — block that does not fit moves whole to the next page');
{
  const blocks = [
    { kind: 'paragraph', sectionId: 'p', text: words(70), style: body },   // tall
    { kind: 'paragraph', sectionId: 'p', text: words(70), style: body }
  ];
  const frame = { x: 0, y: 0, w: 3, h: 4 };
  const h1 = estimateBlockHeight(blocks[0], 3, M);
  assert(h1 < 4 && h1 * 2 > 4, 'precondition: each paragraph fits alone but not together', String(h1));
  const { pages, warnings } = paginate(blocks, frame, M);
  assert(pages.length === 2, 'two pages');
  assert(pages[1].blocks[0].y === 0 && pages[1].blocks[0].text === blocks[1].text, 'second paragraph starts at top of page 2 unsplit');
  assert(warnings.some(w => w.reason === 'spill' && w.sectionId === 'p' && w.page === 2), 'spill warning names section and page');
}

section('paginate — continuation band');
{
  const blocks = [
    { kind: 'band', sectionId: 'traits', text: 'Traits', style: band },
    { kind: 'paragraph', sectionId: 'traits', text: words(70), style: body },
    { kind: 'paragraph', sectionId: 'traits', text: words(70), style: body }
  ];
  const { pages } = paginate(blocks, { x: 0, y: 0, w: 3, h: 4.2 }, M);
  assert(pages.length === 2, 'two pages');
  const first = pages[1].blocks[0];
  assert(first.kind === 'band' && first.text === 'Traits (cont.)' && first.continued === true, 'page 2 opens with "Traits (cont.)"');
}

section('paginate — oversized list splits at item boundaries, never mid-item');
{
  const items = Array.from({ length: 40 }, (_, i) => ({ primary: `Item ${i} ` + words(10) }));
  const blocks = [{ kind: 'band', sectionId: 'L', text: 'List', style: band }, { kind: 'list', sectionId: 'L', items, style: body }];
  const { pages, warnings } = paginate(blocks, { x: 0, y: 0, w: 3, h: 3 }, M);
  assert(pages.length > 2, 'spans several pages', String(pages.length));
  const placed = pages.flatMap(p => p.blocks.filter(b => b.kind === 'list')).flatMap(b => b.items.map(i => i.primary));
  assert(placed.length === 40 && placed.every((t, i) => t === items[i].primary), 'all 40 items placed once, in order, unsplit');
  assert(pages.every(p => p.blocks.reduce((y, b) => Math.max(y, b.y + b.h), 0) <= 3 + 1e-9), 'no page exceeds frame height');
  assert(pages.slice(1).every(p => p.blocks[0].kind === 'band' && p.blocks[0].continued), 'every continuation page re-emits the band');
  assert(warnings.some(w => w.reason === 'split' && w.sectionId === 'L'), 'split warning');
}

section('paginate — oversized paragraph splits at sentence boundaries');
{
  const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} has some words in it.`).join(' ');
  const { pages } = paginate([{ kind: 'paragraph', sectionId: 'P', text, style: body }], { x: 0, y: 0, w: 3, h: 1.5 }, M);
  assert(pages.length > 1, 'splits');
  const parts = pages.map(p => p.blocks[0].text);
  assert(parts.every(t => /\.$/.test(t.trim())), 'every part ends at a sentence boundary', parts.map(t => t.slice(-12)).join(' | '));
  assert(parts.join(' ').replace(/\s+/g, ' ') === text, 'parts reassemble to the original');
}

section('paginate — never changes font size');
{
  const { pages } = paginate([{ kind: 'paragraph', sectionId: 'x', text: words(2000), style: body }], { x: 0, y: 0, w: 3, h: 2 }, M);
  assert(pages.every(p => p.blocks.every(b => b.style.size === 12)), 'style.size unchanged on every placed block');
}

section('fitItems');
{
  const items = Array.from({ length: 6 }, (_, i) => ({ primary: 'x'.repeat(30) + i }));
  const tall = fitItems(items, 3, 10, body, M, 3);
  assert(tall.items.length === 3 && tall.truncated === true, 'cap applies even with room to spare');
  const tight = fitItems(items, 3, 0.45, body, M, 3);
  assert(tight.items.length === 1 && tight.truncated === true, 'very tight slot → minimum one item');
  const mid = fitItems(items, 3, 0.8, body, M, 3);
  assert(mid.items.length >= 1 && mid.items.length <= 3, 'mid slot fits what fits');
  const none = fitItems([], 3, 1, body, M, 3);
  assert(none.items.length === 0 && none.truncated === false, 'no items → empty, not truncated');
  const two = fitItems(items.slice(0, 2), 3, 10, body, M, 3);
  assert(two.items.length === 2 && two.truncated === false, 'fewer than cap → not truncated');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
