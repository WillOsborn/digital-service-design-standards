---
name: bulk-operations
description: Performs operations across multiple DSDS artifacts - adding fields, updating values, renaming references, migrating schemas. Use when making consistent changes across the collection. Triggers on "add field to all", "update all personas", "rename", "migrate", "bulk update", "change everywhere".
allowed-tools: Read, Write, Glob, Grep, Edit, Bash(node tools/validators/*:*), AskUserQuestion
---

# Bulk Operations Skill

## Overview

This skill performs consistent changes across multiple DSDS artifacts. It handles adding custom fields, updating values, renaming references, and migrating between schema versions.

## When to Use

- User wants to "add a field to all personas"
- User needs to "rename" a persona/role reference across artifacts
- User wants to "update" a value consistently
- Schema migration between versions
- Applying new org requirements to existing artifacts

## Safety Principles

1. **Preview before apply** - Always show what will change
2. **Backup recommendation** - Suggest git commit or backup first
3. **Incremental updates** - Process one artifact at a time, validate each
4. **Rollback guidance** - Explain how to undo if needed

## Operations

### Operation 1: Add Custom Field

Add a new field to all artifacts of a type.

```
User: Add customer_segment to all personas

Claude: I'll add 'customer_segment' to all personas.

First, let me check what we're working with:
- Found 12 personas
- 3 already have customer_segment
- 9 need it added

How should I handle the value?

[AskUserQuestion]
Options:
1. Prompt me for each persona's value
2. Use a default value for all (I'll specify)
3. Leave empty (null) for manual completion later
```

**Process:**
1. Read org config for field definition
2. Find all artifacts of the type
3. Check which already have the field
4. Apply value based on user choice
5. Validate each updated artifact
6. Update registry index

```
Applying changes...

✅ persona-sarah-martinez: Set customer_segment = "Premium"
✅ persona-marcus-thompson: Set customer_segment = "Standard"
✅ persona-first-time-buyer: Set customer_segment = "Basic"
...

9 personas updated, 3 already had field.
All validations passed.

Registry index updated.
```

### Operation 2: Update Field Value

Change a field value across multiple artifacts.

```
User: Change all "customer_segment: Basic" to "customer_segment: Essential"

Claude: I'll update customer_segment from "Basic" to "Essential".

Searching for artifacts with customer_segment = "Basic"...

Found 4 matches:
1. persona-first-time-buyer
2. persona-casual-browser
3. persona-price-sensitive
4. persona-student-user

Preview:
- customer_segment: "Basic" → "Essential"

Apply these changes?
```

### Operation 3: Rename Reference

Rename a persona or role ID and update all references.

```
User: Rename persona-sarah-martinez to persona-sarah-m

Claude: I'll rename 'persona-sarah-martinez' to 'persona-sarah-m'.

This will update:

**Source file:**
- personas/persona-sarah-martinez.json
  - id: "persona-sarah-martinez" → "persona-sarah-m"
  - filename: persona-sarah-martinez.json → persona-sarah-m.json

**References to update:**
- pairings/pairing-sarah-working-mom.json
  - personaRef: "persona-sarah-martinez" → "persona-sarah-m"

- journeys/journey-clothes-shopping.json
  - personaRef: "persona-sarah-martinez" → "persona-sarah-m"

**Total changes:** 3 files

⚠️ This is a significant change. Recommended: commit current state to git first.

Proceed?
```

**Process:**
1. Find the source artifact
2. Search for all references (personaRef, roleRefs)
3. Preview all changes
4. Rename source file
5. Update source artifact ID
6. Update all references
7. Validate all changed files
8. Update registry index

### Operation 4: Add Field to Specific Artifacts

Filter which artifacts to update.

```
User: Add "priority: high" to all journeys in the onboarding category

Claude: I'll add priority = "high" to onboarding journeys.

Found journeys in onboarding category:
1. journey-new-user-onboarding
2. journey-account-setup
3. journey-first-purchase

Preview:
Each will have added to extensions.custom:
{
  "priority": "high"
}

Apply to these 3 journeys?
```

### Operation 5: Remove Field

Remove a field from artifacts.

```
User: Remove the deprecated "legacy_id" field from all personas

Claude: I'll remove 'legacy_id' from all personas.

Found 8 personas with legacy_id field:
1. persona-sarah-martinez (legacy_id: "OLD-001")
2. persona-marcus-thompson (legacy_id: "OLD-002")
...

This will delete the field entirely. Data will be lost.

Proceed? (Consider backing up first)
```

### Operation 6: Schema Migration

Migrate artifacts between schema versions.

```
User: Migrate all artifacts from 1.0 to 1.1

Claude: I'll migrate artifacts from schema version 1.0 to 1.1.

Scanning for 1.0 artifacts...

Found 15 artifacts on schema version 1.0:
- 5 personas
- 4 roles
- 2 pairings
- 4 journeys

**Migration changes for 1.0 → 1.1:**

Personas:
- Add schemaVersion: "1.1"
- Rename demographics.age_range → demographics.ageRange (if present)

Roles:
- Add schemaVersion: "1.1"
- Rename role_based_needs → roleBasedNeeds

[Shows preview for first artifact of each type]

Apply migrations?
```

### Operation 7: Batch Status Update

Update workflow status across artifacts.

```
User: Mark all draft personas as approved

Claude: I'll update status from "draft" to "approved" for all personas.

Found 4 personas with status = "draft":
1. persona-new-customer
2. persona-enterprise-buyer
3. persona-mobile-first-user
4. persona-accessibility-focused

Update all to status = "approved"?

Note: If workflow.require_approval is true in config, this bypasses review.
```

## Confirmation Patterns

### For Low-Risk Changes
```
Update 3 files? [Y/n]
```

### For Medium-Risk Changes
```
This will modify 12 files.

Changes preview:
[abbreviated preview]

Type "yes" to proceed, or "preview all" to see full details:
```

### For High-Risk Changes
```
⚠️ HIGH-RISK OPERATION

This will:
- Rename 1 file
- Modify 5 files with references
- Update the registry index

This cannot be automatically undone.

Recommendations:
1. Run: git add . && git commit -m "Before bulk rename"
2. Or manually backup the artifacts folder

Type "I understand" to proceed:
```

## Progress Reporting

For large batches:
```
Processing 50 personas...

[====================] 100% (50/50)

✅ 48 successful
⚠️ 2 warnings (validation passed with notes)
❌ 0 failures

Details:
- persona-legacy-user: Warning - missing optional field 'description'
- persona-old-format: Warning - very short description (< 20 chars)

All changes applied. Registry updated.
```

## Rollback Guidance

After changes:
```
Changes complete.

To undo these changes:
- If using git: git checkout -- artifacts/
- If not: restore from backup

Changed files:
- artifacts/personas/persona-sarah-martinez.json
- artifacts/pairings/pairing-sarah-working-mom.json
- artifacts/journeys/journey-clothes-shopping.json
```

## Example Session

```
User: Add department field to all personas

Claude: I'll add 'department' to all personas.

First, let me check the org config for this field...

[Reads .dsds-config.json]

'department' is defined as:
- Type: string
- Description: "Owning department"
- Currently: optional for personas

Found 12 personas:
- 4 already have department
- 8 need it added

How should I set the value for the 8 without it?

[AskUserQuestion]
1. Prompt for each
2. Use default "Unassigned"
3. Leave empty

User: Prompt for each

Claude: I'll ask for each. Let's go through them:

**persona-marcus-thompson** (Marcus Thompson - IT Support Manager)
What department?

User: IT

Claude: ✅ Set department = "IT"

**persona-first-time-buyer** (Alex Chen - First-time retail customer)
What department?

User: Retail

Claude: ✅ Set department = "Retail"

[Continues through all 8]

All done:
- 8 personas updated
- All validations passed
- Registry index updated

Would you like to make 'department' required for future personas?
(Currently optional in config)
```

## Quality Checklist

Before completing bulk operation:

- [ ] All affected artifacts identified
- [ ] Preview shown to user
- [ ] Backup/commit recommended for risky changes
- [ ] Each artifact validated after change
- [ ] Registry index updated
- [ ] Summary of changes provided
- [ ] Rollback instructions given

## Related Skills

- `artifact-registry` - Provides artifact list and relationships
- `org-config-manager` - Provides field definitions
- `schema-validator` - Validates each changed file
- `standards-enforcer` - Can check compliance after bulk changes
