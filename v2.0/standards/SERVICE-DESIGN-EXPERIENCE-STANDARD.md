# Service Design Experience Standard

> **v2.0** — The persona-specific view of an Actor going through a Mission. Where the Mission is the map, the Experience is the trip.

An **Experience** captures what happens when a specific Actor goes through a specific Mission. It is the persona layer — the thoughts, emotions, needs, pains, and barriers that belong to *this person* at *this moment in the service*. One Mission can have many Experiences, each from a different Actor or different moment in time.

---

## Contents

1. [What is an Experience?](#1-what-is-an-experience)
2. [The Mission–Experience Split](#2-the-missionexperience-split)
3. [needAtStep and painAtStep — the Micro-Emergence](#3-needatstep-and-painatstep--the-micro-emergence)
4. [Required Fields](#4-required-fields)
5. [Field Reference](#5-field-reference)
6. [Emotion Models](#6-emotion-models)
7. [Cognitive Load](#7-cognitive-load)
8. [Moments That Matter](#8-moments-that-matter)
9. [Outcome](#9-outcome)
10. [Provenance, Governance, Relationships](#10-provenance-governance-relationships)
11. [Quality Rubric](#11-quality-rubric)
12. [Tooling](#12-tooling)
13. [Example Skeleton](#13-example-skeleton)

---

## 1. What is an Experience?

An Experience answers the question: *What is it like to be this person going through this service?*

It references a Mission for structure (which nodes exist, what the service does) and an Actor for identity (who is going through it, what their traits and context are). The Experience itself contributes what only this person can bring: their internal state at each step.

```
actor-sarah-martinez ──┐
                        ├──→ exp-sarah-clothes-shopping
mission-online-        ─┘
clothes-shopping
```

An Experience file lives at:
```
v2.0/examples/<domain>/exp-<actor>-<mission-short-name>.json
```

ID format: `exp-<lowercase-hyphenated-name>` (e.g., `exp-sarah-clothes-shopping`)

---

## 2. The Mission–Experience Split

Understanding what belongs where is the fundamental design decision in v2.0.

| Belongs in **Mission** | Belongs in **Experience** |
|------------------------|--------------------------|
| Service-level description of what happens | What this actor does, thinks, feels |
| Structural barriers (inherent to the touchpoint) | Persona-specific barriers (with `emergesFrom`) |
| Channel availability | Channel preference and actual usage |
| Accessibility profile of the touchpoint | How this actor's accessibility needs interact with the touchpoint |
| Service blueprint (frontstage, backstage, systems) | — |
| Paths available through the service | Which path this actor actually takes |
| SLA targets | Whether the SLA felt adequate to this actor |

**Test:** If the content would be true for *any* person using the service, it belongs in the Mission. If it's only true because of *who this person is*, it belongs in the Experience.

> "The form requires uploading a document" — Mission.
> "Sarah panics because she can't find her tenancy agreement" — Experience.

---

## 3. needAtStep and painAtStep — the Micro-Emergence

These two fields are the most important concept in the Experience schema. They represent **micro-emergence**: the specific insight that only exists when *this actor's traits and context* meets *this specific touchpoint*.

### needAtStep

What this actor specifically needs at this moment — not a general trait need, not a general context need, but the precise need that arises from the collision of who they are with what the service is asking of them.

```json
"needAtStep": "Needs visual confirmation that the uploaded document was received correctly — her anxiety about the process means 'Submitted' without a preview feels like uncertainty, not completion."
```

This is different from:
- Trait need: "Needs security" (too general)
- Context need: "Needs to complete the process quickly" (situational but not step-specific)
- Mission barrier: "Upload functionality has no preview" (structural, not persona-specific)

### painAtStep

How this step causes pain for this actor, beyond the structural barriers. The gap between what they need and what the service provides at this moment.

```json
"painAtStep": "The upload form provides no preview of the submitted file. For Sarah, whose anxiety about making mistakes is a primary trait, this creates genuine distress — she cannot tell if her document uploaded correctly and cannot proceed with confidence."
```

### Design guidance

- **Do not skip these fields.** They are where the deepest insight lives. A well-written `needAtStep` and `painAtStep` on even three nodes in an Experience is worth more than a technically complete Experience with empty fields.
- **emergesFrom is the mechanism.** Always explain *why* this need or pain exists for this specific actor. The intersection of trait + context + touchpoint should be visible.
- **Use the `experience-generator` skill.** It walks the Mission node by node, showing the service context and Actor traits together, and prompts for these fields.

---

## 4. Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `$type` | Yes | Must be `"Experience"` |
| `id` | Yes | Pattern: `exp-[a-z0-9_-]+` |
| `version` | Yes | Pattern: `2.0.X` |
| `title` | Yes | |
| `references` | Yes | |
| `references.actorRef` | Yes | ID of the Actor |
| `references.missionRef` | Yes | ID of the Mission |
| `path` | Yes | |
| `path.nodeSequence` | Yes | Min 1 node ID |
| `nodes` | Yes | Min 1 node |
| `nodes[].nodeRef` | Yes | References a node in the Mission |
| `nodes[].laneContent` | Yes | At least one field |
| `meta` | Yes | Must include `updated` |

---

## 5. Field Reference

### Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `$context` | string | Always `"https://schemas.digitalservice.design/v2.0"` |
| `$type` | string | Always `"Experience"` |
| `id` | string | Unique identifier |
| `version` | string | Schema version |
| `title` | string | E.g., `"Sarah Martinez — Clothes Shopping Experience"` |
| `summary` | string | Narrative summary of this actor's experience (max 1000 chars) |

### references

```json
"references": {
  "actorRef": "actor-sarah-martinez",
  "contextRef": "ctx-working-mom-consumer",
  "missionRef": "mission-online-clothes-shopping"
}
```

`contextRef` is optional but recommended — it specifies which of the Actor's contexts applies to this experience, which helps tools and renderers surface the right context-level data.

### path

```json
"path": {
  "pathType": "observed",
  "nodeSequence": ["start", "browse", "filter", "view-product", "add-to-basket", "checkout", "end-success"],
  "totalDuration": "22 minutes"
}
```

**`pathType` values:** `designed` | `observed` | `simulated` | `failure` | `edge_case`

The `nodeSequence` must contain node IDs that exist in the referenced Mission. The validator checks this when run with `--check-refs`.

### lanes

Declares the persona-specific data layers this Experience tracks. Inherits service-level lanes from the Mission; adds persona-specific ones here.

```json
"lanes": [
  { "id": "emotions", "label": "Emotions", "type": "emotion" },
  { "id": "barriers", "label": "Barriers (experienced)", "type": "barrier" },
  { "id": "need-at-step", "label": "Need at Step", "type": "text" },
  { "id": "pain-at-step", "label": "Pain at Step", "type": "text" }
]
```

### nodes[n]

Each node entry adds the actor's persona-specific content to one node in the path.

| Field | Type | Description |
|-------|------|-------------|
| `nodeRef` | string | Must match a node ID in the Mission |
| `laneContent` | object | The actor's experience at this node |
| `laneContent.actions` | array | What this actor specifically does at this step |
| `laneContent.thoughts` | string | What this actor is thinking (internal monologue) |
| `laneContent.emotions` | object | Emotional state — see [Emotion Models](#6-emotion-models) |
| `laneContent.barriers` | array | Barriers as experienced (may differ from Mission-level barriers) |
| `laneContent.needAtStep` | string | Micro-emergence need — see [needAtStep](#3-needatstep-and-painatstep--the-micro-emergence) |
| `laneContent.painAtStep` | string | Pain at this step — see [painAtStep](#3-needatstep-and-painatstep--the-micro-emergence) |
| `laneContent.opportunities` | array | Improvement opportunities specific to this actor |
| `laneContent.cognitiveLoad` | object | How this actor experiences cognitive demands — see [Cognitive Load](#7-cognitive-load) |
| `momentThatMatters` | object | If this is a critical emotional touchpoint — see [Moments That Matter](#8-moments-that-matter) |

**Experience-level barriers** differ from Mission-level barriers in two ways:
1. They have an `emergesFrom` field explaining the trait–context collision
2. They may be entirely different barriers (the Mission lists structural issues; the Experience adds barriers that only affect this actor)

```json
"barriers": [
  {
    "type": "knowledge",
    "description": "Sarah doesn't know that the returns policy is visible in her account rather than the confirmation email",
    "severity": 3,
    "emergesFrom": "Her security need means she seeks written confirmation of returns policy before completing purchase — the service doesn't surface this information at the right moment",
    "workarounds": "Googles the returns policy separately, adding 8 minutes to the experience"
  }
]
```

---

## 6. Emotion Models

Emotions can be recorded in three ways. All three are valid; choose based on your team's practice.

### Simple (default)

```json
"emotions": {
  "state": "anxious",
  "intensity": -1
}
```

`intensity` is an integer from -2 (very negative) to +2 (very positive).

### Dimensional (valence-arousal)

```json
"emotions": {
  "state": "frustrated anticipation",
  "intensity": -1,
  "model": "dimensional",
  "valence": -0.3,
  "arousal": 0.7
}
```

Useful when the emotional quality matters as much as direction — highly activated negative states (frustrated, anxious) behave differently from low-activation negative states (resigned, sad).

### Categorical (Plutchik)

```json
"emotions": {
  "state": "anticipation",
  "intensity": 1,
  "model": "categorical",
  "category": "anticipation"
}
```

**Categories:** `joy` | `trust` | `fear` | `surprise` | `sadness` | `disgust` | `anger` | `anticipation`

For most service design work, the simple model is sufficient. Use dimensional or categorical when working with research teams who use these frameworks.

---

## 7. Cognitive Load

Cognitive load captures how the actor experiences the cognitive demands of a node, informed by WCAG 3.0 cognitive accessibility outcomes. This is distinct from the Mission's `accessibilityProfile.cognitive` — that describes the touchpoint's objective difficulty; this describes how *this actor* experiences it.

```json
"cognitiveLoad": {
  "overallScore": 4,
  "decisionComplexity": "complex",
  "informationDensity": "high",
  "timePressure": "moderate",
  "priorKnowledgeRequired": "Actor is expected to understand housing benefit entitlement rules — Sarah does not have this knowledge",
  "supportAvailable": "Help text exists but is written in policy language"
}
```

| Field | Values | Description |
|-------|--------|-------------|
| `overallScore` | 1–5 | 1 = minimal load, 5 = overwhelming |
| `decisionComplexity` | none / simple / moderate / complex | How complex the decisions feel |
| `informationDensity` | minimal / low / moderate / high / overwhelming | Volume and complexity of information |
| `timePressure` | none / low / moderate / high / critical | Time pressure as felt by this actor |
| `priorKnowledgeRequired` | string | What knowledge the service assumes — and whether this actor has it |
| `supportAvailable` | string | Help or scaffolding this actor can access |

---

## 8. Moments That Matter

A `momentThatMatters` on a node marks it as a critical emotional touchpoint for this actor. These are the high-signal moments that renderers highlight and that design teams should prioritise.

```json
"momentThatMatters": {
  "description": "The first time Sarah sees the item in her basket — a moment of genuine pleasure after navigating the filter system",
  "importance": "high",
  "emotionalIntensity": 2
}
```

**`importance`:** `critical` | `high` | `medium` | `low`
**`emotionalIntensity`:** -2 to +2

Use `critical` sparingly — moments that would cause an actor to abandon the service or become a long-term detractor. Use `high` for significant positive moments (delight, relief) or significant negative moments (confusion, frustration peaks).

---

## 9. Outcome

The outcome summarises how this experience concludes for this actor.

```json
"outcome": {
  "success": true,
  "endNode": "end-success",
  "reflection": "Sarah completed her purchase but felt uncertain about the returns process throughout. She'll use the service again but will look up returns policy before starting next time.",
  "netSentiment": 1,
  "wouldRepeat": true
}
```

**`netSentiment`:** -2 (very negative) to +2 (very positive) — integer.
**`wouldRepeat`:** Would this actor use the service again?

`netSentiment` is distinct from the emotion at the final node — it's the overall impression after reflection, not the immediate emotion.

---

## 10. Provenance, Governance, Relationships

These follow the same structure as Actor and Mission. See [Actor Standard — Provenance](SERVICE-DESIGN-ACTOR-STANDARD.md#5-provenance) for the full field reference.

**Experience relationship types:**
`derived_from_mission` | `experienced_by` | `compared_with` | `preceded_by` | `followed_by`

---

## 11. Quality Rubric

The validator scores Experiences 0–100.

| Criterion | Points | What it checks |
|-----------|--------|----------------|
| Required fields | 20 | All required fields populated |
| Path covers mission nodes | 10 | nodeSequence references valid mission nodes |
| Thoughts and emotions | 20 | thoughts and emotions populated on all nodes |
| needAtStep on ≥ 3 nodes | 15 | Micro-emergence needs documented |
| painAtStep on ≥ 2 nodes | 10 | Friction captured at specific steps |
| Barriers with emergesFrom | 15 | At least one barrier with emergence explanation |
| Outcome section | 10 | outcome.success, netSentiment, wouldRepeat populated |
| **Total** | **100** | |

Run: `node tools/validators/validate-v2.0.js v2.0/examples/<domain>/exp-<name>.json --check-refs`

The `--check-refs` flag checks that `references.actorRef` and `references.missionRef` resolve to real files and that all `nodeRef` values exist in the referenced Mission.

---

## 12. Tooling

| Tool | Purpose |
|------|---------|
| `experience-generator` skill | Interactive step-by-step Experience creation (walks Actor through Mission node by node) |
| `experience-renderer` skill | Renders Experience as a horizontal swimlane journey map |
| `validate-v2.0.js --check-refs` | Schema + cross-reference validation |
| `journey-analyser` skill (WS5) | Analyses emotional trajectory, barrier clusters, unmet needs |

To create a new Experience:
1. First create or identify an Actor and a Mission
2. `/experience-generator` — select Actor and Mission, the skill walks through each node
3. Or: `node tools/converters/convert-v1.1-to-v2.0.js --journey ...` (produces a skeleton with structural content but requires human work for needAtStep/painAtStep)

---

## 13. Example Skeleton

```json
{
  "$context": "https://schemas.digitalservice.design/v2.0",
  "$type": "Experience",
  "id": "exp-alex-housing-benefit",
  "version": "2.0.0",
  "title": "Alex Thompson — Housing Benefit Application Experience",
  "summary": "Alex navigates the housing benefit online portal for the first time, bringing significant anxiety about the process and limited experience with government online services.",

  "references": {
    "actorRef": "actor-alex-thompson",
    "contextRef": "ctx-benefit-claimant",
    "missionRef": "mission-apply-for-benefit"
  },

  "path": {
    "pathType": "simulated",
    "nodeSequence": ["start", "access-portal", "eligibility-check", "end-success"],
    "totalDuration": "35 minutes"
  },

  "lanes": [
    { "id": "emotions", "label": "Emotions", "type": "emotion" },
    { "id": "barriers", "label": "Barriers Experienced", "type": "barrier" },
    { "id": "need-at-step", "label": "Need at Step", "type": "text" },
    { "id": "pain-at-step", "label": "Pain at Step", "type": "text" }
  ],

  "nodes": [
    {
      "nodeRef": "start",
      "laneContent": {
        "actions": ["Searches 'housing benefit apply' on Google"],
        "thoughts": "I hope this isn't too complicated. I really need to get this right.",
        "emotions": { "state": "anxious", "intensity": -1 },
        "needAtStep": "Needs immediate reassurance that they've found the right place and the process is manageable",
        "painAtStep": "Search results show multiple GOV.UK pages — Alex isn't sure which one is the right starting point. Their risk-averse nature means they click through all three before choosing."
      }
    },
    {
      "nodeRef": "access-portal",
      "laneContent": {
        "actions": ["Navigates to council portal", "Creates an account"],
        "thoughts": "I've never used this portal before. I hope I don't need documents I haven't got.",
        "emotions": { "state": "cautious", "intensity": -1 },
        "needAtStep": "Needs to know exactly which documents they will need before starting — ideally a checklist they can prepare from",
        "painAtStep": "The portal asks for documents midway through without advance warning. Alex has to stop, search for their tenancy agreement, and restart.",
        "barriers": [
          {
            "type": "knowledge",
            "description": "No advance document checklist provided before starting the application",
            "severity": 4,
            "emergesFrom": "Alex's risk-averse decision style means surprises mid-process feel like failure — they need to know what's coming before they commit"
          }
        ]
      },
      "momentThatMatters": {
        "description": "The moment Alex realises they don't have their tenancy agreement to hand — a critical anxiety peak",
        "importance": "critical",
        "emotionalIntensity": -2
      }
    },
    {
      "nodeRef": "eligibility-check",
      "laneContent": {
        "actions": ["Answers eligibility questions"],
        "thoughts": "I think I qualify but I'm not certain. What if I answer wrong?",
        "emotions": { "state": "uncertain", "intensity": -1 },
        "needAtStep": "Needs to understand the consequence of each answer before giving it",
        "painAtStep": "Eligibility questions use policy terminology (\"habitual residence test\") without explanation. Alex answers based on guesswork."
      }
    },
    {
      "nodeRef": "end-success",
      "laneContent": {
        "actions": ["Receives confirmation screen"],
        "thoughts": "I did it. But I'm not sure if that all went correctly.",
        "emotions": { "state": "relieved but uncertain", "intensity": 0 },
        "needAtStep": "Needs clear confirmation that the application was received correctly and what happens next",
        "painAtStep": "Confirmation page says 'Application received' but gives no reference number or timeline for decision. Alex takes a screenshot but is still unsure the application was properly submitted."
      }
    }
  ],

  "outcome": {
    "success": true,
    "endNode": "end-success",
    "reflection": "Alex completed the application but felt anxious throughout. They are not confident the form was filled in correctly and plan to follow up by phone.",
    "netSentiment": -1,
    "wouldRepeat": true
  },

  "provenance": {
    "generationMethod": "ai_assisted",
    "source": "assumption",
    "confidence": 0.7,
    "humanReviewed": false
  },

  "governance": {
    "dataClassification": "internal",
    "containsPii": false,
    "anonymisationMethod": "fictional_composite"
  },

  "meta": {
    "created": "2025-11-01",
    "updated": "2025-11-01",
    "createdBy": "Design Team",
    "tags": ["government", "benefits", "example"]
  }
}
```

---

## See also

- [Actor Standard](SERVICE-DESIGN-ACTOR-STANDARD.md) — the Actor this Experience is derived from
- [Mission Standard](SERVICE-DESIGN-MISSION-STANDARD.md) — the Mission this Experience traverses
- [Migration Guide](../migration-guide.md) — converting v1.1 Journey persona layer to v2.0 Experience
- Schema: [v2.0/schemas/experience.schema.json](../schemas/experience.schema.json)
- Examples: [v2.0/examples/](../examples/)
