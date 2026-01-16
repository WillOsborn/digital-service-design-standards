---
name: schema-validator
description: Validates artifacts against schemas with clear, actionable reporting. Wraps CLI validators with better UX. Use when checking if files are valid. Triggers on "validate", "check schema", "is this valid", "run validation", "check for errors".
allowed-tools: Read, Glob, Bash(node tools/validators/*:*)
---

# Schema Validator Skill

## Overview

This skill validates Digital Service Design artifacts against their schemas, providing clear, actionable error reporting and guidance on how to fix issues. It wraps the CLI validators with better user experience.

## When to Use

- User asks to "validate" a file or set of files
- User wants to check if their artifact is schema-compliant
- User gets validation errors and needs help understanding them
- Before saving/committing artifacts
- After migration or editing

## Validators Available

| Validator | Purpose | Command |
|-----------|---------|---------|
| `validate-v1.1.js` | Personas, Roles, Pairings | `node tools/validators/validate-v1.1.js [file]` |
| `validate-journey.js` | Journeys | `node tools/validators/validate-journey.js [file]` |
| `run-all-tests.js` | All examples | `node tools/validators/run-all-tests.js` |

## Process

### Step 1: Identify What to Validate

Determine scope:

```
What would you like to validate?

1. A specific file (provide path)
2. All files of a type (personas, roles, journeys, etc.)
3. Everything (full test suite)
```

### Step 2: Run Appropriate Validator

Based on file type:

```bash
# For persona, role, or pairing
node tools/validators/validate-v1.1.js v1.1/examples/personas/persona-sarah-martinez.json

# For journey
node tools/validators/validate-journey.js v1.1/examples/journeys/sarah-martinez-clothes-shopping-journey.json

# For all examples
node tools/validators/run-all-tests.js
```

### Step 3: Interpret Results

**If valid:**
```
✅ **Validation Passed**

[filename] is valid against the [schema-type] schema.

All required fields present, all values conform to schema constraints.
```

**If invalid:**
```
❌ **Validation Failed**

[filename] has [N] error(s):

**Error 1:** [error message]
- Location: [JSON path]
- Expected: [what schema expects]
- Found: [what file contains]
- Fix: [how to correct it]

**Error 2:** [error message]
- Location: [JSON path]
- ...
```

### Step 4: Provide Actionable Fixes

For each error type, explain the fix:

#### Missing Required Field
```
❌ Missing required field: "schemaVersion"
- Location: root
- Fix: Add "schemaVersion": "1.1" to the root of your JSON

Example:
{
  "id": "persona-name",
  "schemaVersion": "1.1",  // ← Add this
  ...
}
```

#### Invalid Enum Value
```
❌ Invalid value for "technologyComfort.level"
- Location: technologyComfort.level
- Expected: One of ["beginner", "intermediate", "advanced"]
- Found: "medium"
- Fix: Change "medium" to "intermediate"
```

#### Wrong Type
```
❌ Type mismatch for "severity"
- Location: barriers[0].severity
- Expected: number (1-5)
- Found: string "high"
- Fix: Change "high" to a number, e.g., 4
```

#### Invalid Barrier Type
```
❌ Invalid barrier type
- Location: barriers[0].type
- Expected: One of ["process", "technology", "knowledge", "resource", "policy", "cultural", "vision", "communications", "governance"]
- Found: "technical"
- Fix: Change "technical" to "technology"
```

#### Missing Reference
```
❌ Invalid reference format
- Location: personaRef
- Expected: Format "persona-[name-kebab-case]"
- Found: "Sarah Martinez"
- Fix: Change to "persona-sarah-martinez"
```

### Step 5: Batch Validation

When validating multiple files:

```
**Validation Results: v1.1/examples/personas/**

| File | Status | Errors |
|------|--------|--------|
| persona-sarah-martinez.json | ✅ Valid | 0 |
| persona-marcus-thompson.json | ✅ Valid | 0 |
| persona-new-draft.json | ❌ Invalid | 2 |

**Summary:** 2/3 files valid

**Issues in persona-new-draft.json:**
1. Missing "schemaVersion"
2. Invalid technology level "mid" (should be "intermediate")
```

### Step 6: Full Test Suite

When running all tests:

```
**Full Validation Suite**

Running validators across all examples...

**Personas:** 3/3 valid ✅
**Roles:** 2/2 valid ✅
**Pairings:** 1/1 valid ✅
**Journeys:** 1/1 valid ✅

**Overall: All 7 files valid** ✅
```

Or if issues:

```
**Full Validation Suite**

**Personas:** 2/3 valid ⚠️
- ❌ persona-new-draft.json (2 errors)

**Roles:** 2/2 valid ✅

**Pairings:** 1/1 valid ✅

**Journeys:** 0/1 valid ❌
- ❌ journey-draft.json (5 errors)

**Overall: 5/7 files valid** ⚠️

See detailed errors above for fixes.
```

## Common Validation Errors

### Schema Version
```
Error: Missing "schemaVersion"
Fix: Add "schemaVersion": "1.1" to root
```

### ID Format
```
Error: Invalid ID format
Expected: [type]-[name-kebab-case]
Examples:
- persona-sarah-martinez
- role-working-mom-consumer
- pairing-sarah-working-mom
- journey-clothes-shopping
```

### Barrier Severity
```
Error: Severity must be 1-5
Fix: Change text values to numbers
- "critical" → 5
- "high" → 4
- "moderate" → 3
- "low" → 2
- "minimal" → 1
```

### Emotion Intensity
```
Error: Emotion intensity must be -2 to +2
Fix: Use numeric scale
- Very negative → -2
- Negative → -1
- Neutral → 0
- Positive → +1
- Very positive → +2
```

### Channel Structure
```
Error: Channel missing required fields
Required: type, serviceModel
Fix: Ensure each channel has:
{
  "type": "app",
  "serviceModel": "self_service"
}
```

### Array vs String
```
Error: Expected array, found string
Location: personalNeeds
Fix: Change from string to array:
- "Need 1" → ["Need 1"]
- "Need 1, Need 2" → ["Need 1", "Need 2"]
```

## Example Session

```
User: Validate my new persona file

Claude: I'll validate your persona file. What's the file path?

User: v1.1/examples/personas/persona-test.json

Claude: [Runs validator]

❌ **Validation Failed**

persona-test.json has 3 errors:

**Error 1:** Missing required field
- Location: root
- Missing: "schemaVersion"
- Fix: Add "schemaVersion": "1.1"

**Error 2:** Invalid enum value
- Location: technologyComfort.level
- Found: "medium"
- Expected: ["beginner", "intermediate", "advanced"]
- Fix: Change "medium" to "intermediate"

**Error 3:** Wrong type
- Location: personalNeeds
- Found: string
- Expected: array
- Fix: Wrap in array: "Quick service" → ["Quick service"]

Would you like me to fix these issues for you?

User: Yes please

Claude: [Applies fixes, re-validates]

✅ **Validation Passed**

persona-test.json is now valid. Fixed:
- Added schemaVersion: "1.1"
- Changed technology level to "intermediate"
- Converted personalNeeds to array format
```

## Quality Checklist

Validation report should include:

- [ ] Clear pass/fail status
- [ ] Error count
- [ ] Specific error locations (JSON path)
- [ ] What was expected vs found
- [ ] Actionable fix instructions
- [ ] Examples where helpful
- [ ] Offer to auto-fix simple issues

## Related Skills

- `completeness-checker` - Quality scoring beyond validation
- `example-creator` - Create valid examples from scratch
- `migration-helper` - Fix issues during migration
