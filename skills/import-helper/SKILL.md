---
name: import-helper
description: Imports and converts external artifacts into schema-compliant JSON, and can update existing JSON when re-importing modified versions. Handles images (screenshots of personas/journeys), PDFs, spreadsheets, Mural exports, and unstructured text. Triggers on "import", "migrate", "convert", "import from", "transform to schema", "convert this image", "convert this PDF", "re-import", "update from", "sync changes", "merge with existing", "import updated version".
allowed-tools: Read, Glob, Write, Bash(node tools/validators/*:*), AskUserQuestion, Task
---

# Import Helper Skill

## Overview

This skill converts existing service design artifacts from various external formats into Digital Service Design schema-compliant JSON. It handles images, PDFs, structured data, and unstructured text.

**Update capability:** Can recognise when imported content matches an existing JSON artifact and offer to update it rather than creating a new file. Supports both "replace all" and "field-by-field review" modes.

## When to Use

### New Imports
- User has an image/screenshot of a persona poster or journey map
- User has a PDF document with persona or journey information
- User has a spreadsheet or CSV with structured data
- User has exported data from Mural, Miro, or similar tools
- User has meeting notes or research summaries to convert
- User asks to "migrate", "convert", or "import" existing artifacts

### Updates / Re-imports
- User has edited an artifact in Figma/external tool and exported it back
- User wants to sync changes from an updated PDF or image
- User asks to "re-import", "update from", or "merge with existing"
- User has a newer version of an artifact they previously imported

## Supported Input Formats

| Format | Examples | Approach |
|--------|----------|----------|
| **Images** | PNG, JPG, screenshots | Read image, extract structured info |
| **PDFs** | Persona documents, journey docs | Read PDF, extract and structure |
| **Spreadsheets** | CSV, Excel exports | Parse columns, map to fields |
| **Mural/Miro** | Exported JSON or text | Map sticky notes to fields |
| **Unstructured text** | Meeting notes, research | Extract and structure interactively |

## Process

### Step 1: Identify Input

Determine what we're working with:

```
I'll help you convert this into schema-compliant JSON.

First, let me understand what you have:
1. What type of file or content is it? (image, PDF, spreadsheet, text)
2. What kind of artifact does it contain? (persona, role, journey, pairing)
3. Can you share the file or paste the content?
```

### Step 2: Extract Information

Based on input type:

#### For Images
```
[Read the image file]

I can see this is a [persona poster / journey map / etc.].

Let me extract the key information:

**Name/Title:** [what I can see]
**Key sections I can identify:**
- [Section 1]: [content]
- [Section 2]: [content]

Is this correct? Did I miss anything important?
```

#### For PDFs
```
[Read the PDF file]

This document appears to be [type]. I found:

**Page 1:**
- [Key information]

**Page 2:**
- [Key information]

Let me structure this into the schema format.
```

#### For Spreadsheets/CSVs
```
I can see columns for:
- [Column 1]: Maps to [schema field]
- [Column 2]: Maps to [schema field]

Let me map this to the schema structure.
```

#### For Unstructured Text
```
Let me extract the key information from this text.

**Persona-related:**
- Name: [if mentioned]
- Characteristics: [what I found]

**Role-related:**
- Context: [if mentioned]
- Needs: [what I found]

What target schema should this become? (persona, role, pairing, journey)
```

### Step 3: Map to Schema

Create a mapping between source content and target schema:

```
Here's how I'll map your content to the schema:

**Source** → **Schema Field**
[Their field/content] → name
[Their field/content] → description
[Their field/content] → technologyComfort.level
...

Does this mapping look right? Should I adjust anything?
```

### Step 4: Handle Missing Information

Identify gaps between source and schema:

```
The schema expects these fields, but I couldn't find them in your source:

**Required fields missing:**
- [field]: [what it needs]

**Optional fields not found:**
- [field]: [what it would contain]

How should we handle these?
```

```
AskUserQuestion:
  question: "How should we handle missing required fields?"
  options:
    - label: "I'll provide the missing info"
      description: "Tell me what to put in each field"
    - label: "Use sensible defaults"
      description: "Fill with placeholder values marked for review"
    - label: "Skip optional, prompt for required"
      description: "Leave optional blank, ask me about required fields"
```

### Step 5: Transform and Validate

Build the JSON and validate:

```json
{
  "id": "[generated-id]",
  "schemaVersion": "1.1",
  "name": "[from source]",
  // ... transformed fields
  "_migration_notes": {
    "source": "[original format]",
    "date": "[today]",
    "fields_inferred": ["list of fields that were interpreted"],
    "fields_defaulted": ["list of fields with placeholder values"],
    "review_needed": ["any fields needing human review"]
  }
}
```

```bash
node tools/validators/validate-v1.1.js [output-file].json
```

### Step 6: Review and Refine

Present the result:

```
Here's the converted [artifact type]:

**[Name]**

[Summary of key fields]

**Migration notes:**
- Source: [original format]
- Inferred: [fields I interpreted]
- Needs review: [any uncertain mappings]

Would you like to:
1. Save as-is
2. Adjust specific fields
3. See the full JSON
```

## Input-Specific Guidance

### Images (Persona Posters)

Common sections on persona posters:
- Photo/avatar → Not in schema (decorative)
- Name → `name`
- Bio/description → `description`
- Demographics → Often not needed (v1.1 focuses on behaviour)
- Goals → Check if personal (persona) or role-based (role card)
- Pain points/Frustrations → `personalFrustrations` (persona) or `roleBasedFrustrations` (role)
- Tech savvy → `technologyComfort`
- Preferred channels → `communicationPreferences.preferredChannels`
- Quote → Can inform `description`

### Images (Journey Maps)

Common elements:
- Title/header → `journey.title`
- Phases/stages → `phases[]`
- Steps/touchpoints → `phases[].steps[]`
- Emotional curve → `lane_content.emotions`
- Thoughts/feelings → `lane_content.thoughts`
- Actions → `lane_content.actions`
- Channels → `lane_content.channels`
- Pain points → `lane_content.barriers`
- Opportunities → `lane_content.opportunities`

### PDFs

Look for:
- Section headings → map to schema sections
- Bullet points → often map to array fields
- Tables → often contain structured data
- Quotes → user voice, can inform thoughts
- Highlighted text → often pain points or key needs

### Spreadsheets

Common column patterns:
```
Persona spreadsheet:
Name, Description, Tech Level, Channels, Needs, Frustrations, Decision Style

Journey spreadsheet:
Phase, Step, Action, Thought, Emotion, Channel, Barrier, Opportunity
```

### Mural/Miro Exports

Typical structures:
- Sticky notes grouped by area → extract text, group by category
- Journey lanes → map lanes to schema lanes
- Colour coding → often indicates categories (emotions, barriers)
- Connected items → may indicate relationships

---

## Update Workflow (Re-importing Modified Artifacts)

When a user re-imports an artifact that may already exist, follow this workflow.

### Step U1: Detect Potential Match

After extracting content from the imported file, search for existing JSON artifacts:

```
I've extracted content from this [image/PDF]. Let me check if this matches an existing artifact...

[Search existing files by:]
1. ID match: Look for `identity.id` or `id` that matches
2. Name/title match: Compare extracted name to existing artifacts
3. Content similarity: Compare key fields (needs, frustrations, phases)
```

```bash
# Search for potential matches
find v1.1/examples -name "*.json" -exec grep -l "[extracted-name]" {} \;
```

### Step U2: Present Match Options

If potential matches found:

```
I found a potential match:

**Existing artifact:** persona-sarah-martinez.json
**Last updated:** 2024-01-15

**Comparison:**
| Field | Existing | Imported |
|-------|----------|----------|
| Name | Sarah Martinez | Sarah Martinez ✓ |
| Summary | "Busy professional..." | "Time-pressed professional..." ⚠️ |
| Tech Level | intermediate | advanced ⚠️ |
| Needs | 3 items | 4 items ⚠️ |

⚠️ = Different from existing
```

```
AskUserQuestion:
  question: "How would you like to handle this?"
  options:
    - label: "Update existing artifact"
      description: "Merge changes into persona-sarah-martinez.json"
    - label: "Review field-by-field"
      description: "I'll show each change for you to approve/reject"
    - label: "Create new artifact"
      description: "Keep existing unchanged, create new file"
    - label: "Cancel"
      description: "Don't import, keep existing as-is"
```

### Step U3a: Full Update (Replace)

If user chooses "Update existing artifact":

```
Updating persona-sarah-martinez.json with imported changes...

**Changes applied:**
- Summary: Updated to reflect new description
- technologyComfort.level: Changed from 'intermediate' to 'advanced'
- personalNeeds: Added 1 new need, updated 2 existing
- last_updated: Set to today's date

**Preserved:**
- identity.id: Unchanged (persona-sarah-martinez)
- validation.research_sources: Merged with existing

Would you like to review the updated file?
```

### Step U3b: Field-by-Field Review

If user chooses "Review field-by-field":

```
Let's review each change. I'll present them one at a time.

---
**Change 1 of 5: Summary**

Current:
> "Busy professional who values efficiency and quality"

Imported:
> "Time-pressed working mom who prioritises convenience"
```

```
AskUserQuestion:
  question: "Accept this change to Summary?"
  options:
    - label: "Accept imported"
      description: "Use the new version"
    - label: "Keep existing"
      description: "Don't change this field"
    - label: "Merge/edit"
      description: "I'll help you combine both versions"
```

Repeat for each changed field, then:

```
**Review complete!**

Changes accepted: 3
Changes rejected: 1
Merged manually: 1

Saving updated artifact...
```

### Step U4: Validate and Save

```bash
node tools/validators/validate-v1.1.js [updated-file].json
```

```
✅ Updated artifact is valid.

**Update summary:**
- File: persona-sarah-martinez.json
- Source: [imported file name]
- Changes: 4 fields updated
- Validation: Passed

The `_migration_notes` section has been updated to track this re-import:

{
  "_migration_notes": {
    "original_source": "persona-poster.png",
    "original_date": "2024-01-15",
    "updates": [
      {
        "source": "updated-persona.pdf",
        "date": "2024-03-20",
        "fields_changed": ["summary", "technologyComfort", "personalNeeds"]
      }
    ]
  }
}
```

### Matching Strategies

#### By ID (Most Reliable)
If the imported content contains an ID field:
- Look for exact match: `persona-sarah-martinez`
- Look for similar: `sarah-martinez`, `sarah_martinez`

#### By Name/Title
If no ID, match by name:
```javascript
// Fuzzy match names
const existingNames = getAllArtifactNames();
const importedName = extractedData.name;
const matches = existingNames.filter(n =>
  n.toLowerCase().includes(importedName.toLowerCase()) ||
  importedName.toLowerCase().includes(n.toLowerCase())
);
```

#### By Content Similarity
If name unclear, compare key fields:
- Personas: Compare needs, frustrations, tech comfort
- Journeys: Compare phases, step names, channels
- Roles: Compare role type, needs, frustrations

### Handling Conflicts

When fields have diverged significantly:

```
**Conflict detected in personalNeeds:**

The existing and imported versions are quite different:

Existing (3 items):
1. Quick solutions for time-pressed situations
2. Quality assurance before purchasing
3. Family-friendly options

Imported (4 items):
1. Efficient shopping experience
2. Reliable product quality
3. Good value for money
4. Easy returns process

These look like they might represent different research findings.
```

```
AskUserQuestion:
  question: "How should I handle this conflict?"
  options:
    - label: "Replace with imported"
      description: "Use the 4 imported needs"
    - label: "Keep existing"
      description: "Keep the 3 current needs"
    - label: "Merge both"
      description: "Combine into 7 needs (may need deduplication)"
    - label: "Help me reconcile"
      description: "I'll suggest which to keep based on overlap"
```

### Update Example Session

```
User: [Shares updated-sarah-persona.pdf]
I updated this persona in Figma and exported it. Can you sync the changes?

Claude: [Reads the PDF]

I can see this is an updated version of the Sarah Martinez persona. Let me compare it to the existing file...

[Reads persona-sarah-martinez.json]

I found the existing artifact. Here's what changed:

**Unchanged:**
- Name: Sarah Martinez
- ID: persona-sarah-martinez
- Demographics: Same

**Changed:**
| Field | Existing | Imported |
|-------|----------|----------|
| Summary | "Busy professional..." | "Efficiency-focused professional..." |
| technologyComfort.level | intermediate | advanced |
| personalNeeds | 3 items | 4 items (+1 new) |
| personalFrustrations[0].severity | 3 | 4 |

How would you like to handle these changes?

User: Let's review them one by one

Claude: Perfect. Let's go through each change.

**Change 1/4: Summary**
[Shows comparison and asks for approval]

User: Accept the new one

Claude: ✓ Summary will be updated.

**Change 2/4: Technology Comfort Level**
[Shows comparison]

User: Keep the existing - I think intermediate is still right

Claude: ✓ Technology comfort will stay as 'intermediate'.

[Continues through remaining changes]

All changes reviewed. Saving updated artifact...

✅ persona-sarah-martinez.json has been updated.

Changes applied: 3
Changes skipped: 1
Validation: Passed

Would you like me to render the updated persona card?
```

---

## Example Sessions

### Converting an Image

```
User: [Shares persona poster image]

Claude: [Reads the image]

I can see this is a persona poster for "Emma Chen". Let me extract what I see:

**Visible sections:**
- Name: Emma Chen
- Photo: Young professional (decorative, won't include)
- Quote: "I don't have time for complicated processes"
- Goals:
  - Get things done quickly
  - Feel confident in choices
- Frustrations:
  - Too many options
  - Unclear pricing
- Tech comfort: Shows "4/5 tech savvy"
- Channels: Mobile first, email ok, no phone calls

This looks like it mixes persona and role information. The goals seem role-specific (situational), while tech comfort is persona-level (persistent).

Should I create:
1. Just a persona (behavioural traits only)
2. A persona + role (separate the layers)
3. Let me see more context first

User: Let's do persona + role

Claude: [Creates both, validates, presents]
```

### Converting a Journey from PDF

```
User: Convert this journey PDF to the schema
[Shares customer-journey-report.pdf]

Claude: [Reads the PDF]

This is a 5-page journey document. I found:

**Page 1: Overview**
- Journey: "New Customer Onboarding"
- Persona mentioned: "First-time user"
- Phases: Awareness, Sign-up, First Use, Regular Use

**Page 2-4: Phase details**
[Extracts steps, quotes, pain points per phase]

**Page 5: Recommendations**
[Opportunities listed]

I'll need to create a persona reference. Did "First-time user" exist as a persona file, or should I create a basic one?

User: Create a basic one

Claude: [Creates persona, then journey, validates both]
```

### Converting Spreadsheet Data

```
User: I have this CSV with journey data
[Shares or pastes CSV]

Claude: I can see these columns:
- Stage → maps to `phases[].name`
- Touchpoint → maps to `steps[].name`
- Action → maps to `lane_content.actions`
- Feeling → maps to `lane_content.emotions`
- Channel → maps to `lane_content.channels`
- Issue → maps to `lane_content.barriers`

A few things I need:
1. "Feeling" has text like "happy", "frustrated" - I'll map to emotion scale
2. "Issue" doesn't have barrier types - I'll infer from context
3. No persona reference - should I create one or use generic?

User: Use generic for now, we'll add persona later

Claude: [Builds journey JSON, adds migration notes, validates]
```

## Field Mapping Reference

### Persona Fields

| Common Source Labels | Schema Field |
|---------------------|--------------|
| Name, Who | `name` |
| Bio, About, Background | `description` |
| Tech level, Digital comfort | `technologyComfort.level` |
| Comfortable with, Uses | `technologyComfort.confidenceAreas` |
| Struggles with, Avoids | `technologyComfort.avoidanceAreas` |
| Prefers, Channels | `communicationPreferences.preferredChannels` |
| Contact frequency | `communicationPreferences.frequencyPreference` |
| Best time, When | `communicationPreferences.bestTimes` |
| Needs, Wants | `personalNeeds` |
| Pain points, Frustrations | `personalFrustrations` |
| Decision style, How decides | `decisionMakingStyle.approach` |
| Risk attitude | `decisionMakingStyle.riskTolerance` |

### Journey Fields

| Common Source Labels | Schema Field |
|---------------------|--------------|
| Phase, Stage, Step group | `phases[].name` |
| Step, Touchpoint, Action | `steps[].name` |
| What they do, Actions | `lane_content.actions` |
| Thinking, Thoughts | `lane_content.thoughts` |
| Feeling, Emotion, Mood | `lane_content.emotions` |
| Where, Channel, Touchpoint | `lane_content.channels` |
| Pain point, Issue, Problem | `lane_content.barriers` |
| Opportunity, Improvement | `lane_content.opportunities` |

## Quality Checklist

### For New Imports

- [ ] All required fields are populated
- [ ] `_migration_notes` captures source and any inferences
- [ ] Fields needing review are flagged
- [ ] Barrier types are from the 9-type taxonomy
- [ ] Emotion intensities are on -2 to +2 scale
- [ ] Channel entries have type and serviceModel
- [ ] References (personaRef, roleRefs) are valid
- [ ] Validates against schema

### For Updates / Re-imports

- [ ] Searched for existing artifacts before creating new
- [ ] Presented clear comparison of existing vs imported
- [ ] User chose update mode (full replace or field-by-field)
- [ ] `identity.id` preserved from existing artifact
- [ ] `schema_info.last_updated` set to today's date
- [ ] `_migration_notes.updates[]` array updated with change history
- [ ] Changes clearly summarised after completion
- [ ] Validates against schema after update

## Handling Ambiguity

When content could map to multiple fields:

```
This content could be:
A) [Interpretation 1] → would go in [field A]
B) [Interpretation 2] → would go in [field B]

Which interpretation is correct?
```

When content doesn't fit the schema:

```
This information doesn't have a direct schema field:
"[content]"

Options:
1. Add to `extensions.custom` (preserved but not standard)
2. Incorporate into description/context
3. Omit (not needed for this schema version)
```

## Files to Reference

- `v1.1/schemas/core-persona.schema.json` - Persona schema
- `v1.1/schemas/role-card.schema.json` - Role schema
- `v1.1/schemas/pairing.schema.json` - Pairing schema
- `v1.1/schemas/journey-schema.json` - Journey schema
- `documentation/BARRIER_TAXONOMY.md` - Barrier type reference
- `documentation/CHANNEL_TAXONOMY.md` - Channel type reference

## Related Skills

- `persona-builder` - Interactive creation (vs conversion)
- `role-builder` - Interactive role creation
- `journey-builder` - Interactive journey creation
- `persona-renderer` - Visualise converted artifacts
- `journey-renderer` - Visualise converted journeys
