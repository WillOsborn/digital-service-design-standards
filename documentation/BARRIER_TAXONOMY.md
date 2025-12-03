# Canonical Barrier Taxonomy

**Version:** 1.0.2
**Last Updated:** 2025-11-28
**Status:** Official Reference

## Overview

This document defines the official 9-type barrier taxonomy used across all Digital Service Design Schemas. Understanding **why** problems persist is as important as knowing **what** problems exist.

**Barriers explain the root causes of friction that personas experience.**

---

## The 9 Official Barrier Types

### Complete Taxonomy

| Type | Definition | What It Reveals | Design Impact |
|------|------------|-----------------|---------------|
| `process` | Workflow and procedural friction | How organizational processes create unnecessary steps | Simplification, automation, workflow redesign |
| `technology` | Technical limitations and system constraints | What technical debt or integration issues block progress | API development, system integration, technical solutions |
| `knowledge` | Skill and expertise gaps | What users don't know or understand | Education, training, in-app guidance, documentation |
| `resource` | Time, budget, and personnel constraints | What limitations exist in capacity | Efficiency improvements, prioritization tools, quick actions |
| `policy` | Regulatory and compliance requirements | What rules constrain possible solutions | Compliance-first design, regulatory navigation |
| `cultural` | Organizational resistance and habits | Why people resist change despite better options | Change management, gradual adoption, familiar patterns |
| `vision` | Strategic alignment and clarity issues | What misalignment exists in goals and priorities | Leadership education, strategic alignment, ROI demonstration |
| `communications` | Information flow and stakeholder alignment | Where communication breaks down | Notifications, status updates, transparency features |
| `governance` | Decision-making and approval processes | Who needs to approve what and when | Workflow optimization, approval tracking, escalation paths |

---

## Detailed Type Descriptions

### 1. Process Barriers

**Definition:** Problems caused by how work is organized, sequenced, or executed.

**Indicators:**
- "We have to do X before Y before Z"
- "This requires approval from multiple people"
- "Each department has different procedures"
- "We need to fill out 5 forms for this"

**Common Manifestations:**
- Duplicate data entry across systems
- Multi-step approval workflows
- Inconsistent processes across teams
- Manual handoffs between systems

**Design Solutions:**
- Streamline workflows (remove unnecessary steps)
- Automate repetitive tasks
- Consolidate forms and data entry
- Enable parallel processing instead of sequential

**Business Impact:** Delays, inefficiency, errors from complexity

**Example:**
```json
{
  "type": "process",
  "description": "CRM requires duplicate data entry across 4 different systems for each prospect",
  "severity": "high",
  "impact_areas": ["time_efficiency", "data_accuracy", "user_frustration"],
  "business_impact": "10+ hours weekly on admin vs revenue-generating activities"
}
```

---

### 2. Technology Barriers

**Definition:** Limitations imposed by technical architecture, legacy systems, or integration challenges.

**Indicators:**
- "Our systems don't talk to each other"
- "We're stuck on this old platform"
- "The API doesn't support that functionality"
- "We can't integrate with modern tools"

**Common Manifestations:**
- Legacy system incompatibility
- Missing APIs or integration capabilities
- Performance limitations
- Security constraints blocking features

**Design Solutions:**
- Build integration layers
- API development
- System modernization roadmaps
- Workaround tools until migration possible

**Business Impact:** Innovation blockers, competitive disadvantage, high maintenance costs

**Example:**
```json
{
  "type": "technology",
  "description": "Legacy EHR system built on outdated architecture, incompatible with modern cloud security tools",
  "severity": "high",
  "impact_areas": ["security", "scalability", "integration"],
  "business_impact": "Blocking $200K in planned security improvements"
}
```

---

### 3. Knowledge Barriers

**Definition:** Gaps in skills, understanding, or expertise that prevent effective use.

**Indicators:**
- "I don't know how to..."
- "The team lacks expertise in..."
- "This is too technical for most users"
- "We need training on..."

**Common Manifestations:**
- Steep learning curves
- Complex terminology
- Unfamiliar concepts or workflows
- Missing documentation

**Design Solutions:**
- In-app guidance and tutorials
- Progressive disclosure of complexity
- Contextual help
- Training programs and documentation

**Business Impact:** Slow adoption, underutilization, support burden

**Example:**
```json
{
  "type": "knowledge",
  "description": "Team lacks cloud-native security expertise needed to evaluate solutions",
  "severity": "medium",
  "impact_areas": ["implementation_risk", "vendor_evaluation", "ongoing_management"],
  "business_impact": "Can't properly assess security solutions, may make poor choices"
}
```

---

### 4. Resource Barriers

**Definition:** Constraints in time, budget, or personnel availability.

**Indicators:**
- "We don't have time for..."
- "Budget won't cover..."
- "We're short-staffed"
- "Only 15 minutes available to..."

**Common Manifestations:**
- Time pressure limiting decision quality
- Budget constraints forcing compromises
- Understaffing creating workload issues
- Competing priorities

**Design Solutions:**
- Quick actions and shortcuts
- Mobile optimization for time-constrained users
- Batch operations
- Priority-based workflows

**Business Impact:** Rushed decisions, suboptimal choices, burnout

**Example:**
```json
{
  "type": "resource",
  "description": "Limited time for research - only 15-20 minutes available during lunch breaks",
  "severity": "high",
  "impact_areas": ["decision_quality", "stress_levels", "satisfaction"],
  "business_impact": "Defaults to first acceptable option vs optimal choice"
}
```

---

### 5. Policy Barriers

**Definition:** External regulations, internal policies, or compliance requirements that constrain options.

**Indicators:**
- "HIPAA/GDPR/SOC2 requires..."
- "Company policy states..."
- "Regulatory guidelines mandate..."
- "Legal says we must..."

**Common Manifestations:**
- Compliance validation delays
- Required security measures
- Data handling restrictions
- Vendor approval requirements

**Design Solutions:**
- Compliance-first architecture
- Automated compliance checks
- Built-in audit trails
- Regulatory reporting features

**Business Impact:** Extended timelines, reduced flexibility, implementation constraints

**Example:**
```json
{
  "type": "policy",
  "description": "HIPAA compliance requires 6-month vendor security review before any healthcare data access",
  "severity": "high",
  "impact_areas": ["speed_to_market", "vendor_selection", "implementation_timeline"],
  "business_impact": "12-18 month delay vs competitors in non-regulated industries"
}
```

---

### 6. Cultural Barriers

**Definition:** Organizational habits, preferences, and resistance to change.

**Indicators:**
- "We've always done it this way"
- "The team prefers..."
- "People are resistant to..."
- "That's not how we do things here"

**Common Manifestations:**
- Preference for familiar tools despite better options
- Resistance to new processes
- Department silos and territoriality
- "Not invented here" syndrome

**Design Solutions:**
- Gradual change with familiar patterns
- Change management strategies
- Pilot programs with champions
- Preserve valued aspects while improving

**Business Impact:** Slow adoption, underutilization, passive resistance

**Example:**
```json
{
  "type": "cultural",
  "description": "Sales team prefers manual Excel tracking despite CRM availability due to perceived flexibility",
  "severity": "medium",
  "impact_areas": ["data_quality", "visibility", "collaboration"],
  "business_impact": "Management lacks real-time pipeline visibility, forecasting inaccurate"
}
```

---

### 7. Vision Barriers

**Definition:** Lack of strategic clarity or misalignment on goals and priorities.

**Indicators:**
- "Leadership doesn't understand..."
- "We're not aligned on..."
- "No clear strategy for..."
- "Conflicting priorities between..."

**Common Manifestations:**
- Board doesn't grasp technical benefits
- Department goals conflict
- Short-term vs long-term tension
- Unclear success metrics

**Design Solutions:**
- Executive education materials
- ROI demonstrations
- Strategic alignment workshops
- Clear success metrics and dashboards

**Business Impact:** Strategic initiatives blocked, resource misallocation, slow decisions

**Example:**
```json
{
  "type": "vision",
  "description": "Board lacks understanding of cloud-first strategy benefits vs perceived risks",
  "severity": "high",
  "impact_areas": ["strategic_alignment", "budget_approval", "innovation_speed"],
  "business_impact": "Limited to tactical improvements vs strategic transformation"
}
```

---

### 8. Communications Barriers

**Definition:** Breakdowns in information flow, clarity, or stakeholder coordination.

**Indicators:**
- "Nobody told me..."
- "We use 5 different systems to communicate"
- "Information gets lost..."
- "Different teams have different answers"

**Common Manifestations:**
- Multiple disconnected communication channels
- Information overload
- Unclear messaging
- Poor documentation

**Design Solutions:**
- Unified notification systems
- Status dashboards
- Clear, concise messaging
- Information consolidation

**Business Impact:** Missed deadlines, duplicated work, coordination failures

**Example:**
```json
{
  "type": "communications",
  "description": "School, daycare, and activity coordinators all use different apps and methods to communicate",
  "severity": "medium",
  "impact_areas": ["cognitive_load", "missed_communications", "family_coordination"],
  "business_impact": "30+ minutes daily managing different systems, frequent missed events"
}
```

---

### 9. Governance Barriers

**Definition:** Complex or unclear decision-making authority and approval processes.

**Indicators:**
- "Who needs to approve this?"
- "Decision-making is unclear"
- "Multiple stakeholders must sign off"
- "We don't know who has authority"

**Common Manifestations:**
- Multi-level approval requirements
- Unclear escalation paths
- Committee decision-making
- Territory disputes over authority

**Design Solutions:**
- Clear approval workflows
- Escalation automation
- Authority mapping tools
- Parallel approval where possible

**Business Impact:** Decision delays, unclear accountability, frustration

**Example:**
```json
{
  "barrier": "IT infrastructure changes require approval from Security, Compliance, Finance, and Executive teams with no clear sequence",
  "type": "governance",
  "impact": "6-month average approval cycle for changes that should take 2 weeks, affecting speed, clarity, and accountability",
  "workarounds": "Build comprehensive business case early to accelerate review process"
}
```

---

## Usage in Personas

### Structure

```json
"barriers": [
  {
    "barrier": "Specific organizational or situational barrier",
    "type": "barrier_type_from_taxonomy",
    "impact": "Quantified or qualitative impact description",
    "workarounds": "How they currently cope with this barrier"
  }
]
```

### Best Practices

**DO:**
- Use specific, concrete barrier descriptions
- Quantify business impact when possible
- Include current workarounds (shows resilience and creativity)
- Map severity to actual business consequences
- Include multiple barrier types when relevant

**DON'T:**
- Confuse barriers with pain points (barriers explain WHY pain exists)
- Use vague descriptions like "Things are complicated"
- Assume severity - base it on business impact
- Ignore cultural/vision barriers (they're often most important)

---

## Usage in Journeys

### Barrier-to-Friction Mapping

Persona barriers manifest as specific friction points in journey steps:

```json
// Journey Step showing barrier manifestation
{
  "id": "technical-evaluation",
  "name": "Evaluate technical requirements",
  "lane_content": {
    "barriers": [
      {
        "type": "technology",
        "barrier": "Legacy system integration complexity blocks modern solution adoption",
        "impact": "Extends evaluation phase by 2-3 months",
        "workarounds": "Focus on vendors with proven legacy integration"
      },
      {
        "type": "knowledge",
        "barrier": "Team lacks cloud security expertise to properly evaluate solutions",
        "impact": "Delays decision making and increases risk of poor choice",
        "workarounds": "Hire external consultant for security evaluation"
      }
    ],
    "actions": [
      "Review vendor technical documentation",
      "Request integration architecture diagrams",
      "Consult with security team on cloud requirements"
    ]
  }
}
```

---

## Barrier Pattern Analysis

### Single Barrier Type Patterns

**Technology Barriers Alone:**
- Common in: IT, engineering, technical operations
- Solutions: Integration projects, API development, technical debt reduction

**Process Barriers Alone:**
- Common in: Operations, customer service, administrative functions
- Solutions: Workflow optimization, automation, policy updates

**Knowledge Barriers Alone:**
- Common in: New technology adoption, complex products, specialized domains
- Solutions: Training, documentation, in-app guidance

### Multi-Barrier Patterns

**Technology + Governance:**
- Pattern: "We could solve this technically, but approval process blocks implementation"
- Common in: Enterprise IT, regulated industries
- Solutions: Streamline governance alongside technical solutions

**Process + Cultural:**
- Pattern: "New process exists but people prefer old way"
- Common in: Change management scenarios
- Solutions: Gradual rollout with champions, preserve valued aspects

**Vision + Communications:**
- Pattern: "Leadership misalignment creates conflicting messages"
- Common in: Strategic initiatives, organizational change
- Solutions: Executive alignment workshops, consistent messaging

---

## Schema Definition

```json
"type": {
  "enum": [
    "process",
    "technology",
    "knowledge",
    "resource",
    "policy",
    "cultural",
    "vision",
    "communications",
    "governance"
  ]
}
```

---

## Common Mistakes

### ❌ Confusing Barriers with Pain Points

**Pain Point:** "System is slow and frustrating"  
**Barrier:** "Legacy database can't scale to current user load" (technology)

**Pain Point:** "Approval takes forever"  
**Barrier:** "Three departments must approve sequentially with no clear criteria" (governance)

### ❌ Being Too Generic

**Too Generic:** "There are technology issues"  
**Specific:** "Legacy EHR system uses SOAP APIs, can't connect to modern REST-based cloud services"

### ❌ Missing Business Impact

**Missing Impact:** "Budget constraints exist"  
**With Impact:** "Limited to $50K annually for all IT tools, forcing choice between security and productivity tools"

---

## Validation Checklist

When documenting barriers:

- [ ] Specific barrier description (not vague)
- [ ] Correct taxonomy type selected
- [ ] Severity based on business impact
- [ ] Impact areas identified
- [ ] Business consequences quantified when possible
- [ ] Current workarounds documented
- [ ] Multiple types included when applicable

---

## Version History

- **v1.0.0** (2024-09-30): Official 9-type barrier taxonomy
  - Comprehensive definitions for all barrier types
  - Usage guidelines for personas and journeys
  - Pattern analysis and common mistakes

---

## Related Documentation

- [Channel Taxonomy](CHANNEL_TAXONOMY.md) - Official channel type definitions
- [Quick Reference Guide](getting-started/quick-reference.md) - Templates and examples
- [Examples and Patterns](implementation/examples-and-patterns.md) - Real-world barrier analysis

---

**This is the authoritative reference for barrier types. Understanding barriers is the key to designing solutions that address root causes, not just symptoms.**
