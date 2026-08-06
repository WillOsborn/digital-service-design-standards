# Research Plan A: Backward-Compatible Schema Improvements

## Context

The Digital Service Design Standards (v1.1) were last actively developed in January 2026. The AI industry has moved rapidly since — agentic AI is mainstream, EU AI Act transparency obligations land August 2026, WCAG 3.0 expands cognitive accessibility, and journey orchestration platforms treat journeys as adaptive systems. This plan identifies improvements that **retain full backward compatibility with v1.1** — existing artifacts remain valid without modification.

## Constraint

**All changes must be additive.** No existing required fields change. No field renames. No structural reorganisation. New fields are optional. Existing validators continue to pass all current artifacts. This targets a **v1.2 release**.

---

## Deliverables

1. A recommendations document with rationale and sources for each improvement
2. Draft schema snippets showing how new fields integrate with existing structure
3. Backward compatibility analysis confirming no breaking changes
4. Updated backlog entries (one per improvement area)
5. A migration guide (v1.1 → v1.2) — should be trivial given additive-only changes

---

## Improvement Areas

### 1. AI Provenance & Generation Metadata (HIGH — regulatory deadline Aug 2026)

**Why:** EU AI Act requires machine-readable provenance for AI-generated content. Teams increasingly use AI to create personas and journeys.

**Approach:** Add optional `provenance` object alongside existing `validation` section on all artifacts:
- `generation_method`: enum (human_created, ai_assisted, ai_generated, mixed)
- `ai_tools_used`: array of strings
- `human_reviewed`: boolean
- `human_reviewed_date`: ISO date
- `data_sources_consent`: boolean

**Compatibility:** Purely additive. Existing artifacts without `provenance` remain valid.

**Files:** All 4 schema files, standards docs, examples (add provenance to at least one example per type)

---

### 2. Privacy & Data Governance Metadata (HIGH — regulatory)

**Why:** GDPR Digital Omnibus (Nov 2025) addresses AI processing of special category data. Enterprise adopters in regulated industries need governance fields.

**Approach:** Add optional `data_governance` object on all artifacts:
- `data_classification`: enum (public, internal, confidential, restricted)
- `contains_pii`: boolean
- `anonymisation_method`: enum (fictional_composite, k_anonymity, aggregated, none)
- `retention_policy`: string
- `legal_basis`: string

**Compatibility:** Purely additive. Small teams ignore it; enterprise teams opt in.

**Files:** All 4 schema files, new governance guidance doc

---

### 3. AI Agent Representation in Journeys (HIGH — industry shift)

**Why:** 56% of support interactions will use agentic AI by mid-2026. Journeys need to represent agent actors alongside humans. Elevates existing BACK-003.

**Approach — additive only:**
- Journey context gains optional `agents` array: {id, name, type, capabilities, constraints, autonomy_level}
- Journey steps gain optional `actor`: enum (human, ai_agent, hybrid, system)
- Journey steps gain optional `handoff`: {from, to, trigger, fallback}
- Channel lane content gains optional `operated_by`: enum (human, ai_agent, hybrid)

**Compatibility:** Existing journeys without agent fields remain valid. New fields are all optional.

**Files:** `journey-schema.json`, journey standard doc, at least one example journey updated

---

### 4. Expanded Accessibility & Cognitive Load (MEDIUM)

**Why:** WCAG 3.0 (174 new outcomes) expands cognitive disability coverage. Current schema has `technologyComfort` but no structured accessibility model.

**Approach:**
- Core Persona gains optional `accessibilityNeeds`: {physical[], cognitive[], sensory[], assistive_technologies[]}
- Journey steps gain optional `cognitive_load`: {decision_complexity, information_density, time_pressure}

**Compatibility:** Purely additive optional fields.

**Files:** `core-persona.schema.json`, `journey-schema.json`, persona standard doc

---

### 5. Adaptive Journey Primitives (MEDIUM)

**Why:** Industry moving from static maps to signal-driven, branching journeys.

**Approach:**
- Journey gains optional `journey_type`: enum (static, adaptive, orchestrated)
- Steps gain optional `decision_point`: {condition, branches[]}
- Journey gains optional `signals`: [{id, name, type, source}]
- Steps gain optional `sla`: {target_duration_ms, escalation}

**Compatibility:** Existing static journeys remain valid. `journey_type` defaults to `static` implicitly.

**Files:** `journey-schema.json`, journey standard doc

---

### 6. MCP-Compatible Annotations (MEDIUM)

**Why:** MCP is industry-standard (97M+ monthly SDK downloads). Annotations make artifacts self-describing for AI tools.

**Approach:**
- All artifacts gain optional `annotations`: {audience[], usage_hints, related_artifacts[]}

**Compatibility:** Purely additive.

**Files:** All 4 schema files

---

### 7. Structured Emotion Model (LOW)

**Why:** Dimensional models (valence-arousal) enable machine-comparable emotional analysis.

**Approach:**
- Emotion lane content gains optional `model` field: simple (current) | dimensional | categorical
- For dimensional: valence, arousal values
- Current -2 to +2 scale remains the default (`simple`)

**Compatibility:** Fully backward compatible. Current emotion data maps to `simple` model.

**Files:** `journey-schema.json`

---

### 8. JSON-LD Context (LOW — strategic positioning)

**Why:** No UX research interchange standard exists. JSON-LD `@context` is backward-compatible.

**Approach:**
- Optional `@context` field on all artifacts
- Optional `sameAs` on identity objects
- Document recommended file extensions (`.persona.json`, `.journey.json`)

**Compatibility:** `@context` is ignored by standard JSON parsers. Fully backward compatible.

**Files:** All 4 schema files, new interoperability guide

---

## Execution Steps

1. Read all 4 current schema files in full to understand exact field structures
2. For each improvement area, draft the schema additions as JSON Schema snippets
3. Write the recommendations document with rationale, sources, and examples
4. Validate that all existing examples still pass with the updated schemas
5. Create backlog entries for each area
6. Write a lightweight v1.1 → v1.2 migration guide

## Verification

- Run `node tools/validators/validate-v1.1.js` against all existing examples — must pass unchanged
- Manually verify new optional fields work with at least one example per artifact type
- Review schema additions against JSON Schema 2020-12 best practices

---

## Key Sources

- EU AI Act Code of Practice (Dec 2025) — provenance requirements
- GDPR Digital Omnibus Package (Nov 2025) — AI data processing
- WCAG 3.0 Working Draft (Sept 2025) — 174 new outcomes, cognitive accessibility
- MCP Specification 2025-11-25 — annotation patterns
- BCG "Golden Era of CX" (2025) — agentic service delivery
- W3C Design Tokens Spec 2025.10 — interoperability conventions
- Onyx emotion ontology — structured emotion representation
