#!/usr/bin/env node
// overflow-check.js — reads `pdftotext -bbox` HTML and reports any word whose box lies outside the
// allowed area of its page.
// This is the automatic overflow oracle for the PPTX renderer (spec §6, §8): if our height estimator
// under-estimates, text runs off the slide, LibreOffice still lays it out, and it shows up here.
// CLI: node overflow-check.js <bbox.html> [--inset <pt>] [--tolerance <pt>]  → exit 1 if anything overflows.
//
// WHY THE INSET (Task 13, canary result — see the plan's Calibration notes):
// LibreOffice's PDF export clips VERTICALLY at the page box. A text box whose content overruns keeps
// flowing down, but every glyph below the page edge is discarded before pdftotext ever sees it, so a
// strict "is any word past the page edge?" test can never fire on DOWNWARD overflow: the canary deck
// (a 14pt box at y=6.5in..7.3in stuffed with 360 words) rendered only 80 words, its last line sitting
// at yMax=537.9 on a 540pt page — 12.3pt BELOW its own box bottom (525.6pt), yet still inside the
// page. Horizontally there is no such clip: glyph boxes do run past the right edge, and the
// horizontal canary fires at inset 0 (xMax 961.8 on a 959.98pt page). So the page box alone catches
// sideways overflow but is blind to the downward kind, which is the kind an estimator produces.
// The observable symptom of that kind is text pressed against the slide edge. `insetPt` shrinks the
// allowed area by that many points on all four sides, turning the outer band of the slide into a
// no-text zone. SAFE_INSET_PT is calibrated for this renderer's decks: real content clears the edges
// by 20.4pt at the tightest (the footer at yMax=519.6), and clipped overflow lands within 2.1pt of
// the edge, so any value in ~4..21pt separates them; 12pt sits in the middle.
//
// LIMIT OF THE ORACLE: it catches overflow that reaches the slide edge, which is what an
// under-counting estimator produces (content flows down a column and off the slide). It does NOT see
// a block that overshoots its own frame and stops short of that edge: with inset 12 and tolerance 1
// the trip line is y > 529pt, while the appendix frame bottom is 500.4pt (6.95in) and the summary
// column bottom 493.2pt (6.85in) — so roughly 0.40in to 0.50in of overshoot past a content frame
// lands in the footer band and is invisible here. That is what the human read of the page-N.png
// renders (spec §8, Task 13 Step 7) is for.

'use strict';
const fs = require('fs');

// Points of slide edge treated as a no-text zone by the CLI. See the note above.
const SAFE_INSET_PT = 12;

function parseBbox(html) {
  const pages = [];
  const pageRe = /<page\s+width="([\d.]+)"\s+height="([\d.]+)">([\s\S]*?)<\/page>/g;
  const wordRe = /<word\s+xMin="([\d.-]+)"\s+yMin="([\d.-]+)"\s+xMax="([\d.-]+)"\s+yMax="([\d.-]+)">([^<]*)<\/word>/g;
  let m;
  while ((m = pageRe.exec(html))) {
    const words = [];
    let w;
    while ((w = wordRe.exec(m[3]))) words.push({ xMin: +w[1], yMin: +w[2], xMax: +w[3], yMax: +w[4], text: w[5] });
    pages.push({ width: +m[1], height: +m[2], words });
  }
  return pages;
}

// insetPt = 0 (default) is the plain page box: a word is overflow only if it leaves the page.
// insetPt > 0 also flags text inside the outer band — the only way clipped overflow is observable.
function findOverflow(pages, tolerancePt = 1, insetPt = 0) {
  const out = [];
  pages.forEach((p, i) => {
    const right = p.width - insetPt, bottom = p.height - insetPt, left = insetPt, top = insetPt;
    for (const w of p.words) {
      if (w.yMax > bottom + tolerancePt || w.xMax > right + tolerancePt || w.yMin < top - tolerancePt || w.xMin < left - tolerancePt) {
        out.push({ page: i + 1, text: w.text, yMax: w.yMax, xMax: w.xMax, height: p.height, width: p.width });
      }
    }
  });
  return out;
}

module.exports = { parseBbox, findOverflow, SAFE_INSET_PT };

if (require.main === module) {
  const args = process.argv.slice(2);
  let inset = SAFE_INSET_PT, tolerance = 1, file = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--inset') inset = Number(args[++i]);
    else if (args[i] === '--tolerance') tolerance = Number(args[++i]);
    else if (!file) file = args[i];
  }
  if (!file) { console.error('Usage: node overflow-check.js <bbox.html> [--inset <pt>] [--tolerance <pt>]'); process.exit(2); }
  if (!Number.isFinite(inset) || !Number.isFinite(tolerance)) { console.error('overflow-check: --inset and --tolerance take a number'); process.exit(2); }
  const pages = parseBbox(fs.readFileSync(file, 'utf8'));
  // Fail closed. Parsing nothing used to print "0 pages, 0 words" and exit 0, so a change in
  // poppler's -bbox output shape would have turned the gate green for every deck at once.
  if (pages.length === 0) {
    console.error('overflow-check: parsed 0 pages — bbox.html not understood (poppler output shape changed?)');
    process.exit(2);
  }
  const over = findOverflow(pages, tolerance, inset);
  const where = inset > 0 ? `inside the ${inset}pt edge band` : 'outside its page';
  console.log(`overflow-check: ${pages.length} pages, ${pages.reduce((n, p) => n + p.words.length, 0)} words (inset ${inset}pt, tolerance ${tolerance}pt)`);
  if (over.length === 0) { console.log(`overflow-check: OK — no word ${where}`); process.exit(0); }
  const byPage = new Map();
  for (const o of over) byPage.set(o.page, (byPage.get(o.page) || []).concat(o.text));
  const what = inset > 0 ? 'inside the edge band' : 'outside the slide';
  for (const [page, words] of byPage) console.error(`overflow-check: page ${page}: ${words.length} word(s) ${what} — "${words.slice(0, 6).join(' ')}${words.length > 6 ? ' …' : ''}"`);
  process.exit(1);
}
