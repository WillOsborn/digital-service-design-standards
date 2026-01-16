# Service Design Role Card Standard v1.1

## Role Card Schema

**Version:** 1.1.0
**Last Updated:** 2026-01-15
**Status:** Official Standard

---

## Overview

The Role Card schema represents **contextual goals** - what someone is trying to achieve in a particular situation. This could be an employee role, a consumer context, a business relationship, or any other situation where someone has defined objectives to accomplish.

### The Card Deck Mental Model

Think of Role Cards as one deck in a card game:

- **Persona Cards** - A deck of behavioural archetypes (who people are)
- **Role Cards** - A deck of contextual situations (what people are trying to achieve)
- **Pairings** - Lay out a persona card with one or more role cards to explore what emerges

This model enables reusability: the same persona can be paired with different roles, and the same role can be experienced by different personas.

---

## Design Principles

1. **Flexible** - Light required core with open extensions
2. **Context-agnostic** - Works for any professional or consumer context
3. **Reusable** - Same role can pair with multiple personas
4. **Stackable** - Multiple roles can combine for complex scenarios

---

## Schema Structure

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_info` | object | Metadata including version, standard, and dates |
| `identity` | object | ID (with `role-` prefix), title, description |
| `roleBasedNeeds` | array | What the role requires the person to accomplish |
| `roleBasedFrustrations` | array | Friction inherent to this role |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `roleType` | string | Category hint (e.g., "Consumer", "Professional") |
| `roleContext` | object | Context-specific information |
| `extensions` | object | Custom fields |

---

## Identity

The identity section establishes what this role represents.

```json
"identity": {
  "id": "role-working-mom-consumer",
  "title": "Working Mom Consumer",
  "description": "Primary household decision maker balancing work and family responsibilities while managing household purchases."
}
```

### ID Convention

**All role IDs must use the `role-` prefix.**

- Pattern: `role-[descriptive-name]`
- Examples: `role-working-mom-consumer`, `role-it-director-healthcare`, `role-senior-sales-rep`
- Use lowercase, hyphens, no spaces

---

## Role Type

Optional category for the role. Free text, not enumerated.

```json
"roleType": "Consumer"
```

**Recommended patterns:**
- `Consumer` - Person acting in personal capacity
- `Professional` - Person acting in organisational capacity

Teams should agree on their role types before creating cards for consistency.

---

## Role Context

Context-specific information that varies by role type. The schema provides two structured contexts based on a fundamental distinction:

**The key question: "Who is this person accountable to for this decision?"**
- **Themselves** → Consumer context
- **An organisation** → Professional context

### Consumer Context

For anyone acting in **personal capacity** - making decisions for themselves or their household.

```json
"roleContext": {
  "consumerContext": {
    "shopping_behavior": "Researches products thoroughly. Price-conscious but quality-focused.",
    "purchasing_context": "Primary decision maker for household purchases",
    "brand_relationships": "Loyal to brands that consistently deliver value",
    "decision_factors": ["Time savings", "Quality", "Price-value ratio"],
    "budget_constraints": "Monthly household budget",
    "household_context": "Family of four with two school-age children"
  }
}
```

**Consumer Context Fields:**

| Field | Description |
|-------|-------------|
| `shopping_behavior` | Purchase patterns, research habits, shopping preferences |
| `purchasing_context` | Circumstances of purchases (e.g., primary decision maker) |
| `brand_relationships` | How they relate to and select brands |
| `decision_factors` | Key factors influencing purchase decisions |
| `budget_constraints` | Budget considerations and financial context |
| `household_context` | Household composition and how it affects decisions |

### Professional Context

For anyone acting in **organisational capacity** - accountable to stakeholders, with delegated authority, pursuing organisational outcomes. This includes:
- **Internal**: Employees, contractors, temps
- **External**: B2B buyers, clients, customers engaging from another organisation
- **Partner**: Suppliers, vendors, agencies, alliance partners

```json
"roleContext": {
  "professionalContext": {
    "organisational_relationship": "internal",
    "role_title": "Senior Sales Representative",
    "department": "Sales - West Coast Region",
    "career_stage": "Mid-career with management aspirations",
    "seniority_level": "individual_contributor",
    "responsibilities": ["Exceed sales quotas", "Develop enterprise accounts"],
    "tools_and_systems": ["CRM", "Mobile sales app", "Collaboration tools"],
    "success_metrics": ["Quota attainment", "Customer satisfaction"],
    "workflows": ["Daily CRM updates", "Weekly forecasting"]
  }
}
```

**Professional Context Fields:**

| Field | Description |
|-------|-------------|
| `organisational_relationship` | `internal`, `external`, or `partner` |
| `role_title` | Job title or position |
| `department` | Department, function, or team |
| `industry` | Industry vertical or sector |
| `organisation_size` | Size of the organisation |
| `seniority_level` | Level in hierarchy (individual_contributor to c_level) |
| `career_stage` | Career progression stage |
| `decision_authority` | Decision-making power, scope, and approval requirements |
| `budget_range` | Budget authority range |
| `stakeholders` | Key stakeholders this role interacts with |
| `responsibilities` | Key responsibilities of this role |
| `tools_and_systems` | Tools and systems used in this role |
| `success_metrics` | How success is measured |
| `compliance_requirements` | Regulatory or compliance requirements |
| `workflows` | Key workflows and processes |

### Choosing the Right Context

```
Is the person acting for personal/household needs?
  YES → consumerContext
  NO → professionalContext
    → Set organisational_relationship:
       "internal" = employed by/contracted to the organisation
       "external" = customer/buyer from another organisation
       "partner" = supplier/vendor/agency relationship
```

### Edge Cases

| Situation | Guidance |
|-----------|----------|
| Sole trader | Consumer if personal business; Professional if acting for clients |
| Volunteer | Professional with `partner` relationship or custom extension |
| Board member | Professional with `internal` relationship (governance role) |
| Freelancer | Professional with `partner` relationship |

---

## Role-Based Needs

What the role requires the person to accomplish. These are goals imposed by the context, not personal desires.

```json
"roleBasedNeeds": [
  {
    "text": "Find products that save time in daily routines",
    "priority": "primary",
    "timeframe": "immediate"
  },
  {
    "text": "Stay within monthly budget while maintaining quality of life",
    "priority": "primary",
    "timeframe": "immediate"
  }
]
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Description of the need |
| `priority` | enum | No | `primary`, `secondary`, `aspirational` |
| `timeframe` | enum | No | `immediate`, `short_term`, `long_term` |

### Good Examples

**Consumer role needs:**
- "Find products that meet family dietary requirements"
- "Compare options quickly within limited time windows"
- "Access trustworthy product information"

**Professional role needs (internal):**
- "Complete administrative tasks efficiently"
- "Access customer information while mobile"
- "Meet quarterly performance targets"

**Professional role needs (external):**
- "Ensure compliance with regulatory requirements"
- "Demonstrate ROI to stakeholders"
- "Integrate new solutions with existing systems"

---

## Role-Based Frustrations

Friction inherent to this role - problems that anyone in this role would face.

```json
"roleBasedFrustrations": [
  {
    "text": "Limited time for research and comparison shopping",
    "severity": 4,
    "frequency": "daily",
    "context": "Between work and family responsibilities"
  }
]
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Description of the frustration |
| `severity` | integer | No | 1 (minor) to 5 (significant) |
| `frequency` | enum | No | `daily`, `weekly`, `monthly`, `occasional`, `rare` |
| `context` | string | No | When/where this occurs |

### Good Examples

**Consumer role frustrations:**
- "Too many product options to evaluate"
- "Unclear product quality from online photos"
- "Complicated return processes"

**Professional role frustrations (internal):**
- "Multiple systems requiring separate logins"
- "Slow approval processes for urgent requests"
- "Insufficient training on new tools"

**Professional role frustrations (external):**
- "Vendors who don't understand industry compliance"
- "Long procurement cycles"
- "Integration challenges with legacy systems"

---

## Extensions

Custom fields for organisation-specific role attributes.

```json
"extensions": {
  "custom": {
    "typical_purchase_categories": ["Household essentials", "Children's products"],
    "peak_activity_times": ["Lunch breaks", "After bedtime"]
  }
}
```

---

## Role Stacking

Roles can be combined (stacked) in Pairings for complex scenarios:

```json
{
  "personaRef": "persona-maria-rodriguez",
  "roleRefs": [
    "role-senior-sales-rep",
    "role-leadership-aspirant"
  ]
}
```

**When to stack roles:**
- Employee with multiple responsibilities
- Consumer in complex purchase context
- Person transitioning between roles

---

## Quality Checklist

**Identity:**
- [ ] ID uses `role-` prefix
- [ ] Title is clear and descriptive
- [ ] Description captures what the role is trying to achieve

**Context:**
- [ ] Appropriate context type selected (Consumer or Professional)
- [ ] For Professional: `organisational_relationship` specified
- [ ] Relevant context fields populated

**Needs:**
- [ ] At least 3 role-based needs
- [ ] Needs are about the role, not the person
- [ ] Priority and timeframe specified where helpful

**Frustrations:**
- [ ] At least 3 role-based frustrations
- [ ] Frustrations are inherent to the role
- [ ] Severity and frequency specified where helpful

**Separation of Concerns:**
- [ ] No behavioural attributes (those belong in Core Persona)
- [ ] No personality traits (those belong in Core Persona)
- [ ] Role could be occupied by different persona types

---

## Common Mistakes

### Mixing Behavioural and Contextual

**Wrong:** Adding "impatient with slow processes" as a role-based frustration
**Right:** This is a behavioural tendency - belongs in Core Persona's `personalFrustrations`

**Wrong:** Adding "values family wellbeing" as a role-based need
**Right:** This is a personal value - belongs in Core Persona's `personalNeeds`

### Being Too Specific

**Wrong:** "role-sarah-as-working-mom"
**Right:** "role-working-mom-consumer" (reusable with any persona)

### Using Wrong Context Type

**Wrong:** Using `consumerContext` for a B2B buyer
**Right:** B2B buyers act in organisational capacity - use `professionalContext` with `organisational_relationship: "external"`

---

## Migration from v1.0.x

If migrating from earlier versions with `businessContext`, `employeeContext`, or `otherContext`:

| Old Context | New Context | organisational_relationship |
|-------------|-------------|----------------------------|
| `businessContext` | `professionalContext` | `external` |
| `employeeContext` | `professionalContext` | `internal` |
| `otherContext` | `professionalContext` or `extensions.custom` | varies |

**Field mapping:**
- `company_size` → `organisation_size`
- `role_department` → `department`
- All other fields map directly

---

## Related Documentation

- [SERVICE-DESIGN-PERSONA-STANDARD.md](SERVICE-DESIGN-PERSONA-STANDARD.md) - Core Persona specification
- [SERVICE-DESIGN-PAIRING-STANDARD.md](SERVICE-DESIGN-PAIRING-STANDARD.md) - Pairing specification
- [SERVICE-DESIGN-JOURNEY-STANDARD.md](SERVICE-DESIGN-JOURNEY-STANDARD.md) - Journey specification
