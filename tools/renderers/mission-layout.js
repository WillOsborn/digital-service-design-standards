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
    else warnings.push(`edge ${e.from} → ${e.to} references an unknown node; skipped`);
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
