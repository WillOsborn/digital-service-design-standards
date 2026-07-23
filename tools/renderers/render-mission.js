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
      lines[lines.length - 1] = cur.slice(0, maxChars - 1) + '…';
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
  const counts = `${(mission.nodes || []).length} steps · ${(mission.edges || []).length} connections · ${(mission.phases || []).length} phases`;

  const warningsHtml = layout.warnings.length
    ? `<details class="mv-warnings"><summary>⚠ ${layout.warnings.length} data issue${layout.warnings.length > 1 ? 's' : ''}</summary><ul>` +
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
