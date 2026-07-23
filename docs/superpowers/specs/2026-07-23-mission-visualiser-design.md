# Mission Visualiser — Design Spec

**Date:** 2026-07-23
**Status:** Approved (pending user review of this document)
**Owner:** Will Osborn
**Relates to:** v2.0 Mission schema (`v2.0/schemas/mission.schema.json`), mission-renderer skill (`.claude/skills/mission-renderer/SKILL.md`), React Flow spike (`tools/tests/spike-notes.md`)

---

## Problem

v2.0 Missions are persona-agnostic service graphs — branching, looping, multi-path. Designers and stakeholders both need to understand them, but they need different altitudes: stakeholders need the honest shape of the service at a glance; designers need to interrogate lane content, barriers, and channels node by node.

The existing mission-renderer skill is out of sync with the real schema (it reads `node.id`, `node.type`, `node.phaseId`, `edge.source`, `edge.target`; the schema defines `nodeId`, `nodeType`, `from`, `to`, with phase membership in `phases[].nodeRefs`). It would fail on all four v2.0 example missions.

## Decisions already made

| Decision | Choice | Rationale |
|---|---|---|
| Audiences | Both stakeholder and designer views | Different needs, same underlying truth |
| Stakeholder form | Decluttered graph (not linear strip, not phase cards) | Honest about branching — half the point of v2.0 |
| Delivery | Claude artifacts first; Figma/FigJam migration explored later | Regenerable from JSON; Figma bridge out of scope here |
| Architecture | **One artifact, two modes** (Overview / Explore) | One link, one geometry, shared mental model |
| Designer capabilities | Click-to-inspect, lane visibility filters, barrier heat overlay | Selected explicitly; path highlighting deferred |
| Rendering tech | Hand-rolled inline SVG + JS in self-contained HTML | React Flow/ELK unavailable in artifact sandbox (spike verdict); full control of shape taxonomy |

Path highlighting was considered and **deferred** — it is not in scope for this build.

## What we're building

One self-contained HTML artifact generated from a Mission JSON file.

- **Header:** mission title, goal, scope badge (as-is / to-be), mode toggle (Overview / Explore).
- **Canvas:** SVG graph, identical geometry in both modes. Wide missions scroll horizontally inside the canvas container; the page never scrolls horizontally as a whole.
- **Footer:** legend explaining node shapes and edge styles.
- **Theme:** styled for both light and dark (artifact viewer theme), via `prefers-color-scheme` plus `:root[data-theme]` overrides.

### Layout algorithm

1. Columns come from `phases[]` array order. A node's column is the phase whose `nodeRefs` contains it.
2. Nodes in no phase (e.g. `start`/`end` in the energy example) get synthetic first/last columns: sources of the graph before the first phase, sinks after the last, any others resolved by topological depth.
3. Within a column, nodes are ordered by topological depth (longest path from any start node) to keep arrows flowing left→right and reduce crossings.
4. Phases render as alternating background bands with phase name and goal in the band header.
5. Edge routing: default/conditional edges are Bézier curves with arrowheads; `conditional` edges are dashed and carry `condition.description` as a label; `loop_back` edges route as dashed arcs above the nodes; `error` edges render red.

### Visual language

| Node type | Shape | Colour family |
|---|---|---|
| `start` | filled circle | green |
| `end` | double circle | red |
| `touchpoint` | rounded rectangle | blue |
| `decision` | diamond | amber |
| `handoff` | hexagon | purple |
| `wait` | dashed rectangle | grey |
| `signal` | circle | orange |

Exact values tuned per theme so both light and dark pass contrast checks.

### Overview mode (stakeholder altitude)

Node shapes and names, phase bands, edge structure with condition labels, legend, title/goal. Nothing else — no badges, counts, or panels. Type sized to read on a projected screen.

### Explore mode (designer altitude)

Same map plus:

1. **Click-to-inspect** — clicking a node opens a right-hand panel rendering its `laneContent`, formatted by lane type from the mission's `lanes[]` definitions:
   - `barrier`: description + severity as filled dots (●●●○○), barrier type tag
   - `channel`: name, channel, category, service model, usage context
   - `list`: bulleted items
   - `text` / `accessibility` / unknown types: prose fallback
   Panel is scrollable; close button or clicking empty canvas dismisses it.
2. **Barrier heat** — toggle tinting each node's outline/badge by summed barrier severity (each barrier scores its `severity`, 1–5). Buckets: none = 0, low = 1–3, medium = 4–7, high = 8+. Hidden entirely if the mission has no barriers.
3. **Lane filters** — checkboxes generated from the mission's own `lanes[]` array (never hard-coded), controlling which lanes appear in the inspect panel. All on by default.

### Generation path

The **mission-renderer skill is rewritten** as the standard way to produce this artifact:

- Fix schema drift: read `nodeId`, `name`, `nodeType`, `from`, `to`, `edgeType`, `condition.description`, `phases[].nodeRefs`, `lanes[]`.
- Replace the React component template with the self-contained HTML template (current harness publishes HTML artifacts; no React globals assumed).
- Document the two modes and default options.
- Keep the spike's technology verdict section, updated to note Mermaid is natively available in artifacts but unused here (insufficient control for Explore mode; retained as a candidate for the future Figma/FigJam bridge, which is out of scope).

No one-off rendering code: "render mission" → skill → artifact.

### Resilience

| Condition | Behaviour |
|---|---|
| Node in no phase | Synthetic column (start/end handling generalises) |
| Edge referencing unknown node | Skipped; counted in a small warning strip on the artifact |
| Missing/empty `lanes[]` | Panel falls back to raw `laneContent` key names |
| No barriers anywhere | Heat toggle hidden |
| No phases | Single unnamed band; columns from topological depth alone |

### Validation

Render all four v2.0 example missions and check:

- Every node visible, every edge drawn (counts match the JSON).
- No label collisions at 19 nodes (energy, build example) and 25 nodes (retail, stress test).
- Loop-back arcs legible; condition labels readable.
- Both light and dark themes readable; Overview legible at presentation scale.

## Out of scope

- Path highlighting (deferred; schema's `paths[]` unused in this build).
- Figma/FigJam export or Mermaid emitter (future exploration).
- Experience rendering (separate skill), editing/round-tripping from the visual back to JSON.
