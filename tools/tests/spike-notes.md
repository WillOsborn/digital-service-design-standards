# Spike Notes — React Flow Graph Renderer (Task 4.0)

**Date:** 2026-05-04
**Spike file:** `tools/tests/spike-react-flow-artifact.jsx`

---

## Technology approach

The spike is a self-contained React function component (~450 lines) using
plain SVG rendering — no npm dependencies at runtime. It demonstrates:

- **Nodes:** 11 nodes across 7 types (start, end, touchpoint, decision, wait,
  handoff, signal), each rendered with a distinct SVG shape and colour.
- **Edges:** 12 edges with cubic Bézier paths, arrow markers, conditional
  labels ("Yes / No"), and a dashed red loop-back arc.
- **Layout:** Deterministic manual phase-based grid layout (nodes bucketed by
  a `PHASE_MAP` object, positioned by column × row offsets).
- **Interactivity:** Click-to-select nodes opens a sidebar with all data
  fields. Pan via mouse drag. Zoom via +/− buttons.
- **Visual polish:** Dot-grid background, legend bar, selection ring, header
  with node/edge count.

---

## ELK.js feasibility in Claude.ai artifacts

**ELK.js is not feasible in Claude.ai's React artifact sandbox.**

ELK.js (`elkjs/lib/elk.bundled.js`) requires either:
1. A Web Worker to run the Java-compiled layout engine asynchronously, or
2. Synchronous execution via a bundled WASM/JS blob that it ships as a
   separate worker file.

Claude.ai's artifact sandbox:
- Does not allow `import` of npm packages by URL.
- Does not support Web Workers (`new Worker(...)` is blocked).
- Does not allow `<script>` tag injection at runtime.

The same constraint applies to `@xyflow/react` — it cannot be imported from a
CDN inside a React artifact. Claude.ai provides only React (and ReactDOM) as
globals; all other libraries must be inlined or emulated.

**Conclusion:** For Claude.ai artifact demos, manual/deterministic layout is
the only viable approach. ELK.js (and React Flow) work correctly in a real
Next.js/Vite application build.

---

## Fallback layout quality

The manual `PHASE_MAP` layout is sufficient for a left-to-right service
journey because:
- Journey missions are inherently sequential with small fan-outs.
- Phase assignment is hand-coded per demo; in production it can be derived
  from topological sort of the edge graph.
- Loop-back and parallel branches can be handled by assigning shared phases
  and varying the y-offset.

For the full mission-renderer skill (Task 4.1) targeting Claude.ai artifacts,
this approach scales well up to ~20 nodes. Beyond that, automated topological
layout (topo-sort → phase assignment) should be added.

---

## Recommendation for Task 4.1 (mission-renderer skill)

1. **Render engine:** Plain SVG inside a React component, as demonstrated in
   this spike. Do not depend on `@xyflow/react` or ELK.js inside the artifact.

2. **Layout algorithm:** Implement a `computeLayout(nodes, edges)` function
   that:
   a. Runs a topological sort on the edge graph.
   b. Assigns each node a phase (column) equal to the longest path from any
      start node.
   c. Within each phase, stacks nodes vertically with configurable gap.
   d. Handles loop-back edges by routing above (negative y arc).

3. **For production apps** (not Claude.ai artifacts): ELK.js with the
   `elk.layered` algorithm and `elk.direction: RIGHT` produces excellent
   results and is the recommended approach for a Next.js/Vite mission viewer.

4. **Schema binding:** Task 4.1 should accept a v2.0 `mission.json` object
   and map its `steps[]` array to the node/edge model demonstrated here.

5. **Interactivity baseline** (already proven in this spike):
   - Click node → sidebar with full step data
   - Pan / zoom
   - Edge labels for conditional transitions
   - Visual distinction of all 7 node types
