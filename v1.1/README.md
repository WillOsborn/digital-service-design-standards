# Digital Service Design Standards v1.1

## The Compositional Model

Version 1.1 introduces a compositional model for personas and roles, addressing a fundamental limitation in v1.0.x where personas tightly coupled behavioural characteristics with contextual goals.

The new architecture separates:

- **Core Persona** - Who someone is (behavioural patterns)
- **Role Card** - What they're trying to achieve (contextual goals)
- **Pairing** - The synthesised experience when these combine

```
┌─────────────┐     ┌─────────────┐
│   Persona   │     │    Role     │
│ (Behavioural│  +  │ (Contextual │
│  patterns)  │     │   goals)    │
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

## Quick Start

### Understanding the Model

1. **Core Persona** - The enduring human. Behavioural attributes that persist regardless of context: personal needs, frustrations, motivations, attitudes, technology comfort.

2. **Role Card** - The contextual hat. What someone is trying to achieve: role-based needs, frustrations, responsibilities, success metrics.

3. **Pairing** - The synthesis. What emerges when this persona meets this role: goals as experienced, emergent pain points, barriers, opportunities.

4. **Journey** - The experience over time. Now references persona + role(s) directly.

### ID Conventions

All IDs use type prefixes:
- `persona-sarah-martinez`
- `role-working-mom-consumer`
- `pairing-sarah-working-mom`

---

## Folder Structure

```
v1.1/
├── schemas/
│   ├── core-persona.schema.json
│   ├── role-card.schema.json
│   ├── pairing.schema.json
│   └── journey-schema.json
├── examples/
│   ├── personas/
│   ├── roles/
│   ├── pairings/
│   └── journeys/
├── SERVICE-DESIGN-PERSONA-STANDARD.md
├── SERVICE-DESIGN-ROLE-CARD-STANDARD.md
├── SERVICE-DESIGN-PAIRING-STANDARD.md
├── SERVICE-DESIGN-JOURNEY-STANDARD.md
├── migration-guide.md
└── README.md
```

---

## Usage Patterns

### Simple (Equivalent to v1.0.x)

For teams who want a single artifact per persona:

1. Create Core Persona
2. Add role-specific content via extensions
3. Create Journeys referencing persona only

### Compositional

For teams who want reusable building blocks:

1. Create Core Personas (behavioural archetypes)
2. Create Role Cards (contextual situations)
3. Create Journeys referencing persona + role(s)
4. Optionally create Pairings as summary cards

### Full Documentation

For comprehensive service design:

1. Create Core Personas
2. Create Role Cards
3. Create formal Pairings for key combinations
4. Create Journeys referencing persona + role(s)
5. Use Pairings as reference cards alongside detailed journeys

---

## Research Sources and Validation

### Where to Capture Research

Research evidence can be documented at any level:

| Artifact | What to Document | Example Sources |
|----------|------------------|-----------------|
| **Core Persona** | Behavioural insights, attitudes, preferences | User interviews, surveys, behavioural analytics |
| **Role Card** | Role-specific needs, frustrations, tools | Contextual inquiry, job shadowing, stakeholder interviews |
| **Pairing** | Emergence insights, persona-role collision | Journey workshops, co-design sessions |
| **Journey** | Step-specific findings, touchpoint feedback | Usability testing, service safari, customer feedback |

### Research Source Types

All artifacts support these source types:
- `interview` - One-to-one user research sessions
- `survey` - Quantitative feedback collection
- `analytics` - Behavioural data from systems
- `observation` - Contextual inquiry, service safari
- `existing_research` - Prior studies, industry reports

### Confidence Levels

Rate how well-supported your artifact is:
- `hypothesis` - Based on assumptions, needs validation
- `low` - Limited evidence, some signals
- `medium` - Reasonable evidence, some gaps
- `high` - Strong evidence from multiple sources
- `validated` - Confirmed through testing/iteration

### Pragmatic Approach

Research sources are **recommended but not strictly required**. Common scenarios:

**Start without research:**
- Creating initial hypothetical personas for workshop discussion
- Rapid prototyping before user research budget is approved
- Migrating existing personas that lack source documentation

**Add research later:**
- Update confidence_level as you gather evidence
- Add research_sources when you conduct studies
- Use low confidence as a flag for "needs validation"

### Validation Flow

Research typically flows through artifacts:

```
User Research → Core Persona (behavioural findings)
                    ↓
Contextual Inquiry → Role Card (role-specific findings)
                         ↓
Journey Workshops → Pairing (emergence insights)
                        ↓
Usability Testing → Journey (step-level validation)
```

Each level can have its own validation metadata - you don't need to repeat sources at every level.

---

## Examples

This version includes converted examples from v1.0.3:

**Personas:**
- `persona-sarah-martinez` - Working mom in Austin
- `persona-david-chen` - Technology leader in healthcare
- `persona-maria-rodriguez` - High-performing sales professional

**Roles:**
- `role-working-mom-consumer` - Household purchase decision maker
- `role-it-director-healthcare` - IT leadership in regulated environment
- `role-senior-sales-rep` - Enterprise sales individual contributor

**Pairings:**
- `pairing-sarah-working-mom` - Sarah as working mom consumer
- `pairing-david-it-director` - David as IT Director
- `pairing-maria-sales-rep` - Maria as Senior Sales Rep

**Journeys:**
- `sarah-martinez-clothes-shopping-journey` - Online shopping with return

---

## Documentation

| Document | Description |
|----------|-------------|
| [SERVICE-DESIGN-PERSONA-STANDARD.md](SERVICE-DESIGN-PERSONA-STANDARD.md) | Core Persona specification |
| [SERVICE-DESIGN-ROLE-CARD-STANDARD.md](SERVICE-DESIGN-ROLE-CARD-STANDARD.md) | Role Card specification |
| [SERVICE-DESIGN-PAIRING-STANDARD.md](SERVICE-DESIGN-PAIRING-STANDARD.md) | Pairing specification |
| [SERVICE-DESIGN-JOURNEY-STANDARD.md](SERVICE-DESIGN-JOURNEY-STANDARD.md) | Journey specification |
| [migration-guide.md](migration-guide.md) | Migration from v1.0.x |
| [Research Sources](#research-sources-and-validation) | Where and how to document research evidence |

### Advanced: Service Patterns

Once you're comfortable with the compositional model, explore the Pattern System for reusable journey components:
- [Pattern System Introduction](../patterns/README.md)

---

## Backward Compatibility

v1.0.x documents remain valid:
- Typed personas (Business, Consumer, Employee) are treated as Core Persona + extensions
- v1.0.x journeys are accepted (deprecated `persona_id` field supported)

---

## Version History

- **v1.1.0** (2026-01-06): Compositional model with Core Persona, Role Card, Pairing
- **v1.0.3** (2025-12-03): Multi-attribute channel taxonomy
- **v1.0.2** (2025-11-28): Self-contained schemas, barrier taxonomy
