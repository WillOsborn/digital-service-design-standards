# Migration Guide: v1.1 → v2.0

> **v2.0 is a ground-up redesign**, not a backward-compatible extension. v1.1 artifacts require conversion. This guide explains what changed, how to convert, and — critically — what mechanical conversion cannot do.

---

## The Short Version

v2.0 replaces the four-artifact pipeline (Persona + Role + Pairing + Journey) with three primitives (Actor + Mission + Experience). Structural conversion is automated. Design thinking is not.

| v1.1 | v2.0 | Notes |
|------|------|-------|
| Persona | Actor (traits layer) | Persona fields → `traits` |
| Role | Actor (contexts layer) | Role fields → `contexts[]` |
| Pairing | Actor (emergence layer) | Pairing synthesis → `emergence[]` |
| Journey | Mission + Experience | Service content → Mission, persona content → Experience |

**What the converter does:** Mechanically restructures fields, translates enums, and flags sections needing review.
**What the converter cannot do:** Write `needAtStep`, `painAtStep`, add decision nodes, define alternative paths, or populate service blueprint lanes. These require design thinking.

**Time estimate:**
- Actor conversion (automated): 5 minutes per set
- Actor review and enrichment: 30–60 minutes
- Mission creation (interactive builder or from journey): 1–3 hours
- Experience creation (interactive generator): 1–2 hours

---

## Contents

1. [Why v2.0?](#1-why-v20)
2. [What Changed](#2-what-changed)
3. [Using the Converter Tool](#3-using-the-converter-tool)
4. [Field Mapping Reference](#4-field-mapping-reference)
5. [What Requires Human Work](#5-what-requires-human-work)
6. [Step-by-Step Conversion Process](#6-step-by-step-conversion-process)
7. [Coexistence: Running v1.1 and v2.0 Together](#7-coexistence-running-v11-and-v20-together)
8. [Validation](#8-validation)
9. [Common Issues](#9-common-issues)

---

## 1. Why v2.0?

v1.1 was designed for a world where human designers created and consumed service design artifacts. v2.0 is designed for a world where AI agents, automated tools, and human designers work together.

**Key limitations of v1.1 that drove v2.0:**
- **Three-artifact overhead.** Understanding one person required reading, linking, and synthesising Persona + Role + Pairing — three separate files with no explicit link between them.
- **Linear journeys can't model real services.** Branching, errors, loops, and multi-actor orchestration are common in real services but impossible to represent in a linear phase-step structure.
- **Persona content mixed with service content.** v1.1 Journeys embed persona thoughts and emotions directly on steps, making it impossible to reuse service structure across multiple personas.
- **No governance or provenance.** In a world of AI-generated content, GDPR, and EU AI Act requirements, artifacts need to declare how they were created and who is responsible.
- **No machine-readable graph.** Relationships between artifacts were implicit; AI tools and orchestration systems had no way to traverse them.

---

## 2. What Changed

### Artifacts

| Change | Detail |
|--------|--------|
| Persona + Role + Pairing → Actor | Three artifacts merged into one three-layer file |
| Journey → Mission + Experience | Service structure separated from persona content |
| New: `$type` field | All artifacts declare their type for auto-detection |
| New: `$context` field | JSON-LD context for graph interoperability |
| New: provenance | Per-artifact and per-field evidence tracking |
| New: governance | GDPR/EU AI Act compliance metadata |
| New: relationships | Typed graph edges between artifacts |
| New: lane system | Declaration-driven data layers on Mission/Experience |
| New: `needAtStep` / `painAtStep` | Micro-emergence fields on Experience nodes |
| New: accessibility | Native on Actors (identity) and Mission nodes (WCAG 3.0-aligned) |

### Field renames

| v1.1 field | v2.0 field | Where |
|------------|-----------|-------|
| `personalNeeds[].text` | `traits.needs[].need` | Actor |
| `frustrations[].text` | `traits.frustrations[].frustration` | Actor |
| `goals[].text` | `emergence[].goalsAsExperienced[].goal` | Actor |
| `painPoints[].text` | `emergence[].painPoints[].painPoint` | Actor |
| `consumerContext` | `contexts[].details` | Actor |
| `professionalContext` | `contexts[].details` | Actor |
| `steps[].lane_content.thoughts` | `nodes[].laneContent.thoughts` | Experience |
| `steps[].lane_content.feelings` | `nodes[].laneContent.emotions` | Experience |

### Enum translations

| v1.1 value | v2.0 value | Field |
|------------|-----------|-------|
| `"persona"` | `"traits"` | emergence.goalsAsExperienced.source |
| `"role"` | `"context"` | emergence.goalsAsExperienced.source |
| `"persona+role"` | `"collision"` | emergence.goalsAsExperienced.source |
| `"non_digital"` | `"physical"` or `"telecom"` | channel.category |
| `"self-service"` | `"self_service"` | channel.serviceModel |
| `"assisted"` | `"managed"` | channel.serviceModel |
| `"exception"` | `"edge_case"` | path.pathType |
| `"sequential"` | `"default"` | edge.edgeType |
| `"loop"` | `"loop_back"` | edge.edgeType |

---

## 3. Using the Converter Tool

### Prerequisites

```bash
cd tools/converters
npm install
```

### Convert Persona + Role + Pairing → Actor

```bash
node tools/converters/convert-v1.1-to-v2.0.js \
  --persona v1.1/examples/personas/persona-sarah-martinez.json \
  --role v1.1/examples/roles/role-working-mom-consumer.json \
  --pairing v1.1/examples/pairings/pairing-sarah-working-mom.json \
  --output v2.0/examples/retail/
```

Output: `actor-sarah-martinez.json` with quality warnings for sections needing review.

### Convert Journey → Mission + Experience skeleton

```bash
node tools/converters/convert-v1.1-to-v2.0.js \
  --journey v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json \
  --actor-id actor-sarah-martinez \
  --context-id ctx-working-mom-consumer \
  --output v2.0/examples/retail/
```

Output: `mission-<name>.json` and `exp-<name>.json` skeletons with warnings for fields requiring human work.

### Full conversion in one command

```bash
node tools/converters/convert-v1.1-to-v2.0.js \
  --persona v1.1/examples/personas/persona-sarah-martinez.json \
  --role v1.1/examples/roles/role-working-mom-consumer.json \
  --pairing v1.1/examples/pairings/pairing-sarah-working-mom.json \
  --journey v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json \
  --output v2.0/examples/retail/
```

### What the converter outputs

```
✓ Actor created: actor-sarah-martinez.json
  ⚠ emergence[0].painPoints: emergesFrom text copied from v1.1 — review for accuracy
  ⚠ needAtStep: NOT populated (requires human design work)
  ⚠ painAtStep: NOT populated (requires human design work)
  ⚠ Service blueprint lanes (frontstage, backstage, support-systems): NOT populated
✓ Mission created: mission-online-clothes-shopping.json
  ⚠ Decision nodes: NOT added (v1.1 journeys are linear — add manually)
  ⚠ Alternative paths: NOT generated (only happy path converted)
✓ Experience created: exp-sarah-clothes-shopping.json
  Quality: Structural conversion complete. Design depth requires human review.
```

Do not treat a converted artifact as production-ready. The warnings identify what needs attention.

---

## 4. Field Mapping Reference

### Persona → Actor (traits)

| v1.1 Persona | v2.0 Actor | Notes |
|-------------|-----------|-------|
| `persona_id` | `id` (`actor-*` prefix) | ID format changes |
| `name` | `name` | Direct |
| `summary` | `summary` | Direct |
| `quote` | `quote` | Direct |
| `demographics.*` | `traits.demographics.*` | Nested under traits |
| `personalNeeds[]` | `traits.needs[]` | `text` → `need` |
| `frustrations[]` | `traits.frustrations[]` | `text` → `frustration` |
| `motivations[]` | `traits.motivations[]` | Direct |
| `technologyProfile.*` | `traits.technology.*` | `comfort_level` → `comfort` |
| `communicationPreferences.*` | `traits.communication.*` | `preferred_channels` → `preferred` |
| `decisionMakingStyle.*` | `traits.decisionMaking.*` | `style` and `riskTolerance` |
| `accessibilityNeeds` | `traits.accessibility.dimensions[]` | Restructured |
| `behaviouralPatterns[]` | `traits.behaviouralPatterns[]` | Direct |

### Role → Actor (contexts)

| v1.1 Role | v2.0 Actor | Notes |
|----------|-----------|-------|
| `role_id` | `contexts[].contextId` (`ctx-*` prefix) | ID format changes |
| `title` | `contexts[].title` | Direct |
| `contextType` | `contexts[].contextType` | Direct |
| `roleBasedNeeds[]` | `contexts[].needs[]` | `text` → `need`, priorities map |
| `roleFrustrations[]` | `contexts[].frustrations[]` | `text` → `frustration` |
| `channelPreferences[]` | `contexts[].channels[]` | Category translation needed |
| `consumerContext` | `contexts[].details` | Moved to free-form `details` |
| `professionalContext` | `contexts[].details` | Moved to free-form `details` |
| `momentsThatMatter[]` | `contexts[].momentsThatMatter[]` | Direct |

### Pairing → Actor (emergence)

| v1.1 Pairing | v2.0 Actor | Notes |
|-------------|-----------|-------|
| `goalsAsExperienced[]` | `emergence[].goalsAsExperienced[]` | `text` → `goal`; source enum translated |
| `painPoints[]` | `emergence[].painPoints[]` | `text` → `painPoint`; `emergesFrom` may need review |
| `opportunities[]` | `emergence[].opportunities[]` | Direct |
| `emotionalContext` | `emergence[].emotionalContext` | Direct |

### Journey → Mission (service layer)

| v1.1 Journey | v2.0 Mission | Notes |
|-------------|-------------|-------|
| `journey_id` | `id` (`mission-*` prefix) | ID format changes |
| `title` | `title` | Direct |
| `phases[].name` | `phases[].name` | Phases become node groupings |
| `steps[].id` | `nodes[].nodeId` | All steps become touchpoint nodes |
| `steps[].description` | `nodes[].laneContent.description` | Service-level description |
| `steps[].channels` | `nodes[].laneContent.channels` | Channel enum translations needed |
| `steps[].barriers[]` | `nodes[].laneContent.barriers[]` | Service-level barriers only |
| *(not in v1.1)* | `edges[]` | Must be generated or authored |
| *(not in v1.1)* | `paths[]` | Must be authored |
| *(not in v1.1)* | Decision nodes | Must be added manually |
| *(not in v1.1)* | `lanes[]` | Must be declared |

### Journey → Experience (persona layer)

| v1.1 Journey | v2.0 Experience | Notes |
|-------------|----------------|-------|
| `actor_id` | `references.actorRef` | References Actor ID |
| `steps[].id` | `nodes[].nodeRef` | Each step → Experience node |
| `steps[].lane_content.thoughts` | `nodes[].laneContent.thoughts` | Direct |
| `steps[].lane_content.feelings` | `nodes[].laneContent.emotions` | Restructured |
| `steps[].lane_content.barriers` | `nodes[].laneContent.barriers` | Add `emergesFrom` |
| *(not in v1.1)* | `nodes[].laneContent.needAtStep` | Requires human design work |
| *(not in v1.1)* | `nodes[].laneContent.painAtStep` | Requires human design work |
| `outcome` | `outcome` | Restructured |

---

## 5. What Requires Human Work

A mechanical conversion produces a valid artifact that will pass schema validation. It will not produce a *good* artifact. The following sections cannot be automated and require design thinking:

### 1. needAtStep and painAtStep

These are the highest-value fields in the Experience schema. They capture the micro-emergence — the specific insight that only exists when *this person's traits* meet *this touchpoint*. There is no v1.1 equivalent and no AI can generate them without access to the original research.

**What to do:** Use the `experience-generator` skill to walk through the Experience node by node, with the Actor's traits and context in context. The skill prompts for these fields at each step.

### 2. Decision nodes and alternative paths

v1.1 journeys are linear. Real services have branches. The converter creates a single linear Mission with all v1.1 steps as touchpoint nodes and no decision nodes.

**What to do:** After conversion, open the Mission in the `mission-builder` and add:
- Decision nodes at choice points
- Error/timeout paths
- Return and abandonment paths
- Loop-backs (retry flows)

### 3. Service blueprint lanes

Frontstage, backstage, support systems, data required, and roles involved are not present in v1.1 journeys. The converter leaves these unpopulated.

**What to do:** Run a service blueprint workshop or populate from existing documentation. The `mission-builder` skill guides this.

### 4. emergesFrom on barriers

The converter copies barriers from v1.1 to the Experience. The `emergesFrom` field — which explains *why* this barrier affects this actor specifically — cannot be generated mechanically.

**What to do:** For each barrier in the Experience, add an `emergesFrom` that names the specific Actor trait or context characteristic that makes this barrier worse for this person than for others.

### 5. Emergence quality

The converter translates Pairing synthesis content into the emergence layer. But Pairing synthesis in v1.1 was often written as generic summaries. Good emergence entries have `emergesFrom` explanations that show the collision clearly.

**What to do:** Review `emergence[].painPoints[].emergesFrom` and `emergence[].goalsAsExperienced[].source`. The collision should be explicit.

---

## 6. Step-by-Step Conversion Process

### For a persona set with a journey (e.g., Jake Holloway)

1. **Run the converter** to get the baseline artifacts
2. **Validate** the Actor: `node tools/validators/validate-v2.0.js v2.0/examples/energy/actor-jake-holloway.json`
3. **Review Actor quality warnings** and address each one
4. **Open the Mission** and add decision nodes, alternative paths, and service blueprint lanes
5. **Use `experience-generator`** to rebuild the Experience interactively — don't just accept the converted skeleton
6. **Validate the Experience** with cross-refs: `node tools/validators/validate-v2.0.js v2.0/examples/energy/exp-jake-energy-switch.json --check-refs`
7. **Aim for ≥ 80/100** on quality score before considering the artifact production-ready

### For a persona set without a journey (e.g., David Chen, Maria Rodriguez)

1. **Run the converter** for Persona + Role + Pairing → Actor only (no `--journey` flag)
2. **Review and enrich** the Actor
3. **Use `mission-builder`** to create the Mission interactively — this is where you do the service design thinking
4. **Use `experience-generator`** to create the Experience interactively

This approach produces higher-quality Missions and Experiences than converter output because the builder skills guide you through the design thinking step by step.

---

## 7. Coexistence: Running v1.1 and v2.0 Together

v1.1 and v2.0 artifacts coexist in the same project. They live in separate directories:

```
v1.1/examples/   ← existing v1.1 artifacts (do not modify)
v2.0/examples/   ← new v2.0 artifacts
```

Skills are version-routed. The project's `PROJECT_CONTEXT.md` declares the active schema version:

```
Active schema version: v2.0
```

When this is set to v2.0:
- **New work** uses v2.0 skills (actor-builder, mission-builder, experience-generator)
- **Legacy v1.1 artifacts** can still be validated with `validate-v1.1.js`
- **v1.1 skills** (persona-builder, journey-builder, etc.) remain available for working with existing v1.1 artifacts but are de-prioritised

There is no need to convert all v1.1 artifacts immediately. The migration can be phased:
1. Convert high-priority persona sets first
2. Leave archival/reference personas in v1.1
3. Create new work in v2.0 from the start

---

## 8. Validation

### Validate a converted Actor

```bash
node tools/validators/validate-v2.0.js v2.0/examples/<domain>/actor-<name>.json
```

### Validate a full example set with cross-references

```bash
node tools/validators/validate-v2.0.js v2.0/examples/<domain>/ --check-refs
```

### Validate all v2.0 examples

```bash
node tools/validators/validate-v2.0.js v2.0/examples/
```

### Run the full test suite (v1.1 + v2.0)

```bash
node tools/validators/run-all-tests.js
```

### Quality targets

| Stage | Target score |
|-------|-------------|
| Immediately after converter | 40–60/100 (structural only) |
| After Actor review | ≥ 70/100 |
| After Mission + Experience builder work | ≥ 80/100 |
| Production-ready artifact | ≥ 85/100 |

---

## 9. Common Issues

### "nodeRef not found in mission"

The Experience references a Mission node ID that doesn't exist. Check that your `path.nodeSequence` and `nodes[].nodeRef` values match the node IDs in the Mission exactly (case-sensitive).

### "Lane ID fails pattern"

Lane IDs must match `^[a-z][a-z0-9_-]*$`. Use `need-at-step`, not `needAtStep`. Use `pain-at-step`, not `painAtStep`.

### "serviceModel is not one of the allowed values"

Valid values: `self_service`, `managed`, `both`. Not `"self-service"` or `"assisted"`.

### "edgeType is not one of the allowed values"

Valid values: `default`, `conditional`, `error`, `timeout`, `escalation`, `loop_back`. Not `"sequential"` or `"loop"`.

### "netSentiment must be integer"

`outcome.netSentiment` is an integer (-2 to 2), not a string. Use `1`, not `"positive"`.

### "emotions.intensity must be integer"

`emotions.intensity` is an integer (-2 to 2). Same constraint applies to `momentThatMatters.emotionalIntensity`.

### Quality score stuck below 70

Most common causes:
- Missing `emergence` section on Actor
- No `needAtStep` or `painAtStep` on Experience nodes
- Missing `provenance` and `governance` fields
- No `paths[]` on Mission
- Service blueprint lanes declared but not populated

---

## See also

- [Actor Standard](standards/SERVICE-DESIGN-ACTOR-STANDARD.md)
- [Mission Standard](standards/SERVICE-DESIGN-MISSION-STANDARD.md)
- [Experience Standard](standards/SERVICE-DESIGN-EXPERIENCE-STANDARD.md)
- [v2.0 schemas](schemas/)
- [v2.0 examples](examples/)
- Converter: `tools/converters/convert-v1.1-to-v2.0.js`
- Validator: `tools/validators/validate-v2.0.js`
