// Tests for render-mission.js
// Run from project root: node tools/renderers/test-render-mission.js

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { renderMission, computeHeat, wrapText } = require('./render-mission');
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

// ---------------------------------------------------------------------------
section('Cross-column loop-back clears node territory (deep endpoints, wide span)');
// ---------------------------------------------------------------------------
{
  // Regression for a rejected fix: a cross-column loop-back routed through a
  // single fixed (or endpoint-relative) peak height can still dip into node
  // territory in a column it merely passes over, once endpoints are deep
  // enough. This synthetic mission reproduces the reviewer's worked example:
  // both loop-back endpoints at row >= 2, a 3-column span, and two
  // intervening columns that each contain nothing but a single row-0 node —
  // the shallowest possible obstruction, and exactly the case a peak-only
  // formula was shown to collide with.
  const deepLoop = {
    title: 'Deep cross-column loop-back',
    nodes: [
      { nodeId: 'origin', name: 'Origin', nodeType: 'start' },
      { nodeId: 'a-r0', name: 'A Row0', nodeType: 'touchpoint' },
      { nodeId: 'a-r1', name: 'A Row1', nodeType: 'touchpoint' },
      { nodeId: 'a-target', name: 'A Target (row2)', nodeType: 'touchpoint' },
      { nodeId: 'mid-a', name: 'Intervening A (row0)', nodeType: 'touchpoint' },
      { nodeId: 'mid-b', name: 'Intervening B (row0)', nodeType: 'touchpoint' },
      { nodeId: 'b-r0', name: 'B Row0', nodeType: 'touchpoint' },
      { nodeId: 'b-r1', name: 'B Row1', nodeType: 'touchpoint' },
      { nodeId: 'b-source', name: 'B Source (row2)', nodeType: 'touchpoint' }
    ],
    edges: [
      { from: 'origin', to: 'a-r0', edgeType: 'default' },
      { from: 'origin', to: 'a-r1', edgeType: 'default' },
      { from: 'origin', to: 'a-target', edgeType: 'default' },
      { from: 'a-r0', to: 'mid-a', edgeType: 'default' },
      { from: 'mid-a', to: 'mid-b', edgeType: 'default' },
      { from: 'mid-b', to: 'b-r0', edgeType: 'default' },
      { from: 'mid-b', to: 'b-r1', edgeType: 'default' },
      { from: 'mid-b', to: 'b-source', edgeType: 'default' },
      { from: 'b-source', to: 'a-target', edgeType: 'loop_back', label: 'Deep loop back' }
    ],
    phases: []
  };

  const layout = computeLayout(deepLoop);
  const sPos = layout.nodePos['b-source'];
  const tPos = layout.nodePos['a-target'];
  assert(sPos.row >= 2 && tPos.row >= 2, 'both loop-back endpoints are at row >= 2',
    `s.row=${sPos.row} t.row=${tPos.row}`);
  assert(Math.abs(sPos.col - tPos.col) >= 2, 'loop-back spans >= 2 columns',
    `s.col=${sPos.col} t.col=${tPos.col}`);

  // Mirror render-mission.js's own HALF_W/HALF_H tables for the node types
  // used here, so this test can check clearance/collisions independently
  // of (rather than by re-deriving) the renderer's internal formula.
  const HALF_W_TEST = { start: 26, touchpoint: 79 };
  const HALF_H_TEST = { start: 26, touchpoint: 28 };
  const typeOfTest = {};
  deepLoop.nodes.forEach((n) => { typeOfTest[n.nodeId] = n.nodeType; });

  const colLo = Math.min(sPos.col, tPos.col);
  const colHi = Math.max(sPos.col, tPos.col);
  let interveningTopEdge = Infinity;
  let interveningXMin = Infinity;
  let interveningXMax = -Infinity;
  deepLoop.nodes.forEach((n) => {
    const p = layout.nodePos[n.nodeId];
    if (p.col <= colLo || p.col >= colHi) return; // strictly intervening columns only
    interveningTopEdge = Math.min(interveningTopEdge, p.y - HALF_H_TEST[typeOfTest[n.nodeId]]);
    const col = layout.columns[p.col];
    interveningXMin = Math.min(interveningXMin, col.x);
    interveningXMax = Math.max(interveningXMax, col.x + col.width);
  });
  assert(Number.isFinite(interveningTopEdge), 'synthetic mission has an intervening row-0 node');

  const { html } = renderMission(deepLoop, {});
  const pathMatch = html.match(/<g class="mv-edge mv-edge-loop_back"[^>]*><path d="([^"]+)"/);
  assert(Boolean(pathMatch), 'loop-back edge path found in rendered output');

  // Generic SVG path sampler: walks M/L/Q/C commands and returns points
  // along the path — line segments interpolated linearly, quadratics/cubics
  // evaluated as their Bezier polynomial — so this works regardless of the
  // exact path shape the renderer chooses (not coupled to today's elbow
  // implementation).
  function samplePath(d, samplesPerSegment) {
    const tokens = d.trim().split(/[\s,]+/).filter(Boolean);
    let i = 0;
    let cur = null;
    let cmd = null;
    const points = [];
    const readNum = () => parseFloat(tokens[i++]);
    while (i < tokens.length) {
      if (/^[A-Za-z]$/.test(tokens[i])) { cmd = tokens[i]; i++; continue; }
      if (cmd === 'M' || cmd === 'L') {
        const x = readNum();
        const y = readNum();
        if (cmd === 'M' || !cur) {
          cur = { x, y };
          points.push(cur);
        } else {
          for (let s = 1; s <= samplesPerSegment; s++) {
            const t = s / samplesPerSegment;
            points.push({ x: cur.x + (x - cur.x) * t, y: cur.y + (y - cur.y) * t });
          }
          cur = { x, y };
        }
      } else if (cmd === 'Q') {
        const cx = readNum(); const cy = readNum();
        const ex = readNum(); const ey = readNum();
        for (let s = 1; s <= samplesPerSegment; s++) {
          const t = s / samplesPerSegment;
          const mt = 1 - t;
          points.push({
            x: mt * mt * cur.x + 2 * mt * t * cx + t * t * ex,
            y: mt * mt * cur.y + 2 * mt * t * cy + t * t * ey
          });
        }
        cur = { x: ex, y: ey };
      } else if (cmd === 'C') {
        const x1 = readNum(); const y1 = readNum();
        const x2 = readNum(); const y2 = readNum();
        const ex = readNum(); const ey = readNum();
        for (let s = 1; s <= samplesPerSegment; s++) {
          const t = s / samplesPerSegment;
          const mt = 1 - t;
          points.push({
            x: mt * mt * mt * cur.x + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * ex,
            y: mt * mt * mt * cur.y + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * ey
          });
        }
        cur = { x: ex, y: ey };
      } else {
        i++; // unrecognised command token; skip defensively
      }
    }
    return points;
  }

  if (pathMatch) {
    const points = samplePath(pathMatch[1], 24);
    assert(points.length > 10, 'path sampled to a meaningful number of points', String(points.length));

    const overIntervening = points.filter((p) => p.x >= interveningXMin && p.x <= interveningXMax);
    assert(overIntervening.length > 0,
      'some sampled points fall horizontally within the intervening columns',
      `sampled x ${Math.min(...points.map((p) => p.x)).toFixed(0)}-${Math.max(...points.map((p) => p.x)).toFixed(0)}, ` +
      `intervening x ${interveningXMin}-${interveningXMax}`);

    const CLEAR_MARGIN = 5; // smaller than the renderer's own 14px clearance budget
    const worstY = overIntervening.length ? Math.max(...overIntervening.map((p) => p.y)) : NaN;
    assert(overIntervening.length > 0 && worstY <= interveningTopEdge - CLEAR_MARGIN,
      "loop-back path stays above the intervening columns' topmost node top edge",
      `worst sampled y=${worstY}, intervening top edge=${interveningTopEdge}`);

    const HEADER_MIN_Y = 52; // must not route through the phase-band header text
    const highestY = Math.min(...points.map((p) => p.y));
    assert(highestY >= HEADER_MIN_Y,
      'loop-back path never rises above the phase-band header boundary',
      `highest sampled y=${highestY}`);

    // Stronger, more general check: the path must not enter ANY other
    // node's bounding box — not just clear the intervening columns'
    // topmost edge, but also (e.g.) avoid the shallower nodes sharing the
    // endpoints' OWN columns while climbing/descending past them.
    let collision = null;
    deepLoop.nodes.forEach((n) => {
      if (n.nodeId === 'b-source' || n.nodeId === 'a-target') return; // path legitimately meets its own endpoints
      const p = layout.nodePos[n.nodeId];
      const halfW = HALF_W_TEST[typeOfTest[n.nodeId]];
      const halfH = HALF_H_TEST[typeOfTest[n.nodeId]];
      const box = { x0: p.x - halfW, x1: p.x + halfW, y0: p.y - halfH, y1: p.y + halfH };
      points.forEach((pt) => {
        if (!collision && pt.x > box.x0 && pt.x < box.x1 && pt.y > box.y0 && pt.y < box.y1) {
          collision = `${n.nodeId} at sample (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`;
        }
      });
    });
    assert(!collision, 'loop-back path does not enter any other node’s bounding box', collision || '');
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
