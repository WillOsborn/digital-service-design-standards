---
name: artifact-registry
description: Indexes, searches, and tracks relationships between DSDS artifacts. Use for finding artifacts, checking duplicates, understanding coverage, and managing the artifact collection. Triggers on "find persona", "search artifacts", "what do we have", "refresh registry", "show relationships", "check for duplicates".
allowed-tools: Read, Write, Glob, Grep
---

# Artifact Registry Skill

## Overview

This skill maintains an index of all DSDS artifacts, enabling search, duplicate detection, relationship tracking, and coverage analysis. It generates and updates `.dsds-index.json` in the artifacts folder.

## When to Use

- User asks "what personas do we have?"
- User wants to "find" or "search" artifacts
- Before creating a new artifact (check for duplicates)
- User asks about relationships ("which journeys use Sarah?")
- User wants to "refresh" or "regenerate" the index
- Coverage questions ("which personas don't have journeys?")

## Key Files

- `[artifacts_path]/.dsds-index.json` - Generated index
- `.dsds-config.json` - Org config (for paths and custom fields)

## Index Structure

```json
{
  "_meta": {
    "generated": "2026-01-15T14:30:00Z",
    "generator": "artifact-registry skill v1.0",
    "config_path": "../.dsds-config.json",
    "artifacts_path": ".",
    "artifact_count": 47
  },

  "summary": {
    "personas": 12,
    "roles": 8,
    "pairings": 6,
    "journeys": 21
  },

  "artifacts": {
    "personas": [
      {
        "id": "persona-sarah-martinez",
        "path": "personas/persona-sarah-martinez.json",
        "name": "Sarah Martinez",
        "description": "32-year-old working mom...",
        "completeness_score": 85,
        "status": "approved",
        "custom_fields": {
          "customer_segment": "Premium",
          "department": "Retail"
        },
        "last_modified": "2026-01-10T09:00:00Z"
      }
    ],
    "roles": [...],
    "pairings": [...],
    "journeys": [...]
  },

  "relationships": {
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
  },

  "coverage": {
    "personas_with_journeys": ["persona-sarah-martinez"],
    "personas_without_journeys": ["persona-marcus-thompson"],
    "roles_with_pairings": ["role-working-mom-consumer"],
    "roles_without_pairings": ["role-it-administrator"],
    "orphaned_pairings": []
  },

  "custom_field_values": {
    "customer_segment": {
      "Premium": ["persona-sarah-martinez"],
      "Standard": [],
      "Basic": []
    },
    "department": {
      "Retail": ["persona-sarah-martinez"],
      "IT": ["persona-marcus-thompson"]
    }
  }
}
```

## Process

### Operation: Refresh/Generate Index

Scan all artifacts and build index:

```bash
# Find artifacts path from config
cat .dsds-config.json | grep artifacts_path

# Scan all artifacts
ls artifacts/personas/*.json
ls artifacts/roles/*.json
ls artifacts/pairings/*.json
ls artifacts/journeys/*.json
```

For each artifact:
1. Read the file
2. Extract key fields (id, name, description)
3. Check for references (personaRef, roleRefs)
4. Calculate completeness score (use completeness-checker logic)
5. Extract custom field values
6. Record last modified time

Build relationships by scanning references:
- Pairings reference personas and roles
- Journeys reference personas (and optionally roles)

Identify coverage gaps:
- Personas not referenced by any journey
- Roles not referenced by any pairing

Save to `[artifacts_path]/.dsds-index.json`.

### Operation: Search Artifacts

```
User: Find personas related to retail

Claude: Searching artifacts for "retail"...

Found 3 matches:

**Personas:**
1. persona-sarah-martinez
   - Name: Sarah Martinez
   - Match: customer_segment = "Retail"

2. persona-first-time-buyer
   - Name: Alex Chen
   - Match: description contains "retail"

**Journeys:**
3. journey-retail-returns
   - Name: Retail Returns Journey
   - Match: title contains "retail"

Would you like to see details on any of these?
```

Search across:
- `id` field
- `name` field
- `description` field
- Custom field values
- Tags (if present)

### Operation: Check for Duplicates

Before creating a new artifact:

```
User: Create a persona for a working parent

Claude: Let me check for similar existing personas...

Found potentially related personas:

1. **persona-sarah-martinez** (85% match)
   - Working mother, time-constrained
   - Used in: 1 pairing, 1 journey

2. **persona-busy-professional** (60% match)
   - Time-constrained professional
   - Used in: 0 journeys

Options:
1. Create new distinct persona
2. Use existing (persona-sarah-martinez)
3. Adapt existing for new context
4. See more details first
```

Duplicate detection based on:
- Similar names
- Similar descriptions
- Overlapping needs/frustrations
- Same custom field values

### Operation: Show Relationships

```
User: What uses Sarah Martinez?

Claude: **persona-sarah-martinez** is referenced by:

**Pairings (1):**
- pairing-sarah-working-mom
  - Pairs with: role-working-mom-consumer
  - Emergent barriers: 3

**Journeys (1):**
- journey-clothes-shopping
  - Phases: 8
  - Steps: 24
  - Barriers: 12

**Not yet connected to:**
- Any other roles (only one pairing)

Visualization:
┌─────────────────────┐
│ persona-sarah-      │
│ martinez            │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ pairing-sarah-      │────▶│ journey-clothes-    │
│ working-mom         │     │ shopping            │
└─────────┬───────────┘     └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ role-working-mom-   │
│ consumer            │
└─────────────────────┘
```

### Operation: Coverage Report

```
User: What personas don't have journeys?

Claude: **Coverage Analysis**

Personas WITH journeys (connected):
- persona-sarah-martinez → journey-clothes-shopping

Personas WITHOUT journeys (gaps):
- persona-marcus-thompson
- persona-first-time-buyer

Roles WITHOUT pairings:
- role-it-administrator

**Recommendations:**
1. Create a journey for Marcus Thompson
2. Create a pairing for IT Administrator role
3. Consider if First-Time Buyer needs a dedicated journey

Would you like to create any of these?
```

### Operation: Filter by Custom Field

```
User: Show all Premium customer personas

Claude: **Personas where customer_segment = "Premium":**

1. persona-sarah-martinez
   - Sarah Martinez
   - Department: Retail
   - Journeys: 1

2. persona-vip-client
   - Robert Chen
   - Department: Wealth
   - Journeys: 2

**Summary:** 2 personas in Premium segment
```

## Output Formats

### List Format
```
**Personas (12 total):**
1. persona-sarah-martinez - Sarah Martinez (85%)
2. persona-marcus-thompson - Marcus Thompson (72%)
...
```

### Table Format
```
| ID | Name | Completeness | Journeys | Status |
|----|------|--------------|----------|--------|
| persona-sarah-martinez | Sarah Martinez | 85% | 1 | approved |
| persona-marcus-thompson | Marcus Thompson | 72% | 0 | draft |
```

### Detail Format
```
**persona-sarah-martinez**

Name: Sarah Martinez
Description: 32-year-old working mom...
Completeness: 85%
Status: approved

Custom fields:
- customer_segment: Premium
- department: Retail

Referenced by:
- Pairings: 1
- Journeys: 1

File: personas/persona-sarah-martinez.json
Last modified: 2026-01-10
```

## Example Session

```
User: What personas do we have?

Claude: Let me check the registry.

[Reads .dsds-index.json or regenerates if stale]

**Artifact Registry Summary**

| Type | Count | With Journeys | Completeness Avg |
|------|-------|---------------|------------------|
| Personas | 12 | 8 | 78% |
| Roles | 8 | 6 (pairings) | 72% |
| Pairings | 6 | - | 80% |
| Journeys | 21 | - | 75% |

**Personas:**
1. persona-sarah-martinez - Sarah Martinez (Premium, Retail)
2. persona-marcus-thompson - Marcus Thompson (Standard, IT)
3. persona-first-time-buyer - Alex Chen (Basic, Retail)
...

Would you like to:
- See details on a specific persona?
- Filter by custom field?
- Check coverage gaps?
- Search for something specific?
```

## Staleness Detection

The index may be stale if:
- Files have been modified since `_meta.generated`
- New files exist that aren't in the index
- Files in the index no longer exist

```
⚠️ Index may be stale (generated 3 days ago)

Changes detected:
- New: persona-new-customer.json
- Modified: journey-clothes-shopping.json
- Deleted: role-old-draft.json

Regenerate index? (recommended)
```

## Quality Checklist

Index should include:

- [ ] All artifacts in artifacts folder
- [ ] Accurate relationship mapping
- [ ] Completeness scores calculated
- [ ] Custom field values extracted
- [ ] Coverage gaps identified
- [ ] Last modified timestamps
- [ ] Valid JSON structure

## Related Skills

- `org-config-manager` - Provides config for index structure
- `portfolio-reporter` - Uses index for reports
- `standards-enforcer` - Uses index for compliance checks
- `bulk-operations` - Uses index to find artifacts to update
