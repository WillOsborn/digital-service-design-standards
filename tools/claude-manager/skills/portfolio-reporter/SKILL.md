---
name: portfolio-reporter
description: Generates reports on the DSDS artifact portfolio - coverage analysis, quality summaries, barrier aggregation, and health metrics. Use for governance, planning, and status updates. Triggers on "portfolio report", "coverage report", "quality summary", "health check", "what's our status", "artifact stats".
allowed-tools: Read, Glob, Write, Bash(node tools/validators/*:*)
---

# Portfolio Reporter Skill

## Overview

This skill generates reports across the entire DSDS artifact collection. Supports **v2.0** (Actor/Mission/Experience), **v1.1** (Persona/Role/Pairing/Journey), and **mixed portfolios**. Uses `validate-v2.0.js` quality scoring for v2.0 artifacts (100-point rubric) and completeness-checker logic for v1.1.

## When to Use

- User asks for "portfolio status" or "coverage report"
- Governance review meetings
- Planning which artifacts to create next
- Quality assessment across the collection
- Identifying systemic issues (barrier patterns)
- Executive summaries

## Report Types

### 1. Portfolio Summary

High-level overview of what exists. Auto-detects which versions are present.

**v2.0-only org:**

```
# DSDS Portfolio Summary
Generated: 2026-01-15

## Schema Version: v2.0 (Actor/Mission/Experience)

## Artifact Counts
| Type | Count | Avg Quality (/100) | With Experiences |
|------|-------|-------------------|-----------------|
| Actors | 4 | 90 | 3 (75%) |
| Missions | 4 | 88 | 4 (100%) |
| Experiences | 4 | 86 | — |

## Health Score: A (88/100)

Strengths:
- All missions have at least one Experience
- High average quality across all types

Gaps:
- 1 Actor without an Experience (actor-jake-holloway)
- Actor quality range: 64–96 (review low-scoring actor)
```

**Mixed org (v1.1 + v2.0):**

```
# DSDS Portfolio Summary
Generated: 2026-01-15

## Schema Versions: v1.1 + v2.0 (mixed portfolio)

## v2.0 Artifacts
| Type | Count | Avg Quality (/100) |
|------|-------|-------------------|
| Actors | 4 | 90 |
| Missions | 4 | 88 |
| Experiences | 4 | 86 |

## v1.1 Artifacts
| Type | Count | Avg Completeness | With Relationships |
|------|-------|------------------|-------------------|
| Personas | 12 | 78% | 10 (83%) |
| Roles | 8 | 72% | 6 (75%) |
| Pairings | 6 | 80% | 6 (100%) |
| Journeys | 21 | 75% | 21 (100%) |

## Migration Progress
- v1.1 artifacts with v2.0 equivalents: 4/12 personas
- v1.1 personas not yet converted: 8
```

### 2. Coverage Report

Which artifacts are connected vs orphaned.

**v2.0 coverage:**

```
# v2.0 Coverage Report
Generated: 2026-01-15

## Actor → Experience Coverage

✅ Actors WITH Experiences (3):
| Actor | Experiences | Via Missions |
|-------|-------------|-------------|
| actor-sarah-martinez | 1 | mission-retail-purchase |
| actor-david-chen | 1 | mission-healthcare-appointment |
| actor-maria-rodriguez | 1 | mission-sales-pipeline |

⚠️ Actors WITHOUT Experiences (1):
| Actor | Name | Mission Available? |
|-------|------|-------------------|
| actor-jake-holloway | Jake Holloway | Yes — mission-energy-switch exists |

## Mission → Experience Coverage

✅ All 4 missions have Experiences.

## Recommendations
1. Generate Experience for actor-jake-holloway through mission-energy-switch
   (Mission exists — use /experience-generator)
```

### 3. Quality Report

**v2.0 quality (100-point rubric from `v2.0-quality-scoring.js`):**

```
# v2.0 Quality Report
Generated: 2026-01-15

## Overall Portfolio Quality: 88/100

## Actors (avg: 90/100)
| Grade | Count | Artifacts |
|-------|-------|-----------|
| A (90+) | 3 | sarah-martinez (96), david-chen (92), maria-rodriguez (90) |
| B (75–89) | 0 | — |
| C (60–74) | 1 | jake-holloway (64) |

### Common Actor Quality Issues
- Missing researchSources (2 actors) — reduces provenance score
- Sparse behavioural traits (1 actor) — fewer than 3 traits

## Missions (avg: 88/100)
| Grade | Count | Artifacts |
|-------|-------|-----------|
| A (90+) | 2 | retail-purchase (92), healthcare-appointment (91) |
| B (75–89) | 2 | sales-pipeline (85), energy-switch (83) |

### Common Mission Quality Issues
- No failure/edge-case paths defined (2 missions)
- Missing conditional edges (1 mission)

## Experiences (avg: 86/100)
| Grade | Count | Artifacts |
|-------|-------|-----------|
| A (90+) | 1 | sarah-retail (91) |
| B (75–89) | 3 | david-healthcare (88), maria-sales (85), jake-energy (79) |

### Common Experience Quality Issues
- Missing needAtStep lane (1 experience)
- momentThatMatters not marked (2 experiences)
- Empty outcome.recommendations (2 experiences)

## Lowest Quality (need attention)
| Artifact | Type | Score | Key Issues |
|----------|------|-------|------------|
| actor-jake-holloway | Actor | 64 | sparse traits, no researchSources |
```

**v1.1 quality** — same format, percentages instead of /100.

### 4. Cross-Artifact Consistency Report

**v2.0 specific** — checks that actorRefs/missionRefs are valid and that barrier classifications are consistent.

```
# v2.0 Cross-Artifact Consistency Report
Generated: 2026-01-15

## Reference Integrity
✅ All actorRefs resolve to existing actors
✅ All missionRefs resolve to existing missions
✅ nodeSequence steps reference valid mission nodeIds

## Mission ↔ Experience Alignment
✅ experience-sarah-retail covers all required mission-retail-purchase nodes
⚠️ experience-jake-energy skips 2 mission nodes (no steps for them)
   Skipped: node-id-05 (payment), node-id-07 (confirmation)

## Barrier Classification Consistency
✅ Structural barriers in Experiences match Mission node descriptions
⚠️ experience-maria-sales has emergent barriers without emergesFrom field set
   (3 barriers in steps 4–6 should reference Actor traits)

## Recommendations
1. Add steps for nodes 05 and 07 in experience-jake-energy
2. Set emergesFrom on emergent barriers in experience-maria-sales
```

Run via:
```bash
node tools/validators/validate-v2.0.js [path/] --check-refs
```

### 5. Barrier Analysis Report

**v2.0** — distinguishes structural barriers (from Mission nodes) vs emergent (from Actor traits via `emergesFrom`).

```
# Barrier Analysis Report
Generated: 2026-01-15

## v2.0 Experience Barriers (all 4 experiences)

Total barriers: 34
- Structural (Mission-level): 18 (53%)
- Emergent (Actor trait-driven): 16 (47%)

## By Type (structural)
| Type | Count | Avg Severity |
|------|-------|-------------|
| process | 8 | 3.2 |
| technology | 5 | 2.8 |
| knowledge | 3 | 3.5 |
| communications | 2 | 2.5 |

## Top Emergent Barrier Actors
| Actor | Emergent Barriers | Top Trait Trigger |
|-------|-------------------|-------------------|
| actor-sarah-martinez | 5 | time-constrained |
| actor-jake-holloway | 4 | low-digital-confidence |

## Cross-Actor Hotspots
Steps with barriers in 3+ experiences:
1. Payment/Checkout — 4 experiences
2. Account Creation — 3 experiences
3. Confirmation/Status — 3 experiences

## Recommendations
1. Payment friction is systemic — affects all customer types
2. Onboarding barriers cluster around digital confidence — consider guided flows
```

### 6. v2.0 Quality Scoring Breakdown

Show how the 100-point rubric breaks down for each artifact type.

```
# Actor Quality Rubric (reference)
Presence (40pts): name, description, traits (3+), contexts (2+), provenance
Depth (35pts): trait elaboration, context richness, research source count
Coherence (25pts): trait-context alignment, provenance completeness

# Mission Quality Rubric (reference)
Structure (40pts): nodes (3+), edges, startNodeId, endNodeIds
Richness (35pts): node descriptions, edge types, failure/timeout paths
Completeness (25pts): serviceModel set, provenance, outcomes

# Experience Quality Rubric (reference)
Coverage (40pts): steps, phases, actorRef, missionRef, lanes
Depth (35pts): emotions, barriers (structural+emergent), needAtStep
Outcomes (25pts): momentThatMatters, outcome.netSentiment, recommendations
```

### 7. Freshness Report

Same as before — shows recently updated vs stale artifacts across both versions.

## Report Generation

### Process

1. **Read registry index** (or regenerate if stale)
2. **Read org config** for context
3. **Determine which versions** are present (v2.0, v1.1, or both)
4. **Calculate metrics** based on report type
   - v2.0: Use `validate-v2.0.js` for quality scores
   - v1.1: Use completeness-checker logic
5. **Generate markdown report**
6. **Optionally save to reports/ folder**

### Output Options

```
AskUserQuestion:
  question: "How should I deliver this report?"
  options:
    - label: "Display here"
      description: "Show the report in this conversation"
    - label: "Save to file"
      description: "Save as markdown in reports/ folder"
    - label: "Both"
      description: "Display and save"
```

### Saved Report Naming

```
reports/
├── portfolio-summary-2026-01-15.md
├── v2.0-coverage-report-2026-01-15.md
├── v2.0-quality-report-2026-01-15.md
├── v2.0-consistency-report-2026-01-15.md
├── barrier-analysis-2026-01-15.md
└── migration-progress-2026-01-15.md
```

## Example Session

```
User: Give me a portfolio status report

Claude: I'll generate a portfolio summary.

[Reads registry index — detects mixed v1.1/v2.0 portfolio]

# DSDS Portfolio Summary — 2026-01-15

## Schema Versions: Mixed (v1.1 + v2.0)

## v2.0 (Actor/Mission/Experience)
| Type | Count | Avg Quality |
|------|-------|-------------|
| Actors | 4 | 90/100 |
| Missions | 4 | 88/100 |
| Experiences | 4 | 86/100 |

## v1.1 (Persona/Role/Pairing/Journey)
| Type | Count | Avg Quality |
|------|-------|-------------|
| Personas | 12 | 78% |
| Journeys | 21 | 75% |

## Health Score: B+ (82/100 v2.0 / 76% v1.1)

v2.0 Strengths:
- High quality actors and missions
- All missions have Experiences

v2.0 Gaps:
- 1 Actor without Experience (jake-holloway)
- 3 Experiences missing momentThatMatters

Migration status:
- 4/12 personas converted to v2.0 actors
- 8 personas remaining

Would you like a deeper dive on:
- v2.0 quality breakdown
- Cross-artifact consistency
- Migration planning
- Barrier hotspots
```

## Quality Checklist

Reports should include:

- [ ] Schema version detection (v2.0, v1.1, or mixed)
- [ ] Clear generation timestamp
- [ ] Summary metrics at top
- [ ] Correct quality scale: /100 for v2.0, % for v1.1
- [ ] v2.0 coverage (actor→experience, mission→experience)
- [ ] Cross-artifact consistency for v2.0 (actorRef/missionRef/nodeSequence)
- [ ] Structural vs emergent barrier distinction for v2.0
- [ ] Migration progress if mixed portfolio
- [ ] Visual indicators (✅ ⚠️ 🔴)
- [ ] Actionable recommendations
- [ ] Next steps or drill-down options

## Related Skills

- `artifact-registry` - Provides the data for reports
- `barrier-mapper` - Detailed barrier analysis
- `completeness-checker` - Individual artifact quality
- `standards-enforcer` - Compliance details
