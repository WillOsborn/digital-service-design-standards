---
name: journey-builder
description: Interactive step-by-step journey creation. Use when user wants to build a journey through guided questions, phase by phase. Triggers on "build a journey", "create journey interactively", "map a journey", "journey wizard", "help me create a journey".
allowed-tools: Read, Glob, Write, Bash(node tools/validators/*:*), AskUserQuestion
---

# Journey Builder Skill

## Overview

This skill guides users through creating a customer journey step-by-step, working phase by phase to capture the full experience including actions, emotions, channels, barriers, and opportunities.

## When to Use

- User asks to "build a journey" or "create a journey map"
- User wants to map an experience phase by phase
- User has process documentation to transform into a journey
- User is new to journey mapping and needs structure

## Key Concept: Journeys in v1.1

A journey documents how a specific persona (optionally with role context) experiences a process over time. It captures:

- **Phases**: Major stages of the experience
- **Steps**: Individual touchpoints within phases
- **Lanes**: Parallel tracks of information (actions, thoughts, emotions, channels, barriers, opportunities)

## Process

### Step 1: Initial Context

Establish what we're mapping:

```
I'll help you build a customer journey. Let's start with the basics.

1. What's this journey about? (e.g., "Online clothes shopping with returns")
2. Who is taking this journey?
   - Do you have an existing persona? (e.g., persona-sarah-martinez)
   - Or should we define them as we go?
3. What role context are they in?
   - Existing role? (e.g., role-working-mom-consumer)
   - Or should we define it?
4. What's the scope - where does this journey start and end?
```

If persona/role exist, read them:
```bash
cat v1.1/examples/personas/[persona].json
cat v1.1/examples/roles/[role].json
```

### Step 2: Define Phases

Work out the major stages:

```
Let's break this journey into phases - the major stages someone goes through.

A typical journey has 4-8 phases. Think about:
- What triggers the journey? (Awareness/Trigger phase)
- What research/exploration happens? (Discovery/Consideration)
- What's the core action? (Purchase/Application/Transaction)
- What happens after? (Delivery/Fulfilment/Ongoing)

For "[Journey title]", what are the main phases?
```

For each phase:
```
AskUserQuestion:
  question: "What colour should represent the '[Phase Name]' phase?"
  options:
    - label: "Blue"
      description: "Discovery, exploration, learning"
    - label: "Green"
      description: "Progress, success, growth"
    - label: "Orange"
      description: "Action, decision, engagement"
    - label: "Purple"
      description: "Service, support, resolution"
```

### Step 3: Map Steps Within Each Phase

For each phase, identify the individual steps:

```
Now let's detail the "[Phase Name]" phase.

What are the specific steps someone takes? Think about:
- What triggers this phase?
- What actions do they take?
- What touchpoints do they hit?
- How does this phase end/transition?

List the steps in order (typically 2-5 per phase).
```

### Step 4: Capture Lane Content for Each Step

For each step, gather all lane information:

```
Let's detail step: "[Step Name]"

**Actions** - What does [Persona] do at this step?
(List specific actions)

**Thoughts** - What's going through their mind?
(Internal monologue, questions, concerns)

**Emotions** - How do they feel?
```

```
AskUserQuestion:
  question: "How does [Persona] feel at '[Step Name]'?"
  options:
    - label: "Very Negative (-2)"
      description: "Frustrated, angry, distressed"
    - label: "Negative (-1)"
      description: "Worried, annoyed, disappointed"
    - label: "Neutral (0)"
      description: "Indifferent, matter-of-fact"
    - label: "Positive (+1)"
      description: "Pleased, interested, hopeful"
    - label: "Very Positive (+2)"
      description: "Delighted, excited, relieved"
```

```
**Channels** - Where does this interaction happen?
- Website, app, email, phone, in-person, SMS, etc.
- Is it self-service or managed?

**Barriers** - What friction exists at this step?
- Type: process, technology, knowledge, resource, policy, cultural, vision, communications, governance
- What causes it?

**Opportunities** - What could be improved here?
- Service improvements
- Experience enhancements
```

### Step 5: Build the JSON Structure

Construct the journey progressively:

```json
{
  "id": "journey-[descriptive-name]",
  "schemaVersion": "1.1",
  "journey": {
    "title": "[Journey Title]",
    "description": "[What this journey covers]",
    "personaRef": "persona-[name]",
    "roleRefs": ["role-[name]"],
    "persona_context": "[How persona traits interact with this journey]",
    "phases": [
      {
        "id": "phase-1-[name]",
        "name": "[Phase Name]",
        "sequence": 1,
        "description": "[What happens in this phase]",
        "color": "#2196F3",
        "steps": [
          {
            "id": "step-1-1",
            "name": "[Step Name]",
            "sequence": 1,
            "description": "[What happens]",
            "lane_content": {
              "actions": ["Action 1", "Action 2"],
              "thoughts": "What they're thinking...",
              "emotions": {
                "state": "interested",
                "intensity": 1
              },
              "channels": [
                {
                  "type": "app",
                  "serviceModel": "self_service",
                  "name": "App Name",
                  "usage_context": "What they're doing"
                }
              ],
              "barriers": [],
              "opportunities": []
            }
          }
        ]
      }
    ]
  },
  "lanes": {
    "standard": ["actions", "thoughts", "emotions", "channels", "barriers", "opportunities"]
  }
}
```

### Step 6: Review Phase by Phase

After each phase, review:

```
Here's the "[Phase Name]" phase so far:

**Steps:**
1. [Step 1] - [emotion emoji] [channel]
   - [Key action]
   - [Any barriers]

2. [Step 2] - [emotion emoji] [channel]
   - [Key action]
   - [Any barriers]

Does this capture the phase accurately? Should we add or adjust any steps?
```

### Step 7: Add Persona Context

Once the journey is mapped:

```
Now let's add persona context - how [Persona]'s specific traits interact with this journey.

Based on what we've mapped:
- Where do their strengths help?
- Where do their characteristics create friction?
- What makes this journey unique for them vs a generic user?
```

### Step 8: Validate and Save

```bash
node tools/validators/validate-journey.js v1.1/examples/journeys/[filename].json
```

### Step 9: Suggest Next Steps

```
The journey is complete and validated.

Next steps:
1. Render the journey - Generate a visual horizontal journey map
2. Analyse barriers - Look for patterns across the journey
3. Create variations - What if a different persona took this journey?

Which would you like to do?
```

## Question Templates

### For Emotion State

Standard emotion states:
- Very negative: frustrated, angry, distressed, overwhelmed
- Negative: worried, anxious, disappointed, annoyed
- Neutral: indifferent, matter-of-fact, waiting
- Positive: interested, hopeful, pleased, satisfied
- Very positive: excited, delighted, relieved, confident

### For Channel Type
```
AskUserQuestion:
  question: "What channel is used at '[Step Name]'?"
  options:
    - label: "App"
      description: "Mobile or desktop application"
    - label: "Website"
      description: "Web browser experience"
    - label: "Email"
      description: "Email communication"
    - label: "Phone"
      description: "Voice call"
    - label: "In-person"
      description: "Face-to-face interaction"
    - label: "Other"
      description: "SMS, chat, social media, etc."
```

### For Service Model
```
AskUserQuestion:
  question: "Who controls this interaction?"
  options:
    - label: "Self-service"
      description: "User controls the interaction (app, website)"
    - label: "Managed"
      description: "Staff/agent controls the interaction (call, in-person)"
    - label: "Both"
      description: "Mix of self-service and human support"
```

## Example Session

```
User: Help me create a journey for applying for a credit card online

Claude: I'll help you build that journey. Let me ask a few questions.

Who is taking this journey? Do you have an existing persona?

User: Let's say it's for Sarah Martinez

Claude: [Reads persona file]

What role context is she in? First-time applicant? Existing customer?

User: She's an existing bank customer wanting to add a credit card

Claude: Got it - Sarah as an existing customer applying for a credit card.

Where does this journey start and end?

User: Starts when she sees a card offer in the app, ends when she gets the card

Claude: Let's define the phases. I'm thinking:

1. **Discovery** - Sees offer, becomes interested
2. **Research** - Compares options, checks terms
3. **Application** - Fills out form, submits
4. **Decision** - Waiting, approval/decline
5. **Activation** - Receives card, activates it

Does this structure work?

User: Yes, but maybe combine Research into Discovery

Claude: Makes sense - she's a thorough researcher so that fits.

Let's detail Phase 1: Discovery & Research.

What steps happen here?

User: She sees a notification, opens the app, looks at the offer, compares with other cards, checks the terms

Claude: Five steps for this phase:
1. Sees notification
2. Opens app
3. Views offer details
4. Compares options
5. Reviews terms

Let's detail "Sees notification":

**Actions:** What does Sarah do?

User: Sees push notification on phone while at work, notes it for later

Claude: **Thoughts:** What's going through her mind?

User: "Oh interesting, I've been thinking about getting a card. I'll look at this tonight."

Claude: [Uses AskUserQuestion for emotion]

User: Positive - interested

Claude: **Channel:** Push notification, self-service, right?

User: Yes

Claude: Any **barriers** at this step?

User: Not really, just noting it's interruptive timing during work

Claude: That could be a minor barrier - let me note it as resource/timing (severity 1).

Any **opportunities**?

User: Maybe let her save the offer to review later with one tap

Claude: Good one. Let's move to step 2...

[Continues through all phases and steps]

Here's the complete Discovery & Research phase:

**Discovery & Research** (Blue)
1. 📱 Sees notification - 😊 +1
   - Notes offer for later review
   - Minor timing friction (at work)

2. 📱 Opens app - 😊 +1
   - Views personalised offer

3. 📱 Views offer - 🤔 0→+1
   - Reads benefits, APR, fees
   - Barrier: APR jargon unclear

4. 📱 Compares options - 😐 0
   - Checks other cards in app
   - Barrier: Comparison takes time

5. 📱 Reviews terms - 😟 -1
   - Reads full T&Cs
   - Barrier: Dense legal language, time pressure

Ready to move to Application phase?
```

## Tips for Good Journeys

- **Keep steps atomic**: One thing per step, not "browses and selects and adds to cart"
- **Capture real thoughts**: Use first person, conversational, specific
- **Vary emotions**: Not everything is positive or negative
- **Note all channels**: Even if same channel repeats, note context differences
- **Look for barriers everywhere**: Even positive moments can have friction
- **Opportunities are actionable**: "Could be better" → specific improvement

## Files to Reference

- `v1.1/schemas/journey-schema.json` - Schema definition
- `v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json` - Reference example
- `v1.1/SERVICE-DESIGN-JOURNEY-STANDARD.md` - Full specification
- `documentation/BARRIER_TAXONOMY.md` - 9 barrier types
- `documentation/CHANNEL_TAXONOMY.md` - Channel classification

## Quality Checklist

Before finalising:

- [ ] Journey has clear start and end points
- [ ] Phases flow logically
- [ ] Each step has all lane content (actions, thoughts, emotions, channels)
- [ ] Emotion intensities vary realistically (-2 to +2)
- [ ] Channels have type and serviceModel
- [ ] Barriers have type, description, severity, and emergesFrom (where applicable)
- [ ] Opportunities are specific and actionable
- [ ] persona_context explains persona-journey interaction
- [ ] ID follows convention: `journey-[descriptive-name]`
- [ ] Validates against schema
