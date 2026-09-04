// Tests for tools/renderers/pptx/overflow-check.js — the pdftotext -bbox parser and overflow oracle.
// Run from project root: node tools/renderers/test-overflow-check.js

'use strict';
const { parseBbox, findOverflow, SAFE_INSET_PT } = require('./pptx/overflow-check');
let passed = 0, failed = 0;
function assert(c, label, detail) { if (c) { console.log(`  PASS: ${label}`); passed++; } else { console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; } }

// Shape of pdftotext -bbox output (poppler 26.x): <page width="960.000000" height="540.000000"> … <word xMin=".." yMin=".." xMax=".." yMax="..">text</word>
const sample = `<!DOCTYPE html><html><head></head><body><doc>
<page width="960.000000" height="540.000000">
  <word xMin="36.0" yMin="20.0" xMax="90.5" yMax="40.0">Traits</word>
  <word xMin="36.0" yMin="500.0" xMax="70.0" yMax="539.5">fits</word>
  <word xMin="36.0" yMin="530.0" xMax="70.0" yMax="552.0">spills</word>
  <word xMin="900.0" yMin="100.0" xMax="975.0" yMax="120.0">wide</word>
</page>
<page width="960.000000" height="540.000000">
  <word xMin="36.0" yMin="20.0" xMax="90.5" yMax="40.0">clean</word>
</page>
</doc></body></html>`;

const pages = parseBbox(sample);
assert(pages.length === 2, 'two pages parsed');
assert(pages[0].width === 960 && pages[0].height === 540, 'page size parsed as numbers');
assert(pages[0].words.length === 4 && pages[0].words[0].text === 'Traits' && pages[0].words[0].yMax === 40, 'words parsed with coordinates');
const over = findOverflow(pages);
assert(over.length === 2, 'two overflowing words found', JSON.stringify(over));
assert(over.some(o => o.page === 1 && o.text === 'spills') && over.some(o => o.page === 1 && o.text === 'wide'), 'vertical and horizontal overflow both reported with page numbers');
assert(findOverflow(pages, 20).length === 0, 'tolerance suppresses small overflows');
assert(findOverflow([]).length === 0, 'no pages → no overflow');
assert(parseBbox('<html></html>').length === 0, 'no pages in html → empty');

// The safe-area inset (added in Task 13 after the canary proved LibreOffice clips overflowing text
// at the page box — see the note at the top of overflow-check.js). insetPt shrinks the allowed area
// on all four sides, so text pressed against the slide edge — the only observable symptom of
// clipped overflow — is reported.
const clipped = parseBbox(`<page width="960.000000" height="540.000000">
  <word xMin="36.0" yMin="20.0" xMax="90.5" yMax="40.0">safe</word>
  <word xMin="36.0" yMin="523.9" xMax="90.0" yMax="537.9">clipped</word>
  <word xMin="930.0" yMin="100.0" xMax="955.0" yMax="120.0">edge</word>
  <word xMin="4.0" yMin="200.0" xMax="30.0" yMax="220.0">bleed</word>
</page>`);
assert(findOverflow(clipped, 1, 0).length === 0, 'inset 0 → page-box behaviour, clipped-but-on-page text is not flagged');
const inset = findOverflow(clipped, 1, SAFE_INSET_PT).map(o => o.text).sort();
assert(inset.join(',') === 'bleed,clipped,edge', 'inset flags text in the outer band on every side', JSON.stringify(inset));
assert(!inset.includes('safe'), 'inset leaves text well inside the slide alone');
assert(SAFE_INSET_PT > 3 && SAFE_INSET_PT < 21, 'SAFE_INSET_PT sits between the canary (fires above ~3pt) and real content (false-positives above ~21pt)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
