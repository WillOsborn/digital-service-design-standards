# Validator Documentation: Quality Assurance Tools

**Version:** 1.0.0  
**Last Updated:** 2024-09-30  
**Location:** `tools/validators/`

---

## 🎯 Overview

Our validation tools ensure quality, consistency, and standards compliance for all persona and journey data. These automated validators catch errors early, provide enhancement guidance, and generate quality scores.

**Two Core Validators:**
1. **Persona Validator** (`validate-persona.js`) - Validates individual personas with enhancement scoring
2. **Journey Validator** (`validate-journey.js`) - Validates customer journeys with integration checks

---

## 📋 Persona Validator

### **Purpose**
Validates persona JSON files against the v1.0.0 schema and calculates enhancement level scores.

### **Usage**

```bash
# Basic validation
node validate-persona.js path/to/persona.json

# Example
node validate-persona.js ../examples/personas/david-chen-business-persona-v1.json
```

### **What It Validates**

#### **1. Required Structure** (❌ Errors if missing)
- `schema_info` section with version and persona_type
- `identity` section with name and ID
- `core_attributes` section with goals, pain_points, motivations
- `validation` section with research sources

#### **2. Data Quality** (❌ Errors if invalid)
- Schema version must be "1.0.0"
- Persona type must be: business, consumer, or employee
- Identity ID must be lowercase letters, numbers, underscores, hyphens only
- Goals priority must be: primary, secondary, or aspirational
- Pain points severity must be 1-5
- Emotional states must be -2 to +2
- All enum values must match canonical references

#### **3. Enhanced Attributes** (⚠️ Warnings if missing/incomplete)
- Goals without priority or timeframe
- Pain points without severity or frequency
- Motivations without type classification
- Missing channels, barriers, moments_that_matter
- Missing use_cases or success_metrics
- Experience level not specified

#### **4. Persona-Type Specific** (⚠️ Warnings for recommendations)
- Business personas: business_context and decision_making in extensions
- Consumer personas: demographics in extensions
- Employee personas: work_context in extensions

### **Enhancement Scoring System**

The validator calculates a 0-100 enhancement score based on:

**Required Fields (40 points):**
- Schema info, identity, core attributes basics: 30 points
- Enhanced goals (priority + timeframe): +5 points
- Quantified pain points (severity + frequency): +5 points

**Enhanced Attributes (60 points):**
- Experience level: 5 points
- Channels with type and context: 10 points
- Moments that matter with emotional state: 10 points
- Barriers with systematic type taxonomy: 15 points
- Use cases: 5 points
- Success metrics: 10 points
- High-quality validation: 5 points

**Enhancement Levels:**

| **Score** | **Level** | **Description** |
|-----------|-----------|-----------------|
| 80-100% | Comprehensive | Professional-grade persona with all enhanced attributes |
| 60-79% | Enhanced | Good persona with most enhanced attributes present |
| 40-59% | Basic | Meets minimum requirements but lacks enhanced insights |
| 0-39% | Incomplete | Missing required fields or critical attributes |

### **Output Example**

```
🔍 Validating: david-chen-business-persona-v1.json

✅ Validation complete for david-chen-business-persona-v1.json

📊 ENHANCEMENT LEVEL:
   Score: 95% (95/100)
   Level: Comprehensive
   Professional-grade persona with all enhanced attributes

✨ Enhancement Highlights:
   ✅ Goals include priority and timeframe
   ✅ Pain points include severity and frequency
   ✅ Channels include type and usage context
   ✅ Moments include emotional state and importance
   ✅ Barriers include systematic type classification
   ✅ Barriers include impact level assessment
   ✅ Use cases documented
   ✅ Success metrics defined
   ✅ High-quality validation with multiple sources

🎉 Excellent! Professional-grade persona with comprehensive insights.
```

### **Exit Codes**
- `0` - Validation passed (no errors)
- `1` - Validation failed (errors found)

---

## 🗺️ Journey Validator

### **Purpose**
Validates customer journey JSON files against the v1.0.0 journey schema with persona integration checks.

### **Usage**

```bash
# Basic validation
node validate-journey.js path/to/journey.json

# Example
node validate-journey.js ../examples/journeys/standard-lanes.json
```

### **What It Validates**

#### **1. Top-Level Structure** (❌ Errors if missing)
- `schema_info` with spec_version and last_updated
- `lanes` section with standard lane definitions
- `journey` section with complete journey data

#### **2. Lane Definitions** (❌ Errors if invalid)
- Each lane must have: id, label, type
- Lane IDs must start with lowercase letter
- Lane types must be: text, list, metric, emotion, reference, barrier, channel
- Cardinality must be: one-per-step or many-per-step (if specified)

#### **3. Journey Structure** (❌ Errors if missing/invalid)
- Journey must have: id, title, purpose, summary
- Context must include persona_context
- At least one phase required
- Each phase must have: id, name, steps
- At least one step per phase required
- Step IDs must be alphanumeric with underscores/hyphens

#### **4. Enhanced Content Validation** (❌ Errors if invalid)
- Emotion values must be integers from -2 to +2
- Barrier types must match 9 canonical types
- Channel types must match 5 canonical types
- Moments that matter importance: critical, high, medium, low
- Barrier severity must be 1-5

#### **5. Integration Quality** (⚠️ Warnings for recommendations)
- Persona ID should follow naming conventions
- Journey should link to specific persona
- Research sources should be documented
- Emotional progression should vary across journey
- Minimum 3 steps for actionable insights

#### **6. Journey-Level Validation** (❌ Errors if missing)
- Research sources with type and description
- Confidence level: high, medium, or low
- Valid research types: analytics, observation, interview, survey, existing_research

### **Journey Insights**

The validator provides helpful insights about your journey:

```
📊 Journey Insights:
   - 3 phases with 12 total steps
   - Barrier types identified: governance, knowledge, technology
   - Channel types used: direct, digital, social
```

### **Output Example**

```
🔍 Validating: enhanced-journey-example.json

✅ Validation complete for enhanced-journey-example.json

⚠️  WARNINGS (1):
   - Phase 2: Consider adding moments_that_matter for critical touchpoints

📊 Journey Insights:
   - 3 phases with 8 total steps
   - Barrier types identified: governance, knowledge, technology, communications
   - Channel types used: direct, digital, media

✅ Valid! Only minor warnings to consider.
```

### **Exit Codes**
- `0` - Validation passed (no errors)
- `1` - Validation failed (errors found)

---

## 🔄 Complete Test Suite

### **Purpose**
Runs all validators across all example files for comprehensive quality assurance.

### **Usage**

```bash
cd tools/validators/
node run-all-tests.js
```

### **What It Does**

1. **Finds all persona JSON files** in `examples/personas/`
2. **Finds all journey JSON files** in `examples/journeys/`
3. **Runs persona validator** on each persona
4. **Runs journey validator** on each journey
5. **Aggregates results** and provides summary

### **Output Example**

```
🧪 Running complete schema validation test suite...

📋 Testing Personas:
==================
🔍 Validating: david-chen-business-persona-v1.json
✅ Validation complete for david-chen-business-persona-v1.json
📊 ENHANCEMENT LEVEL: 95% (Comprehensive)
🎉 Excellent! Professional-grade persona with comprehensive insights.

🔍 Validating: sarah-martinez-consumer-persona-v1.json
✅ Validation complete for sarah-martinez-consumer-persona-v1.json
📊 ENHANCEMENT LEVEL: 90% (Comprehensive)
🎉 Excellent! Professional-grade persona with comprehensive insights.

🗺️  Testing Journeys:
==================
🔍 Validating: standard-lanes.json
✅ Validation complete for standard-lanes.json
✅ Valid! Good persona with room for enhancement.

📊 Test Summary:
================
Files tested: 4
Total errors: 0
Total warnings: 2

🎉 All tests passed! Your schemas are ready for use.
```

---

## 🎯 Common Validation Errors and Fixes

### **Error: "Identity ID must be lowercase letters, numbers, underscores, and hyphens only"**

**Problem:**
```json
"id": "David Chen - IT Director"
```

**Fix:**
```json
"id": "david-chen-it-director"
```

**Rule:** IDs must be machine-readable identifiers

---

### **Error: "Pain point severity must be 1-5"**

**Problem:**
```json
{
  "text": "System is slow",
  "severity": 7
}
```

**Fix:**
```json
{
  "text": "System causes 3-5 hour delays daily",
  "severity": 4
}
```

**Rule:** Use 1-5 scale where 1=minor, 5=critical

---

### **Error: "Barrier type must be one of: process, technology, knowledge..."**

**Problem:**
```json
{
  "barrier": "Approval takes too long",
  "type": "approval"
}
```

**Fix:**
```json
{
  "barrier": "Approval takes too long",
  "type": "governance"
}
```

**Rule:** Use only the 9 canonical barrier types (see CANONICAL_REFERENCES.md)

---

### **Error: "Emotion must be integer from -2 to +2"**

**Problem:**
```json
"emotion": "frustrated"
```

**Fix:**
```json
"emotion": -1
```

**Rule:** Emotional states use numeric scale: -2 (very negative) to +2 (very positive)

---

### **Warning: "Goals don't include priority and timeframe"**

**Problem:**
```json
{
  "text": "Improve performance"
}
```

**Fix:**
```json
{
  "text": "Improve system performance by 25% within 6 months",
  "priority": "primary",
  "timeframe": "short_term"
}
```

**Impact:** Enhanced goals enable better prioritization

---

### **Warning: "No barriers specified"**

**Impact:** Missing systematic root cause analysis

**Fix:** Add barriers section:
```json
"barriers": [
  {
    "barrier": "Legacy systems incompatible with modern tools",
    "type": "technology",
    "impact_level": 4,
    "workaround": "API middleware layer for integration"
  }
]
```

---

## 🛠️ Validator Development

### **Extending Validation Rules**

To add new validation rules:

1. **Edit validator file** (`validate-persona.js` or `validate-journey.js`)
2. **Add validation logic** in appropriate section
3. **Classify as error or warning**
4. **Update this documentation**
5. **Test with example files**

### **Enhancement Scoring Adjustments**

To modify enhancement scoring:

1. **Edit `calculateEnhancementScore()` function** in `validate-persona.js`
2. **Adjust point allocations** for different fields
3. **Update documentation** with new scoring criteria
4. **Run test suite** to validate changes

---

## 📊 Quality Metrics

### **What "Good" Looks Like**

**Professional-Grade Persona (80%+ Enhancement Score):**
- ✅ All 9 core attributes populated
- ✅ Goals with priorities and timeframes
- ✅ Quantified pain points with severity/frequency
- ✅ Systematic barrier analysis across multiple types
- ✅ Channel preferences with usage context
- ✅ Critical moments identified with emotional states
- ✅ Success metrics for outcome tracking
- ✅ Multiple high-quality research sources

**Quality Journey Map:**
- ✅ Linked to specific persona with rich context
- ✅ Multiple phases with logical progression
- ✅ 8-15 steps with meaningful detail
- ✅ Emotional arc with variation
- ✅ Barrier-to-friction mapping
- ✅ Channel progression documented
- ✅ Evidence-based with research sources

---

## 🔧 Troubleshooting

### **Problem: Validator won't run**

**Check:**
1. Node.js is installed (`node --version`)
2. You're in the correct directory
3. File path is correct
4. File has .json extension

### **Problem: "Cannot parse JSON"**

**Common Causes:**
- Missing comma between fields
- Extra comma after last field
- Unmatched quotes or brackets
- Invalid escape characters

**Fix:** Use JSON validator (jsonlint.com) to identify syntax errors

### **Problem: Too many warnings**

**Strategy:**
- Fix errors first (validation blockers)
- Address warnings incrementally
- Prioritize high-value enhancements (barriers, moments, channels)
- Use enhancement scoring to track progress

---

## 📚 Related Documentation

- **CANONICAL_REFERENCES.md** - Valid values for all fields
- **SCHEMA_ARCHITECTURE.md** - System structure overview
- **migration-guide.md** - Converting existing personas
- **quality-checklist.md** - Production readiness standards

---

## 🎓 Best Practices

### **When to Validate**

**During Creation:**
- Validate after each major section
- Fix errors immediately
- Iterate on warnings

**Before Sharing:**
- Run complete validation
- Achieve 80%+ enhancement score
- Review all warnings

**Before Production:**
- Zero errors required
- Address all critical warnings
- Run complete test suite

### **Using Validation for Improvement**

1. **Establish baseline** - Run validation on existing personas
2. **Set enhancement targets** - Aim for 80%+ comprehensive level
3. **Prioritize enhancements** - Focus on barriers, moments, channels first
4. **Validate incrementally** - Check progress after each addition
5. **Track over time** - Monitor enhancement scores across persona library

---

**Validation is your quality assurance partner - use it early and often!**
