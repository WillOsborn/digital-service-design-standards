---
name: org-config-manager
description: Creates and manages organisation DSDS configuration (.dsds-config.json). Use when setting up a new org, defining custom fields, or modifying org requirements. Triggers on "setup config", "configure org", "add custom field", "org settings", "dsds config".
allowed-tools: Read, Write, Glob, AskUserQuestion
---

# Org Config Manager Skill

## Overview

This skill creates and manages the `.dsds-config.json` file that defines organisation-specific requirements for DSDS artifacts. Supports both **v1.1** (Persona/Role/Pairing/Journey) and **v2.0** (Actor/Mission/Experience) schemas.

## When to Use

- User asks to "set up DSDS for my organisation"
- User wants to "add a custom field" requirement
- User needs to "configure" or "update settings"
- Initial setup of Claude Manager
- Changing validation or workflow settings
- Migrating config from v1.1 to v2.0

## Key Files

- `.dsds-config.json` - Organisation configuration (created/edited by this skill)
- `tools/claude-manager/templates/starter-config.json` - Minimal template
- `tools/claude-manager/templates/default-config.json` - Full example

## Process

### Step 1: Check for Existing Config

```bash
# Look for existing config
ls -la .dsds-config.json
```

If exists, read and show current state. If not, offer to create.

### Step 2: Determine Scope

```
AskUserQuestion:
  question: "What would you like to do with the org config?"
  options:
    - label: "Create new config"
      description: "Set up configuration from scratch"
    - label: "Add custom fields"
      description: "Add required or optional fields to artifact types"
    - label: "Update settings"
      description: "Change validation, workflow, or other settings"
    - label: "Update to v2.0"
      description: "Add v2.0 schema support (Actor/Mission/Experience) alongside v1.1"
    - label: "View current config"
      description: "See what's currently configured"
```

### Step 3a: Create New Config

Guide through setup:

```
Let's set up your DSDS configuration.

1. What's your organisation name?
2. Which schema version(s) will you use?
   - v2.0 only (Actor/Mission/Experience — recommended for new orgs)
   - v1.1 only (Persona/Role/Pairing/Journey — legacy)
   - Both (migration period)
3. Where will you store artifacts? (default: ./artifacts)
4. Do you need any custom fields on your artifacts?
```

**Schema version selection:**

```
AskUserQuestion:
  question: "Which DSDS schema version will you use?"
  options:
    - label: "v2.0 (Actor/Mission/Experience)"
      description: "Recommended for new projects — richer provenance, behavioural traits, mission graphs"
    - label: "v1.1 (Persona/Role/Pairing/Journey)"
      description: "Existing format — choose if you have existing v1.1 artifacts"
    - label: "Both (migration period)"
      description: "Support both during migration — recommended when converting existing orgs"
```

**Custom Field Setup:**

```
AskUserQuestion:
  question: "Do you want to require custom fields on your artifacts?"
  options:
    - label: "Yes, define now"
      description: "I'll ask what fields you need"
    - label: "No, keep it simple"
      description: "Use standard schema only"
    - label: "Optional fields only"
      description: "Add fields but don't require them"
```

For each custom field:
```
AskUserQuestion:
  question: "What type of field is '[field_name]'?"
  options:
    - label: "Free text"
      description: "Any string value"
    - label: "Enum (pick from list)"
      description: "Limited set of valid values"
    - label: "Date"
      description: "Date value"
    - label: "Pattern"
      description: "Text matching a pattern (e.g., ID format)"
```

### Step 3b: Add Custom Fields

If modifying existing config — ask which artifact version the field applies to:

```
AskUserQuestion:
  question: "Which artifact type should have the new field?"
  multiSelect: true
  options:
    - label: "Actors (v2.0)"
      description: "Add field to Actor requirements"
    - label: "Missions (v2.0)"
      description: "Add field to Mission requirements"
    - label: "Experiences (v2.0)"
      description: "Add field to Experience requirements"
    - label: "Personas (v1.1)"
      description: "Add field to persona requirements"
    - label: "Roles (v1.1)"
      description: "Add field to role requirements"
    - label: "Pairings (v1.1)"
      description: "Add field to pairing requirements"
    - label: "Journeys (v1.1)"
      description: "Add field to journey requirements"
```

### Step 3c: Update to v2.0

Add v2.0 schema support to an existing v1.1 config:

1. Show current config
2. Add `schema_versions: ["1.1", "2.0"]`
3. Add `v2.0_paths` for actors/missions/experiences directories
4. Add v2.0 artifact types to `custom_fields`
5. Keep all existing v1.1 settings

### Step 3d: Update Settings

Show current settings and offer changes:

```
Current settings:

**Validation:**
- Strict mode: [on/off]
- Require research sources: [on/off]
- Minimum completeness score: [number]

**Workflow:**
- Require approval: [on/off]
- Approval states: [list]

Which would you like to change?
```

### Step 4: Generate Config File

Build the config JSON. For v2.0 or mixed orgs:

```json
{
  "$schema": "https://schemas.digitalservice.design/dsds-config/v1",
  "org_name": "[from user]",
  "schema_versions": ["2.0"],
  "base_schema_version": "2.0.0",
  "artifacts_path": "[from user]",

  "v2.0_paths": {
    "actors": "actors/",
    "missions": "missions/",
    "experiences": "experiences/"
  },

  "custom_fields": {
    "actor": {
      "required": [],
      "optional": []
    },
    "mission": {
      "required": [],
      "optional": []
    },
    "experience": {
      "required": [],
      "optional": []
    }
  },

  "custom_field_definitions": {
    "[field_name]": {
      "type": "[type]",
      "values": ["[if enum]"],
      "description": "[from user]"
    }
  },

  "validation": {
    "strict_mode": false,
    "require_research_sources": false,
    "minimum_completeness_score": 0
  },

  "workflow": {
    "require_approval": false,
    "approval_states": ["draft", "approved"]
  }
}
```

For mixed (v1.1 + v2.0) orgs, include both:

```json
{
  "schema_versions": ["1.1", "2.0"],
  "base_schema_version": "2.0.0",

  "v1.1_paths": {
    "personas": "personas/",
    "roles": "roles/",
    "pairings": "pairings/",
    "journeys": "journeys/"
  },

  "v2.0_paths": {
    "actors": "actors/",
    "missions": "missions/",
    "experiences": "experiences/"
  },

  "custom_fields": {
    "actor": { "required": [], "optional": [] },
    "mission": { "required": [], "optional": [] },
    "experience": { "required": [], "optional": [] },
    "persona": { "required": [], "optional": [] },
    "role": { "required": [], "optional": [] },
    "pairing": { "required": [], "optional": [] },
    "journey": { "required": [], "optional": [] }
  }
}
```

### Step 5: Save and Confirm

```
Here's your configuration:

**Organisation:** [name]
**Schema version:** v2.0 (Actor/Mission/Experience)
**Artifacts path:** [path]

**Custom fields:**
- Actors require: [list]
- Missions require: [list]
- Experiences require: [list]

**Settings:**
- Strict mode: Off
- Approval required: No

Save this configuration?
```

Write to `.dsds-config.json`.

### Step 6: Next Steps

```
Configuration saved to .dsds-config.json

Next steps:
1. Create the artifacts folder structure (if not exists)
2. Start creating artifacts with the builder skills
3. Custom fields will be prompted during creation

For v2.0 artifacts:
- Use /actor-builder to create Actors
- Use /mission-builder to create Missions
- Use /experience-generator to create Experiences
- Validate with: node tools/validators/validate-v2.0.js [path]

Would you like me to:
- Create the artifacts folder structure?
- Create your first artifact?
- Check existing artifacts against this config?
```

## Config Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `org_name` | string | Organisation name |
| `base_schema_version` | string | DSDS version ("1.1.0" or "2.0.0") |
| `artifacts_path` | string | Path to artifacts folder |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_versions` | array | Supported versions, e.g. `["1.1", "2.0"]` |
| `v2.0_paths` | object | Paths for actors/missions/experiences |
| `v1.1_paths` | object | Paths for personas/roles/pairings/journeys |
| `custom_fields` | object | Required/optional fields per artifact type |
| `custom_field_definitions` | object | Validation rules for custom fields |
| `validation` | object | Validation settings |
| `workflow` | object | Approval workflow settings |
| `categories` | object | Folder categories for nested structure |

### Artifact Types by Version

| Version | Artifact Types |
|---------|---------------|
| v2.0 | `actor`, `mission`, `experience` |
| v1.1 | `persona`, `role`, `pairing`, `journey` |

### Custom Field Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Free text | Department name |
| `enum` | Pick from list | Customer segment |
| `date` | Date value | Last validated date |
| `pattern` | Regex match | CRM ID format |
| `number` | Numeric value | Priority score |
| `boolean` | True/false | Is active |

## Example Session

```
User: Set up DSDS for my organisation

Claude: I'll help you create a DSDS configuration. Let me check if one already exists.

[Checks for .dsds-config.json - not found]

No config found. Let's create one.

What's your organisation name?

User: Acme Financial Services

Claude: Which schema version will you use?
- v2.0 (Actor/Mission/Experience) — recommended
- v1.1 (Persona/Role/Pairing/Journey) — legacy
- Both (migration period)

User: v2.0

Claude: And where would you like to store your artifacts?
(Default is ./artifacts)

User: Use the default

Claude: Do you need custom fields on your actors, missions, or experiences?

User: Yes — actors need customer_segment (required) and crm_id (optional)

Claude: For customer_segment, is it free text or a list of options?

User: Options: Retail, SME, Corporate, Wealth

[Builds config and shows preview]

Save this configuration?

User: Yes

Claude: Configuration saved to .dsds-config.json

You're set up for v2.0 (Actor/Mission/Experience). Your artifact directories:
- ./artifacts/actors/
- ./artifacts/missions/
- ./artifacts/experiences/

When you create actors, I'll prompt for customer_segment (required) and offer crm_id (optional).

Would you like to create your first Actor?
```

## Validation

Before saving, check:

- [ ] `org_name` is not empty
- [ ] `base_schema_version` is valid ("1.1.0" or "2.0.0")
- [ ] `artifacts_path` is a valid path
- [ ] v2.0 artifact types used if `base_schema_version` is "2.0.0"
- [ ] Required fields don't duplicate optional fields
- [ ] Enum types have at least 2 values
- [ ] Pattern types have valid regex

## Related Skills

- `artifact-registry` - Uses config to know what to index
- `standards-enforcer` - Uses config to check compliance
- `bulk-operations` - Uses config when adding fields
