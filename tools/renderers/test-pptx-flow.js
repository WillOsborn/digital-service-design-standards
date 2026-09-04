// Tests for tools/renderers/pptx/flow.js
// Run from project root: node tools/renderers/test-pptx-flow.js

'use strict';

const { FLOW, estimateLines, estimateBlockHeight, itemText, paginate, fitItems, splitSentences } = require('./pptx/flow');

let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }
function section(t) { console.log(`\n${'='.repeat(60)}\n  ${t}\n${'='.repeat(60)}`); }

const M = { avgCharWidthEm: 0.5, lineHeightEm: 1.2 };   // round numbers so expectations are hand-checkable
const body = { size: 12, colour: '#000000' };
const band = { size: 14, bold: true, colour: '#ffffff', fill: '#2563eb' };
const headStyle = { size: 13, bold: true, colour: '#000' };
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
  assert(estimateBlockHeight(wide, 3, M) > estimateBlockHeight(wide, 3 + FLOW.bulletIndentIn, M), 'list width is reduced by bullet indent (sanity)');
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

section('splitSentences — exact, index-based partitioning');
{
  assert(JSON.stringify(splitSentences('v2.0 is here. Next.')) === JSON.stringify(['v2.0 is here. ', 'Next.']), 'a "." not followed by whitespace ("v2.0") is not a boundary; the real sentence break keeps its trailing space');
  assert(splitSentences('...and then it ended. Next one here.').join('') === '...and then it ended. Next one here.', 'a leading run of punctuation is never dropped');
  {
    const segs = splitSentences('a\nb\nc');
    assert(segs.length === 3 && segs.join('') === 'a\nb\nc', 'each newline is its own cut point, and text reassembles exactly');
  }
  const fixtures = [
    'v2.0 is here. Next.',
    '...and then it ended. Next one here.',
    'a\nb\nc',
    'See Dr. Smith. He is here.',
    'No terminators at all here',
    '',
    'Trailing newline.\n',
    'Multiple.   Spaces.\tTabs. Here.'
  ];
  assert(fixtures.every(f => splitSentences(f).join('') === f), 'segments.join("") reconstructs the original string exactly for every fixture');
}

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

section('paginate — keep-with-next: a heading is never stranded from the first item of its list');
{
  // A filler occupies most of the column (making the page non-fresh), leaving just enough room
  // for the heading alone but not for the heading plus the list's first item.
  const filler = { kind: 'paragraph', sectionId: 'filler', text: words(20), style: body };
  const heading = { kind: 'heading', sectionId: 'h1', text: 'Frustrations', style: headStyle };
  const list = { kind: 'list', sectionId: 'h1', items: [{ primary: 'Frustration one is bad' }, { primary: 'Frustration two is worse' }], style: body };
  const list1 = { ...list, items: list.items.slice(0, 1) };
  const fillerH = estimateBlockHeight(filler, 3, M);
  const headingH = estimateBlockHeight(heading, 3, M);
  const list1H = estimateBlockHeight(list1, 3, M);
  const listFullH = estimateBlockHeight(list, 3, M);
  const frame = { x: 0, y: 0, w: 3, h: 1.3 };
  const remaining = frame.h - fillerH;
  assert(remaining >= headingH && remaining < headingH + list1H, 'precondition: the heading alone fits the remaining room, heading + first item does not', `remaining=${remaining} headingH=${headingH} headingH+list1H=${headingH + list1H}`);
  assert(headingH + listFullH <= frame.h, 'precondition: heading + whole list fits a fresh page', `chain=${headingH + listFullH} frame.h=${frame.h}`);
  const { pages } = paginate([filler, heading, list], frame, M);
  assert(pages.length === 2, 'two pages', String(pages.length));
  assert(pages[0].blocks[pages[0].blocks.length - 1].kind !== 'heading', "page 1's last block is not the heading");
  assert(pages[1].blocks[0].kind === 'heading' && pages[1].blocks[0].text === 'Frustrations', 'page 2 opens with the heading');
  assert(pages[1].blocks[1] && pages[1].blocks[1].kind === 'list' && pages[1].blocks[1].items.length === 2, 'the whole list follows the heading on page 2');
}

section('paginate — keep-with-next: a band + heading + list move together');
{
  const filler = { kind: 'paragraph', sectionId: 'filler', text: words(20), style: body };
  const bandBlock = { kind: 'band', sectionId: 's2', text: 'Section Two', style: band };
  const heading = { kind: 'heading', sectionId: 's2', text: 'Frustrations', style: headStyle };
  const list = { kind: 'list', sectionId: 's2', items: [{ primary: 'Frustration one is bad' }, { primary: 'Frustration two is worse' }], style: body };
  const list1 = { ...list, items: list.items.slice(0, 1) };
  const fillerH = estimateBlockHeight(filler, 3, M);
  const bandH = estimateBlockHeight(bandBlock, 3, M);
  const headingH = estimateBlockHeight(heading, 3, M);
  const list1H = estimateBlockHeight(list1, 3, M);
  const listFullH = estimateBlockHeight(list, 3, M);
  const chainFirstUnit = bandH + headingH + list1H;
  const chainFull = bandH + headingH + listFullH;
  const frame = { x: 0, y: 0, w: 3, h: 1.5 };
  const remaining = frame.h - fillerH;
  assert(remaining >= bandH && remaining < chainFirstUnit, 'precondition: the band alone fits the remaining room, band + heading + first item does not', `remaining=${remaining} bandH=${bandH} chainFirstUnit=${chainFirstUnit}`);
  assert(chainFull <= frame.h, 'precondition: band + heading + whole list fits a fresh page', `chainFull=${chainFull} frame.h=${frame.h}`);
  const { pages } = paginate([filler, bandBlock, heading, list], frame, M);
  assert(pages.length === 2, 'two pages', String(pages.length));
  assert(pages[0].blocks.every(b => b.kind !== 'band' && b.kind !== 'heading'), 'page 1 carries none of the band/heading/list chain');
  assert(pages[1].blocks.map(b => b.kind).join(',') === 'band,heading,list', 'page 2 opens with the band, then the heading, then the whole list, in order');
  assert(pages[1].blocks[0].text === 'Section Two' && !pages[1].blocks[0].continued, 'page 2 opens with the band itself, not a continuation');
}

section('paginate — keep-with-next: a trailing heading with no following content still places on the current page');
{
  const filler = { kind: 'paragraph', sectionId: 'filler', text: words(20), style: body };
  const heading = { kind: 'heading', sectionId: 'h2', text: 'Trailing heading', style: headStyle };
  const fillerH = estimateBlockHeight(filler, 3, M);
  const headingH = estimateBlockHeight(heading, 3, M);
  const frame = { x: 0, y: 0, w: 3, h: fillerH + headingH + 0.1 };
  const { pages } = paginate([filler, heading], frame, M);
  assert(pages.length === 1, 'one page — the trailing heading is not deferred just because nothing follows it', String(pages.length));
  assert(pages[0].blocks.length === 2 && pages[0].blocks[1].kind === 'heading', 'the heading places right after the filler on the current page');
}

section('paginate — a band that spills moves whole, never emitted as a phantom continuation first');
{
  // Section A fills page 1 exactly enough that section B's band has no room left on page 1, but
  // easily fits a fresh page 2. Before the fix, the not-yet-placed Beta band was registered in
  // bandBySection ahead of the fit check, so newPage() re-emitted it as "Beta (cont.)" *before*
  // the real band was placed — a section "continuing" before it had ever started.
  const blocks = [
    { kind: 'band', sectionId: 'A', text: 'Alpha', style: band },
    { kind: 'list', sectionId: 'A', items: [{ primary: 'x' }], style: body },
    { kind: 'band', sectionId: 'B', text: 'Beta', style: band },
    { kind: 'list', sectionId: 'B', items: [{ primary: 'y' }], style: body }
  ];
  const frame = { x: 0, y: 0, w: 3, h: 0.9 };
  const { pages } = paginate(blocks, frame, M);
  assert(pages.length === 2, 'two pages', String(pages.length));
  const p2First = pages[1].blocks[0];
  assert(p2First.kind === 'band' && p2First.text === 'Beta' && !p2First.continued, 'page 2 opens with Beta itself, not a continuation');
  const betaBands = pages.flatMap(p => p.blocks).filter(b => b.kind === 'band' && b.text.startsWith('Beta'));
  assert(betaBands.length === 1, 'the Beta band appears exactly once across all pages', String(betaBands.length));
}

section('paginate — a list that fits a fresh page but not the leftover room moves whole (never splits)');
{
  // Reproduces the reported case: a short list is taller than what's left after a paragraph, but
  // shorter than a whole fresh page. Spec §6 says a block that merely doesn't fit starts a new
  // page — splitting is reserved for a block taller than a slide.
  const para = { kind: 'paragraph', sectionId: 'p', text: words(20), style: body };
  const list = { kind: 'list', sectionId: 'p', items: [{ primary: 'a' }, { primary: 'b' }, { primary: 'c' }, { primary: 'd' }], style: body };
  const frame = { x: 0, y: 0, w: 3, h: 1.62 };
  const hPara = estimateBlockHeight(para, 3, M);
  const hList = estimateBlockHeight(list, 3, M);
  assert(hPara + hList > frame.h && hList <= frame.h, 'precondition: list fits a fresh page but not alongside the paragraph', `hPara=${hPara} hList=${hList}`);
  const { pages, warnings } = paginate([para, list], frame, M);
  assert(pages.length === 2, 'two pages', String(pages.length));
  assert(pages[1].blocks.length === 1 && pages[1].blocks[0].kind === 'list' && pages[1].blocks[0].items.length === 4, 'the list lands intact at the top of page 2');
  assert(pages[1].blocks[0].y === 0, 'list starts at the top of page 2');
  assert(!warnings.some(w => w.reason === 'split'), 'no split warning — the list moved whole');
  assert(warnings.some(w => w.reason === 'spill'), 'spill warning present');
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

section('paginate — a list shorter than the frame but taller than a continuation page splits rather than overflowing');
{
  // A list too tall for frame.h - bandHeight (what any continuation page of this section can ever
  // offer) but not too tall for an empty frame. We chose "split" for this case (matching the
  // literal freshRoom rule: split iff h > freshRoom), rather than placing it oversized — see the
  // fix report for the reasoning.
  const items = Array.from({ length: 3 }, (_, i) => ({ primary: 'item ' + i }));
  const list = { kind: 'list', sectionId: 'S', items, style: body };
  const bandBlock = { kind: 'band', sectionId: 'S', text: 'Section', style: band };
  const frame = { x: 0, y: 0, w: 3, h: 1.0 };
  const bandH = estimateBlockHeight(bandBlock, 3, M);
  const listH = estimateBlockHeight(list, 3, M);
  assert(listH <= frame.h && listH > frame.h - bandH, 'precondition: list fits an empty frame but not a continuation page', `bandH=${bandH} listH=${listH}`);
  const { pages, warnings } = paginate([bandBlock, list], frame, M);
  assert(warnings.some(w => w.reason === 'split' && w.sectionId === 'S'), 'the list splits rather than silently overflowing a continuation page');
  const placed = pages.flatMap(p => p.blocks.filter(b => b.kind === 'list')).flatMap(b => b.items.map(i => i.primary));
  assert(placed.length === 3 && placed.every((t, i) => t === items[i].primary), 'all list items placed once, in order');
  assert(pages.every(p => p.blocks.reduce((y, b) => Math.max(y, b.y + b.h), 0) <= frame.h + 1e-9), 'no page exceeds the frame');
}

section('paginate — oversized paragraph splits at sentence boundaries');
{
  const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} has some words in it.`).join(' ');
  const { pages } = paginate([{ kind: 'paragraph', sectionId: 'P', text, style: body }], { x: 0, y: 0, w: 3, h: 1.5 }, M);
  assert(pages.length > 1, 'splits');
  const parts = pages.map(p => p.blocks[0].text);
  assert(parts.every(t => /[.!?]$/.test(t)), 'every part ends at a sentence boundary', parts.map(t => t.slice(-12)).join(' | '));
  assert(parts.join(' ').replace(/\s+/g, '') === text.replace(/\s+/g, ''), 'parts reassemble to the original, ignoring only the whitespace introduced at cuts');

  // A decimal inside a sentence ("2.0") must never be mistaken for a sentence boundary.
  const text2 = Array.from({ length: 20 }, () => 'Version 2.0 ships today.').join(' ');
  const { pages: pages2 } = paginate([{ kind: 'paragraph', sectionId: 'D', text: text2, style: body }], { x: 0, y: 0, w: 3, h: 1.5 }, M);
  const parts2 = pages2.map(p => p.blocks[0].text);
  assert(parts2.length > 1, 'decimal-bearing paragraph also splits', String(parts2.length));
  assert(!parts2.some(t => /2\.$/.test(t.trim())), 'no part ends mid-decimal ("2.")', parts2.map(t => t.slice(-6)).join(' | '));
  assert(parts2.join(' ').replace(/\s+/g, '') === text2.replace(/\s+/g, ''), 'decimal paragraph reassembles exactly, ignoring only cut whitespace');
}

section('paginate — paragraph splitting preserves newlines that are not at the cut');
{
  const lines = Array.from({ length: 20 }, (_, i) => `Line ${i} of the paragraph`);
  const text = lines.join('\n');
  const originalNewlines = (text.match(/\n/g) || []).length;
  const { pages } = paginate([{ kind: 'paragraph', sectionId: 'N', text, style: body }], { x: 0, y: 0, w: 3, h: 1.5 }, M);
  assert(pages.length > 1, 'splits across pages', String(pages.length));
  const parts = pages.map(p => p.blocks[0].text);
  const cuts = parts.length - 1;
  const survivingNewlines = parts.reduce((n, t) => n + (t.match(/\n/g) || []).length, 0);
  assert(survivingNewlines >= originalNewlines - cuts, 'newlines not at a cut point survive the split', `orig=${originalNewlines} cuts=${cuts} surviving=${survivingNewlines}`);
  assert(parts.join('').replace(/\s+/g, '') === text.replace(/\s+/g, ''), 'no content lost across the split');
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
  const zeroCap = fitItems(items, 3, 10, body, M, 0);
  assert(zeroCap.items.length === 0 && zeroCap.truncated === true, 'cap < 1 → empty, truncated (never forces one item)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
