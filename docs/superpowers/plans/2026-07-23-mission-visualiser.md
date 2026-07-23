# Mission Visualiser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deterministic Node CLI that turns any v2.0 Mission JSON into a self-contained two-mode (Overview / Explore) HTML visualisation, published as a Claude artifact, with the mission-renderer skill rewritten to wrap it.

**Architecture:** A pure layout module (`mission-layout.js`) computes phase-bucketed column positions from the mission graph. A renderer (`render-mission.js`) emits a self-contained HTML fragment (inline SVG + CSS + JS, no external references) suitable for Artifact publishing, or a full standalone document (`--standalone`) for local browser testing. The mission-renderer skill becomes a thin wrapper: run CLI → publish artifact. Visual quality is verified with Playwright screenshots and iterated with the user.

**Tech Stack:** Node 22, CommonJS, zero npm dependencies for the renderer. Tests follow the repo's plain-assert style (`tools/validators/test-v2.0-validator.js` is the reference). Playwright MCP tools for visual verification.

**Spec:** `docs/superpowers/specs/2026-07-23-mission-visualiser-design.md` — read it before starting.

## Global Constraints

- Real schema field names ONLY: `nodeId`, `name`, `nodeType`, `from`, `to`, `edgeType`, `condition.description`, `label`, `phases[].nodeRefs`, `lanes[]` (`id`, `label`, `type`), `laneContent`, `scope.asIs`. Never `node.id`, `node.type`, `node.phaseId`, `edge.source`, `edge.target`.
- Node types: `start`, `end`, `touchpoint`, `decision`, `handoff`, `wait`, `signal`. Edge types: `default`, `conditional`, `loop_back`, `error`.
- Barrier heat buckets (summed `severity`, each 1–5): none = 0, low = 1–3, medium = 4–7, high = 8+.
- Output HTML must contain no external network references (`src=`/`href=` with `http(s)://` forbidden — enforced by test).
- Fragment output has no `<!doctype>`, `<html>`, `<head>`, or `<body>` tags (Artifact publishing wraps it). `--standalone` adds them for local testing.
- Theme: light + dark via `@media (prefers-color-scheme: dark)` AND `:root[data-theme="dark"]` / `:root[data-theme="light"]` overrides (the artifact viewer stamps `data-theme` on the root element; it must win in both directions).
- Path highlighting and Figma/Mermaid export are OUT OF SCOPE.
- Generated HTML files are never committed — write them to the session scratchpad directory.
- All test files: `'use strict'`, CommonJS, the repo's `assert(condition, label, detail)` / `section(title)` helper pattern, exit code 1 on any failure.
- All test runs happen from the repo root: `/Users/willosborn/Documents/Digital Service Design Working/schemas`.

---

### Task 1: Layout module

**Files:**
- Create: `tools/renderers/mission-layout.js`
- Test: `tools/renderers/test-mission-layout.js`

**Interfaces:**
- Consumes: a parsed v2.0 Mission object.
- Produces: `computeLayout(mission)` returning `{ columns, nodePos, width, height, validEdges, depth, warnings }` where:
  - `columns`: `[{ id, label, goal, memberIds: string[], x: number, width: number }]` in left-to-right order
  - `nodePos`: `{ [nodeId]: { x, y, col, row } }` — x/y are node centres
  - `validEdges`: edges whose `from`/`to` both exist (others dropped with a warning)
  - `depth`: `Map<nodeId, number>` — longest-path depth ignoring `loop_back` edges
  - `warnings`: `string[]`
  - Also exports `topoDepth(nodes, edges, warnings)` and constants `COL_WIDTH`, `ROW_HEIGHT`, `BAND_TOP`, `PAD_X`.

- [ ] **Step 1: Write the failing test**

Create `tools/renderers/test-mission-layout.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/renderers/test-mission-layout.js`
Expected: FAIL with `Cannot find module './mission-layout'`

- [ ] **Step 3: Write the implementation**

Create `tools/renderers/mission-layout.js`:

```js
// Pure layout computation for v2.0 Mission graphs.
// Input: parsed mission JSON. Output: geometry only — no DOM, no HTML.

'use strict';

const COL_WIDTH = 200;   // px per column
const ROW_HEIGHT = 110;  // px per node row
const PAD_X = 40;        // outer horizontal padding
const BAND_TOP = 64;     // vertical space reserved for phase band headers
const PAD_BOTTOM = 48;   // bottom padding (also loop-back arc headroom lives above rows)

// Longest-path depth from any source, ignoring loop_back edges (Kahn's algorithm).
function topoDepth(nodes, edges, warnings) {
  const out = new Map();
  const indeg = new Map();
  const depth = new Map();
  nodes.forEach((n) => { out.set(n.nodeId, []); indeg.set(n.nodeId, 0); depth.set(n.nodeId, 0); });
  edges.filter((e) => e.edgeType !== 'loop_back').forEach((e) => {
    out.get(e.from).push(e.to);
    indeg.set(e.to, indeg.get(e.to) + 1);
  });
  const queue = nodes.map((n) => n.nodeId).filter((id) => indeg.get(id) === 0);
  let processed = 0;
  while (queue.length) {
    const id = queue.shift();
    processed++;
    for (const t of out.get(id)) {
      depth.set(t, Math.max(depth.get(t), depth.get(id) + 1));
      indeg.set(t, indeg.get(t) - 1);
      if (indeg.get(t) === 0) queue.push(t);
    }
  }
  if (processed < nodes.length) {
    warnings.push('cycle detected among non-loop_back edges; column order is approximate');
  }
  return depth;
}

function computeLayout(mission) {
  const nodes = mission.nodes || [];
  const phases = mission.phases || [];
  const warnings = [];
  const nodeIds = new Set(nodes.map((n) => n.nodeId));

  const validEdges = [];
  for (const e of mission.edges || []) {
    if (nodeIds.has(e.from) && nodeIds.has(e.to)) validEdges.push(e);
    else warnings.push(`edge ${e.from} \u2192 ${e.to} references an unknown node; skipped`);
  }

  const depth = topoDepth(nodes, validEdges, warnings);

  // forward-edge degree, used to classify unphased nodes as sources/sinks
  const fIn = new Map();
  const fOut = new Map();
  nodes.forEach((n) => { fIn.set(n.nodeId, 0); fOut.set(n.nodeId, 0); });
  validEdges.filter((e) => e.edgeType !== 'loop_back').forEach((e) => {
    fOut.set(e.from, fOut.get(e.from) + 1);
    fIn.set(e.to, fIn.get(e.to) + 1);
  });

  let columns;
  if (!phases.length) {
    // No phases: one column per distinct depth value.
    const maxD = Math.max(0, ...nodes.map((n) => depth.get(n.nodeId)));
    columns = [];
    for (let d = 0; d <= maxD; d++) {
      columns.push({ id: `depth-${d}`, label: '', goal: '', memberIds: [] });
    }
    nodes.forEach((n) => columns[depth.get(n.nodeId)].memberIds.push(n.nodeId));
  } else {
    const phaseIndex = new Map(); // nodeId -> phase array index
    phases.forEach((p, i) => {
      (p.nodeRefs || []).forEach((id) => {
        if (nodeIds.has(id) && !phaseIndex.has(id)) phaseIndex.set(id, i);
      });
    });

    const unphased = nodes.filter((n) => !phaseIndex.has(n.nodeId));
    const pre = unphased.filter((n) => fIn.get(n.nodeId) === 0);
    const post = unphased.filter((n) => fIn.get(n.nodeId) > 0 && fOut.get(n.nodeId) === 0);
    const mid = unphased.filter((n) => !pre.includes(n) && !post.includes(n));

    // mid-graph unphased nodes: adopt the phase whose average depth is nearest
    const phaseAvgDepth = phases.map((p) => {
      const ds = (p.nodeRefs || []).filter((id) => depth.has(id)).map((id) => depth.get(id));
      return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : 0;
    });
    mid.forEach((n) => {
      let best = 0;
      let bestDist = Infinity;
      phaseAvgDepth.forEach((d, i) => {
        const dist = Math.abs(depth.get(n.nodeId) - d);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      phaseIndex.set(n.nodeId, best);
      warnings.push(`node ${n.nodeId} is in no phase; placed in "${phases[best].name || best}" by depth`);
    });

    columns = [];
    if (pre.length) columns.push({ id: '__pre', label: '', goal: '', memberIds: pre.map((n) => n.nodeId) });
    const offset = columns.length;
    phases.forEach((p, i) => columns.push({
      id: p.phaseId || `phase-${i}`,
      label: p.name || p.phaseId || `Phase ${i + 1}`,
      goal: p.goal || '',
      memberIds: []
    }));
    if (post.length) columns.push({ id: '__post', label: '', goal: '', memberIds: post.map((n) => n.nodeId) });
    nodes.forEach((n) => {
      if (pre.some((m) => m.nodeId === n.nodeId) || post.some((m) => m.nodeId === n.nodeId)) return;
      columns[phaseIndex.get(n.nodeId) + offset].memberIds.push(n.nodeId);
    });
  }

  // Row order inside a column: topological depth, then authoring order.
  const orderIndex = new Map(nodes.map((n, i) => [n.nodeId, i]));
  columns.forEach((c) => c.memberIds.sort((a, b) =>
    (depth.get(a) - depth.get(b)) || (orderIndex.get(a) - orderIndex.get(b))));

  const nodePos = {};
  columns.forEach((c, ci) => {
    c.x = PAD_X + ci * COL_WIDTH;
    c.width = COL_WIDTH;
    c.memberIds.forEach((id, ri) => {
      nodePos[id] = {
        x: c.x + COL_WIDTH / 2,
        y: BAND_TOP + ROW_HEIGHT / 2 + ri * ROW_HEIGHT,
        col: ci,
        row: ri
      };
    });
  });

  const maxRows = Math.max(1, ...columns.map((c) => c.memberIds.length));
  const width = PAD_X * 2 + columns.length * COL_WIDTH;
  const height = BAND_TOP + maxRows * ROW_HEIGHT + PAD_BOTTOM;

  return { columns, nodePos, width, height, validEdges, depth, warnings };
}

module.exports = { computeLayout, topoDepth, COL_WIDTH, ROW_HEIGHT, BAND_TOP, PAD_X };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/renderers/test-mission-layout.js`
Expected: all PASS, `0 failed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/mission-layout.js tools/renderers/test-mission-layout.js
git commit -m "feat(v2.0): mission layout module — phase columns, topo ordering, synthetic start/end"
```

---

### Task 2: Renderer CLI — static SVG, both themes, Overview complete

**Files:**
- Create: `tools/renderers/render-mission.js`
- Test: `tools/renderers/test-render-mission.js`

**Interfaces:**
- Consumes: `computeLayout(mission)` from Task 1 (exact shape above).
- Produces:
  - `renderMission(mission, opts)` where `opts = { mode: 'overview'|'explore' (default 'overview'), standalone: boolean (default false) }`, returning `{ html: string, warnings: string[] }`.
  - `computeHeat(node, laneDefs)` returning `{ sum: number, bucket: 'none'|'low'|'medium'|'high' }`.
  - `wrapText(s, maxChars, maxLines)` returning `string[]`.
  - `esc(s)` HTML-escaper.
  - CLI: `node tools/renderers/render-mission.js <mission.json> [-o out.html] [--standalone] [--mode overview|explore]`.
- Task 3 will append controls markup, a detail panel, and a client `<script>`; Task 2's CSS already includes all styles (including panel/controls styles that have no markup yet — that is intentional).

- [ ] **Step 1: Write the failing test**

Create `tools/renderers/test-render-mission.js`:

```js
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
  assert(long.length === 2 && long[1].endsWith('\u2026'), 'overflow truncated with ellipsis',
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/renderers/test-render-mission.js`
Expected: FAIL with `Cannot find module './render-mission'`

- [ ] **Step 3: Write the implementation**

Create `tools/renderers/render-mission.js`. This is the complete Task 2 version — Overview-complete, no client JS yet (Task 3 adds it at the markers noted in comments):

```js
// Renders a v2.0 Mission JSON as a self-contained HTML visualisation.
// Fragment output (default) is Artifact-ready; --standalone wraps a full document.
// CLI: node tools/renderers/render-mission.js <mission.json> [-o out.html] [--standalone] [--mode overview|explore]

'use strict';

const fs = require('fs');
const path = require('path');
const { computeLayout, BAND_TOP } = require('./mission-layout');

// ── helpers ────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapText(s, maxChars, maxLines) {
  const words = String(s || '').split(/\s+/).filter(Boolean);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur) lines[lines.length - 1] = w;
    else if ((cur + ' ' + w).length <= maxChars) lines[lines.length - 1] = cur + ' ' + w;
    else if (lines.length < maxLines) lines.push(w);
    else {
      lines[lines.length - 1] = cur.slice(0, maxChars - 1) + '\u2026';
      return lines;
    }
  }
  return lines.filter(Boolean);
}

function computeHeat(node, laneDefs) {
  const barrierKeys = (laneDefs || []).filter((l) => l.type === 'barrier').map((l) => l.id);
  if (!barrierKeys.length) barrierKeys.push('barriers');
  let sum = 0;
  for (const k of barrierKeys) {
    const v = (node.laneContent || {})[k];
    if (Array.isArray(v)) {
      v.forEach((b) => { if (b && typeof b.severity === 'number') sum += b.severity; });
    }
  }
  const bucket = sum === 0 ? 'none' : sum <= 3 ? 'low' : sum <= 7 ? 'medium' : 'high';
  return { sum, bucket };
}

// ── geometry per node type ─────────────────────────────────────────────────

// half-width / half-height used as edge anchor offsets
const HALF_W = { start: 26, end: 28, signal: 26, decision: 79, touchpoint: 79, handoff: 79, wait: 79 };
const HALF_H = { start: 26, end: 28, signal: 26, decision: 34, touchpoint: 28, handoff: 28, wait: 28 };

function nodeSvg(node, pos, heat) {
  const t = node.nodeType || 'touchpoint';
  const label = wrapText(node.name || node.nodeId, 18, 2);
  const halo = `<rect class="mv-heat" x="${pos.x - 88}" y="${pos.y - 44}" width="176" height="88" rx="14"></rect>`;

  const insideText = (cls) => {
    const first = label.length === 2 ? '-0.28em' : '0.32em';
    return `<text class="${cls}" x="${pos.x}" y="${pos.y}" text-anchor="middle">` +
      label.map((l, i) => `<tspan x="${pos.x}" dy="${i === 0 ? first : '1.15em'}">${esc(l)}</tspan>`).join('') +
      '</text>';
  };
  const captionText = () =>
    `<text class="mv-caption" x="${pos.x}" y="${pos.y + 40}" text-anchor="middle">` +
    label.map((l, i) => `<tspan x="${pos.x}" dy="${i === 0 ? '0' : '1.15em'}">${esc(l)}</tspan>`).join('') +
    '</text>';

  let body = '';
  switch (t) {
    case 'start':
      body = `<circle class="mv-shape mv-fill-start" cx="${pos.x}" cy="${pos.y}" r="22"></circle>${captionText()}`;
      break;
    case 'end':
      body = `<circle class="mv-shape mv-ring-end" cx="${pos.x}" cy="${pos.y}" r="26"></circle>` +
        `<circle class="mv-fill-end" cx="${pos.x}" cy="${pos.y}" r="17"></circle>${captionText()}`;
      break;
    case 'signal':
      body = `<circle class="mv-shape mv-fill-signal" cx="${pos.x}" cy="${pos.y}" r="22"></circle>${captionText()}`;
      break;
    case 'decision':
      body = `<polygon class="mv-shape mv-fill-decision" points="${pos.x},${pos.y - 34} ${pos.x + 79},${pos.y} ${pos.x},${pos.y + 34} ${pos.x - 79},${pos.y}"></polygon>` +
        insideText('mv-label');
      break;
    case 'handoff':
      body = `<polygon class="mv-shape mv-fill-handoff" points="${pos.x - 79},${pos.y} ${pos.x - 55},${pos.y - 28} ${pos.x + 55},${pos.y - 28} ${pos.x + 79},${pos.y} ${pos.x + 55},${pos.y + 28} ${pos.x - 55},${pos.y + 28}"></polygon>` +
        insideText('mv-label');
      break;
    case 'wait':
      body = `<rect class="mv-shape mv-wait" x="${pos.x - 78}" y="${pos.y - 28}" width="156" height="56" rx="10"></rect>` +
        insideText('mv-label-plain');
      break;
    default: // touchpoint and unknown types
      body = `<rect class="mv-shape mv-fill-touchpoint" x="${pos.x - 78}" y="${pos.y - 28}" width="156" height="56" rx="10"></rect>` +
        insideText('mv-label');
  }
  return `<g class="mv-node" data-node="${esc(node.nodeId)}" data-heat="${heat.bucket}" tabindex="0" role="button" aria-label="${esc(node.name || node.nodeId)}">${halo}${body}</g>`;
}

// ── edges ──────────────────────────────────────────────────────────────────

function edgeSvg(e, layout, typeOf, idx) {
  const s = layout.nodePos[e.from];
  const t = layout.nodePos[e.to];
  const sh = HALF_W[typeOf[e.from]] || 79;
  const th = HALF_W[typeOf[e.to]] || 79;
  const sv = HALF_H[typeOf[e.from]] || 28;
  const tv = HALF_H[typeOf[e.to]] || 28;
  let d;
  let lx;
  let ly;

  if (e.edgeType === 'loop_back') {
    const sy = s.y - sv - 6;
    const ty = t.y - tv - 6;
    const peak = Math.min(sy, ty) - 44;
    d = `M ${s.x} ${sy} C ${s.x} ${peak}, ${t.x} ${peak}, ${t.x} ${ty}`;
    lx = (s.x + t.x) / 2;
    ly = peak + 14;
  } else if (t.col === s.col) {
    const down = t.y > s.y;
    const sy = s.y + (down ? sv + 4 : -(sv + 4));
    const ty = t.y + (down ? -(tv + 4) : tv + 4);
    d = `M ${s.x} ${sy} L ${t.x} ${ty}`;
    lx = s.x + 10;
    ly = (sy + ty) / 2;
  } else {
    const forward = t.col > s.col;
    const sx = s.x + (forward ? sh + 4 : -(sh + 4));
    const tx = t.x + (forward ? -(th + 4) : th + 4);
    const mx = (sx + tx) / 2;
    d = `M ${sx} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${tx} ${t.y}`;
    lx = mx;
    ly = (s.y + t.y) / 2 - 8;
  }

  const kind = e.edgeType || 'default';
  const marker = kind === 'error' ? 'mv-arrow-error' : 'mv-arrow';
  const labelText = e.label || (e.condition && e.condition.description) || '';
  const label = labelText
    ? `<text class="mv-elabel" x="${lx}" y="${ly}" text-anchor="middle">${esc(wrapText(labelText, 34, 1)[0])}</text>`
    : '';
  return `<g class="mv-edge mv-edge-${kind}" data-edge="${idx}"><path d="${d}" marker-end="url(#${marker})"></path>${label}</g>`;
}

// ── document assembly ──────────────────────────────────────────────────────

const CSS = `
.mv-app { --c-bg:#f8fafc; --c-band:#eef2f7; --c-text:#0f172a; --c-dim:#64748b;
  --c-edge:#64748b; --c-edge-error:#dc2626; --c-panel:#ffffff; --c-border:#e2e8f0;
  --c-touchpoint:#2563eb; --c-decision:#d97706; --c-handoff:#7c3aed; --c-wait:#6b7280;
  --c-signal:#ea580c; --c-start:#16a34a; --c-end:#dc2626;
  --c-heat-low:#fbbf24; --c-heat-medium:#f97316; --c-heat-high:#ef4444;
  font-family: system-ui, -apple-system, sans-serif; color: var(--c-text);
  background: var(--c-bg); display: flex; flex-direction: column; min-height: 100vh; }
@media (prefers-color-scheme: dark) {
  .mv-app { --c-bg:#0b1220; --c-band:#111a2b; --c-text:#e2e8f0; --c-dim:#94a3b8;
    --c-edge:#94a3b8; --c-edge-error:#f87171; --c-panel:#0f172a; --c-border:#1e293b;
    --c-touchpoint:#3b82f6; --c-decision:#f59e0b; --c-handoff:#8b5cf6; --c-wait:#9ca3af;
    --c-signal:#f97316; --c-start:#22c55e; --c-end:#ef4444; } }
:root[data-theme="dark"] .mv-app { --c-bg:#0b1220; --c-band:#111a2b; --c-text:#e2e8f0;
  --c-dim:#94a3b8; --c-edge:#94a3b8; --c-edge-error:#f87171; --c-panel:#0f172a;
  --c-border:#1e293b; --c-touchpoint:#3b82f6; --c-decision:#f59e0b; --c-handoff:#8b5cf6;
  --c-wait:#9ca3af; --c-signal:#f97316; --c-start:#22c55e; --c-end:#ef4444; }
:root[data-theme="light"] .mv-app { --c-bg:#f8fafc; --c-band:#eef2f7; --c-text:#0f172a;
  --c-dim:#64748b; --c-edge:#64748b; --c-edge-error:#dc2626; --c-panel:#ffffff;
  --c-border:#e2e8f0; --c-touchpoint:#2563eb; --c-decision:#d97706; --c-handoff:#7c3aed;
  --c-wait:#6b7280; --c-signal:#ea580c; --c-start:#16a34a; --c-end:#dc2626; }

.mv-header { display:flex; justify-content:space-between; align-items:flex-start;
  gap:16px; padding:16px 20px; border-bottom:1px solid var(--c-border); flex-wrap:wrap; }
.mv-header h1 { margin:0 0 4px; font-size:1.25rem; }
.mv-goal { margin:0 0 6px; font-size:0.85rem; color:var(--c-dim); max-width:60ch; }
.mv-meta { margin:0; font-size:0.75rem; color:var(--c-dim); }
.mv-badge { display:inline-block; padding:1px 8px; border:1px solid var(--c-border);
  border-radius:999px; font-weight:600; margin-right:8px; }
.mv-controls { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.mv-mode { display:flex; border:1px solid var(--c-border); border-radius:8px; overflow:hidden; }
.mv-mode-btn { border:0; background:transparent; color:var(--c-text); padding:6px 14px;
  font-size:0.8rem; cursor:pointer; }
.mv-mode-btn.active { background:var(--c-touchpoint); color:#fff; }
.mv-app[data-mode="overview"] .mv-explore-only { display:none; }
.mv-heat-toggle, .mv-filters { font-size:0.8rem; color:var(--c-text); }
.mv-filters { position:relative; }
.mv-filters > summary { cursor:pointer; border:1px solid var(--c-border);
  border-radius:8px; padding:5px 12px; list-style:none; }
.mv-filters > div { position:absolute; right:0; top:calc(100% + 4px); z-index:10;
  background:var(--c-panel); border:1px solid var(--c-border); border-radius:8px;
  padding:10px 14px; display:flex; flex-direction:column; gap:6px; min-width:180px;
  box-shadow:0 4px 16px rgba(0,0,0,0.15); }

.mv-warnings { margin:8px 20px 0; font-size:0.75rem; color:var(--c-dim); }
.mv-warnings summary { cursor:pointer; }

.mv-body { display:flex; flex:1; min-height:0; }
.mv-canvas { flex:1; overflow-x:auto; }
.mv-canvas svg { display:block; }

.mv-band-rect { fill:transparent; }
.mv-band.alt .mv-band-rect { fill:var(--c-band); }
.mv-band-name { font-size:12px; font-weight:700; fill:var(--c-text); text-anchor:middle; }
.mv-band-goal { font-size:9.5px; fill:var(--c-dim); text-anchor:middle; }

.mv-node { cursor:default; }
.mv-app[data-mode="explore"] .mv-node { cursor:pointer; }
.mv-shape { stroke:none; }
.mv-fill-touchpoint { fill:var(--c-touchpoint); }
.mv-fill-decision { fill:var(--c-decision); }
.mv-fill-handoff { fill:var(--c-handoff); }
.mv-fill-signal { fill:var(--c-signal); }
.mv-fill-start { fill:var(--c-start); }
.mv-fill-end { fill:var(--c-end); }
.mv-ring-end { fill:none; stroke:var(--c-end); stroke-width:2.5; }
.mv-wait { fill:none; stroke:var(--c-wait); stroke-width:1.8; stroke-dasharray:6 4; }
.mv-label { font-size:11px; fill:#fff; font-weight:600; }
.mv-label-plain { font-size:11px; fill:var(--c-text); }
.mv-caption { font-size:10.5px; fill:var(--c-text); font-weight:600; }
.mv-node.selected .mv-shape { stroke:var(--c-text); stroke-width:2.5; }
.mv-node:focus { outline:none; }
.mv-app[data-mode="explore"] .mv-node:focus .mv-shape { stroke:var(--c-text); stroke-width:2; }

.mv-heat { display:none; }
.mv-app[data-mode="explore"].heat-on .mv-node[data-heat="low"] .mv-heat { display:block; fill:var(--c-heat-low); opacity:0.28; }
.mv-app[data-mode="explore"].heat-on .mv-node[data-heat="medium"] .mv-heat { display:block; fill:var(--c-heat-medium); opacity:0.32; }
.mv-app[data-mode="explore"].heat-on .mv-node[data-heat="high"] .mv-heat { display:block; fill:var(--c-heat-high); opacity:0.38; }

.mv-edge path { fill:none; stroke:var(--c-edge); stroke-width:1.6; }
.mv-edge-conditional path, .mv-edge-loop_back path { stroke-dasharray:6 4; }
.mv-edge-error path { stroke:var(--c-edge-error); }
.mv-elabel { font-size:9.5px; fill:var(--c-dim); paint-order:stroke; stroke:var(--c-bg); stroke-width:3px; }

.mv-panel { width:300px; border-left:1px solid var(--c-border); background:var(--c-panel);
  padding:16px; overflow-y:auto; font-size:0.85rem; }
.mv-panel-head { display:flex; justify-content:space-between; align-items:flex-start; }
.mv-panel-head h2 { margin:0; font-size:1rem; }
.mv-close { border:1px solid var(--c-border); background:transparent; color:var(--c-text);
  border-radius:6px; font-size:1rem; line-height:1; padding:2px 8px; cursor:pointer; }
.mv-panel-type { color:var(--c-dim); font-size:0.75rem; margin:4px 0 12px;
  text-transform:capitalize; }
.mv-lane { margin-bottom:14px; }
.mv-lane h3 { margin:0 0 4px; font-size:0.72rem; text-transform:uppercase;
  letter-spacing:0.04em; color:var(--c-dim); }
.mv-lane p { margin:0 0 4px; }
.mv-lane ul { margin:0; padding-left:18px; }
.mv-barrier { margin-bottom:8px; }
.mv-sev { color:var(--c-heat-high); letter-spacing:2px; margin-right:6px; font-size:0.75rem; }
.mv-tag { display:inline-block; font-size:0.68rem; border:1px solid var(--c-border);
  border-radius:999px; padding:0 8px; color:var(--c-dim); text-transform:capitalize; }
.mv-channel strong { font-size:0.85rem; }
.mv-dim { color:var(--c-dim); font-size:0.75rem; }

.mv-legend { display:flex; gap:14px; flex-wrap:wrap; padding:10px 20px;
  border-top:1px solid var(--c-border); font-size:0.72rem; color:var(--c-dim); }
.mv-chip { display:inline-flex; align-items:center; gap:5px; }
.mv-sw { width:11px; height:11px; display:inline-block; border-radius:3px; }
.mv-sw.round { border-radius:50%; }
.mv-sw.diamond { transform:rotate(45deg); border-radius:2px; }
.mv-sw.outline { background:transparent !important; border:1.5px dashed var(--c-wait); }
.mv-edge-chip { width:22px; height:0; border-top:2px solid var(--c-edge); display:inline-block; }
.mv-edge-chip.dashed { border-top-style:dashed; }
.mv-edge-chip.error { border-top-color:var(--c-edge-error); }
`;

function bandsSvg(layout) {
  return layout.columns.map((c, i) => {
    const goalLines = wrapText(c.goal, 30, 2);
    const goal = c.goal
      ? `<text class="mv-band-goal" x="${c.x + c.width / 2}" y="38">` +
        goalLines.map((l, j) => `<tspan x="${c.x + c.width / 2}" dy="${j === 0 ? '0' : '1.2em'}">${esc(l)}</tspan>`).join('') +
        '</text>'
      : '';
    const name = c.label
      ? `<text class="mv-band-name" x="${c.x + c.width / 2}" y="22">${esc(c.label)}</text>`
      : '';
    return `<g class="mv-band${i % 2 ? ' alt' : ''}"><rect class="mv-band-rect" x="${c.x}" y="0" width="${c.width}" height="${layout.height}"></rect>${name}${goal}</g>`;
  }).join('\n');
}

const LEGEND = `
<footer class="mv-legend">
  <span class="mv-chip"><span class="mv-sw round" style="background:var(--c-start)"></span>start</span>
  <span class="mv-chip"><span class="mv-sw" style="background:var(--c-touchpoint)"></span>touchpoint</span>
  <span class="mv-chip"><span class="mv-sw diamond" style="background:var(--c-decision)"></span>decision</span>
  <span class="mv-chip"><span class="mv-sw" style="background:var(--c-handoff)"></span>handoff</span>
  <span class="mv-chip"><span class="mv-sw outline"></span>wait</span>
  <span class="mv-chip"><span class="mv-sw round" style="background:var(--c-signal)"></span>signal</span>
  <span class="mv-chip"><span class="mv-sw round" style="background:var(--c-end)"></span>end</span>
  <span class="mv-chip"><span class="mv-edge-chip"></span>step</span>
  <span class="mv-chip"><span class="mv-edge-chip dashed"></span>conditional / loop</span>
  <span class="mv-chip"><span class="mv-edge-chip error"></span>error</span>
</footer>`;

function renderMission(mission, opts) {
  const mode = (opts && opts.mode) || 'overview';
  const standalone = Boolean(opts && opts.standalone);
  const layout = computeLayout(mission);
  const laneDefs = mission.lanes || [];
  const typeOf = {};
  (mission.nodes || []).forEach((n) => { typeOf[n.nodeId] = n.nodeType || 'touchpoint'; });

  const nodesSvg = (mission.nodes || []).map((n) =>
    nodeSvg(n, layout.nodePos[n.nodeId], computeHeat(n, laneDefs))).join('\n');
  const edgesSvg = layout.validEdges.map((e, i) => edgeSvg(e, layout, typeOf, i)).join('\n');

  const defs = `<defs>
    <marker id="mv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-edge)"></path></marker>
    <marker id="mv-arrow-error" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-edge-error)"></path></marker>
  </defs>`;

  const scope = mission.scope || {};
  const badge = `<span class="mv-badge">${scope.asIs === false ? 'To-be' : 'As-is'}</span>`;
  const counts = `${(mission.nodes || []).length} steps \u00b7 ${(mission.edges || []).length} connections \u00b7 ${(mission.phases || []).length} phases`;

  const warningsHtml = layout.warnings.length
    ? `<details class="mv-warnings"><summary>\u26a0 ${layout.warnings.length} data issue${layout.warnings.length > 1 ? 's' : ''}</summary><ul>` +
      layout.warnings.map((w) => `<li>${esc(w)}</li>`).join('') + '</ul></details>'
    : '';

  const svg = `<svg width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="Service map: ${esc(mission.title || '')}">${defs}
${bandsSvg(layout)}
${edgesSvg}
${nodesSvg}
</svg>`;

  // TASK-3-CONTROLS: mode toggle / heat toggle / lane filters are inserted in .mv-controls
  // TASK-3-PANEL: <aside id="mv-panel"> is inserted after .mv-canvas
  // TASK-3-SCRIPT: data blob + client script appended after .mv-app
  const fragment = `<title>Mission: ${esc(mission.title || 'Untitled')}</title>
<style>${CSS}</style>
<div class="mv-app" data-mode="${mode === 'explore' ? 'explore' : 'overview'}">
  <header class="mv-header">
    <div>
      <h1>${esc(mission.title || 'Untitled mission')}</h1>
      <p class="mv-goal">${esc(mission.goal || '')}</p>
      <p class="mv-meta">${badge}${counts}</p>
    </div>
    <div class="mv-controls"></div>
  </header>
  ${warningsHtml}
  <div class="mv-body">
    <div class="mv-canvas">${svg}</div>
  </div>
  ${LEGEND}
</div>`;

  const html = standalone
    ? `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Mission: ${esc(mission.title || 'Untitled')}</title>
<style>html,body{margin:0;padding:0;}</style>
</head>
<body>
${fragment}
</body>
</html>`
    : fragment;

  return { html, warnings: layout.warnings };
}

module.exports = { renderMission, computeHeat, wrapText, esc };

// ── CLI ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith('-'));
  if (!input) {
    console.error('Usage: node render-mission.js <mission.json> [-o out.html] [--standalone] [--mode overview|explore]');
    process.exit(1);
  }
  const oIdx = args.indexOf('-o');
  const outPath = oIdx !== -1 ? args[oIdx + 1] : path.basename(input).replace(/\.json$/i, '') + '.html';
  const mIdx = args.indexOf('--mode');
  const mission = JSON.parse(fs.readFileSync(input, 'utf8'));
  const { html, warnings } = renderMission(mission, {
    mode: mIdx !== -1 ? args[mIdx + 1] : 'overview',
    standalone: args.includes('--standalone')
  });
  fs.writeFileSync(outPath, html);
  console.log(`Wrote ${outPath} (${(mission.nodes || []).length} nodes, ${(mission.edges || []).length} edges)`);
  warnings.forEach((w) => console.warn('warning: ' + w));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tools/renderers/test-render-mission.js`
Expected: all PASS, exit 0.
Also re-run: `node tools/renderers/test-mission-layout.js` — still all PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/render-mission.js tools/renderers/test-render-mission.js
git commit -m "feat(v2.0): mission renderer CLI — static SVG, themes, Overview mode"
```

---

### Task 3: Explore mode — controls, inspect panel, lane filters, barrier heat

**Files:**
- Modify: `tools/renderers/render-mission.js` (three marked insertion points)
- Test: `tools/renderers/test-render-mission.js` (append a section)

**Interfaces:**
- Consumes: Task 2's `renderMission` internals; the CSS already contains all styles for what this task adds (`.mv-mode`, `.mv-panel`, `.mv-filters`, `.heat-on`, `.mv-explore-only`).
- Produces: fragment now includes `<div class="mv-controls">` populated with mode buttons / heat checkbox (`id="mv-heat-cb"`) / lane-filter `details` (`id="mv-lane-cbs"` container), `<aside class="mv-panel" id="mv-panel" hidden>`, a `<script type="application/json" id="mv-data">` blob (the full mission JSON, `<` escaped as `\u003c`), and an inline client script. No API changes.

- [ ] **Step 1: Append the failing test section**

Append to `tools/renderers/test-render-mission.js`, immediately BEFORE the final `console.log`/`process.exit` lines:

```js
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
```

- [ ] **Step 2: Run test to verify the new section fails**

Run: `node tools/renderers/test-render-mission.js`
Expected: earlier sections PASS; new section FAILs (`mode toggle buttons present`, etc.), exit 1.

- [ ] **Step 3: Implement the three insertions**

In `tools/renderers/render-mission.js`:

**(a)** Replace `<div class="mv-controls"></div>` in the fragment template with:

```js
  <div class="mv-controls">
    <div class="mv-mode" role="group" aria-label="View mode">
      <button type="button" class="mv-mode-btn" data-setmode="overview">Overview</button>
      <button type="button" class="mv-mode-btn" data-setmode="explore">Explore</button>
    </div>
    <label class="mv-explore-only mv-heat-toggle"><input type="checkbox" id="mv-heat-cb"> Barrier heat</label>
    <details class="mv-explore-only mv-filters"><summary>Lanes</summary><div id="mv-lane-cbs"></div></details>
  </div>
```

(These lines are template-literal content inside `fragment` — keep the surrounding backtick string intact.)

**(b)** After `<div class="mv-canvas">${svg}</div>` add:

```js
    <aside class="mv-panel" id="mv-panel" hidden></aside>
```

**(c)** After the closing `</div>` of `.mv-app` (still inside the `fragment` template literal), append the data blob and client script:

```js
<script type="application/json" id="mv-data">${JSON.stringify(mission).replace(/</g, '\\u003c')}</script>
<script>
(function () {
  var app = document.querySelector('.mv-app');
  var data = JSON.parse(document.getElementById('mv-data').textContent);
  var nodesById = {};
  (data.nodes || []).forEach(function (n) { nodesById[n.nodeId] = n; });

  var laneDefs = (data.lanes && data.lanes.length) ? data.lanes : (function () {
    var keys = [];
    (data.nodes || []).forEach(function (n) {
      Object.keys(n.laneContent || {}).forEach(function (k) {
        if (keys.indexOf(k) === -1) keys.push(k);
      });
    });
    return keys.map(function (k) { return { id: k, label: k, type: 'text' }; });
  })();
  var enabledLanes = {};
  laneDefs.forEach(function (d) { enabledLanes[d.id] = true; });
  var openNodeId = null;
  var panel = document.getElementById('mv-panel');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function syncModeButtons() {
    app.querySelectorAll('[data-setmode]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-setmode') === app.getAttribute('data-mode'));
    });
  }
  app.querySelectorAll('[data-setmode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      app.setAttribute('data-mode', btn.getAttribute('data-setmode'));
      syncModeButtons();
      if (app.getAttribute('data-mode') === 'overview') closePanel();
    });
  });
  syncModeButtons();

  // Spec: hide the heat toggle entirely when the mission has no barriers anywhere.
  var anyHeat = app.querySelector('.mv-node[data-heat="low"], .mv-node[data-heat="medium"], .mv-node[data-heat="high"]');
  if (!anyHeat) document.querySelector('.mv-heat-toggle').hidden = true;

  document.getElementById('mv-heat-cb').addEventListener('change', function (e) {
    app.classList.toggle('heat-on', e.target.checked);
  });

  var cbHost = document.getElementById('mv-lane-cbs');
  laneDefs.forEach(function (def) {
    var label = el('label');
    var cb = el('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', function () {
      enabledLanes[def.id] = cb.checked;
      if (openNodeId) renderPanel(openNodeId);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + (def.label || def.id)));
    cbHost.appendChild(label);
  });

  function closePanel() {
    panel.hidden = true;
    openNodeId = null;
    app.querySelectorAll('.mv-node.selected').forEach(function (n) { n.classList.remove('selected'); });
  }

  function humanDuration(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return m + ' min';
    var h = Math.round(m / 6) / 10;
    return h + ' h';
  }

  function renderLaneValue(host, def, value) {
    var items = Array.isArray(value) ? value : [value];
    if (def.type === 'list') {
      var ul = el('ul');
      items.forEach(function (item) { ul.appendChild(el('li', null, String(item))); });
      host.appendChild(ul);
      return;
    }
    items.forEach(function (item) {
      if (def.type === 'barrier' && item && typeof item === 'object') {
        var row = el('div', 'mv-barrier');
        var sev = Math.max(0, Math.min(5, item.severity || 0));
        var dots = '';
        for (var i = 0; i < 5; i++) dots += i < sev ? '\u25cf' : '\u25cb';
        row.appendChild(el('span', 'mv-sev', dots));
        if (item.type) row.appendChild(el('span', 'mv-tag', item.type));
        row.appendChild(el('p', null, item.description || ''));
        host.appendChild(row);
      } else if (def.type === 'channel' && item && typeof item === 'object') {
        var ch = el('div', 'mv-channel');
        ch.appendChild(el('strong', null, item.name || item.channel || ''));
        var meta = [item.channel, item.category, item.serviceModel].filter(Boolean).join(' \u00b7 ');
        if (meta) ch.appendChild(el('p', 'mv-dim', meta));
        if (item.usageContext) ch.appendChild(el('p', null, item.usageContext));
        host.appendChild(ch);
      } else if (item && typeof item === 'object') {
        host.appendChild(el('p', null, Object.keys(item).map(function (k) {
          return k + ': ' + item[k];
        }).join(' \u00b7 ')));
      } else {
        host.appendChild(el('p', null, String(item)));
      }
    });
  }

  function renderPanel(nodeId) {
    var node = nodesById[nodeId];
    if (!node) return;
    openNodeId = nodeId;
    app.querySelectorAll('.mv-node.selected').forEach(function (n) { n.classList.remove('selected'); });
    var g = app.querySelector('.mv-node[data-node="' + nodeId + '"]');
    if (g) g.classList.add('selected');
    panel.hidden = false;
    panel.textContent = '';
    var head = el('div', 'mv-panel-head');
    head.appendChild(el('h2', null, node.name || node.nodeId));
    var close = el('button', 'mv-close', '\u00d7');
    close.setAttribute('aria-label', 'Close details');
    close.addEventListener('click', closePanel);
    head.appendChild(close);
    panel.appendChild(head);
    var sub = (node.nodeType || '') + (node.durationMs ? ' \u00b7 ~' + humanDuration(node.durationMs) : '');
    panel.appendChild(el('p', 'mv-panel-type', sub));
    var lc = node.laneContent || {};
    laneDefs.forEach(function (def) {
      if (!enabledLanes[def.id]) return;
      if (!(def.id in lc)) return;
      var sec = el('section', 'mv-lane');
      sec.appendChild(el('h3', null, def.label || def.id));
      renderLaneValue(sec, def, lc[def.id]);
      panel.appendChild(sec);
    });
  }

  app.querySelectorAll('.mv-node').forEach(function (g) {
    function open() {
      if (app.getAttribute('data-mode') !== 'explore') return;
      renderPanel(g.getAttribute('data-node'));
    }
    g.addEventListener('click', open);
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
})();
</script>
```

Implementation note: `${JSON.stringify(mission)...}` is a template-literal interpolation — the script block must be appended inside the `fragment` template literal, after `.mv-app`'s closing `</div>`. In the standalone wrapper nothing changes (the fragment already carries the scripts).

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tools/renderers/test-render-mission.js`
Expected: all sections PASS, exit 0.
Run: `node tools/renderers/test-mission-layout.js` — still PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/renderers/render-mission.js tools/renderers/test-render-mission.js
git commit -m "feat(v2.0): mission renderer Explore mode — inspect panel, lane filters, barrier heat"
```

---

### Task 4: Visual verification and iteration (Playwright)

**Files:**
- Modify: `tools/renderers/render-mission.js` and/or `tools/renderers/mission-layout.js` (fixes found visually)
- No new test files; existing tests must stay green after every fix.

**Interfaces:**
- Consumes: the CLI from Task 3.
- Produces: visually verified renderer; screenshots in the session scratchpad for the user checkpoint in Task 5.

This task is a loop, not a straight line — expect to iterate. The Playwright MCP tools are deferred: load them first with ToolSearch (`select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_take_screenshot,mcp__plugin_playwright_playwright__browser_click,mcp__plugin_playwright_playwright__browser_evaluate,mcp__plugin_playwright_playwright__browser_snapshot`).

- [ ] **Step 1: Generate standalone outputs for all four missions**

From the repo root, with `$SCRATCH` = the session scratchpad directory:

```bash
for f in v2.0/examples/*/mission-*.json; do
  name=$(basename "$f" .json)
  node tools/renderers/render-mission.js "$f" -o "$SCRATCH/$name.html" --standalone
done
```

Expected: four files written, node/edge counts echoed, no warnings for the four examples.

- [ ] **Step 2: Screenshot each mission, light theme, Overview mode**

For each file: `browser_navigate` to `file://$SCRATCH/<name>.html`, then `browser_take_screenshot` (full page). Check against the spec's acceptance list:
- every node visible; every edge drawn and attached to sensible anchor points
- node labels legible, no text overflowing shapes
- condition labels readable, not overlapping nodes or each other
- loop-back arcs route above the rows without crossing node labels
- phase band names/goals legible; alternating bands visible

- [ ] **Step 3: Verify Explore interactions on the energy mission**

On `mission-energy-supplier-switch.html`:
1. `browser_click` the "Explore" button; `browser_snapshot` to confirm heat/lane controls appear.
2. `browser_click` the "Research switching process" node; confirm the panel shows Description, Channels ("MoneySavingExpert and guides"), a barrier with severity dots ●●●○○, and Design opportunities.
3. Toggle "Barrier heat"; `browser_take_screenshot`; confirm haloes appear only on nodes with barriers, colour-graded.
4. Open "Lanes", untick "Barriers"; confirm the open panel re-renders without the Barriers section.
5. Click "Overview"; confirm panel closes and controls hide.

- [ ] **Step 4: Dark theme check**

On the energy mission: `browser_evaluate` → `document.documentElement.setAttribute('data-theme','dark')`, screenshot Overview and Explore-with-heat. Check text contrast, edge visibility, band alternation.

- [ ] **Step 5: Fix issues and re-verify**

For each defect found: fix in the renderer/layout source, re-run both test files (`node tools/renderers/test-mission-layout.js && node tools/renderers/test-render-mission.js` — must stay green), regenerate the affected HTML, re-screenshot. Known likely candidates: same-column vertical edges passing through intermediate nodes (acceptable if rare; fix by nudging via a small horizontal bow in `edgeSvg` if it harms legibility), condition-label collisions at dense columns, retail (25-node) height.

- [ ] **Step 6: Commit fixes**

```bash
git add tools/renderers/
git commit -m "fix(v2.0): mission renderer visual fixes from Playwright verification"
```

(Skip if no fixes were needed — do not create an empty commit.)

---

### Task 5: Publish artifact and user iteration checkpoint

**Files:** none in the repo (scratchpad + published artifact only).

**Interfaces:**
- Consumes: the CLI (fragment mode) from Task 3.
- Produces: a published artifact URL for the energy mission; user feedback that may loop back into Task 4-style fixes.

- [ ] **Step 1: Generate the fragment**

```bash
node tools/renderers/render-mission.js \
  v2.0/examples/energy/mission-energy-supplier-switch.json \
  -o "$SCRATCH/mission-energy-artifact.html"
```

- [ ] **Step 2: Load the artifact-design skill** (required before publishing any artifact), then publish with the Artifact tool: `file_path` = the fragment, `favicon` = "🗺️", `description` = "Interactive service map of the Energy Supplier Switch mission (v2.0 schema) — Overview for stakeholders, Explore for designers."

- [ ] **Step 3: Present to the user**

Give the user the artifact URL and a short orientation: Overview is the stakeholder view; Explore adds click-to-inspect, lane filters, and barrier heat. Ask specifically: (a) does Overview read at a glance for a stakeholder? (b) in Explore, is the panel content the right depth? (c) any layout defects on their screen? **STOP and wait for feedback.**

- [ ] **Step 4: Iterate**

Apply requested changes to the renderer source (tests stay green), regenerate the fragment, republish with the SAME `file_path` (same artifact URL). Repeat until the user is satisfied. Commit each accepted change:

```bash
git add tools/renderers/
git commit -m "feat(v2.0): mission renderer refinements from user review"
```

---

### Task 6: Rewrite the mission-renderer skill

**Files:**
- Modify: `.claude/skills/mission-renderer/SKILL.md` (full replacement)

**Interfaces:**
- Consumes: the CLI contract from Task 3 (`render-mission.js <mission.json> [-o out] [--standalone] [--mode]`).
- Produces: the skill that future sessions use to render missions.

- [ ] **Step 1: Replace the skill content**

Replace the entire content of `.claude/skills/mission-renderer/SKILL.md` with:

```markdown
---
name: mission-renderer
description: Renders Mission JSON as an interactive two-mode service map (Overview for stakeholders, Explore for designers) using the deterministic renderer CLI, published as a Claude artifact. Triggers on "render mission", "show mission", "visualise mission", "mission graph", "show the service map", "mission renderer".
allowed-tools: Read, Glob, Bash, Artifact, Skill
---

# Mission Renderer Skill

## Overview

Renders a v2.0 Mission as a self-contained interactive HTML visualisation with two modes:

- **Overview** — stakeholder altitude: node shapes + names, phase bands, edge structure, legend. Nothing else.
- **Explore** — designer altitude: same geometry plus click-to-inspect lane panel, lane visibility filters, and a barrier-heat overlay (severity sums bucketed 0 / 1–3 / 4–7 / 8+).

Rendering is deterministic: a Node CLI generates the HTML — never hand-write the visualisation.

**Technology note:** plain inline SVG + JS. React Flow and ELK.js are not usable in artifact sandboxes (spike verdict, `tools/tests/spike-notes.md`). Mermaid is natively available in artifacts but is not used here (insufficient control for Explore mode); it remains a candidate for a future Figma/FigJam export bridge.

## Schema binding (v2.0 — real field names)

Reads: `nodeId`, `name`, `nodeType`, `from`, `to`, `edgeType`, `condition.description`, `label`, `phases[].nodeRefs`, `lanes[]` (`id`/`label`/`type`), `laneContent`, `scope.asIs`, `title`, `goal`. Phase membership lives in `phases[].nodeRefs` — nodes do NOT carry a phase field.

## Process

### Step 1: Locate the Mission JSON

Ask the user or Glob for `v2.0/examples/*/mission-*.json` (or the user's own file). Optionally validate first: `node tools/validators/validate-v2.0.js <file>`.

### Step 2: Generate

Run from the repo root, writing to the session scratchpad (never commit generated HTML):

    node tools/renderers/render-mission.js <mission.json> -o <scratchpad>/<name>.html

Options:
- `--mode explore` — open in Explore mode (default: overview)
- `--standalone` — full HTML document for local browser testing (do NOT use for artifact publishing; artifacts wrap the fragment themselves)

The CLI prints node/edge counts and any data warnings (dangling edges, unphased nodes). Surface warnings to the user.

### Step 3: Publish

Load the `artifact-design` skill, then publish the fragment with the Artifact tool (favicon 🗺️). Re-running with the same file path updates the same artifact URL.

### Step 4: Orient the user

Explain the two modes and the legend. Offer `--mode explore` regeneration if their audience is designers.

## Visual language

| Node type | Shape | Edge type | Style |
|---|---|---|---|
| `start` | green circle | `default` | solid arrow |
| `end` | red double circle | `conditional` | dashed + condition label |
| `touchpoint` | blue rounded rect | `loop_back` | dashed arc above rows |
| `decision` | amber diamond | `error` | red arrow |
| `handoff` | purple hexagon | | |
| `wait` | grey dashed rect | | |
| `signal` | orange circle | | |

Layout: columns = phases (in `phases[]` order) with synthetic first/last columns for unphased start/end nodes; row order = topological depth. Both light and dark themes are built in.

## Troubleshooting

- **Edge/node count mismatch on the artifact** — check CLI warnings: dangling edge refs are skipped and listed in the artifact's ⚠ strip.
- **Node in no phase** — placed by topological depth with a warning; fix the mission's `phases[].nodeRefs` for intended placement.
- **Crowded layout (>25 nodes)** — layout is columnar; consider splitting the mission or reordering `nodes[]` to influence row order.
- **Renderer bugs** — tests live at `tools/renderers/test-mission-layout.js` and `tools/renderers/test-render-mission.js`; run both before changing the renderer.
```

- [ ] **Step 2: Verify the skill references real files**

Run: `ls tools/renderers/render-mission.js tools/renderers/test-mission-layout.js tools/renderers/test-render-mission.js tools/validators/validate-v2.0.js`
Expected: all four paths exist.

- [ ] **Step 3: Smoke-test the documented command**

Run the exact command from the skill against the healthcare mission into the scratchpad; expected: file written, `15 nodes`, no warnings.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/mission-renderer/SKILL.md
git commit -m "docs(v2.0): rewrite mission-renderer skill — deterministic CLI, two modes, real schema fields"
```

---

## Plan self-review notes

- Spec coverage: layout (Task 1), visual language + themes + Overview (Task 2), Explore capabilities (Task 3), resilience — dangling edges/unphased nodes/no-phases/lane fallback/heat hidden-when-empty is covered by Task 1 warnings + Task 2 warning strip + Task 3 lane fallback (heat halo simply never displays when every node is `data-heat="none"`), validation (Tasks 2 and 4), generation path / skill rewrite (Task 6). Out-of-scope items (paths, Mermaid/Figma) appear nowhere in the code.
- The user has explicitly weighted visual iteration over up-front polish: Tasks 4 and 5 are deliberately loops with checkpoints, and Task 5 blocks on user feedback.
```
