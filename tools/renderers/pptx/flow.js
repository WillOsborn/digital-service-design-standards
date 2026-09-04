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

// Partition `text` into contiguous, whitespace-preserving segments whose join() reconstructs the
// original string exactly, always — slice indices of the original string, never regex extraction,
// so no character is ever dropped or altered. A boundary falls:
//   (a) immediately after a run of [.!?]+ that is followed by a space/tab, placed after that run
//       of spaces/tabs (so "v2.0" — a '.' NOT followed by whitespace — is never a boundary), or
//   (b) immediately after a '\n' (each newline is its own cut point, matching estimateLines'
//       treatment of '\n' as a paragraph break).
function splitSentences(text) {
  const s = String(text);
  const segments = [];
  let start = 0;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\n') {
      segments.push(s.slice(start, i + 1));
      start = i + 1;
      i += 1;
      continue;
    }
    if (ch === '.' || ch === '!' || ch === '?') {
      let j = i + 1;
      while (j < s.length && (s[j] === '.' || s[j] === '!' || s[j] === '?')) j += 1;
      let k = j;
      while (k < s.length && (s[k] === ' ' || s[k] === '\t')) k += 1;
      if (k > j) {                 // punctuation run followed by at least one space/tab: cut here
        segments.push(s.slice(start, k));
        start = k;
        i = k;
        continue;
      }
      i = j;                       // punctuation not followed by space/tab (e.g. "v2.0"): keep scanning
      continue;
    }
    i += 1;
  }
  if (start < s.length) segments.push(s.slice(start));
  return segments;
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
    const segments = splitSentences(block.text);
    if (segments.length < 2) return null;
    let n = 0;
    for (let i = 1; i <= segments.length; i++) {
      const headText = segments.slice(0, i).join('').trimEnd();
      if (estimateBlockHeight({ ...block, text: headText }, widthIn, metrics) <= availIn) n = i; else break;
    }
    if (n === 0 || n === segments.length) return null;
    // Trim only at the cut: head loses its trailing separator, tail loses none of its own text.
    return {
      head: { ...block, text: segments.slice(0, n).join('').trimEnd() },
      tail: { ...block, text: segments.slice(n).join('').trimStart() }
    };
  }
  return null;   // bands and headings never split
}

function paginate(blocks, frame, metrics) {
  const pages = [];
  const warnings = [];
  const bandBySection = new Map();   // registers a section's band only once it is actually placed
  let page = { blocks: [] };
  let cursor = frame.y;
  const bottom = frame.y + frame.h;
  const EPS = 1e-9;

  const place = (b) => {
    const h = estimateBlockHeight(b, frame.w, metrics);
    page.blocks.push({ ...b, y: cursor, h });
    cursor += h;
    // Only a band that is actually being placed registers as "this section's band" — a band that
    // spills whole to the next page must not be looked up (and re-emitted as a continuation of a
    // section that hasn't started yet) before it lands anywhere.
    if (b.kind === 'band' && !b.continued) bandBySection.set(b.sectionId, b);
  };
  const newPage = (sectionId, reason) => {
    pages.push(page);
    page = { blocks: [] };
    cursor = frame.y;
    warnings.push({ reason, sectionId, page: pages.length + 1 });
    const band = bandBySection.get(sectionId);
    if (band) place({ ...band, text: `${band.text} (cont.)`, continued: true });
  };
  // The most room a page can ever offer this section: the full frame, minus the band this section
  // must re-emit if it is already known to span pages. A block taller than this can never fit
  // whole on any page — fresh or continued — so it has to split instead of just spilling forever.
  const freshRoom = (sectionId) => {
    const band = bandBySection.get(sectionId);
    return frame.h - (band ? estimateBlockHeight(band, frame.w, metrics) : 0);
  };

  const queue = blocks.slice();
  while (queue.length) {
    const b = queue.shift();
    const h = estimateBlockHeight(b, frame.w, metrics);
    const pageIsFresh = page.blocks.length === 0 || (page.blocks.length === 1 && page.blocks[0].continued);

    // Keep-with-next: a band or heading must never be stranded at the bottom of a column with
    // nothing under it. Look ahead through the queue over any run of consecutive band/heading
    // blocks to the first list or paragraph, and require room for that whole chain plus the
    // content block's next placement unit before committing b to a page that already has other
    // content on it. A trailing band/heading with no following content block is unaffected
    // (nothing to keep it with), and a fresh page always takes the chain's head regardless — the
    // existing oversized-block handling covers what happens next.
    //
    // The unit used for that content block matters: a list/paragraph that is NOT taller than a
    // fresh page (h <= freshRoom) is placed atomically elsewhere in this function — it either
    // fits the room it's given or spills WHOLE to the next page (spec §6), it is never split just
    // because the leftover is small. So for that (by far the common) case, checking only the
    // block's first item/sentence understates what "keeping it with the heading" requires — the
    // heading must be measured against the content's FULL height, or the heading can still end up
    // placed while the whole (unsplit) list spills away from it. Only when the content itself is
    // taller than a fresh page (h > freshRoom) will it actually split at an item/sentence
    // boundary regardless of where it starts — there, the first unit is enough, since a fragment
    // of it is guaranteed to land right after the heading either way.
    if (b.kind === 'band' || b.kind === 'heading') {
      let chainH = h;
      let j = 0;
      while (j < queue.length && (queue[j].kind === 'band' || queue[j].kind === 'heading')) {
        chainH += estimateBlockHeight(queue[j], frame.w, metrics);
        j += 1;
      }
      const content = queue[j];
      if (content && (content.kind === 'list' || content.kind === 'paragraph')) {
        const contentH = estimateBlockHeight(content, frame.w, metrics);
        const willSplit = contentH > freshRoom(content.sectionId) + EPS;
        const unit = willSplit
          ? (content.kind === 'list'
              ? { ...content, items: content.items.slice(0, 1) }
              : { ...content, text: (splitSentences(content.text)[0] || content.text) })
          : content;
        chainH += willSplit ? estimateBlockHeight(unit, frame.w, metrics) : contentH;
        if (cursor + chainH > bottom + EPS && !pageIsFresh) {
          newPage(b.sectionId, 'spill');
          queue.unshift(b);
          continue;
        }
      }
    }

    if (cursor + h <= bottom + EPS) { place(b); continue; }

    const avail = bottom - cursor;
    const room = freshRoom(b.sectionId);

    if (h > room + EPS) {
      // Too tall for any page this section will ever get (spec §6: "a single block taller than a
      // slide splits"). Attempt to split; a block that merely doesn't fit the current leftover —
      // but would fit a fresh page whole — is handled below instead, and is never split.
      const parts = splitBlock(b, avail, frame.w, metrics);
      if (parts) {
        place(parts.head);
        newPage(b.sectionId, 'split');
        queue.unshift(parts.tail);
        continue;
      }
      if (!pageIsFresh) {
        newPage(b.sectionId, 'spill');
        queue.unshift(b);
        continue;
      }
      // Fresh page, still oversized, and cannot split (single huge sentence / item): place it
      // anyway so nothing is lost, and warn. verify-pptx.sh flags it if it really overflows.
      warnings.push({ reason: 'spill', sectionId: b.sectionId, page: pages.length + 1, oversized: true });
      place(b);
      continue;
    }

    // Fits a fresh page whole (spec §6: "a block that does not fit starts a new page") — never
    // split it just because the *current* leftover happens to be too small.
    if (!pageIsFresh) {
      newPage(b.sectionId, 'spill');
      queue.unshift(b);
      continue;
    }
    // Defensive: a fresh page that still can't take a block estimated to fit one (a floating-point
    // edge case at the boundary). Place it anyway rather than loop forever.
    warnings.push({ reason: 'spill', sectionId: b.sectionId, page: pages.length + 1, oversized: true });
    place(b);
  }
  pages.push(page);
  return { pages: pages.filter((p, i) => p.blocks.length > 0 || i === 0), warnings };
}

function fitItems(items, widthIn, maxHeightIn, style, metrics, cap) {
  if (!items || items.length === 0) return { items: [], truncated: false };
  if (cap < 1) return { items: [], truncated: items.length > 0 };
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
