# Getting Started with Digital Service Design Standards

**Version:** 1.1 | **Updated:** January 2026

---

## What Are Digital Service Design Standards?

Digital Service Design Standards provide a **professional framework for creating consistent, evidence-based service design artifacts**. Instead of every team creating personas and journeys in different formats, these standards provide structured schemas that ensure:

- **Consistency** across projects and teams
- **Reusability** of insights and research
- **Tool compatibility** for analysis and sharing
- **Evidence-based design** with measurable outcomes

Whether you're a service designer, UX researcher, or product team, these standards help you capture user insights in a format that's both human-readable and machine-processable.

**Want to understand the bigger picture?**
- [Why these standards exist](documentation/POSITIONING.md) - Value proposition and positioning
- [Technical architecture](documentation/SCHEMA_ARCHITECTURE.md) - Design decisions and structure

---

## The v1.1 Compositional Model

Version 1.1 introduces a powerful compositional approach that separates **who someone is** from **what they're trying to achieve**. This creates reusable building blocks that can be combined in different ways.

### The Four Foundations

```
┌─────────────────┐     ┌─────────────────┐
│  Core Persona   │     │   Role Card     │
│  (who someone   │  +  │  (what they're  │
│      is)        │     │    achieving)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
             ┌───────────────┐
             │    Pairing    │
             │  (synthesis)  │
             └───────┬───────┘
                     │
                     ▼
             ┌───────────────┐
             │    Journey    │
             │ (experience   │
             │  over time)   │
             └───────────────┘
```

#### 1. Core Persona - Who someone is

The **enduring human** - behavioral attributes that persist regardless of context:
- Technology comfort and communication preferences
- Personal needs, frustrations, and motivations
- Decision-making style and risk tolerance
- How they learn and what influences them

**Example:** Sarah Martinez is research-oriented, prefers mobile apps, has intermediate tech comfort, and values efficiency.

#### 2. Role Card - What they're trying to achieve

The **contextual hat** - goals and constraints specific to a situation:
- What they need to accomplish in this role
- Frustrations inherent to this context
- Success metrics and constraints
- Domain-specific requirements

**Two role contexts:** Choose based on accountability:
- **Consumer** - Acting in personal capacity (accountable to themselves)
- **Professional** - Acting in organisational capacity (accountable to an organisation)

For professional roles, specify the relationship:
- `internal` - Employee, contractor, temp
- `external` - B2B buyer, client from another organisation
- `partner` - Supplier, vendor, agency

**Example:** As a "Working Mom Consumer," Sarah needs to make household purchase decisions efficiently, within budget constraints, while juggling time pressures. This uses `consumerContext` because she's acting for herself and her family.

#### 3. Pairing - What emerges when combined

The **synthesis** - what happens when this persona operates in this role:
- Goals as actually experienced (not just listed)
- Emergent barriers that arise from the combination
- Pain points from persona-role collision
- Opportunities to leverage persona strengths

**Example:** When Sarah (research-oriented) operates as Working Mom Consumer (time-constrained), the barrier "insufficient time for research" emerges - she wants to research but the role doesn't allow it.

#### 4. Journey - The experience over time

The **story** - steps and phases of an interaction:
- Phases with steps, touchpoints, and emotions
- References to persona + role for context
- Barriers mapped to specific friction points
- Channels used at each touchpoint

**Example:** Sarah's clothes shopping journey shows how her behavioral tendencies interact with role demands across discovery, evaluation, purchase, and post-purchase phases.

### Why This Matters

The compositional model enables powerful combinations:
- **Same persona, different roles**: How does Sarah behave as a consumer vs. an employee?
- **Same role, different personas**: How do different people experience "Working Mom Consumer"?
- **Reusable insights**: Research about Sarah applies wherever she appears
- **Evidence-based design**: Understand *why* barriers emerge, not just *what* they are

---

## Quick Start (30 minutes)

### Step 1: Understand the Model (10 min)

Read the compositional model overview:
→ [`v1.1/README.md`](v1.1/README.md)

This explains:
- The three-layer architecture (Persona + Role + Pairing)
- ID conventions (`persona-`, `role-`, `pairing-` prefixes)
- Usage patterns (simple, compositional, full documentation)

### Step 2: See It In Action (10 min)

Review a complete example set:

| Type | File | What to look for |
|------|------|------------------|
| Core Persona | [`v1.1/examples/personas/persona-sarah-martinez.json`](v1.1/examples/personas/persona-sarah-martinez.json) | Behavioral attributes, technology comfort, motivations |
| Role Card | [`v1.1/examples/roles/role-working-mom-consumer.json`](v1.1/examples/roles/role-working-mom-consumer.json) | Role-based needs, frustrations, context |
| Pairing | [`v1.1/examples/pairings/pairing-sarah-working-mom.json`](v1.1/examples/pairings/pairing-sarah-working-mom.json) | Emergent barriers with `emergesFrom`, goals as experienced |

### Step 3: Explore a Journey (10 min)

See how it all comes together:
→ [`v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json`](v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json)

Notice:
- `context.personaRef` and `context.roleRefs` linking to the examples above
- Phases and steps with emotional journey
- Barriers mapped to specific touchpoints
- Channel usage patterns

---

## Quick Start Paths

### Choose Your Path

Select based on your team's needs and maturity:

---

### Path 1: Minimum Viable (Simplest)

**For:** Teams new to structured personas, quick prototypes, small projects

**What you need:**
- Core Persona schema only
- Journey schema for mapping experiences

**Steps:**
1. Copy `v1.1/examples/personas/persona-sarah-martinez.json` as a template
2. Replace Sarah's details with your user research
3. Copy `v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json`
4. Adapt the journey to your service
5. Validate with: `node tools/validators/validate-v1.1.js your-file.json`

**Skip:** Role Cards, Pairings, custom fields

---

### Path 2: With Custom Fields

**For:** Teams needing organisation-specific data (compliance, segmentation)

**What you need:**
- Core Persona with `extensions.custom` fields
- Journey with custom lanes

**Steps:**
1. Start with Path 1
2. Add your organisation's fields to `extensions.custom`:
   ```json
   "extensions": {
     "custom": {
       "customer_segment": "Premium",
       "data_classification": "PII"
     }
   }
   ```
3. Add custom lanes to journeys for your specific needs

---

### Path 3: Compositional (Recommended)

**For:** Teams managing multiple persona-role combinations

**What you need:**
- Core Personas (who someone is)
- Role Cards (what they're trying to achieve)
- Journeys referencing both

**Steps:**
1. Create Core Personas for your key user types
2. Create Role Cards for the contexts they operate in
3. Reference persona + role in Journey context:
   ```json
   "context": {
     "personaRef": "persona-your-user",
     "roleRefs": ["role-their-context"]
   }
   ```
4. Skip Pairings unless you need to document emergence insights

---

### Path 4: Full Documentation

**For:** Large programmes, governance requirements, design system libraries

**What you need:**
- All artifact types
- Pairings for key combinations
- Custom fields throughout

**Steps:**
1. Complete Path 3
2. Add Pairings for frequently-used persona+role combinations
3. Document `emergesFrom` insights in Pairings
4. Add organisation-specific extensions to all artifacts
5. Consider patterns for reusable journey components

---

### Quick Reference

| Path | Artifacts | Best For |
|------|-----------|----------|
| 1 | Persona + Journey | Quick start, prototypes |
| 2 | + Custom fields | Organisation-specific needs |
| 3 | + Role Cards | Multiple persona-role combinations |
| 4 | + Pairings + Patterns | Large programmes, design systems |

---

## File Structure

```
schemas/
├── GETTING_STARTED.md              ← You are here
├── CHANGELOG.md                     ← Version history
│
├── v1.1/                           ← Current version
│   ├── README.md                   ← Compositional model overview
│   ├── schemas/                    ← JSON Schema definitions
│   │   ├── core-persona.schema.json
│   │   ├── role-card.schema.json
│   │   ├── pairing.schema.json
│   │   └── journey-schema.json
│   ├── examples/                   ← Working examples
│   │   ├── personas/
│   │   ├── roles/
│   │   ├── pairings/
│   │   └── journeys/
│   └── SERVICE-DESIGN-*-STANDARD.md ← Detailed specifications
│
├── documentation/                  ← Guides and references
│   ├── getting-started/            ← Creating your first artifacts
│   ├── implementation/             ← Team rollout guides
│   ├── BARRIER_TAXONOMY.md         ← 9 barrier types reference
│   └── CHANNEL_TAXONOMY.md         ← Channel classification
│
├── skills/                         ← Claude skills (copy to your .claude/skills/)
│
└── tools/                          ← Validators and utilities
```

---

## Learning Paths

### For Service Designers (Creating Personas & Journeys)

**Week 1: Understanding**
1. This guide (you're here)
2. [`v1.1/README.md`](v1.1/README.md) - Compositional model
3. Review all three Sarah Martinez examples

**Week 2: Creating**
1. [`documentation/getting-started/README.md`](documentation/getting-started/README.md) - Comprehensive intro
2. [`documentation/getting-started/your-first-persona.md`](documentation/getting-started/your-first-persona.md) - Step-by-step guide
3. Create your first Core Persona

**Week 3: Expanding**
1. Create a Role Card for your persona
2. Create a Pairing to capture emergence
3. Start a Journey referencing your work

### For Team Leads (Rolling Out to Teams)

1. [`documentation/implementation/implementation-guide.md`](documentation/implementation/implementation-guide.md) - Full rollout process
2. [`documentation/implementation/quality-checklist.md`](documentation/implementation/quality-checklist.md) - Standards
3. [`tools/validators/`](tools/validators/) - Validation tooling

---

## Tooling

### Current Tooling

#### Validators (Available Now)

Command-line tools for validating your JSON files against schemas.

**Location:** `tools/validators/`

**Usage:**
```bash
# Validate any v1.1 artifact (auto-detects type)
node tools/validators/validate-v1.1.js path/to/your-file.json

# Validate specifically (v1.0.x)
node tools/validators/validate-persona.js path/to/persona.json
node tools/validators/validate-journey.js path/to/journey.json
```

**What you get:**
- Schema validation (required fields, correct types)
- Quality scoring (0-100%)
- Specific feedback on improvements

#### Claude Skills (Available Now)

If you're using Claude, a comprehensive set of skills automates creation, validation, and visualization.

**Location:** `skills/` (copy to your `.claude/skills/`)

**Installation:**
```bash
cp -r skills/* ~/.claude/skills/
```

**Key skills:**
| Skill | What It Does |
|-------|--------------|
| `persona-builder` | Interactive persona creation with guided questions |
| `role-builder` | Step-by-step role card creation |
| `journey-builder` | Phase-by-phase journey mapping |
| `journey-renderer` | Creates visual horizontal journey maps |
| `persona-renderer` | Creates visual cards for personas/roles |
| `import-helper` | Converts images, PDFs, spreadsheets to schema JSON |
| `schema-validator` | Validates with clear error reporting |

**Usage:** Just ask naturally - "Build a persona for a first-time buyer" or "Render the Sarah Martinez journey"

See [`skills/README.md`](skills/README.md) for the full catalog.

#### Claude Manager (For Scale)

For organisations managing many artifacts, Claude Manager provides scale tooling.

**Location:** `tools/claude-manager/`

**Features:**
- Organisation configuration (custom fields, validation rules)
- Artifact registry (index, search, relationships)
- Bulk operations (update multiple artifacts)
- Portfolio reports (coverage, quality, barriers)
- Standards enforcement (compliance checking)

See [`tools/claude-manager/README.md`](tools/claude-manager/README.md) for setup.

### Workflows

#### With Claude (Recommended)

1. **Install skills** - `cp -r skills/* ~/.claude/skills/`
2. **Create** - "Build a persona for [description]"
3. **Validate** - "Validate my persona" (automatic)
4. **Visualise** - "Render the persona as a card"
5. **Iterate** - "Add more detail about technology comfort"

#### Without Claude

1. **Create** - Write JSON files manually using examples as templates
2. **Validate** - Run `node tools/validators/validate-v1.1.js your-file.json`
3. **Iterate** - Fix issues flagged by validator

---

## Key Resources

### Schemas (JSON definitions)
- [`v1.1/schemas/core-persona.schema.json`](v1.1/schemas/core-persona.schema.json) - Core Persona structure
- [`v1.1/schemas/role-card.schema.json`](v1.1/schemas/role-card.schema.json) - Role Card structure
- [`v1.1/schemas/pairing.schema.json`](v1.1/schemas/pairing.schema.json) - Pairing structure
- [`v1.1/schemas/journey-schema.json`](v1.1/schemas/journey-schema.json) - Journey structure

### Reference Documentation
- [`documentation/BARRIER_TAXONOMY.md`](documentation/BARRIER_TAXONOMY.md) - 9 barrier types
- [`documentation/CHANNEL_TAXONOMY.md`](documentation/CHANNEL_TAXONOMY.md) - Channel classification
- [`documentation/TERMINOLOGY.md`](documentation/TERMINOLOGY.md) - Language guide

### Detailed Standards
- [`v1.1/SERVICE-DESIGN-PERSONA-STANDARD.md`](v1.1/SERVICE-DESIGN-PERSONA-STANDARD.md) - Core Persona spec
- [`v1.1/SERVICE-DESIGN-ROLE-CARD-STANDARD.md`](v1.1/SERVICE-DESIGN-ROLE-CARD-STANDARD.md) - Role Card spec
- [`v1.1/SERVICE-DESIGN-PAIRING-STANDARD.md`](v1.1/SERVICE-DESIGN-PAIRING-STANDARD.md) - Pairing spec
- [`v1.1/SERVICE-DESIGN-JOURNEY-STANDARD.md`](v1.1/SERVICE-DESIGN-JOURNEY-STANDARD.md) - Journey spec

---

## Next Steps

**Right now:** Open [`v1.1/README.md`](v1.1/README.md) and read the compositional model overview.

**This week:** Review the Sarah Martinez examples to see the model in action.

**When ready:** Follow the learning path for your role above.

---

**The compositional model separates *who someone is* from *what they're trying to achieve* - creating reusable, evidence-based building blocks for service design.**
