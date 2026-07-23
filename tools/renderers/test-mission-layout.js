// Tests for mission-layout.js
// Run from project root: node tools/renderers/test-mission-layout.js

'use strict';

const fs = require('fs');
const path = require('path');
const { computeLayout } = require('./mission-layout');

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
const energy = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'v2.0/examples/energy/mission-energy-supplier-switch.json'), 'utf8'));

// ---------------------------------------------------------------------------
section('Energy mission — phase columns and synthetic start/end columns');
// ---------------------------------------------------------------------------
{
  const layout = computeLayout(energy);
  // 4 phases + synthetic pre (start) + synthetic post (end)
  assert(layout.columns.length === 6, '6 columns (pre + 4 phases + post)',
    String(layout.columns.length));
  assert(layout.columns[0].memberIds.includes('start'), 'start node in first (pre) column');
  assert(layout.columns[5].memberIds.includes('end'), 'end node in last (post) column');
  assert(layout.columns[1].label === 'Research & Compare', 'first phase column labelled',
    layout.columns[1].label);

  // every node positioned, no duplicates
  const posKeys = Object.keys(layout.nodePos);
  assert(posKeys.length === energy.nodes.length, 'every node has a position',
    `${posKeys.length}/${energy.nodes.length}`);
  const coords = new Set(posKeys.map(id => `${layout.nodePos[id].x},${layout.nodePos[id].y}`));
  assert(coords.size === posKeys.length, 'no two nodes share coordinates');

  // all edges valid in this example
  assert(layout.validEdges.length === energy.edges.length, 'all 19 edges valid',
    String(layout.validEdges.length));

  // forward edges flow left-to-right in depth
  const bad = layout.validEdges.filter(e => e.edgeType !== 'loop_back' &&
    layout.depth.get(e.to) <= layout.depth.get(e.from));
  assert(bad.length === 0, 'depth increases along every non-loop edge',
    bad.map(e => `${e.from}->${e.to}`).join(','));

  assert(layout.width > 0 && layout.height > 0, 'positive canvas size');
  // only expected warning is none (start/end handled by synthetic columns silently is fine,
  // but dangling-edge warnings must not appear)
  assert(!layout.warnings.some(w => w.includes('unknown node')), 'no dangling-edge warnings');
}

// ---------------------------------------------------------------------------
section('Synthetic mission — dangling edges and no phases');
// ---------------------------------------------------------------------------
{
  const synth = {
    nodes: [
      { nodeId: 'a', name: 'A', nodeType: 'start' },
      { nodeId: 'b', name: 'B', nodeType: 'touchpoint' },
      { nodeId: 'c', name: 'C', nodeType: 'end' }
    ],
    edges: [
      { from: 'a', to: 'b', edgeType: 'default' },
      { from: 'b', to: 'c', edgeType: 'default' },
      { from: 'b', to: 'ghost', edgeType: 'default' }
    ],
    phases: []
  };
  const layout = computeLayout(synth);
  assert(layout.validEdges.length === 2, 'dangling edge dropped', String(layout.validEdges.length));
  assert(layout.warnings.some(w => w.includes('ghost')), 'warning names the unknown node',
    layout.warnings.join('; '));
  // no phases => one column per depth
  assert(layout.columns.length === 3, 'no phases: one column per depth',
    String(layout.columns.length));
  assert(layout.nodePos.a.col === 0 && layout.nodePos.b.col === 1 && layout.nodePos.c.col === 2,
    'depth ordering a<b<c');
}

// ---------------------------------------------------------------------------
section('Loop-back edges do not distort depth');
// ---------------------------------------------------------------------------
{
  const loop = {
    nodes: [
      { nodeId: 'a', name: 'A', nodeType: 'start' },
      { nodeId: 'b', name: 'B', nodeType: 'touchpoint' },
      { nodeId: 'c', name: 'C', nodeType: 'decision' }
    ],
    edges: [
      { from: 'a', to: 'b', edgeType: 'default' },
      { from: 'b', to: 'c', edgeType: 'default' },
      { from: 'c', to: 'b', edgeType: 'loop_back' }
    ],
    phases: []
  };
  const layout = computeLayout(loop);
  assert(layout.depth.get('c') === 2, 'loop_back ignored for depth', String(layout.depth.get('c')));
  assert(!layout.warnings.some(w => w.includes('cycle')), 'no false cycle warning');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
