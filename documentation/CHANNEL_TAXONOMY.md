# Channel Taxonomy

**Version:** 1.0.2
**Last Updated:** 2025-11-28
**Status:** Official Reference

## Overview

This document defines the official channel taxonomy used across all Digital Service Design Schemas. The taxonomy uses a two-level system: **3 broad categories** for analysis and **7 standard types** for specific channel classification, with extensibility for organization-specific needs.

---

## The Channel Taxonomy System

### Three-Level Architecture

1. **Categories** - Broad groupings for analysis (digital, physical, direct)
2. **Standard Types** - 7 common channel types covering most use cases
3. **Custom Extensions** - Organization-specific types when needed

---

## Channel Categories

The three categories provide high-level grouping for cross-channel analysis:

| Category | Definition | Purpose |
|----------|------------|---------|
| **digital** | Online and electronic interactions | Website browsing, app usage, social media engagement |
| **physical** | In-person and tangible touchpoints | Face-to-face meetings, physical locations, printed materials |
| **direct** | One-to-one communication channels | Email, phone, personal messaging |

---

## Standard Channel Types

### The 7 Standard Types

| Type | Category | Definition | Common Examples |
|------|----------|------------|-----------------|
| **website** | digital | Web browser-based interactions | Company websites, web portals, online platforms |
| **app** | digital | Native mobile or tablet applications | Mobile apps, desktop applications |
| **social_media** | digital | Social networking platforms | Facebook, LinkedIn, Instagram, Twitter/X |
| **email** | direct | Email communication | Marketing emails, personal correspondence, newsletters |
| **phone** | direct | Voice telephone calls | Customer service calls, sales calls, support hotlines |
| **in_person** | physical | Face-to-face interactions | Meetings, conferences, in-store visits |
| **post** | physical | Physical mail and printed materials | Letters, brochures, catalogs |

### Extension Type

| Type | Category | Usage |
|------|----------|-------|
| **other** | Any | Used with `custom_type` field for organization-specific channels |

---

## Custom Channel Extensions

When the 7 standard types don't cover a specific need, organizations can add custom channel types:

### How to Use Custom Types

```json
{
  "name": "Customer Service SMS Alerts",
  "category": "direct",
  "type": "other",
  "custom_type": "sms",
  "usage_context": "Appointment reminders and delivery notifications",
  "preference_level": "acceptable"
}
```

### Common Custom Types

| Custom Type | Suggested Category | Use Case |
|-------------|-------------------|----------|
| `sms` | direct | Text message communications |
| `chatbot` | digital | Automated chat interactions |
| `tv` | digital | Television advertising/content |
| `kiosk` | physical | Self-service terminals |
| `radio` | digital | Radio broadcasts/podcasts |
| `video_call` | direct | Video conferencing (Zoom, Teams, etc.) |

---

## Type-to-Category Alignment

Each channel type must align with its category:

### Digital Category
- `website` - Web-based interactions
- `app` - Mobile/desktop applications
- `social_media` - Social platforms

### Physical Category
- `in_person` - Face-to-face interactions
- `post` - Physical mail

### Direct Category
- `email` - Email communication
- `phone` - Voice calls

**Validation:** Schemas enforce type-to-category alignment. Mismatched combinations will fail validation.

---

## Usage in Personas

Personas document channel **preferences** - how the persona likes to interact across their entire experience.

### Structure

```json
"channels": [
  {
    "name": "LinkedIn professional network",
    "category": "digital",
    "type": "social_media",
    "usage_context": "Industry news and peer networking",
    "preference_level": "preferred"
  }
]
```

### Complete Example

```json
{
  "name": "Company website research",
  "category": "digital",
  "type": "website",
  "custom_type": null,
  "usage_context": "Initial vendor evaluation and feature comparison",
  "preference_level": "preferred"
}
```

### Persona Context Examples

#### Business Persona (B2B)
```json
[
  {
    "name": "Industry conferences and trade shows",
    "category": "physical",
    "type": "in_person",
    "usage_context": "Learning about new technologies and vendor discovery",
    "preference_level": "preferred"
  },
  {
    "name": "Vendor websites and product documentation",
    "category": "digital",
    "type": "website",
    "usage_context": "Detailed technical research and compliance review",
    "preference_level": "preferred"
  },
  {
    "name": "Sales representative calls",
    "category": "direct",
    "type": "phone",
    "usage_context": "Custom requirements discussion and pricing",
    "preference_level": "acceptable"
  }
]
```

#### Consumer Persona (B2C)
```json
[
  {
    "name": "Instagram and Facebook",
    "category": "digital",
    "type": "social_media",
    "usage_context": "Product discovery and reviews from friends",
    "preference_level": "preferred"
  },
  {
    "name": "Retail mobile apps",
    "category": "digital",
    "type": "app",
    "usage_context": "Quick shopping and delivery tracking",
    "preference_level": "preferred"
  },
  {
    "name": "Customer service email",
    "category": "direct",
    "type": "email",
    "usage_context": "Non-urgent questions and order issues",
    "preference_level": "acceptable"
  }
]
```

#### Employee Persona (Internal)
```json
[
  {
    "name": "Internal knowledge base",
    "category": "digital",
    "type": "website",
    "usage_context": "Finding procedures and documentation",
    "preference_level": "preferred"
  },
  {
    "name": "Team meetings",
    "category": "physical",
    "type": "in_person",
    "usage_context": "Weekly status updates and collaboration",
    "preference_level": "acceptable"
  },
  {
    "name": "Manager email",
    "category": "direct",
    "type": "email",
    "usage_context": "Formal requests and documentation",
    "preference_level": "avoided"
  }
]
```

---

## Usage in Journeys

Journeys document **actual channels used** at specific steps - where personas interact with the service in practice.

### Structure

```json
"channels": [
  {
    "category": "digital",
    "type": "website",
    "name": "Vendor comparison site (G2, Capterra)",
    "usage_context": "Initial research and peer reviews"
  }
]
```

### Journey Progression Example

```json
{
  "phases": [
    {
      "name": "Awareness",
      "steps": [
        {
          "id": "discover-need",
          "name": "Recognize problem",
          "lane_content": {
            "channels": [
              {
                "category": "physical",
                "type": "in_person",
                "name": "Industry conference presentation",
                "usage_context": "Learned about new solution category"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Research",
      "steps": [
        {
          "id": "evaluate-options",
          "name": "Compare vendors",
          "lane_content": {
            "channels": [
              {
                "category": "digital",
                "type": "website",
                "name": "Vendor websites",
                "usage_context": "Feature comparison and pricing"
              },
              {
                "category": "digital",
                "type": "social_media",
                "name": "LinkedIn peer posts",
                "usage_context": "Seeking recommendations from network"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Decision",
      "steps": [
        {
          "id": "final-negotiation",
          "name": "Contract discussions",
          "lane_content": {
            "channels": [
              {
                "category": "direct",
                "type": "phone",
                "name": "Sales calls",
                "usage_context": "Pricing negotiation and custom terms"
              },
              {
                "category": "direct",
                "type": "email",
                "name": "Legal correspondence",
                "usage_context": "Contract review and approval"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## Common Channel Patterns

### B2B Technology Buying
`in_person` (conferences) → `website` (research) → `phone` (sales) → `email` (contracts)

### Consumer E-Commerce
`social_media` (discovery) → `app` (shopping) → `email` (confirmation) → `post` (delivery)

### Employee Support
`website` (knowledge base) → `email` (help desk) → `in_person` (escalation)

### Service Inquiry
`phone` (initial call) → `email` (follow-up) → `in_person` (appointment) → `app` (tracking)

---

## Channel vs Persona Integration

### Alignment Principles

**Persona channels define preferences:**
- What channels they prefer overall
- Why they prefer certain channels
- How they typically interact

**Journey channels show reality:**
- What channels are actually used at each step
- Why those specific channels were chosen for that moment
- How the channel supports the step's goal

### Example Integration

**Persona Preference:**
```json
{
  "name": "Sarah - Working Mom",
  "channels": [
    {
      "name": "Mobile shopping apps",
      "category": "digital",
      "type": "app",
      "preference_level": "preferred",
      "usage_context": "Busy schedule requires quick mobile access"
    }
  ]
}
```

**Journey Reality:**
```json
{
  "step": "Emergency purchase",
  "channels": [
    {
      "category": "digital",
      "type": "app",
      "name": "Retailer mobile app",
      "usage_context": "Quick checkout during lunch break"
    }
  ]
}
```

The journey validates the persona - Sarah uses her preferred app channel when time-constrained.

---

## Validation Rules

### Schema Validation

✅ **Required Fields:**
- `name` - Specific channel instance name
- `category` - Must be: digital, physical, or direct
- `type` - Must be one of the 7 standard types or "other"

✅ **Conditional Requirements:**
- When `type` is "other", `custom_type` must be provided
- `category` and `type` must align per taxonomy

✅ **Optional Fields:**
- `custom_type` - Only when type is "other"
- `usage_context` - Recommended for clarity
- `preference_level` - Only in personas (not journeys)

### Content Quality

✅ **DO:**
- Use specific channel names (not just the type)
- Provide usage context explaining when/why
- Align type with category
- Document preference levels in personas
- Show actual usage in journeys

❌ **DON'T:**
- Use generic names like "website" without specificity
- Omit usage context
- Misalign type and category
- Create unnecessary custom types
- Mix up persona preferences with journey touchpoints

---

## Schema Definitions

### Persona Channel Schema

```json
{
  "name": {"type": "string", "maxLength": 100},
  "category": {"enum": ["digital", "physical", "direct"]},
  "type": {"enum": ["website", "app", "email", "social_media", "phone", "in_person", "post", "other"]},
  "custom_type": {"type": "string", "maxLength": 50},
  "usage_context": {"type": "string", "maxLength": 300},
  "preference_level": {"enum": ["preferred", "acceptable", "avoided"]}
}
```

### Journey Channel Schema

```json
{
  "category": {"enum": ["digital", "physical", "direct"]},
  "type": {"enum": ["website", "app", "email", "social_media", "phone", "in_person", "post", "other"]},
  "custom_type": {"type": "string", "maxLength": 50},
  "name": {"type": "string", "maxLength": 100},
  "usage_context": {"type": "string", "maxLength": 200}
}
```

---

## Migration from Previous Versions

### From 10-Type System (v1.0.1)

| Old Type | New Category | New Type |
|----------|--------------|----------|
| `digital` | digital | website |
| `social` | digital | social_media |
| `media` | digital | website or other (custom_type: media) |
| `direct` | direct | email or phone |
| `physical` | physical | in_person |
| `human` | varies | in_person or phone (context-dependent) |
| `hybrid` | varies | Multiple channel entries |
| `self_service` | digital | website or app |
| `in_person_events` | physical | in_person |
| `self_service_digital` | digital | website |
| `personal_interaction` | physical or direct | in_person or phone |
| `mobile_app` | digital | app |
| `social_recommendations` | digital | social_media |

### From 5-Type System (v1.0.2 early)

| Old Type | New Category | New Type |
|----------|--------------|----------|
| `digital` | digital | website or app (context-dependent) |
| `physical` | physical | in_person |
| `human` | physical or direct | in_person or phone (context-dependent) |
| `hybrid` | varies | Multiple channel entries |
| `self_service` | digital | website or app |

---

## Version History

### Version 1.0.2 (2025-11-28)
- **Major Update:** Introduced 3-category/7-type taxonomy
- Added `category` field (digital, physical, direct)
- Reduced types from 10 to 7 standard types plus "other"
- Added custom_type extension mechanism
- Enforced type-to-category alignment validation
- Updated all examples and documentation
- Removed "Enhanced" terminology

### Version 1.0.1 (2025-10-11)
- 10-type taxonomy with core and extended types

### Version 1.0.0 (2024-09-30)
- Initial 5-type taxonomy

---

## Related Documentation

- [SERVICE-DESIGN-PERSONA-STANDARD.md](../v1.0.2/SERVICE-DESIGN-PERSONA-STANDARD.md) - Persona specification
- [SERVICE-DESIGN-JOURNEY-STANDARD.md](../v1.0.2/SERVICE-DESIGN-JOURNEY-STANDARD.md) - Journey specification
- [CANONICAL_REFERENCES.md](CANONICAL_REFERENCES.md) - All schema components
- [BARRIER_TAXONOMY.md](BARRIER_TAXONOMY.md) - Barrier type definitions

---

**This is the authoritative reference for channel types. Use this taxonomy consistently across all schemas, documentation, and examples.**
