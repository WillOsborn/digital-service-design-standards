# Service Design Pairing Standard v1.1

## Pairing Schema

**Version:** 1.1.0
**Last Updated:** 2026-01-06
**Status:** Official Standard

---

## Overview

The Pairing schema captures the **synthesised experience** - what happens when a specific Core Persona meets a specific Role Card (or combination of roles). This is the "headline story" of how this person experiences this context.

### The Synthesis Layer

A Pairing is **not** just a combination of persona and role data - it captures emergent insights that only arise when the two combine:

- How does this person's analytical nature affect their experience as a time-pressured consumer?
- How does this person's risk aversion interact with this role's need for quick decisions?
- Where do this person's strengths create advantage in this role?

```
┌─────────────────────┐     ┌─────────────────────┐
│ Core Persona        │     │ Role Card           │
│ - Personal needs    │     │ - Role-based needs  │
│ - Personal          │  +  │ - Role-based        │
│   frustrations      │     │   frustrations      │
│ - Motivations       │     │ - Context           │
│ - Behaviours        │     │                     │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
           ┌─────────────────────┐
           │ PAIRING             │
           │ - Quote             │
           │ - Goals as          │
           │   experienced       │
           │ - Pain points       │
           │   (emergent)        │
           │ - Barriers          │
           │ - Opportunities     │
           └─────────────────────┘
```

---

## When to Create a Pairing

Pairings are **optional**. Many teams can simply reference a persona and role directly in their Journey context:

```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"]
}
```

Create a formal Pairing document when you need to:
- **Document emergence** - Capture insights about what happens when this specific persona meets this specific role
- **Share across teams** - Multiple designers need the same persona+role combination
- **Support governance** - Audit trails or sign-off processes require documented artifacts
- **Enable reuse** - The same combination appears in multiple journeys

### Decision Factors

| Factor | Skip Pairing | Create Pairing |
|--------|--------------|----------------|
| Team size | Solo designer or small team | Multiple designers/teams |
| Project scope | Single journey or prototype | Large programme with many journeys |
| Governance | Lightweight, agile process | Formal review/approval required |
| Reuse potential | One-off journey | Same persona+role in multiple journeys |
| Emergence complexity | Straightforward combination | Rich insights from persona-role collision |

### Lightweight Approach

For most teams starting out:
1. Create Core Personas (who someone is)
2. Create Role Cards (what they're trying to achieve)
3. Reference both directly in Journeys
4. Create Pairings later if you find yourself documenting the same emergence insights repeatedly

### When Pairings Add Value

Pairings shine when:
- The persona's behavioural tendencies create interesting friction with role demands
- You've discovered non-obvious insights from research
- Multiple team members need to understand the same synthesis
- You're building a library of reusable persona-role combinations

---

## Schema Structure

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_info` | object | Metadata including version, standard, and dates |
| `identity` | object | ID (with `pairing-` prefix) |
| `references` | object | References to persona and role(s) |
| `synthesis` | object | Emergent insights from the combination |
| `validation` | object | Research sources and confidence level |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `extendedContext` | object | Channels, moments, use cases, metrics |
| `reviewMetadata` | object | Tracking for when sources change |
| `extensions` | object | Custom fields |

---

## Identity

```json
"identity": {
  "id": "pairing-sarah-working-mom",
  "title": "Sarah Martinez as Working Mom Consumer",
  "description": "Sarah's personal values of family wellbeing combined with the demands of being a household purchasing decision maker."
}
```

### ID Convention

**All pairing IDs must use the `pairing-` prefix.**

- Pattern: `pairing-[persona-name]-[role-descriptor]`
- Examples: `pairing-sarah-working-mom`, `pairing-david-it-director`
- Use lowercase, hyphens, no spaces

---

## References

Links to the Core Persona and Role Card(s).

```json
"references": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"]
}
```

### Role Stacking

Pairings support multiple roles for complex scenarios. See [Role Stacking](#role-stacking-1) for comprehensive guidance on when and how to use this pattern.

```json
"references": {
  "personaRef": "persona-maria-rodriguez",
  "roleRefs": [
    "role-senior-sales-rep",
    "role-leadership-aspirant"
  ]
}
```

---

## Role Stacking

### What is Role Stacking?

Role stacking means assigning multiple roles to a single persona in a Pairing. This captures the reality that people often wear multiple hats simultaneously.

```json
"references": {
  "personaRef": "persona-maria-rodriguez",
  "roleRefs": [
    "role-senior-sales-rep",
    "role-team-mentor",
    "role-mental-health-first-aider"
  ]
}
```

### When to Stack Roles

**Consumer contexts:**
- Personal and business banking (same person, different accounts)
- Parent and employee (school communications during work hours)
- Homeowner and landlord (managing own property plus rental)

**Professional contexts:**
- Day job + line management responsibilities
- Technical role + budget holder
- Individual contributor + team mentor
- Employee + union representative

### Benefits of Role Stacking

1. **Comprehensive view** - Understand the full picture of demands on this person
2. **Cumulative barriers** - See how barriers compound across roles
3. **Time competition** - Identify where roles compete for attention
4. **Design opportunities** - Find ways to serve multiple roles simultaneously

### Synthesis in Stacked Pairings

When documenting synthesis for stacked roles:
- Note which barriers come from which role
- Identify where roles create conflicting demands
- Highlight moments when the person must switch contexts
- Document the cognitive load of managing multiple roles

### Example: Multi-Role Employee

Maria as Senior Sales Rep + Team Mentor + Mental Health First Aider:
- **Competing priorities**: Sales targets vs available for mentoring conversations
- **Context switching**: Interrupted by urgent mentee questions during client calls
- **Emotional load**: Supporting others while managing own stress
- **Time pressure**: All three roles have "urgent" demands

---

## Synthesis

The heart of the Pairing - emergent insights from the persona + role combination.

### Quote

A representative statement that brings the pairing to life.

```json
"quote": "I just want to find good products for my family without spending hours researching. Time is more precious than money, but I still need to make smart choices."
```

**Good quotes:**
- Capture the tension between persona tendencies and role demands
- Sound like something this person would actually say
- Reveal underlying priorities and trade-offs

### Goals as Experienced

How this persona frames success in this role. These emerge from combining personal needs with role demands.

```json
"goalsAsExperienced": [
  {
    "text": "Make quick, confident purchase decisions that serve family needs",
    "source": "persona+role",
    "priority": "primary"
  },
  {
    "text": "Balance quality expectations with budget constraints without guilt",
    "source": "role",
    "priority": "primary"
  }
]
```

**Source field:**
- `persona` - Goal primarily from personal needs
- `role` - Goal primarily from role demands
- `persona+role` - Goal emerges from combination

### Pain Points

Friction from the collision of persona tendencies with role demands.

```json
"painPoints": [
  {
    "text": "Time scarcity amplifies anxiety about making wrong purchase decisions",
    "severity": 4,
    "emergesFrom": "Sarah's decision-making thoroughness collides with the role's time constraints"
  }
]
```

**The `emergesFrom` field** explains the synthesis - why this pain point exists for this specific pairing.

### Barriers

Which challenges hit hardest for this persona in this role. Uses the 9-type barrier taxonomy.

```json
"barriers": [
  {
    "barrier": "Concerns about product quality when buying online",
    "type": "knowledge",
    "impact": "Hesitation to purchase unfamiliar products",
    "workarounds": "Relies heavily on reviews and return policies",
    "emergesFrom": "Sarah's cautious nature meets the role's need for efficient online shopping"
  }
]
```

**Barrier Types:** `process`, `technology`, `knowledge`, `resource`, `policy`, `cultural`, `vision`, `communications`, `governance`

See [BARRIER_TAXONOMY.md](../documentation/BARRIER_TAXONOMY.md) for detailed guidance.

### Opportunities

Where this persona's strengths create advantage or where design can help.

```json
"opportunities": [
  "Time-aware product recommendations that surface quality options quickly",
  "Trust signals optimised for quick scanning",
  "Mobile-first shopping experiences for limited-time windows"
]
```

### Emotional Context

Overall emotional tone of this persona's experience in this role.

```json
"emotionalContext": "Generally optimistic but frequently time-stressed. Seeks control and confidence in decisions. Feels guilty when purchases don't work out."
```

---

## Extended Context

Additional context specific to this pairing.

### Channels

How this persona-role combination prefers to interact.

```json
"channels": [
  {
    "channel": "app",
    "medium": "digital",
    "serviceModel": "self_service",
    "name": "Mobile shopping apps",
    "usage_context": "Quick shopping during short time windows",
    "preference_level": "preferred"
  }
]
```

### Moments That Matter

Critical emotional touchpoints for this pairing.

```json
"moments_that_matter": [
  {
    "moment": "First-time purchase decision for unfamiliar product",
    "emotional_intensity": -1,
    "importance": "critical",
    "current_experience": "Anxiety about making the right choice with limited time"
  }
]
```

### Use Cases

Common interaction scenarios.

```json
"use_cases": [
  {
    "scenario": "Quick reordering of household essentials",
    "trigger": "Running low on regular items",
    "outcome": "Fast, one-click repurchase with confidence"
  }
]
```

### Success Metrics

How this pairing measures success.

```json
"success_metrics": [
  {
    "metric": "Time saved on shopping",
    "target": "Under 5 minutes for routine purchases"
  }
]
```

---

## Review Metadata

Optional tracking for when source artifacts change.

```json
"reviewMetadata": {
  "personaLastUpdated": "2026-01-06",
  "roleLastUpdated": "2026-01-06",
  "pairingLastReviewed": "2026-01-06",
  "reviewNotes": "Updated synthesis based on recent customer research"
}
```

When referenced persona or role is updated, the pairing may need review to ensure synthesis remains valid.

---

## Quality Checklist

**References:**
- [ ] personaRef points to valid Core Persona
- [ ] roleRefs point to valid Role Card(s)
- [ ] References use correct ID prefixes

**Synthesis:**
- [ ] Quote captures the pairing's essence
- [ ] At least 3 goals as experienced
- [ ] At least 3 pain points with `emergesFrom` explanations
- [ ] Barriers use valid taxonomy types
- [ ] Opportunities are actionable

**Quality of Synthesis:**
- [ ] Pain points explain the persona-role collision
- [ ] Goals aren't just copied from persona or role
- [ ] Barriers explain why they hit THIS persona harder
- [ ] Opportunities leverage persona strengths

---

## Integration with Journeys

Journeys can reference pairings in three ways:

### Option 1: Simple (persona only)
```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "persona_context": "..."
}
```

### Option 2: Compositional (persona + roles)
```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"],
  "persona_context": "..."
}
```

### Option 3: With formal pairing
```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"],
  "pairingRef": "pairing-sarah-working-mom",
  "persona_context": "..."
}
```

The pairing provides a summary card; the journey explores the experience in detail.

---

## Related Documentation

- [SERVICE-DESIGN-PERSONA-STANDARD.md](SERVICE-DESIGN-PERSONA-STANDARD.md) - Core Persona specification
- [SERVICE-DESIGN-ROLE-CARD-STANDARD.md](SERVICE-DESIGN-ROLE-CARD-STANDARD.md) - Role Card specification
- [SERVICE-DESIGN-JOURNEY-STANDARD.md](SERVICE-DESIGN-JOURNEY-STANDARD.md) - Journey specification
- [BARRIER_TAXONOMY.md](../documentation/BARRIER_TAXONOMY.md) - Barrier types reference
