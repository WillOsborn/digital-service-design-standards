---
name: standards-enforcer
description: Checks artifacts against org-specific standards and requirements. Enforces custom field requirements, validation rules, and workflow states. Use for compliance checking before approval. Triggers on "check standards", "compliance check", "enforce standards", "is this compliant", "can this be approved", "review for approval".
allowed-tools: Read, Glob, Bash(node tools/validators/*:*), AskUserQuestion
---

# Standards Enforcer Skill

## Overview

This skill checks DSDS artifacts against organisation-specific standards defined in `.dsds-config.json`. Goes beyond schema validation to enforce custom field requirements, quality thresholds, workflow rules, and — for **v2.0** — provenance completeness, referential integrity, and barrier classification consistency.

Supports both **v2.0** (Actor/Mission/Experience) and **v1.1** (Persona/Role/Pairing/Journey). Auto-detects artifact type by `$type` field.

## When to Use

- Before approving an artifact
- User asks "is this compliant with our standards?"
- Checking a batch of artifacts for org compliance
- Reviewing migrated artifacts (after v1.1→v2.0 conversion)
- Quality gate before publishing/sharing

## What It Checks

### All Artifacts (v1.1 + v2.0)

1. **Schema Validation** — JSON structure, required fields, value types
2. **Custom Field Compliance** — org-required fields present and valid
3. **Quality Thresholds** — minimum completeness score met
4. **Workflow State** — status field valid if approval workflow enabled

### v2.0-Specific Checks

5. **Provenance Completeness** — generationMethod, researchSources
6. **Referential Integrity** — actorRef/missionRef resolve to real artifacts
7. **Node Sequence Integrity** — Experience steps reference valid Mission nodeIds
8. **Barrier Classification** — structural barriers match Mission nodes; emergent barriers have `emergesFrom` set
9. **Outcome Completeness** — netSentiment, recommendations, momentThatMatters

### v1.1-Specific Checks

5. **Relationship Integrity** — personaRef/roleRefs resolve to existing artifacts
6. **No Circular References** — no self-referencing chains

## Process

### Step 1: Load Standards

```bash
cat .dsds-config.json
```

Extract:
- `schema_versions` — which versions to enforce
- `custom_fields` requirements
- `custom_field_definitions`
- `validation` settings (strict_mode, require_research_sources, minimum_completeness_score)
- `workflow` rules

### Step 2: Identify Artifacts to Check

```
AskUserQuestion:
  question: "What would you like to check against standards?"
  options:
    - label: "Single artifact"
      description: "Check one specific file"
    - label: "All v2.0 artifacts"
      description: "Check all actors, missions, experiences"
    - label: "All v1.1 artifacts"
      description: "Check all personas, roles, pairings, journeys"
    - label: "Everything"
      description: "Full portfolio compliance check"
    - label: "Recently changed"
      description: "Check artifacts modified in last 7 days"
    - label: "Migrated artifacts"
      description: "Check freshly converted v1.1→v2.0 artifacts"
```

### Step 3: Detect Artifact Version

Read `$type` field:
- `Actor`, `Mission`, `Experience` → v2.0 checks
- `ConsumerPersona`, `StaffPersona`, `RoleCard`, etc. → v1.1 checks
- Missing `$type` → try to infer; warn user

### Step 4: Run Checks

**v2.0 Artifact (Actor example):**

```
Checking: actor-sarah-martinez (v2.0 Actor)

Running: node tools/validators/validate-v2.0.js actors/actor-sarah-martinez.json

1. Schema Validation
✅ Valid JSON structure
✅ All required fields present
✅ $type: "Actor"

2. Custom Field Compliance
✅ customer_segment: "Premium" (valid enum)
⚠️ crm_id: missing (optional, recommended)

3. Quality Score
✅ Quality: 92/100 (minimum: 60)
   - Presence: 38/40
   - Depth: 33/35
   - Coherence: 21/25

4. Provenance
✅ generationMethod: "ai_assisted"
✅ researchSources: 3 sources
✅ researchSources[].type: valid values

5. Workflow State
✅ Status: approved

Result: COMPLIANT ✅
Recommendation: Add crm_id (optional)
```

**v2.0 Experience (full checks):**

```
Checking: experience-sarah-retail (v2.0 Experience)

1. Schema Validation
✅ Valid JSON, all required fields

2. Referential Integrity
✅ actorRef "actor-sarah-martinez" — found
✅ missionRef "mission-retail-purchase" — found

3. Node Sequence Integrity
✅ All step.nodeId values reference valid mission nodes
   Steps reference: node-01, node-02, node-03, node-04 (all valid)

4. Barrier Classification
✅ 3 structural barriers — all on service-process steps
⚠️ 2 emergent barriers — missing emergesFrom field
   Emergent barriers should reference actor traits that generate them

5. Quality Score
✅ 91/100 — momentThatMatters marked ✓, outcome.netSentiment set

6. Custom Fields
✅ All required fields present

Result: COMPLIANT WITH WARNINGS ⚠️
Fix: Set emergesFrom on 2 emergent barriers in steps 4 and 6
```

**v2.0 Mission:**

```
Checking: mission-retail-purchase (v2.0 Mission)

1. Schema Validation ✅
2. Node/Edge Integrity
   ✅ startNodeId references a valid node
   ✅ All endNodeIds are valid nodes
   ✅ No dangling edge targets
   ⚠️ No failure or timeout edges defined (recommended for completeness)

3. Service Model ✅ serviceModel: "self_service"
4. Quality: 88/100 ✅
5. Custom Fields ✅
6. Provenance ✅

Result: COMPLIANT ✅ (1 recommendation)
```

**v1.1 Artifact** — same structure as before, checking personaRef/roleRefs, completeness %, custom fields.

### Step 5: Summary Report

For multiple artifacts:

```
# Standards Compliance Report
Checked: 4 actors, 4 missions, 4 experiences (v2.0)

## Summary
✅ Compliant: 10
⚠️ Compliant with warnings: 2
❌ Non-compliant: 0

## Warnings (2)

actor-jake-holloway ⚠️
- Quality: 64/100 (above minimum 60, but low)
- Missing: researchSources (not required, but recommended)

experience-sarah-retail ⚠️
- 2 emergent barriers missing emergesFrom field

## Fully Compliant (10)
- actor-sarah-martinez (92/100)
- actor-david-chen (90/100)
- [8 more...]

## Actions Recommended
1. Improve actor-jake-holloway quality (64/100 — close to minimum)
2. Add emergesFrom on emergent barriers in experience-sarah-retail
```

## v2.0 Standards Reference

These are the standards against which v2.0 artifacts are checked:

### Actor Standards (`v2.0/standards/SERVICE-DESIGN-ACTOR-STANDARD.md`)
- Must have 3+ behavioural traits with `type`, `description`, `intensity`
- Must have 2+ contexts
- `provenance.generationMethod` must be set
- `researchSources` recommended (required if `strict_mode: true`)
- No PII — traits are behavioural patterns, not personal data

### Mission Standards (`v2.0/standards/SERVICE-DESIGN-MISSION-STANDARD.md`)
- Must have 3+ nodes
- Must have `startNodeId` and at least one `endNodeId`
- `serviceModel` must be set
- Failure/error paths recommended for completeness
- Mission is actor-agnostic — no specific actor references

### Experience Standards (`v2.0/standards/SERVICE-DESIGN-EXPERIENCE-STANDARD.md`)
- Must reference a valid Actor (`actorRef`) and Mission (`missionRef`)
- Steps must reference valid Mission `nodeId` values
- Must distinguish structural barriers (from service design) vs emergent (from actor traits — use `emergesFrom`)
- `momentThatMatters` should be marked
- `outcome.netSentiment` must be integer -2 to 2 (not a string)
- Lane `id` must match `^[a-z][a-z0-9_-]*$` (use `need-at-step`, not camelCase)

## Compliance Levels

| Level | Icon | Meaning |
|-------|------|---------|
| Compliant | ✅ | Meets all requirements |
| Warning | ⚠️ | Compliant but recommendations exist |
| Non-compliant | ❌ | Fails required checks |

## Checking Specific v2.0 Requirements

### Provenance Check
```
Config: { "validation": { "require_research_sources": true } }

Check (v2.0 Actor):
- provenance.generationMethod present: ✅
- provenance.researchSources not empty: ✅
- researchSources[].type valid enum: ✅
  Valid: "interview" | "survey" | "analytics" | "observation" |
         "existing_research" | "ai_synthesis"
```

### actorRef / missionRef Check
```
Experience actorRef: "actor-sarah-martinez"
Scan actors/ for file with id = "actor-sarah-martinez": ✅ found

Experience missionRef: "mission-retail-purchase"
Scan missions/ for file with id = "mission-retail-purchase": ✅ found
```

### Node Sequence Check
```
Experience steps[].nodeId values: ["node-01", "node-02", "node-03"]
Mission nodes[].id values: ["node-01", "node-02", "node-03", "node-04", "node-05"]
All step nodeIds are in mission: ✅
Mission nodes not covered: ["node-04", "node-05"] — warn if significant
```

### Barrier Classification Check
```
Experience barriers with emergesFrom:
  → emergent (actor trait drives this barrier)

Experience barriers without emergesFrom:
  → structural (service design issue)
  → Check: does this match a known problem in the mission node description?
```

### Enum / Integer Value Checks
```
outcome.netSentiment: must be integer -2 to 2 (NOT "positive")
emotions.intensity: must be integer -2 to 2
momentThatMatters.emotionalIntensity: must be integer -2 to 2
lane id: must match ^[a-z][a-z0-9_-]*$ (use need-at-step, not needAtStep)
serviceModel: "self_service" | "managed" | "both"
edgeType: "default" | "conditional" | "error" | "timeout" | "escalation" | "loop_back"
pathType: "designed" | "observed" | "simulated" | "failure" | "edge_case"
```

## Approval Workflow

If `workflow.require_approval` is true:

```
User: Can experience-sarah-retail be approved?

Claude: Checking experience-sarah-retail against approval requirements.

Approval Checklist:

✅ Schema valid
✅ actorRef resolves
✅ missionRef resolves
✅ Node sequence valid
✅ Quality: 91/100 (≥60 required)
✅ Custom fields present
⚠️ emergesFrom missing on 2 emergent barriers (optional)

Current status: draft

Verdict: READY FOR APPROVAL ✅

This experience meets all requirements.
Change status to "approved"?
```

## Example Session

```
User: Check all v2.0 artifacts against our standards

Claude: Running compliance check on all v2.0 artifacts.

[Reads .dsds-config.json]
[Detects v2.0 artifacts: 4 actors, 4 missions, 4 experiences]

Running validator:
node tools/validators/validate-v2.0.js [artifacts_path]/ --check-refs

# Compliance Report — v2.0 Artifacts
Date: 2026-01-15

## Summary
✅ Fully compliant: 10
⚠️ Compliant with warnings: 2
❌ Non-compliant: 0

## Warnings

actor-jake-holloway ⚠️
- Quality: 64/100 (minimum: 60)
- No researchSources (recommended, not required)

experience-sarah-retail ⚠️
- 2 emergent barriers missing emergesFrom

## All others: fully compliant ✅

## Actions
1. Improve actor-jake-holloway — add traits, add research source references
2. Set emergesFrom on emergent barriers in experience-sarah-retail

Would you like help fixing either of these?
```

## Quality Checklist

Standards check should verify:

- [ ] `$type` detected — correct v2.0 or v1.1 checks applied
- [ ] Schema validation passes (use `validate-v2.0.js` for v2.0)
- [ ] All required custom fields present
- [ ] Custom field values match definitions
- [ ] Quality score meets minimum
- [ ] v2.0: provenance.generationMethod set
- [ ] v2.0: actorRef/missionRef resolve to real artifacts
- [ ] v2.0: nodeId values in Experience match Mission nodes
- [ ] v2.0: emergent barriers have emergesFrom set
- [ ] v2.0: enum/integer values use correct types (not strings for netSentiment)
- [ ] v1.1: personaRef/roleRefs resolve
- [ ] Workflow status is appropriate
- [ ] Clear pass/fail/warning verdict per artifact

## Related Skills

- `org-config-manager` - Defines the standards
- `schema-validator` - Handles schema validation
- `completeness-checker` - Calculates quality scores
- `artifact-registry` - Provides relationship data
- `bulk-operations` - Fix issues across multiple artifacts
