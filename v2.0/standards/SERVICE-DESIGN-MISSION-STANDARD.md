# Service Design Mission Standard

> **v2.0** — Replaces the v1.1 linear phase-step Journey with a directed graph of nodes, edges, and paths.

A **Mission** is the persona-agnostic map of a service — what the service does, how it's structured, and where it succeeds or fails. Missions describe the service; Experiences describe someone's journey through it. One Mission supports many Experiences from different Actors.

---

## Contents

1. [What is a Mission?](#1-what-is-a-mission)
2. [The Graph Model](#2-the-graph-model)
3. [The Lane System](#3-the-lane-system)
4. [Required Fields](#4-required-fields)
5. [Field Reference](#5-field-reference)
6. [Node Types](#6-node-types)
7. [Edge Types](#7-edge-types)
8. [Paths](#8-paths)
9. [Phases](#9-phases)
10. [Provenance, Governance, Relationships](#10-provenance-governance-relationships)
11. [Quality Rubric](#11-quality-rubric)
12. [Tooling](#12-tooling)
13. [Example Skeleton](#13-example-skeleton)

---

## 1. What is a Mission?

A Mission is a service graph — a structured representation of the service from the service provider's point of view. It contains:

- **Nodes** — the touchpoints, decisions, and events that make up the service
- **Edges** — the connections and transitions between them
- **Lanes** — the data layers tracked at each node (channels, barriers, service blueprint)
- **Paths** — named routes through the graph (happy path, abandonment, error)
- **Phases** — optional groupings of nodes for visual organisation

The key design principle: **Missions contain no persona-specific content.** Thoughts, emotions, and persona-specific barriers belong in Experience artifacts. This separation means one Mission can be reused across dozens of Experiences — for different personas, different research rounds, different time periods.

A Mission file lives at:
```
v2.0/examples/<domain>/mission-<name>.json
```

ID format: `mission-<lowercase-hyphenated-name>` (e.g., `mission-online-clothes-shopping`)

---

## 2. The Graph Model

Where v1.1 journeys were linear sequences of steps within phases, v2.0 Missions are directed graphs. A linear journey is simply one path through a graph with no branches.

```
          start
            │
     ┌──────▼──────┐
     │  touchpoint  │
     └──────┬───────┘
            │
     ┌──────▼───────┐         ┌────────────┐
     │   decision   │──yes──→ │ touchpoint │
     └──────┬───────┘         └──────┬─────┘
         no │                        │
     ┌──────▼───────┐                │
     │  touchpoint  │←───────────────┘
     └──────┬───────┘
            │
          end
```

This enables modelling:
- **Branching** — different paths for different decisions
- **Loops** — retry flows, return journeys
- **Errors and timeouts** — what happens when things go wrong
- **Multi-actor orchestration** — handoffs between actors

---

## 3. The Lane System

Lanes are the data layers that the Mission tracks at each node. They are declared once at the top level and populated per-node in `laneContent`.

### Core typed lanes

These have schema-validated structure:

| Lane ID | Type | What it captures |
|---------|------|-----------------|
| *(implicit)* `description` | text | What happens at this touchpoint from the service perspective |
| `channels` | channel | Which channels are available at this touchpoint (digital, telecom, physical) |
| `barriers` | barrier | Structural barriers inherent to this touchpoint (not persona-specific) |
| `accessibility` | accessibility | Touchpoint accessibility profile across visual/auditory/motor/cognitive/emotional |

Each channel entry is `{ channel, category?, serviceModel, interaction?, name?, usageContext?, ownership? }`.
**`channel` takes a channel *type*** in lower `snake_case` — `website`, `app`, `email`, `chat`,
`social_media`, `messaging_app`, `push_notification`, `phone`, `sms`, `video_call`, `in_person`,
`post`, `print`. It is a free string, so a product or meeting name will validate and then quietly
fragment every channel-mix and cost-to-serve analysis. Put the specific instance in `name`:
`{ "channel": "in_person", "name": "Board or Executive Committee meeting" }`, not
`{ "channel": "board-meeting" }`. Two entries on one node may share a type and differ only by
`name` — that is correct, not a duplicate.
See [CHANNEL_TAXONOMY.md](../../documentation/CHANNEL_TAXONOMY.md) for the full taxonomy,
including how `category` follows cost to serve rather than which team owns the technology.

### Extended lanes

These use simple types and are declared explicitly. Common patterns:

| Lane ID | Type | What it captures |
|---------|------|-----------------|
| `frontstage` | text | What the user sees and interacts with |
| `backstage` | text | What happens behind the scenes |
| `support-systems` | list | Systems and platforms involved |
| `data-required` | list | Data required or exchanged at this step |
| `roles-involved` | list | Staff roles involved |
| `kpis` | metric | Key performance indicators |
| `design-opps` | list | Design improvement opportunities |

**Lane ID naming rules:** IDs must match `^[a-z][a-z0-9_-]*$` — use hyphens, not camelCase. Use `need-at-step`, not `needAtStep`.

**Extended lane types:**
- `text` → `laneContent[id]` must be a string
- `list` → `laneContent[id]` must be an array of strings
- `metric` → `laneContent[id]` must be an array of `{ metric, target }` objects

### Scope

Each lane has a `scope` that tells tools where to populate it:
- `service` — belongs on Mission nodes
- `persona` — belongs on Experience nodes
- `both` — can appear on either

---

## 4. Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `$type` | Yes | Must be `"Mission"` |
| `id` | Yes | Pattern: `mission-[a-z0-9_-]+` |
| `version` | Yes | Pattern: `2.0.X` |
| `title` | Yes | |
| `goal` | Yes | What success looks like for this mission |
| `actors` | Yes | Min 1 actor reference |
| `actors[].actorRef` | Yes | |
| `nodes` | Yes | Min 1 node |
| `nodes[].nodeId` | Yes | Pattern: `[a-z][a-z0-9_-]*` |
| `nodes[].name` | Yes | |
| `nodes[].nodeType` | Yes | See node types |
| `edges` | Yes | Min 1 edge |
| `edges[].from` | Yes | |
| `edges[].to` | Yes | |
| `meta` | Yes | Must include `updated` |

---

## 5. Field Reference

### Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `$context` | string | Always `"https://schemas.digitalservice.design/v2.0"` |
| `$type` | string | Always `"Mission"` |
| `id` | string | Unique identifier |
| `version` | string | Schema version (e.g., `"2.0.0"`) |
| `title` | string | Human-readable title (max 200 chars) |
| `goal` | string | What success looks like (max 500 chars) |
| `summary` | string | Narrative overview (max 1000 chars) |

### scope

```json
"scope": {
  "trigger": "Actor encounters a problem with their energy bill",
  "completion": "New energy supplier confirmed and switch initiated",
  "timeframe": "4-6 weeks",
  "asIs": true,
  "successCriteria": [
    { "metric": "Switch completed without error", "target": "100%" },
    { "metric": "Actor receives confirmation within 24 hours", "target": "≥ 95%" }
  ]
}
```

### actors

References to Actor artifacts. The `role` field describes what the actor does in this mission.

```json
"actors": [
  {
    "actorRef": "actor-jake-holloway",
    "contextRef": "ctx-shared-house-energy-switcher",
    "role": "primary"
  }
]
```

### lanes

Declares which data layers this mission tracks. Nodes populate these by ID.

```json
"lanes": [
  { "id": "channels", "label": "Channels", "type": "channel", "scope": "service" },
  { "id": "barriers", "label": "Barriers", "type": "barrier", "scope": "service" },
  { "id": "frontstage", "label": "Frontstage", "type": "text", "scope": "service" },
  { "id": "backstage", "label": "Backstage", "type": "text", "scope": "service" },
  { "id": "support-systems", "label": "Support Systems", "type": "list", "scope": "service" },
  { "id": "kpis", "label": "KPIs", "type": "metric", "scope": "service" }
]
```

### nodes[n]

| Field | Type | Description |
|-------|------|-------------|
| `nodeId` | string | Pattern: `[a-z][a-z0-9_-]*` (e.g., `browse-products`, `confirm-order`) |
| `name` | string | Human-readable label |
| `nodeType` | enum | See [Node Types](#6-node-types) |
| `actorRef` | string | Primary actor at this node (for multi-actor missions) |
| `duration` | string | Human-readable duration (e.g., `"5 seconds"`, `"2-4 days"`) |
| `durationMs` | integer | Machine-readable duration in milliseconds |
| `laneContent` | object | Service-level data. Contains `description`, core lanes, and any declared extended lanes. |
| `significance` | object | `{ description, importance }` — why this node matters from a design perspective |
| `sla` | object | `{ targetDuration, targetDurationMs, escalation }` |

**Node ID naming:** Use hyphen-separated lowercase. `browse-products`, `submit-application`, `confirm-switch`. Not camelCase.

### edges[n]

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Source node ID |
| `to` | string | Target node ID |
| `edgeType` | enum | See [Edge Types](#7-edge-types). Defaults to `"default"` if omitted. |
| `label` | string | Short label shown in visualisations |
| `condition` | object | `{ description, expression? }` — when this edge is taken |

---

## 6. Node Types

| Type | Shape | Use for |
|------|-------|---------|
| `start` | Filled circle | Entry point of the mission. Usually one per path but multiple are valid for multi-entry services. |
| `end` | Double circle | Exit point. Every path must terminate at an end node. Model separate end nodes for success (`end-success`) and failure (`end-abandoned`). |
| `touchpoint` | Rounded rectangle | The main interaction type. Actor actively does something with the service. |
| `decision` | Diamond | Service or actor must make a choice. Outgoing edges should have conditions. |
| `handoff` | Hexagon | Responsibility passes to a different actor or system. |
| `wait` | Dashed rectangle | Processing time, waiting period, or asynchronous step. Use `duration` or `sla` to capture timeframes. |
| `signal` | Circle | A notification, status update, or event that the actor receives. |
| `branch` | Small diamond | Routing node for multi-path splits. Lighter weight than `decision` when no explicit choice is made. |
| `loop_start` | Right-arrow rectangle | Marks the start of a loop structure. |
| `loop_end` | Return arrow | Marks the exit condition of a loop structure. |

### Common patterns

**Happy path entry/exit:**
```
start → touchpoint → touchpoint → decision → touchpoint → end-success
```

**Error handling:**
```
decision → touchpoint ─[timeout]→ end-abandoned
                     ─[error]──→ end-error
```

**Loop:**
```
loop_start → touchpoint → decision ─[retry]→ loop_start
                                  ─[done]──→ end-success
```

---

## 7. Edge Types

| `edgeType` | Use for |
|-----------|---------|
| `default` | Normal sequential flow. Used for most connections. |
| `conditional` | Branching — only taken when a condition is met. Add a `condition` object. |
| `error` | Error paths — what happens when something fails. |
| `timeout` | Timeout paths — what happens when time runs out. |
| `escalation` | Escalation to a higher-level actor or process. |
| `loop_back` | Looping back to an earlier node. Use with `loop_start`/`loop_end` nodes. |

**Important:** The validator accepts these six values only. Do not use `"sequential"`, `"loop"`, or custom values.

---

## 8. Paths

Paths are named routes through the graph. They describe how actors move through the Mission — not individual actor experiences (those belong in Experience artifacts).

```json
"paths": [
  {
    "pathId": "path-happy",
    "name": "Happy Path",
    "description": "Actor successfully completes the full process",
    "pathType": "designed",
    "nodeSequence": ["start", "step-1", "step-2", "decision-1", "step-3", "end-success"],
    "frequency": 0.65,
    "averageDuration": "8 minutes"
  },
  {
    "pathId": "path-abandon",
    "name": "Abandonment",
    "description": "Actor exits without completing",
    "pathType": "observed",
    "nodeSequence": ["start", "step-1", "step-2", "end-abandoned"],
    "frequency": 0.25
  }
]
```

**`pathType` values:** `designed` | `observed` | `simulated` | `failure` | `edge_case`

**`frequency`** is a proportion from 0–1. Paths can overlap (an actor can abandon and also be on the happy path up to that point), so frequencies do not need to sum to 1.0.

---

## 9. Phases

Phases group nodes for visual organisation. They are a rendering concern, not a structural constraint — they don't limit which edges can connect across them.

```json
"phases": [
  {
    "phaseId": "phase-discovery",
    "name": "Discovery",
    "goal": "Actor finds the service and understands their options",
    "nodeRefs": ["start", "browse-products", "filter-search"]
  },
  {
    "phaseId": "phase-decision",
    "name": "Decision",
    "goal": "Actor selects a product",
    "nodeRefs": ["view-product", "compare-products", "add-to-basket"]
  }
]
```

Phase IDs must match `^phase-[a-z0-9_-]+$`.

---

## 10. Provenance, Governance, Relationships

These follow the same structure as Actor. See [Actor Standard — Provenance](SERVICE-DESIGN-ACTOR-STANDARD.md#5-provenance) for the full field reference.

**Mission relationship types:**
`involves_actor` | `preceded_by` | `followed_by` | `alternative_to` | `sub_mission_of` | `parent_of` | `pattern_instance` | `measured_by`

---

## 11. Quality Rubric

The validator scores Missions 0–100.

| Criterion | Points | What it checks |
|-----------|--------|----------------|
| Required fields | 20 | All required fields populated |
| Node count and variety | 15 | ≥ 5 nodes, at least 2 node types |
| Edge connectivity | 15 | All nodes reachable from start; no orphan nodes |
| Lanes declared and populated | 15 | ≥ 2 lanes declared; nodes have laneContent |
| Service blueprint depth | 15 | frontstage, backstage, support-systems populated on ≥ 3 nodes |
| Paths defined with frequency | 10 | At least 2 paths with frequency values |
| SLA on key nodes | 10 | At least 1 node has a `sla` object |
| **Total** | **100** | |

Run: `node tools/validators/validate-v2.0.js v2.0/examples/<domain>/mission-<name>.json`

---

## 12. Tooling

| Tool | Purpose |
|------|---------|
| `mission-builder` skill | Interactive 7-phase Mission creation |
| `mission-renderer` skill | Renders Mission as an interactive SVG graph |
| `validate-v2.0.js` | Schema validation + quality scoring |
| `convert-v1.1-to-v2.0.js` | Converts v1.1 Journey to Mission + Experience |

To create a new Mission:
1. `/mission-builder` — interactive process starting with scope, phases, then nodes
2. Or: `node tools/converters/convert-v1.1-to-v2.0.js --journey ...` (produces a Mission + Experience skeleton requiring human design work)

---

## 13. Example Skeleton

```json
{
  "$context": "https://schemas.digitalservice.design/v2.0",
  "$type": "Mission",
  "id": "mission-apply-for-benefit",
  "version": "2.0.0",
  "title": "Apply for Housing Benefit",
  "goal": "Citizen successfully submits a Housing Benefit application and receives a decision",
  "summary": "A citizen initiates and completes a Housing Benefit application through the council's online portal.",

  "scope": {
    "trigger": "Citizen receives a change of circumstances affecting their housing costs",
    "completion": "Application submitted and decision letter received",
    "timeframe": "1-4 weeks",
    "asIs": true
  },

  "actors": [
    { "actorRef": "actor-alex-thompson", "contextRef": "ctx-benefit-claimant", "role": "primary" }
  ],

  "lanes": [
    { "id": "channels", "label": "Channels", "type": "channel", "scope": "service" },
    { "id": "barriers", "label": "Barriers", "type": "barrier", "scope": "service" },
    { "id": "frontstage", "label": "Frontstage", "type": "text", "scope": "service" },
    { "id": "backstage", "label": "Backstage", "type": "text", "scope": "service" },
    { "id": "support-systems", "label": "Support Systems", "type": "list", "scope": "service" }
  ],

  "nodes": [
    {
      "nodeId": "start",
      "name": "Start",
      "nodeType": "start"
    },
    {
      "nodeId": "access-portal",
      "name": "Access Online Portal",
      "nodeType": "touchpoint",
      "laneContent": {
        "description": "Citizen navigates to the council benefit portal",
        "channels": [
          { "channel": "website", "category": "digital", "serviceModel": "self_service", "name": "Council benefit portal" }
        ],
        "frontstage": "Council benefits homepage with 'Start a new application' button",
        "backstage": "Portal authentication service, eligibility pre-check"
      },
      "sla": { "targetDuration": "< 2 minutes" }
    },
    {
      "nodeId": "eligibility-check",
      "name": "Eligibility Check",
      "nodeType": "decision",
      "laneContent": {
        "description": "System checks basic eligibility criteria before allowing full application",
        "barriers": [
          { "type": "knowledge", "description": "Eligibility criteria not clearly explained before the check", "severity": 3 }
        ]
      }
    },
    {
      "nodeId": "end-success",
      "name": "Application Submitted",
      "nodeType": "end"
    },
    {
      "nodeId": "end-ineligible",
      "name": "Not Eligible",
      "nodeType": "end"
    }
  ],

  "edges": [
    { "from": "start", "to": "access-portal", "edgeType": "default" },
    { "from": "access-portal", "to": "eligibility-check", "edgeType": "default" },
    {
      "from": "eligibility-check",
      "to": "end-success",
      "edgeType": "conditional",
      "label": "Eligible",
      "condition": { "description": "Citizen meets basic eligibility criteria" }
    },
    {
      "from": "eligibility-check",
      "to": "end-ineligible",
      "edgeType": "conditional",
      "label": "Not eligible",
      "condition": { "description": "Citizen does not meet basic criteria" }
    }
  ],

  "paths": [
    {
      "pathId": "path-happy",
      "name": "Successful Application",
      "pathType": "designed",
      "nodeSequence": ["start", "access-portal", "eligibility-check", "end-success"],
      "frequency": 0.72
    },
    {
      "pathId": "path-ineligible",
      "name": "Ineligible",
      "pathType": "designed",
      "nodeSequence": ["start", "access-portal", "eligibility-check", "end-ineligible"],
      "frequency": 0.18
    }
  ],

  "phases": [
    {
      "phaseId": "phase-access",
      "name": "Access",
      "goal": "Citizen reaches and enters the application",
      "nodeRefs": ["start", "access-portal", "eligibility-check"]
    }
  ],

  "provenance": {
    "generationMethod": "ai_assisted",
    "source": "user_research",
    "humanReviewed": true
  },

  "governance": {
    "dataClassification": "internal",
    "containsPii": false
  },

  "meta": {
    "created": "2025-11-01",
    "updated": "2025-11-01",
    "createdBy": "Design Team",
    "tags": ["government", "benefits", "example"]
  }
}
```

---

## See also

- [Actor Standard](SERVICE-DESIGN-ACTOR-STANDARD.md) — the participants who traverse this Mission
- [Experience Standard](SERVICE-DESIGN-EXPERIENCE-STANDARD.md) — the persona-specific view through this Mission
- [Migration Guide](../migration-guide.md) — converting v1.1 Journey to Mission
- Schema: [v2.0/schemas/mission.schema.json](../schemas/mission.schema.json)
- Examples: [v2.0/examples/](../examples/)
