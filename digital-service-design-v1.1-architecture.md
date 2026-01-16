# Digital Service Design Standards v1.1 Architecture Summary

## Executive Overview

Version 1.1 introduces a compositional model for personas and roles, addressing a fundamental limitation in v1.0.x where personas tightly coupled behavioural characteristics with contextual demands. This created combinatorial explosion when organisations needed to represent the same role occupied by different behavioural types, or the same behavioural type across different roles.

The new architecture separates **who someone is** (Core Persona) from **what context they're operating in** (Role Card), with **Pairings** capturing the synthesised experience when these combine. This model is more honest about how people actually work, easier to maintain, and scales better for complex organisations.

---

## Architectural Philosophy

### The Problem with v1.0.x

The existing model has three persona types (Business, Consumer, Employee) that blend behavioural and contextual attributes. This creates issues:

1. **Combinatorial explosion**: 4 behavioural types × 12 job roles = 48 potential employee personas, each requiring full documentation
2. **Duplication**: Behavioural insights repeated across personas that share characteristics but differ in role
3. **Conceptual blur**: Unclear whether attributes describe the person or their situation
4. **Maintenance overhead**: Updating a behavioural insight requires changes across multiple personas

### The Compositional Solution

Separate concerns into distinct, reusable artifacts:

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

### The Card Deck Mental Model

The architecture can be understood through a physical card metaphor:

- **Persona Cards**: A deck of behavioural archetypes—who people are regardless of context
- **Role Cards**: A deck of contextual situations—what's demanded of people
- **Pairings**: Lay out a persona card with one or more role cards to form a set; the pairing captures what emerges from that combination

This metaphor should guide documentation, tooling UI, and how the standard is explained to users.

---

## Schema Architecture

### Overview

| Schema | Purpose | Structure | Required |
|--------|---------|-----------|----------|
| **Core Persona** | Behavioural archetype—who someone is | Prescribed core + extensions | Yes (replaces typed personas) |
| **Role Card** | Contextual demands—what's asked of them | Light core + flexible extensions | Optional (enables composition) |
| **Pairing** | Synthesised experience snapshot | References + synthesis fields | Optional (can be implicit in Journey) |
| **Customer Journey** | Experience over time | References persona + role(s) directly | Unchanged purpose, updated references |

### Relationships

```
┌──────────────┐
│ Core Persona │◄─────────────────────────────────┐
└──────┬───────┘                                  │
       │                                          │
       │ referenced by                            │ referenced by
       ▼                                          │
┌──────────────┐                          ┌───────┴───────┐
│   Pairing    │◄─── optional ────────────│    Journey    │
└──────┬───────┘                          └───────┬───────┘
       │                                          │
       │ referenced by                            │ referenced by
       ▼                                          │
┌──────────────┐                                  │
│  Role Card   │◄─────────────────────────────────┘
└──────────────┘
```

Journeys can reference:
- A persona alone (simple approach, persona has extensions for role content)
- A persona + one or more roles (compositional approach)
- A formal pairing (full documentation approach)

---

## Core Persona Schema

### Purpose

Captures the universal human—who they are regardless of context. Behavioural patterns, attitudes, motivations, and preferences that persist across situations.

### Design Principles

1. **Universal**: One schema for all persona types (replaces Business/Consumer/Employee variants)
2. **Behavioural focus**: Only attributes that describe the person, not their situation
3. **Prescribed structure**: More defined than Role Cards because human characteristics have natural commonality
4. **Extensible**: Extensions available for attributes we haven't anticipated

### Field Specification

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `schemaVersion` | string | Schema version (1.1.0) |
| `name` | string | Persona name (e.g., "Recent Graduate Rahul") |
| `description` | string | Brief summary of this persona |

#### Core Behavioural Fields

| Field | Type | Description |
|-------|------|-------------|
| `demographics` | object | Age range, location, education, relevant background |
| `personalNeeds` | array[string] | Fundamental human needs—recognition, autonomy, security, belonging, growth, mastery |
| `personalFrustrations` | array[string] | Behavioural tendencies that create friction—impatience, perfectionism, risk aversion |
| `motivations` | array[string] | What drives them as a person |
| `attitudes` | object | Key attitudes and beliefs |
| `technologyComfort` | object | Relationship with technology, digital confidence |
| `communicationPreferences` | object | How they prefer to receive and share information |
| `influences` | array[string] | Who shapes their thinking and behaviour |
| `behaviouralPatterns` | array[string] | Characteristic ways they approach situations |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `learningStyle` | string | How they prefer to acquire new knowledge |
| `riskTolerance` | string | Appetite for uncertainty and change |
| `decisionMakingStyle` | string | How they typically make decisions |

#### Extensions

| Field | Type | Description |
|-------|------|-------------|
| `extensions` | object | Open object for additional attributes not covered by core schema |

### What Moved Out (vs v1.0.x)

The following attributes from v1.0.x typed personas now belong in Role Cards or Pairings:

| Attribute | Now Lives In | Reasoning |
|-----------|--------------|-----------|
| Goals | Pairing (as `goalsAsExperienced`) | Goals are contextual—shaped by role |
| Pain points | Pairing | Emerge from persona-role collision |
| Job title / responsibilities | Role Card | Contextual, not behavioural |
| Tools and systems | Role Card | Role-specific |
| Success metrics | Role Card | Role-specific |
| Tasks and workflows | Role Card | Role-specific |

---

## Role Card Schema

### Purpose

Captures contextual demands—what's asked of someone in a particular situation. This could be an employee role, a consumer context, a business relationship, or any other situation where someone has defined needs to fulfil.

### Design Principles

1. **Flexible**: Light required core with open extensions
2. **Context-agnostic**: Works for employee roles, consumer contexts, business relationships, volunteers, suppliers, etc.
3. **Reusable**: Same role can pair with multiple personas
4. **Stackable**: Multiple roles can combine for complex scenarios (advanced usage)

### Field Specification

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `schemaVersion` | string | Schema version (1.1.0) |
| `title` | string | Human-readable name for the role |
| `description` | string | Brief summary of what this role involves |
| `roleBasedNeeds` | array[string] | What the role requires the person to accomplish |
| `roleBasedFrustrations` | array[string] | Friction inherent to this role |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `roleType` | string | Organisation-defined category (e.g., "Employee", "Consumer", "Volunteer"). Free text, not enumerated. |

#### Extensions

| Field | Type | Description |
|-------|------|-------------|
| `extensions` | object | Open object for role-specific attributes |

### Guidance by Context

The standard should provide guidance (not requirements) on commonly useful fields by context:

**Employee roles often include:**
- Responsibilities
- Tools and systems
- Success metrics / KPIs
- Compliance requirements
- Stakeholders and reporting lines
- Workflows and processes

**Consumer roles often include:**
- Jobs to be done
- Decision factors
- Channels used
- Timeline considerations
- Budget constraints

**Business roles often include:**
- Relationship type
- Decision authority
- Procurement context
- Success criteria
- Contract/SLA considerations

**Other contexts (volunteers, suppliers, etc.):**
- Define what makes sense for your context
- Use extensions freely

### RoleType Guidance

The `roleType` field is optional and accepts any string. The standard provides common patterns without mandating them:

| Pattern | Example Types |
|---------|---------------|
| Relationship-based | Employee, Consumer, Business, Volunteer, Supplier, Partner |
| Internal/External | Internal, External, Hybrid |
| Functional | Operational, Strategic, Support, Customer-facing |

Teams should agree their own role types before creating cards and document them for consistency.

---

## Pairing Schema

### Purpose

Captures the synthesised experience—what happens when a specific persona meets a specific role (or combination of roles). This is the "headline story" of how this person experiences this context.

### Design Principles

1. **Optional artifact**: Pairings can be formally documented OR implicit in Journeys
2. **Synthesis focus**: Contains only emergent attributes, not duplicates from persona/role
3. **Lightweight**: A snapshot or summary card, not exhaustive documentation
4. **Supports stacking**: Can reference multiple roles for complex scenarios

### Field Specification

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `schemaVersion` | string | Schema version (1.1.0) |
| `personaRef` | object | Reference to the persona (`{ "id": "persona-xxx" }`) |
| `roleRefs` | array[object] | References to one or more roles (`[{ "id": "role-xxx" }]`) |

#### Synthesis Fields

| Field | Type | Description |
|-------|------|-------------|
| `quote` | string | A statement that brings to life this persona's experience in this context |
| `goalsAsExperienced` | array[string] | How this persona frames success in this role |
| `painPoints` | array[string] | Friction from the collision of persona tendencies with role demands |
| `barriers` | array[object] | Which challenges hit hardest for this persona (uses barrier taxonomy) |
| `opportunities` | array[string] | Where this persona's strengths create advantage |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Human-readable name (e.g., "Recent Graduate as HR Advisor") |
| `description` | string | Summary of this pairing |
| `emotionalContext` | string | Overall emotional tone of this experience |

#### Review Tracking

| Field | Type | Description |
|-------|------|-------------|
| `reviewMetadata` | object | Optional tracking for when source artifacts change |
| `reviewMetadata.personaLastUpdated` | datetime | When referenced persona was last updated |
| `reviewMetadata.roleLastUpdated` | datetime | When referenced role(s) were last updated |
| `reviewMetadata.pairingLastReviewed` | datetime | When this pairing was last reviewed |

### Role Stacking

Pairings support referencing multiple roles for complex scenarios:

```json
{
  "personaRef": { "id": "persona-recent-grad" },
  "roleRefs": [
    { "id": "role-hr-advisor" },
    { "id": "role-system-super-user" }
  ]
}
```

This is an advanced feature. Simple usage involves one persona + one role.

Guidance for stacking:
- Any role can stack with any other
- The pairing captures the combined experience
- Useful for employees with multiple responsibilities, consumers in complex contexts, etc.

---

## Customer Journey Schema Updates

### Changes from v1.0.x

The primary change is how journeys reference personas and roles.

#### Previous (v1.0.x)

```json
{
  "personaRef": { "id": "persona-hr-advisor-young" }
}
```

Journey referenced a typed persona that contained both behavioural and contextual attributes.

#### New (v1.1)

```json
{
  "personaRef": { "id": "persona-recent-grad" },
  "roleRefs": [
    { "id": "role-hr-advisor" }
  ]
}
```

Journey references persona and role(s) directly. No intermediate pairing ID required.

### Reference Specification

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `personaRef` | object | Yes | Reference to a Core Persona |
| `roleRefs` | array[object] | No | References to Role Card(s). Empty/omitted for simple approach. |

### Flexibility Maintained

| Approach | personaRef | roleRefs | How It Works |
|----------|------------|----------|--------------|
| Simple | Points to persona with extensions | Omitted or empty | Persona contains role content via extensions |
| Compositional | Points to core persona | One or more roles | Journey explores persona in role context |
| With formal pairing | Points to core persona | One or more roles | Pairing exists separately as summary card |

### Querying Benefits

Direct references enable useful queries:
- "Show all journeys for Role: Consumer Sofa Buyer" → Different personas, same purchase context
- "Show all journeys for Persona: Tech-Savvy Minimalist" → Same person, different contexts
- "Show all journeys for Persona X + Role Y" → Specific combination

---

## Backward Compatibility

### Migration Path

v1.0.x documents remain valid with the following understanding:

| v1.0.x Artifact | v1.1 Interpretation |
|-----------------|---------------------|
| Business Persona | Core Persona with role content in extensions |
| Consumer Persona | Core Persona with role content in extensions |
| Employee Persona | Core Persona with role content in extensions |
| Customer Journey | Journey referencing persona only (roleRefs empty) |

### Validation Approach

The v1.1 validator should:
1. Accept v1.0.x typed personas as valid (treated as core + extensions)
2. Accept new Core Persona schema
3. Accept Role Card schema
4. Accept Pairing schema
5. Accept Journeys with either reference style

### Deprecation

v1.0.x typed personas (Business, Consumer, Employee as distinct types) are not removed but are:
- No longer the recommended approach
- Documented as "simple approach" for teams not needing composition
- Supported indefinitely for backward compatibility

---

## Usage Patterns

### Simple (Equivalent to v1.0.x)

For teams who want a single artifact per persona:

1. Create Core Persona
2. Add role-specific content via extensions
3. Create Journeys referencing persona only

**When to use**: Small teams, simple contexts, quick documentation needs.

### Compositional

For teams who want reusable building blocks:

1. Create Core Personas (behavioural archetypes)
2. Create Role Cards (contextual situations)
3. Create Journeys referencing persona + role(s)
4. Optionally create Pairings as summary cards

**When to use**: Multiple personas across multiple roles, need to avoid duplication, want to explore combinations.

### Full Documentation

For comprehensive service design:

1. Create Core Personas
2. Create Role Cards
3. Create formal Pairings for key combinations
4. Create Journeys referencing persona + role(s)
5. Use Pairings as reference cards alongside detailed journeys

**When to use**: Large organisations, complex services, need both summary views and detailed exploration.

---

## Tooling Implications

### Schema Files

| File | Action | Notes |
|------|--------|-------|
| `persona-business.schema.json` | Deprecate (keep for compatibility) | Mark as legacy |
| `persona-consumer.schema.json` | Deprecate (keep for compatibility) | Mark as legacy |
| `persona-employee.schema.json` | Deprecate (keep for compatibility) | Mark as legacy |
| `persona-core.schema.json` | Create new | Universal persona schema |
| `role-card.schema.json` | Create new | Flexible role schema |
| `pairing.schema.json` | Create new | Synthesis schema |
| `customer-journey.schema.json` | Update | Add roleRefs, update personaRef |
| `definitions.schema.json` | Update | Shared types and references |

### Validator Updates

| Capability | Change |
|------------|--------|
| Persona validation | Support both legacy types and new Core Persona |
| Role Card validation | New validation with light required core |
| Pairing validation | New validation including reference checking |
| Journey validation | Support both reference styles |
| Cross-reference checking | Validate that referenced personas/roles exist |
| Review flag checking | Warn when pairing may need review (optional) |

### Converter Updates

| Capability | Change |
|------------|--------|
| Document to Persona | Target Core Persona schema, suggest role content for separate card |
| Document to Role | New conversion capability |
| Document to Pairing | New conversion capability |
| Legacy migration | Convert v1.0.x typed personas to Core + extensions |

### Renderer Updates

| Capability | Change |
|------------|--------|
| Persona rendering | Handle Core Persona with extensions |
| Role Card rendering | New rendering capability |
| Pairing rendering | New rendering—show persona, role(s), and synthesis together |
| Journey rendering | Resolve and display persona + role context |
| Card deck view | New view showing personas and roles as combinable cards |

### Plugin Updates (Figma, etc.)

| Capability | Change |
|------------|--------|
| Import | Support all new schema types |
| Export | Generate Core Persona, Role Card, or Pairing |
| Visualisation | Card-based UI for composition |

---

## Documentation Updates

### Standards Document

- Explain compositional model and rationale
- Card deck mental model
- When to use simple vs compositional vs full documentation
- Field-by-field guidance for each schema
- RoleType guidance and patterns
- Stacking explanation (advanced section)

### Website Content

- Update messaging to reflect compositional approach
- Visual explanation of card deck model
- Interactive demo of combining cards
- Migration guidance for existing users

### Examples

Create example files for:
- Core Persona (2-3 examples)
- Role Card—Employee context
- Role Card—Consumer context
- Role Card—Other context (volunteer, supplier)
- Pairing—Simple (one role)
- Pairing—Stacked (multiple roles)
- Journey—Simple approach (persona only)
- Journey—Compositional approach (persona + roles)

---

## Version Numbering

### Why 1.1.0 (not 2.0.0)

Per semantic versioning:
- **Major (2.0)**: Breaking changes—existing valid documents become invalid
- **Minor (1.1)**: Additive changes—new capabilities, existing documents still valid

This release is additive:
- v1.0.x personas remain valid
- v1.0.x journeys remain valid
- New schemas are introduced alongside, not replacing
- Compositional model is recommended, not required

### Version String

All new and updated schemas should use `"schemaVersion": "1.1.0"`

---

## Summary of Changes

| Area | Change Type | Description |
|------|-------------|-------------|
| Persona | Evolved | Three typed schemas → One universal Core Persona schema |
| Role Card | New | Flexible contextual schema with light core |
| Pairing | New | Optional synthesis schema |
| Journey | Updated | Now references persona + role(s) directly |
| Needs/Frustrations | Clarified | Split into Personal (persona) and Role-Based (role) |
| Extensions | Unchanged | Available on all schemas |
| Barrier taxonomy | Unchanged | Reused in Pairings |
| Emotional arc | Unchanged | Remains in Journey schema |

---

## Implementation Sequence

Recommended order for implementation:

1. **Core Persona schema** — Foundation for everything else
2. **Role Card schema** — Enables composition
3. **Pairing schema** — Synthesis layer
4. **Journey schema updates** — Updated references
5. **Validator updates** — Support all new schemas
6. **Example files** — Demonstrate patterns
7. **Converter updates** — Handle new schemas
8. **Renderer updates** — Visualise new structures
9. **Documentation** — Standards and guidance
10. **Plugins** — Figma and other integrations

---

## Open Questions for Implementation

1. **Barrier taxonomy**: Does it need updates for the new model, or does it work as-is in Pairings?
2. **Emotional arc**: Should Pairings have a summary emotional state, or does that only live in Journeys?
3. **ID conventions**: Should IDs have prefixes indicating type (e.g., `persona-xxx`, `role-xxx`, `pairing-xxx`)?
4. **File organisation**: Folder structure for libraries with multiple schema types?

These can be resolved during implementation based on what works best in practice.
