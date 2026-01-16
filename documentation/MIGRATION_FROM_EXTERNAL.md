# Migrating from External Tools

**Version:** 1.1 | **Updated:** January 2026

---

## Overview

If you have existing personas, journey maps, or user research in other formats, this guide helps you migrate them to Digital Service Design Standards.

The v1.1 compositional model separates **who someone is** (Core Persona) from **what they're trying to achieve** (Role Card), creating reusable building blocks. When migrating, you'll convert your existing personas into this structure.

---

## Common Source Formats

### Mural/Miro Templates
- Sticky note-based personas
- Journey map canvases
- Research synthesis boards
- Empathy maps and affinity diagrams

### Figma/FigJam
- Visual persona cards
- Journey map components
- Design system libraries
- Research board layouts

### Documents
- Word/Google Docs persona descriptions
- PowerPoint persona slides
- Research reports and synthesis documents
- Interview transcripts

### Spreadsheets
- User research databases
- Persona attribute tables
- Journey step matrices
- Segmentation data

---

## Migration Approaches

### Option 1: AI-Assisted Conversion (Recommended)

Use Claude, ChatGPT, or similar tools to convert existing content.

**Steps:**

1. Export or copy your existing persona content
2. Provide the AI with:
   - Your existing content
   - The target schema (link to example)
   - Instructions to convert
3. Validate the output
4. Fix any validation errors

**Example prompt:**

```
Convert this persona to the Digital Service Design Standards v1.1 Core Persona format.

Here's my existing persona:
[paste your content]

Here's an example of the target format:
[paste from v1.1/examples/personas/persona-sarah-martinez.json]

Output valid JSON that follows the schema structure. Use British English spelling
(e.g., "behaviour" not "behavior", "organisation" not "organization").
```

**Tips for better AI conversion:**
- Include the full example file, not just snippets
- Ask the AI to explain any fields it couldn't map
- Request validation of required fields before outputting
- Ask for a confidence assessment of the conversion

**Validation command:**
```bash
node tools/validators/validate-v1.1.js output.json
```

### Option 2: Manual Mapping

For complex personas or when you want careful control over the conversion.

**Field Mapping Guide:**

| Your Content | Maps To (v1.1) |
|--------------|----------------|
| Name, photo, quote | `identity` section |
| Age, location, job | `demographics` section |
| Goals, motivations | `behavioural_attributes.motivations` |
| Pain points, frustrations | `behavioural_attributes.personalFrustrations` |
| Tech comfort, devices | `behavioural_attributes.technologyComfort` |
| Preferred channels | `behavioural_attributes.communicationPreferences` |
| Research sources | `validation.research_sources` |
| Role-specific goals | Separate Role Card (see below) |
| Context-specific frustrations | Role Card `roleBasedFrustrations` |

**Important:** In v1.1, role-specific information belongs in a separate Role Card, not the Core Persona. See "Splitting Personas into Core + Role" below.

### Option 3: Gradual Migration

Don't migrate everything at once. A phased approach reduces risk and lets you learn as you go.

**Phased approach:**

1. **Week 1:** Migrate your most-used persona to Core Persona format
2. **Week 2:** Create Role Card(s) for the contexts that persona operates in
3. **Week 3:** Create Pairing(s) capturing what emerges when combined
4. **Week 4:** Migrate associated journey maps, linking to persona and role
5. **Ongoing:** Migrate others as needed

---

## Splitting Personas into Core + Role

In v1.1, a traditional persona often needs splitting into multiple components:

### What Goes in Core Persona (who someone is)

Enduring behavioural attributes that persist regardless of context:

- Technology comfort level and preferred devices
- Communication preferences and style
- Personal needs (belonging, security, autonomy, recognition)
- Personal frustrations (not role-specific)
- Decision-making style
- Risk tolerance
- Learning style
- Influences

### What Goes in Role Card (what they're trying to achieve)

Context-specific goals and constraints:

- Role type (consumer, employee, business)
- Role-based needs ("make good decisions quickly")
- Role-based frustrations ("time constraints")
- Success metrics for this context
- Domain-specific requirements

### Example Split

**Before (traditional persona):**
> Sarah is a busy working mom who needs to make quick purchase decisions. She's frustrated by lack of time for research. She values convenience and uses her phone for shopping.

**After (v1.1 compositional model):**

**Core Persona (persona-sarah-martinez):**
- Technology comfort: intermediate, smartphone-first
- Communication preferences: app, social media
- Personal frustrations: feeling rushed, decision anxiety
- Decision-making style: analytical with social validation

**Role Card (role-working-mom-consumer):**
- Role type: consumer
- Role-based needs: make decisions efficiently, find trustworthy options
- Role-based frustrations: time constraints, information overload
- Success metrics: decisions made within time budget, family satisfaction

---

## Validation Checklist

After migration, verify:

- [ ] JSON is valid (no syntax errors)
- [ ] Schema validation passes (`node tools/validators/validate-v1.1.js`)
- [ ] Required fields are populated
- [ ] IDs follow conventions (`persona-*`, `role-*`, `pairing-*`)
- [ ] Research sources are documented (or confidence set to "hypothesis")
- [ ] British English spelling used throughout
- [ ] Role-specific content separated into Role Cards

**Quick validation commands:**
```bash
# Validate a Core Persona
node tools/validators/validate-v1.1.js my-persona.json

# Validate a Role Card
node tools/validators/validate-v1.1.js my-role.json

# Validate all files in a directory
node tools/validators/validate-v1.1.js ./my-project/
```

---

## Common Issues

### "My persona doesn't fit the schema"

Use `extensions.custom` for organisation-specific fields:

```json
"extensions": {
  "custom": {
    "customer_segment": "Enterprise",
    "account_tier": "Premium",
    "internal_classification": "High-value"
  }
}
```

This preserves your organisation's data without breaking schema compatibility.

### "I don't have all the required fields"

Options:

1. **Set confidence level to "hypothesis"** and fill gaps later:
   ```json
   "validation": {
     "confidence_level": "hypothesis",
     "research_sources": []
   }
   ```

2. **Mark unknown fields with placeholder values** that indicate research is needed

3. **Use the minimum viable path** - start with just identity, demographics, and basic behavioural attributes, then add depth over time

### "My journey has different lanes"

The v1.1 journey schema supports custom lanes. Add them in the lanes configuration:

```json
"lanes": {
  "custom": [
    {"id": "systems", "label": "Systems", "type": "list"},
    {"id": "compliance", "label": "Compliance", "type": "text"},
    {"id": "handoffs", "label": "Handoffs", "type": "list"}
  ]
}
```

### "My persona has multiple roles"

This is actually a strength of the v1.1 model. Create one Core Persona and multiple Role Cards:

- `persona-sarah-martinez.json` (Core Persona)
- `role-working-mom-consumer.json` (Role Card)
- `role-marketing-professional.json` (Role Card)
- `pairing-sarah-working-mom.json` (Pairing for consumer context)
- `pairing-sarah-marketing.json` (Pairing for work context)

### "I have personas from different systems that need merging"

When consolidating personas from multiple sources:

1. Identify which represents the same human (match on key demographics)
2. Use the most research-backed data for each field
3. Document all sources in `validation.research_sources`
4. Note any conflicts in `extensions.legacy.migration_notes`

---

## Migration from Specific Tools

### From Mural/Miro

1. **Export sticky notes** as text or use screenshots
2. **Group by category** (goals, frustrations, behaviours, etc.)
3. **Map to schema fields** using the field mapping guide above
4. **Add structure** - convert lists to arrays with required properties

**Tip:** Use AI to help extract and categorise sticky note content from screenshots.

### From Figma

1. **Copy text layers** from persona cards
2. **Export any structured data** from components
3. **Note visual information** (photo descriptions, layout emphasis)
4. **Convert to JSON** using mapping guide or AI assistance

### From Google Sheets/Excel

1. **Export as CSV** for easier processing
2. **Map columns to schema fields**
3. **Use AI or scripting** to convert rows to JSON objects
4. **Validate each converted persona**

**Example prompt for spreadsheet conversion:**
```
Convert this CSV row to a v1.1 Core Persona JSON:

name,age,location,goals,frustrations,tech_level
Sarah Martinez,32,Austin TX,"Save time, Quality products","Too busy, Decision overload",Intermediate

Map the columns as follows:
- name -> identity.name
- age, location -> demographics
- goals -> behavioural_attributes.motivations
- frustrations -> behavioural_attributes.personalFrustrations
- tech_level -> behavioural_attributes.technologyComfort.level
```

---

## Preserving Legacy Data

When migrating, preserve references to original sources:

```json
"extensions": {
  "legacy": {
    "migrated_from": "Figma - Persona Library v2",
    "original_id": "persona-card-sarah-2024",
    "migration_date": "2026-01-15",
    "original_format": "figma_component",
    "migration_notes": "Combined data from two overlapping persona cards"
  }
}
```

This helps with:
- Traceability to original research
- Understanding why certain data exists
- Future reconciliation if needed

---

## Getting Help

### Resources

- **Example files:** `v1.1/examples/` contains complete examples of all schema types
- **Validators:** `tools/validators/` provides automated validation
- **Schema reference:** `v1.1/schemas/` contains the JSON Schema definitions
- **Quick reference:** `documentation/getting-started/quick-reference.md`

### Validation Feedback

The validators provide specific feedback on issues:

```bash
# Get detailed validation output
node tools/validators/validate-v1.1.js my-persona.json --verbose
```

### Start Simple

If you're overwhelmed, start with the absolute minimum:

1. Create `identity` with `id` and `name`
2. Add basic `demographics`
3. Add one or two items in `behavioural_attributes.motivations`
4. Set `validation.confidence_level` to "hypothesis"

You can add depth later as you gather more research or refine the persona.

---

## Next Steps

After migrating your personas:

1. **Create Role Cards** for the contexts your personas operate in
2. **Create Pairings** capturing what emerges when persona meets role
3. **Build journeys** that reference your migrated personas
4. **Share with your team** using the standardised format
5. **Iterate based on feedback** and new research

**See also:**
- [Your First Persona](getting-started/your-first-persona.md) - Creating from scratch
- [Migration Guide](implementation/migration-guide.md) - Detailed schema transformation
- [Quick Reference](getting-started/quick-reference.md) - Field-by-field guidance
