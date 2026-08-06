# Research Plan B: Unconstrained Schema Rethink (v2.0)

## Context

The Digital Service Design Standards (v1.1) were last actively developed in January 2026. This plan asks: **if we weren't constrained by backward compatibility, what would the schemas look like designed from scratch for the AI-agent era?** This is a clean-slate exploration — structural changes, new primitives, different mental models are all on the table. The goal is to produce a vision document that can be compared against the incremental Plan A approach.

## Constraint

**None.** Breaking changes are fine. Renamed fields are fine. Structural reorganisation is fine. New artifact types are fine. The only requirement is that the result must still serve service designers — it should be *better* for humans, not just for machines.

---

## Deliverables

1. A vision document describing the rethought schema architecture
2. Structural comparison with v1.1 (what changed, what was dropped, what's new)
3. Draft schema definitions for core artifact types
4. Example artifacts in the new format
5. An honest assessment of migration cost from v1.1

---

## Areas to Explore

### 1. Actor-First Architecture (replaces Persona/Role/Pairing split)

**Challenge with v1.1:** The Persona → Role → Pairing → Journey pipeline is elegant but creates a lot of artifacts. Many teams skip Pairings. The separation of "who you are" from "what you're doing" is powerful but the 3-artifact chain can feel bureaucratic.

**Radical alternative:** What if the core primitive was an **Actor** — a unified entity that can represent humans, AI agents, teams, or organisations? Instead of separate Persona + Role + Pairing schemas:
- An Actor has **traits** (enduring) and **contexts** (situational) as layers within a single artifact
- An Actor can be typed: `human`, `ai_agent`, `team`, `organisation`, `hybrid`
- Contexts are embedded, not separate files — but can be shared/referenced
- The "emergence" insights from Pairings become annotations on the Actor-in-Context rather than a separate artifact

**What this solves:** Eliminates the artifact proliferation problem. Makes AI agents first-class citizens. Reduces the learning curve. A team that only needs simple personas just uses an Actor with traits and no contexts.

**What this risks:** Loss of the clean separation that makes v1.1 compositionally powerful. Need to ensure the merged model doesn't become a blob.

---

### 2. Graph-Based Relationships (replaces flat references)

**Challenge with v1.1:** Artifacts reference each other by ID strings. There's no formal relationship model. Cross-artifact queries (e.g., "find all journeys where Sarah encounters technology barriers") require custom tooling.

**Radical alternative:** Design the schema as a **knowledge graph** from the ground up:
- Every artifact is a node with a typed ID and `@context` (JSON-LD native)
- Relationships are first-class: `influences`, `blocks`, `enables`, `hands_off_to`, `escalates_to`
- Barriers, emotions, and channels become **shared nodes** referenced across artifacts rather than embedded repeatedly
- A `relationships` array on every artifact declares typed edges to other nodes
- Enable SPARQL-like queries across the artifact set

**What this solves:** Cross-journey analysis becomes trivial. Barrier deduplication happens naturally. Portfolio-level insights emerge from graph traversal rather than custom aggregation code.

**What this risks:** Complexity. JSON-LD is powerful but unfamiliar to most service designers. Need excellent tooling to hide the graph layer.

---

### 3. Mission-Based Journeys (replaces linear phase→step model)

**Challenge with v1.1:** Journeys are linear sequences of phases containing steps. Real customer experiences branch, loop, restart, and adapt. The static model can't represent "the customer tried self-service, failed, called support, got escalated to a specialist, then completed online."

**Radical alternative:** Replace the linear journey with a **Mission** — a goal-oriented, graph-structured experience:
- A Mission has a `goal` (what success looks like) and `actors` (who's involved, including agents)
- Instead of phases → steps, use **nodes** connected by **edges** with conditions
- Nodes can be: `touchpoint`, `decision`, `handoff`, `wait`, `signal`, `branch`, `loop`
- Edges carry conditions: `{when: "sentiment < -1", goto: "escalation_node"}`
- Lanes still exist as data layers on nodes (emotions, barriers, channels)
- A `path` is one route through the graph — the linear journey is just one possible path
- Support `simulated_paths` — AI-generated traversals showing likely routes

**What this solves:** Represents real customer experiences accurately. Enables orchestration platform integration. Supports AI agent decision points natively. Path analysis becomes a first-class capability.

**What this risks:** Significantly harder to create and visualise than linear journeys. Need excellent rendering tooling. Risk of over-engineering for teams that just need a simple map.

---

### 4. Embedded Provenance & Trust Model

**Challenge with v1.1:** Validation is a single section at artifact level. In practice, different fields have different evidence levels — some from research, some from assumptions, some AI-generated.

**Radical alternative:** Make provenance **per-field** using a wrapper pattern:
```json
{
  "personalNeeds": {
    "$value": ["recognition", "autonomy"],
    "$source": "user_research",
    "$confidence": 0.85,
    "$evidence": "Interview batch 2024-Q3, n=12",
    "$generated_by": null
  }
}
```
- Every field can optionally carry `$source`, `$confidence`, `$evidence`, `$generated_by` metadata
- Plain values (without wrapper) are treated as human-created with inherited confidence
- Enables field-level trust scoring: "this persona is 90% research-backed, 10% AI-inferred"
- AI tools can target low-confidence fields for validation
- Aligns with W3C Design Tokens `$value` / `$extensions` convention

**What this solves:** Granular trust. AI-assisted creation with transparent provenance. Targeted research prioritisation. Regulatory compliance at field level.

**What this risks:** Verbose. Could make hand-editing JSON painful. Needs tooling that hides the wrapper for casual use.

---

### 5. Native Accessibility as a Design Dimension

**Challenge with v1.1:** Accessibility is not structurally represented. It lives implicitly in barriers and frustrations.

**Radical alternative:** Make accessibility a **cross-cutting dimension** rather than a field:
- Every touchpoint/node carries an `accessibility_profile` rating across dimensions: visual, auditory, motor, cognitive, emotional
- Personas carry `accessibility_identity` — not just "needs" but how accessibility shapes their entire experience
- Barriers gain a `wcag_outcomes` field linking to specific WCAG 3.0 outcome IDs
- Journey rendering automatically highlights accessibility gaps
- Support `inclusive_design_score` — automated scoring of how accessible a journey is for a given persona

**What this solves:** Makes accessibility impossible to ignore. Enables automated accessibility gap analysis. Aligns with WCAG 3.0's outcome-based model.

---

### 6. Multi-Modal Artifact Format

**Challenge with v1.1:** Everything is JSON. Rich context (photos, audio clips, video snippets, sketches) can only be referenced by URL.

**Radical alternative:** Support a **bundle format** alongside pure JSON:
- `.dsds` file = ZIP containing `manifest.json` + supporting files
- Images, audio, video, PDF research reports embedded directly
- `manifest.json` references embedded files by relative path
- Pure JSON remains valid (the bundle is optional)
- Import-helper skill can ingest bundles and extract structured data

**What this solves:** Self-contained artifacts. Research evidence travels with the persona. No broken links. Easier sharing between organisations.

---

### 7. Real-Time Event Schema

**Challenge with v1.1:** Journeys are design-time artifacts. There's no connection to runtime events.

**Radical alternative:** Add a **Journey Event** schema — a lightweight artifact capturing observed moments:
- `event_type`: touchpoint_completed, barrier_encountered, emotion_shift, handoff, abandonment
- `mission_ref`: which mission/journey this relates to
- `actor_ref`: which actor experienced it
- `timestamp`, `node_ref`, `lane_data`
- Events can be aggregated back into journey maps: "here's what actually happened vs. what we designed"
- Enables closing the design→measurement loop

**What this solves:** Connects design artifacts to operational reality. Enables evidence-based journey iteration. Feeds back into provenance ("this barrier was observed 47 times in production").

---

## Execution Steps

1. Read all current schemas and documentation in full
2. For each exploration area, research existing approaches and standards more deeply
3. Draft the Actor schema as the central test case — does the unified model work?
4. Draft a Mission schema — can it represent the existing Sarah clothes-shopping journey AND add branching?
5. Prototype the per-field provenance wrapper — is it usable?
6. Write the vision document comparing v1.1 structure to proposed v2.0 structure
7. Create one complete example in the new format (Actor + Mission) for comparison
8. Write honest migration cost assessment
9. Identify which v2.0 ideas could be back-ported to Plan A as optional features

## Verification

- Convert at least one existing v1.1 example set (Sarah Martinez: persona + role + pairing + journey) to v2.0 format
- Verify the new format captures everything the old one did, plus the new capabilities
- Test that the Mission format can represent both a simple linear journey AND a branching adaptive one
- Review with the question: "Would a service designer prefer this?"

---

## Key Sources

- BCG "Golden Era of CX" — missions replacing journeys
- Microsoft Dynamics 365 (April 2026) — connected experience model
- agents.json specification — structured AI agent contracts
- W3C Design Tokens 2025.10 — `$value`/`$extensions` wrapper convention
- JSON-LD and schema.org — linked data patterns
- MCP annotation model — self-describing artifacts
- WCAG 3.0 outcome-based model — accessibility dimensions
- Adobe Journey Optimizer — graph-based journey orchestration
- Persona Ecosystem Playground (arxiv March 2026) — AI-native persona generation
