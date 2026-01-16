---
name: role-builder
description: Interactive step-by-step role card creation. Use when user wants to build a new role through guided questions. Triggers on "build a role", "create role card interactively", "new role wizard", "help me create a role".
allowed-tools: Read, Glob, Write, Bash(node tools/validators/*:*), AskUserQuestion
---

# Role Builder Skill

## Overview

This skill guides users through creating a Role Card step-by-step, asking targeted questions to capture the contextual demands of a specific role that any persona might take on.

## When to Use

- User asks to "build a role" or "create a role card"
- User wants to define what a specific context demands
- User has job descriptions, user stories, or requirements to structure
- User needs to separate "what the role demands" from "who the person is"

## Key Concept: Roles vs Personas

**Personas** = Who someone is (behavioural, persistent)
**Roles** = What they're trying to achieve in a context (situational, any persona could fill it)

A "Working Mom Consumer" role could be filled by Sarah (tech-intermediate, research-oriented) or by Maria (tech-advanced, impulse buyer). The role's demands stay the same; outcomes differ based on persona.

## Process

### Step 1: Initial Context

Ask the user:

```
I'll help you build a Role Card. Roles capture what a context demands - the needs, frustrations, and success criteria that anyone in this situation would face.

1. What's this role called? (e.g., "Online Shopper", "First-Time Mortgage Applicant", "IT Helpdesk Caller")
2. What type of role is this?
   - Consumer (buying products/services)
   - Employee (internal work context)
   - Business (B2B, professional context)
   - Citizen (government/public services)
3. What's the core situation or goal?
```

### Step 2: Role-Based Needs

These are what the role requires - anyone in this situation would need these:

```
What does someone in this role need to succeed?

Think about:
- Time: How quickly must things happen?
- Information: What do they need to know?
- Control: What decisions do they need to make?
- Assurance: What confidence do they need?
- Flexibility: What accommodations matter?

Examples for "Working Mom Consumer":
- Time-efficient processes (can't spend hours shopping)
- Clear pricing (budget certainty)
- Flexible delivery options (unpredictable schedule)
- Easy returns (buying without trying on)
```

### Step 3: Role-Based Frustrations

What inherently frustrates anyone in this role:

```
What frustrates people in this role?
(These are about the role context, not personal pet peeves)

Think about:
- What makes the task harder than it should be?
- What wastes their time in this context?
- What adds uncertainty or stress?
- What commonly goes wrong?

Examples for "First-Time Mortgage Applicant":
- Jargon and complex terminology
- Unclear timelines
- Repeated document requests
- Feeling judged or uninformed
```

### Step 4: Success Metrics

How do we know someone succeeded in this role:

```
How would someone know they've succeeded in this role?

These should be:
- Observable or measurable
- About outcomes, not process
- Specific to this role context

Examples for "Online Shopper":
- Found what they wanted
- Confident in purchase decision
- Got good value
- Hassle-free experience
```

### Step 5: Build the JSON

Construct the role card:

```json
{
  "id": "role-[role-name-kebab-case]",
  "schemaVersion": "1.1",
  "name": "[Role Name]",
  "roleType": "[Consumer|Employee|Business|Citizen]",
  "description": "[Summary of what this role involves]",
  "roleBasedNeeds": [
    "Need 1 - what the role requires",
    "Need 2",
    "Need 3"
  ],
  "roleBasedFrustrations": [
    "Frustration 1 - what inherently annoys in this context",
    "Frustration 2"
  ],
  "successMetrics": [
    "How success is measured 1",
    "How success is measured 2"
  ]
}
```

### Step 6: Review and Refine

Present the draft:
```
Here's the Role Card I've built:

**[Role Name]** ([Role Type])

[Description]

**This role needs:**
- [Need 1]
- [Need 2]

**Inherent frustrations:**
- [Frustration 1]
- [Frustration 2]

**Success looks like:**
- [Metric 1]
- [Metric 2]

Does this capture what this role demands? Would you adjust anything?
```

### Step 7: Validate and Save

```bash
node tools/validators/validate-v1.1.js v1.1/examples/roles/role-[name].json
```

### Step 8: Suggest Next Steps

```
The [Role Name] role card is complete.

Next steps:
1. Pair with a persona - See how a specific person experiences this role
2. Create a journey - Map how someone moves through this role over time
3. Create related roles - Are there connected roles (e.g., "Returning Customer")?

Which would you like to do?
```

## Question Templates

### For Role Type
```
AskUserQuestion:
  question: "What type of role is this?"
  options:
    - label: "Consumer"
      description: "Purchasing products or services (retail, e-commerce, subscriptions)"
    - label: "Employee"
      description: "Internal work context (using company tools, processes, policies)"
    - label: "Business"
      description: "B2B or professional context (procurement, partnerships, vendors)"
    - label: "Citizen"
      description: "Interacting with government or public services"
```

### For Needs
```
AskUserQuestion:
  question: "What's the primary need for this role?"
  multiSelect: true
  options:
    - label: "Speed/Efficiency"
      description: "Time is limited, process must be quick"
    - label: "Clarity/Information"
      description: "Need to understand what's happening"
    - label: "Control/Choice"
      description: "Need to make decisions, have options"
    - label: "Assurance/Confidence"
      description: "Need certainty that things will work out"
```

## Example Session

```
User: I need to create a role for people applying for a business loan

Claude: I'll help you build that Role Card.

What would you call this role? "Business Loan Applicant"?

User: Yes, or maybe "Small Business Owner Seeking Finance"

Claude: Let's go with "Small Business Owner Seeking Finance" - it captures the context well.

[Uses AskUserQuestion for role type]

User: Business

Claude: What does someone in this role fundamentally need?

User: They need to understand if they qualify, what the terms mean, and how long it will take. They're often under time pressure because they need the funds for something specific.

Claude: So I'm hearing:
- Clear qualification criteria (am I eligible?)
- Plain-language terms (what does this mean?)
- Timeline clarity (when will I know?)
- Speed (time-sensitive need)

What typically frustrates people in this role?

User: Being asked for documents they don't have, unclear reasons for rejection, feeling like the bank doesn't understand small business.

Claude: Got it - documentation burden, opaque decisions, and lack of empathy for SME context.

How would they know they succeeded?

User: Got the funding they needed, on terms they can manage, in time for their need.

Claude: Here's the Role Card:

**Small Business Owner Seeking Finance** (Business)

A business owner needing capital for a specific purpose - whether expansion, equipment, or cash flow - navigating the loan application process under time pressure.

**This role needs:**
- Clear eligibility criteria upfront
- Plain-language explanation of terms
- Realistic timeline with milestones
- Process that respects time constraints

**Inherent frustrations:**
- Repeated/unclear document requests
- Opaque decision-making
- Lack of understanding of SME context
- Long waits with no visibility

**Success looks like:**
- Funding secured at manageable terms
- Timeline met business need
- Felt understood and respected

Does this capture it?
```

## Tips for Good Roles

- **Keep it contextual**: Role demands should be true for anyone in this situation
- **Avoid persona bleed**: "Prefers mobile apps" is persona; "needs accessible process" is role
- **Be specific about context**: "Online Shopper" is different from "In-Store Shopper"
- **Test with different personas**: Would these needs apply regardless of who's in the role?
- **Focus on demands, not solutions**: "Needs certainty" not "needs a progress tracker"

## Common Role Types

### Consumer Roles
- Online Shopper
- First-Time Buyer
- Returning Customer
- Gift Purchaser
- Subscription Manager

### Employee Roles
- New Hire
- Remote Worker
- Team Manager
- Internal Customer (using shared services)
- Change Adopter (new system rollout)

### Business Roles
- Procurement Manager
- Vendor Relationship Owner
- Contract Negotiator
- Implementation Lead

### Citizen Roles
- Benefit Claimant
- License Applicant
- Taxpayer
- Service Complainant

## Files to Reference

- `v1.1/schemas/role-card.schema.json` - Schema definition
- `v1.1/examples/roles/role-working-mom-consumer.json` - Reference example
- `v1.1/SERVICE-DESIGN-ROLE-CARD-STANDARD.md` - Full specification

## Quality Checklist

Before finalising:

- [ ] Role name is clear and descriptive
- [ ] Role type is appropriate
- [ ] Needs are role-contextual, not personal
- [ ] Frustrations are inherent to the role, not personality
- [ ] Success metrics are observable/measurable
- [ ] Could apply to different personas in this situation
- [ ] ID follows convention: `role-[name-kebab-case]`
- [ ] Validates against schema
