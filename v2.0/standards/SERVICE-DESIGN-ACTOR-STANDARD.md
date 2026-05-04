# Service Design Actor Standard

> **v2.0** — Replaces the v1.1 Persona + Role + Pairing pipeline with a single, layered artifact.

An **Actor** is the unified representation of anyone — or anything — that participates in a service experience. Where v1.1 required three separate artifacts (Persona, Role, Pairing) to describe one participant, v2.0 captures the same information in a single, layered JSON file that is richer, more consistent, and easier to maintain.

---

## Contents

1. [What is an Actor?](#1-what-is-an-actor)
2. [The Three-Layer Architecture](#2-the-three-layer-architecture)
3. [Required Fields](#3-required-fields)
4. [Field Reference](#4-field-reference)
5. [Provenance](#5-provenance)
6. [Governance](#6-governance)
7. [Relationships](#7-relationships)
8. [Quality Rubric](#8-quality-rubric)
9. [Tooling](#9-tooling)
10. [Example Skeleton](#10-example-skeleton)

---

## 1. What is an Actor?

An Actor is a first-class entity in the v2.0 graph. Every Mission and Experience references one or more Actors. Actors represent:

| `actorType` | Use for |
|-------------|---------|
| `human` | End users, staff, citizens, patients |
| `ai_agent` | Automated systems, AI assistants, bots |
| `team` | Cross-functional teams acting as a unit |
| `organisation` | Third-party organisations, partner agencies |

Human–AI collaborations are modelled as **two separate Actors** with a `collaborates_with` relationship between them.

An Actor file lives at:
```
v2.0/examples/<domain>/actor-<name>.json
```

ID format: `actor-<lowercase-hyphenated-name>` (e.g., `actor-sarah-martinez`)

---

## 2. The Three-Layer Architecture

An Actor has three nested layers, each capturing a different timescale and level of situational specificity.

```
┌─────────────────────────────────────────────┐
│  TRAITS  (enduring)                         │
│  Who they are regardless of situation       │
│  needs · frustrations · motivations         │
│  technology · communication · accessibility │
├─────────────────────────────────────────────┤
│  CONTEXTS  (situational)                    │
│  What they are trying to achieve            │
│  in a specific life or work situation       │
│  needs · frustrations · channels · details  │
├─────────────────────────────────────────────┤
│  EMERGENCE  (collision)                     │
│  What arises when their enduring traits     │
│  meet this specific situation               │
│  goals · painPoints · opportunities         │
└─────────────────────────────────────────────┘
```

### Traits

Traits are enduring. They describe who this actor is across all situations — personality, capabilities, needs as a person. For humans, traits include demographics, personal needs, frustrations, motivations, technology comfort, communication preferences, decision-making style, and accessibility profile.

**Do not put situational content in traits.** A need like "needs to complete procurement in 30 days" belongs in a Context, not in Traits.

### Contexts

Contexts are situational. Each context describes what the actor is trying to achieve in a specific life or work role — what they need, what frustrates them, which channels they use, and what moments matter. A single actor can have multiple contexts (e.g., a person who is both a retail consumer and a healthcare carer).

Each context has a `contextId` in the format `ctx-<name>` and a `contextType` (free text, e.g., `"Consumer"`, `"Professional"`, `"Caregiver"`).

### Emergence

Emergence captures the synthesis that happens when an actor's enduring traits *collide* with a specific situational context. This is the insight layer — what goals do they actually experience? What pain points arise that wouldn't exist in either traits or context alone?

Each emergence entry references a context via `contextRef`. The `emergesFrom` field on pain points explains *why* this pain exists as a collision between trait and context.

> **Design principle:** Emergence is where the most valuable design thinking happens. "They need quick reassurance at every step" is an emergent insight — it requires knowing both their anxiety trait AND the procurement context. Never skip emergence.

---

## 3. Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `$type` | Yes | Must be `"Actor"` |
| `id` | Yes | Pattern: `actor-[a-z0-9_-]+` |
| `version` | Yes | Pattern: `2.0.X` (e.g., `"2.0.0"`) |
| `name` | Yes | Display name |
| `actorType` | Yes | `human` \| `ai_agent` \| `team` \| `organisation` |
| `traits` | Yes | Must include `needs`, `frustrations`, `motivations` |
| `traits.needs` | Yes | Min 1 item |
| `traits.frustrations` | Yes | Min 1 item |
| `traits.motivations` | Yes | Min 1 item |
| `contexts` | Yes | Min 1 context |
| `contexts[].contextId` | Yes | Pattern: `ctx-[a-z0-9_-]+` |
| `contexts[].title` | Yes | |
| `contexts[].needs` | Yes | Min 1 item |
| `contexts[].frustrations` | Yes | Min 1 item |
| `meta` | Yes | Must include `updated` date |

All other fields are optional but contribute to quality scoring.

---

## 4. Field Reference

### Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `$context` | string | Always `"https://schemas.digitalservice.design/v2.0"` |
| `$type` | string | Always `"Actor"` |
| `id` | string | Unique identifier |
| `version` | string | Schema version (e.g., `"2.0.0"`) |
| `name` | string | Display name (max 100 chars) |
| `summary` | string | One-paragraph description (max 500 chars) |
| `actorType` | enum | `human` \| `ai_agent` \| `team` \| `organisation` |
| `quote` | string | A statement capturing their perspective (max 500 chars) |
| `sameAs` | array | URIs identifying this actor in other systems (for cross-system resolution) |

### traits

| Field | Type | Description |
|-------|------|-------------|
| `traits.demographics` | object | Age, location, education, background. Free-form for non-human actors. |
| `traits.needs` | array | Each item: `{ need, type?, $provenance? }`. Type: `recognition` \| `autonomy` \| `security` \| `belonging` \| `growth` \| `mastery` \| `efficiency` \| `other` |
| `traits.frustrations` | array | Each item: `{ frustration, severity? (1-5), $provenance? }` |
| `traits.motivations` | array | Each item: `{ motivation, type? }`. Type: `intrinsic` \| `extrinsic` \| `social` \| `achievement` |
| `traits.technology` | object | `comfort` (beginner/intermediate/advanced/expert), `description`, `preferredDevices` |
| `traits.communication` | object | `preferred`, `acceptable`, `avoided` (arrays), `style` |
| `traits.decisionMaking` | object | `style`, `riskTolerance` (risk_averse/cautious/moderate/risk_tolerant/risk_seeking) |
| `traits.accessibility` | object | `dimensions` (array of `{ dimension, description, impact }`), `assistiveTech` |
| `traits.learningStyle` | string | How they prefer to acquire knowledge |
| `traits.behaviouralPatterns` | array | Each item: `{ pattern, context? }` |
| `traits.influences` | array | Each item: `{ source, description? }` |

**Accessibility dimensions:** `visual` \| `auditory` \| `motor` \| `cognitive` \| `emotional` \| `situational`
**Accessibility impact:** `none` \| `mild` \| `moderate` \| `significant` \| `primary`

### contexts[n]

| Field | Type | Description |
|-------|------|-------------|
| `contextId` | string | Pattern: `ctx-[a-z0-9_-]+` |
| `title` | string | Context name (e.g., "Working Mum — Online Retail Consumer") |
| `description` | string | What this context is about |
| `contextType` | string | Free text: Consumer, Professional, Caregiver, etc. |
| `needs` | array | Each item: `{ need, priority?, timeframe? }`. Priority: primary/secondary/aspirational. Timeframe: immediate/short_term/long_term |
| `frustrations` | array | Each item: `{ frustration, severity? (1-5), frequency? }`. Frequency: daily/weekly/monthly/occasional/rare |
| `channels` | array | Each item: `{ channel, category, serviceModel, preference?, usageContext? }` |
| `details` | object | Free-form context-specific data (replaces v1.1 consumerContext/professionalContext) |
| `momentsThatMatter` | array | Each item: `{ moment, emotionalIntensity? (-2 to 2), importance? }` |

**Channel `category`:** `digital` \| `telecom` \| `physical`
**Channel `serviceModel`:** `self_service` \| `managed` \| `both`
**Channel `preference`:** `preferred` \| `acceptable` \| `avoided`

### emergence[n]

| Field | Type | Description |
|-------|------|-------------|
| `contextRef` | string | ID of the context this emergence relates to |
| `goalsAsExperienced` | array | Each item: `{ goal, source?, priority? }`. Source: traits/context/collision |
| `painPoints` | array | Each item: `{ painPoint, severity? (1-5), emergesFrom? }` |
| `opportunities` | array | Strings describing where the actor's strengths create advantage |
| `emotionalContext` | string | Overall emotional tone in this context |
| `useCases` | array | Each item: `{ scenario, trigger?, outcome? }` |
| `successMetrics` | array | Strings describing how success is measured |

---

## 5. Provenance

Provenance tracks the evidence and confidence behind an artifact and its fields.

**Artifact-level provenance** — place on the top-level `provenance` field:

```json
"provenance": {
  "generationMethod": "ai_assisted",
  "source": "user_research",
  "confidence": 0.85,
  "humanReviewed": true,
  "humanReviewedDate": "2025-11-15",
  "researchSources": [
    { "source": "12 user interviews (Oct 2025)", "type": "interview", "confidence": "high" },
    { "source": "Survey of 450 online shoppers", "type": "survey", "confidence": "medium" }
  ]
}
```

**Field-level provenance** — add `$provenance` to any field:

```json
"needs": [
  {
    "need": "Needs to complete the process in under 10 minutes",
    "$provenance": { "source": "analytics", "confidence": 0.95 }
  }
]
```

**`generationMethod` values:**
- `human_created` — entirely human-authored
- `ai_assisted` — human-led with AI assistance
- `ai_generated` — primarily AI-generated (requires `humanReviewed: true` before use in production)
- `mixed` — different methods across sections

**`researchSources[].type` values:**
`interview` | `survey` | `analytics` | `observation` | `existing_research` | `ai_synthesis`

---

## 6. Governance

Governance supports GDPR and EU AI Act compliance. It is distinct from provenance — governance covers *who controls the data and under what rules*; provenance covers *where the data came from*.

```json
"governance": {
  "dataClassification": "internal",
  "containsPii": true,
  "piiCategories": ["name", "age", "location"],
  "anonymisationMethod": "fictional_composite",
  "retentionPolicy": "Retain for project duration + 12 months",
  "legalBasis": "Legitimate interest — service improvement",
  "dataOwner": "UX Research Team"
}
```

**`dataClassification`:** `public` | `internal` | `confidential` | `restricted`
**`anonymisationMethod`:** `fictional_composite` | `k_anonymity` | `aggregated` | `differential_privacy` | `none`

---

## 7. Relationships

Actors can declare typed relationships to other artifacts in the graph. This enables traversal: "show me all Experiences of Missions where actors with cognitive accessibility needs encounter high information density."

```json
"relationships": [
  {
    "target": "actor-customer-service-agent",
    "type": "serves",
    "description": "Sarah is served by the customer service agent",
    "strength": "strong"
  },
  {
    "target": "mission-online-clothes-shopping",
    "type": "participates_in"
  }
]
```

**Actor relationship types:**
`influences` | `influenced_by` | `enables` | `enabled_by` | `blocks` | `blocked_by` | `hands_off_to` | `receives_from` | `escalates_to` | `escalated_from` | `collaborates_with` | `serves` | `served_by` | `participates_in` | `variant_of`

---

## 8. Quality Rubric

The validator scores Actors 0–100. Scores below 70 indicate incomplete artifacts.

| Criterion | Points | What it checks |
|-----------|--------|----------------|
| Required fields present | 30 | All required fields populated |
| Traits depth | 20 | needs ≥ 3, frustrations ≥ 2, technology, communication, decisionMaking |
| Context completeness | 15 | At least one context with needs, frustrations, channels |
| Emergence populated | 15 | Goals and pain points with emergesFrom explanations |
| Provenance | 10 | researchSources with at least one entry |
| Governance | 10 | dataClassification and containsPii populated |
| **Total** | **100** | |

Run: `node tools/validators/validate-v2.0.js v2.0/examples/<domain>/actor-<name>.json`

---

## 9. Tooling

| Tool | Purpose |
|------|---------|
| `actor-builder` skill | Interactive step-by-step Actor creation (Guided/Full/Import modes) |
| `actor-renderer` skill | Renders Actor as a three-layer visual card |
| `validate-v2.0.js` | Schema validation + quality scoring |
| `convert-v1.1-to-v2.0.js` | Converts Persona + Role + Pairing to Actor |
| `actor-comparator` skill (WS5) | Side-by-side Actor comparison |

To create a new Actor:
1. `/actor-builder` — use Guided mode for most cases, Full mode for high-quality research-backed actors
2. Or: `node tools/converters/convert-v1.1-to-v2.0.js --persona ... --role ... --pairing ...`

---

## 10. Example Skeleton

```json
{
  "$context": "https://schemas.digitalservice.design/v2.0",
  "$type": "Actor",
  "id": "actor-example-name",
  "version": "2.0.0",
  "name": "Example Name",
  "actorType": "human",
  "summary": "One-paragraph description of who this actor is.",
  "quote": "A direct quote capturing their perspective.",

  "traits": {
    "demographics": {
      "age": 35,
      "location": "London, UK",
      "education": "Bachelor's degree",
      "background": "Background description."
    },
    "needs": [
      { "need": "Needs to feel in control of the process", "type": "autonomy" },
      { "need": "Needs clear communication at each step", "type": "security" }
    ],
    "frustrations": [
      { "frustration": "Systems that don't remember previous interactions", "severity": 4 }
    ],
    "motivations": [
      { "motivation": "Doing right by their family", "type": "social" }
    ],
    "technology": {
      "comfort": "intermediate",
      "description": "Comfortable with smartphones and common apps."
    },
    "communication": {
      "preferred": ["email", "SMS"],
      "avoided": ["phone calls for non-urgent matters"],
      "style": "Prefers written confirmation for important decisions."
    },
    "decisionMaking": {
      "style": "Researches thoroughly before committing",
      "riskTolerance": "cautious"
    }
  },

  "contexts": [
    {
      "contextId": "ctx-example-consumer",
      "title": "Consumer — Online Services",
      "contextType": "Consumer",
      "description": "Using online services for personal needs.",
      "needs": [
        { "need": "Complete the task quickly between other commitments", "priority": "primary", "timeframe": "immediate" }
      ],
      "frustrations": [
        { "frustration": "Having to re-enter information already provided", "severity": 4, "frequency": "weekly" }
      ],
      "channels": [
        { "channel": "website", "category": "digital", "serviceModel": "self_service", "preference": "preferred" },
        { "channel": "phone", "category": "telecom", "serviceModel": "managed", "preference": "acceptable" }
      ]
    }
  ],

  "emergence": [
    {
      "contextRef": "ctx-example-consumer",
      "goalsAsExperienced": [
        {
          "goal": "Get this done without it becoming a project",
          "source": "collision",
          "priority": "primary"
        }
      ],
      "painPoints": [
        {
          "painPoint": "Anxiety about making the wrong choice amplified by time pressure",
          "severity": 4,
          "emergesFrom": "Risk-averse trait colliding with time-constrained consumer context"
        }
      ],
      "opportunities": [
        "Clear progress indicators would reduce anxiety significantly"
      ],
      "emotionalContext": "Hopeful but watchful — expects friction and is pleasantly surprised when it doesn't appear"
    }
  ],

  "provenance": {
    "generationMethod": "ai_assisted",
    "source": "user_research",
    "confidence": 0.8,
    "humanReviewed": true,
    "researchSources": [
      { "source": "8 user interviews", "type": "interview", "confidence": "high" }
    ]
  },

  "governance": {
    "dataClassification": "internal",
    "containsPii": false,
    "anonymisationMethod": "fictional_composite",
    "legalBasis": "Legitimate interest — service improvement"
  },

  "meta": {
    "created": "2025-11-01",
    "updated": "2025-11-01",
    "createdBy": "Design Team",
    "tags": ["example", "consumer"]
  }
}
```

---

## See also

- [Mission Standard](SERVICE-DESIGN-MISSION-STANDARD.md) — the service graph that Actors traverse
- [Experience Standard](SERVICE-DESIGN-EXPERIENCE-STANDARD.md) — the persona-specific view of an Actor going through a Mission
- [Migration Guide](../migration-guide.md) — converting v1.1 Persona/Role/Pairing to v2.0 Actor
- Schema: [v2.0/schemas/actor.schema.json](../schemas/actor.schema.json)
- Examples: [v2.0/examples/](../examples/)
