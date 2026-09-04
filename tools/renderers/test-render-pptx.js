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

  section('Writer — hex() guards a missing colour (M8)');
  {
    let threw = null;
    try {
      await writeDeck([{ kind: 'cover', background: '#ffffff', elements: [{ type: 'rect', x: 1, y: 1, w: 1, h: 1 }] }], theme, { outputType: 'buffer' });
    } catch (e) { threw = e; }
    assert(!!threw && /missing a colour/.test(threw.message), 'a rect with no fill colour rejects with a clear error instead of writing "undefined"', threw && threw.message);
  }
}

async function cliTests() {
  const cli = path.join(__dirname, 'render-pptx.js');
  const { spawnSync } = require('child_process');
  const runCli = (args, extra) => {
    const r = spawnSync(process.execPath, [cli, ...args], Object.assign({ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }, extra || {}));
    return { code: r.status, out: String(r.stdout || ''), err: String(r.stderr || '') };
  };
  const { parseArgs, expandInputs } = require('./render-pptx');

  section('CLI — parseArgs');
  {
    const a = parseArgs(['a.json', 'dir/', '-o', 'x.pptx', '--title', 'T', '--theme', 'b.json', '--images', 'img/', '--sections', 'cover,summary', '--trait-groups', 'needs,frustrations', '--context', 'ctx-1', '--generated-at', '2026-01-01T00:00:00Z', '--warnings-json', 'w.json', '--quiet']);
    assert(a.inputs.join(',') === 'a.json,dir/' && a.out === 'x.pptx' && a.title === 'T' && a.theme === 'b.json' && a.images === 'img/', 'positional inputs and simple flags');
    assert(a.sections.cover === true && a.sections.summary === true && a.sections.index === false && a.sections.appendix === false, '--sections parsed to booleans');
    assert(a.traitGroups.join(',') === 'needs,frustrations' && a.context === 'ctx-1' && a.generatedAt === '2026-01-01T00:00:00Z' && a.warningsJson === 'w.json' && a.quiet === true, 'remaining flags');
    const d = parseArgs(['only.json']);
    assert(d.sections.cover && d.sections.index && d.sections.summary && d.sections.appendix && d.traitGroups === 'all' && d.out === null, 'defaults');
  }

  section('CLI — expandInputs');
  {
    const files = expandInputs([path.join(ROOT, 'v2.0/examples/roadside/')]);
    assert(files.length === 2 && files[0].endsWith('actor-adam-rees.json') && files[1].endsWith('actor-daniel-rees.json'), 'directory → actor-*.json sorted by name', files.join(','));
    const mixed = expandInputs([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), path.join(ROOT, 'v2.0/examples/roadside/')]);
    assert(mixed.length === 3 && mixed[0].endsWith('sarah-martinez.json'), 'explicit file order preserved before directory expansion');
  }

  section('CLI — happy path');
  {
    const out = path.join(tmp, 'cli-roadside.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/'), '-o', out, '--generated-at', '2026-09-04T00:00:00Z']);
    assert(r.code === 0, 'exit 0', r.err);
    assert(fs.existsSync(out) && fs.statSync(out).size > 10000, 'writes the deck');
    assert(/Wrote .*cli-roadside\.pptx \(\d+ slides, 2 actors\)/.test(r.out), 'reports slide and actor counts', r.out);
    assert(/warning:/.test(r.err), 'warnings go to stderr');
    const texts = await slideTexts(fs.readFileSync(out));
    assert(texts[0].includes('2026-09-04'), '--generated-at appears on the cover');
  }
  {
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', path.join(tmp, 'one.pptx'), '--sections', 'cover,summary']);
    const texts = await slideTexts(fs.readFileSync(path.join(tmp, 'one.pptx')));
    assert(r.code === 0 && texts.length === 2, '--sections cover,summary → two slides', String(texts.length));
  }
  {
    const wj = path.join(tmp, 'w.json');
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/'), '-o', path.join(tmp, 'w.pptx'), '--warnings-json', wj, '--quiet']);
    assert(r.code === 0 && fs.existsSync(wj) && Array.isArray(JSON.parse(fs.readFileSync(wj, 'utf8'))), '--warnings-json writes an array');
    assert(r.err.trim() === '', '--quiet silences stderr warnings');
  }
  {
    const r = runCli([path.join(ROOT, 'tools/tests/fixtures/actor-multi-context.json'), '-o', path.join(tmp, 'ctx.pptx'), '--context', 'ctx-beta', '--trait-groups', 'needs']);
    const texts = await slideTexts(fs.readFileSync(path.join(tmp, 'ctx.pptx')));
    assert(r.code === 0 && texts.some(t => t.includes('Beta Role')) , '--context honoured');
    assert(!texts.join('\n').includes('Learning style'), '--trait-groups limits appendix trait groups');
  }
  {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-cwd-'));
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/')], { cwd });
    assert(r.code === 0 && fs.existsSync(path.join(cwd, 'roadside.pptx')), 'default -o is <dir name>.pptx in cwd', r.err);
    fs.rmSync(cwd, { recursive: true, force: true });
  }

  section('CLI — refusals (exit 2, no file)');
  {
    const out = path.join(tmp, 'never.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/roadside/mission-roadside-assistance.json'), '-o', out]);
    assert(r.code === 2 && !fs.existsSync(out) && /\$type/.test(r.err) && /Mission/.test(r.err), 'non-Actor $type refused, names the type', r.err);
    const bad = path.join(tmp, 'bad.json'); fs.writeFileSync(bad, '{ "nope": ');
    const r2 = runCli([bad, '-o', out]);
    assert(r2.code === 2 && !fs.existsSync(out) && /bad\.json/.test(r2.err), 'unparseable JSON refused, names the file');
    const invalid = path.join(tmp, 'invalid.json'); fs.writeFileSync(invalid, JSON.stringify({ ...adam, actorType: 'robot' }));
    const r3 = runCli([invalid, '-o', out]);
    assert(r3.code === 2 && !fs.existsSync(out) && /actorType/.test(r3.err), 'schema-invalid Actor refused with the validator error');
    const r4 = runCli([path.join(ROOT, 'v2.0/examples/roadside/'), '-o', out, '--theme', path.join(tmp, 'missing-theme.json')]);
    assert(r4.code === 2 && !fs.existsSync(out) && /theme/.test(r4.err), 'unreadable --theme refused');
    const r5 = runCli([]);
    assert(r5.code === 2 && /Usage/.test(r5.err), 'no inputs → usage, exit 2');
    const r6 = runCli([path.join(tmp, 'does-not-exist.json'), '-o', out]);
    assert(r6.code === 2 && /does-not-exist\.json/.test(r6.err), 'missing input file refused by name');
    const sarahPath = path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json');
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dsds-cwd2-'));
    const r7 = runCli([sarahPath, '-o'], { cwd });
    assert(r7.code === 2 && /-o requires a value/.test(r7.err) && !fs.existsSync(path.join(cwd, 'actor-sarah-martinez.pptx')), '-o as the final argument (no value) refused, no file created (I2)', r7.err);
    fs.rmSync(cwd, { recursive: true, force: true });
    const out2 = path.join(tmp, 'never-theme.pptx');
    const r8 = runCli([sarahPath, '-o', out2, '--theme']);
    assert(r8.code === 2 && !fs.existsSync(out2) && /--theme requires a value/.test(r8.err), '--theme as the final argument (no value) refused, no file at -o (I2)', r8.err);
    const out3 = path.join(tmp, 'zero-slides.pptx');
    const r9 = runCli([sarahPath, '--sections', 'index', '-o', out3]);
    assert(r9.code === 2 && !fs.existsSync(out3) && /no slides to render/.test(r9.err), '--sections index alone with a single actor: no slides, refused, no file (I3)', r9.err);
  }

  section('CLI — --sections typos and empties (fix round 1, Finding 1)');
  {
    const out = path.join(tmp, 'sections-typo.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', out, '--sections', 'cover,sumary']);
    assert(r.code === 0 && fs.existsSync(out), '--sections cover,sumary → exit 0, file written', r.err);
    const texts = await slideTexts(fs.readFileSync(out));
    assert(texts.length === 1, '--sections cover,sumary → exactly one slide (cover only)', String(texts.length));
    assert(/SECTION_UNKNOWN.*sumary/.test(r.err), '--sections typo warns SECTION_UNKNOWN naming "sumary"', r.err);
  }
  {
    const out = path.join(tmp, 'sections-empty.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', out, '--sections', '']);
    assert(r.code === 2 && !fs.existsSync(out) && /no sections enabled/.test(r.err), "--sections '' refused, no file", r.err);
  }
  {
    const out = path.join(tmp, 'sections-nope.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', out, '--sections', 'nope']);
    assert(r.code === 2 && !fs.existsSync(out), '--sections nope (all unknown → none enabled) refused, no file', r.err);
  }

  section('CLI — non-object JSON refused (fix round 1, Finding 2)');
  {
    const out = path.join(tmp, 'never-null.pptx');
    const nullFile = path.join(tmp, 'null.json'); fs.writeFileSync(nullFile, 'null');
    const r = runCli([nullFile, '-o', out]);
    assert(r.code === 2 && !fs.existsSync(out) && /not a JSON object/.test(r.err) && /null\.json/.test(r.err), 'literal null JSON refused, names the file', r.err);
  }
  {
    const out = path.join(tmp, 'never-arr.pptx');
    const arrFile = path.join(tmp, 'arr.json'); fs.writeFileSync(arrFile, '[]');
    const r = runCli([arrFile, '-o', out]);
    assert(r.code === 2 && !fs.existsSync(out), 'array JSON still refused', r.err);
  }

  section('CLI — theme override reaches the file');
  {
    const th = path.join(tmp, 'brand.json'); fs.writeFileSync(th, JSON.stringify({ typography: { fontFamily: 'Arial' }, colour: { light: { traits: '#112233' } } }));
    const out = path.join(tmp, 'themed.pptx');
    const r = runCli([path.join(ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), '-o', out, '--theme', th, '--sections', 'summary']);
    const JSZip = require('jszip'); const zip = await JSZip.loadAsync(fs.readFileSync(out)); const xml = await zip.file('ppt/slides/slide1.xml').async('string');
    assert(r.code === 0 && xml.includes('typeface="Arial"') && xml.includes('112233'), 'font and colour from the theme are in the slide XML');
  }
}

module.exports = { assert, section, ROOT, load, tmp, theme, metrics, adam, daniel, writerTests, execFileSync,
  finish: () => { fs.rmSync(tmp, { recursive: true, force: true }); console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); } };
module.exports.cliTests = cliTests;

if (require.main === module) {
  (async () => {
    await writerTests();
    await module.exports.cliTests();
    module.exports.finish();
  })().catch(e => { console.error(e); process.exit(1); });
}
