#!/usr/bin/env node
// render-pptx.js — v2.0 Actor JSON (one or many) → PowerPoint deck.
// CLI: node tools/renderers/render-pptx.js <file|dir>... [-o deck.pptx] [--title "..."] [--theme brand.json]
//        [--images dir/] [--sections cover,index,summary,appendix] [--trait-groups a,b,...] [--context <contextId>]
//        [--generated-at <ISO-8601>] [--warnings-json file] [--quiet]
// Exit codes: 0 success (warnings on stderr); 2 invalid input / unreadable theme — nothing written.
// Spec: docs/superpowers/specs/2026-09-04-actor-export-design.md §7

'use strict';

const fs = require('fs');
const path = require('path');
const { validateData } = require('../validators/validate-v2.0');
const { buildActorViewModel, TRAIT_GROUPS } = require('../viewmodels/actor-viewmodel');
const { loadTheme, resolveMetrics } = require('./pptx/theme');
const { buildDeck } = require('./pptx/deck-model');
const { writeDeck } = require('./pptx/writer');

const USAGE = 'Usage: node render-pptx.js <file|dir>... [-o deck.pptx] [--title "..."] [--theme brand.json] [--images dir/] ' +
  '[--sections cover,index,summary,appendix] [--trait-groups needs,frustrations,...] [--context <contextId>] ' +
  '[--generated-at <ISO-8601>] [--warnings-json file] [--quiet]';
const SECTIONS = ['cover', 'index', 'summary', 'appendix'];

function parseArgs(argv) {
  const a = { inputs: [], out: null, title: undefined, theme: undefined, images: undefined,
    sections: { cover: true, index: true, summary: true, appendix: true }, unknownSections: [], traitGroups: 'all', context: undefined,
    generatedAt: undefined, warningsJson: undefined, quiet: false };
  const takes = { '-o': 'out', '--title': 'title', '--theme': 'theme', '--images': 'images', '--context': 'context', '--generated-at': 'generatedAt', '--warnings-json': 'warningsJson' };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t in takes) { a[takes[t]] = argv[++i]; continue; }
    if (t === '--sections') {
      const names = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
      const on = new Set(names);
      for (const s of SECTIONS) a.sections[s] = on.has(s);
      a.unknownSections = names.filter(n => !SECTIONS.includes(n));
      continue;
    }
    if (t === '--trait-groups') { a.traitGroups = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (t === '--quiet') { a.quiet = true; continue; }
    if (t.startsWith('-')) { const e = new Error(`unknown option ${t}\n${USAGE}`); e.code = 'USAGE'; throw e; }
    a.inputs.push(t);
  }
  return a;
}

function expandInputs(inputs) {
  const files = [];
  for (const p of inputs) {
    let st;
    try { st = fs.statSync(p); } catch (e) { const err = new Error(`input not found: ${p}`); err.code = 'INPUT'; throw err; }
    if (st.isDirectory()) files.push(...fs.readdirSync(p).filter(f => /^actor-.*\.json$/i.test(f)).sort().map(f => path.join(p, f)));
    else files.push(p);
  }
  return files;
}

function loadActors(files) {
  const actors = [], errors = [];
  for (const f of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { errors.push(`${f}: ${e.message}`); continue; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) { errors.push(`${f}: not a JSON object (got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data})`); continue; }
    if (data.$type !== 'Actor') { errors.push(`${f}: $type is "${data.$type}", expected "Actor"`); continue; }
    const v = validateData(data, f);
    if (!v.valid) { errors.push(`${f}: schema validation failed\n  ${v.errors.join('\n  ')}`); continue; }
    actors.push({ file: f, data });
  }
  return { actors, errors };
}

function defaultOut(inputs) {
  const first = inputs[0].replace(/[\\/]+$/, '');
  return path.basename(first).replace(/\.json$/i, '') + '.pptx';
}

async function run(argv) {
  let args;
  try { args = parseArgs(argv); } catch (e) { return { exitCode: 2, error: e.message }; }
  if (args.inputs.length === 0) return { exitCode: 2, error: USAGE };

  const warnings = [];
  for (const name of args.unknownSections) warnings.push({ code: 'SECTION_UNKNOWN', message: `--sections: "${name}" is not a section (cover, index, summary, appendix)` });
  if (!Object.values(args.sections).some(Boolean)) {
    return { exitCode: 2, error: 'no sections enabled — nothing to render (use --sections cover,index,summary,appendix)' };
  }

  let files;
  try { files = expandInputs(args.inputs); } catch (e) { return { exitCode: 2, error: e.message }; }
  if (files.length === 0) return { exitCode: 2, error: `no actor-*.json files found in: ${args.inputs.join(', ')}` };

  const { actors, errors } = loadActors(files);
  if (errors.length) return { exitCode: 2, error: `refusing to render: ${errors.length} input problem(s)\n${errors.join('\n')}` };

  let themeRes;
  try { themeRes = loadTheme(args.theme); } catch (e) { return { exitCode: 2, error: e.message }; }
  warnings.push(...themeRes.warnings.map(w => ({ ...w, scope: 'theme' })));

  const images = {};
  if (args.images) {
    for (const { data } of actors) {
      const hit = ['png', 'jpg', 'jpeg'].map(ext => path.join(args.images, `${data.id}.${ext}`)).find(p => fs.existsSync(p));
      if (hit) images[data.id] = path.resolve(hit);
      else warnings.push({ code: 'IMAGE_MISSING', actorId: data.id, message: `no ${data.id}.png/.jpg in ${args.images}; using monogram` });
    }
  }

  const ids = actors.map(a => a.data.id);
  const unknownGroups = args.traitGroups === 'all' ? [] : args.traitGroups.filter(g => !TRAIT_GROUPS.includes(g));
  for (const g of unknownGroups) warnings.push({ code: 'TRAIT_GROUP_UNKNOWN', message: `--trait-groups: "${g}" is not a trait group (${TRAIT_GROUPS.join(', ')})` });
  const vms = actors.map(a => buildActorViewModel(a.data, { traitGroups: args.traitGroups, context: args.context, deck: { actorIds: ids } }));

  const deck = buildDeck(vms, {
    theme: themeRes.theme, metrics: resolveMetrics(themeRes.theme), title: args.title,
    generatedAt: args.generatedAt || new Date().toISOString(), sources: args.inputs, sections: args.sections, images
  });
  warnings.push(...deck.warnings);

  const outPath = args.out || defaultOut(args.inputs);
  await writeDeck(deck.slides, themeRes.theme, { outputType: 'file', fileName: outPath });
  if (args.warningsJson) fs.writeFileSync(args.warningsJson, JSON.stringify(warnings, null, 2));
  return { exitCode: 0, outPath, slides: deck.slides.length, actors: actors.length, warnings, quiet: args.quiet };
}

module.exports = { parseArgs, expandInputs, loadActors, defaultOut, run, USAGE };

if (require.main === module) {
  run(process.argv.slice(2)).then(r => {
    if (r.exitCode !== 0) { console.error(r.error); process.exit(r.exitCode); }
    console.log(`Wrote ${r.outPath} (${r.slides} slides, ${r.actors} ${r.actors === 1 ? 'actor' : 'actors'})`);
    if (!r.quiet) for (const w of r.warnings) console.error(`warning: ${w.code}${w.actorId ? ' [' + w.actorId + ']' : ''}${w.slot ? ' ' + w.slot : ''}${w.sectionId ? ' ' + w.sectionId : ''}: ${w.message || (w.shown !== undefined ? `showing ${w.shown} of ${w.of}` : `page ${w.page}`)}`);
    process.exit(0);
  }).catch(e => { console.error(`error: ${e.message}`); process.exit(1); });
}
