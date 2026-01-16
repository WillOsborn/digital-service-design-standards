# DSDS Claude Skills

AI-powered skills for creating and working with Digital Service Design Standards artifacts.

## Installation

Copy the skills you want to your Claude skills directory:

```bash
# Copy all skills
cp -r skills/* ~/.claude/skills/

# Or copy individual skills
cp -r skills/persona-builder ~/.claude/skills/
```

After copying, restart Claude or refresh your project to load the new skills.

## Available Skills

### Builders (Interactive Creation)

| Skill | Trigger Phrases | Description |
|-------|-----------------|-------------|
| `persona-builder` | "build a persona", "create persona" | Step-by-step persona creation with guided questions |
| `role-builder` | "build a role", "create role card" | Step-by-step role card creation |
| `pairing-builder` | "create pairing", "pair persona with role" | Collision analysis for persona + role combinations |
| `journey-builder` | "build a journey", "map a journey" | Phase-by-phase journey mapping |

### Renderers (Visual Output)

| Skill | Trigger Phrases | Description |
|-------|-----------------|-------------|
| `journey-renderer` | "render journey", "show journey", "visualise journey" | Creates horizontal swimlane journey maps |
| `persona-renderer` | "render persona", "show persona card" | Creates visual cards for personas, roles, pairings |

### Analysis & Insights

| Skill | Trigger Phrases | Description |
|-------|-----------------|-------------|
| `journey-analyser` | "analyse journey", "find pain points" | Identifies barriers, emotional patterns, improvement priorities |
| `barrier-mapper` | "map barriers", "systemic issues" | Aggregates barriers across multiple journeys |
| `persona-comparator` | "compare personas", "side by side" | Compares personas to highlight differences |

### Validation & Quality

| Skill | Trigger Phrases | Description |
|-------|-----------------|-------------|
| `schema-validator` | "validate", "check schema" | Validates artifacts with clear error reporting |
| `completeness-checker` | "check completeness", "quality score" | Quality scoring beyond schema validation (A-F grades) |
| `quality-checker` | "run validation", "check quality" | Runs validation and quality tests |

### Migration & Utility

| Skill | Trigger Phrases | Description |
|-------|-----------------|-------------|
| `import-helper` | "import", "convert", "migrate" | Converts images, PDFs, spreadsheets to schema JSON |
| `example-creator` | "create an example", "new persona example" | Creates complete example JSON files |

## Usage Examples

```
"Build a persona for a first-time mortgage applicant"

"Render the Sarah Martinez journey as a visual map"

"Validate all JSON files in my project"

"Compare the tech-savvy persona with the tech-cautious persona"

"Import this Mural screenshot as a journey"
```

## Scale Management

For managing artifacts at organisational scale, see `tools/claude-manager/` which includes additional skills for:
- Organisation configuration
- Artifact registry and indexing
- Bulk operations
- Portfolio reporting
- Standards enforcement

## Creating Your Own Skills

Skills are markdown files with YAML frontmatter. See any skill's `SKILL.md` for the structure. Place custom skills in your `.claude/skills/` directory.

## More Information

- [DSDS Documentation](../documentation/)
- [v1.1 Schema Standards](../v1.1/)
- [Getting Started Guide](../GETTING_STARTED.md)
