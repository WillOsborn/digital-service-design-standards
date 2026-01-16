# Claude Manager

**Version:** 1.0.0

Manage Digital Service Design artifacts at scale using Claude skills.

## What Is This?

Claude Manager is a set of tools and skills for organisations managing multiple personas, roles, pairings, and journeys. It provides:

- **Configuration** - Define org-specific requirements and custom fields
- **Registry** - Index, search, and track relationships between artifacts
- **Bulk Operations** - Update multiple artifacts consistently
- **Reporting** - Coverage analysis, quality scores, barrier mapping
- **Standards Enforcement** - Ensure artifacts meet org requirements

## Quick Start

1. Copy the `templates/artifacts-folder/` structure to your project
2. Copy `templates/starter-config.json` to `.dsds-config.json` in your project root
3. Start creating artifacts using the builder skills
4. Use registry skills to track and manage your collection

See [SETUP.md](SETUP.md) for detailed instructions.

## When to Use Claude Manager

| Situation | Recommended Approach |
|-----------|---------------------|
| Just exploring | Use builder skills directly, no config needed |
| Small team, few artifacts (<20) | Optional config, skip registry |
| Growing collection (20-100) | Use config + registry |
| Large org, governance required | Full suite including standards enforcer |

## Components

### Configuration
- `.dsds-config.json` - Org-specific settings and custom field requirements
- `org-schemas/` - Optional strict JSON Schemas for validation

### Registry
- `.dsds-index.json` - Generated index of all artifacts (lives in artifacts folder)
- Tracks relationships, completeness scores, custom field values

### Skills

| Skill | Purpose |
|-------|---------|
| `org-config-manager` | Create and manage org configuration |
| `artifact-registry` | Index, search, find duplicates, track relationships |
| `bulk-operations` | Update multiple artifacts consistently |
| `portfolio-reporter` | Coverage reports, quality summaries, barrier analysis |
| `standards-enforcer` | Check artifacts against org requirements |

## Folder Structure

```
your-project/
├── .dsds-config.json              # Org configuration
│
├── artifacts/                     # Your artifacts
│   ├── .dsds-index.json           # Generated index (gitignore this)
│   ├── personas/
│   ├── roles/
│   ├── pairings/
│   └── journeys/
│
├── org-schemas/                   # Optional: strict validation schemas
│
└── reports/                       # Generated reports
```

## How It Works

### Index Generation

The artifact registry scans your artifacts folder and generates `.dsds-index.json`:

```json
{
  "_meta": {
    "generated": "2026-01-15T14:30:00Z",
    "artifact_count": 47
  },
  "artifacts": {
    "personas": [...],
    "roles": [...],
    "pairings": [...],
    "journeys": [...]
  },
  "relationships": {
    "persona_to_journeys": {...}
  },
  "coverage": {
    "personas_without_journeys": [...]
  }
}
```

### Configuration

`.dsds-config.json` defines your org requirements:

```json
{
  "org_name": "Your Organisation",
  "base_schema_version": "1.1.0",
  "custom_fields": {
    "persona": {
      "required": ["customer_segment"],
      "optional": ["internal_id"]
    }
  }
}
```

### Workflow

1. **Setup**: Create config, copy folder structure
2. **Create**: Use builder skills (persona-builder, etc.)
3. **Register**: Registry skill indexes new artifacts
4. **Check**: Standards enforcer validates against config
5. **Report**: Portfolio reporter shows coverage and quality

## Integration with Existing Skills

Claude Manager skills work alongside the existing DSDS skills:

| Existing Skill | Enhanced By |
|----------------|-------------|
| persona-builder | Registry checks for duplicates first |
| schema-validator | Standards enforcer adds org-specific checks |
| completeness-checker | Portfolio reporter aggregates scores |
| barrier-mapper | Registry provides artifact relationships |

## Requirements

- Claude with access to these skills
- Artifacts stored as JSON files in a folder structure
- No external dependencies (pure JSON, no database)

## Limitations

- Index must be regenerated after changes outside Claude
- No real-time sync (scan-based)
- Approval workflow is simple (draft/approved status only)

## Related Documentation

- [SETUP.md](SETUP.md) - Detailed setup instructions
- [CUSTOMISATION_ARCHITECTURE.md](../../documentation/CUSTOMISATION_ARCHITECTURE.md) - Architecture overview
- [GETTING_STARTED.md](../../GETTING_STARTED.md) - DSDS introduction
