// flow.js — height estimation and pagination for the PPTX renderer.
// PptxGenJS has no text-measurement API (PowerPoint lays text out at open time), so heights are
// estimated from font metrics in tools/design-tokens.json and calibrated against LibreOffice
// renders via verify-pptx.sh's overflow oracle. Font size is NEVER reduced here (spec §6).
// Pure: no I/O, no PptxGenJS.

'use strict';

const FLOW = Object.freeze({
  wrapSlack: 1.15,     // word-wrap loses partial lines; inflate the raw line count
  safety: 1.10,        // margin on every estimate; tuned in Task 13 against the overflow oracle
  paraSpacePt: 4,      // space after each paragraph / list item, in points
  bulletIndentIn: 0.2, // horizontal room a bullet takes from the text width
  bandPadPt: 6         // vertical padding above and below a band's text
});

function estimateLines(text, widthIn, sizePt, metrics) {
  const charsPerLine = Math.max(1, Math.floor((widthIn * 72) / (sizePt * metrics.avgCharWidthEm)));
  const paragraphs = String(text || '').split('\n');
  return paragraphs.reduce((n, p) => n + Math.max(1, Math.ceil((p.length / charsPerLine) * FLOW.wrapSlack)), 0);
}

function itemText(it) {
  return it.primary + (it.secondary ? ` — ${it.secondary}` : '') + (it.badge ? ` [${it.badge}]` : '');
}

function lineHeightIn(sizePt, metrics) { return (sizePt * metrics.lineHeightEm) / 72; }

function estimateBlockHeight(block, widthIn, metrics) {
  const size = block.style.size;
  let h;
  if (block.kind === 'band') {
    h = (size * metrics.lineHeightEm + 2 * FLOW.bandPadPt) / 72;
  } else if (block.kind === 'heading' || block.kind === 'paragraph') {
    h = estimateLines(block.text, widthIn, size, metrics) * lineHeightIn(size, metrics) + FLOW.paraSpacePt / 72;
  } else if (block.kind === 'list') {
    const w = Math.max(0.5, widthIn - FLOW.bulletIndentIn);
    h = block.items.reduce((acc, it) => acc + estimateLines(itemText(it), w, size, metrics) * lineHeightIn(size, metrics) + FLOW.paraSpacePt / 72, 0);
  } else {
    throw new Error(`flow: unknown block kind "${block.kind}"`);
  }
  return h * FLOW.safety;
}

function splitSentences(text) {
  const parts = String(text).match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [String(text)];
  return parts.map(s => s.trim()).filter(Boolean);
}

// Split an oversized block into a head that fits in `availIn` and a tail. Returns null if even
// one unit (item / sentence) does not fit, so the caller moves the whole block to a fresh page.
function splitBlock(block, availIn, widthIn, metrics) {
  if (block.kind === 'list') {
    let n = 0;
    for (let i = 1; i <= block.items.length; i++) {
      if (estimateBlockHeight({ ...block, items: block.items.slice(0, i) }, widthIn, metrics) <= availIn) n = i; else break;
    }
    if (n === 0 || n === block.items.length) return null;
    return { head: { ...block, items: block.items.slice(0, n) }, tail: { ...block, items: block.items.slice(n) } };
  }
  if (block.kind === 'paragraph') {
    const sentences = splitSentences(block.text);
    if (sentences.length < 2) return null;
    let n = 0;
    for (let i = 1; i <= sentences.length; i++) {
      if (estimateBlockHeight({ ...block, text: sentences.slice(0, i).join(' ') }, widthIn, metrics) <= availIn) n = i; else break;
    }
    if (n === 0 || n === sentences.length) return null;
    return { head: { ...block, text: sentences.slice(0, n).join(' ') }, tail: { ...block, text: sentences.slice(n).join(' ') } };
  }
  return null;   // bands and headings never split
}

function paginate(blocks, frame, metrics) {
  const pages = [];
  const warnings = [];
  const bandBySection = new Map();
  let page = { blocks: [] };
  let cursor = frame.y;
  const bottom = frame.y + frame.h;
  const EPS = 1e-9;

  const place = (b) => {
    const h = estimateBlockHeight(b, frame.w, metrics);
    page.blocks.push({ ...b, y: cursor, h });
    cursor += h;
  };
  const newPage = (sectionId, reason) => {
    pages.push(page);
    page = { blocks: [] };
    cursor = frame.y;
    warnings.push({ reason, sectionId, page: pages.length + 1 });
    const band = bandBySection.get(sectionId);
    if (band) place({ ...band, text: `${band.text} (cont.)`, continued: true });
  };

  const queue = blocks.slice();
  while (queue.length) {
    const b = queue.shift();
    if (b.kind === 'band') bandBySection.set(b.sectionId, b);
    const h = estimateBlockHeight(b, frame.w, metrics);
    if (cursor + h <= bottom + EPS) { place(b); continue; }

    const avail = bottom - cursor;
    const pageIsFresh = page.blocks.length === 0 || (page.blocks.length === 1 && page.blocks[0].continued);
    const parts = splitBlock(b, avail, frame.w, metrics);
    if (parts) {                       // partial fit: place head, push tail to the front of the queue
      place(parts.head);
      newPage(b.sectionId, 'split');
      queue.unshift(parts.tail);
      continue;
    }
    if (!pageIsFresh) {                // whole block to next page
      newPage(b.sectionId, 'spill');
      queue.unshift(b);
      continue;
    }
    // Fresh page and still does not fit and cannot split (single huge sentence / item): place it anyway
    // so nothing is lost, and warn. verify-pptx.sh will flag it if it really overflows.
    warnings.push({ reason: 'spill', sectionId: b.sectionId, page: pages.length + 1, oversized: true });
    place(b);
  }
  pages.push(page);
  return { pages: pages.filter((p, i) => p.blocks.length > 0 || i === 0), warnings };
}

function fitItems(items, widthIn, maxHeightIn, style, metrics, cap) {
  if (!items || items.length === 0) return { items: [], truncated: false };
  const limit = Math.min(cap, items.length);
  let n = 0;
  for (let i = 1; i <= limit; i++) {
    const h = estimateBlockHeight({ kind: 'list', sectionId: 'fit', items: items.slice(0, i), style }, widthIn, metrics);
    if (h <= maxHeightIn) n = i; else break;
  }
  if (n === 0) n = 1;                  // minimum one item, never zero (spec §5)
  return { items: items.slice(0, n), truncated: n < items.length };
}

module.exports = { FLOW, estimateLines, estimateBlockHeight, itemText, paginate, fitItems, splitSentences, splitBlock, lineHeightIn };
