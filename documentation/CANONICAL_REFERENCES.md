# Canonical Reference: Schema Components and Standards

**Version:** 1.0.2
**Last Updated:** 2025-11-28
**Purpose:** Single source of truth for all schema components, types, and definitions

---

## 🎯 Overview

This document provides the authoritative definitions for all standardized components used throughout the Digital Service Design Schemas. **Reference this document whenever you need clarification** on valid values, types, or taxonomies.

---

## 📊 **CANONICAL BARRIER TAXONOMY**

The 9-type barrier taxonomy is a core innovation of our schema system. These categories cover all forms of organizational and systemic friction.

### **Complete Barrier Types**

| **Barrier Type** | **Definition** | **Common Indicators** | **Design Response** |
|------------------|----------------|----------------------|---------------------|
| **process** | Workflow and procedural friction that slows or blocks progress | Manual handoffs, approval bottlenecks, redundant steps, unclear procedures | Process simplification, automation, workflow redesign |
| **technology** | Technical limitations, system incompatibilities, or infrastructure constraints | Legacy systems, integration failures, performance issues, tool limitations | API development, system upgrades, technical architecture improvements |
| **knowledge** | Skill gaps, expertise limitations, or learning curve challenges | Training needs, unclear documentation, complex interfaces, expertise dependencies | Education systems, simplified interfaces, guided workflows, expert support |
| **resource** | Time, budget, personnel, or capacity constraints | Understaffing, budget limits, competing priorities, bandwidth issues | Efficiency improvements, prioritization tools, resource optimization |
| **policy** | Regulatory requirements, compliance mandates, or legal constraints | Industry regulations, compliance requirements, legal restrictions, audit requirements | Compliance-first design, documentation automation, audit trail systems |
| **cultural** | Organizational resistance, behavioral habits, or change management challenges | "We've always done it this way," resistance to new tools, adoption reluctance | Change management approaches, gradual rollout, stakeholder engagement |
| **vision** | Strategic misalignment, unclear direction, or conflicting priorities | Unclear goals, competing initiatives, misaligned metrics, leadership disagreement | Strategic alignment sessions, OKR clarity, executive sponsorship |
| **communications** | Information flow problems, stakeholder coordination, or transparency gaps | Siloed information, unclear status, missed notifications, poor coordination | Notification systems, status dashboards, communication protocols |
| **governance** | Decision-making processes, approval hierarchies, or accountability structures | Unclear decision rights, approval delays, accountability gaps, escalation confusion | Approval workflow optimization, decision framework clarity, RACI matrices |

### **Usage Guidelines**

**When Documenting Barriers:**
1. Choose the **most specific applicable type** from the 9 categories
2. Include **severity/impact level** (1-5 scale)
3. Document **workarounds** if they exist
4. Link to **business impact** when possible

**Example:**
```json
{
  "barrier": "IT change management requires 6-month approval cycle for infrastructure changes",
  "type": "governance",
  "impact": "Delays critical infrastructure projects by average of 6 months",
  "workarounds": "Build comprehensive business case early in the process to accelerate review"
}
```

---

## 📡 **CANONICAL CHANNEL TAXONOMY**

The channel taxonomy uses a two-level system: **3 categories** for analysis and **7 standard types** for specific classification, with extensibility for custom types.

### **Channel Categories**

| **Category** | **Definition** | **Usage** |
|--------------|----------------|-----------|
| **digital** | Online and electronic interactions | Website browsing, app usage, social media engagement |
| **physical** | In-person and tangible touchpoints | Face-to-face meetings, physical locations, printed materials |
| **direct** | One-to-one communication channels | Email, phone, personal messaging |

### **Standard Channel Types**

| **Type** | **Category** | **Definition** | **Examples** |
|----------|--------------|----------------|--------------|
| **website** | digital | Web browser-based interactions | Company websites, web portals, online platforms |
| **app** | digital | Native mobile or tablet applications | Mobile apps, desktop applications |
| **social_media** | digital | Social networking platforms | Facebook, LinkedIn, Instagram, Twitter/X |
| **email** | direct | Email communication | Marketing emails, newsletters, support emails |
| **phone** | direct | Voice telephone calls | Customer service calls, sales calls |
| **in_person** | physical | Face-to-face interactions | Meetings, conferences, in-store visits |
| **post** | physical | Physical mail and printed materials | Letters, brochures, catalogs |
| **other** | any | Custom organization-specific types | Use with `custom_type` field |

### **Channel Properties**

When documenting channels in personas or journeys, include:

**Required:**
- `name` - Specific channel instance name
- `category` - One of: digital, physical, direct
- `type` - One of the 7 standard types or "other"

**Conditional:**
- `custom_type` - Required when type is "other"

**Recommended:**
- `usage_context` - When/why this channel is used
- `preference_level` - preferred | acceptable | avoided (personas only)
- `frequency` - How often the channel is used
- `influence_stage` - awareness | consideration | decision | retention

**Example:**
```json
{
  "name": "Industry conferences and trade shows",
  "category": "physical",
  "type": "in_person",
  "usage_context": "Learning about new technologies and vendor discovery",
  "preference_level": "preferred",
  "frequency": "monthly",
  "influence_stage": "awareness"
}
```

**Custom Type Example:**
```json
{
  "name": "Customer service SMS alerts",
  "category": "direct",
  "type": "other",
  "custom_type": "sms",
  "usage_context": "Appointment reminders and delivery notifications",
  "preference_level": "acceptable"
}
```

### **Type-to-Category Alignment**

Each channel type must align with its category:

**Digital:** website, app, social_media
**Physical:** in_person, post
**Direct:** email, phone

Schemas enforce this alignment through validation.

---

## 😊 **CANONICAL EMOTIONAL STATES**

Used in both persona "moments that matter" and journey "emotion" tracking.

### **Emotional State Scale**

| **Value** | **Label** | **Description** | **Common Triggers** |
|-----------|-----------|-----------------|-------------------|
| **+2** | Very Positive | Delight, excitement, strong satisfaction | Major success, exceeded expectations, breakthrough moment |
| **+1** | Positive | Satisfaction, contentment, mild pleasure | Goals achieved, smooth experience, positive progress |
| **0** | Neutral | Neither positive nor negative, baseline | Normal operations, routine activities, initial states |
| **-1** | Negative | Frustration, mild anxiety, disappointment | Minor friction, unmet expectations, small setbacks |
| **-2** | Very Negative | Anger, severe anxiety, distress | Critical failures, major obstacles, crisis situations |

### **Usage Guidelines**

**In Personas (Moments That Matter):**
- Document the emotional state during critical moments
- Link to importance level (critical, high, medium, low)
- Include context explaining the emotional trigger

**In Journeys (Step-by-Step):**
- Track emotional progression through journey phases
- Link emotion changes to specific friction or delight points
- Show how barriers manifest as emotional impact

**Example Progression:**
```
Step 1: Research options (0 - neutral)
Step 2: Discover complexity (−1 - frustrated by information overload)
Step 3: Critical error (−2 - distressed by data loss)
Step 4: Support resolution (+1 - relieved by helpful response)
Step 5: Success (+2 - delighted by outcome exceeding expectations)
```

---

## 🎯 **CANONICAL PRIORITY LEVELS**

Used for goal prioritization throughout schemas.

| **Priority** | **Definition** | **Usage Guideline** |
|--------------|----------------|-------------------|
| **primary** | Core objectives that define success | 1-3 primary goals per persona; mission-critical outcomes |
| **secondary** | Important but not mission-critical | Supporting objectives; nice-to-have improvements |
| **aspirational** | Long-term vision or stretch goals | Future state ideals; may not be immediately actionable |

---

## ⏰ **CANONICAL TIMEFRAMES**

Used for goal timeframes throughout schemas.

| **Timeframe** | **Typical Duration** | **Usage Guideline** |
|---------------|---------------------|-------------------|
| **immediate** | Days to weeks | Urgent needs; current pain points requiring rapid resolution |
| **short_term** | Weeks to months | Near-term objectives; next quarter goals |
| **long_term** | Months to years | Strategic vision; multi-quarter initiatives |

---

## 📈 **CANONICAL IMPORTANCE LEVELS**

Used for moments that matter and risk assessment.

| **Importance** | **Definition** | **Impact** |
|----------------|----------------|-----------|
| **critical** | Defines success or failure of entire experience | User will abandon or succeed based on this moment |
| **high** | Major influence on satisfaction and outcomes | Significantly affects user perception and decisions |
| **medium** | Noticeable but not determinative | Contributes to overall experience quality |
| **low** | Minor touchpoint | Limited impact on overall success |

---

## 🔍 **CANONICAL FREQUENCY VALUES**

Used for pain points, channel usage, and recurring interactions.

| **Frequency** | **Typical Occurrence** |
|---------------|----------------------|
| **daily** | Every day or multiple times per day |
| **weekly** | 1-6 times per week |
| **monthly** | 1-4 times per month |
| **occasional** | A few times per year |
| **rare** | Once or less per year |

---

## 🎓 **CANONICAL EXPERIENCE LEVELS**

Used to indicate user skill and familiarity.

| **Level** | **Definition** | **Characteristics** |
|-----------|----------------|-------------------|
| **beginner** | New to the domain or tool | Needs guidance, training, simplified interfaces; makes basic mistakes |
| **intermediate** | Comfortable with basics, learning advanced features | Can accomplish common tasks; needs occasional help; developing efficiency |
| **advanced** | Strong proficiency, uses sophisticated features | Efficient workflows; rarely needs help; explores capabilities |
| **expert** | Deep expertise, could teach others | Highly efficient; creates workarounds; influences others; power user |

---

## 🔬 **CANONICAL RESEARCH SOURCE TYPES**

Used in validation sections for evidence documentation.

| **Source Type** | **Definition** | **Quality Indicators** |
|----------------|----------------|----------------------|
| **interview** | Direct one-on-one or group conversations with users | Sample size, methodology rigor, structured vs. unstructured |
| **survey** | Quantitative survey responses | Response rate, sample size, statistical significance |
| **analytics** | Behavioral data from systems and tools | Data volume, time period, measurement accuracy |
| **observation** | Direct observation of user behavior | Observer training, environment naturalism, documentation method |
| **existing_research** | Secondary research from external sources | Source credibility, recency, methodology transparency |

---

## 📊 **CANONICAL CONFIDENCE LEVELS**

Used for research validation and data quality assessment.

| **Confidence** | **Definition** | **When to Use** |
|----------------|----------------|----------------|
| **high** | Strong evidence with multiple high-quality sources | 3+ research sources, recent data, large sample sizes, corroborating evidence |
| **medium** | Good evidence but with some limitations | 1-2 solid sources, reasonable recency, adequate sample sizes |
| **low** | Limited evidence or significant uncertainties | Single source, dated information, small samples, assumptions made |

---

## 🔢 **CANONICAL SEVERITY/IMPACT SCALES**

Used for pain points, barriers, and risk assessment.

### **1-5 Severity Scale**

| **Level** | **Description** | **Business Impact** |
|-----------|----------------|-------------------|
| **1** | Minor annoyance | Minimal impact; users continue with slight frustration |
| **2** | Noticeable friction | Slows progress; reduces efficiency; may cause complaints |
| **3** | Significant problem | Blocks some users; drives workarounds; affects satisfaction |
| **4** | Major blocker | Prevents completion for many users; high frustration; escalations |
| **5** | Critical failure | Complete breakdown; user abandonment; business loss; reputation damage |

---

## 🏢 **BUSINESS PERSONA SPECIFIC VALUES**

### **Company Size Categories**
```
1-10, 11-50, 51-200, 201-1000, 1000+
```

### **Seniority Levels**
```
individual_contributor, team_lead, manager, director, vp, c_level
```

### **Budget Ranges**
```
under_1k, 1k_10k, 10k_50k, 50k_250k, 250k_1m, over_1m
```

---

## 👤 **CONSUMER PERSONA SPECIFIC VALUES**

### **Income Ranges**
```
under_25k, 25k_50k, 50k_75k, 75k_100k, 100k_150k, over_150k
```

---

## 📝 **USAGE GUIDELINES**

### **When Creating New Personas:**
1. ✅ Always reference this document for valid values
2. ✅ Use exact spelling and capitalization for enum values
3. ✅ Include required fields (marked with ✱ in schemas)
4. ✅ Provide context and descriptions, not just values

### **When Extending Schemas:**
1. ✅ Propose new canonical values through community process
2. ✅ Document new types with clear definitions and examples
3. ✅ Update this reference document with additions
4. ✅ Maintain backward compatibility when possible

### **When Validating Data:**
1. ✅ Check all enum values against this reference
2. ✅ Ensure severity/impact scores use correct scales
3. ✅ Verify emotional states are within -2 to +2 range
4. ✅ Confirm barrier types match the 9 canonical types

---

## 🔄 **Version History**

| **Version** | **Date** | **Changes** |
|-------------|----------|------------|
| 1.0.0 | 2024-09-30 | Initial canonical reference document |

---

## 📚 **Related Documentation**

- **Schema Architecture**: See `SCHEMA_ARCHITECTURE.md` for structure overview
- **Migration Guide**: See `implementation/migration-guide.md` for conversion instructions
- **Examples**: See `examples/personas/` for reference implementations
- **Validation**: See `tools/validators/` for automated checking

---

**This is the single source of truth for all schema components. When in doubt, reference this document.**
