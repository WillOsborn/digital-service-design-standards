# Migration Guide: v1.0.1 to v1.0.2

**Target Audience:** Organizations upgrading existing persona implementations
**Migration Type:** Non-breaking data upgrade, breaking schema architecture change
**Estimated Effort:** Low (30-60 minutes for automated conversion)

---

## Executive Summary

Version 1.0.2 maintains the same 9-field persona system but restructures how schemas are organized and where fields are located. The data model is **backward compatible** - v1.0.1 persona data can be mechanically converted to v1.0.2.

**Key Changes:**
1. Self-contained schemas (no $ref inheritance)
2. Field reorganization (extended_attributes)
3. Terminology updates (removed "enhanced")
4. New CSV export layer

---

## What Changed

### 1. Schema Architecture

**v1.0.1:**
```
persona-base.json (shared fields)
    ↑
    | $ref
    |
business-persona.json (extends base)
consumer-persona.json (extends base)
employee-persona.json (extends base)
```

**v1.0.2:**
```
business-persona.json (complete, standalone)
consumer-persona.json (complete, standalone)
employee-persona.json (complete, standalone)
```

**Impact:** You no longer need to distribute or reference persona-base.json. Each schema is complete and self-contained.

**Action Required:** Use the appropriate schema file for validation. No changes to persona data.

---

### 2. Field Organization

#### Core Attributes (No Change)

These remain in `core_attributes`:
- `goals`
- `pain_points`
- `motivations`
- `experience_level`

#### Moved to Extended Attributes

**v1.0.1 location:** `core_attributes.*`
**v1.0.2 location:** `extended_attributes.*`

Fields moved:
- `channels`
- `moments_that_matter`
- `barriers`
- `use_cases`
- `success_metrics`

**Example Migration:**

```json
// v1.0.1
{
  "core_attributes": {
    "goals": [...],
    "pain_points": [...],
    "motivations": [...],
    "channels": [...],
    "moments_that_matter": [...],
    "barriers": [...],
    "use_cases": [...],
    "success_metrics": [...],
    "experience_level": "advanced"
  }
}

// v1.0.2
{
  "core_attributes": {
    "goals": [...],
    "pain_points": [...],
    "motivations": [...],
    "experience_level": "advanced"
  },
  "extended_attributes": {
    "channels": [...],
    "moments_that_matter": [...],
    "barriers": [...],
    "use_cases": [...],
    "success_metrics": [...]
  }
}
```

---

### 3. Type-Specific Context Location

**v1.0.1:** Type-specific fields were under `extensions.*`
**v1.0.2:** Type-specific fields are at top level

#### Business Personas

```json
// v1.0.1
{
  "extensions": {
    "business_context": {...},
    "decision_making": {...}
  }
}

// v1.0.2
{
  "business_context": {...},
  "decision_making": {...},
  "extensions": {
    "custom": {},
    "legacy": {}
  }
}
```

#### Consumer Personas

```json
// v1.0.1
{
  "extensions": {
    "demographics": {...},
    "lifestyle": {...}
  }
}

// v1.0.2
{
  "demographics": {...},
  "lifestyle": {...},
  "extensions": {
    "custom": {},
    "legacy": {}
  }
}
```

#### Employee Personas

```json
// v1.0.1
{
  "extensions": {
    "work_context": {...}
  }
}

// v1.0.2
{
  "work_context": {...},
  "extensions": {
    "custom": {},
    "legacy": {}
  }
}
```

---

### 4. Field Name Changes

| v1.0.1 Field | v1.0.2 Field | Location |
|--------------|--------------|----------|
| `emotional_state` | `emotional_intensity` | `moments_that_matter` |
| `impact_level` | `impact` | `barriers` |
| `workaround` | `workarounds` | `barriers` |
| `context` | `current_experience` | `moments_that_matter` |

**Example:**

```json
// v1.0.1
{
  "moments_that_matter": [
    {
      "moment": "RFP process",
      "emotional_state": -1,
      "importance": "critical",
      "context": "High stress due to compliance"
    }
  ],
  "barriers": [
    {
      "barrier": "Complex approvals",
      "type": "process",
      "impact_level": 4,
      "workaround": "Build business cases"
    }
  ]
}

// v1.0.2
{
  "moments_that_matter": [
    {
      "moment": "RFP process",
      "emotional_intensity": -1,
      "importance": "critical",
      "current_experience": "High stress due to compliance"
    }
  ],
  "barriers": [
    {
      "barrier": "Complex approvals",
      "type": "process",
      "impact": "Delays decisions by 2-3 months",
      "workarounds": "Build business cases"
    }
  ]
}
```

**Note:** `barriers.impact` changed from integer (1-5) to descriptive string.

---

### 5. Use Cases & Success Metrics Structure

**v1.0.1:** Arrays of strings
**v1.0.2:** Arrays of objects

```json
// v1.0.1
{
  "use_cases": [
    "Evaluating cloud migration solutions",
    "Assessing cybersecurity tools"
  ],
  "success_metrics": [
    "System uptime percentage",
    "Cost reduction achieved"
  ]
}

// v1.0.2
{
  "use_cases": [
    {
      "scenario": "Evaluating cloud migration solutions"
    },
    {
      "scenario": "Assessing cybersecurity tools"
    }
  ],
  "success_metrics": [
    {
      "metric": "System uptime percentage"
    },
    {
      "metric": "Cost reduction achieved"
    }
  ]
}
```

**Benefit:** Allows optional fields like `trigger`, `target`, and `current_state` for richer data.

---

### 6. Channel Type Taxonomy

**v1.0.1:** 10 channel types
**v1.0.2:** 5 channel types (consolidated)

| v1.0.1 Type | v1.0.2 Type | Notes |
|-------------|-------------|-------|
| `digital` | `digital` | Unchanged |
| `physical` | `physical` | Unchanged |
| `social` | `digital` | Social networks are digital channels |
| `media` | `digital` | Media is digital |
| `direct` | `digital` or `human` | Context-dependent |
| `in_person_events` | `physical` | In-person is physical |
| `self_service_digital` | `self_service` | Simplified |
| `personal_interaction` | `human` | Face-to-face or voice |
| `mobile_app` | `digital` | Apps are digital |
| `social_recommendations` | `digital` | Social is digital |

**Migration Logic:**
```javascript
const typeMapping = {
  'digital': 'digital',
  'physical': 'physical',
  'social': 'digital',
  'media': 'digital',
  'direct': 'digital', // or 'human' if context indicates
  'in_person_events': 'physical',
  'self_service_digital': 'self_service',
  'personal_interaction': 'human',
  'mobile_app': 'digital',
  'social_recommendations': 'digital'
};
```

---

### 7. Channel Preference Levels

| v1.0.1 | v1.0.2 |
|--------|--------|
| `primary` | `preferred` |
| `secondary` | `acceptable` |
| `occasional` | `avoided` |

---

### 8. Schema Info Changes

**Added field:**
```json
{
  "schema_info": {
    "version": "1.0.2",
    "standard": "Service Design Persona Standard v1.0",  // NEW
    "persona_type": "business",
    "last_updated": "2025-11-25"
  }
}
```

---

### 9. Extensions Structure

**v1.0.1:**
```json
{
  "extensions": {
    "business_context": {...},
    "decision_making": {...},
    "legacy_fields": {...},
    "custom_fields": "..."
  }
}
```

**v1.0.2:**
```json
{
  "business_context": {...},  // Promoted to top level
  "decision_making": {...},   // Promoted to top level
  "extensions": {
    "custom": {},              // Namespaced org-specific fields
    "legacy": {}               // Migrated fields from old formats
  }
}
```

---

## Migration Checklist

### For Each Persona File:

- [ ] Update `schema_info.version` to `"1.0.2"`
- [ ] Add `schema_info.standard` = `"Service Design Persona Standard v1.0"`
- [ ] Move `channels` from `core_attributes` to `extended_attributes`
- [ ] Move `moments_that_matter` from `core_attributes` to `extended_attributes`
- [ ] Move `barriers` from `core_attributes` to `extended_attributes`
- [ ] Move `use_cases` from `core_attributes` to `extended_attributes`
- [ ] Move `success_metrics` from `core_attributes` to `extended_attributes`
- [ ] Rename `emotional_state` to `emotional_intensity` in moments_that_matter
- [ ] Rename `context` to `current_experience` in moments_that_matter
- [ ] Rename `impact_level` to `impact` in barriers (change from int to string)
- [ ] Rename `workaround` to `workarounds` in barriers
- [ ] Convert `use_cases` from string array to object array
- [ ] Convert `success_metrics` from string array to object array
- [ ] Map channel types from 10-type to 5-type taxonomy
- [ ] Map channel preference levels (primary→preferred, etc.)
- [ ] Move type-specific context to top level (business_context, demographics, work_context)
- [ ] Restructure `extensions` to have `custom` and `legacy` subfields
- [ ] Validate against new schema

---

## Automated Migration Script

### Python Example

```python
import json

def migrate_persona_v1_to_v1_0_2(persona):
    """Migrate a v1.0.1 persona to v1.0.2 format"""

    # Update schema_info
    persona['schema_info']['version'] = '1.0.2'
    persona['schema_info']['standard'] = 'Service Design Persona Standard v1.0'

    # Create extended_attributes section
    persona['extended_attributes'] = {}

    # Move fields from core_attributes to extended_attributes
    fields_to_move = ['channels', 'moments_that_matter', 'barriers',
                      'use_cases', 'success_metrics']

    for field in fields_to_move:
        if field in persona['core_attributes']:
            persona['extended_attributes'][field] = persona['core_attributes'].pop(field)

    # Update moments_that_matter field names
    if 'moments_that_matter' in persona['extended_attributes']:
        for moment in persona['extended_attributes']['moments_that_matter']:
            if 'emotional_state' in moment:
                moment['emotional_intensity'] = moment.pop('emotional_state')
            if 'context' in moment:
                moment['current_experience'] = moment.pop('context')

    # Update barriers field names
    if 'barriers' in persona['extended_attributes']:
        for barrier in persona['extended_attributes']['barriers']:
            if 'impact_level' in barrier:
                # Convert from integer to descriptive string
                level = barrier.pop('impact_level')
                barrier['impact'] = f"Impact level {level}"
            if 'workaround' in barrier:
                barrier['workarounds'] = barrier.pop('workaround')

    # Convert use_cases to object array
    if 'use_cases' in persona['extended_attributes']:
        persona['extended_attributes']['use_cases'] = [
            {'scenario': uc} for uc in persona['extended_attributes']['use_cases']
        ]

    # Convert success_metrics to object array
    if 'success_metrics' in persona['extended_attributes']:
        persona['extended_attributes']['success_metrics'] = [
            {'metric': sm} for sm in persona['extended_attributes']['success_metrics']
        ]

    # Map channel types
    channel_type_map = {
        'social': 'digital',
        'media': 'digital',
        'direct': 'digital',
        'in_person_events': 'physical',
        'self_service_digital': 'self_service',
        'personal_interaction': 'human',
        'mobile_app': 'digital',
        'social_recommendations': 'digital'
    }

    if 'channels' in persona['extended_attributes']:
        for channel in persona['extended_attributes']['channels']:
            if channel['type'] in channel_type_map:
                channel['type'] = channel_type_map[channel['type']]

    # Map preference levels
    preference_map = {
        'primary': 'preferred',
        'secondary': 'acceptable',
        'occasional': 'avoided'
    }

    if 'channels' in persona['extended_attributes']:
        for channel in persona['extended_attributes']['channels']:
            if 'preference_level' in channel and channel['preference_level'] in preference_map:
                channel['preference_level'] = preference_map[channel['preference_level']]

    # Move type-specific context to top level
    if 'extensions' in persona:
        for field in ['business_context', 'decision_making', 'demographics',
                     'lifestyle', 'work_context']:
            if field in persona['extensions']:
                persona[field] = persona['extensions'].pop(field)

        # Restructure extensions
        legacy_data = persona['extensions'].pop('legacy_fields', {})
        custom_data = {}

        # Move remaining extension fields to legacy
        remaining = dict(persona['extensions'])
        persona['extensions'] = {
            'custom': custom_data,
            'legacy': {**legacy_data, **remaining}
        }

    return persona

# Usage
with open('persona-v1.0.1.json', 'r') as f:
    old_persona = json.load(f)

new_persona = migrate_persona_v1_to_v1_0_2(old_persona)

with open('persona-v1.0.2.json', 'w') as f:
    json.dump(new_persona, f, indent=2)
```

---

## Validation

After migration, validate against the new schemas:

```bash
# Using ajv-cli
ajv validate -s schemas/business-persona.json -d examples/persona.json
```

Or use online validators:
- https://www.jsonschemavalidator.net/

---

## Rollback Strategy

If you need to revert to v1.0.1:

1. **Data is mostly compatible** - The core fields haven't changed
2. **Reverse field movements** - Move extended_attributes back to core_attributes
3. **Restore old field names** - emotional_intensity → emotional_state, etc.
4. **Reconvert arrays** - Objects back to strings for use_cases and success_metrics

However, **we recommend upgrading** as v1.0.2 provides better tool compatibility and clearer organization.

---

## Support

Questions about migration?
- Review examples in `/examples/` directory
- Check ARCHITECTURE_DECISIONS.md for rationale
- Submit issues to repository

---

## Summary Table: All Changes

| Change Type | v1.0.1 | v1.0.2 | Breaking? |
|-------------|--------|--------|-----------|
| Schema architecture | Inheritance | Self-contained | Yes (schema) |
| channels location | core_attributes | extended_attributes | Yes |
| barriers location | core_attributes | extended_attributes | Yes |
| use_cases location | core_attributes | extended_attributes | Yes |
| success_metrics location | core_attributes | extended_attributes | Yes |
| moments_that_matter location | core_attributes | extended_attributes | Yes |
| business_context location | extensions | top-level | Yes |
| demographics location | extensions | top-level | Yes |
| work_context location | extensions | top-level | Yes |
| emotional_state field | emotional_state | emotional_intensity | Yes |
| barriers.impact_level | integer | string | Yes |
| barriers.workaround | workaround | workarounds | Yes |
| moments.context | context | current_experience | Yes |
| use_cases format | string[] | object[] | Yes |
| success_metrics format | string[] | object[] | Yes |
| channel types | 10 types | 5 types | Yes |
| preference levels | primary/secondary/occasional | preferred/acceptable/avoided | Yes |
| schema_info.standard | n/a | required field | No (new) |
| extensions structure | flat | custom/legacy | Yes |
