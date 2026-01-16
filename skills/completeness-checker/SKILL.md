---
name: completeness-checker
description: Assesses artifact quality beyond schema validation - how well-documented, detailed, and useful is this artifact? Use for quality scoring. Triggers on "check completeness", "quality score", "how complete is", "assess quality", "documentation quality".
allowed-tools: Read, Glob
---

# Completeness Checker Skill

## Overview

This skill assesses artifact quality beyond basic schema validation. While validation checks "is it structurally correct?", completeness checking asks "is it useful and well-documented?" It provides quality scores and improvement suggestions.

## When to Use

- User asks "how complete is this artifact?"
- User wants quality assessment before sharing/publishing
- User needs to prioritise which artifacts need more work
- Reviewing migrated artifacts for quality
- Preparing artifacts for team use

## Quality Dimensions

### 1. Field Completeness
Are optional fields populated? How many fields are filled vs available?

### 2. Content Depth
Are values meaningful or placeholder-level? Is there enough detail?

### 3. Internal Consistency
Do values align with each other? Are there contradictions?

### 4. Specificity
Are values generic or specific to this persona/journey?

### 5. Actionability
Can a designer use this to make decisions?

## Scoring System

**Overall Score: A-F** (or percentage)

| Grade | Meaning | Action |
|-------|---------|--------|
| A (90-100%) | Excellent - ready for production use | None needed |
| B (75-89%) | Good - minor improvements possible | Polish optional |
| C (60-74%) | Adequate - usable but gaps exist | Address key gaps |
| D (40-59%) | Incomplete - significant gaps | Needs work before use |
| F (<40%) | Draft - not ready for use | Major revision needed |

## Process

### Step 1: Load Artifact

```bash
cat [artifact-path].json
```

### Step 2: Check Field Completeness

For each artifact type, assess required and optional field population:

#### Persona Completeness
```
**Field Completeness: Persona**

Required Fields:
- ✅ id: Present
- ✅ schemaVersion: Present
- ✅ name: Present
- ⚠️ description: Present but brief (< 50 chars)

Optional Fields (X/Y populated):
- ✅ technologyComfort.level: Present
- ✅ technologyComfort.confidenceAreas: Present (3 items)
- ⚠️ technologyComfort.avoidanceAreas: Present (1 item - could be more specific)
- ✅ communicationPreferences.preferredChannels: Present (2 items)
- ✅ communicationPreferences.frequencyPreference: Present
- ❌ communicationPreferences.bestTimes: Missing
- ✅ personalNeeds: Present (4 items)
- ✅ personalFrustrations: Present (3 items)
- ✅ decisionMakingStyle.approach: Present
- ✅ decisionMakingStyle.riskTolerance: Present
- ⚠️ decisionMakingStyle.influences: Present (1 item - could add more)

Field Score: 85% (17/20 assessment points)
```

#### Journey Completeness
```
**Field Completeness: Journey**

Structure:
- ✅ Phases: 5 phases defined
- ✅ Steps: 24 steps across phases
- ✅ All steps have lane_content

Lane Coverage:
| Lane | Steps with content | % |
|------|-------------------|---|
| actions | 24/24 | 100% |
| thoughts | 22/24 | 92% |
| emotions | 24/24 | 100% |
| channels | 20/24 | 83% |
| barriers | 12/24 | 50% |
| opportunities | 8/24 | 33% |

Field Score: 76%
```

### Step 3: Assess Content Depth

Evaluate quality of content, not just presence:

```
**Content Depth Assessment**

✅ **Good depth:**
- personalNeeds: Specific, actionable needs with clear context
- barriers: Include emergesFrom explanations
- emotions: Varied intensity, specific states

⚠️ **Could be deeper:**
- description: "A working professional" → Too generic
- thoughts: Some steps have single-word thoughts
- opportunities: Present but vague ("improve this")

❌ **Placeholder-level:**
- None identified

Depth Score: 72%
```

### Step 4: Check Internal Consistency

Look for contradictions or misalignments:

```
**Consistency Check**

✅ **Aligned:**
- Tech comfort "intermediate" matches confidence/avoidance areas
- Decision style "research-oriented" aligns with review-checking behaviour
- Frustrations match barriers encountered in journey

⚠️ **Potential inconsistency:**
- Persona says "avoids phone calls" but journey shows phone interaction
  → Is this a forced channel switch? Should be documented as barrier

❌ **Contradiction:**
- None identified

Consistency Score: 90%
```

### Step 5: Assess Specificity

Is this specific to this persona/context or generic?

```
**Specificity Assessment**

✅ **Highly specific:**
- Name and identity are clear
- Technology preferences are contextualised
- Barriers reference persona-specific traits

⚠️ **Somewhat generic:**
- "Wants good value" - true for anyone
- "Frustrated by long waits" - universal
- Consider: What makes THIS persona's relationship with value/waits unique?

❌ **Too generic:**
- None critically generic

Specificity Score: 78%
```

### Step 6: Actionability Check

Can a designer use this to make decisions?

```
**Actionability Assessment**

Can a designer answer:

✅ "How should we communicate with this persona?"
   → Clear channel preferences, frequency, timing

✅ "What information do they need?"
   → Research-oriented style documented, review importance noted

⚠️ "When would they abandon a process?"
   → Frustrations listed but thresholds unclear

⚠️ "What's their 'wow' moment?"
   → Not explicitly documented

❌ "How do they compare to other personas?"
   → No positioning relative to other user types

Actionability Score: 70%
```

### Step 7: Calculate Overall Score

```
**Overall Quality Score**

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Field Completeness | 85% | 25% | 21.25 |
| Content Depth | 72% | 25% | 18.00 |
| Consistency | 90% | 20% | 18.00 |
| Specificity | 78% | 15% | 11.70 |
| Actionability | 70% | 15% | 10.50 |
| **Total** | | | **79.45%** |

**Grade: B** (Good - minor improvements possible)
```

### Step 8: Improvement Recommendations

```
**Recommended Improvements**

🔴 **High Priority:**
1. Expand opportunities in journey (currently only 33% of steps)
   - Impact: Journey is less useful for improvement planning
   - Effort: Medium (requires thinking about each gap)

2. Add "bestTimes" to communication preferences
   - Impact: Missing actionable detail
   - Effort: Low (quick to add)

🟠 **Medium Priority:**
3. Deepen generic needs/frustrations
   - "Wants good value" → "Justifies purchases by quality-per-wear math"
   - Impact: More specific = more actionable

4. Document the phone interaction as forced channel switch
   - Currently inconsistent with "avoids phone calls"
   - Impact: Explains apparent contradiction

🟡 **Nice to Have:**
5. Add more decision influences
   - Currently only 1 item, could expand
   - Impact: Minor improvement to richness
```

## Artifact-Specific Checklists

### Persona Checklist
- [ ] Description is 2+ sentences, specific to this person
- [ ] Technology comfort has specific examples (not just level)
- [ ] At least 2 confidence areas and 2 avoidance areas
- [ ] Communication preferences include timing
- [ ] 3+ personal needs with specificity
- [ ] 3+ personal frustrations with specificity
- [ ] Decision influences documented
- [ ] No generic placeholder text

### Role Checklist
- [ ] Description explains the context/situation
- [ ] Needs are role-specific (not personality traits)
- [ ] Frustrations are inherent to the role
- [ ] Success metrics are measurable
- [ ] Could apply to different personas

### Pairing Checklist
- [ ] Valid references to existing persona and role(s)
- [ ] Goals are "as experienced" not copied from role
- [ ] At least one primary goal marked
- [ ] All barriers have emergesFrom explanations
- [ ] Opportunities leverage persona strengths
- [ ] Description explains the interaction

### Journey Checklist
- [ ] Persona context explains persona-journey fit
- [ ] All phases have descriptions
- [ ] All steps have actions (required lane)
- [ ] Thoughts are first-person, specific
- [ ] Emotion varies appropriately (not all positive/negative)
- [ ] Channels specified for all relevant steps
- [ ] Barriers have type, description, severity
- [ ] Opportunities are actionable, not vague

## Example Output

```
# Completeness Report: persona-sarah-martinez.json

## Summary
**Overall Grade: B+ (82%)**

This persona is well-documented and ready for production use with minor polish.

## Scores by Dimension
| Dimension | Score | Status |
|-----------|-------|--------|
| Field Completeness | 90% | ✅ Excellent |
| Content Depth | 78% | ✅ Good |
| Consistency | 95% | ✅ Excellent |
| Specificity | 75% | ⚠️ Good, could improve |
| Actionability | 72% | ⚠️ Good, gaps noted |

## Strengths
- Comprehensive technology profile
- Clear decision-making style with influences
- Frustrations are specific and actionable
- Well-structured, easy to read

## Areas for Improvement
1. **bestTimes missing** - Add communication timing
2. **Generic needs** - "Time efficiency" could be more specific
3. **Limited influences** - Only 2 decision influences listed

## Quick Fixes
- Add `"bestTimes": ["morning_before_work", "evening_after_kids_bedtime"]`
- Expand "Time efficiency" to "Completing tasks in 5-minute windows between commitments"

## Recommendation
**Ready for use** with optional polish. Priority if time allows: add communication timing.
```

## Quality Checklist

Report should include:

- [ ] Overall grade/score
- [ ] Dimension-by-dimension breakdown
- [ ] Specific strengths identified
- [ ] Specific weaknesses identified
- [ ] Prioritised improvement recommendations
- [ ] Quick fixes that can be done immediately
- [ ] Clear "ready for use" or "needs work" verdict

## Related Skills

- `schema-validator` - Structural validation (prerequisite)
- `persona-builder` - Address gaps interactively
- `journey-builder` - Improve journey completeness
- `example-creator` - Create high-quality examples
