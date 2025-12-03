# Service Design Persona Standard v1.0

**Version:** 1.0.2
**Status:** Active
**Last Updated:** 2025-11-25

---

## 1. Introduction

### What This Standard Is

The Service Design Persona Standard provides a comprehensive, machine-readable format for creating evidence-based personas that drive design decisions. It goes beyond basic demographic profiles to capture behavioral depth, organizational barriers, and measurable outcomes through a structured 9-field system.

### Why This Standard Exists

Organizations struggle with inconsistent persona formats that limit:
- **Interoperability** - Personas can't be shared across tools
- **Depth** - Surface-level profiles miss critical behavioral insights
- **Evidence** - Lack of validation undermines credibility
- **Actionability** - Missing context prevents effective use

This standard addresses these gaps by providing:
- JSON schemas for machine processing
- Structured fields that capture behavioral complexity
- Required validation to ensure research backing
- Barrier taxonomy to reveal root causes of friction

### Who Should Use This Standard

- **Service Designers** creating research-based personas
- **Product Teams** making user-informed decisions
- **Organizations** establishing consistent persona practices
- **Tool Developers** building persona management systems

---

## 2. Shared Attributes (9-Field System)

The standard defines 9 shared attributes present in all persona types, providing a consistent foundation for behavioral analysis:

### Identity & Core Attributes
- **name** (in identity) - Full name of the persona
- **summary** (in identity) - Brief description of the persona
1. **goals** - What users want to achieve, with priorities and timeframes
2. **pain_points** - Frustrations and obstacles, with severity and frequency
3. **motivations** - Why users act, categorized by type (intrinsic, extrinsic, social, achievement)
4. **experience_level** - Skill level (beginner, intermediate, advanced, expert)
5. **channels** - How users interact (13 standard types with medium and service model attributes)
6. **moments_that_matter** - Critical emotional touchpoints in the user journey
7. **barriers** - Organizational friction using 9-type taxonomy
8. **use_cases** - Common interaction scenarios
9. **success_metrics** - How users measure success

**Note:** These 9 attributes (plus identity) are present in all persona types (business, consumer, employee) and form the comprehensive foundation for persona analysis.

---

## 3. Shared Attributes - Required Fields

### 3.1 Goals

**Purpose:** Define what the persona wants to achieve
**Structure:** Array of goal objects
**Required Fields:** `text`
**Optional Fields:** `priority` (primary|secondary|aspirational), `timeframe` (immediate|short_term|long_term)

**Example:**
```json
{
  "text": "Implement cloud-first infrastructure strategy",
  "priority": "primary",
  "timeframe": "long_term"
}
```

**Quality Guidelines:**
- Use action-oriented language
- Make goals specific and measurable
- Include both immediate and aspirational goals
- Prioritize 3-5 goals maximum

### 3.2 Pain Points

**Purpose:** Identify frustrations and obstacles the persona experiences
**Structure:** Array of pain point objects
**Required Fields:** `text`
**Optional Fields:** `severity` (1-5), `frequency` (daily|weekly|monthly|occasional|rare), `context`

**Example:**
```json
{
  "text": "Legacy systems that are expensive to maintain",
  "severity": 4,
  "frequency": "daily",
  "context": "Particularly affecting daily operations and budget planning"
}
```

**Quality Guidelines:**
- Capture specific, observable frustrations
- Rate severity from 1 (minor annoyance) to 5 (major blocker)
- Document frequency to understand impact
- Provide context for when pain points occur

### 3.3 Motivations

**Purpose:** Explain why the persona takes action
**Structure:** Array of motivation objects
**Required Fields:** `text`
**Optional Fields:** `type` (intrinsic|extrinsic|social|achievement)

**Motivation Types:**
- **intrinsic** - Internal satisfaction, personal values
- **extrinsic** - External rewards, recognition
- **social** - Relationships, belonging, helping others
- **achievement** - Accomplishment, mastery, career advancement

**Example:**
```json
{
  "text": "Ensuring patient data security and privacy",
  "type": "intrinsic"
}
```

### 3.4 Experience Level

**Purpose:** Indicate the persona's skill and familiarity
**Structure:** Single enum value
**Values:** beginner | intermediate | advanced | expert

**Definitions:**
- **beginner** - New to domain, needs guidance
- **intermediate** - Comfortable with basics, building proficiency
- **advanced** - Highly skilled, handles complex scenarios
- **expert** - Deep expertise, influences others

---

## 4. Shared Attributes - Recommended Fields

### 4.1 Channels

**Purpose:** Document how the persona prefers to interact
**Structure:** Array of channel objects with multi-attribute model
**Required Fields:** `channel`, `medium`, `serviceModel`
**Optional Fields:** `name`, `custom_channel`, `usage_context`, `preference_level` (preferred|acceptable|avoided)

**Channel Attributes:**

**Medium** - The technology basis of the channel:
- **digital** - Online and electronic interactions
- **non_digital** - Physical and analog interactions

**Service Model** - How the interaction is handled:
- **self_service** - User-driven, no staff involvement required
- **managed** - Staff-assisted or staff-driven interaction
- **both** - Can be either self-service or managed depending on context

**Standard Channel Types:**
- **website** - Web browser-based interactions (digital, self_service)
- **app** - Native mobile/tablet applications (digital, self_service)
- **chatbot** - Automated chat interfaces (digital, self_service)
- **live_chat** - Staff-assisted chat (digital, managed)
- **email** - Email communication (digital, managed)
- **social_media** - Social networking platforms (digital, both)
- **phone** - Voice calls (non_digital, both - can be IVR or agent)
- **video_call** - Video conferencing (digital, managed)
- **in_person** - Face-to-face interactions (non_digital, managed)
- **post** - Physical mail (non_digital, both)
- **kiosk** - Self-service terminals (digital, self_service)
- **sms** - Text messaging (digital, both)
- **other** - Custom types via `custom_channel` field

**Example:**
```json
{
  "channel": "in_person",
  "medium": "non_digital",
  "serviceModel": "managed",
  "name": "Industry conferences and trade shows",
  "usage_context": "Learning about new technologies and vendor discovery",
  "preference_level": "preferred"
}
```

**Custom Channel Example:**
```json
{
  "channel": "other",
  "medium": "digital",
  "serviceModel": "self_service",
  "custom_channel": "mobile_push_notification",
  "name": "Order status push notifications",
  "usage_context": "Appointment reminders and urgent notifications",
  "preference_level": "acceptable"
}
```

### 4.2 Moments That Matter

**Purpose:** Identify critical emotional touchpoints
**Structure:** Array of moment objects
**Required Fields:** `moment`
**Optional Fields:** `emotional_intensity` (-2 to +2), `importance` (critical|high|medium|low), `current_experience`

**Emotional Intensity Scale:**
- **-2** - High stress, anxiety, frustration
- **-1** - Mild concern, uncertainty
- **0** - Neutral, calm
- **+1** - Satisfied, pleased
- **+2** - Excited, delighted

**Example:**
```json
{
  "moment": "Initial vendor evaluation and RFP process",
  "emotional_intensity": -1,
  "importance": "critical",
  "current_experience": "High stress due to compliance requirements and stakeholder pressure"
}
```

### 4.3 Barriers

**Purpose:** Reveal organizational friction using structured taxonomy
**Structure:** Array of barrier objects
**Required Fields:** `barrier`, `type`
**Optional Fields:** `impact`, `workarounds`

**See Section 5 for complete barrier type taxonomy**

**Example:**
```json
{
  "barrier": "Complex approval processes for new technology",
  "type": "process",
  "impact": "Delays decisions by 2-3 months on average",
  "workarounds": "Build business cases with clear ROI and compliance benefits"
}
```

### 4.4 Use Cases

**Purpose:** Document common interaction scenarios
**Structure:** Array of use case objects
**Required Fields:** `scenario`
**Optional Fields:** `trigger`, `actions`, `outcome`

**Example:**
```json
{
  "scenario": "Evaluating cloud migration solutions",
  "trigger": "Legacy system maintenance costs exceed $100K annually",
  "actions": "Research vendors, attend demos, evaluate compliance",
  "outcome": "Shortlist of 3 qualified vendors for proof-of-concept"
}
```

### 4.5 Success Metrics

**Purpose:** Define how the persona measures success
**Structure:** Array of metric objects
**Required Fields:** `metric`
**Optional Fields:** `target`, `current_state`

**Example:**
```json
{
  "metric": "System uptime percentage",
  "target": "99.9% uptime",
  "current_state": "98.2% uptime"
}
```

---

## 5. Barrier Type Taxonomy

The barrier taxonomy is a key differentiator of this standard. It reveals **why** problems persist by classifying organizational friction into 9 types:

| Type | Definition | Examples |
|------|------------|----------|
| **process** | Workflow and procedural friction | Complex approval chains, redundant steps, unclear handoffs |
| **technology** | Technical limitations or integration issues | Legacy systems, poor integration, mobile limitations |
| **knowledge** | Skill gaps or expertise requirements | Insufficient training, technical complexity, domain expertise needed |
| **resource** | Time, budget, or personnel constraints | Limited headcount, budget cuts, competing priorities |
| **policy** | Regulatory or compliance requirements | HIPAA constraints, legal restrictions, industry regulations |
| **cultural** | Organizational resistance or habits | "We've always done it this way", risk aversion, status quo bias |
| **vision** | Strategic alignment or clarity issues | Unclear direction, conflicting priorities, lack of roadmap |
| **communications** | Information flow problems | Siloed teams, unclear documentation, poor transparency |
| **governance** | Decision-making or authority issues | Unclear ownership, approval bottlenecks, accountability gaps |

**Usage Guidelines:**
- Choose the type that best represents the **root cause**
- When multiple types apply, select the primary blocker
- Document workarounds to understand coping strategies
- Quantify impact when possible (time, cost, frequency)

---

## 6. Type-Specific Attributes

The standard defines three persona types (business, consumer, employee). While all types share the 9 core attributes defined in Sections 3-4, each type has additional context fields specific to that persona category:

### 6.1 Business Persona

**Use For:** B2B decision-makers, procurement professionals, business buyers

**Type-Specific Fields:**

**business_context** (required fields: role_title, department)
- `role_title` - Job title
- `department` - Organizational unit
- `industry` - Sector or vertical
- `company_size` - 1-10 | 11-50 | 51-200 | 201-1000 | 1000+
- `seniority_level` - individual_contributor | team_lead | manager | director | vp | c_level

**decision_making** (optional, required field: decision_authority)
- `decision_authority` - Description of purchasing power
- `budget_range` - under_1k | 1k_10k | 10k_50k | 50k_250k | 250k_1m | over_1m
- `approval_process` - Array of approval steps

### 6.2 Consumer Persona

**Use For:** B2C customers, end consumers, individual buyers

**Type-Specific Fields:**

**demographics** (required field: age)
- `age` - Integer, 16-99
- `location` - City, state, or region
- `education` - Educational background
- `income` - under_25k | 25k_50k | 50k_75k | 75k_100k | 100k_150k | over_150k
- `household_size` - Integer

**lifestyle** (optional)
- `lifestyle` - General lifestyle description
- `shopping_behavior` - Purchase patterns and preferences
- `technology_usage` - Tech adoption and comfort level

### 6.3 Employee Persona

**Use For:** Internal staff, organizational members, workforce

**Type-Specific Fields:**

**work_context** (required field: role_department)
- `role_department` - Role and department
- `career_stage` - Career progression context
- `work_style` - Work preferences and habits
- `performance_context` - Performance metrics and reviews
- `change_readiness` - Attitude toward change

---

## 7. Validation Requirements

All personas **must** include a validation section documenting research sources.

### Required Fields

**research_sources** (array, minimum 1)
- `source` - Description of research source
- `type` - interview | survey | analytics | observation | existing_research
- `date` - ISO 8601 date (optional but recommended)
- `confidence` - high | medium | low

**confidence_level** - Overall confidence: high | medium | low

### Confidence Guidelines

**High Confidence:**
- Multiple research sources
- Recent data (within 12 months)
- Direct user research (interviews, observations)
- Sample size statistically significant

**Medium Confidence:**
- Single research source
- Mix of direct and indirect research
- Data 12-24 months old
- Representative but limited sample

**Low Confidence:**
- Assumptions or hypotheses
- Indirect or proxy research
- Outdated data (>24 months)
- Limited sample size

**Example:**
```json
{
  "research_sources": [
    {
      "source": "Stakeholder interviews (February 2024)",
      "type": "interview",
      "date": "2024-02-15",
      "confidence": "high"
    }
  ],
  "confidence_level": "high"
}
```

---

## 8. Extension Guidelines

Organizations can extend personas with custom fields using the `extensions` section.

### Structure

```json
{
  "extensions": {
    "custom": {
      "orgname_fieldname": "value"
    },
    "legacy": {
      "migrated_field": "value"
    }
  }
}
```

### Custom Field Guidelines

1. **Namespace your fields:** Use `orgname_fieldname` pattern
2. **Use extensions.custom:** Don't add custom fields to standard sections
3. **Document your extensions:** Maintain internal documentation
4. **Consider proposing:** If broadly useful, propose addition to standard

**Example:**
```json
{
  "extensions": {
    "custom": {
      "acmecorp_security_clearance": "top_secret",
      "acmecorp_facility_access": ["building_a", "building_c"]
    }
  }
}
```

---

## 9. Quality Criteria

### Minimum Quality
- All required fields populated
- At least 3 goals, 3 pain points, 2 motivations
- At least 1 research source
- Valid JSON against schema

### Production Quality
- All core attributes complete
- At least 3 extended attributes populated
- Barriers include type classification
- Multiple research sources
- Confidence level documented

### Comprehensive Quality
- All 9 fields fully populated
- Barriers quantified with impact
- Moments that matter include emotional intensity
- Success metrics with targets
- High confidence validation
- Recent research (within 12 months)

---

## 10. Version History

### Version 1.0.2 (2025-11-25, updated 2025-12-03)
- **Schema Architecture:** Changed from inheritance ($ref) to self-contained schemas
- **Field Organization:** Moved channels, moments_that_matter, barriers to extended_attributes
- **Type-Specific Context:** Moved to top-level (not under extensions)
- **Language:** Removed "enhanced" terminology throughout
- **Channel Taxonomy (Updated 2025-12-03):** Replaced hierarchical category/type structure with multi-attribute model:
  - **Old:** `name` + `category` (digital/physical/direct) + `type` (8 types) + `custom_type`
  - **New:** `channel` (13 types) + `medium` (digital/non_digital) + `serviceModel` (self_service/managed/both) + `name` + `custom_channel`
  - Enables independent filtering by medium and service model
  - Addresses semantic issues (e.g., email now properly classified as digital)
  - Standard channel types: website, app, chatbot, live_chat, email, social_media, phone, video_call, in_person, post, kiosk, sms, other
- **Documentation:** Added SERVICE-DESIGN-PERSONA-STANDARD.md specification
- **Export Format:** Added CSV export layer with specification

### Version 1.0.1 (2025-10-11)
- Added barrier type taxonomy with 9 categories
- Expanded channel types to 10-type taxonomy
- Added use_cases and success_metrics fields
- Improved validation requirements

### Version 1.0.0 (2024-02-28)
- Initial release
- Core 9-field persona system
- Three persona types (business, consumer, employee)
- JSON Schema implementation

---

## Appendix A: Schema Locations

Official schemas are available at:

- **Business:** `https://schemas.digitalservice.design/persona/v1.0.2/business`
- **Consumer:** `https://schemas.digitalservice.design/persona/v1.0.2/consumer`
- **Employee:** `https://schemas.digitalservice.design/persona/v1.0.2/employee`

---

## Appendix B: Additional Resources

- **Migration Guide:** See migration-guide.md for upgrading from v1.0.1
- **CSV Export:** See csv-export-specification.md for exporting to spreadsheets
- **Examples:** See examples/ directory for production-quality personas

---

**Standard maintained by:** Digital Service Design Working
**Questions or feedback:** Submit issues to repository
