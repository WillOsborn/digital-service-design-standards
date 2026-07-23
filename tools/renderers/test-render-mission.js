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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
