# Channel Taxonomy

**Version:** 1.1.0
**Last Updated:** 2026-01-15
**Status:** Official Reference

## Overview

This document defines the official channel taxonomy used across all Digital Service Design Schemas. The taxonomy provides a flexible, multi-attribute approach with minimal required fields to lower the barrier to adoption while enabling rich analysis when needed.

**Design Philosophy:** Only `type` and `serviceModel` are required. All other fields are optional, allowing teams to adopt the level of detail that works for them.

---

## Quick Start

### Minimal Channel Entry

```json
{
  "type": "app",
  "serviceModel": "self_service"
}
```

### Full Channel Entry

```json
{
  "type": "app",
  "serviceModel": "self_service",
  "category": "digital",
  "interaction": "automated",
  "name": "StyleMart App",
  "usage_context": "Product browsing and checkout",
  "ownership": "own"
}
```

---

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | The specific channel type (see suggested types below, or use custom) |
| `serviceModel` | enum | Who controls the interaction: `self_service`, `managed`, or `both` |

### Service Model Definitions

| Value | Definition | Examples |
|-------|------------|----------|
| `self_service` | User controls the interaction | Browsing website, using app, checking tracking |
| `managed` | Staff controls the interaction | Phone support call, in-store assistance |
| `both` | Either user or staff can lead | Chat that can be self-service or escalate to human |

---

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `category` | enum | High-level grouping: `digital`, `telecom`, `physical` |
| `interaction` | enum | Whether response is `human` or `automated` |
| `name` | string | Specific instance name (e.g., "StyleMart App") |
| `usage_context` | string | When and why this channel is used |
| `ownership` | enum | Who owns the channel: `own`, `third_party`, `partner` |
| `custom_type` | string | Description when using non-standard types |

---

## Suggested Channel Types

Use these common types, or define your own. Custom types are fully supported.

### Digital Channels

Owned by digital teams. Lowest cost to serve at scale.

| Type | Description |
|------|-------------|
| `website` | Web browser-based interactions |
| `app` | Mobile or desktop applications |
| `email` | Email communications |
| `chat` | Live chat or chatbot interactions |
| `social_media` | Social platform interactions |
| `messaging_app` | WhatsApp, Messenger, etc. |
| `push_notification` | Mobile or web push notifications |

### Telecom Channels

Typically *staffed* by contact centres, whoever owns the underlying technology.
Medium cost to serve.

| Type | Description |
|------|-------------|
| `phone` | Voice telephone calls |
| `sms` | Text message communications |
| `video_call` | Video conferencing (Zoom, Teams, etc.) |

### Physical Channels

Owned by branch/ops teams. Highest cost to serve.

| Type | Description |
|------|-------------|
| `in_person` | Face-to-face interactions at locations |
| `post` | Physical mail (letters, parcels) |
| `print` | Printed materials (brochures, signage) |

---

## Channel Categories

Categories provide high-level grouping useful for ownership analysis and cost-to-serve prioritisation.

| Category | Definition | Typical Owner | Cost Profile |
|----------|------------|---------------|--------------|
| `digital` | Apps, websites, online platforms, and asynchronous messaging (connected or offline) | Digital team | Lowest - highly scalable |
| `telecom` | Real-time conversation at a distance - voice, SMS, and video calls | Contact centre | Medium - often human involvement |
| `physical` | Locations, staff presence, or tangible materials | Branch/Ops | Highest - property, staff, logistics |

**Categorise by cost to serve, not by who builds the technology.** These can
diverge. A video call runs on software the digital team owns, but the person on
the other end is usually sitting in the contact centre - so its cost profile is
telecom, not digital, and `video_call` is categorised `telecom`. Ask "what does
one more of these cost us?" rather than "which team maintains it?"

The dividing line between `digital` and `telecom` is **synchronous human
attention**, not the underlying transport. Email and chat are `digital` because
they queue and batch; a voice or video call occupies one person for its whole
duration whether it travels over a telephone network or the internet.

### When to Use Categories

Categories are optional but valuable for:

- **Ownership analysis**: "Which team owns this touchpoint?"
- **Cost analysis**: "What's our channel mix by cost-to-serve?"
- **Digital transformation**: "What percentage of interactions are digital?"
- **Service design**: "Are we over-reliant on high-cost channels?"

---

## Interaction Type

The `interaction` field captures whether a human responds.

| Value | Definition | Examples |
|-------|------------|----------|
| `human` | A human responds or assists | Phone call with agent, in-store staff |
| `automated` | No human involved in response | App browsing, chatbot, IVR menu |

### Why Track Interaction Type

- **Customer experience**: Some customers prefer human contact
- **Capacity planning**: Human channels have capacity constraints
- **Cost analysis**: Automated channels typically cost less per interaction

---

## Ownership

The `ownership` field tracks who operates the channel.

| Value | Definition | Examples |
|-------|------------|----------|
| `own` | Your organisation owns and operates | Your website, your app, your stores |
| `third_party` | External provider operates | Carrier delivery, banking app verification |
| `partner` | Jointly operated or partnered | Partner lockers, affiliate sites |

---

## Usage Examples

### Journey Step Channels

```json
{
  "lane_content": {
    "channels": [
      {
        "type": "app",
        "serviceModel": "self_service",
        "category": "digital",
        "name": "StyleMart App",
        "usage_context": "Browsing flash sale products"
      }
    ]
  }
}
```

### Multi-Channel Step

```json
{
  "lane_content": {
    "channels": [
      {
        "type": "in_person",
        "serviceModel": "managed",
        "category": "physical",
        "name": "Parcel locker",
        "usage_context": "Return drop-off"
      },
      {
        "type": "app",
        "serviceModel": "self_service",
        "category": "digital",
        "name": "StyleMart App",
        "usage_context": "QR code for locker access"
      }
    ]
  }
}
```

### Minimal Entries

For teams wanting quick documentation:

```json
{
  "channels": [
    { "type": "website", "serviceModel": "self_service" },
    { "type": "phone", "serviceModel": "managed" },
    { "type": "email", "serviceModel": "managed" }
  ]
}
```

### With Custom Type

```json
{
  "type": "atm",
  "serviceModel": "self_service",
  "category": "physical",
  "custom_type": "Automated teller machine for banking transactions",
  "name": "Branch ATM",
  "usage_context": "Cash withdrawal and balance check"
}
```

---

## Common Channel Patterns

### E-Commerce Purchase Journey

```
push_notification (digital) → app (digital) → email (digital) → in_person (physical)
```

### Customer Support Escalation

```
chat/automated (digital) → chat/human (digital) → phone (telecom) → in_person (physical)
```

### B2B Sales Cycle

```
website (digital) → email (digital) → video_call (telecom) → in_person (physical)
```

---

## Schema Definition

### Journey Channel Schema (v1.1)

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "description": "Channel type - use suggested types or custom"
    },
    "serviceModel": {
      "enum": ["self_service", "managed", "both"],
      "description": "Who controls the interaction"
    },
    "category": {
      "enum": ["digital", "telecom", "physical"],
      "description": "High-level grouping for ownership and cost analysis"
    },
    "interaction": {
      "enum": ["human", "automated"],
      "description": "Whether a human responds"
    },
    "name": {
      "type": "string",
      "maxLength": 100,
      "description": "Specific instance name"
    },
    "usage_context": {
      "type": "string",
      "maxLength": 200,
      "description": "When and why this channel is used"
    },
    "ownership": {
      "enum": ["own", "third_party", "partner"],
      "description": "Who owns/operates this channel"
    },
    "custom_type": {
      "type": "string",
      "maxLength": 50,
      "description": "Custom type description"
    }
  },
  "required": ["type", "serviceModel"]
}
```

---

## Migration from Previous Versions

### From v1.0.2 (3-category/7-type system)

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `channel` | `type` | Direct rename |
| `medium: "digital"` | `category: "digital"` | Optional now |
| `medium: "non_digital"` | `category: "physical"` or `"telecom"` | Choose based on context |
| `custom_channel` | `custom_type` | Rename |
| `name` | `name` | Unchanged |
| `usage_context` | `usage_context` | Unchanged |
| `serviceModel` | `serviceModel` | Unchanged |

### Breaking Changes

- `channel` field renamed to `type`
- `medium` field removed (use `category` instead)
- Required fields reduced from 3 (`channel`, `medium`, `serviceModel`) to 2 (`type`, `serviceModel`)

### Example Migration

**Before (v1.0.2):**
```json
{
  "channel": "app",
  "medium": "digital",
  "serviceModel": "self_service",
  "name": "StyleMart App",
  "usage_context": "Product browsing"
}
```

**After (v1.1):**
```json
{
  "type": "app",
  "serviceModel": "self_service",
  "category": "digital",
  "name": "StyleMart App",
  "usage_context": "Product browsing"
}
```

---

## Best Practices

### DO

- Start with just `type` and `serviceModel` - add detail as needed
- Use descriptive `name` values for specific channel instances
- Include `usage_context` to explain why this channel at this step
- Use categories for cross-journey analysis

### DON'T

- Force all fields if they don't add value
- Create custom types for channels already in the suggested list
- Overthink category assignment - it's for analysis, not precision

---

## Version History

### Version 1.1.0 (2026-01-15)

- **Breaking:** Renamed `channel` to `type`, removed `medium`
- **Simplified:** Only `type` and `serviceModel` required
- **New categories:** `digital`, `telecom`, `physical` (based on ownership/cost)
- **New fields:** `interaction`, `ownership`
- **Updated suggested types:** Added `messaging_app`, `push_notification`; removed `kiosk`, `signage`

### Version 1.0.2 (2025-11-28)

- 3-category/7-type taxonomy with `channel`, `medium`, `serviceModel` required

### Version 1.0.1 (2025-10-11)

- 10-type taxonomy

### Version 1.0.0 (2024-09-30)

- Initial 5-type taxonomy

---

## Related Documentation

- [SERVICE-DESIGN-JOURNEY-STANDARD.md](../v1.1/SERVICE-DESIGN-JOURNEY-STANDARD.md) - Journey specification
- [SERVICE-DESIGN-PERSONA-STANDARD.md](../v1.1/SERVICE-DESIGN-PERSONA-STANDARD.md) - Persona specification
- [BARRIER_TAXONOMY.md](BARRIER_TAXONOMY.md) - Barrier type definitions

---

**This is the authoritative reference for channel types. The taxonomy is designed to be simple to adopt while enabling rich analysis when needed.**
