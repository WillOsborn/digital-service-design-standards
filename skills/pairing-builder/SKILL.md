---
name: pairing-builder
description: Interactive pairing creation from existing persona and role. Use when user wants to explore what emerges when a specific persona takes on a role. Triggers on "build a pairing", "create pairing", "pair persona with role", "what emerges when", "collision analysis".
allowed-tools: Read, Glob, Write, Bash(node tools/validators/*:*), AskUserQuestion
---

# Pairing Builder Skill

## Overview

This skill guides users through creating a Pairing - the analysis of what emerges when a specific persona takes on a role. Pairings reveal emergent barriers and opportunities that only exist at the intersection.

## When to Use

- User asks to "create a pairing" or "pair [persona] with [role]"
- User wants to understand persona-role interaction
- User asks "what happens when [persona] is in [role]?"
- User needs to document emergent barriers for a journey

## Key Concept: Emergence

Pairings capture things that only exist at the intersection:

**Persona trait**: Sarah is research-oriented (likes to investigate thoroughly)
**Role constraint**: Working Mom has limited time
**Emergent barrier**: Research habits collide with time pressure - she can't do the investigation she normally would

Neither the persona nor the role alone creates this barrier. It **emerges** from their combination.

## Process

### Step 1: Identify Inputs

First, determine the persona and role(s):

```
I'll help you build a Pairing. This explores what emerges when a specific persona takes on a role.

Do you have existing persona and role files, or should we work from descriptions?

If files exist:
- Which persona? (e.g., persona-sarah-martinez)
- Which role(s)? (e.g., role-working-mom-consumer)
```

If files exist, read them:
```bash
cat v1.1/examples/personas/[persona].json
cat v1.1/examples/roles/[role].json
```

### Step 2: Summarise the Combination

Present what we're working with:

```
Let me summarise what we're pairing:

**[Persona Name]** brings:
- Technology: [level] - confident with [X], avoids [Y]
- Decision style: [approach], [risk tolerance]
- Key traits: [notable characteristics]

**[Role Name]** demands:
- [Key need 1]
- [Key need 2]
- [Inherent frustration]

Now let's explore what emerges when [Persona] takes on this role.
```

### Step 3: Identify Emergent Barriers

Guide the user through collision analysis:

```
Let's look for collisions - places where [Persona]'s traits create friction with [Role]'s demands.

For each collision, we'll capture:
- What barrier type it is (resource, knowledge, technology, etc.)
- What the barrier looks like
- How it emerges (the collision explanation)

Looking at [Persona]'s traits against [Role]'s demands:

1. [Persona trait] meets [Role demand]
   - Does this create friction? What happens?

2. [Next trait] meets [Next demand]
   - Any collision here?
```

### Step 4: Rate Barrier Severity

For each identified barrier:

```
AskUserQuestion:
  question: "How severe is this barrier: '[barrier description]'?"
  options:
    - label: "1 - Minimal"
      description: "Minor inconvenience, easy workaround"
    - label: "2 - Low"
      description: "Noticeable friction, workarounds exist"
    - label: "3 - Moderate"
      description: "Significant impact, workarounds difficult"
    - label: "4 - High"
      description: "Major blocker, workarounds inadequate"
    - label: "5 - Critical"
      description: "Complete blocker, no workaround"
```

### Step 5: Identify Goals as Experienced

Transform role needs into how this persona actually experiences them:

```
The role defines needs abstractly. How does [Persona] actually experience these goals?

Role need: "Time efficiency"
As [Persona] experiences it: "Find quality items during my lunch break without compromising on research"

Role need: "Budget visibility"
As [Persona] experiences it: "Know exactly what I'm spending so I can justify it to myself"
```

Ask user to prioritise: Which goal is primary for this persona in this role?

### Step 6: Find Opportunities

Where do persona strengths help with role challenges:

```
Now let's look for opportunities - where [Persona]'s strengths could help in this role.

[Persona]'s strengths:
- [Strength 1 from persona]
- [Strength 2]

How might these help with [Role]'s challenges?
```

### Step 7: Build the JSON

```json
{
  "id": "pairing-[persona-name]-[role-name]",
  "schemaVersion": "1.1",
  "name": "[Persona] as [Role]",
  "personaRef": "persona-[name]",
  "roleRefs": ["role-[name]"],
  "description": "[Summary of this specific combination]",
  "goals": [
    {
      "text": "Goal as actually experienced by this persona",
      "priority": "primary"
    },
    {
      "text": "Secondary goal",
      "priority": "secondary"
    }
  ],
  "barriers": [
    {
      "type": "[barrier type from taxonomy]",
      "description": "What the barrier is",
      "severity": 3,
      "emergesFrom": "How persona trait X collides with role constraint Y"
    }
  ],
  "opportunities": [
    "How persona strength can be leveraged in this role"
  ]
}
```

### Step 8: Review and Validate

```
Here's the Pairing I've built:

**[Persona] as [Role]**

Goals (as experienced):
- [Primary goal] ★
- [Secondary goal]

Emergent Barriers:
- [Type]: [Description]
  → Emerges from: [Collision explanation]

Opportunities:
- [Opportunity 1]
- [Opportunity 2]

Does this capture the interaction accurately?
```

Validate:
```bash
node tools/validators/validate-v1.1.js v1.1/examples/pairings/pairing-[name].json
```

### Step 9: Suggest Next Steps

```
The pairing is complete.

Next steps:
1. Create a journey - Map how [Persona] as [Role] moves through an experience
2. Pair with another role - What if [Persona] also has [other role]? (role stacking)
3. Render the pairing - Generate a visual card

Which would you like to do?
```

## Barrier Types Reference

When identifying barriers, use these 9 types:

| Type | Description | Example |
|------|-------------|---------|
| `process` | Workflow/procedure issues | Multi-step approvals slow things down |
| `technology` | System/tool limitations | App doesn't work well on older phones |
| `knowledge` | Information gaps | Doesn't know what size will fit |
| `resource` | Time, money, capacity | Limited time for thorough research |
| `policy` | Rules/regulations | Return window doesn't fit schedule |
| `cultural` | Social/organisational norms | Feels awkward asking for help |
| `vision` | Strategic misalignment | Service designed for different user type |
| `communications` | Messaging/clarity issues | Jargon in terms and conditions |
| `governance` | Decision-making/accountability | No clear owner when things go wrong |

## Example Session

```
User: Can you create a pairing for Sarah Martinez with the Working Mom Consumer role?

Claude: I'll build a pairing for Sarah as Working Mom Consumer. Let me read both files first.

[Reads persona-sarah-martinez.json and role-working-mom-consumer.json]

Here's what we're pairing:

**Sarah Martinez** brings:
- Technology: Intermediate - confident with apps/shopping, avoids complex platforms
- Decision style: Research-oriented, moderate risk tolerance
- Key traits: Values quality, influenced by reviews, prefers efficiency

**Working Mom Consumer** demands:
- Time-efficient processes
- Budget visibility
- Flexible options
- Easy recovery from mistakes

Let's find the collisions.

**Collision 1:** Sarah's research orientation vs time constraints
- Sarah likes to investigate thoroughly
- The role demands quick decisions
- What happens? She feels torn - can't do her usual research, feels less confident

Is this a barrier?

User: Yes, definitely

Claude: [Uses AskUserQuestion for severity]

User: 3 - Moderate

Claude: **Collision 2:** Sarah's quality focus vs budget constraints
- She values quality highly
- The role requires budget awareness
- What happens? Internal conflict between wanting the best and staying on budget

User: That's more of an internal tension than a barrier

Claude: Good distinction. Let's note it but not as a barrier.

**Collision 3:** Sarah's review-checking habit vs time pressure
- She checks reviews before purchasing
- Role has limited decision windows
- What happens?

User: She might skip reviews and then feel anxious about the purchase

Claude: That's a knowledge/confidence barrier - decision confidence undermined by truncated process.

[Continues through opportunities, goals, builds JSON]

Here's the final pairing:

**Sarah Martinez as Working Mom Consumer**

Goals:
★ Find quality items efficiently using trusted shortcuts (reviews, brands)
○ Stay within family budget without sacrificing quality
○ Minimise return hassle by getting it right first time

Emergent Barriers:
- **Resource** (severity 3): Limited time for usual research depth
  → Research-oriented style collides with time constraints

- **Knowledge** (severity 2): Reduced decision confidence
  → Review-checking habit truncated, leading to purchase anxiety

Opportunities:
- Her brand loyalty can shortcut research (trusted brands = faster decisions)
- Review-checking skill could work with "quick view" summary features

Does this capture it?
```

## Tips for Good Pairings

- **Focus on emergence**: If it's in the persona or role alone, it's not for the pairing
- **Explain the collision**: "emergesFrom" should make the interaction clear
- **Be specific about severity**: Use the 1-5 scale consistently
- **Goals are transformed**: Not copied from role, but personalised to this combination
- **Opportunities leverage strengths**: How can persona traits help, not hinder

## Files to Reference

- `v1.1/schemas/pairing.schema.json` - Schema definition
- `v1.1/examples/pairings/pairing-sarah-working-mom.json` - Reference example
- `v1.1/SERVICE-DESIGN-PAIRING-STANDARD.md` - Full specification
- `documentation/BARRIER_TAXONOMY.md` - 9 barrier types

## Quality Checklist

Before finalising:

- [ ] personaRef and roleRefs are valid references
- [ ] All barriers have `emergesFrom` explaining the collision
- [ ] Barrier types are from the taxonomy (9 valid types)
- [ ] Severity is 1-5 numeric scale
- [ ] Goals are "as experienced" not copied from role
- [ ] At least one goal is marked as primary
- [ ] Opportunities leverage persona strengths
- [ ] ID follows convention: `pairing-[persona]-[role]`
- [ ] Validates against schema
