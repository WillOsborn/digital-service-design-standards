# Schema Customisation Architecture

**Version:** 1.0.0
**Last Updated:** 2026-01-15
**Status:** Design Reference

## Overview

This document describes the architecture for customising Digital Service Design Schemas for organisation-specific needs, including validator behaviour, forward compatibility strategies, and the roadmap from Claude skills to GUI tooling.

---

## Architecture Layers

The system has four conceptual layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        STANDARDS                             │
│  (Conceptual model, barrier types, channel taxonomy, etc.)   │
│  Owner: DSDS project                                         │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     BASE SCHEMAS (v1.1)                      │
│  (core-persona.schema.json, role-card.schema.json, etc.)     │
│  Owner: DSDS project                                         │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │         GUI or Claude Skills      │
                    │  - Configure org-specific fields  │
                    │  - Generate org schema            │
                    │  - Create/edit artifacts          │
                    └─────────────────┬─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     ORG SCHEMAS                              │
│  (extends base + adds org-specific required/optional fields) │
│  Owner: Adopting organisation                                │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       ARTIFACTS                              │
│  (personas, roles, journeys, pairings)                       │
│  Owner: Adopting organisation                                │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | What It Defines | Who Owns It |
|-------|-----------------|-------------|
| Standards | Conceptual model, taxonomies, required relationships | DSDS project |
| Base Schemas | JSON Schema implementation of standards | DSDS project |
| Org Schemas | Base schema + org-specific requirements | Adopting org |
| Artifacts | Actual personas, roles, journeys | Adopting org users |

---

## The `extensions.custom` Pattern

All schemas include an `extensions.custom` object as the designated location for organisation-specific fields.

### Why This Pattern

1. **Isolation**: Custom fields don't conflict with standard fields
2. **Forward compatibility**: Schema upgrades never touch this namespace
3. **Flexibility**: No schema modification required for basic customisation
4. **Discoverability**: All custom fields in one predictable location

### Example Usage

```json
{
  "id": "persona-sarah-martinez",
  "name": "Sarah Martinez",
  "demographics": { ... },
  "extensions": {
    "custom": {
      "customer_segment": "Premium",
      "gdpr_category": "Tier 1",
      "internal_id": "CRM-12345"
    }
  }
}
```

### What Goes Where

| Field Type | Location | Example |
|------------|----------|---------|
| Standard required | Root level | `id`, `name`, `demographics` |
| Standard optional | Root level | `accessibility`, `triggers` |
| Org-specific | `extensions.custom` | `customer_segment`, `internal_id` |

---

## Customisation Approaches

### Approach A: Use `extensions.custom` Only (Recommended Start)

**How it works**: Use base schemas unchanged. Put all custom fields in `extensions.custom`.

**Pros**:
- No schema modification
- Immediate start
- Forward compatible

**Cons**:
- No enforcement of custom field consistency
- Users may forget fields on some artifacts

**Best for**: Teams getting started, exploring requirements.

### Approach B: Org Schemas with Composition

**How it works**: Create org schemas that extend base schemas using JSON Schema `allOf`.

**Pros**:
- Enforces custom field requirements
- Validates against org-specific rules
- Single source of truth for org requirements

**Cons**:
- Requires schema generation tooling
- Need to update when base schemas change

**Best for**: Established teams with clear requirements.

### Org Schema Structure

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://myorg.com/schemas/persona/v1",

  "allOf": [
    { "$ref": "https://schemas.digitalservice.design/persona/v1.1" },
    {
      "properties": {
        "extensions": {
          "properties": {
            "custom": {
              "properties": {
                "customer_segment": {
                  "enum": ["Premium", "Standard", "Basic"],
                  "description": "Internal customer classification"
                },
                "gdpr_category": {
                  "enum": ["Tier 1", "Tier 2", "Tier 3"],
                  "description": "Data handling tier"
                }
              },
              "required": ["customer_segment", "gdpr_category"]
            }
          }
        }
      }
    }
  ],

  "_meta": {
    "baseSchemaVersion": "1.1.0",
    "orgSchemaVersion": "1.0.0",
    "generatedBy": "DSDS Skill v1.0",
    "generatedAt": "2026-01-15T14:30:00Z"
  }
}
```

### Key Points

- `allOf` ensures base schema validation still applies
- `$ref` points to canonical base schema
- Custom field definitions go inside `extensions.custom`
- `_meta` tracks versions for migration support

---

## Validator Behaviour

### Quality Scoring vs Completeness

The v1.1 validator provides **quality scores**, not completeness scores. This distinction matters because some schemas have mutually exclusive optional fields.

**Example: Role Cards**

Role Cards have context types that are mutually exclusive:
- `consumerContext` (for consumer-facing roles)
- `businessContext` (for B2B roles)
- `employeeContext` (for internal roles)

A role can never fill ALL context types because they serve different purposes.

**How the validator handles this**:

```javascript
// OR logic - full points for having ANY context type
if (data.roleContext.consumerContext || data.roleContext.businessContext ||
    data.roleContext.employeeContext || data.roleContext.otherContext) {
    score += 10;
    details.push("✅ Role context provided");
}
```

### Score Interpretation

| Score | Meaning |
|-------|---------|
| 100% | All applicable fields populated well |
| 80-99% | High quality, minor omissions |
| 60-79% | Good foundation, room for improvement |
| Below 60% | Significant gaps |

### What the Validator Checks

1. **Schema compliance**: JSON structure matches schema
2. **Required fields**: All required fields present
3. **Quality indicators**: Descriptions, examples, research sources
4. **References**: Valid persona/role/pairing references

### What the Validator Doesn't Check

1. **Custom field presence**: Not enforced unless using org schema
2. **Cross-artifact consistency**: Same custom fields across all personas
3. **Standards compliance**: Conceptual model adherence (separate check)

---

## Forward Compatibility

### Strategies for v1.2 and Beyond

When releasing schema updates, we follow these principles:

| Strategy | Description |
|----------|-------------|
| Additive only | New fields are always optional |
| Deprecate, don't remove | Mark fields deprecated before removing |
| Version in artifacts | `schema_info.version` enables migration |
| Migration scripts | Provide automated migration where possible |

### Why `extensions.custom` Survives Upgrades

1. **Namespace isolation**: We never define fields inside `extensions.custom`
2. **No validation**: Base schemas don't validate custom field contents
3. **Explicit boundary**: Clear separation between standard and custom

### Migration Support

Artifacts include version information:

```json
{
  "schema_info": {
    "schema_type": "core_persona",
    "version": "1.1.0",
    "last_modified": "2026-01-15T10:00:00Z"
  }
}
```

This enables:
- Validators to apply version-appropriate rules
- Migration scripts to identify artifacts needing updates
- Gradual rollout of new schema versions

---

## Tooling Roadmap

### Current: CLI Validators

```bash
node tools/validators/validate-v1.1.js persona.json
```

- Validates against base schemas
- Provides quality scores
- No org schema support yet

### Near-term: Claude Skills

Skills can provide the same workflow as the planned GUI:

| Skill | Function |
|-------|----------|
| Schema Customiser | Define org-specific fields, generate org schema |
| Artifact Creator | Create personas/roles/journeys conforming to org schema |
| Validator | Validate artifacts against org schema |

**Skill workflow**:
1. User describes their org requirements
2. Skill generates composed org schema
3. Skill creates artifacts with required custom fields
4. Skill validates all artifacts against org schema

### Future: GUI

The planned GUI will:
1. Display base schema structure visually
2. Allow adding/configuring org-specific fields
3. Generate composed org schemas
4. Create/edit artifacts with guided forms
5. Validate against org schemas
6. Export JSON for use in other tools

**Key principle**: Skills and GUI produce identical outputs (org schemas, valid artifacts). Migration from skills to GUI requires no data changes.

---

## Standards Compliance

### Separate from Schema Validation

Schema validation checks JSON structure. Standards compliance checks conceptual adherence:

| Check Type | What It Validates |
|------------|-------------------|
| Schema | JSON matches schema structure |
| Standards | Artifact follows conceptual model |

### Standards Compliance Rules

Org schemas must not:
- Remove required fields from base schemas
- Change enumerated value lists (can extend, not restrict)
- Violate relationship requirements (e.g., journeys must reference personas)

Org schemas may:
- Add required fields in `extensions.custom`
- Add optional fields anywhere in `extensions`
- Add stricter validation on optional fields

### Future: Standards Compliance Checker

A separate tool could verify org schemas don't violate standards:

```bash
node tools/validators/check-standards-compliance.js org-schema.json
```

---

## Practical Workflow

### For New Adopters

1. **Start simple**: Use base schemas with `extensions.custom`
2. **Document conventions**: Note which custom fields your org uses
3. **Validate early**: Run validators during creation
4. **Evolve as needed**: Move to org schemas when consistency matters

### For Established Teams

1. **Define requirements**: List org-specific fields needed
2. **Generate org schemas**: Use skill or future GUI
3. **Validate against org schema**: Enforce custom field requirements
4. **Track versions**: Note base schema version in org schema metadata

### When Base Schemas Update

1. **Check changelog**: Review what changed in new version
2. **Test compatibility**: Validate existing artifacts against new schema
3. **Update org schemas**: Regenerate with new base version reference
4. **Migrate if needed**: Use migration scripts for breaking changes

---

## Configuration File (Future)

For teams wanting lightweight consistency without full org schemas:

```json
// .dsds-config.json
{
  "baseSchemaVersion": "1.1.0",
  "customFields": {
    "persona": {
      "required": ["customer_segment", "gdpr_category"],
      "optional": ["internal_id"]
    },
    "role": {
      "required": ["department"],
      "optional": []
    }
  },
  "validation": {
    "strictMode": false,
    "requireResearchSources": false
  }
}
```

This approach:
- Lighter than full org schemas
- Provides consistency checking
- Works with existing validators (enhanced)
- Easy to version control

---

## Summary

| Concept | Recommendation |
|---------|----------------|
| Custom fields location | Always use `extensions.custom` |
| Basic customisation | Use base schemas + conventions |
| Enforced customisation | Generate org schemas with composition |
| Forward compatibility | Rely on `extensions.custom` isolation |
| Tooling path | Skills now → GUI later, same outputs |
| Standards compliance | Separate check from schema validation |

---

## Related Documentation

- [GETTING_STARTED.md](../GETTING_STARTED.md) - Adoption guide
- [SCHEMA_ARCHITECTURE.md](SCHEMA_ARCHITECTURE.md) - Schema design principles
- [v1.1/README.md](../v1.1/README.md) - v1.1 specification overview
