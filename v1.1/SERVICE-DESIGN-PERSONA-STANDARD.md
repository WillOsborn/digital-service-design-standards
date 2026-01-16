# Service Design Persona Standard v1.1

## Core Persona Schema

**Version:** 1.1.0
**Last Updated:** 2026-01-06
**Status:** Official Standard

---

## Overview

The Core Persona schema represents **the enduring human** - behavioural attributes that persist regardless of context or role. This is a fundamental shift from v1.0.x, where personas blended behavioural characteristics with contextual demands.

### What Changed from v1.0.x

| v1.0.x Approach | v1.1 Approach |
|-----------------|---------------|
| Three typed schemas (Business, Consumer, Employee) | One universal Core Persona schema |
| Goals mixed personal and role-specific | Personal needs only (role goals move to Role Card) |
| Pain points blended behavioural and situational | Personal frustrations only (role frustrations move to Role Card) |
| Tight coupling of person and context | Clean separation of who vs. what |

### The Compositional Model

```
┌─────────────┐     ┌─────────────┐
│   Persona   │     │    Role     │
│ (Behavioural│  +  │ (Contextual │
│  patterns)  │     │  demands)   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                ▼
        ┌───────────────┐
        │    Pairing    │
        │ (Synthesised  │
        │  experience)  │
        └───────────────┘
```

---

## Schema Structure

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_info` | object | Metadata including version, standard, and dates |
| `identity` | object | ID (with `persona-` prefix), name, summary |
| `behavioural_attributes` | object | Core behavioural characteristics |
| `validation` | object | Research sources and confidence level |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `demographics` | object | Age, location, education, background |
| `extensions` | object | Custom and legacy fields |

---

## Identity

The identity section establishes who this persona represents.

```json
"identity": {
  "id": "persona-sarah-martinez",
  "name": "Sarah Martinez",
  "summary": "32-year-old in Austin who values convenience, quality, and family wellbeing..."
}
```

### ID Convention

**All persona IDs must use the `persona-` prefix.**

- Pattern: `persona-[descriptive-name]`
- Examples: `persona-sarah-martinez`, `persona-tech-savvy-graduate`
- Use lowercase, hyphens, no spaces

---

## Demographics

Universal demographic information that applies regardless of role.

```json
"demographics": {
  "age": 32,
  "location": "Austin, Texas",
  "education": "Bachelor's Degree in Marketing",
  "background": "Working professional and mom. Active in community."
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `age` | integer | Age in years (16-99) |
| `location` | string | City, state, region, or country |
| `education` | string | Educational background |
| `background` | string | Relevant background (professional history, life stage) |

---

## Behavioural Attributes

The heart of the Core Persona - characteristics that persist regardless of role.

### Personal Needs

Fundamental human needs that drive behaviour. Based on universal need categories.

```json
"personalNeeds": [
  {
    "text": "Maintain family wellbeing and happiness",
    "type": "belonging"
  },
  {
    "text": "Feel confident in decisions that affect her family",
    "type": "security"
  }
]
```

**Need Types:**
- `recognition` - Being seen and valued
- `autonomy` - Control over choices and actions
- `security` - Safety, stability, predictability
- `belonging` - Connection, community, relationships
- `growth` - Learning, development, improvement
- `mastery` - Competence, skill, expertise
- `other` - Needs that don't fit standard categories

### Personal Frustrations

Behavioural tendencies that create friction - these are about the person, not their situation.

```json
"personalFrustrations": [
  {
    "text": "Feeling rushed and time-pressured in daily routines",
    "severity": 4,
    "context": "Consistently balancing multiple responsibilities"
  }
]
```

**Good examples (behavioural):**
- "Impatience with slow decision-making"
- "Anxiety about making wrong choices"
- "Difficulty trusting information sources"

**Move to Role Card (situational):**
- "Limited budget for purchases" → Role-based frustration
- "Too many product options" → Role-based frustration

### Motivations

What drives them as a person.

```json
"motivations": [
  {
    "text": "Family wellbeing and happiness",
    "type": "intrinsic"
  },
  {
    "text": "Value for money",
    "type": "extrinsic"
  }
]
```

**Motivation Types:**
- `intrinsic` - Internal satisfaction and fulfilment
- `extrinsic` - External rewards and recognition
- `social` - Connection and relationships
- `achievement` - Accomplishment and success

### Attitudes

Key attitudes and beliefs that shape behaviour.

```json
"attitudes": [
  {
    "domain": "quality",
    "attitude": "Willing to pay more for quality when it benefits the family"
  },
  {
    "domain": "technology",
    "attitude": "Embraces technology that genuinely saves time"
  }
]
```

### Technology Comfort

Relationship with technology and digital confidence.

```json
"technologyComfort": {
  "level": "intermediate",
  "description": "Smartphone-first user. Active on Instagram and Pinterest...",
  "preferredDevices": ["smartphone", "tablet", "laptop"]
}
```

**Levels:** `beginner`, `intermediate`, `advanced`, `expert`

### Communication Preferences

How they prefer to receive and share information.

```json
"communicationPreferences": {
  "preferred": ["app", "social_media"],
  "acceptable": ["email", "in_person"],
  "avoided": ["phone"],
  "style": "Prefers concise, visual communication."
}
```

### Influences

Who shapes their thinking and behaviour.

```json
"influences": [
  {
    "source": "Family and friends",
    "description": "Trusted recommendations from people with similar lifestyles"
  }
]
```

### Behavioural Patterns

Characteristic ways they approach situations.

```json
"behaviouralPatterns": [
  {
    "pattern": "Researches thoroughly before committing to significant purchases",
    "context": "Any purchase affecting family wellbeing or budget"
  }
]
```

### Additional Optional Fields

| Field | Description |
|-------|-------------|
| `learningStyle` | How they prefer to acquire new knowledge |
| `riskTolerance` | Appetite for uncertainty (`risk_averse`, `cautious`, `moderate`, `risk_tolerant`, `risk_seeking`) |
| `decisionMakingStyle` | How they typically make decisions |

---

## Validation

Research backing for this persona.

```json
"validation": {
  "research_sources": [
    {
      "source": "Customer interviews (March 2024)",
      "type": "interview",
      "date": "2024-03-15",
      "confidence": "high"
    }
  ],
  "confidence_level": "high"
}
```

---

## What Moved to Other Schemas

### Now in Role Card

| Attribute | Reasoning |
|-----------|-----------|
| Job title / responsibilities | Contextual, not behavioural |
| Business context | Role-specific |
| Work context | Role-specific |
| Role-based goals | Goals shaped by role demands |
| Role-based frustrations | Frustrations inherent to the role |
| Tools and systems | Role-specific |
| Success metrics | Role-specific |

### Now in Pairing

| Attribute | Reasoning |
|-----------|-----------|
| Goals as experienced | Emerge from persona + role combination |
| Pain points | Emerge from persona tendencies meeting role demands |
| Barriers | Often emerge from persona-role interaction |
| Channels (detailed) | Usage context depends on role |
| Moments that matter | Specific to persona-in-role experience |
| Use cases | Specific to persona-in-role context |

---

## Quality Checklist

**Identity:**
- [ ] ID uses `persona-` prefix
- [ ] Name is memorable and relatable
- [ ] Summary captures behavioural essence (not role)

**Behavioural Attributes:**
- [ ] At least 3 personal needs with types
- [ ] At least 3 personal frustrations (behavioural, not situational)
- [ ] At least 3 motivations with types
- [ ] Technology comfort level and description

**Validation:**
- [ ] At least one research source
- [ ] Confidence level specified
- [ ] Sources are recent (within 18 months ideally)

**Separation of Concerns:**
- [ ] No role-specific goals (move to Role Card)
- [ ] No situational frustrations (move to Role Card)
- [ ] No job titles or responsibilities (move to Role Card)

---

## Migration from v1.0.x

See [migration-guide.md](migration-guide.md) for detailed instructions on converting v1.0.x typed personas to the v1.1 compositional model.

---

## Related Documentation

- [SERVICE-DESIGN-ROLE-CARD-STANDARD.md](SERVICE-DESIGN-ROLE-CARD-STANDARD.md) - Role Card specification
- [SERVICE-DESIGN-PAIRING-STANDARD.md](SERVICE-DESIGN-PAIRING-STANDARD.md) - Pairing specification
- [SERVICE-DESIGN-JOURNEY-STANDARD.md](SERVICE-DESIGN-JOURNEY-STANDARD.md) - Journey specification
- [migration-guide.md](migration-guide.md) - Migration from v1.0.x
