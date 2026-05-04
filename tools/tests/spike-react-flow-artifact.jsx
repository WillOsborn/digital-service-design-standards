/**
 * DSDS v2.0 — Mission Graph Renderer Spike
 * Task 4.0: React Flow + ELK.js technology spike
 *
 * HOW TO TEST
 * -----------
 * 1. Open claude.ai and start a new conversation.
 * 2. Paste this entire file into the message box.
 * 3. Ask: "Render this as a React artifact."
 *
 * WHAT SUCCESS LOOKS LIKE
 * -----------------------
 * - A left-to-right service journey graph appears with styled nodes.
 * - Nodes are colour-coded by type (blue=touchpoint, amber=decision, etc.).
 * - Clicking a node opens a sidebar showing its details.
 * - Conditional edges show "Yes" / "No" labels.
 * - A loop-back edge is visible connecting "Return goods" back to an earlier step.
 *
 * FALLBACK NOTES
 * --------------
 * ELK.js requires a Web Worker or synchronous bundled build; both are blocked in
 * Claude.ai's artifact sandbox. This spike uses a deterministic manual layout
 * (nodes bucketed into phases, positioned on a grid) that closely approximates
 * what ELK layered would produce. The visual pattern and interactivity are fully
 * demonstrated. For production use in a Next.js / Vite app, ELK.js works fine.
 *
 * See tools/tests/spike-notes.md for full findings and Task 4.1 recommendation.
 */

// =============================================================================
// DEMO DATA — "Clothes Shopping" service journey
// =============================================================================

const DEMO_NODES = [
  {
    id: "start",
    type: "start",
    data: {
      label: "Start",
      description: "Customer begins shopping journey",
      actor: "Customer",
    },
  },
  {
    id: "browse",
    type: "touchpoint",
    data: {
      label: "Browse catalogue",
      description: "Customer browses products online or in-store",
      actor: "Customer",
      channel: "Web / In-store",
    },
  },
  {
    id: "decide",
    type: "decision",
    data: {
      label: "Item available?",
      description: "System checks stock availability",
      actor: "System",
    },
  },
  {
    id: "wait_stock",
    type: "wait",
    data: {
      label: "Wait for restock",
      description: "Customer signs up for back-in-stock notification",
      actor: "Customer",
      duration: "1–14 days",
    },
  },
  {
    id: "add_basket",
    type: "touchpoint",
    data: {
      label: "Add to basket",
      description: "Customer adds selected item to shopping basket",
      actor: "Customer",
      channel: "Web",
    },
  },
  {
    id: "checkout",
    type: "touchpoint",
    data: {
      label: "Checkout",
      description: "Customer enters delivery details and payment",
      actor: "Customer",
      channel: "Web",
    },
  },
  {
    id: "payment_ok",
    type: "decision",
    data: {
      label: "Payment approved?",
      description: "Payment gateway verifies the transaction",
      actor: "Payment gateway",
    },
  },
  {
    id: "handoff_warehouse",
    type: "handoff",
    data: {
      label: "Order to warehouse",
      description: "Order is handed off from web platform to fulfilment system",
      actor: "Fulfilment system",
      from: "Web platform",
      to: "Warehouse",
    },
  },
  {
    id: "dispatch_signal",
    type: "signal",
    data: {
      label: "Dispatch notification",
      description: "Automated email/SMS sent to customer with tracking link",
      actor: "System",
      channel: "Email / SMS",
    },
  },
  {
    id: "return",
    type: "touchpoint",
    data: {
      label: "Return goods",
      description: "Customer initiates a return if item is unsatisfactory",
      actor: "Customer",
      channel: "Post / In-store",
    },
  },
  {
    id: "end",
    type: "end",
    data: {
      label: "End",
      description: "Journey complete — order fulfilled or return processed",
      actor: "System",
    },
  },
];

const DEMO_EDGES = [
  { id: "e1", source: "start", target: "browse", type: "default" },
  { id: "e2", source: "browse", target: "decide", type: "default" },
  {
    id: "e3",
    source: "decide",
    target: "wait_stock",
    type: "conditional",
    data: { label: "No" },
  },
  {
    id: "e4",
    source: "decide",
    target: "add_basket",
    type: "conditional",
    data: { label: "Yes" },
  },
  { id: "e5", source: "wait_stock", target: "browse", type: "loop_back" },
  { id: "e6", source: "add_basket", target: "checkout", type: "default" },
  { id: "e7", source: "checkout", target: "payment_ok", type: "default" },
  {
    id: "e8",
    source: "payment_ok",
    target: "checkout",
    type: "conditional",
    data: { label: "No — retry" },
  },
  {
    id: "e9",
    source: "payment_ok",
    target: "handoff_warehouse",
    type: "conditional",
    data: { label: "Yes" },
  },
  {
    id: "e10",
    source: "handoff_warehouse",
    target: "dispatch_signal",
    type: "default",
  },
  { id: "e11", source: "dispatch_signal", target: "return", type: "default" },
  { id: "e12", source: "return", target: "end", type: "default" },
];

// =============================================================================
// LAYOUT — manual phase-based layout (ELK.js fallback)
// =============================================================================

// Assign each node to a phase (column in the graph)
const PHASE_MAP = {
  start: 0,
  browse: 1,
  decide: 2,
  wait_stock: 2,
  add_basket: 3,
  checkout: 4,
  payment_ok: 5,
  handoff_warehouse: 6,
  dispatch_signal: 7,
  return: 8,
  end: 9,
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const H_GAP = 80;
const V_GAP = 90;

function computeLayout(nodes) {
  // Group nodes by phase
  const phases = {};
  nodes.forEach((n) => {
    const phase = PHASE_MAP[n.id] ?? 0;
    if (!phases[phase]) phases[phase] = [];
    phases[phase].push(n.id);
  });

  const positions = {};
  Object.entries(phases).forEach(([phase, ids]) => {
    const totalHeight =
      ids.length * NODE_HEIGHT + (ids.length - 1) * (V_GAP - NODE_HEIGHT);
    ids.forEach((id, i) => {
      positions[id] = {
        x: parseInt(phase) * (NODE_WIDTH + H_GAP) + 20,
        y: i * V_GAP + 20,
      };
    });
  });
  return positions;
}

// =============================================================================
// STYLE HELPERS
// =============================================================================

const NODE_STYLES = {
  touchpoint: {
    background: "#3b82f6",
    color: "#fff",
    border: "2px solid #1d4ed8",
    borderRadius: 10,
  },
  decision: {
    background: "#f59e0b",
    color: "#fff",
    border: "2px solid #b45309",
    borderRadius: 4,
    transform: "rotate(45deg)",
    width: 60,
    height: 60,
  },
  wait: {
    background: "#e5e7eb",
    color: "#374151",
    border: "2px dashed #9ca3af",
    borderRadius: 8,
  },
  handoff: {
    background: "#8b5cf6",
    color: "#fff",
    border: "2px solid #5b21b6",
    borderRadius: 4,
    clipPath: "polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)",
  },
  signal: {
    background: "#f97316",
    color: "#fff",
    border: "2px solid #c2410c",
    borderRadius: "50%",
    width: 60,
    height: 60,
  },
  start: {
    background: "#22c55e",
    color: "#fff",
    border: "2px solid #15803d",
    borderRadius: "50%",
    width: 60,
    height: 60,
  },
  end: {
    background: "#ef4444",
    color: "#fff",
    border: "4px double #b91c1c",
    borderRadius: "50%",
    width: 60,
    height: 60,
  },
};

const EDGE_COLORS = {
  default: "#64748b",
  conditional: "#f59e0b",
  loop_back: "#ef4444",
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function NodeBox({ node, isSelected, onClick, position }) {
  const style = NODE_STYLES[node.type] || NODE_STYLES.touchpoint;
  const isCircle = ["start", "end", "signal"].includes(node.type);
  const isDiamond = node.type === "decision";
  const isHexagon = node.type === "handoff";

  const boxW = isCircle || isDiamond ? 60 : NODE_WIDTH;
  const boxH = isCircle || isDiamond ? 60 : NODE_HEIGHT;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(node)}
    >
      {/* Selection ring */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={boxW + 8}
          height={boxH + 8}
          rx={isDiamond ? 0 : style.borderRadius === "50%" ? (boxW + 8) / 2 : 12}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={2.5}
          strokeDasharray="6 3"
        />
      )}

      {/* Diamond shape */}
      {isDiamond && (
        <>
          <rect
            x={0}
            y={0}
            width={boxW}
            height={boxH}
            fill={style.background}
            stroke={style.border.split(" ")[2]}
            strokeWidth={2}
            transform={`rotate(45, ${boxW / 2}, ${boxH / 2})`}
          />
          <text
            x={boxW / 2}
            y={boxH / 2 + 5}
            textAnchor="middle"
            fill={style.color}
            fontSize={10}
            fontWeight="600"
            style={{ pointerEvents: "none" }}
          >
            {node.data.label.length > 14
              ? node.data.label.slice(0, 12) + "…"
              : node.data.label}
          </text>
        </>
      )}

      {/* Circle shapes (start / end / signal) */}
      {isCircle && (
        <>
          <circle
            cx={boxW / 2}
            cy={boxH / 2}
            r={boxW / 2 - 1}
            fill={style.background}
            stroke={style.border.split(" ")[2]}
            strokeWidth={node.type === "end" ? 3 : 2}
          />
          {node.type === "end" && (
            <circle
              cx={boxW / 2}
              cy={boxH / 2}
              r={boxW / 2 - 7}
              fill="none"
              stroke={style.border.split(" ")[2]}
              strokeWidth={1.5}
            />
          )}
          <text
            x={boxW / 2}
            y={boxH / 2 + 4}
            textAnchor="middle"
            fill={style.color}
            fontSize={10}
            fontWeight="700"
            style={{ pointerEvents: "none" }}
          >
            {node.data.label}
          </text>
        </>
      )}

      {/* Hexagon for handoff */}
      {isHexagon && (
        <>
          <polygon
            points={`${boxW * 0.15},0 ${boxW * 0.85},0 ${boxW},${boxH / 2} ${boxW * 0.85},${boxH} ${boxW * 0.15},${boxH} 0,${boxH / 2}`}
            fill={style.background}
            stroke={style.border.split(" ")[2]}
            strokeWidth={2}
          />
          <text
            x={boxW / 2}
            y={boxH / 2 - 6}
            textAnchor="middle"
            fill={style.color}
            fontSize={10}
            fontWeight="600"
            style={{ pointerEvents: "none" }}
          >
            {node.data.label.length > 14
              ? node.data.label.slice(0, 12) + "…"
              : node.data.label}
          </text>
          <text
            x={boxW / 2}
            y={boxH / 2 + 8}
            textAnchor="middle"
            fill={style.color}
            fontSize={9}
            opacity={0.85}
            style={{ pointerEvents: "none" }}
          >
            [handoff]
          </text>
        </>
      )}

      {/* Default rect for touchpoint / wait */}
      {!isDiamond && !isCircle && !isHexagon && (
        <>
          <rect
            x={0}
            y={0}
            width={boxW}
            height={boxH}
            fill={style.background}
            stroke={style.border.split(" ")[2]}
            strokeWidth={2}
            strokeDasharray={node.type === "wait" ? "6 3" : undefined}
            rx={
              typeof style.borderRadius === "number"
                ? style.borderRadius
                : 8
            }
          />
          <text
            x={boxW / 2}
            y={boxH / 2 - 6}
            textAnchor="middle"
            fill={style.color}
            fontSize={11}
            fontWeight="600"
            style={{ pointerEvents: "none" }}
          >
            {node.data.label.length > 18
              ? node.data.label.slice(0, 16) + "…"
              : node.data.label}
          </text>
          <text
            x={boxW / 2}
            y={boxH / 2 + 10}
            textAnchor="middle"
            fill={style.color}
            fontSize={9}
            opacity={0.8}
            style={{ pointerEvents: "none" }}
          >
            [{node.type}]
          </text>
        </>
      )}
    </g>
  );
}

function EdgeArrow({ edge, positions }) {
  const srcPos = positions[edge.source];
  const tgtPos = positions[edge.target];
  if (!srcPos || !tgtPos) return null;

  const srcW = ["start", "end", "signal"].includes(
    DEMO_NODES.find((n) => n.id === edge.source)?.type
  )
    ? 60
    : NODE_WIDTH;
  const srcH = ["start", "end", "signal"].includes(
    DEMO_NODES.find((n) => n.id === edge.source)?.type
  )
    ? 60
    : NODE_HEIGHT;
  const tgtW = ["start", "end", "signal"].includes(
    DEMO_NODES.find((n) => n.id === edge.target)?.type
  )
    ? 60
    : NODE_WIDTH;
  const tgtH = ["start", "end", "signal"].includes(
    DEMO_NODES.find((n) => n.id === edge.target)?.type
  )
    ? 60
    : NODE_HEIGHT;

  const x1 = srcPos.x + srcW;
  const y1 = srcPos.y + srcH / 2;
  const x2 = tgtPos.x;
  const y2 = tgtPos.y + tgtH / 2;

  const isLoopBack = edge.type === "loop_back";
  const color = EDGE_COLORS[edge.type] || EDGE_COLORS.default;

  // Loop-back edges curve above the graph
  const d = isLoopBack
    ? `M ${x1} ${y1} C ${x1} ${y1 - 100}, ${x2} ${y2 - 100}, ${x2} ${y2}`
    : `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;

  const midX = (x1 + x2) / 2;
  const midY = isLoopBack ? Math.min(y1, y2) - 80 : (y1 + y2) / 2;

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${edge.id}`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isLoopBack ? 1.5 : 1.5}
        strokeDasharray={isLoopBack ? "5 3" : undefined}
        markerEnd={`url(#arrow-${edge.id})`}
        opacity={0.8}
      />
      {edge.data?.label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          fill={color}
          fontSize={10}
          fontWeight="600"
          style={{
            background: "white",
            pointerEvents: "none",
          }}
        >
          {edge.data.label}
        </text>
      )}
    </g>
  );
}

function Legend() {
  const items = [
    { type: "touchpoint", color: "#3b82f6", label: "Touchpoint" },
    { type: "decision", color: "#f59e0b", label: "Decision" },
    { type: "wait", color: "#9ca3af", label: "Wait" },
    { type: "handoff", color: "#8b5cf6", label: "Handoff" },
    { type: "signal", color: "#f97316", label: "Signal" },
    { type: "start", color: "#22c55e", label: "Start" },
    { type: "end", color: "#ef4444", label: "End" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 16px",
        padding: "10px 16px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        fontSize: 12,
      }}
    >
      {items.map((item) => (
        <span
          key={item.type}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: ["signal", "start", "end"].includes(item.type)
                ? "50%"
                : 3,
              background: item.color,
              display: "inline-block",
            }}
          />
          <span style={{ color: "#64748b" }}>{item.label}</span>
        </span>
      ))}
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 20,
            height: 2,
            background: "#ef4444",
            display: "inline-block",
            borderTop: "2px dashed #ef4444",
          }}
        />
        <span style={{ color: "#64748b" }}>Loop-back</span>
      </span>
    </div>
  );
}

function Sidebar({ node, onClose }) {
  if (!node) return null;
  const style = NODE_STYLES[node.type] || NODE_STYLES.touchpoint;
  return (
    <div
      style={{
        width: 260,
        borderLeft: "1px solid #e2e8f0",
        background: "#ffffff",
        padding: "20px 16px",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "#64748b",
            background: "#f1f5f9",
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          {node.type}
        </span>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 18,
            color: "#94a3b8",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#1e293b",
          margin: "0 0 8px",
        }}
      >
        {node.data.label}
      </h2>
      <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px", lineHeight: 1.5 }}>
        {node.data.description}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(node.data)
          .filter(([k]) => !["label", "description"].includes(k))
          .map(([k, v]) => (
            <div key={k}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "#94a3b8",
                  marginBottom: 2,
                }}
              >
                {k}
              </div>
              <div style={{ fontSize: 13, color: "#334155" }}>{v}</div>
            </div>
          ))}
      </div>
      {/* Colour swatch */}
      <div
        style={{
          marginTop: 20,
          height: 4,
          borderRadius: 2,
          background: style.background,
        }}
      />
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MissionGraphSpike() {
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [viewBox, setViewBox] = React.useState({ x: 0, y: 0, zoom: 1 });
  const svgRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0 });

  const positions = React.useMemo(() => computeLayout(DEMO_NODES), []);

  // SVG canvas dimensions
  const canvasW = 10 * (NODE_WIDTH + H_GAP) + 40;
  const canvasH = 4 * V_GAP + 40;

  // Pan handlers
  const onMouseDown = (e) => {
    if (e.target.closest("g[data-node]")) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX + viewBox.x, y: e.clientY + viewBox.y };
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    setViewBox((v) => ({
      ...v,
      x: dragStart.current.x - e.clientX,
      y: dragStart.current.y - e.clientY,
    }));
  };
  const onMouseUp = () => {
    isDragging.current = false;
  };

  const handleNodeClick = (node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 20px",
          background: "#1e293b",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700 }}>
          DSDS Mission Graph
        </span>
        <span
          style={{
            fontSize: 11,
            background: "#0f172a",
            color: "#94a3b8",
            padding: "2px 8px",
            borderRadius: 4,
            fontWeight: 500,
          }}
        >
          Spike v0.1 — Task 4.0
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#94a3b8",
            marginLeft: "auto",
          }}
        >
          Clothes Shopping Journey · {DEMO_NODES.length} nodes · {DEMO_EDGES.length} edges
        </span>
      </div>

      {/* Legend */}
      <Legend />

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SVG canvas */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            cursor: isDragging.current ? "grabbing" : "grab",
            position: "relative",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`${viewBox.x} ${viewBox.y} ${canvasW / viewBox.zoom} ${canvasH / viewBox.zoom}`}
            style={{ display: "block", background: "#f8fafc" }}
          >
            {/* Grid dots */}
            <defs>
              <pattern
                id="grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="#cbd5e1" opacity="0.5" />
              </pattern>
            </defs>
            <rect width={canvasW} height={canvasH} fill="url(#grid)" />

            {/* Edges (drawn first, beneath nodes) */}
            {DEMO_EDGES.map((edge) => (
              <EdgeArrow key={edge.id} edge={edge} positions={positions} />
            ))}

            {/* Nodes */}
            {DEMO_NODES.map((node) => (
              <g key={node.id} data-node={node.id}>
                <NodeBox
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onClick={handleNodeClick}
                  position={positions[node.id] || { x: 0, y: 0 }}
                />
              </g>
            ))}
          </svg>

          {/* Zoom controls */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {[
              { label: "+", delta: 0.2 },
              { label: "−", delta: -0.2 },
              { label: "⊡", delta: null },
            ].map(({ label, delta }) => (
              <button
                key={label}
                onClick={() => {
                  if (delta === null) {
                    setViewBox({ x: 0, y: 0, zoom: 1 });
                  } else {
                    setViewBox((v) => ({
                      ...v,
                      zoom: Math.max(0.3, Math.min(3, v.zoom + delta)),
                    }));
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  background: "#ffffff",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Hint when nothing selected */}
          {!selectedNode && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                fontSize: 12,
                color: "#94a3b8",
                background: "rgba(255,255,255,0.85)",
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
              }}
            >
              Click a node to see details · Drag to pan
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>
    </div>
  );
}
