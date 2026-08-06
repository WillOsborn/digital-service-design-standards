# Channel Taxonomy

**Version:** 2.0.0
**Last Updated:** 2026-08-06
**Applies to:** v2.0 (Actor / Mission / Experience)
**Status:** Official Reference

## Overview

This document defines the official channel taxonomy used across all Digital Service Design Schemas. The taxonomy provides a flexible, multi-attribute approach with minimal required fields to lower the barrier to adoption while enabling rich analysis when needed.

**Design Philosophy:** Only `channel` and `serviceModel` are required. All other fields are optional, allowing teams to adopt the level of detail that works for them.

> **Field naming.** v1.1 renamed `channel` to `type`; **v2.0 renamed it back to `channel`** and moved to camelCase (`usageContext`, not `usage_context`). This document describes **v2.0**. The historical sections at the end are kept as a record and deliberately still use the older names.

---

## Quick Start

### Minimal Channel Entry

```json
{
  "channel": "app",
  "serviceModel": "self_service"
}
```

### Full Channel Entry

```json
{
  "channel": "app",
  "serviceModel": "self_service",
  "category": "digital",
  "interaction": "automated",
  "name": "StyleMart App",
  "usageContext": "Product browsing and checkout",
  "ownership": "own"
}
```

---

## `channel` vs `name` — the most important rule

**`channel` holds a *type* from the suggested list. `name` holds the specific instance.**

```json
{ "channel": "app", "name": "Salesforce CRM" }
```

Not `{ "channel": "salesforce" }`. Nothing enforces this — `channel` is a free string, so a product name will validate happily and then quietly break every channel-mix and cost-to-serve analysis, which is the main reason the field exists. One service map reached the point where 8 of its 12 channel entries were unique one-offs and grouping by channel returned nothing.

Two entries may share a type and be distinguished only by `name` — that is correct, not a duplicate:

```json
"channels": [
  { "channel": "app", "name": "StyleMart App",         "usageContext": "Payment processing" },
  { "channel": "app", "name": "Apple Pay / Google Pay", "usageContext": "Biometric authentication" }
]
```

If a channel genuinely is not in the list, use the nearest type and put the specific thing in `name`. Coining a new type is a last resort — see *Extending the taxonomy* below.

---

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `channel` | string | The channel type (see suggested types below) — **not** a product or meeting name |
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
| `usageContext` | string | When and why this channel is used |
| `ownership` | enum | Who owns the channel: `own`, `third_party`, `partner` |

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
| `automated` | No human involved in response | App browsing, scripted chatbot, IVR menu |
| `ai_assisted` | AI responds, or assists the human who does | LLM support agent, AI-drafted replies a human sends |

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

### Mission Node Channels

```json
{
  "laneContent": {
    "channels": [
      {
        "channel": "app",
        "serviceModel": "self_service",
        "category": "digital",
        "name": "StyleMart App",
        "usageContext": "Browsing flash sale products"
      }
    ]
  }
}
```

### Multi-Channel Node

```json
{
  "laneContent": {
    "channels": [
      {
        "channel": "in_person",
        "serviceModel": "managed",
        "category": "physical",
        "name": "Parcel locker",
        "usageContext": "Return drop-off"
      },
      {
        "channel": "app",
        "serviceModel": "self_service",
        "category": "digital",
        "name": "StyleMart App",
        "usageContext": "QR code for locker access"
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
    { "channel": "website", "serviceModel": "self_service" },
    { "channel": "phone", "serviceModel": "managed" },
    { "channel": "email", "serviceModel": "managed" }
  ]
}
```

### Something not in the list

v2.0 has no `custom_type` field. Use the nearest type and let `name` carry the specific thing:

```json
{
  "channel": "in_person",
  "serviceModel": "self_service",
  "category": "physical",
  "name": "Branch ATM",
  "usageContext": "Cash withdrawal and balance check"
}
```

This keeps the ATM visible and legible while still counting as a physical, self-service touchpoint in any analysis.

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

### Channel Schema (v2.0)

As defined in `v2.0/schemas/mission.schema.json` and `v2.0/schemas/actor.schema.json`.
Actor channels additionally carry `preference` (`preferred` | `acceptable` | `avoided`).

```json
{
  "type": "object",
  "properties": {
    "channel": {
      "type": "string",
      "maxLength": 50,
      "description": "Channel type - use a suggested type; put the instance in name"
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
      "enum": ["human", "automated", "ai_assisted"],
      "description": "Whether a human, automation, or AI responds"
    },
    "name": {
      "type": "string",
      "maxLength": 100,
      "description": "Specific instance name"
    },
    "usageContext": {
      "type": "string",
      "maxLength": 200,
      "description": "When and why this channel is used"
    },
    "ownership": {
      "enum": ["own", "third_party", "partner"],
      "description": "Who owns/operates this channel"
    }
  },
  "required": ["channel", "serviceModel"]
}
```

> `additionalProperties` is **not** restricted on this object, so v1.1-shaped keys such as
> `type` or `usage_context` are accepted and then **silently ignored** — the data is lost
> without any validation error. Use the v2.0 names.

---

## Extending the taxonomy

The suggested types are a starting point, not a closed set — `channel` is a free string and
custom values validate. But reach for the nearest existing type first: every bespoke value
fragments channel analysis, and a name like `board-meeting` or `salesforce` is almost always
an instance of `in_person` or `app` wearing the wrong hat.

Coin a new type only when a channel is genuinely a new *kind* of interaction rather than a new
instance of an existing one. If you do, add it here so others use the same spelling.

**Spelling:** lower `snake_case`, matching the suggested types (`video_call`, not `video-call`
or `videoCall`). The field is unconstrained, so nothing will reject a variant — it will just
quietly split your analysis in two.

---

## Migration from Previous Versions

> The subsections below are a **historical record**. They describe earlier field names and
> deliberately use them. For current guidance see the top of this document.

### From v1.1 (to v2.0)

| v1.1 Field | v2.0 Field | Notes |
|-----------|-----------|-------|
| `type` | `channel` | Renamed back to `channel` |
| `usage_context` | `usageContext` | camelCase |
| `custom_type` | *(removed)* | Use the nearest type; put the specific instance in `name` |
| `category` | `category` | Unchanged — `digital`, `telecom`, `physical` |
| `serviceModel` | `serviceModel` | Unchanged |
| `interaction` | `interaction` | Adds `ai_assisted` |
| `name`, `ownership` | unchanged | |

**Watch for:** the v2.0 channel object does not restrict `additionalProperties`, so a
leftover `type` or `usage_context` key validates and is then ignored. Converting with
`tools/converters/convert-v1.1-to-v2.0.js` handles the renames, normalises legacy channel
spellings, and infers `telecom` for voice and video channels that v1.1 could only record as
`digital` or `non_digital`.

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

- Start with just `channel` and `serviceModel` - add detail as needed
- Use descriptive `name` values for specific channel instances
- Include `usageContext` to explain why this channel at this step
- Use categories for cross-mission analysis
- Categorise by cost to serve, not by which team builds the technology

### DON'T

- Force all fields if they don't add value
- **Put a product, platform, or meeting name in `channel`** - that belongs in `name`
- Create custom types for channels already in the suggested list
- Mix spellings - `video_call`, never `video-call`
- Overthink category assignment - it's for analysis, not precision

---

## Version History

### Version 2.0.0 (2026-08-06)

- **Retargeted to v2.0.** This document described v1.1 field names while v2.0 was the active
  version, so its opening example was invalid for the schema it was meant to explain.
- **Renamed:** `type` → `channel` (v2.0 reverts the v1.1 rename), `usage_context` → `usageContext`
- **Removed:** `custom_type` — no such field in v2.0; use the nearest type plus `name`
- **New:** the `channel` vs `name` rule, guidance on extending the taxonomy, and snake_case spelling
- **Clarified:** categories follow **cost to serve**, not who builds the technology; the
  `digital`/`telecom` line is **synchronous human attention**, not transport — so `video_call`
  is telecom, while email and chat are digital
- **Added:** `ai_assisted` to `interaction`

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
