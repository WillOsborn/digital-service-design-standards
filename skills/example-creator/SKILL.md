---
name: example-creator
description: Creates worked examples (JSON) that demonstrate the schema system. Use when the user wants to create a new persona, role, pairing, journey, or pattern example. Triggers on phrases like "create an example", "new persona example", "write a journey", "example for", "create a persona", "make a role card".
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(node tools/validators/*:*), Task, AskUserQuestion
---

# Example Creator Skill

## Overview

This skill creates worked examples in JSON format that demonstrate the Digital Service Design schema system. Examples include Core Personas, Role Cards, Pairings, Journeys, and Patterns.

## When to Use

- User asks to "create a persona example" or "new persona"
- User wants to "write a journey" or "create a journey example"
- User asks for "an example for [domain/industry]"
- User wants to "create a role card" or "make a pairing"
- User needs a "pattern example" or "pattern variation"

## Key Files to Reference

### Example Directories
- `v1.1/examples/personas/` - Core Persona examples
- `v1.1/examples/roles/` - Role Card examples
- `v1.1/examples/pairings/` - Pairing examples
- `v1.1/examples/journeys/` - Journey examples
- `v1.1/examples/patterns/` - Pattern examples

### Working Examples (Sarah Martinez set)
- `v1.1/examples/personas/persona-sarah-martinez.json` - Core Persona
- `v1.1/examples/roles/role-working-mom-consumer.json` - Role Card
- `v1.1/examples/pairings/pairing-sarah-working-mom.json` - Pairing
- `v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json` - Journey

### Schemas (for validation)
- `v1.1/schemas/core-persona.schema.json`
- `v1.1/schemas/role-card.schema.json`
- `v1.1/schemas/pairing.schema.json`
- `v1.1/schemas/journey.schema.json`
- `v1.1/schemas/pattern.schema.json`

### Reference Documentation
- `documentation/BARRIER_TAXONOMY.md` - 9 barrier types with valid values
- `documentation/CHANNEL_TAXONOMY.md` - Channel classification

## Process

### Step 1: Understand the Request

Clarify:
- What type of example? (persona, role, pairing, journey, pattern)
- What domain/industry? (consumer, healthcare, enterprise, etc.)
- What specific characteristics should it demonstrate?
- Is this part of an existing set or standalone?

### Step 2: Review Existing Examples

Read similar examples to understand:
- Structure and field patterns
- Level of detail expected
- How fields connect across types

```bash
# List existing examples
ls -la v1.1/examples/personas/
ls -la v1.1/examples/roles/
```

### Step 3: Gather Domain Context

If creating for a specific domain, ask about:
- Typical user characteristics
- Common goals and frustrations
- Industry-specific barriers
- Relevant channels and touchpoints

### Step 4: Create the Example

Follow the v1.1 compositional model:

**For Core Persona (who someone is):**
- Behavioral attributes that persist
- Technology comfort, communication preferences
- Personal needs and frustrations
- Decision-making style

**For Role Card (what they're trying to achieve):**
- Contextual goals for this situation
- Role-based needs and frustrations
- Success metrics
- NOT "demands" - use "goals" language

**For Pairing (what emerges):**
- Reference the persona and role(s)
- Goals as actually experienced
- Emergent barriers with `emergesFrom` explaining collision
- Opportunities from the combination

**For Journey (experience over time):**
- Reference persona and role with `personaRef`, `roleRefs`
- Phases with steps, touchpoints, emotions
- Map barriers to friction points
- Include channel usage

### Step 5: Validate the Example

Run the appropriate validator:

```bash
# Validate persona
node tools/validators/validate-v1.1.js v1.1/examples/personas/[filename].json

# Validate journey
node tools/validators/validate-journey.js v1.1/examples/journeys/[filename].json

# Run all tests
node tools/validators/run-all-tests.js
```

### Step 6: Document Connections

Note how this example connects to others:
- Does it need a corresponding role card?
- Should there be a pairing?
- Could it be used in a journey?

## Example Templates

### Core Persona Template
```json
{
  "id": "persona-[name-kebab-case]",
  "schemaVersion": "1.1",
  "name": "[Full Name]",
  "description": "[Brief description of who they are]",
  "technologyComfort": {
    "level": "intermediate",
    "confidenceAreas": ["area1", "area2"],
    "avoidanceAreas": ["area1"]
  },
  "communicationPreferences": {
    "preferredChannels": ["mobile_app", "email"],
    "frequencyPreference": "as_needed",
    "bestTimes": ["morning", "evening"]
  },
  "personalNeeds": ["need1", "need2"],
  "personalFrustrations": ["frustration1"],
  "decisionMakingStyle": {
    "approach": "research_oriented",
    "riskTolerance": "moderate",
    "influences": ["peer_recommendations", "reviews"]
  }
}
```

### Role Card Template
```json
{
  "id": "role-[role-name-kebab-case]",
  "schemaVersion": "1.1",
  "name": "[Role Name]",
  "roleType": "Consumer",
  "description": "[What this role involves]",
  "roleBasedNeeds": [
    "Need related to this role context"
  ],
  "roleBasedFrustrations": [
    "Frustration inherent to this role"
  ],
  "successMetrics": [
    "How success is measured in this role"
  ]
}
```

### Pairing Template
```json
{
  "id": "pairing-[persona]-[role]",
  "schemaVersion": "1.1",
  "name": "[Persona] as [Role]",
  "personaRef": "persona-[name]",
  "roleRefs": ["role-[name]"],
  "description": "How [persona]'s characteristics interact with [role] context",
  "goals": [
    {
      "text": "Goal as actually experienced",
      "priority": "primary"
    }
  ],
  "barriers": [
    {
      "type": "resource",
      "description": "Barrier that emerges",
      "severity": "high",
      "emergesFrom": "Explains how persona trait X collides with role constraint Y"
    }
  ],
  "opportunities": [
    "How persona strengths can be leveraged in this role"
  ]
}
```

## Quality Checklist

Before completing:

- [ ] Example validates against schema (run validator)
- [ ] ID follows naming convention: `[type]-[name-kebab-case]`
- [ ] All required fields are populated
- [ ] Content is realistic and domain-appropriate
- [ ] Barrier types match taxonomy (9 valid types)
- [ ] Channel references are valid
- [ ] `emergesFrom` explains persona-role collision (for pairings)
- [ ] References to other entities are valid (personaRef, roleRefs)
- [ ] No "demands" language - use "goals" for role cards

## Example Session

```
User: Create a persona example for an IT administrator at a medium-sized company.

Claude: I'll create an IT Administrator persona. Let me first check the existing persona examples to match the style and structure.

[Reads persona-sarah-martinez.json for reference]

For an IT Admin, I'm thinking:
- Name: Marcus Thompson
- Technology comfort: Advanced (comfortable with enterprise systems)
- Communication: Prefers ticketing systems and email, dislikes phone interruptions
- Decision style: Process-oriented, risk-averse, values vendor support

Key characteristics:
- Needs to maintain system uptime and security
- Frustrated by shadow IT and unclear requirements
- Values documentation and change management

Does this direction sound right? Any specific aspects you'd like me to emphasize?

User: That sounds good. Make sure to include his frustration with users who don't follow IT policies.

Claude: [Creates persona-marcus-thompson.json with the discussed characteristics]
[Runs validator to confirm it passes]

Done. I've created the Marcus Thompson IT Administrator persona. Here are the key highlights:

- Technology comfort: Advanced with enterprise systems
- Frustration added: "Users bypassing IT policies and creating security risks"
- Decision style: Process-oriented with low risk tolerance

The example validates successfully. Would you like me to create a corresponding Role Card for "IT System Administrator" to pair with this persona?
```
