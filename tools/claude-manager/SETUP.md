# Claude Manager Setup Guide

This guide walks you through setting up Claude Manager for your organisation.

## Prerequisites

- Access to Claude with DSDS skills installed
- A folder where you'll store your artifacts
- Basic familiarity with JSON files

## Step 1: Create Your Folder Structure

Copy the template folders to your project:

```
your-project/
├── artifacts/
│   ├── personas/
│   ├── roles/
│   ├── pairings/
│   └── journeys/
```

Or ask Claude: "Set up a new DSDS artifacts folder for me"

## Step 2: Create Your Configuration

Copy `templates/starter-config.json` to `.dsds-config.json` in your project root.

Edit it to match your needs:

```json
{
  "org_name": "Your Organisation Name",
  "base_schema_version": "1.1.0",
  "artifacts_path": "./artifacts",
  "custom_fields": {
    "persona": {
      "required": [],
      "optional": []
    }
  }
}
```

Or ask Claude: "Help me create a DSDS config for my organisation"

## Step 3: Define Custom Fields (Optional)

If your organisation needs specific fields on artifacts, add them to the config:

```json
{
  "custom_fields": {
    "persona": {
      "required": ["customer_segment", "department"],
      "optional": ["crm_id", "cost_centre"]
    },
    "role": {
      "required": ["department"],
      "optional": []
    },
    "journey": {
      "required": ["product_area"],
      "optional": ["squad_owner"]
    }
  }
}
```

These fields will be:
- Prompted for during artifact creation
- Checked by the standards enforcer
- Indexed by the artifact registry

## Step 4: Create Your First Artifacts

Use the builder skills to create artifacts:

- "Build a persona for [description]"
- "Create a role card for [context]"
- "Map a journey for [experience]"

The skills will automatically:
- Check for required custom fields
- Add the artifact to the registry
- Validate against schemas

## Step 5: Generate the Index

After creating artifacts, generate the index:

"Refresh the artifact registry"

This creates `.dsds-index.json` in your artifacts folder.

## Step 6: Check Coverage

See what you have and what's missing:

"Show me a portfolio report"

This shows:
- How many artifacts of each type
- Which personas don't have journeys
- Quality scores across the collection

## Configuration Reference

### Full Config Options

```json
{
  "org_name": "Organisation Name",
  "base_schema_version": "1.1.0",
  "artifacts_path": "./artifacts",

  "custom_fields": {
    "persona": {
      "required": ["field1", "field2"],
      "optional": ["field3"]
    },
    "role": {
      "required": [],
      "optional": []
    },
    "pairing": {
      "required": [],
      "optional": []
    },
    "journey": {
      "required": [],
      "optional": []
    }
  },

  "custom_field_definitions": {
    "customer_segment": {
      "type": "enum",
      "values": ["Premium", "Standard", "Basic"],
      "description": "Customer tier for segmentation"
    },
    "department": {
      "type": "string",
      "description": "Owning department"
    },
    "crm_id": {
      "type": "string",
      "pattern": "^CRM-[0-9]+$",
      "description": "Link to CRM record"
    }
  },

  "validation": {
    "strict_mode": false,
    "require_research_sources": false,
    "minimum_completeness_score": 60
  },

  "workflow": {
    "require_approval": false,
    "approval_states": ["draft", "approved"]
  },

  "categories": {
    "personas": ["consumer", "employee", "business"],
    "journeys": ["onboarding", "purchase", "support", "offboarding"]
  }
}
```

### Config Field Descriptions

| Field | Purpose |
|-------|---------|
| `org_name` | Your organisation name (for reports) |
| `base_schema_version` | Which DSDS version you're using |
| `artifacts_path` | Where artifacts are stored (relative to config) |
| `custom_fields` | Required/optional custom fields per artifact type |
| `custom_field_definitions` | Validation rules for custom fields |
| `validation` | Validation strictness settings |
| `workflow` | Approval workflow settings |
| `categories` | Folder categories (if using nested structure) |

## Workflow Examples

### Starting Fresh

1. Create config with no custom fields
2. Create a few personas and journeys
3. As patterns emerge, add custom fields to config
4. Use bulk operations to add fields to existing artifacts

### Migrating Existing Artifacts

1. Create config based on fields you already use
2. Copy artifacts to the artifacts folder
3. Run "Check all artifacts against standards"
4. Fix any issues identified
5. Generate the index

### Adding a New Custom Field

1. Add field to config (as optional first)
2. Run bulk operation to add to existing artifacts
3. Once populated everywhere, change to required
4. Standards enforcer will now require it for new artifacts

## Troubleshooting

### "Index is stale"
Run "Refresh the artifact registry" to regenerate.

### "Custom field not found"
Check the field is defined in `.dsds-config.json` under `custom_fields`.

### "Artifact doesn't meet standards"
Run "Check [artifact] against standards" to see what's missing.

### "Duplicate persona detected"
The registry found a similar persona. Review existing ones or proceed with creation.

## Next Steps

- [Create your first persona](../../.claude/skills/persona-builder/SKILL.md)
- [Understand the architecture](../../documentation/CUSTOMISATION_ARCHITECTURE.md)
- [Review barrier taxonomy](../../documentation/BARRIER_TAXONOMY.md)
