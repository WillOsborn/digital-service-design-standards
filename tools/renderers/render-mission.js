// Renders a v2.0 Mission JSON as a self-contained HTML visualisation.
// Fragment output (default) is Artifact-ready; --standalone wraps a full document.
// CLI: node tools/renderers/render-mission.js <mission.json> [-o out.html] [--standalone] [--mode overview|explore]

'use strict';

const fs = require('fs');
const path = require('path');
const { computeLayout } = require('./mission-layout');

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

// ── channels ───────────────────────────────────────────────────────────────

// Canonical order, so glyphs never reorder between nodes that share categories.
// `channel` itself is a free string in the schema, so only the enum fields are
// mappable to a fixed glyph set.
const CHANNEL_CATEGORIES = ['digital', 'telecom', 'physical', 'unspecified'];

// One glyph per distinct category on a node. Where a category is reached by both
// a self-service and a managed channel, the glyph reports 'both'.
function channelGlyphs(node) {
  const channels = ((node || {}).laneContent || {}).channels;
  if (!Array.isArray(channels) || !channels.length) return [];
  const byCategory = new Map();
  for (const c of channels) {
    if (!c) continue;
    const category = CHANNEL_CATEGORIES.includes(c.category) ? c.category : 'unspecified';
    const model = c.serviceModel;
    if (!byCategory.has(category)) byCategory.set(category, model);
    else if (byCategory.get(category) !== model) byCategory.set(category, 'both');
  }
  return CHANNEL_CATEGORIES
    .filter((cat) => byCategory.has(cat))
    .map((cat) => ({ category: cat, serviceModel: byCategory.get(cat) }));
}

// ── geometry per node type ─────────────────────────────────────────────────

// half-width / half-height used as edge anchor offsets
const HALF_W = { start: 26, end: 28, signal: 26, decision: 79, touchpoint: 79, handoff: 79, wait: 79 };
const HALF_H = { start: 26, end: 28, signal: 26, decision: 34, touchpoint: 28, handoff: 28, wait: 28 };
// Widest half-width used by any node type — the offset a route must clear
// to escape a column's node territory regardless of which type occupies it.
const MAX_HALF_W = Math.max(...Object.values(HALF_W));

// Channel glyphs sit just above the node shape, right-aligned to its edge.
// Right-aligned rather than centred because edges arrive vertically at the
// node's centre line in this columnar layout — a centred glyph sits directly
// on the incoming edge. One formula covers every node type because HALF_W and
// HALF_H already vary per type; unknown types fall back to the touchpoint box,
// exactly as the shapes themselves do.
const GLYPH_W = 12;
const GLYPH_GAP = 4;
const GLYPH_ABOVE = 9;
const GLYPH_INSET = 6;

// Each category is one closed shape carrying the fill rule; decoration that must
// always be stroked (the telecom arc) is kept in a separate class.
const GLYPH_SHAPE = {
  digital: '<rect class="mv-chan-s" x="-5.5" y="-4" width="11" height="8" rx="1.5"></rect>',
  telecom: '<path class="mv-chan-wave" d="M-5,-1 A5,5 0 0 1 5,-1"></path>' +
    '<circle class="mv-chan-s" cx="0" cy="3.2" r="2.6"></circle>',
  physical: '<path class="mv-chan-s" d="M0,-5.5 C2.9,-5.5 5,-3.4 5,-1 C5,1.9 0,5.5 0,5.5 ' +
    'C0,5.5 -5,1.9 -5,-1 C-5,-3.4 -2.9,-5.5 0,-5.5 Z"></path>',
  unspecified: '<rect class="mv-chan-s" x="-5" y="-1.5" width="10" height="3" rx="1.5"></rect>'
};

// The glyphs are a visual-only cue, so the same fact is spelled out in the
// node's accessible name.
const SERVICE_MODEL_WORDS = { self_service: 'self-service', managed: 'managed', both: 'both' };

function channelAriaText(node) {
  const glyphs = channelGlyphs(node);
  if (!glyphs.length) return '';
  const parts = glyphs.map((g) =>
    `${g.category} (${SERVICE_MODEL_WORDS[g.serviceModel] || 'unspecified'})`);
  return `. Channels: ${parts.join(', ')}`;
}

function channelGlyphsSvg(node, pos) {
  const glyphs = channelGlyphs(node);
  if (!glyphs.length) return '';
  const t = node.nodeType || 'touchpoint';
  const halfH = HALF_H[t] !== undefined ? HALF_H[t] : HALF_H.touchpoint;
  const halfW = HALF_W[t] !== undefined ? HALF_W[t] : HALF_W.touchpoint;
  const y = pos.y - halfH - GLYPH_ABOVE;
  const step = GLYPH_W + GLYPH_GAP;
  const rightX = pos.x + halfW - GLYPH_INSET;
  const startX = rightX - (glyphs.length - 1) * step;
  const marks = glyphs.map((g, i) =>
    `<g class="mv-chan-g" data-cat="${esc(g.category)}" data-model="${esc(g.serviceModel || 'unspecified')}"` +
    ` transform="translate(${startX + i * step},${y})">${GLYPH_SHAPE[g.category] || GLYPH_SHAPE.unspecified}</g>`
  ).join('');
  return `<g class="mv-chan" aria-hidden="true">${marks}</g>`;
}

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
  return `<g class="mv-node" data-node="${esc(node.nodeId)}" data-heat="${heat.bucket}" tabindex="0" role="button" aria-label="${esc((node.name || node.nodeId) + channelAriaText(node))}">${halo}${body}${channelGlyphsSvg(node, pos)}</g>`;
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

  if (e.edgeType === 'loop_back' && t.col === s.col) {
    // Same-column loop-back: a straight vertical line here would run behind
    // any intervening nodes in the column and read as an ordinary forward
    // edge. Bow out to the side instead, clearing the widest node half-width
    // (79px) so the arc is visibly distinct from the column's straight edges.
    // A loop-back's source is usually a decision node that also has a
    // forward conditional edge into the next column; that edge's curve
    // settles near the gutter's midline (~half the gutter width out from
    // this column's own node edge). Push the bow past that midline, close
    // to (but clear of) the next column's node edge, so the two curves
    // read as separate lines rather than one doubled/braided track.
    const sx = s.x + sh + 6;
    const tx = t.x + th + 6;
    const bowX = s.x + 79 + 40;
    d = `M ${sx} ${s.y} C ${bowX} ${s.y}, ${bowX} ${t.y}, ${tx} ${t.y}`;
    // Label: the side-bow's own lane is too narrow (~40px) for typical label
    // text without overlapping a neighbouring column's nodes. Place the label
    // centred on the column instead, in the open gap just above the target
    // (row gap, or the header margin when the target is the column's top row).
    lx = s.x;
    ly = t.y - tv - 14;
  } else if (e.edgeType === 'loop_back') {
    // Cross-column loop-back: occupancy-aware routed elbow. Two failure
    // modes rule out both "climb straight up from the node" and "a single
    // peak-keyed Bezier": (1) any node sharing the SOURCE's or TARGET's own
    // column, sitting between that endpoint and the top of the diagram, sits
    // on the same column centre-line — a vertical climb up that centre-line
    // runs straight through it (a variant of the same-column collapse the
    // side-bow above already had to solve for the source/target node
    // itself, just one column over); (2) a curve shaped only by a peak
    // height still descends toward the endpoints while horizontally over an
    // INTERVENING column, so a deep endpoint's curve dips into that
    // column's row-0/1 territory (the defect this replaces). Fix: exit the
    // node from its side into the inter-column gutter — offset past the
    // widest node half-width used ANYWHERE in the layout (not just this
    // node's own type), so the climb clears every node sharing that column
    // regardless of type or row — climb straight up within that gutter,
    // cruise flat at a height that clears the topmost node top edge across
    // the WHOLE spanned column range (not just the two endpoints), then
    // mirror the same shape on descent into the target.
    const colLo = Math.min(s.col, t.col);
    const colHi = Math.max(s.col, t.col);
    let topEdge = Infinity;
    Object.keys(layout.nodePos).forEach((id) => {
      const p = layout.nodePos[id];
      if (p.col < colLo || p.col > colHi) return;
      topEdge = Math.min(topEdge, p.y - (HALF_H[typeOf[id]] || 28));
    });
    if (!Number.isFinite(topEdge)) topEdge = Math.min(s.y, t.y);
    const CLEARANCE = 14;
    const HEADER_FLOOR = 54; // never route through the phase-band header text
    const MIN_CLIMB = 6; // guarantee a real (non-degenerate) climb/descent
    let peak = Math.max(topEdge - CLEARANCE, HEADER_FLOOR);
    peak = Math.min(peak, s.y - MIN_CLIMB, t.y - MIN_CLIMB);
    const dir = t.x >= s.x ? 1 : -1;
    const GUTTER = MAX_HALF_W + 6; // clears every node sharing a column, any type
    const sx = s.x + dir * GUTTER;
    const tx = t.x - dir * GUTTER;
    const r = Math.max(0, Math.min(14, s.y - peak, t.y - peak)); // elbow corner radius
    d = `M ${s.x + dir * (sh + 6)} ${s.y} L ${sx} ${s.y} L ${sx} ${peak + r} ` +
      `Q ${sx} ${peak} ${sx + r * dir} ${peak} L ${tx - r * dir} ${peak} ` +
      `Q ${tx} ${peak} ${tx} ${peak + r} L ${tx} ${t.y} L ${t.x - dir * (th + 6)} ${t.y}`;
    // Label: the arc's own midpoint x, centred between two different
    // columns, is not collision-safe for typical label widths (same reason
    // as the cross-column case below) — it can land under whichever
    // endpoint's node is wider. Anchor on the shallower endpoint's own
    // column instead, in the row-gap above it.
    const shallow = t.row <= s.row ? { pos: t, half: tv } : { pos: s, half: sv };
    lx = shallow.pos.x;
    ly = shallow.pos.y - shallow.half - 14;
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
    if (Math.abs(t.row - s.row) > 1) {
      // A large row-span crosses rows that are occupied by unrelated nodes
      // in one or both columns — including, often, the source's own row in
      // the target column. A typical label is wider than the ~40px
      // inter-column gutter, so no x position centred in the gutter is
      // collision-safe. Anchor it instead in the row-gap above whichever
      // endpoint is shallower (closer to the top row), centred on that
      // endpoint's own column — full column width, guaranteed node-free
      // above the top of that node — mirroring the same-column loop-back
      // label placement above.
      const shallow = t.row <= s.row ? { pos: t, half: tv } : { pos: s, half: sv };
      lx = shallow.pos.x;
      ly = shallow.pos.y - shallow.half - 14;
    } else {
      // Label x: the column midpoint, not the path's own control point. mx
      // shifts toward whichever endpoint has the narrower node (e.g. an
      // 'end' circle, half-width 28) so it can drift out of the
      // inter-column gutter — (s.x+t.x)/2 always stays inside the gutter
      // regardless of either node's actual width.
      lx = (s.x + t.x) / 2;
      ly = (s.y + t.y) / 2 - 8;
    }
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
.mv-node:focus-visible .mv-shape { stroke:var(--c-text); stroke-width:2; }

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

/* Channel glyphs. Category is carried by shape and service model by fill, so the
   marks never compete with the node-type colours or the barrier-heat overlay. */
.mv-chan-s { fill:none; stroke:var(--c-dim); stroke-width:1.2; }
.mv-chan-wave { fill:none; stroke:var(--c-dim); stroke-width:1.2; stroke-linecap:round; }
.mv-chan-g[data-model="managed"] .mv-chan-s { fill:var(--c-dim); }
.mv-chan-g[data-model="both"] .mv-chan-s { fill:var(--c-dim); fill-opacity:0.4; }
.mv-chan-legend { width:14px; height:14px; display:inline-block; vertical-align:-2px; }
.mv-legend-sep { width:1px; align-self:stretch; background:var(--c-border); }

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

// A legend swatch drawn with the same shape and fill rule as the map itself,
// so the two can never disagree.
function chanLegendMark(category, serviceModel) {
  return `<svg class="mv-chan-legend" viewBox="-7 -7 14 14" aria-hidden="true">` +
    `<g class="mv-chan-g" data-model="${serviceModel}">${GLYPH_SHAPE[category]}</g></svg>`;
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
  <span class="mv-legend-sep" aria-hidden="true"></span>
  <span class="mv-chip">${chanLegendMark('digital', 'self_service')}Digital</span>
  <span class="mv-chip">${chanLegendMark('telecom', 'self_service')}Telecom</span>
  <span class="mv-chip">${chanLegendMark('physical', 'self_service')}Physical</span>
  <span class="mv-legend-sep" aria-hidden="true"></span>
  <span class="mv-chip">${chanLegendMark('digital', 'self_service')}Self-service</span>
  <span class="mv-chip">${chanLegendMark('digital', 'managed')}Managed</span>
  <span class="mv-chip">${chanLegendMark('digital', 'both')}Both</span>
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
    <div class="mv-controls">
      <div class="mv-mode" role="group" aria-label="View mode">
        <button type="button" class="mv-mode-btn" data-setmode="overview">Overview</button>
        <button type="button" class="mv-mode-btn" data-setmode="explore">Explore</button>
      </div>
      <label class="mv-explore-only mv-heat-toggle"><input type="checkbox" id="mv-heat-cb"> Barrier heat</label>
      <details class="mv-explore-only mv-filters"><summary>Lanes</summary><div id="mv-lane-cbs"></div></details>
    </div>
  </header>
  ${warningsHtml}
  <div class="mv-body">
    <div class="mv-canvas">${svg}</div>
    <aside class="mv-panel" id="mv-panel" hidden></aside>
  </div>
  ${LEGEND}
</div>
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

  function humanizeKey(key) {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .replace(/\\b\\w/g, function (c) { return c.toUpperCase(); })
      .trim();
  }

  function guessLaneType(value) {
    if (!Array.isArray(value) || !value.length) return 'text';
    var first = value[0];
    if (first && typeof first === 'object') {
      if ('severity' in first) return 'barrier';
      if ('channel' in first || 'name' in first) return 'channel';
    }
    return 'list';
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
    var knownLaneIds = {};
    laneDefs.forEach(function (def) {
      knownLaneIds[def.id] = true;
      if (!enabledLanes[def.id]) return;
      if (!(def.id in lc)) return;
      var sec = el('section', 'mv-lane');
      sec.appendChild(el('h3', null, def.label || def.id));
      renderLaneValue(sec, def, lc[def.id]);
      panel.appendChild(sec);
    });
    // A node can carry laneContent keys the mission's own lanes list
    // doesn't declare (an authoring mismatch between the two, e.g. a lane
    // id of 'design-opps' next to node content keyed 'designOpportunities').
    // Rather than silently dropping authored content the schema didn't
    // anticipate, show it under a humanised heading with a best-guess
    // rendering, so nothing a node author wrote is hidden from Explore.
    Object.keys(lc).forEach(function (key) {
      if (knownLaneIds[key]) return;
      var sec = el('section', 'mv-lane');
      sec.appendChild(el('h3', null, humanizeKey(key)));
      renderLaneValue(sec, { type: guessLaneType(lc[key]) }, lc[key]);
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
</script>`;

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

module.exports = { renderMission, computeHeat, wrapText, esc, channelGlyphs, channelGlyphsSvg };

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
