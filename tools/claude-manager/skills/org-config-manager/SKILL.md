---
name: org-config-manager
description: Creates and manages organisation DSDS configuration (.dsds-config.json). Use when setting up a new org, defining custom fields, or modifying org requirements. Triggers on "setup config", "configure org", "add custom field", "org settings", "dsds config".
allowed-tools: Read, Write, Glob, AskUserQuestion
---

# Org Config Manager Skill

## Overview

This skill creates and manages the `.dsds-config.json` file that defines organisation-specific requirements for DSDS artifacts. It guides users through configuration options and ensures the config file is valid.

## When to Use

- User asks to "set up DSDS for my organisation"
- User wants to "add a custom field" requirement
- User needs to "configure" or "update settings"
- Initial setup of Claude Manager
- Changing validation or workflow settings

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
    - label: "View current config"
      description: "See what's currently configured"
```

### Step 3a: Create New Config

Guide through setup:

```
Let's set up your DSDS configuration.

1. What's your organisation name?
2. Where will you store artifacts? (default: ./artifacts)
3. Do you need any custom fields on your artifacts?
```

**Custom Field Setup:**

```
AskUserQuestion:
  question: "Do you want to require custom fields on personas?"
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

If modifying existing config:

```
Which artifact type needs custom fields?

Current custom fields:
- Personas: [list or "none"]
- Roles: [list or "none"]
- Pairings: [list or "none"]
- Journeys: [list or "none"]
```

```
AskUserQuestion:
  question: "Which artifact type should have the new field?"
  multiSelect: true
  options:
    - label: "Personas"
      description: "Add field to persona requirements"
    - label: "Roles"
      description: "Add field to role requirements"
    - label: "Pairings"
      description: "Add field to pairing requirements"
    - label: "Journeys"
      description: "Add field to journey requirements"
```

### Step 3c: Update Settings

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

Build the config JSON:

```json
{
  "$schema": "https://schemas.digitalservice.design/dsds-config/v1",
  "org_name": "[from user]",
  "base_schema_version": "1.1.0",
  "artifacts_path": "[from user]",

  "custom_fields": {
    "persona": {
      "required": ["[gathered fields]"],
      "optional": ["[gathered fields]"]
    },
    // ... other types
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

### Step 5: Save and Confirm

```
Here's your configuration:

**Organisation:** [name]
**Artifacts path:** [path]

**Custom fields:**
- Personas require: [list]
- Roles require: [list]

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
| `base_schema_version` | string | DSDS version (e.g., "1.1.0") |
| `artifacts_path` | string | Path to artifacts folder |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `custom_fields` | object | Required/optional fields per artifact type |
| `custom_field_definitions` | object | Validation rules for custom fields |
| `validation` | object | Validation settings |
| `workflow` | object | Approval workflow settings |
| `categories` | object | Folder categories for nested structure |

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

Claude: And where would you like to store your artifacts?
(Default is ./artifacts)

User: Use the default

Claude: Do you need custom fields on your artifacts? For example, linking to CRM records or tagging by department?

[Uses AskUserQuestion]

User: Yes, define now

Claude: Let's start with personas. What custom fields do you need?

User: customer_segment (required) and crm_id (optional)

Claude: For customer_segment, is it free text or a list of options?

User: Options: Retail, SME, Corporate, Wealth

Claude: Got it. And crm_id?

User: Free text but should match pattern CRM-12345

Claude: Here's the config I've built:

**Acme Financial Services**

Personas require:
- customer_segment: Retail | SME | Corporate | Wealth

Personas optional:
- crm_id: Pattern CRM-[0-9]+

[Shows full config preview]

Save this?

User: Yes

Claude: [Saves .dsds-config.json]

Configuration saved. Your artifacts folder structure is ready at ./artifacts.

When you create personas, I'll prompt for customer_segment (required) and offer crm_id (optional).

Would you like to create your first persona?
```

## Validation

Before saving, check:

- [ ] `org_name` is not empty
- [ ] `base_schema_version` is valid (e.g., "1.1.0")
- [ ] `artifacts_path` is a valid path
- [ ] Required fields don't duplicate optional fields
- [ ] Enum types have at least 2 values
- [ ] Pattern types have valid regex

## Related Skills

- `artifact-registry` - Uses config to know what to index
- `standards-enforcer` - Uses config to check compliance
- `bulk-operations` - Uses config when adding fields
