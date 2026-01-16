---
name: persona-builder
description: Interactive step-by-step persona creation. Use when user wants to build a new persona through guided questions. Triggers on "build a persona", "create persona interactively", "new persona wizard", "help me create a persona".
allowed-tools: Read, Glob, Write, Bash(node tools/validators/*:*), AskUserQuestion
---

# Persona Builder Skill

## Overview

This skill guides users through creating a Core Persona step-by-step, asking targeted questions to gather the right information and producing a valid, well-structured JSON file.

## When to Use

- User asks to "build a persona" or "create a persona interactively"
- User wants help structuring persona information
- User has raw research data and needs to shape it into a persona
- User is new to the schema and needs guidance

## Key Difference from example-creator

- **example-creator**: Creates complete examples with minimal input, good for demos
- **persona-builder**: Interactive conversation, asks questions, guides the user

## Process

### Step 1: Initial Context

Ask the user:

```
I'll help you build a Core Persona. Let me ask a few questions to get started.

1. What's this persona's name?
2. What domain is this for? (e.g., retail, healthcare, finance, government)
3. Do you have existing research, or are we defining characteristics together?
```

Use AskUserQuestion tool for structured choices where appropriate.

### Step 2: Behavioural Characteristics

Ask about persistent traits (these follow the person regardless of role):

**Technology Comfort**
```
How comfortable is [Name] with technology?

Options:
- Beginner: Needs guidance, avoids complexity
- Intermediate: Comfortable with common apps, some hesitation with new tech
- Advanced: Tech-savvy, explores new tools confidently
```

Follow up:
- What technology are they confident with?
- What do they avoid or struggle with?

**Communication Preferences**
```
How does [Name] prefer to be contacted?

Channels (pick all that apply):
- Mobile apps / Push notifications
- Email
- SMS / Text messages
- Phone calls
- In-person
- Social media / Chat

Frequency preference:
- Real-time updates
- Daily summary
- As needed only
- Minimal contact
```

**Decision-Making Style**
```
How does [Name] make decisions?

Approach:
- Impulse buyer - Quick decisions, trusts gut
- Research oriented - Thorough investigation before deciding
- Consensus seeker - Asks others, values opinions
- Analytical - Data-driven, compares options systematically

Risk tolerance:
- Low - Avoids risk, prefers proven options
- Moderate - Balanced, some calculated risks
- High - Comfortable with uncertainty, tries new things
```

### Step 3: Needs and Frustrations

Ask:
```
What are [Name]'s core personal needs?
(These are about who they are as a person, not specific to any role)

Examples:
- Time efficiency
- Quality assurance
- Clear communication
- Feeling in control
- Value for money
```

```
What frustrates [Name] generally?
(Again, personal frustrations that persist across contexts)

Examples:
- Wasted time
- Hidden costs or surprises
- Complicated processes
- Lack of transparency
- Being treated as a number
```

### Step 4: Build the JSON

Construct the persona JSON from gathered information:

```json
{
  "id": "persona-[name-kebab-case]",
  "schemaVersion": "1.1",
  "name": "[Full Name]",
  "description": "[Summary description from conversation]",
  "technologyComfort": {
    "level": "[beginner|intermediate|advanced]",
    "confidenceAreas": ["gathered from conversation"],
    "avoidanceAreas": ["gathered from conversation"]
  },
  "communicationPreferences": {
    "preferredChannels": ["from choices"],
    "frequencyPreference": "[from choice]",
    "bestTimes": ["if discussed"]
  },
  "personalNeeds": ["gathered needs"],
  "personalFrustrations": ["gathered frustrations"],
  "decisionMakingStyle": {
    "approach": "[from choice]",
    "riskTolerance": "[from choice]",
    "influences": ["if discussed"]
  }
}
```

### Step 5: Review and Refine

Present the draft to the user:
```
Here's the persona I've built from our conversation:

[Show formatted summary, not raw JSON]

Does this capture [Name] accurately?
Would you like to adjust anything?
```

### Step 6: Validate and Save

Once confirmed:

```bash
# Save the file
# Then validate
node tools/validators/validate-v1.1.js v1.1/examples/personas/persona-[name].json
```

### Step 7: Suggest Next Steps

After creating the persona:
```
[Name]'s persona is complete and validated.

Next steps you might consider:
1. Create a Role Card - What context will [Name] be operating in?
2. Create a Pairing - Combine [Name] with a role to see emergent barriers
3. Render the persona - Generate a visual card for sharing

Which would you like to do?
```

## Question Templates

### For Technology Comfort
```
AskUserQuestion:
  question: "How would you describe [Name]'s comfort with technology?"
  options:
    - label: "Beginner"
      description: "Needs guidance, prefers simple interfaces, avoids complexity"
    - label: "Intermediate"
      description: "Comfortable with common apps, some hesitation with unfamiliar tech"
    - label: "Advanced"
      description: "Tech-savvy, enjoys exploring new tools, quick to adapt"
```

### For Decision Style
```
AskUserQuestion:
  question: "How does [Name] typically make decisions?"
  options:
    - label: "Impulse"
      description: "Quick decisions, trusts instincts, values convenience"
    - label: "Research-oriented"
      description: "Investigates thoroughly, reads reviews, compares options"
    - label: "Consensus-seeking"
      description: "Consults others, values recommendations, group decisions"
    - label: "Analytical"
      description: "Data-driven, systematic comparison, weighs pros/cons"
```

### For Risk Tolerance
```
AskUserQuestion:
  question: "What's [Name]'s risk tolerance?"
  options:
    - label: "Low"
      description: "Prefers proven options, avoids uncertainty, cautious"
    - label: "Moderate"
      description: "Balanced approach, some calculated risks, mainstream choices"
    - label: "High"
      description: "Comfortable with uncertainty, tries new things, early adopter"
```

## Example Session

```
User: Help me build a persona for our mobile banking app

Claude: I'll help you build a Core Persona. Let me ask a few questions.

What's this persona's name?

User: Let's call her Maria Rodriguez

Claude: Great! Maria Rodriguez.

[Uses AskUserQuestion for technology comfort]

User: Intermediate

Claude: And what technology is Maria confident with?

User: She uses her phone for everything - social media, messaging, online shopping. But she's nervous about anything involving money online.

Claude: That's helpful - confident with everyday apps but cautious about financial tech.

[Continues through decision style, communication, needs, frustrations]

Claude: Here's Maria's persona based on our conversation:

**Maria Rodriguez** - Core Persona
- Technology: Intermediate (confident with social/shopping apps, avoids financial complexity)
- Communication: Mobile apps, SMS preferred; dislikes phone calls
- Decision style: Research-oriented, low-moderate risk tolerance
- Key needs: Security assurance, simple processes, clear confirmation
- Frustrations: Hidden fees, complicated security steps, jargon

Does this capture Maria accurately?

User: Yes, but add that she really values being able to talk to a human if something goes wrong

Claude: Added. I'll save and validate the persona now.

[Creates JSON, validates, presents next steps]
```

## Tips for Good Personas

- **Be specific**: "Uses phone for social media daily" is better than "uses technology"
- **Focus on behaviours**: What they do, not demographics
- **Keep it personal**: These are enduring traits, not role-specific
- **Ground in research**: Ask user for evidence/observations where possible
- **Avoid stereotypes**: Let the person emerge from actual behaviours

## Files to Reference

- `v1.1/schemas/core-persona.schema.json` - Schema definition
- `v1.1/examples/personas/persona-sarah-martinez.json` - Reference example
- `documentation/BARRIER_TAXONOMY.md` - If barriers come up in discussion

## Quality Checklist

Before finalising:

- [ ] Name is clear and memorable
- [ ] Technology comfort has specific examples (confident/avoids)
- [ ] Communication preferences are actionable
- [ ] Needs are personal, not role-specific
- [ ] Frustrations are personal, not role-specific
- [ ] Decision style is coherent with other traits
- [ ] ID follows convention: `persona-[name-kebab-case]`
- [ ] Validates against schema
