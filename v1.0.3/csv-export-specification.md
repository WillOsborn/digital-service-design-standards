# CSV Export Specification

**Version:** 1.0.2
**Purpose:** Define how Service Design Persona Standard JSON maps to CSV exports
**Last Updated:** 2025-11-25

---

## Overview

This specification documents how JSON persona data exports to CSV format. JSON remains the canonical source of truth, while CSV provides accessibility for spreadsheet tools, business intelligence platforms, and stakeholders who prefer tabular data.

### Export Architecture

```
JSON Persona Files (canonical)
    ↓
CSV Export Process
    ↓
Multiple CSV Files (consumption)
```

### Export Files

| CSV File | Purpose | Rows |
|----------|---------|------|
| `personas_overview.csv` | One row per persona with summary data | One per persona |
| `personas_goals.csv` | All goals with foreign key to persona | Multiple per persona |
| `personas_pain_points.csv` | All pain points with severity/frequency | Multiple per persona |
| `personas_barriers.csv` | All barriers with type taxonomy | Multiple per persona |

**Note:** Additional export files can be created for channels, moments_that_matter, use_cases, and success_metrics following the same pattern.

---

## File 1: personas_overview.csv

### Purpose
High-level summary of each persona on a single row. Useful for dashboards, filtering, and quick reference.

### Columns

| Column | JSON Path | Type | Description |
|--------|-----------|------|-------------|
| `persona_id` | `identity.id` | string | Unique identifier for the persona |
| `persona_name` | `identity.name` | string | Full name of the persona |
| `persona_type` | `schema_info.persona_type` | enum | business, consumer, or employee |
| `summary` | `identity.summary` | string | Brief description (truncated if >500 chars) |
| `experience_level` | `core_attributes.experience_level` | enum | beginner, intermediate, advanced, expert |
| `confidence_level` | `validation.confidence_level` | enum | high, medium, low |
| `last_updated` | `schema_info.last_updated` | date | ISO 8601 date |
| `goal_count` | `core_attributes.goals.length` | integer | Number of goals |
| `pain_point_count` | `core_attributes.pain_points.length` | integer | Number of pain points |
| `barrier_count` | `extended_attributes.barriers.length` | integer | Number of barriers |
| `primary_channel` | `extended_attributes.channels[0].name` | string | First preferred channel (if exists) |
| `type_specific_role` | Depends on type | string | role_title OR age OR role_department |

**Type-Specific Role Mapping:**
- **Business:** `business_context.role_title`
- **Consumer:** `demographics.age` (formatted as "Age 32")
- **Employee:** `work_context.role_department`

### Example Row

```csv
persona_id,persona_name,persona_type,summary,experience_level,confidence_level,last_updated,goal_count,pain_point_count,barrier_count,primary_channel,type_specific_role
david-chen-it-director-healthcare,David Chen,business,"IT Director at healthcare technology...",advanced,high,2025-11-25,4,4,6,Industry conferences and webinars,IT Director
```

---

## File 2: personas_goals.csv

### Purpose
All goals from all personas in a normalized table. Enables filtering, prioritization analysis, and goal tracking across personas.

### Columns

| Column | JSON Path | Type | Description |
|--------|-----------|------|-------------|
| `persona_id` | `identity.id` | string | Foreign key to persona |
| `persona_name` | `identity.name` | string | Name for readability |
| `persona_type` | `schema_info.persona_type` | enum | business, consumer, employee |
| `goal_text` | `core_attributes.goals[].text` | string | Description of the goal |
| `priority` | `core_attributes.goals[].priority` | enum | primary, secondary, aspirational |
| `timeframe` | `core_attributes.goals[].timeframe` | enum | immediate, short_term, long_term |
| `goal_sequence` | Array index | integer | Position in goals array (1-based) |

### Export Logic

```
FOR EACH persona:
  FOR EACH goal IN persona.core_attributes.goals:
    OUTPUT: persona_id, persona_name, persona_type, goal.text, goal.priority, goal.timeframe, index
```

### Example Rows

```csv
persona_id,persona_name,persona_type,goal_text,priority,timeframe,goal_sequence
david-chen-it-director-healthcare,David Chen,business,Implement cloud-first infrastructure strategy,primary,long_term,1
david-chen-it-director-healthcare,David Chen,business,Improve system uptime and performance,primary,short_term,2
sarah-martinez-working-mom-consumer,Sarah Martinez,consumer,Find products that save time in daily routines,primary,immediate,1
```

---

## File 3: personas_pain_points.csv

### Purpose
All pain points from all personas with severity and frequency data. Enables pain point prioritization and trend analysis.

### Columns

| Column | JSON Path | Type | Description |
|--------|-----------|------|-------------|
| `persona_id` | `identity.id` | string | Foreign key to persona |
| `persona_name` | `identity.name` | string | Name for readability |
| `persona_type` | `schema_info.persona_type` | enum | business, consumer, employee |
| `pain_point_text` | `core_attributes.pain_points[].text` | string | Description of pain point |
| `severity` | `core_attributes.pain_points[].severity` | integer | 1-5 rating (1=minor, 5=critical) |
| `frequency` | `core_attributes.pain_points[].frequency` | enum | daily, weekly, monthly, occasional, rare |
| `context` | `core_attributes.pain_points[].context` | string | When/where it occurs |
| `pain_point_sequence` | Array index | integer | Position in pain_points array (1-based) |

### Severity Scale

| Value | Meaning |
|-------|---------|
| 5 | Critical - Blocks progress, major frustration |
| 4 | High - Significant obstacle, frequent frustration |
| 3 | Medium - Notable issue, moderate frustration |
| 2 | Low - Minor annoyance, manageable |
| 1 | Minimal - Barely noticeable |

### Example Rows

```csv
persona_id,persona_name,persona_type,pain_point_text,severity,frequency,context,pain_point_sequence
david-chen-it-director-healthcare,David Chen,business,Legacy systems that are expensive to maintain,4,daily,"Particularly affecting daily operations and budget planning",1
sarah-martinez-working-mom-consumer,Sarah Martinez,consumer,Limited time for research and comparison shopping,4,daily,"Between work and family responsibilities, lacks time for thorough product research",1
```

---

## File 4: personas_barriers.csv

### Purpose
All barriers with 9-type taxonomy classification. Reveals patterns in organizational friction across personas.

### Columns

| Column | JSON Path | Type | Description |
|--------|-----------|------|-------------|
| `persona_id` | `identity.id` | string | Foreign key to persona |
| `persona_name` | `identity.name` | string | Name for readability |
| `persona_type` | `schema_info.persona_type` | enum | business, consumer, employee |
| `barrier_text` | `extended_attributes.barriers[].barrier` | string | Description of barrier |
| `barrier_type` | `extended_attributes.barriers[].type` | enum | 9-type taxonomy |
| `impact` | `extended_attributes.barriers[].impact` | string | How barrier affects persona |
| `workarounds` | `extended_attributes.barriers[].workarounds` | string | Coping strategies |
| `barrier_sequence` | Array index | integer | Position in barriers array (1-based) |

### Barrier Type Taxonomy

| Type | Definition |
|------|------------|
| `process` | Workflow and procedural friction |
| `technology` | Technical limitations or integration |
| `knowledge` | Skill gaps or expertise requirements |
| `resource` | Time, budget, or personnel constraints |
| `policy` | Regulatory or compliance requirements |
| `cultural` | Organizational resistance or habits |
| `vision` | Strategic alignment or clarity issues |
| `communications` | Information flow problems |
| `governance` | Decision-making or authority issues |

### Example Rows

```csv
persona_id,persona_name,persona_type,barrier_text,barrier_type,impact,workarounds,barrier_sequence
david-chen-it-director-healthcare,David Chen,business,Complex approval processes for new technology,process,Delays decisions by 2-3 months on average,Build business cases with clear ROI and compliance benefits,1
maria-rodriguez-senior-sales-rep,Maria Rodriguez,employee,Complex systems that require multiple logins,technology,Wastes time and creates frustration,Uses password manager and bookmarks to streamline access,1
```

---

## Export Guidelines

### Data Handling

1. **Encoding:** Use UTF-8 encoding for all CSV files
2. **Line Endings:** Use Unix-style line endings (LF)
3. **Quotes:** Quote fields containing commas, newlines, or quotes
4. **Null Values:** Use empty string for optional fields that are not present
5. **Arrays:** Create separate row for each array element (normalized structure)

### Field Truncation

Some fields may need truncation for CSV readability:

| Field | Max Length in CSV | Handling |
|-------|-------------------|----------|
| `summary` | 500 chars | Truncate with "..." |
| `goal_text` | 500 chars | Full text |
| `pain_point_text` | 500 chars | Full text |
| `barrier_text` | 500 chars | Full text |
| `context` | 200 chars | Full text |
| `impact` | 300 chars | Full text |
| `workarounds` | 300 chars | Full text |

### Handling Missing Data

| Scenario | CSV Export |
|----------|------------|
| Optional field not present | Empty string `""` |
| Array is empty | No rows in detail CSV |
| Enum field missing | Empty string `""` |
| Numeric field missing | Empty string `""` (not 0) |

---

## Tool Implementation

### Python Example

```python
import json
import csv

def export_personas_overview(personas):
    with open('personas_overview.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['persona_id', 'persona_name', 'persona_type',
                        'summary', 'experience_level', 'confidence_level',
                        'last_updated', 'goal_count', 'pain_point_count',
                        'barrier_count', 'primary_channel', 'type_specific_role'])

        for persona in personas:
            writer.writerow([
                persona['identity']['id'],
                persona['identity']['name'],
                persona['schema_info']['persona_type'],
                persona['identity'].get('summary', ''),
                persona['core_attributes'].get('experience_level', ''),
                persona['validation']['confidence_level'],
                persona['schema_info']['last_updated'],
                len(persona['core_attributes']['goals']),
                len(persona['core_attributes']['pain_points']),
                len(persona.get('extended_attributes', {}).get('barriers', [])),
                persona.get('extended_attributes', {}).get('channels', [{}])[0].get('name', ''),
                get_type_specific_role(persona)
            ])
```

### JavaScript Example

```javascript
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');

function exportPersonasGoals(personas) {
  const rows = [];

  personas.forEach(persona => {
    persona.core_attributes.goals.forEach((goal, index) => {
      rows.push({
        persona_id: persona.identity.id,
        persona_name: persona.identity.name,
        persona_type: persona.schema_info.persona_type,
        goal_text: goal.text,
        priority: goal.priority || '',
        timeframe: goal.timeframe || '',
        goal_sequence: index + 1
      });
    });
  });

  const csv = stringify(rows, { header: true });
  fs.writeFileSync('personas_goals.csv', csv, 'utf-8');
}
```

---

## Business Intelligence Integration

### Tableau / Power BI

1. Import all 4 CSV files
2. Create relationships:
   - `personas_overview.persona_id` ← `personas_goals.persona_id`
   - `personas_overview.persona_id` ← `personas_pain_points.persona_id`
   - `personas_overview.persona_id` ← `personas_barriers.persona_id`
3. Create visualizations:
   - Pain point severity heatmap by persona type
   - Barrier type distribution
   - Goal priority matrix
   - Confidence level dashboard

### Excel

1. Import CSVs to separate worksheets
2. Use VLOOKUP to join persona details
3. Create pivot tables for:
   - Barrier type frequency
   - Pain point severity distribution
   - Goal timeframe breakdown

---

## Version History

### Version 1.0.2 (2025-11-25)
- Initial CSV export specification
- Defined 4 core export files
- Documented field mappings and transformation rules
- Provided implementation examples

---

## Appendix: Additional Export Files

Organizations may create additional CSV exports following the same pattern:

- **personas_channels.csv** - Channel preferences
- **personas_moments.csv** - Moments that matter
- **personas_use_cases.csv** - Use case scenarios
- **personas_success_metrics.csv** - Success metrics
- **personas_motivations.csv** - Motivations

Each follows the same structure: persona_id (FK), persona_name, persona_type, field-specific columns, sequence number.
