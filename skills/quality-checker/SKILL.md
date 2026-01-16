---
name: quality-checker
description: Runs validation and ensures quality standards across the project. Use when the user wants to validate examples, run tests, check quality scores, or verify compliance. Triggers on phrases like "run validation", "check quality", "test the examples", "verify compliance", "run tests", "validate all".
allowed-tools: Read, Glob, Bash(node tools/validators/*:*), Task, AskUserQuestion
---

# Quality Checker Skill

## Overview

This skill runs validation tests and quality checks across the Digital Service Design Standards project. It executes test suites, reports quality scores, identifies issues, and verifies compliance with schemas.

## When to Use

- User asks to "run validation" or "validate the examples"
- User wants to "check quality" or "get quality scores"
- User needs to "test all examples" or "run the test suite"
- User asks to "verify compliance" or "check for issues"
- Before releases or after making changes

## Key Files to Reference

### Validators
- `tools/validators/run-all-tests.js` - Full test suite
- `tools/validators/validate-v1.1.js` - Multi-type validator
- `tools/validators/validate-persona.js` - Persona-specific validation
- `tools/validators/validate-journey.js` - Journey-specific validation

### Example Directories to Test
- `v1.1/examples/personas/` - Core Persona examples
- `v1.1/examples/roles/` - Role Card examples
- `v1.1/examples/pairings/` - Pairing examples
- `v1.1/examples/journeys/` - Journey examples
- `v1.1/examples/patterns/` - Pattern examples

### Schemas (validation targets)
- `v1.1/schemas/core-persona.schema.json`
- `v1.1/schemas/role-card.schema.json`
- `v1.1/schemas/pairing.schema.json`
- `v1.1/schemas/journey.schema.json`
- `v1.1/schemas/pattern.schema.json`

## Process

### Step 1: Determine Scope

Clarify what to check:
- All examples or specific files?
- Specific type (personas, journeys, etc.)?
- Full validation or quick check?
- Include quality scoring?

### Step 2: Run Validation

**Full Test Suite:**
```bash
node tools/validators/run-all-tests.js
```

**Specific File:**
```bash
node tools/validators/validate-v1.1.js v1.1/examples/personas/persona-sarah-martinez.json
```

**Specific Type (all personas):**
```bash
for f in v1.1/examples/personas/*.json; do
  node tools/validators/validate-v1.1.js "$f"
done
```

**Journey Validation:**
```bash
node tools/validators/validate-journey.js v1.1/examples/journeys/[journey].json
```

### Step 3: Review Results

Check for:
- Schema validation errors
- Quality scores
- Missing required fields
- Invalid enum values
- Cross-reference issues

### Step 4: Report Findings

Summarize:
- Total files checked
- Pass/fail counts
- Quality score distribution
- Specific issues found
- Recommendations

### Step 5: Suggest Fixes (if issues found)

For each issue:
- Identify the file and field
- Explain what's wrong
- Suggest the fix

## Quality Score Interpretation

The validators produce quality scores (0-100%):

| Score | Rating | Meaning |
|-------|--------|---------|
| 80-100% | Comprehensive | Production ready, well-documented |
| 60-79% | Enhanced | Good quality, minor improvements possible |
| 40-59% | Basic | Functional but limited depth |
| 0-39% | Incomplete | Needs significant work |

**Factors that improve scores:**
- All required fields populated
- Optional fields included
- Detailed descriptions
- Arrays with multiple items
- Valid cross-references

## Common Issues

### Schema Validation Errors
- Missing required fields
- Wrong data types
- Invalid enum values
- Pattern mismatches in IDs

### Quality Issues (not errors, but reduce score)
- Empty or sparse arrays
- Generic descriptions
- Missing optional fields
- Single-item arrays where more expected

### Cross-Reference Issues
- personaRef pointing to non-existent persona
- roleRefs with invalid role IDs
- Pattern references that don't exist

## Quick Commands

```bash
# Run everything
node tools/validators/run-all-tests.js

# Validate single file
node tools/validators/validate-v1.1.js [path/to/file.json]

# Validate all personas
ls v1.1/examples/personas/*.json | xargs -I {} node tools/validators/validate-v1.1.js {}

# Validate all journeys
ls v1.1/examples/journeys/*.json | xargs -I {} node tools/validators/validate-journey.js {}

# Check a specific schema type
node tools/validators/validate-v1.1.js --type=pairing v1.1/examples/pairings/*.json
```

## Quality Checklist for Examples

When reviewing quality, check:

**Core Personas:**
- [ ] technologyComfort has level, confidenceAreas, avoidanceAreas
- [ ] communicationPreferences fully populated
- [ ] personalNeeds has 2+ items
- [ ] personalFrustrations has 2+ items
- [ ] decisionMakingStyle complete

**Role Cards:**
- [ ] roleType is valid enum
- [ ] roleBasedNeeds has 2+ items
- [ ] roleBasedFrustrations has 2+ items
- [ ] successMetrics defined

**Pairings:**
- [ ] personaRef is valid
- [ ] roleRefs are valid
- [ ] barriers have emergesFrom field
- [ ] goals have priority
- [ ] opportunities defined

**Journeys:**
- [ ] personaRef and roleRefs set
- [ ] phases have multiple steps
- [ ] emotions tracked with values
- [ ] touchpoints defined
- [ ] barriers mapped to steps

## Report Template

```
# Quality Check Report

## Summary
- Files checked: X
- Passed: X
- Failed: X
- Average quality score: X%

## By Type
| Type | Count | Passed | Avg Score |
|------|-------|--------|-----------|
| Personas | X | X | X% |
| Roles | X | X | X% |
| Pairings | X | X | X% |
| Journeys | X | X | X% |

## Issues Found
1. [file]: [issue description]
2. [file]: [issue description]

## Recommendations
- [Specific recommendation]
- [Specific recommendation]
```

## Example Session

```
User: Run validation on all our examples and give me a quality report.

Claude: I'll run the full test suite and compile a quality report.

[Runs: node tools/validators/run-all-tests.js]

Here's the quality report:

## Summary
- Files checked: 8
- Passed: 8
- Failed: 0
- Average quality score: 78%

## By Type
| Type | Count | Passed | Avg Score |
|------|-------|--------|-----------|
| Personas | 2 | 2 | 85% |
| Roles | 2 | 2 | 72% |
| Pairings | 2 | 2 | 80% |
| Journeys | 2 | 2 | 75% |

## Quality Improvements Suggested

1. **role-working-mom-consumer.json** (72%)
   - Could add more successMetrics (currently has 1)
   - roleBasedFrustrations could be more detailed

2. **Journey files** (75%)
   - Some steps missing emotion tracking
   - Could add more touchpoint detail

All examples pass schema validation. Would you like me to show specific suggestions for improving any of these files?

User: Yes, show me what would improve the working mom role card.

Claude: [Reads role-working-mom-consumer.json]

The Working Mom Consumer role card scores 72%. Here's what would bring it to 80%+:

Current:
- successMetrics: 1 item
- roleBasedFrustrations: 2 items (good)
- roleBasedNeeds: 3 items (good)

Suggestions:
1. Add 2-3 more successMetrics, such as:
   - "Decisions made without buyer's remorse"
   - "Time spent researching reduced by 50%"

2. Add context to existing frustrations with severity indicators

Would you like me to make these enhancements?
```
