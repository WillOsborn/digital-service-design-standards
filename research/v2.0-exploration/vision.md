# DSDS v2.0 Vision: Schema Architecture for the AI-Agent Era

## Executive Summary

This document proposes a rethought schema architecture for the Digital Service Design Standards (DSDS), designed from scratch for an era where AI agents are participants in service experiences, not just tools that help create artifacts. The proposal consolidates the v1.1 Persona → Role → Pairing → Journey pipeline into two core primitives — **Actor** and **Mission** — connected by a lightweight graph model with optional per-field provenance.

The goal is not change for its own sake. It's to solve real problems that v1.1's design creates: artifact proliferation, inability to represent branching experiences, no first-class support for AI agents, and no connection between design-time artifacts and runtime reality.

---

## Design Principles

1. **Fewer artifacts, more layers.** A service designer should be able to describe "Sarah shopping for clothes" without creating four separate JSON files.
2. **Graphs, not sequences.** Real experiences branch, loop, and adapt. The schema should represent what actually happens, not just the happy path.
3. **Agents are actors.** AI agents that participate in service experiences (chatbots, recommendation engines, automated triage) should be first-class citizens, not afterthoughts.
4. **Trust is granular.** Different parts of an artifact come from different sources with different confidence levels. The schema should make this visible without making it mandatory.
5. **Accessibility is structural.** It should be impossible to create a complete journey without considering accessibility — not as an add-on, but as a dimension of every touchpoint.
6. **Simple things stay simple.** A team that just needs a basic persona should be able to create one without understanding graphs or provenance. Complexity is opt-in.

---

## Core Architecture

### Three Primitives, One Graph

v2.0 has three core artifact types:

| Primitive | Replaces | Purpose |
|-----------|----------|---------|
| **Actor** | Persona + Role + Pairing | A unified entity (human, AI, team, org) with enduring traits and situational contexts |
| **Mission** | Service blueprint / journey structure | A persona-agnostic service graph — touchpoints, decisions, channels, structural barriers |
| **Experience** | Journey (persona-specific) | What happens when a specific Actor goes through a specific Mission — their thoughts, emotions, barriers |

The key separation: **Missions describe the service** (the map), **Experiences describe the person's journey through it** (the trip). This means one Mission can have many Experiences — Sarah's, David's, Maria's — each renderable as a linear journey for communication.

Artifacts connect to each other through **relationships** — typed edges (`influences`, `blocks`, `hands_off_to`, `participates_in`, `derived_from_mission`) that form a knowledge graph across the artifact set.

### The Actor Model

An Actor is a layered entity with three structural levels:

```
Actor
├── traits          (enduring — who they are regardless of situation)
│   ├── needs, frustrations, motivations
│   ├─��� technology comfort, communication preferences
│   ├── accessibility identity
│   └── behavioural patterns
├── contexts[]      (situational — what they're doing right now)
│   ├── context-specific needs and frustrations
│   ├── channels, details
│   └── moments that matter
└── emergence[]     (collision — what happens when traits meet context)
    ├── goals as experienced
    ├── pain points with "emergesFrom" explanations
    └── opportunities
```

**Key design decisions:**

- **Traits** = v1.1 Core Persona (enduring behavioural attributes)
- **Contexts** = v1.1 Role Cards (situational needs, frustrations, channels), embedded within the Actor rather than as separate files
- **Emergence** = v1.1 Pairing synthesis (goals, pain points, opportunities), referencing which context it relates to

This means a "simple persona" is just an Actor with traits and one context. The emergence section is optional but encouraged. A team that previously skipped Pairings can now skip the emergence section without creating incomplete artifacts.

**Actor types** (`human`, `ai_agent`, `team`, `organisation`, `hybrid`) make AI agents first-class. An AI chatbot Actor has traits (capabilities, limitations, personality) and contexts (customer support, sales, triage) just like a human Actor.

### The Mission Model

A Mission is a **persona-agnostic service graph** — it describes what the service offers, not how any specific person experiences it:

```
Mission
├── goal            (what success looks like)
├── scope           (trigger, completion, timeframe)
├── actors[]        (who can participate, referencing Actor IDs)
├── nodes[]         (service touchpoints, decisions, events)
│   ├── nodeType: touchpoint | decision | handoff | wait | signal | branch | loop | start | end
│   └── laneContent: description, channels, structural barriers, design opportunities, accessibility profile
├── edges[]         (connections between nodes)
│   ├── edgeType: default | conditional | error | timeout | escalation | loop_back
│   └── condition: { description, expression }
├── paths[]         (named service routes through the graph)
│   ├── pathType: designed | observed | simulated | failure | edge_case
│   └── frequency: what proportion of users take this path
└── phases[]        (optional visual grouping — rendering concern, not structural)
```

**Key design decisions:**

- **Missions describe the service, not the person.** Channels, structural barriers, and accessibility profiles live here. Thoughts, emotions, and persona-specific barriers live in Experience artifacts.
- **A linear journey is just one path.** The simplest Mission has nodes connected by default edges in sequence — functionally identical to v1.1's phase/step model, but with the ability to add branching later.
- **Decision nodes** make branching explicit. "Does it fit? → keep / return" is a first-class concept, not something inferred from separate journeys.
- **Paths are named service routes** through the graph. The "happy path", "return path", and "abandonment path" describe possible service routes with frequency data.
- **Phases are optional overlays.** They group nodes for visual rendering but don't constrain the graph structure.
- **Node types** include `handoff` (actor changes), `wait` (time passes), and `signal` (system event), which v1.1 couldn't represent cleanly.

### The Experience Model

An Experience is what happens when a specific Actor goes through a specific Mission:

```
Experience
├── references      (actorRef, contextRef, missionRef)
├── path            (which route through the mission this actor took)
│   └── nodeSequence: ordered list of mission node IDs
├── nodes[]         (persona-specific content for each node)
│   ├── nodeRef: which mission node this relates to
│   └── laneContent: actions, thoughts, emotions, persona-specific barriers, opportunities
├── outcome         (success, reflection, net sentiment, would repeat)
└── phases[]        (optional — can inherit from mission or define custom grouping)
```

**Key design decisions:**

- **Experiences reference, not duplicate.** The service structure (channels, touchpoints) comes from the Mission. The Experience adds the human layer.
- **Each Experience is renderable as a linear journey.** The path's `nodeSequence` produces a familiar swim-lane view for communication.
- **"Try a different persona"** means generating a new Experience from the same Mission + a different Actor. The Mission doesn't change.
- **Outcome captures resolution.** Did it work? Would they come back? This closes the measurement loop.

### Cross-Cutting Features

#### Per-Field Provenance

Any field in any artifact can optionally carry provenance metadata via a `$provenance` wrapper:

```json
{
  "frustration": "Feeling rushed and time-pressured in daily routines",
  "severity": 4,
  "$provenance": {
    "source": "user_research",
    "confidence": 0.9,
    "evidence": "Customer interviews March 2024, n=12"
  }
}
```

**Design decision:** Provenance is opt-in at field level. A plain value without `$provenance` inherits the artifact-level provenance. This means hand-edited JSON stays clean, while AI-generated or mixed-source artifacts can declare exactly which fields are research-backed and which are inferred. The `$` prefix follows the W3C Design Tokens convention and signals "this is metadata, not content."

#### Native Accessibility

Accessibility appears at two levels:

1. **Actor level:** `traits.accessibility` describes how accessibility shapes this actor's identity (not just "needs" but how they experience the world). Includes dimensions (visual, auditory, motor, cognitive, emotional, situational) with impact ratings.

2. **Node level:** `laneContent.accessibilityProfile` rates how accessible each touchpoint is across dimensions (1-5 scale). `barriers` can include `wcagOutcomes` linking to specific WCAG 3.0 outcome IDs.

This makes accessibility impossible to ignore in journey analysis — a touchpoint with a visual accessibility score of 2 is visibly flagged.

#### Graph Relationships

Every artifact carries a `relationships` array with typed edges to other artifacts:

```json
{
  "target": "mission-sarah-clothes-shopping",
  "type": "participates_in",
  "description": "Sarah is the primary actor in the clothes shopping mission"
}
```

Relationship types are specific to artifact type (Actors have `influences`, `hands_off_to`; Missions have `sub_mission_of`, `preceded_by`). This enables cross-artifact queries: "find all missions where actors with situational accessibility constraints encounter technology barriers."

---

## What Changed, What Was Dropped, What's New

### Structural Changes

| v1.1 | v2.0 | Change |
|------|------|--------|
| Core Persona (separate file) | Actor → traits | **Merged** into Actor as traits layer |
| Role Card (separate file) | Actor → contexts[] | **Merged** into Actor as embedded context |
| Pairing (separate file) | Actor → emergence[] | **Merged** into Actor as emergence layer |
| Journey (phase → step, persona-specific) | Experience (path through Mission, persona-specific) | **Separated** — service structure (Mission) split from persona experience (Experience) |
| — | Mission (persona-agnostic service graph) | **New** — universal service map that multiple personas can flow through |
| Pattern | Mission template (reusable sub-graph) | **Absorbed** — patterns become reusable Mission templates |
| schema_info (per artifact) | meta + $type + version | **Simplified** — less boilerplate, more semantic |
| validation (research_sources) | provenance (artifact + field level) | **Enhanced** — granular provenance replaces flat validation |

### What Was Dropped

- **Pairing as separate artifact** — emergence is now a section within Actor
- **schema_info.standard** — replaced by `$context` pointing to the schema namespace
- **schema_info.schema_type** — replaced by `$type` (more concise, JSON-LD compatible)
- **reviewMetadata** — subsumed by `meta.updated` and provenance; staleness detection should be tooling, not schema
- **extensions.legacy** — no backward compatibility concern in v2.0
- **Fixed channel enums** — channels are now free-text strings with optional `category` typing, allowing new channel types without schema changes

### What's New

- **Actor types** (human, ai_agent, team, organisation, hybrid)
- **Decision nodes** — branching is a first-class concept
- **Named paths** with frequency data
- **Per-field provenance** via `$provenance` wrapper
- **Accessibility as a structural dimension** (actor identity + touchpoint profile)
- **Typed relationships** forming a knowledge graph
- **Node types** (handoff, wait, signal, loop) for richer experience modelling
- **Edge conditions** for machine-readable branching logic
- **accessibilityProfile** per touchpoint (1-5 across 5 dimensions)
- **wcagOutcomes** on barriers linking to WCAG 3.0

---

## The "Would a Service Designer Prefer This?" Test

### What Gets Better

1. **Clearer separation of concerns.** Sarah Martinez goes from 4 files (persona + role + pairing + journey) to 3 files (actor + mission + experience). But the mission is reusable — when David Chen shops for clothes, only a new Experience is needed, not a new journey. For a portfolio of 5 personas through the same service, v1.1 needs 5 journeys; v2.0 needs 1 mission + 5 experiences.

2. **Branching journeys.** The "item fits → keep" vs "item doesn't fit → return" split is visible in a single Mission, not inferred from separate documents or invisible.

3. **Path frequency data.** "30% of customers take the return path" is data that lives alongside the journey, not in a separate analytics report.

4. **AI agents as participants.** When a chatbot is part of the service experience, it can be modelled as an Actor with its own traits and contexts, appearing as a node participant in Missions.

5. **Accessibility visibility.** A touchpoint with poor cognitive accessibility scores is visibly flagged, not hidden in barrier descriptions.

6. **Trust transparency.** "This frustration is research-backed (confidence 0.9)" vs "this opportunity was AI-generated (confidence 0.5)" is visible per field.

### What Gets Worse (Honestly)

1. **Actor files are larger.** A complete Actor with traits + context + emergence is roughly the size of persona + role + pairing combined. The file is bigger, even if there are fewer files.

2. **Graph thinking is harder.** Drawing a linear journey on a whiteboard is intuitive. Drawing a directed graph with conditional edges requires more cognitive effort. Teams need good rendering tools. However, Experiences can always be rendered as linear journeys for communication.

3. **Three artifact types instead of four.** The count drops from 4 (persona + role + pairing + journey) to 3 (actor + mission + experience), but it's a different 3. The Mission is a new concept (persona-agnostic service map) that teams need to learn.

4. **Context reuse needs design.** In v1.1, a Role Card can be paired with multiple Personas without duplication. In v2.0, contexts are embedded in Actors, so the "Working Mom Consumer" context would need to be duplicated across actors — OR referenced via a shared context library (not yet designed).

5. **Migration is non-trivial.** Existing v1.1 artifacts need structural transformation, not just field renaming. See Migration Cost Assessment below.

---

## Migration Cost Assessment

### Effort Categories

| Category | Effort | Description |
|----------|--------|-------------|
| **Schema changes** | High | New schemas, not updates. v1.1 schemas are incompatible. |
| **Artifact conversion** | Medium-High | Persona + Role + Pairing → Actor requires merging 3 files into 1. Journey → Mission requires restructuring phases/steps into nodes/edges. |
| **Tooling** | High | Validators, renderers, import/export, CLI tools all need rewriting for the new structure. |
| **Skills/agents** | Medium | Skills like journey-builder, persona-builder need redesign for the new primitives. |
| **Documentation** | Medium | Guides, tutorials, and reference docs need rewriting. |
| **User retraining** | Low-Medium | The concepts are familiar (personas, journeys) but the structure is different. |

### Conversion Path

A mechanical converter could handle ~70% of the transformation:

1. **Persona → Actor traits**: Direct field mapping (personalNeeds → traits.needs, etc.)
2. **Role Card → Actor context**: Direct field mapping (roleBasedNeeds → contexts[].needs, etc.)
3. **Pairing synthesis → Actor emergence**: Direct mapping (goalsAsExperienced, painPoints, barriers)
4. **Journey phases/steps → Mission nodes**: Each step becomes a node, each phase→step transition becomes a default edge
5. **Manual work**: Decision nodes, conditional edges, path definitions, and accessibility profiles require human judgement

### Estimated Conversion Time Per Artifact Set

- Persona + Role + Pairing → Actor: ~30 minutes (mostly automated, ~10 min manual review)
- Journey → Mission (linear only): ~15 minutes (fully automated, review recommended)
- Journey → Mission (with branching): ~1-2 hours (automated base + manual decision/path modelling)

---

## Ideas That Could Be Back-Ported to Plan A (v1.2)

Several v2.0 innovations are independently valuable and could be added to v1.1 without breaking changes:

| v2.0 Feature | Plan A Back-Port | Breaking? |
|--------------|------------------|-----------|
| Per-field `$provenance` | Add optional `$provenance` to any field | No — additive |
| Accessibility dimensions on actors | Add `accessibility` to behavioural_attributes | No — additive |
| Accessibility profile on journey steps | Add `accessibilityProfile` to lane_content | No — additive |
| wcagOutcomes on barriers | Add optional field to barrier objects | No — additive |
| Graph relationships array | Add `relationships[]` to all artifacts | No — additive |
| Actor types | Not applicable (requires unified Actor) | N/A |
| Mission graph model | Not applicable (requires structural change) | N/A |
| Named paths with frequency | Not applicable (requires graph model) | N/A |

**Recommendation:** Back-port provenance, accessibility, and relationships to v1.2 regardless of whether v2.0 is adopted. These are independently valuable.

---

## Research Validation

The proposed architecture was cross-referenced against external standards and approaches:

| Source | Finding | Impact on v2.0 |
|--------|---------|-----------------|
| **BCG Missions model** | Missions are goal-oriented units with unordered "moments" and preconditions, measured by completion rate and effort score | Validates our Mission structure. Confirms nodes should have preconditions (edges), not fixed sequence positions |
| **Adobe Journey Optimizer** | Graph-based DAG with typed nodes (Event, Action, Condition, Wait, End) and typed edges (default, condition, timeout, error) | Our `nodeType` and `edgeType` enums are closely aligned. AJO separates journey template from profile traversal — our paths model serves a similar purpose |
| **JSON-LD / schema.org** | `@id`/`@type`/`@context` pattern for graph interoperability. `schema:Action` has agent/object/result/instrument fields | Our `$context`/`$type`/`id` pattern follows this convention. Relationship arrays enable graph traversal |
| **W3C Design Tokens** | `$value`/`$extensions` wrapper with `$`-prefixed reserved keys at token object level | Validates our `$provenance` wrapper convention — same structural idiom |
| **WCAG 3.0** | Scored dimensions (0-4) replacing binary pass/fail. Guidelines → Outcomes → Methods → Assertions hierarchy | Our 1-5 `accessibilityProfile` ratings per touchpoint follow the same principle. Could adopt 0-4 scale for closer alignment |
| **MCP annotations** | Co-located, prefixed metadata siblings (`annotations`, `_meta`) on tool definitions and output blocks | Confirms the "value + metadata sibling" pattern. Our `$` prefix (matching Design Tokens) is preferable to `_` prefix |
| **Dynamics 365 Customer Insights** | Unified profiles with identity core + semantic type ontology + cluster relationships. Activities as separate related tables, not embedded | Validates Actor/Mission separation: "profile is the noun, activities are verbs." Source provenance per field via winner policies |
| **LLM persona research** | Flat identity + traits + context slot structure for agent-consumable personas | Our nested schema is richer (appropriate for service design) but the flat extraction path for AI consumption should be straightforward |

No changes to the schemas were required based on research findings — the architecture was validated rather than corrected.

---

## Format Recommendation: YAML Authoring, JSON Exchange

An evaluation of 6 alternative formats (YAML, JSON-LD, RDF/Turtle, CUE, MDX/Markdown+frontmatter, multi-format) concluded that **JSON remains the right exchange format** but is not the ideal authoring format for narrative-heavy service design artifacts.

**Recommendation:** Adopt YAML as the human-editable authoring format, with JSON as the canonical exchange format for machines.

- Service designers write and edit `.yaml` files — multiline block scalars (`>`, `|`) make narrative fields (thoughts, emotions, descriptions) significantly more readable and editable
- A simple build step (`js-yaml`) produces `.json` for AI agents, validators, the Figma plugin, and any machine consumers
- JSON Schema definitions remain unchanged — `ajv` validates YAML directly, and VS Code's yaml-language-server provides schema-driven autocomplete
- Git stores both formats, with YAML as the source of truth
- Adopt `@context`/`@type`/`@id` naming (JSON-LD conventions) as a forward-compatible gesture for future graph interoperability, without requiring a JSON-LD processor in the toolchain

**Why this matters:** Experience artifacts are narrative-heavy — every node carries thoughts, emotions, and descriptions. In JSON, these require escaped quotes and single-line strings. In YAML, they read naturally as prose. This is a tooling decision, not a schema decision — the schemas work identically regardless of instance format.

**Formats evaluated and rejected:**
- *Full JSON-LD:* `$provenance` has no JSON-LD equivalent; tooling cost too high for the current use case. Worth revisiting if graph querying requirements grow.
- *RDF/Turtle:* Graph-native but completely unsuitable for human editing of narrative content.
- *CUE:* Go-centric, no multiline narrative support, tiny ecosystem.
- *MDX/Markdown+frontmatter:* Compelling for light artifacts but breaks down for deeply nested structures like Experiences with 24 nodes.

---

## Open Questions

1. **Shared context library.** Should contexts be referenceable across Actors (solving the reuse problem), or is embedding simpler even with some duplication?

2. **Event schema.** The plan proposed a JourneyEvent schema for runtime data. This is valuable but orthogonal to the core architecture — it could be added as a v2.1 concern without affecting Actor/Mission design.

3. **Bundle format.** The `.dsds` ZIP bundle proposal is packaging, not schema. It could apply to either v1.1 or v2.0 artifacts.

4. **Pattern replacement.** Patterns in v1.1 are reusable journey fragments with variations. In v2.0, these become Mission templates or sub-missions. The variation mechanism (persona attribute conditions → step modifications) needs redesign for the Actor/Mission model.

5. **Tooling minimum viable set.** What's the minimum tooling needed before v2.0 artifacts are usable? At minimum: validator, renderer (graph visualisation), and converter (v1.1 → v2.0).
