# Changelog

All notable changes to Digital Service Design Schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.3] - 2025-12-03

### Changed - Channel Taxonomy Redesign (BREAKING CHANGE)

#### Multi-Attribute Channel Model
- **Replaced hierarchical 3-category/7-type system with multi-attribute model:**
  - **Removed fields:** `category` (digital/physical/direct), `type`, `custom_type`
  - **New fields:** `channel` (13 types), `medium` (digital/non_digital), `serviceModel` (self_service/managed/both), `custom_channel`
  - **New standard types:** website, app, chatbot, live_chat, email, social_media, phone, video_call, in_person, post, kiosk, sms, other

#### Key Benefits
- **Orthogonal attributes:** Medium and service model can be filtered independently
- **Better semantics:** Email correctly classified as digital (was under "direct" category)
- **Flexibility:** Phone can be "both" self-service (IVR) and managed (agent)
- **Extensibility:** Easier to add new channel types without forcing into categories

#### Schema Breaking Changes
- **Required fields changed:** All channels now require `channel`, `medium`, `serviceModel` (previously `name`, `category`, `type`)
- **Optional fields changed:** `name` becomes optional, `custom_type` → `custom_channel`
- All persona schemas (business, consumer, employee) and journey schema updated
- Validators updated to remove hardcoded validation (now relies on JSON Schema only)

#### Migration Required
- Previous v1.0.2 channel data will need migration to new structure
- See v1.0.3 documentation for migration guide

---

## [1.0.2] - 2025-11-28

### Changed - Channel Taxonomy Redesign

#### Major Channel System Update
- **Replaced 5-type taxonomy with 3-category/7-type system:**
  - **3 Categories:** digital, physical, direct (for high-level analysis)
  - **7 Standard Types:** website, app, social_media, email, phone, in_person, post
  - **Extension mechanism:** "other" type with `custom_type` field for organization-specific channels
- All persona schemas (business, consumer, employee) updated with new channel structure
- Journey schema updated with same channel taxonomy for persona-journey alignment
- **Required fields changed:** All channels now require `name`, `category`, and `type`
- **Type-to-category alignment:** Schemas enforce validation that channel types align with their categories

#### Schema Breaking Changes
- **Removed channel types:** digital, physical, human, hybrid, self_service
- **Added category field:** New required field for all channels
- **Added custom_type field:** Optional field for custom channel extensions
- Previous channel data will need migration (see migration guide in CHANNEL_TAXONOMY.md)

### Changed - Documentation Structure

#### Terminology Updates
- **SERVICE-DESIGN-PERSONA-STANDARD.md:**
  - Section 2: "Core Attributes (Required)" → "Shared Attributes - Required Fields"
  - Section 4: "Extended Attributes (Recommended)" → "Shared Attributes - Recommended Fields"
  - Section 6: "Persona Types" → "Type-Specific Attributes"
  - Clarified that identity (name, summary) are part of shared attributes
  - All 9 attributes now explicitly described as "shared" across all persona types
- **SCHEMA_ARCHITECTURE.md:**
  - Updated version from 1.0.0 to 1.0.2
  - "Enhancement Philosophy" → "Design Philosophy"
  - Architecture diagram updated to show self-contained schemas (not inheritance-based)
  - Removed all "Enhanced Digital Service Design Schemas" references
  - Updated to "Digital Service Design Schemas" throughout
- **CANONICAL_REFERENCES.md:**
  - Updated version from 1.0.0 to 1.0.2
  - Completely replaced channel types section with new 3-category/7-type taxonomy
  - Fixed barrier example field names to match actual schemas
  - Fixed income range formatting to use underscores
- **BARRIER_TAXONOMY.md:**
  - Updated version from 1.0.0 to 1.0.2
  - Removed "Enhanced" terminology
  - Fixed barrier field examples: `description` → `barrier`, `workaround` → `workarounds`
  - Updated persona and journey usage examples with correct field names
- **SERVICE-DESIGN-JOURNEY-STANDARD.md:**
  - Section 6 completely rewritten for new channel taxonomy
  - Removed outdated Section 6.2 migration guide (10-type to 5-type)
  - Added new examples showing 3-category/7-type usage
  - Added persona-journey integration clarification

### Added - New Documentation

#### CHANNEL_TAXONOMY.md Complete Rewrite
- New comprehensive channel taxonomy guide (v1.0.2, 2025-11-28)
- Documents 3-category system (digital, physical, direct)
- Documents 7 standard types plus "other" extension
- Includes migration guides from both 10-type and 5-type systems
- Extensive examples for B2B, B2C, and employee contexts
- Persona vs Journey channel usage clarification
- Type-to-category alignment rules and validation
- Common custom type examples (SMS, chatbot, TV, kiosk, etc.)

### Fixed - Schema Field Alignment

#### Barrier Field Names
- Documentation now correctly uses schema field names:
  - `barrier` (not "description")
  - `type` (correct)
  - `impact` (not "business_impact" or "severity")
  - `workarounds` (not "workaround")
- All barrier examples updated across documentation

#### Preference Level Values
- Confirmed schemas use: `preferred`, `acceptable`, `avoided`
- Updated documentation to match (was inconsistently showing "primary", "secondary", "occasional")

#### Income Range Format
- Documentation now shows correct format: `under_25k`, `25k_50k`, etc.
- Removed spaces and hyphens, using underscores consistently

### Technical Details

#### Breaking Changes
- Channel structure changed from single-level to two-level taxonomy
- `type` field enum completely replaced
- New required `category` field
- Organizations using v1.0.1 channels will need to migrate

#### Migration Required
- All existing persona and journey data with channels needs updating
- See CHANNEL_TAXONOMY.md "Migration from Previous Versions" section
- Migration table provided for both 10-type and 5-type systems

#### Backward Compatibility
- Non-channel fields remain fully compatible
- Barrier, goals, pain_points, motivations, etc. unchanged
- Only channel-related data requires migration

---

## [1.0.1] - 2025-10-11

### Changed - Terminology & Positioning

#### Project Positioning
- Removed "Enhanced" qualifiers throughout all documentation
- Project now simply "Digital Service Design Schemas" - positioned as THE professional standard
- Updated all references from "enhanced personas" to "comprehensive personas" or just "personas" when context is clear
- Clarified that these schemas ARE the professional standard, not an "enhanced version" of something else

#### Validator Updates
- Validator now displays "Professional Quality Level" instead of "Enhancement Level"
- Internal function names remain unchanged (e.g., `calculateEnhancementScore`) for code stability
- User-facing messages updated to reflect professional standard positioning
- Quality scoring display now shows accurate maximum score (110 points total)

#### Documentation Harmonization
- Getting Started documentation: Removed "enhanced" terminology, uses "comprehensive" when emphasizing depth
- Implementation guides: Updated positioning to "professional standard" language
- FAQ & Troubleshooting: Consistent terminology throughout
- Created official [Terminology Guide](documentation/TERMINOLOGY.md) for community consistency

### Changed - Schema Updates

#### Version Numbers
- All schema `$id` URIs updated from `v1.0.0` to `v1.0.1`
- Schema version constants updated to `"1.0.1"` across all schemas:
  - `persona-base.json`: schema_info.version const
  - `business-persona.json`, `consumer-persona.json`, `employee-persona.json`: References updated
  - `journey-schema.json`: spec_version const
  - `pattern-schema.json`: $id updated

#### Schema Documentation Improvements
- Added clarifying description comment to `channels` field in `persona-base.json`:
  - Documents the 10-type taxonomy structure (5 core + 5 extended types)
  - References channel taxonomy documentation for detailed definitions
- Updated `journey-schema.json` description to use "comprehensive persona data" terminology

### Fixed - Example Quality Improvements

#### Channel Type Specificity
All example personas now use more specific channel types instead of generic classifications:

**David Chen (Business Persona):**
- `media` → `in_person_events` for "Industry conferences and webinars"
- `direct` → `personal_interaction` for "Direct sales meetings"
- Other channels remain appropriately classified

**Sarah Martinez (Consumer Persona):**
- `digital` → `mobile_app` for "Mobile shopping app"  
- `social` → `social_recommendations` for "Instagram" (peer recommendations context)
- `digital` → `direct` for "Email newsletters" (maintained correct type)

**Maria Rodriguez (Employee Persona):**
- `digital` → `mobile_app` for "CRM system and mobile app"
- `direct` → `personal_interaction` for "Team meetings and video calls"
- `digital` → `self_service_digital` for internal platforms

#### Version Updates in Examples
- All example personas updated from version "1.0.0" to "1.0.1"
- `last_updated` dates updated to "2025-10-11" to reflect migration

### Fixed - Validator Scoring

#### Maximum Score Correction
- Fixed validator maximum score calculation from 100 to 110 points
- Percentages now calculate correctly: (score / 110) * 100
- Display output shows accurate denominator: "Score: X/110" instead of "Score: X/100"
- Prevents impossible scores over 100% while maintaining existing scoring logic

#### Scoring Breakdown (Total: 110 points)
- Base required fields: 40 points
- Enhanced goals bonus: 5 points
- Quantified pain points bonus: 5 points
- Enhanced attributes base: 38 points
- Enhanced attribute bonuses: 17 points
- Validation quality bonus: 5 points

### Documentation

#### New Files
- **[TERMINOLOGY.md](documentation/TERMINOLOGY.md)** - Official terminology guide for consistent, professional communication
  - Defines approved and deprecated terminology
  - Provides context-specific language guidelines
  - Includes quick reference card for common situations

#### Updated Files
- **getting-started/README.md** - Main entry point, comprehensive positioning update
- **getting-started/faq-troubleshooting.md** - Changed one instance of "enhanced persona" to "comprehensive persona"
- **implementation/migration-guide.md** - Already using correct terminology
- **implementation/implementation-guide.md** - Already using correct terminology

### Technical

#### No Breaking Changes
- **Fully backward compatible** with v1.0.0 data
- Schema structure unchanged - only version identifiers updated
- Validation rules unchanged - same quality scoring system
- All v1.0.0 personas will validate correctly against v1.0.1 schemas

#### Migration Path
- **Optional but recommended:** Update existing personas to v1.0.1
- **Simple changes:** 
  1. Update `schema_info.version` from "1.0.0" to "1.0.1"
  2. Consider using more specific channel types for better semantic clarity
  3. No other changes required

---

## [1.0.0] - 2024-09-21

### Added - Initial Release

#### Core Schema Architecture
- **Base Persona Schema** (`persona-base.json`) with comprehensive 9-field system
- **Persona Type Extensions:**
  - Business Persona Schema for B2B contexts
  - Consumer Persona Schema for B2C contexts
  - Employee Persona Schema for internal experiences
- **Journey Schema** with integrated persona-journey linking architecture
- **Pattern Schema** for reusable journey patterns with persona adaptations

#### Revolutionary Features

##### 9-Field Comprehensive System
1. **goals** - Strategic objectives with priorities, timeframes, and success criteria
2. **pain_points** - Friction with severity ratings and business impact
3. **motivations** - Behavioral drivers categorized by psychological type
4. **experience_level** - Skill progression context for interface design
5. **channels** - 10-type taxonomy with usage context and preferences
6. **moments_that_matter** - Critical emotional touchpoints with triggers
7. **barriers** - 9-type organizational friction taxonomy (THE key innovation)
8. **use_cases** - Common interaction scenarios for feature prioritization
9. **success_metrics** - Quantified performance indicators for impact tracking

##### Systematic Taxonomies
- **Barrier Taxonomy** (9 types): process, technology, knowledge, resource, policy, cultural, vision, communications, governance
- **Channel Taxonomy** (10 types): 5 core (digital, physical, social, media, direct) + 5 extended (in_person_events, self_service_digital, personal_interaction, mobile_app, social_recommendations)
- **Emotional Scale** (-2 to +2): Standardized emotional intensity measurement

#### Example Personas
- **David Chen** - IT Director, Healthcare Technology (Business persona)
- **Sarah Martinez** - Working Mom, Austin TX (Consumer persona)
- **Maria Rodriguez** - Senior Sales Rep (Employee persona)

All examples demonstrate comprehensive quality level (90-95% enhancement scoring).

#### Validation Tools
- **validate-persona.js** - Comprehensive persona validation with quality scoring
- **validate-journey.js** - Journey schema validation with persona integration checks
- **run-all-tests.js** - Complete test suite for all schemas and examples

Quality Level Scoring:
- 80-100%: Comprehensive (professional-grade)
- 60-79%: Professional (good coverage)
- 40-59%: Basic (meets minimum)
- <40%: Incomplete

#### Documentation System

##### Getting Started (Service Designer Focus)
- **README.md** - Introduction and business value
- **your-first-persona.md** - Step-by-step guided creation (30-60 minutes)
- **quick-reference.md** - Templates and field-by-field guidance
- **faq-troubleshooting.md** - Common questions and solutions

##### Implementation (Advanced Users)
- **migration-guide.md** - Converting existing personas
- **examples-and-patterns.md** - Real-world usage patterns
- **implementation-guide.md** - Advanced features and organizational adoption
- **quality-checklist.md** - Production readiness standards

##### Reference Documentation
- **BARRIER_TAXONOMY.md** - Complete 9-type barrier system reference
- **CHANNEL_TAXONOMY.md** - Complete 10-type channel system reference  
- **SCHEMA_ARCHITECTURE.md** - Technical architecture documentation
- **VALIDATORS.md** - Validation tool usage and API reference

#### Journey Integration
- Persona-journey linking via `persona_id` references
- Barrier-to-friction mapping at journey step level
- Channel preferences drive touchpoint selection
- Emotional states connect to journey emotional arcs
- Success metrics enable journey outcome measurement

#### Pattern System
- Reusable journey patterns that adapt to persona attributes
- Barrier-driven pattern variations
- Channel substitution based on preferences
- Experience level complexity adjustments

### Design Philosophy
- **Evidence-based:** All personas backed by research with confidence levels
- **Systematic:** Taxonomies enable consistent analysis and comparison
- **Actionable:** Comprehensive attributes drive specific design decisions
- **Integrated:** Seamless connection between personas and journeys
- **Professional:** Industry-standard format for tool compatibility and collaboration

### Community
- Open source with community contribution guidelines
- Real-world examples across industries
- Professional validation framework
- Growing ecosystem of tools and integrations

---

## Version History Summary

| Version | Date | Type | Key Changes |
|---------|------|------|-------------|
| 1.0.2 | 2025-11-28 | Minor | Channel taxonomy redesign (3-category/7-type), documentation alignment, terminology updates |
| 1.0.1 | 2025-10-11 | Patch | Terminology cleanup, validator fix, channel specificity |
| 1.0.0 | 2024-09-21 | Major | Initial comprehensive schema release |

---

## Upgrade Guide

### Migrating from 1.0.1 to 1.0.2

**Required Changes:** Channel structure must be updated (breaking change)

**Channel Migration Steps:**
1. Update all channel objects to include `category` field
2. Map old `type` values to new `type` + `category` combination
3. Use migration table in CHANNEL_TAXONOMY.md for type mapping

**Example Migration:**
```json
// Old (v1.0.1)
{
  "name": "Company website",
  "type": "digital",
  "usage_context": "Product research"
}

// New (v1.0.2)
{
  "name": "Company website",
  "category": "digital",
  "type": "website",
  "usage_context": "Product research"
}
```

**Benefits of Upgrading:**
- More precise channel categorization for analysis
- Extensibility through custom_type mechanism
- Better persona-journey channel alignment
- Clearer channel taxonomy with 3-category/7-type system

### Migrating from 1.0.0 to 1.0.1

**Required Changes:** None (fully backward compatible)

**Recommended Changes:**
1. Update `schema_info.version` to "1.0.1"
2. Review channel types for specificity opportunities
3. No other changes needed

**Benefits of Upgrading:**
- Clearer professional standard positioning
- More accurate validator scoring display
- Improved example quality through specific channel types
- Access to official terminology guide for team consistency

---

## Future Roadmap

### Planned for 1.1.0 (Q1 2026)
- Additional persona type extensions (partner, stakeholder)
- Advanced analytics framework
- Cross-persona pattern analysis tools
- Enhanced journey integration features

### Planned for 2.0.0 (Q3 2026)
- AI-assisted persona development
- Real-time persona updates from analytics
- Predictive behavioral modeling
- Industry-specific schema extensions

---

**For detailed migration guides and implementation support, see:**
- [Migration Guide](documentation/implementation/migration-guide.md)
- [Terminology Guide](documentation/TERMINOLOGY.md)
- [Implementation Guide](documentation/implementation/implementation-guide.md)

**Community Support:**
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Implementation questions and best practices
- Documentation: Comprehensive guides and examples
