# Service Design Journey Standard v1.1

## Customer Journey Schema

**Version:** 1.1.0
**Last Updated:** 2026-01-15
**Status:** Official Standard

---

## Overview

The Journey schema documents customer experiences over time, capturing actions, emotions, barriers, and opportunities across phases and steps. In v1.1, journeys integrate with the compositional persona model.

### What Changed from v1.0.x

| v1.0.x Approach | v1.1 Approach |
|-----------------|---------------|
| `persona_id` references typed persona | `personaRef` references Core Persona |
| Persona contains all context | `roleRefs` specify active role(s) |
| Single artifact reference | Optional `pairingRef` for summary card |

---

## Understanding Journey Lanes

### What Are Lanes?

Lanes (also called swimlanes) are horizontal rows that run across all steps of a journey. Each lane captures a specific type of information, making it easy to compare that dimension across the entire journey.

Think of lanes like rows in a spreadsheet where:
- Columns = journey steps
- Rows = different types of information (emotions, channels, barriers, etc.)

### Standard Lane Types

The schema supports these lane types:

| Type | Purpose | Example Content |
|------|---------|-----------------|
| `text` | Free-form descriptions | Actions, thoughts, internal dialogue |
| `list` | Multiple items | Touchpoints, systems involved |
| `metric` | Measurable values | Duration, cost, effort score |
| `emotion` | Emotional state | Satisfaction score (-2 to +2) |
| `barrier` | Friction points | Barriers from the 9-type taxonomy |
| `channel` | Communication channels | Website, app, phone, in-person |
| `reference` | Links to other artifacts | Persona ID, role ID |

### Standard vs Custom Lanes

**Standard lanes** are expected in every journey:
- Actions/activities (what the user does)
- Thoughts (what they're thinking)
- Emotions (how they feel)
- Channels (where they interact)
- Barriers (what blocks them)

**Custom lanes** are organization-specific:
- Systems (internal systems involved)
- Compliance (regulatory checkpoints)
- Cost (cost to serve at each step)
- KPIs (measurable outcomes)

### Defining Lanes in Schema

```json
"lanes": {
  "standard": [
    {"id": "actions", "label": "Actions", "type": "text"},
    {"id": "emotions", "label": "Emotions", "type": "emotion"},
    {"id": "barriers", "label": "Barriers", "type": "barrier"}
  ],
  "custom": [
    {"id": "systems", "label": "Systems Involved", "type": "list"}
  ]
}
```

---

## Context References

The key v1.1 change is how journeys reference personas and roles.

### Previous (v1.0.x)

```json
"context": {
  "persona_id": "sarah-martinez-working-mom-consumer",
  "persona_context": "Sarah is a 32-year-old working mom..."
}
```

### New (v1.1)

```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"],
  "pairingRef": "pairing-sarah-working-mom",
  "persona_context": "Sarah is a 32-year-old working mom..."
}
```

---

## Reference Options

### Option 1: Simple Approach

For teams not using the compositional model, reference just the persona:

```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "persona_context": "Sarah's behavioural tendencies as they apply to this journey..."
}
```

The persona may contain role content in its extensions.

### Option 2: Compositional Approach

Reference persona and role(s) directly:

```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"],
  "persona_context": "This journey explores how Sarah's behavioural tendencies interact with the demands of being a working mom consumer..."
}
```

This enables queries like:
- "Show all journeys for Role: Working Mom Consumer"
- "Show all journeys for Persona: Sarah Martinez"

### Option 3: With Formal Pairing

Reference persona, role(s), and an existing pairing:

```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"],
  "pairingRef": "pairing-sarah-working-mom",
  "persona_context": "See the pairing for synthesis; this journey explores the detailed experience..."
}
```

The pairing serves as a summary card alongside the detailed journey.

---

## Persona Context Field

The `persona_context` field provides narrative context regardless of which reference approach is used.

**Good practice in v1.1:**
- Explain how behavioural tendencies interact with role demands
- Reference the compositional model where helpful
- Keep it relevant to this specific journey

```json
"persona_context": "Sarah is a 32-year-old working mom in Austin who values convenience and quality. This journey explores how her thorough research habits (persona) interact with the time constraints of the Working Mom Consumer role, particularly around sizing uncertainty and trust concerns."
```

---

## Channel Documentation

Journey channels document where interactions happen at each step. v1.1 uses a simplified schema with only `type` and `serviceModel` required.

### Channel Schema

```json
"channels": [
  {
    "type": "app",
    "serviceModel": "self_service",
    "category": "digital",
    "name": "StyleMart App",
    "usage_context": "Product browsing"
  }
]
```

### Required Fields

| Field | Values | Description |
|-------|--------|-------------|
| `type` | string | Channel type (e.g., website, app, phone, in_person) |
| `serviceModel` | `self_service`, `managed`, `both` | Who controls the interaction |

### Optional Fields

| Field | Values | Description |
|-------|--------|-------------|
| `category` | `digital`, `telecom`, `physical` | Ownership/cost grouping |
| `interaction` | `human`, `automated` | Whether a human responds |
| `name` | string | Specific instance name |
| `usage_context` | string | Why this channel at this step |
| `ownership` | `own`, `third_party`, `partner` | Who operates the channel |
| `custom_type` | string | Description for non-standard types |

### Suggested Channel Types

**Digital:** website, app, email, chat, social_media, messaging_app, push_notification
**Telecom:** phone, sms, video_call
**Physical:** in_person, post, print

See [CHANNEL_TAXONOMY.md](../documentation/CHANNEL_TAXONOMY.md) for complete reference.

---

## Barriers with Emergence

In v1.1, journey barriers can include an `emergesFrom` field to explain persona-role interaction:

```json
"barriers": [
  {
    "type": "knowledge",
    "description": "Sizing information didn't adequately predict fit for her body type",
    "severity": 4,
    "workarounds": "None available at this point",
    "emergesFrom": "Sarah's thorough research couldn't overcome the inherent limitations of online clothing shopping"
  }
]
```

This connects journey friction to the compositional model.

---

## Backward Compatibility

v1.1 maintains backward compatibility:

- The `persona_id` field is deprecated but still accepted
- Journeys without `roleRefs` are valid (simple approach)
- Existing v1.0.x journeys validate against v1.1 schema

---

## Full Context Schema

```json
"context": {
  "personaRef": {
    "type": "string",
    "pattern": "^persona-[a-z0-9_-]+$",
    "description": "Reference to a Core Persona ID"
  },
  "roleRefs": {
    "type": "array",
    "items": {
      "type": "string",
      "pattern": "^role-[a-z0-9_-]+$"
    },
    "description": "References to one or more Role Card IDs"
  },
  "pairingRef": {
    "type": "string",
    "pattern": "^pairing-[a-z0-9_-]+$",
    "description": "Optional reference to a pre-defined Pairing ID"
  },
  "persona_id": {
    "type": "string",
    "description": "DEPRECATED: Legacy persona ID for v1.0.x compatibility"
  },
  "persona_context": {
    "type": "string",
    "description": "Narrative context for this journey"
  },
  "use_case": {...},
  "scope": {...},
  "as_is": {...},
  "timeframe": {...},
  "success_criteria": {...}
}
```

---

## Quality Checklist

**References:**
- [ ] Uses `personaRef` (not deprecated `persona_id`)
- [ ] `personaRef` uses correct `persona-` prefix
- [ ] `roleRefs` use correct `role-` prefix (if used)
- [ ] `pairingRef` uses correct `pairing-` prefix (if used)

**Persona Context:**
- [ ] Explains how persona tendencies affect this journey
- [ ] References role context if using compositional approach
- [ ] Provides useful narrative for journey consumers

**Barriers (where applicable):**
- [ ] Uses valid barrier types from taxonomy
- [ ] Includes `emergesFrom` for persona-role interactions
- [ ] Connects friction to compositional model

---

## Migration from v1.0.x

1. Change `persona_id` to `personaRef` with `persona-` prefix
2. Add `roleRefs` if using compositional approach
3. Update `persona_context` to reference compositional model
4. Optionally add `emergesFrom` to barrier entries
5. Update `schema_info` version to `1.1.0`

See [migration-guide.md](migration-guide.md) for detailed instructions.

---

## Unchanged Elements

The following journey elements remain unchanged from v1.0.x:

- **Lanes** - Standard and custom lane definitions
- **Phases** - High-level journey stages
- **Steps** - Detailed actions within phases
- **Lane Content** - Actions, thoughts, emotions, channels, barriers, opportunities
- **Moments That Matter** - Critical emotional touchpoints
- **Validation** - Research sources and confidence

---

## Related Documentation

- [SERVICE-DESIGN-PERSONA-STANDARD.md](SERVICE-DESIGN-PERSONA-STANDARD.md) - Core Persona specification
- [SERVICE-DESIGN-ROLE-CARD-STANDARD.md](SERVICE-DESIGN-ROLE-CARD-STANDARD.md) - Role Card specification
- [SERVICE-DESIGN-PAIRING-STANDARD.md](SERVICE-DESIGN-PAIRING-STANDARD.md) - Pairing specification
- [BARRIER_TAXONOMY.md](../documentation/BARRIER_TAXONOMY.md) - Barrier types reference
