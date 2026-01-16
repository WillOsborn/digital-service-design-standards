---
name: standards-enforcer
description: Checks artifacts against org-specific standards and requirements. Enforces custom field requirements, validation rules, and workflow states. Use for compliance checking before approval. Triggers on "check standards", "compliance check", "enforce standards", "is this compliant", "can this be approved", "review for approval".
allowed-tools: Read, Glob, Bash(node tools/validators/*:*), AskUserQuestion
---

# Standards Enforcer Skill

## Overview

This skill checks DSDS artifacts against organisation-specific standards defined in `.dsds-config.json`. It goes beyond schema validation to enforce custom field requirements, quality thresholds, and workflow rules.

## When to Use

- Before approving an artifact
- User asks "is this compliant with our standards?"
- Checking a batch of artifacts for org compliance
- Reviewing migrated artifacts
- Quality gate before publishing/sharing

## What It Checks

### 1. Schema Validation
Basic structural validation (delegates to schema-validator):
- JSON structure matches schema
- Required fields present
- Values match expected types

### 2. Custom Field Compliance
Org-specific requirements from config:
- Required custom fields are present
- Values match defined enums
- Patterns match (e.g., CRM ID format)

### 3. Quality Thresholds
If configured:
- Minimum completeness score met
- Research sources present (if required)
- Description length requirements

### 4. Workflow State
If approval workflow enabled:
- Current status (draft/approved)
- Status transitions valid

### 5. Relationship Integrity
Cross-artifact checks:
- personaRef points to existing persona
- roleRefs point to existing roles
- No circular references

## Process

### Step 1: Load Standards

```bash
# Read org config
cat .dsds-config.json
```

Extract:
- `custom_fields` requirements
- `custom_field_definitions` for validation
- `validation` settings
- `workflow` rules

### Step 2: Identify Artifacts to Check

```
AskUserQuestion:
  question: "What would you like to check against standards?"
  options:
    - label: "Single artifact"
      description: "Check one specific file"
    - label: "All of a type"
      description: "Check all personas, roles, etc."
    - label: "Everything"
      description: "Full portfolio compliance check"
    - label: "Recently changed"
      description: "Check artifacts modified in last 7 days"
```

### Step 3: Run Checks

For each artifact:

```
Checking: persona-sarah-martinez

**1. Schema Validation**
✅ Valid JSON structure
✅ All required fields present
✅ Values match expected types

**2. Custom Field Compliance**
✅ customer_segment: "Premium" (valid enum value)
✅ department: "Retail" (string, present)
⚠️ crm_id: missing (optional, recommended)

**3. Quality Thresholds**
✅ Completeness: 85% (minimum: 60%)
⚠️ Research sources: none (not required, but recommended)

**4. Workflow State**
✅ Status: approved
✅ Valid state

**5. Relationship Integrity**
✅ Referenced by: pairing-sarah-working-mom (exists)
✅ Referenced by: journey-clothes-shopping (exists)

**Result: COMPLIANT** ✅
Minor recommendations: Add crm_id, research sources
```

### Step 4: Summary Report

For multiple artifacts:

```
# Standards Compliance Report
Checked: 12 personas

## Summary
✅ Compliant: 10
⚠️ Compliant with warnings: 1
❌ Non-compliant: 1

## Non-Compliant Artifacts

**persona-incomplete**
- ❌ Missing required field: customer_segment
- ❌ Completeness: 45% (below minimum 60%)

Action required before approval.

## Warnings (compliant but could improve)

**persona-draft-user**
- ⚠️ Missing optional: crm_id
- ⚠️ No research sources

## Fully Compliant
- persona-sarah-martinez
- persona-marcus-thompson
- [8 more...]
```

## Compliance Levels

| Level | Icon | Meaning |
|-------|------|---------|
| Compliant | ✅ | Meets all requirements |
| Warning | ⚠️ | Compliant but recommendations exist |
| Non-compliant | ❌ | Fails required checks |

## Check Categories

### Required Checks (must pass)
- Schema validates
- Required custom fields present
- Required custom fields have valid values
- Minimum quality score (if configured)
- Research sources (if required in config)

### Recommended Checks (warnings only)
- Optional custom fields populated
- Quality score above 80%
- Research sources present
- Description is substantive (>50 chars)

### Workflow Checks (if enabled)
- Status field present
- Status is valid state
- Status appropriate for action (e.g., "approved" for publishing)

## Checking Specific Requirements

### Custom Field with Enum
```
Config:
{
  "custom_field_definitions": {
    "customer_segment": {
      "type": "enum",
      "values": ["Premium", "Standard", "Basic"]
    }
  }
}

Check:
- Field exists: ✅
- Value "Premium" in allowed values: ✅
```

### Custom Field with Pattern
```
Config:
{
  "custom_field_definitions": {
    "crm_id": {
      "type": "string",
      "pattern": "^CRM-[0-9]+$"
    }
  }
}

Check:
- Field exists: ✅
- Value "CRM-12345" matches pattern: ✅
- Value "12345" matches pattern: ❌
```

### Minimum Quality Score
```
Config:
{
  "validation": {
    "minimum_completeness_score": 60
  }
}

Check:
- Calculate completeness: 85%
- 85% >= 60%: ✅
```

## Approval Workflow

If `workflow.require_approval` is true:

```
User: Can persona-new-customer be approved?

Claude: Let me check persona-new-customer against approval requirements.

**Approval Checklist:**

✅ Schema valid
✅ Required custom fields present
   - customer_segment: "Standard"
   - department: "Retail"
✅ Quality score: 78% (≥60% required)
⚠️ Research sources: none (optional)
✅ All references valid

**Current status:** draft

**Verdict: READY FOR APPROVAL** ✅

This artifact meets all requirements.
Change status to "approved"?
```

If not ready:
```
**Verdict: NOT READY FOR APPROVAL** ❌

Issues to resolve:
1. Missing required field: customer_segment
2. Quality score 52% below minimum 60%

Would you like help fixing these issues?
```

## Example Session

```
User: Check all personas against our standards

Claude: I'll check all personas against your org standards.

[Reads .dsds-config.json]

Your standards require:
- customer_segment (required, enum)
- department (required, string)
- Minimum completeness: 60%

Checking 12 personas...

# Compliance Report

## Summary
| Status | Count |
|--------|-------|
| ✅ Compliant | 9 |
| ⚠️ Warnings | 2 |
| ❌ Non-compliant | 1 |

## Non-Compliant (1)

**persona-incomplete** ❌
- Missing: customer_segment (required)
- Quality: 45% (minimum: 60%)

## With Warnings (2)

**persona-draft-user** ⚠️
- Missing: crm_id (optional but recommended)

**persona-new-customer** ⚠️
- Quality: 62% (above minimum but low)

## Actions Needed

1. **persona-incomplete**: Add customer_segment, improve quality
   - Would you like to fix this now?

2. **persona-draft-user**: Consider adding crm_id
   - Optional, no action required

Ready to address the non-compliant artifact?
```

## Batch Compliance for Approval

```
User: What's ready for approval?

Claude: Checking all draft artifacts against approval requirements...

**Ready for Approval (can be approved now):**
- persona-new-customer (78% quality)
- journey-mobile-purchase (82% quality)
- role-support-agent (75% quality)

**Not Ready (needs work):**
- persona-incomplete - missing customer_segment
- journey-draft-v1 - quality 52%

**Already Approved:**
- [15 artifacts]

Would you like to:
1. Approve all ready artifacts
2. See details on what's not ready
3. Work on fixing issues
```

## Quality Checklist

Standards check should verify:

- [ ] Schema validation passes
- [ ] All required custom fields present
- [ ] Custom field values match definitions
- [ ] Quality score meets minimum
- [ ] Research sources present (if required)
- [ ] References point to existing artifacts
- [ ] Workflow status is appropriate
- [ ] Clear pass/fail/warning verdict

## Related Skills

- `org-config-manager` - Defines the standards
- `schema-validator` - Handles schema validation
- `completeness-checker` - Calculates quality scores
- `artifact-registry` - Provides relationship data
- `bulk-operations` - Fix issues across multiple artifacts
