// Tests for tools/renderers/pptx/overflow-check.js — the pdftotext -bbox parser and overflow oracle.
// Run from project root: node tools/renderers/test-overflow-check.js

'use strict';
const fs = require('fs');
const path = require('path');
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
assert(pages[1].words.length === 1 && pages[1].words[0].text === 'clean', 'the second page parses its own word (the shared word regex is reset per page)', JSON.stringify(pages[1].words));
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
  <word xMin="500.0" yMin="-6.0" xMax="560.0" yMax="8.0">crown</word>
</page>`);
const at0 = findOverflow(clipped, 1, 0).map(o => o.text).sort();
assert(at0.join(',') === 'crown', 'inset 0 → page-box behaviour: only the word off the page top is flagged, clipped-but-on-page text is not', JSON.stringify(at0));
const inset = findOverflow(clipped, 1, SAFE_INSET_PT).map(o => o.text).sort();
assert(inset.join(',') === 'bleed,clipped,crown,edge', 'inset flags text in the outer band on every side, top edge included', JSON.stringify(inset));
assert(!inset.includes('safe'), 'inset leaves text well inside the slide alone');
assert(SAFE_INSET_PT > 3 && SAFE_INSET_PT < 21, 'SAFE_INSET_PT sits between the canary (fires above ~3pt) and real content (false-positives above ~21pt)');

// The CLI must FAIL CLOSED. Parsing nothing used to print "0 pages, 0 words" and exit 0, so a change
// in poppler's -bbox output shape would have turned the gate green for every deck at once.
const { spawnSync } = require('child_process');
const os = require('os');
const cliPath = path.join(__dirname, 'pptx', 'overflow-check.js');
const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'overflow-check-')), 'bbox.html');
fs.writeFileSync(tmpFile, '<html></html>');
const run = spawnSync(process.execPath, [cliPath, tmpFile], { encoding: 'utf8' });
assert(run.status === 2, 'CLI exits 2 when no page parses (fails closed, not open)', `exit ${run.status}`);
assert(/parsed 0 pages/.test(run.stderr), 'CLI says why it refused', JSON.stringify(run.stderr.trim()));
fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
