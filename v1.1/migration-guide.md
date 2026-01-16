# Migration Guide: v1.0.x to v1.1

## Overview

This guide helps you convert v1.0.x typed personas (Business, Consumer, Employee) to the v1.1 compositional model (Core Persona + Role Card + Pairing).

---

## Key Changes

| v1.0.x | v1.1 |
|--------|------|
| Three typed persona schemas | One universal Core Persona schema |
| Persona contains all context | Context moves to Role Card |
| Single artifact | Three artifacts (persona, role, optional pairing) |
| `persona_id` in journeys | `personaRef` + `roleRefs` in journeys |
| IDs without prefixes | IDs with type prefixes |

---

## Step-by-Step Migration

### Step 1: Create Core Persona

Extract behavioural attributes from your v1.0.x persona.

#### What Moves to Core Persona

| v1.0.x Field | v1.1 Core Persona Field |
|--------------|------------------------|
| `identity.name` | `identity.name` |
| `identity.id` | `identity.id` (add `persona-` prefix) |
| `identity.summary` | `identity.summary` (focus on behaviour) |
| `demographics` | `demographics` |
| `lifestyle.lifestyle` | `behavioural_attributes` |
| `lifestyle.technology_usage` | `behavioural_attributes.technologyComfort` |
| `core_attributes.motivations` | `behavioural_attributes.motivations` |
| `validation` | `validation` |

#### Personal vs. Role-Based

Split goals and pain points:

**Personal (stays in Core Persona):**
- "Feel confident in decisions" → `personalNeeds`
- "Anxiety about making wrong choices" → `personalFrustrations`

**Role-Based (moves to Role Card):**
- "Find products that save time" → `roleBasedNeeds`
- "Limited time for research" → `roleBasedFrustrations`

### Step 2: Create Role Card

Extract contextual goals from your v1.0.x persona.

#### What Moves to Role Card

| v1.0.x Field | v1.1 Role Card Field |
|--------------|---------------------|
| `business_context` | `roleContext.professionalContext` (external) |
| `work_context` | `roleContext.professionalContext` (internal) |
| `lifestyle.shopping_behavior` | `roleContext.consumerContext` |
| `decision_making` | `roleContext.professionalContext` |
| Role-specific goals | `roleBasedNeeds` |
| Role-specific pain points | `roleBasedFrustrations` |

#### ID Convention

Create a descriptive role ID:
- `role-working-mom-consumer` (not `role-sarah`)
- `role-it-director-healthcare` (not `role-david`)

Roles should be reusable with different personas.

### Step 3: Create Pairing (Optional)

Synthesise the persona + role combination.

#### What Goes in Pairing

| v1.0.x Field | v1.1 Pairing Field |
|--------------|-------------------|
| `core_attributes.goals` | `synthesis.goalsAsExperienced` |
| `core_attributes.pain_points` | `synthesis.painPoints` |
| `extended_attributes.barriers` | `synthesis.barriers` |
| `extended_attributes.channels` | `extendedContext.channels` |
| `extended_attributes.moments_that_matter` | `extendedContext.moments_that_matter` |
| `extended_attributes.use_cases` | `extendedContext.use_cases` |
| `extended_attributes.success_metrics` | `extendedContext.success_metrics` |

#### Add Synthesis

The pairing should explain emergence:
- `emergesFrom` on pain points and barriers
- `source` on goals (`persona`, `role`, or `persona+role`)
- `quote` that captures the combination

### Step 4: Update Journeys

Change persona references.

#### Before (v1.0.x)

```json
"context": {
  "persona_id": "sarah-martinez-working-mom-consumer",
  "persona_context": "Sarah is a 32-year-old working mom..."
}
```

#### After (v1.1)

```json
"context": {
  "personaRef": "persona-sarah-martinez",
  "roleRefs": ["role-working-mom-consumer"],
  "pairingRef": "pairing-sarah-working-mom",
  "persona_context": "Sarah's behavioural tendencies interacting with the Working Mom Consumer role..."
}
```

---

## Field Mapping Table

### Identity

| v1.0.x | v1.1 Core Persona | v1.1 Role Card | v1.1 Pairing |
|--------|-------------------|----------------|--------------|
| `identity.id` | `identity.id` (with `persona-` prefix) | - | - |
| `identity.name` | `identity.name` | - | - |
| `identity.summary` | `identity.summary` | - | - |
| - | - | `identity.id` (with `role-` prefix) | `identity.id` (with `pairing-` prefix) |
| - | - | `identity.title` | `identity.title` |

### Core Attributes

| v1.0.x | v1.1 Core Persona | v1.1 Role Card | v1.1 Pairing |
|--------|-------------------|----------------|--------------|
| `core_attributes.goals` (personal) | `behavioural_attributes.personalNeeds` | - | - |
| `core_attributes.goals` (role-specific) | - | `roleBasedNeeds` | `synthesis.goalsAsExperienced` |
| `core_attributes.pain_points` (behavioural) | `behavioural_attributes.personalFrustrations` | - | - |
| `core_attributes.pain_points` (situational) | - | `roleBasedFrustrations` | `synthesis.painPoints` |
| `core_attributes.motivations` | `behavioural_attributes.motivations` | - | - |

### Extended Attributes

| v1.0.x | v1.1 Core Persona | v1.1 Role Card | v1.1 Pairing |
|--------|-------------------|----------------|--------------|
| `extended_attributes.channels` | `behavioural_attributes.communicationPreferences` | - | `extendedContext.channels` |
| `extended_attributes.barriers` | - | - | `synthesis.barriers` |
| `extended_attributes.moments_that_matter` | - | - | `extendedContext.moments_that_matter` |
| `extended_attributes.use_cases` | - | - | `extendedContext.use_cases` |
| `extended_attributes.success_metrics` | - | - | `extendedContext.success_metrics` |

### Context-Specific

| v1.0.x | v1.1 Role Card |
|--------|----------------|
| `business_context` | `roleContext.professionalContext` (with `organisational_relationship: "external"`) |
| `decision_making` | `roleContext.professionalContext` |
| `work_context` | `roleContext.professionalContext` (with `organisational_relationship: "internal"`) |
| `lifestyle.shopping_behavior` | `roleContext.consumerContext` |

---

## Role Context Migration

The v1.1 schema uses two context types instead of four:

### Old Model (deprecated)
- `consumerContext` - Consumer roles
- `businessContext` - B2B buyer roles
- `employeeContext` - Internal employee roles
- `otherContext` - Everything else

### New Model
- `consumerContext` - Person acting in **personal capacity**
- `professionalContext` - Person acting in **organisational capacity**

### Migration Mapping

| Old Context | New Context | `organisational_relationship` |
|-------------|-------------|------------------------------|
| `consumerContext` | `consumerContext` | N/A |
| `businessContext` | `professionalContext` | `external` |
| `employeeContext` | `professionalContext` | `internal` |
| `otherContext` | `professionalContext` or `extensions.custom` | varies |

### Field Mapping for Professional Context

| businessContext Field | professionalContext Field |
|-----------------------|---------------------------|
| `company_size` | `organisation_size` |
| `role_title` | `role_title` |
| `department` | `department` |
| `industry` | `industry` |
| `seniority_level` | `seniority_level` |
| `decision_authority` | `decision_authority` |
| `budget_range` | `budget_range` |
| `stakeholders` | `stakeholders` |

| employeeContext Field | professionalContext Field |
|-----------------------|---------------------------|
| `role_department` | `department` |
| `career_stage` | `career_stage` |
| `responsibilities` | `responsibilities` |
| `tools_and_systems` | `tools_and_systems` |
| `success_metrics` | `success_metrics` |
| `compliance_requirements` | `compliance_requirements` |
| `workflows` | `workflows` |

### Example Migration

**Before (businessContext):**
```json
"roleContext": {
  "businessContext": {
    "role_title": "IT Director",
    "company_size": "201-1000",
    "seniority_level": "director"
  }
}
```

**After (professionalContext):**
```json
"roleContext": {
  "professionalContext": {
    "organisational_relationship": "external",
    "role_title": "IT Director",
    "organisation_size": "201-1000",
    "seniority_level": "director"
  }
}
```

**Before (employeeContext):**
```json
"roleContext": {
  "employeeContext": {
    "role_department": "Sales",
    "career_stage": "Mid-career"
  }
}
```

**After (professionalContext):**
```json
"roleContext": {
  "professionalContext": {
    "organisational_relationship": "internal",
    "department": "Sales",
    "career_stage": "Mid-career"
  }
}
```

---

## ID Prefix Requirements

All v1.1 IDs require type prefixes:

| Type | Prefix | Example |
|------|--------|---------|
| Core Persona | `persona-` | `persona-sarah-martinez` |
| Role Card | `role-` | `role-working-mom-consumer` |
| Pairing | `pairing-` | `pairing-sarah-working-mom` |

---

## Validation Checklist

After migration, verify:

**Core Persona:**
- [ ] ID has `persona-` prefix
- [ ] Only contains behavioural attributes
- [ ] No role-specific goals or frustrations
- [ ] No job titles or responsibilities

**Role Card:**
- [ ] ID has `role-` prefix
- [ ] Is reusable (not tied to specific persona)
- [ ] Contains role-based needs and frustrations
- [ ] Has appropriate roleContext

**Pairing:**
- [ ] ID has `pairing-` prefix
- [ ] References valid persona and role(s)
- [ ] Contains synthesis (not just copies from sources)
- [ ] Has `emergesFrom` explanations

**Journey:**
- [ ] Uses `personaRef` (not deprecated `persona_id`)
- [ ] Uses `roleRefs` if compositional
- [ ] Schema version updated to `1.1.0`

---

## Troubleshooting

### "Where does this field go?"

Ask yourself:
- Is this about **who the person is** regardless of context? → Core Persona
- Is this about **what the role demands** regardless of who's in it? → Role Card
- Does this **emerge from the combination**? → Pairing

### "My persona has both personal and role-based goals"

Split them:
- Personal goals like "feel confident" → Core Persona `personalNeeds`
- Role goals like "meet sales targets" → Role Card `roleBasedNeeds`
- Combined goals like "hit targets while maintaining relationships" → Pairing `goalsAsExperienced`

### "Should I create a pairing for every combination?"

No. Pairings are optional. Create them when:
- You need a summary card for a key combination
- Multiple journeys use the same combination
- The synthesis insights are valuable to document

---

## Support

For questions about migration:
- Review the specification documents in this folder
- Check the examples for reference implementations
- Consult the main documentation at `/documentation/`
