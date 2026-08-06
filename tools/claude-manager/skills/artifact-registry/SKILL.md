---
name: artifact-registry
description: Indexes, searches, and tracks relationships between DSDS artifacts. Use for finding artifacts, checking duplicates, understanding coverage, and managing the artifact collection. Triggers on "find persona", "find actor", "search artifacts", "what do we have", "refresh registry", "show relationships", "check for duplicates".
allowed-tools: Read, Write, Glob, Grep
---

# Artifact Registry Skill

## Overview

This skill maintains an index of all DSDS artifacts, enabling search, duplicate detection, relationship tracking, and coverage analysis. Supports both **v2.0** (Actor/Mission/Experience) and **v1.1** (Persona/Role/Pairing/Journey) artifacts, auto-detected by the `$type` field.

## When to Use

- User asks "what actors/personas do we have?"
- User wants to "find" or "search" artifacts
- Before creating a new artifact (check for duplicates)
- User asks about relationships ("which experiences reference Sarah?")
- User wants to "refresh" or "regenerate" the index
- Coverage questions ("which actors don't have experiences?")

## Key Files

- `[artifacts_path]/.dsds-index.json` - Generated index
- `.dsds-config.json` - Org config (for paths and custom fields)

## Auto-Detection

Read each artifact's `$type` field to determine version and type:

| `$type` value | Version | Type |
|---------------|---------|------|
| `Actor` | v2.0 | Actor |
| `Mission` | v2.0 | Mission |
| `Experience` | v2.0 | Experience |
| `ConsumerPersona`, `StaffPersona`, etc. | v1.1 | Persona |
| `RoleCard` | v1.1 | Role |
| `Pairing` | v1.1 | Pairing |
| `Journey` | v1.1 | Journey |
| missing | v1.1 | (infer from filename/structure) |

## Index Structure

```json
{
  "_meta": {
    "generated": "2026-01-15T14:30:00Z",
    "generator": "artifact-registry skill v2.0",
    "config_path": "../.dsds-config.json",
    "artifacts_path": ".",
    "artifact_count": 52,
    "schema_versions": ["2.0", "1.1"]
  },

  "summary": {
    "v2.0": {
      "actors": 4,
      "missions": 4,
      "experiences": 4
    },
    "v1.1": {
      "personas": 12,
      "roles": 8,
      "pairings": 6,
      "journeys": 21
    },
    "total": 59
  },

  "artifacts": {
    "actors": [
      {
        "id": "actor-sarah-martinez",
        "path": "actors/actor-sarah-martinez.json",
        "type": "Actor",
        "schema_version": "2.0",
        "name": "Sarah Martinez",
        "description": "Retail customer, time-constrained working parent",
        "quality_score": 92,
        "status": "approved",
        "custom_fields": {
          "customer_segment": "Premium"
        },
        "last_modified": "2026-01-10T09:00:00Z"
      }
    ],
    "missions": [
      {
        "id": "mission-retail-purchase",
        "path": "missions/mission-retail-purchase.json",
        "type": "Mission",
        "schema_version": "2.0",
        "name": "Purchase clothing online",
        "quality_score": 88,
        "node_count": 8,
        "last_modified": "2026-01-10T09:00:00Z"
      }
    ],
    "experiences": [
      {
        "id": "experience-sarah-retail",
        "path": "experiences/experience-sarah-retail.json",
        "type": "Experience",
        "schema_version": "2.0",
        "name": "Sarah: Online Clothing Purchase",
        "actor_ref": "actor-sarah-martinez",
        "mission_ref": "mission-retail-purchase",
        "quality_score": 85,
        "last_modified": "2026-01-10T09:00:00Z"
      }
    ],
    "personas": [...],
    "roles": [...],
    "pairings": [...],
    "journeys": [...]
  },

  "relationships": {
    "v2.0": {
      "actor_to_experiences": {
        "actor-sarah-martinez": ["experience-sarah-retail"]
      },
      "mission_to_experiences": {
        "mission-retail-purchase": ["experience-sarah-retail"]
      },
      "actor_to_missions": {
        "actor-sarah-martinez": ["mission-retail-purchase"]
      }
    },
    "v1.1": {
      "persona_to_pairings": {
        "persona-sarah-martinez": ["pairing-sarah-working-mom"]
      },
      "persona_to_journeys": {
        "persona-sarah-martinez": ["journey-clothes-shopping"]
      },
      "role_to_pairings": {
        "role-working-mom-consumer": ["pairing-sarah-working-mom"]
      },
      "pairing_to_journeys": {}
    }
  },

  "coverage": {
    "v2.0": {
      "actors_with_experiences": ["actor-sarah-martinez"],
      "actors_without_experiences": ["actor-marcus-chen"],
      "missions_with_experiences": ["mission-retail-purchase"],
      "missions_without_experiences": [],
      "actors_with_missions": ["actor-sarah-martinez"],
      "actors_without_missions": ["actor-marcus-chen"]
    },
    "v1.1": {
      "personas_with_journeys": ["persona-sarah-martinez"],
      "personas_without_journeys": ["persona-first-time-buyer"],
      "roles_with_pairings": ["role-working-mom-consumer"],
      "roles_without_pairings": ["role-it-administrator"],
      "orphaned_pairings": []
    }
  },

  "custom_field_values": {
    "customer_segment": {
      "Premium": ["actor-sarah-martinez"],
      "Standard": [],
      "Basic": []
    }
  }
}
```

## Process

### Operation: Refresh/Generate Index

Scan all artifacts and build index. Check config for paths:

```bash
# Read config for paths
cat .dsds-config.json
```

For v2.0 orgs, scan:
```
actors/*.json
missions/*.json
experiences/*.json
```

For v1.1 or mixed orgs, also scan:
```
personas/*.json
roles/*.json
pairings/*.json
journeys/*.json
```

For each artifact:
1. Read the file
2. Check `$type` field to determine version and artifact type
3. Extract key fields (id, name, description)
4. For v2.0: check `actorRef`, `missionRef` references
5. For v1.1: check `personaRef`, `roleRefs` references
6. Calculate quality score (use validate-v2.0.js for v2.0, completeness-checker logic for v1.1)
7. Extract custom field values
8. Record last modified time

Build v2.0 relationships:
- Experiences reference actors (`actorRef`) and missions (`missionRef`)
- Build reverse maps: actor→experiences, mission→experiences

Build v1.1 relationships:
- Pairings reference personas and roles
- Journeys reference personas

Identify coverage gaps (v2.0):
- Actors not referenced by any Experience
- Missions not referenced by any Experience

Save to `[artifacts_path]/.dsds-index.json`.

### Operation: Search Artifacts

```
User: Find actors related to retail

Claude: Searching artifacts for "retail"...

Found 3 matches:

**Actors (v2.0):**
1. actor-sarah-martinez
   - Name: Sarah Martinez
   - Match: customer_segment = "Premium (Retail)"

**Experiences (v2.0):**
2. experience-sarah-retail
   - Name: Sarah: Online Clothing Purchase
   - Match: title contains "retail"

**Journeys (v1.1):**
3. journey-retail-returns
   - Name: Retail Returns Journey
   - Match: title contains "retail"
```

Search across all artifact types — both v2.0 and v1.1.

### Operation: Check for Duplicates

Before creating a new Actor or Persona:

```
User: Create an actor for a busy parent

Claude: Let me check for similar existing actors and personas...

Found potentially related artifacts:

**v2.0 Actors:**
1. actor-sarah-martinez (85% match)
   - Time-constrained working parent
   - Has 1 Experience

**v1.1 Personas:**
2. persona-sarah-martinez (90% match)
   - Working mother
   - 1 Journey (could be converted to Experience)

Options:
1. Create new distinct Actor
2. Use existing actor-sarah-martinez
3. Convert persona-sarah-martinez to v2.0 Actor
4. See more details first
```

### Operation: Show Relationships

**v2.0 artifact:**
```
User: What references Sarah Martinez actor?

Claude: actor-sarah-martinez is referenced by:

Experiences (1):
- experience-sarah-retail
  - Mission: mission-retail-purchase
  - Quality: 85/100
  - Steps: 8 in 4 phases

Not yet connected to any other missions.

Graph:
┌─────────────────────┐
│ actor-sarah-        │
│ martinez            │
└─────────┬───────────┘
          │ actorRef
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ experience-sarah-   │────▶│ mission-retail-      │
│ retail              │     │ purchase             │
└─────────────────────┘     └─────────────────────┘
```

**v1.1 artifact** — show v1.1 relationship graph (persona→pairing→journey).

### Operation: Coverage Report

```
User: What actors don't have experiences?

Claude: v2.0 Coverage Analysis

Actors WITH Experiences (connected):
- actor-sarah-martinez → experience-sarah-retail (mission: retail-purchase)
- actor-david-chen → experience-david-healthcare

Actors WITHOUT Experiences (gaps):
- actor-jake-holloway (Mission exists: mission-energy-switch)
- actor-new-customer (No mission yet)

Recommendations:
1. Generate Experience for actor-jake-holloway — mission exists, ready to walk through
2. Create Mission for actor-new-customer first, then generate Experience

Also show v1.1 gaps if present.
```

### Operation: Filter by Custom Field

Works the same for v2.0 actors/missions/experiences as for v1.1 artifacts.

### Operation: Version Split Report

```
User: What's the v1.1 vs v2.0 breakdown?

Claude: Schema Version Split

v2.0 (Actor/Mission/Experience): 12 artifacts
  - Actors: 4
  - Missions: 4
  - Experiences: 4

v1.1 (Persona/Role/Pairing/Journey): 47 artifacts
  - Personas: 12
  - Roles: 8
  - Pairings: 6
  - Journeys: 21

Conversion candidates (v1.1 artifacts with v2.0 equivalents):
- persona-sarah-martinez → actor-sarah-martinez (v2.0 Actor exists)
- journey-clothes-shopping → (no Experience yet)

Unconverted v1.1 only: 35 artifacts
Ready for conversion: 2 personas with no v2.0 Actor yet
```

## Output Formats

### Summary Table
```
| Type | Version | Count | Avg Quality | Connected |
|------|---------|-------|-------------|-----------|
| Actors | v2.0 | 4 | 90% | 3 (75%) |
| Missions | v2.0 | 4 | 88% | 4 (100%) |
| Experiences | v2.0 | 4 | 87% | 4 (100%) |
| Personas | v1.1 | 12 | 78% | 10 (83%) |
| Journeys | v1.1 | 21 | 75% | 21 (100%) |
```

### Detail Format (v2.0 Actor)
```
actor-sarah-martinez

Name: Sarah Martinez
Type: Actor (v2.0)
Description: Retail customer, time-constrained working parent
Quality: 92/100
Status: approved

Custom fields:
- customer_segment: Premium

Referenced by:
- Experiences: 1 (experience-sarah-retail)
- Via missions: mission-retail-purchase

File: actors/actor-sarah-martinez.json
Last modified: 2026-01-10
```

## Staleness Detection

Same as before — warn if index is older than artifact files or if files were added/removed.

## Quality Checklist

Index should include:

- [ ] All v2.0 artifacts (actors, missions, experiences)
- [ ] All v1.1 artifacts (personas, roles, pairings, journeys)
- [ ] `$type` captured for each artifact
- [ ] Schema version recorded for each artifact
- [ ] Accurate v2.0 relationship mapping (actorRef/missionRef)
- [ ] Accurate v1.1 relationship mapping (personaRef/roleRefs)
- [ ] Quality scores calculated
- [ ] Custom field values extracted
- [ ] Coverage gaps identified for both versions
- [ ] Version split summary

## Related Skills

- `org-config-manager` - Provides config for index structure
- `portfolio-reporter` - Uses index for reports
- `standards-enforcer` - Uses index for compliance checks
- `bulk-operations` - Uses index to find artifacts to update
