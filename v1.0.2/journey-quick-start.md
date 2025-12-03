# Journey Quick Start Guide

**Get your team creating standardized customer journeys in 30 minutes**

---

## Journey Anatomy in 60 Seconds

A journey map consists of:

1. **Schema Info** - Metadata (version, dates, who created it)
2. **Lanes** - What information you track at each step (emotions, barriers, channels, etc.)
3. **Journey** - The actual journey content:
   - **Context** - Who this is for (persona link)
   - **Phases** - High-level stages (3-5 typical)
   - **Steps** - Specific actions within each phase (3-10 per phase)
   - **Validation** - Research sources backing your journey

Think of it like a spreadsheet: Lanes are columns, steps are rows, phases group related rows.

---

## 5-Step Journey Creation

### Step 1: Set Up Schema Info (2 minutes)

```json
{
  "schema_info": {
    "version": "1.0.2",
    "standard": "Service Design Journey Standard v1.0",
    "namespace": "yourorg.project-name",
    "last_updated": "2025-01-20T10:00:00Z",
    "created_by": "Your Name",
    "organization": "Your Organization"
  }
}
```

**Tips:**
- Use lowercase namespace with dots: `healthcare.patient-intake`
- Always update `last_updated` when you edit
- `version` must match pattern `1.0.X`

### Step 2: Define Your Lanes (5 minutes)

Start with this recommended set:

```json
{
  "lanes": {
    "standard": [
      {
        "id": "actions",
        "label": "User Actions",
        "type": "text",
        "description": "What the user does at each step"
      },
      {
        "id": "emotions",
        "label": "Emotional State",
        "type": "emotion",
        "description": "How the user feels (-2 to +2 scale)"
      },
      {
        "id": "barriers",
        "label": "Barriers",
        "type": "barrier",
        "description": "Obstacles encountered"
      },
      {
        "id": "channels",
        "label": "Channels",
        "type": "channel",
        "description": "How the user interacts with the service"
      },
      {
        "id": "stakeholders",
        "label": "People Involved",
        "type": "list",
        "description": "Internal stakeholders or external contacts"
      }
    ]
  }
}
```

**Lane Types Quick Reference:**
- **text** - Free-form text (actions, thoughts, quotes)
- **emotion** - Emotional intensity (-2 to +2)
- **barrier** - Obstacles with type classification
- **channel** - Interaction channels (digital, physical, human, hybrid, self_service)
- **list** - Multiple items (stakeholders, tasks, questions)
- **metric** - Numbers (time, completion rate, satisfaction)
- **reference** - Links to research artifacts or documents

### Step 3: Create Journey Context (5 minutes)

```json
{
  "journey": {
    "id": "vendor-evaluation",
    "title": "Healthcare IT Vendor Evaluation Journey",
    "purpose": "Understand how hospital CTOs evaluate and select IT vendors",
    "summary": "Maps the journey from need recognition through vendor shortlist creation, focusing on compliance and integration challenges",
    "context": {
      "persona_id": "david-chen",
      "persona_context": "Hospital CTO with security and integration priorities",
      "use_case": "Evaluating patient intake system vendors",
      "scope": "From problem recognition through shortlist of 3 vendors",
      "as_is": true,
      "timeframe": "Typically 3-6 months",
      "success_criteria": [
        {
          "metric": "Vendor shortlist created",
          "target": "3 qualified vendors meeting HIPAA requirements"
        }
      ]
    }
  }
}
```

**Tips:**
- Link to persona using `persona_id` (matches persona's `identity.id`)
- Set `as_is: true` for current state, `false` for future state
- Define clear success criteria - what does journey completion look like?

### Step 4: Map Phases and Steps (15 minutes)

```json
{
  "phases": [
    {
      "id": "awareness",
      "name": "Problem Recognition",
      "goal": "Identify that current patient intake process needs improvement",
      "steps": [
        {
          "id": "review-complaints",
          "name": "Review patient complaint data",
          "duration_ms": 3600000,
          "lane_content": {
            "barriers": [
              {
                "type": "technology",
                "description": "Patient data scattered across 3 legacy systems",
                "severity": 4,
                "workarounds": "Manually compile reports from multiple databases"
              }
            ],
            "channels": [
              {
                "channel_type": "digital",
                "name": "EMR analytics dashboard",
                "usage_context": "Monthly patient experience metrics review"
              }
            ]
          }
        },
        {
          "id": "calculate-costs",
          "name": "Calculate cost of current inefficiencies",
          "lane_content": {
            "barriers": [
              {
                "type": "knowledge",
                "description": "Unclear methodology for calculating patient intake costs",
                "severity": 3
              }
            ]
          }
        }
      ]
    },
    {
      "id": "research",
      "name": "Vendor Research",
      "goal": "Identify potential vendors that meet technical requirements",
      "steps": [
        {
          "id": "search-vendors",
          "name": "Search vendor comparison sites",
          "lane_content": {
            "channels": [
              {
                "channel_type": "digital",
                "name": "G2 and Capterra comparison sites",
                "usage_context": "Initial research and peer reviews"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Tips:**
- **Phases:** 3-5 phases for most journeys (Awareness, Research, Evaluation, Decision)
- **Steps:** 3-10 steps per phase (too few = missing detail, too many = too granular)
- **Duration:** Optional but useful (in milliseconds: 3600000 = 1 hour)
- **Barriers:** Always include `type` from 9-type taxonomy (process, technology, knowledge, resource, policy, cultural, vision, communications, governance)
- **Channels:** Use 5-type taxonomy (digital, physical, human, hybrid, self_service)

### Step 5: Add Validation (3 minutes)

```json
{
  "validation": {
    "research_sources": [
      {
        "source": "6 in-depth interviews with hospital CTOs (February 2024)",
        "type": "interview",
        "date": "2024-02-15",
        "confidence": "high"
      },
      {
        "source": "CRM analysis of 145 healthcare evaluations (2023)",
        "type": "analytics",
        "date": "2024-01-10",
        "confidence": "high"
      }
    ],
    "confidence_level": "high"
  }
}
```

**Research Types (ordered by priority):**
- **interview** - User interviews, stakeholder conversations
- **survey** - Questionnaires, feedback forms
- **analytics** - Web analytics, CRM data, usage logs
- **observation** - Contextual inquiry, shadowing, usability testing
- **existing_research** - Industry reports, previous studies

**Confidence Levels:**
- **high** - Multiple sources, recent data (<12 months), direct user research
- **medium** - Single source, 12-24 months old, mix of direct/indirect
- **low** - Assumptions, proxy research, outdated data (>24 months)

---

## Common Lane Configurations

### Minimal (Just Starting Out)
```json
["User Actions (text)", "Barriers (barrier)"]
```

### Standard (Most Common)
```json
["User Actions (text)", "Emotional State (emotion)", "Barriers (barrier)", "Channels (channel)"]
```

### Comprehensive (Rich Insights)
```json
["User Actions (text)", "Thoughts/Quotes (text)", "Emotional State (emotion)", "Barriers (barrier)", "Channels (channel)", "Stakeholders (list)", "Time Spent (metric)"]
```

### Custom (Organization-Specific)
Add your own lanes to the `custom` array:
```json
{
  "lanes": {
    "standard": [...],
    "custom": [
      {
        "id": "systems_touched",
        "label": "Systems",
        "type": "list",
        "description": "Internal systems accessed at each step"
      }
    ]
  }
}
```

---

## The 9-Type Barrier Taxonomy (Quick Reference)

| Type | Use When... | Example |
|------|-------------|---------|
| **process** | Workflow problems | "Must fill out 47-field vendor evaluation form" |
| **technology** | Tech limitations | "EMR doesn't expose API for integration testing" |
| **knowledge** | Skill/info gaps | "HIPAA compliance requirements unclear" |
| **resource** | Time/budget/people | "5-day delay waiting for legal review" |
| **policy** | Regulations/rules | "Requires board approval for contracts >$100K" |
| **cultural** | Resistance to change | "Distrust of cloud-based solutions" |
| **vision** | Strategy unclear | "Unclear ROI calculation methodology" |
| **communications** | Info flow issues | "Vendor doesn't respond to technical questions" |
| **governance** | Decision authority | "Unclear who has final vendor approval authority" |

**Severity Scale:**
- **1** - Minor annoyance
- **2** - Noticeable friction
- **3** - Significant obstacle, requires workaround
- **4** - Major blocker, frequent delays
- **5** - Critical failure point, may cause abandonment

---

## Example: Complete Minimal Journey

```json
{
  "schema_info": {
    "version": "1.0.2",
    "standard": "Service Design Journey Standard v1.0",
    "last_updated": "2025-01-20T10:00:00Z"
  },
  "lanes": {
    "standard": [
      {
        "id": "actions",
        "label": "User Actions",
        "type": "text"
      },
      {
        "id": "barriers",
        "label": "Barriers",
        "type": "barrier"
      }
    ]
  },
  "journey": {
    "id": "vendor-eval",
    "title": "IT Vendor Evaluation",
    "purpose": "Map how CTOs select vendors",
    "summary": "From need recognition to vendor shortlist",
    "context": {
      "persona_context": "Hospital CTO evaluating IT systems"
    },
    "phases": [
      {
        "id": "awareness",
        "name": "Problem Recognition",
        "goal": "Identify current system is inadequate",
        "steps": [
          {
            "id": "review-data",
            "name": "Review complaint data",
            "lane_content": {
              "barriers": [
                {
                  "type": "technology",
                  "description": "Data in 3 separate systems",
                  "severity": 4
                }
              ]
            }
          }
        ]
      }
    ],
    "validation": {
      "research_sources": [
        {
          "source": "6 CTO interviews",
          "type": "interview",
          "confidence": "high"
        }
      ],
      "confidence_level": "high"
    }
  }
}
```

**Copy this template and customize it with your journey details!**

---

## Troubleshooting

### "My JSON won't validate"

**Common Issues:**
- Missing required comma between fields
- Forgot closing bracket `}` or `]`
- Used single quotes instead of double quotes
- `version` doesn't match pattern `1.0.X`
- Missing required field: `version`, `standard`, `last_updated`, `persona_context`, `confidence_level`

**Quick Fix:** Use a JSON validator like [JSONLint](https://jsonlint.com)

### "I have too many barriers - it looks overwhelming"

**Solution:** Focus on severity 3-5 barriers first. Minor annoyances (1-2) can be documented later or grouped.

### "I don't know which barrier type to use"

**Ask:** What's the root cause?
- **Can't do it because of workflow?** → process
- **Can't do it because system won't let me?** → technology
- **Can't do it because I don't know how?** → knowledge
- **Can't do it because no time/budget/people?** → resource
- **Can't do it because rules prevent it?** → policy
- **Can't do it because culture resists?** → cultural
- **Can't do it because unclear if we should?** → vision
- **Can't do it because no info/response?** → communications
- **Can't do it because unclear who decides?** → governance

### "My phases are uneven - is that okay?"

**Yes!** Some phases naturally have more steps. Research phases are often detailed, while decision phases may be quick.

### "Should I include failed steps?"

**Yes!** Failed attempts, abandoned paths, and workarounds reveal important insights. Mark them clearly in the step name or description.

---

## Next Steps

1. **Create your first journey** using the minimal template above
2. **Validate it** using the journey validator: `node validate-journey.js your-journey.json`
3. **Enrich it** by adding more lanes (emotions, channels, stakeholders)
4. **Link to personas** using the `persona_id` field
5. **Share it** - Export to tools, share JSON with teammates

**Need more depth?** Read the complete [SERVICE-DESIGN-JOURNEY-STANDARD.md](SERVICE-DESIGN-JOURNEY-STANDARD.md)

**Questions?** Submit issues to the repository

---

**You're ready to create evidence-based, standardized customer journeys. Start mapping!**
