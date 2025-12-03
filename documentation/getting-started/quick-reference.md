# Persona Quick Reference Guide
*Essential Templates and Checklists for Service Designers*

## 🚀 Quick Start Template

Copy this template and fill in your persona details:

```json
{
  "schema_info": {
    "version": "1.0.0",
    "persona_type": "business|consumer|employee",
    "last_updated": "2024-09-22",
    "created_by": "Your Name"
  },
  "identity": {
    "name": "[Realistic Name]",
    "id": "[lowercase-with-hyphens]",
    "summary": "[One sentence: who they are and what they do]"
  },
  "core_attributes": {
    "goals": [
      {
        "text": "[Specific, measurable goal]",
        "priority": "primary|secondary|aspirational",
        "timeframe": "immediate|short_term|long_term",
        "success_criteria": "[How they'll measure success]"
      }
    ],
    "pain_points": [
      {
        "text": "[Specific pain point with context]",
        "severity": 1-5,
        "frequency": "daily|weekly|monthly|occasional|rare",
        "context": "[When/where this happens]",
        "business_impact": "[Cost in time/money/opportunity]"
      }
    ],
    "motivations": [
      {
        "text": "[What drives them]",
        "type": "intrinsic|extrinsic|social|achievement"
      }
    ],
    "experience_level": "beginner|intermediate|advanced|expert",
    "channels": [
      {
        "name": "[Specific channel/touchpoint]",
        "type": "in_person_events|self_service_digital|personal_interaction|mobile_app|social_recommendations",
        "usage_context": "[When and why they use this]",
        "preference_level": "high|medium|low",
        "frequency": "daily|weekly|monthly|occasional",
        "influence_stage": "awareness|consideration|decision"
      }
    ],
    "moments_that_matter": [
      {
        "moment": "[Critical situation or event]",
        "emotional_state": -2 to +2,
        "importance": "critical|high|medium",
        "context": "[Why this creates strong emotion]",
        "trigger": "[What causes this moment]",
        "ideal_outcome": "[Best-case resolution]"
      }
    ],
    "barriers": [
      {
        "type": "process|technology|knowledge|resource|policy|cultural|vision|communications|governance",
        "description": "[Specific organizational/situational barrier]",
        "severity": "high|medium|low",
        "impact_areas": ["[area1]", "[area2]"],
        "business_impact": "[Organizational cost/impact]"
      }
    ],
    "use_cases": ["[Common scenario 1]", "[Common scenario 2]"],
    "success_metrics": ["[Measurable outcome 1]", "[Measurable outcome 2]"]
  },
  "validation": {
    "research_sources": [
      {
        "source": "[Research description]",
        "type": "interview|survey|analytics|observation|existing_research",
        "date": "2024-09-22",
        "confidence": "high|medium|low"
      }
    ],
    "confidence_level": "high|medium|low"
  }
}
```

---

## 🎯 Field-by-Field Quick Guide

### Identity Section
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Realistic persona name | "Sarah Martinez" |
| `id` | Unique identifier (lowercase, hyphens) | "sarah-martinez-working-mom" |
| `summary` | One sentence essence | "Working mom managing family coordination while advancing marketing career" |

### Goals
| Component | Purpose | Example |
|-----------|---------|---------|
| `text` | Specific, measurable goal | "Reduce daily family coordination time from 2 hours to 30 minutes" |
| `priority` | Importance level | "primary" (most important) |
| `timeframe` | When needed | "short_term" (next 3-6 months) |
| `success_criteria` | How they'll measure success | "Single-app solution managing schedules, meals, activities" |

### Pain Points
| Component | Purpose | Scale/Options |
|-----------|---------|---------------|
| `severity` | Impact level | 1=minor annoyance, 5=critical blocker |
| `frequency` | How often | daily, weekly, monthly, occasional, rare |
| `context` | When/where | "During school pickup coordination" |
| `business_impact` | Cost/consequence | "30 minutes daily managing different systems" |

### Barriers Taxonomy (The Game Changer)

**📚 Complete Reference:** [Barrier Taxonomy Documentation](../BARRIER_TAXONOMY.md)
| Type | When to Use | Example |
|------|-------------|---------|
| `process` | Workflow/procedure problems | "Each provider has different application process" |
| `technology` | Technical limitations | "Apps don't integrate, data scattered" |
| `knowledge` | Skill/expertise gaps | "Don't understand cloud security options" |
| `resource` | Time/budget/people constraints | "Only lunch breaks available for research" |
| `policy` | Regulatory/compliance rules | "HIPAA requires 6-month vendor reviews" |
| `cultural` | Organizational resistance | "Team prefers familiar tools over better ones" |
| `vision` | Strategic alignment issues | "Board doesn't understand cloud benefits" |
| `communications` | Information flow problems | "Different teams use different communication methods" |
| `governance` | Decision/approval processes | "IT changes need 3-department sign-off" |

### Channels by Type

**📚 Complete Reference:** [Channel Taxonomy Documentation](../CHANNEL_TAXONOMY.md)
| Type | Use For | Example |
|------|---------|---------|
| `in_person_events` | Conferences, meetings, workshops | "Healthcare IT Security Council meetings" |
| `self_service_digital` | Websites, docs, portals | "Vendor technical documentation review" |
| `personal_interaction` | Sales, support, consultations | "Custom implementation planning sessions" |
| `mobile_app` | Phone/tablet interactions | "School coordination apps during commute" |
| `social_recommendations` | Community, peer influence | "Mom Facebook groups for childcare recommendations" |

### Emotional States Scale
| Value | Meaning | When to Use |
|-------|---------|-------------|
| +2 | Very positive | Major success, relief, excitement |
| +1 | Positive | Satisfaction, optimism, progress |
| 0 | Neutral | Baseline, routine interactions |
| -1 | Negative | Frustration, concern, mild stress |
| -2 | Very negative | Anger, anxiety, crisis situations |

---

## ✅ Quality Checklist

### Before You Finish:
- [ ] **Persona ID** follows lowercase-with-hyphens format
- [ ] **Goals** have priority, timeframe, and success criteria
- [ ] **Pain points** include severity (1-5) and business impact
- [ ] **Barriers** use correct taxonomy (9 types) with severity
- [ ] **Channels** include usage context and preference levels
- [ ] **Moments** have emotional state (-2 to +2) and importance
- [ ] **Research sources** documented with confidence levels
- [ ] **All required fields** completed (no empty brackets)

### Professional Quality Levels:
- **Basic (40-60%)**: All required fields, basic detail
- **Professional (60-80%)**: Most fields with good detail and context
- **Comprehensive (80-100%)**: All fields with rich business context

---

## 🔧 Common Patterns & Examples

### Business Persona (B2B) Patterns:
```json
"goals": [{"text": "Achieve SOC 2 compliance within 12 months", "priority": "primary"}],
"barriers": [{"type": "governance", "description": "IT changes require 6-month review cycles"}],
"channels": [{"name": "Industry conferences", "type": "in_person_events"}],
"moments_that_matter": [{"moment": "Security audit results", "emotional_state": -2}]
```

### Consumer Persona (B2C) Patterns:
```json
"goals": [{"text": "Find reliable childcare within 2 weeks", "priority": "primary"}],
"barriers": [{"type": "resource", "description": "Only 15 minutes for decisions during lunch"}],
"channels": [{"name": "Mom Facebook groups", "type": "social_recommendations"}],
"moments_that_matter": [{"moment": "School pickup conflict", "emotional_state": -2}]
```

### Employee Persona (Internal) Patterns:
```json
"goals": [{"text": "Reduce admin time from 25% to 15% of work week", "priority": "secondary"}],
"barriers": [{"type": "process", "description": "Duplicate data entry across 4 systems"}],
"channels": [{"name": "Internal help desk", "type": "personal_interaction"}],
"moments_that_matter": [{"moment": "Monthly performance review", "emotional_state": 1}]
```

---

## 🎯 Design Application Shortcuts

### From Barriers to Solutions:
| Barrier Type | Design Focus | Solution Pattern |
|--------------|--------------|------------------|
| `technology` | Integration, compatibility | API connections, data synchronization |
| `process` | Workflow simplification | Step reduction, automation |
| `knowledge` | Education, guidance | Tutorials, progressive disclosure |
| `resource` | Efficiency, speed | Quick actions, mobile optimization |
| `communications` | Information clarity | Notifications, status updates |

### From Moments to Features:
| Emotional State | Design Priority | Feature Focus |
|----------------|-----------------|---------------|
| -2 (Critical negative) | Crisis prevention/resolution | Alerts, backup plans, rapid response |
| -1 (Frustrated) | Friction reduction | Simplification, clarity, shortcuts |
| 0 (Neutral) | Efficiency improvement | Optimization, personalization |
| +1 (Satisfied) | Experience enhancement | Delight moments, recognition |
| +2 (Ecstatic) | Success amplification | Sharing, celebration, achievement |

### From Channels to Touchpoints:
| Channel Type | Journey Stage | Design Considerations |
|--------------|---------------|----------------------|
| `in_person_events` | Awareness | Information architecture, takeaways |
| `self_service_digital` | Consideration | Search, comparison, detailed content |
| `personal_interaction` | Decision | Customization, relationship building |
| `mobile_app` | Usage/ongoing | Quick access, notifications, convenience |

---

## 🚀 Validation & Testing

### Quick Validation Commands:
```bash
# Basic validation
node validate-persona.js your-persona.json

# Quality assessment
node assess-quality.js your-persona.json --standard=comprehensive

# Integration check (if you have journeys)
node validate-integration.js --personas ./personas/ --journeys ./journeys/
```

### Self-Validation Questions:
1. **Specificity**: Could another team member create targeted solutions from this persona?
2. **Evidence**: Is each insight backed by research or observation?
3. **Actionability**: Do barriers and moments point to specific design opportunities?
4. **Measurability**: Can success be tracked against defined criteria?
5. **Authenticity**: Would real users recognize themselves in this persona?

---

## 🤝 When You Need Help

### Common Issues & Solutions:

**"I don't have formal user research"**
→ Start with what you know, document confidence levels, improve over time

**"Barriers seem too similar to pain points"**  
→ Pain points = what users experience, Barriers = why those problems exist

**"Don't know which channel type to choose"**
→ Focus on the primary way they interact, you can add more later

**"Emotional states seem subjective"**
→ Base on user quotes, observed behaviors, or consequences of the moment

**"Goals aren't measurable"**  
→ Ask "How would they know they succeeded?" and "What would change?"

### Community Resources:
- **GitHub Issues**: Technical questions and bug reports
- **Discussion Forums**: Best practices and implementation advice  
- **Examples Library**: Real-world personas for inspiration
- **Migration Help**: Converting existing personas step-by-step

---

## 📊 Success Metrics

### Track Your Persona Impact:

#### Immediate (Week 1-4):
- [ ] Persona creation time (should decrease after first few)
- [ ] Team alignment (fewer interpretation questions)
- [ ] Design specificity (solutions target specific barriers)

#### Medium-term (Month 1-6):
- [ ] Solution effectiveness (addressing identified barriers)
- [ ] User satisfaction (improved experience at critical moments)  
- [ ] Business metrics (achieving persona success criteria)

#### Long-term (6+ months):
- [ ] Organizational adoption (other teams using comprehensive personas)
- [ ] Design sophistication (more evidence-based decisions)
- [ ] Competitive advantage (better user understanding than competitors)

---

**Keep this reference handy** - bookmark it, print it, or save it where you create personas. **The comprehensive format becomes second nature with practice.**

**Ready to create more sophisticated, actionable personas that drive better design decisions!** 🚀