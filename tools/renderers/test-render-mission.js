// Tests for render-mission.js
// Run from project root: node tools/renderers/test-render-mission.js

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { renderMission, computeHeat, wrapText } = require('./render-mission');

let passed = 0;
let failed = 0;

function assert(condition, label, detail) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

const ROOT = path.join(__dirname, '..', '..');
const energyPath = path.join(ROOT, 'v2.0/examples/energy/mission-energy-supplier-switch.json');
const retailPath = path.join(ROOT, 'v2.0/examples/retail/mission-online-clothes-shopping.json');
const energy = JSON.parse(fs.readFileSync(energyPath, 'utf8'));
const retail = JSON.parse(fs.readFileSync(retailPath, 'utf8'));

// ---------------------------------------------------------------------------
section('Helpers');
// ---------------------------------------------------------------------------
{
  assert(wrapText('Enter personal and property details', 18, 2).length === 2, 'long name wraps to 2 lines');
  assert(wrapText('Short', 18, 2).join('') === 'Short', 'short name single line');
  const long = wrapText('one two three four five six seven eight nine', 10, 2);
  assert(long.length === 2 && long[1].endsWith('…'), 'overflow truncated with ellipsis',
    JSON.stringify(long));

  const laneDefs = [{ id: 'barriers', label: 'Barriers', type: 'barrier' }];
  assert(computeHeat({ laneContent: {} }, laneDefs).bucket === 'none', 'no barriers -> none');
  assert(computeHeat({ laneContent: { barriers: [{ severity: 2 }] } }, laneDefs).bucket === 'low', 'sum 2 -> low');
  assert(computeHeat({ laneContent: { barriers: [{ severity: 3 }, { severity: 4 }] } }, laneDefs).bucket === 'medium', 'sum 7 -> medium');
  assert(computeHeat({ laneContent: { barriers: [{ severity: 5 }, { severity: 4 }] } }, laneDefs).bucket === 'high', 'sum 9 -> high');
}

// ---------------------------------------------------------------------------
section('Fragment output — energy mission');
// ---------------------------------------------------------------------------
{
  const { html, warnings } = renderMission(energy, {});
  assert((html.match(/class="mv-node"/g) || []).length === energy.nodes.length,
    'one mv-node group per node', String((html.match(/class="mv-node"/g) || []).length));
  assert((html.match(/class="mv-edge /g) || []).length === energy.edges.length,
    'one mv-edge path per edge', String((html.match(/class="mv-edge /g) || []).length));
  assert(html.includes('<title>'), 'has a <title>');
  assert(html.includes('Energy Supplier Switch'), 'title text present');
  assert(!html.includes('<!doctype') && !html.includes('<body'), 'fragment has no document skeleton');
  assert(!/\b(?:src|href)\s*=\s*["']https?:/i.test(html), 'no external network references');
  assert(html.includes('data-heat='), 'heat buckets stamped on nodes');
  assert(html.includes('As-is'), 'scope badge rendered');
  assert(warnings.length === 0, 'no warnings for energy', warnings.join('; '));
}

// ---------------------------------------------------------------------------
section('Standalone output and CLI');
// ---------------------------------------------------------------------------
{
  const { html } = renderMission(energy, { standalone: true });
  assert(html.startsWith('<!doctype html>'), 'standalone has doctype');
  assert(html.includes('<meta name="color-scheme" content="light dark">'), 'standalone declares color-scheme');

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-test-'));
  const outFile = path.join(outDir, 'energy.html');
  const stdout = execFileSync('node', [path.join(__dirname, 'render-mission.js'),
    energyPath, '-o', outFile, '--standalone']).toString();
  assert(fs.existsSync(outFile), 'CLI writes output file');
  assert(stdout.includes('19 nodes'), 'CLI reports node count', stdout.trim());
}

// ---------------------------------------------------------------------------
section('Stress: retail mission (25 nodes)');
// ---------------------------------------------------------------------------
{
  const { html } = renderMission(retail, {});
  assert((html.match(/class="mv-node"/g) || []).length === 25, '25 nodes rendered');
  assert((html.match(/class="mv-edge /g) || []).length === 25, '25 edges rendered');
}

// ---------------------------------------------------------------------------
section('Warnings strip for data issues');
// ---------------------------------------------------------------------------
{
  const synth = {
    title: 'Synthetic',
    nodes: [
      { nodeId: 'a', name: 'A', nodeType: 'start' },
      { nodeId: 'b', name: 'B', nodeType: 'end' }
    ],
    edges: [
      { from: 'a', to: 'b', edgeType: 'default' },
      { from: 'a', to: 'ghost', edgeType: 'default' }
    ],
    phases: []
  };
  const { html, warnings } = renderMission(synth, {});
  assert(warnings.length === 1, 'dangling edge produces a warning', String(warnings.length));
  assert(html.includes('class="mv-warnings"'), 'warnings strip rendered');
  assert(html.includes('ghost'), 'warning names the unknown node');
  assert((html.match(/class="mv-edge /g) || []).length === 1, 'only valid edge drawn');
}

// ---------------------------------------------------------------------------
section('Explore mode interactivity scaffolding');
// ---------------------------------------------------------------------------
{
  const { html } = renderMission(energy, {});
  assert(html.includes('data-setmode="overview"') && html.includes('data-setmode="explore"'),
    'mode toggle buttons present');
  assert(html.includes('id="mv-heat-cb"'), 'heat toggle present');
  assert(html.includes('id="mv-lane-cbs"'), 'lane filter container present');
  assert(html.includes('id="mv-panel"'), 'detail panel present');

  const m = html.match(/<script type="application\/json" id="mv-data">([\s\S]*?)<\/script>/);
  assert(Boolean(m), 'embedded mission data blob present');
  if (m) {
    const data = JSON.parse(m[1]);
    assert(data.nodes.length === energy.nodes.length, 'data blob carries all nodes');
    assert(Array.isArray(data.lanes) && data.lanes.length === energy.lanes.length,
      'data blob carries lane definitions');
  }
  assert(html.includes('renderPanel'), 'client script included');
  // default mode is overview; explore opt-in via --mode
  assert(html.includes('data-mode="overview"'), 'default mode is overview');
  const explore = renderMission(energy, { mode: 'explore' }).html;
  assert(explore.includes('data-mode="explore"'), '--mode explore respected');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
