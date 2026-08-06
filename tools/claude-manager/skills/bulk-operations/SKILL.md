---
name: bulk-operations
description: Performs operations across multiple DSDS artifacts - adding fields, updating values, renaming references, migrating schemas. Use when making consistent changes across the collection. Triggers on "add field to all", "update all personas", "rename", "migrate", "bulk update", "change everywhere", "convert to v2.0", "migrate to v2.0", "batch validate".
allowed-tools: Read, Write, Glob, Grep, Edit, Bash(node tools/validators/*:*, node tools/converters/*:*), AskUserQuestion
---

# Bulk Operations Skill

## Overview

This skill performs consistent changes across multiple DSDS artifacts. Handles adding custom fields, updating values, renaming references, migrating between schema versions, and batch validation. Supports both **v2.0** (Actor/Mission/Experience) and **v1.1** (Persona/Role/Pairing/Journey).

## When to Use

- User wants to "add a field to all actors/personas"
- User needs to "rename" an artifact reference across files
- User wants to "update" a value consistently
- Schema migration — v1.1 to v2.0
- Batch validation of a collection
- Applying new org requirements to existing artifacts

## Safety Principles

1. **Preview before apply** - Always show what will change
2. **Backup recommendation** - Suggest git commit or backup first
3. **Incremental updates** - Process one artifact at a time, validate each
4. **Rollback guidance** - Explain how to undo if needed

## Operations

### Operation 1: Batch Validate

Validate all v2.0 artifacts using `validate-v2.0.js`, or all v1.1 artifacts using `validate-v1.1.js`.

```
User: Validate all our v2.0 artifacts

Claude: Running batch validation on v2.0 artifacts.

node tools/validators/validate-v2.0.js [artifacts_path] --check-refs

Results:

✅ actor-sarah-martinez (92/100)
✅ mission-retail-purchase (88/100)
✅ experience-sarah-retail (85/100)
⚠️ actor-new-customer (64/100) — missing researchSources, sparse traits
❌ experience-draft (validation failed) — invalid actorRef (target not found)

Summary: 3 passed, 1 warning, 1 failed

Would you like to:
1. See full details for the warning/failure?
2. Fix issues interactively?
3. Export report?
```

**CLI commands by version:**

```bash
# Validate v2.0 artifacts
node tools/validators/validate-v2.0.js [path/] --check-refs

# Validate single v2.0 file
node tools/validators/validate-v2.0.js [file.json] --schema-dir v2.0/schemas/

# Validate v1.1 artifacts
node tools/validators/validate-v1.1.js [path/]
```

### Operation 2: Migrate v1.1 → v2.0

Convert v1.1 Persona/Role/Pairing/Journey artifacts to v2.0 Actor/Mission/Experience.

```
User: Migrate all our personas to v2.0 actors

Claude: I'll convert v1.1 personas to v2.0 actors using the converter tool.

First, let me assess what we have:

Found 12 personas:
- persona-sarah-martinez — has 1 journey (can also create Experience stub)
- persona-marcus-thompson — no journey
- persona-first-time-buyer — no journey
... (9 more)

Migration notes:
- The converter maps Persona → Actor fields automatically
- Needs/frustrations/behaviours → traits/contexts
- Goals → retained in context
- Demographics → context entries
- Research sources → provenance

Would you like to:
1. Convert all personas to actors (batch)
2. Convert selected personas only
3. Convert persona + its journey together (creates Actor + Experience)

⚠️ This creates NEW files — it does not overwrite originals.
Recommend: commit current state to git first.

How should new files be named?
Default: actor-[persona-name].json
```

**Single artifact conversion:**
```bash
node tools/converters/convert-v1.1-to-v2.0.js \
  personas/persona-sarah-martinez.json \
  --output actors/actor-sarah-martinez.json
```

**Batch conversion:**
```bash
node tools/converters/convert-v1.1-to-v2.0.js \
  personas/ \
  --output actors/ \
  --batch
```

Show preview of first conversion before applying batch:
```
Preview: persona-sarah-martinez → actor-sarah-martinez

Key mappings:
- identity.name → identity.name ✓
- core_attributes.goals → contexts[].description ✓
- core_attributes.frustrations → traits[type=frustration] ✓
- demographics → contexts[type=situational] ✓
- provenance.researchSources → provenance.researchSources ✓

Fields needing manual review:
- traits.behavioural: Converter will create stubs — review after conversion
- provenance.generationMethod: Will be set to "ai_assisted" — update if human_created

Apply to all 12 personas?
```

After batch:
```
Migration complete:

✅ 12 personas converted to actors
New files in: actors/

Next steps:
1. Review auto-generated traits — convertor creates stubs
2. Validate: node tools/validators/validate-v2.0.js actors/
3. Create Missions for your service journeys
4. Generate Experiences to walk actors through missions
5. Keep original v1.1 personas until fully migrated
```

### Operation 3: Add Custom Field

Add a new field to all artifacts of a type. Works for both v2.0 and v1.1 types.

```
User: Add customer_segment to all actors

Claude: I'll add 'customer_segment' to all actors.

First, let me check what we're working with:
- Found 4 actors
- 2 already have customer_segment
- 2 need it added

How should I handle the value?

[AskUserQuestion]
Options:
1. Prompt me for each actor's value
2. Use a default value for all (I'll specify)
3. Leave empty (null) for manual completion later
```

### Operation 4: Update Field Value

Change a field value across multiple artifacts. Same pattern for v2.0 and v1.1.

### Operation 5: Rename Reference

Rename an artifact ID and update all references.

For v2.0, this updates `actorRef` and `missionRef` in Experience files, as well as the source artifact's `id`.

```
User: Rename actor-sarah-martinez to actor-sarah-m

Claude: I'll rename 'actor-sarah-martinez' to 'actor-sarah-m'.

This will update:

Source file:
- actors/actor-sarah-martinez.json
  - id: "actor-sarah-martinez" → "actor-sarah-m"
  - filename: actor-sarah-martinez.json → actor-sarah-m.json

References to update (v2.0):
- experiences/experience-sarah-retail.json
  - actorRef: "actor-sarah-martinez" → "actor-sarah-m"

Total changes: 2 files

⚠️ Significant change. Recommend committing first.

Proceed?
```

### Operation 6: Add Field to Specific Artifacts

Filter which artifacts to update — same as before, extended to v2.0 types.

### Operation 7: Remove Field

Remove a field from artifacts — same pattern, works across v2.0 and v1.1.

### Operation 8: Schema Migration (v1.1 → v2.0 in place)

For orgs that want to upgrade existing artifacts:

```
User: Migrate all artifacts from 1.1 to 2.0

Claude: I'll migrate artifacts from schema version v1.1 to v2.0.

Note: v1.1 and v2.0 use different artifact types:
- Persona → Actor (structural remapping)
- Journey → Experience (structural remapping)
- Role, Pairing → no direct equivalent in v2.0

I recommend:
1. Convert Personas → Actors
2. Convert Journeys → Experiences (if you have matching missions)
3. Create Missions for your services (no v1.1 equivalent)
4. Review and discard Roles/Pairings or archive them

Shall I start with Personas → Actors?

Using: node tools/converters/convert-v1.1-to-v2.0.js
```

### Operation 9: Batch Status Update

Update workflow status across artifacts — works for any artifact type.

## Confirmation Patterns

Same as before — Low/Medium/High risk tiers with appropriate prompts.

## Progress Reporting

```
Processing 4 actors...

✅ actor-sarah-martinez: customer_segment = "Premium"
✅ actor-david-chen: customer_segment = "Standard"
⚠️ actor-jake-holloway: Warning - field added but actor has no researchSources
✅ actor-maria-rodriguez: customer_segment = "Enterprise"

4 actors updated. All validations passed (1 warning).
Registry index updated.
```

## Rollback Guidance

After changes:
```
Changes complete.

To undo:
- git checkout -- actors/  (v2.0 artifacts)
- git checkout -- personas/  (v1.1 artifacts)
- Or restore from backup

Changed files:
- actors/actor-sarah-martinez.json
- experiences/experience-sarah-retail.json
```

## Example Session: Batch Migration

```
User: Convert all our personas to v2.0 actors

Claude: I'll convert your v1.1 personas to v2.0 actors.

Found 12 personas. Let me show a preview first.

[Runs converter on first file]

Preview: persona-sarah-martinez

Persona (v1.1):
- Name: Sarah Martinez
- Goals: 3
- Frustrations: 4

→ Actor (v2.0):
- identity.name: "Sarah Martinez"
- traits: 7 (3 behavioural stubs from goals, 4 emotional from frustrations)
- contexts: 2 (from demographics + core_attributes)
- provenance.generationMethod: "ai_assisted" (review)

Looks good. Apply to all 12?

User: Yes

Claude: Converting...

✅ persona-sarah-martinez → actor-sarah-martinez
✅ persona-marcus-thompson → actor-marcus-thompson
... (10 more)

12 personas converted. New files in: actors/

Next: validate them
node tools/validators/validate-v2.0.js actors/ --check-refs

Run validation now?
```

## Quality Checklist

Before completing bulk operation:

- [ ] All affected artifacts identified (v2.0 and v1.1 correctly separated)
- [ ] Preview shown to user
- [ ] Backup/commit recommended for risky changes
- [ ] Correct validator used: `validate-v2.0.js` for v2.0, `validate-v1.1.js` for v1.1
- [ ] Correct converter used: `convert-v1.1-to-v2.0.js` for migrations
- [ ] Each artifact validated after change
- [ ] Registry index updated
- [ ] Summary of changes provided
- [ ] Rollback instructions given

## Related Skills

- `artifact-registry` - Provides artifact list and relationships
- `org-config-manager` - Provides field definitions
- `schema-validator` - Validates each changed file
- `standards-enforcer` - Can check compliance after bulk changes
