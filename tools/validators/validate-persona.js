// Persona validator with dynamic schema loading and quality scoring
// Usage: node validate-persona.js path/to/persona.json [--schema path/to/schema.json]

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Default schema location (relative to this file: validators -> tools -> schemas root -> v1.0.2)
const DEFAULT_SCHEMA_DIR = path.join(__dirname, '../../v1.0.2');

/**
 * Load a JSON schema file and resolve $ref references
 * @param {string} schemaPath - Path to the schema file
 * @returns {Object} - Loaded schema with resolved references
 */
function loadSchema(schemaPath) {
    try {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        return schema;
    } catch (error) {
        throw new Error(`Failed to load schema from ${schemaPath}: ${error.message}`);
    }
}

/**
 * Find schema file based on persona type
 * @param {string} personaType - Type of persona (business, consumer, employee)
 * @param {string} schemaDir - Directory containing schema files
 * @returns {string} - Path to the schema file
 */
function findSchemaForPersonaType(personaType, schemaDir) {
    const schemaPath = path.join(schemaDir, 'schemas', `${personaType}-persona.json`);
    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
    }
    return schemaPath;
}

/**
 * Set up AJV validator with schema
 * @param {string} schemaPath - Path to the schema file
 * @returns {Object} - AJV validator instance
 */
function setupValidator(schemaPath) {
    const ajv = new Ajv({
        allErrors: true,
        verbose: true,
        strict: false,
        validateSchema: false  // Don't validate meta-schemas
    });
    addFormats(ajv);

    // v1.0.2: Schemas are self-contained, no base schema needed
    const schema = loadSchema(schemaPath);
    const validate = ajv.compile(schema);
    return { ajv, validate };
}

/**
 * Calculate quality level score based on field completeness and quality
 * @param {Object} data - Persona data
 * @returns {Object} - Quality score details
 */
function calculateEnhancementScore(data) {
    let score = 0;
    const maxScore = 110; // Updated to match actual maximum achievable score
    const details = [];
    
    // Required fields (40 points total)
    if (data.schema_info) score += 5;
    if (data.identity && data.identity.name && data.identity.id) score += 5;
    if (data.core_attributes) {
        if (data.core_attributes.goals && data.core_attributes.goals.length > 0) {
            score += 10;
            // Bonus for comprehensive goals
            const hasEnhancedGoals = data.core_attributes.goals.some(g => 
                g.priority && g.timeframe
            );
            if (hasEnhancedGoals) {
                score += 5;
                details.push("✅ Goals include priority and timeframe");
            }
        }
        if (data.core_attributes.pain_points && data.core_attributes.pain_points.length > 0) {
            score += 10;
            // Bonus for quantified pain points
            const hasQuantifiedPain = data.core_attributes.pain_points.some(p =>
                p.severity && p.frequency
            );
            if (hasQuantifiedPain) {
                score += 5;
                details.push("✅ Pain points include severity and frequency");
            }
        }
        if (data.core_attributes.motivations && data.core_attributes.motivations.length > 0) score += 5;
    }
    if (data.validation && data.validation.research_sources && data.validation.research_sources.length > 0) score += 5;
    
    // Enhanced fields (60 points total)
    // Experience level in core_attributes (5 points)
    if (data.core_attributes && data.core_attributes.experience_level) {
        score += 5;
        details.push("✅ Experience level documented");
    }

    // Extended attributes (55 points)
    if (data.extended_attributes) {
        // Channels (10 points)
        if (data.extended_attributes.channels && data.extended_attributes.channels.length > 0) {
            score += 5;
            const hasRichChannels = data.extended_attributes.channels.some(c =>
                c.type && c.usage_context
            );
            if (hasRichChannels) {
                score += 5;
                details.push("✅ Channels include type and usage context");
            }
        }

        // Moments that matter (10 points)
        if (data.extended_attributes.moments_that_matter && data.extended_attributes.moments_that_matter.length > 0) {
            score += 5;
            const hasRichMoments = data.extended_attributes.moments_that_matter.some(m =>
                m.emotional_intensity !== undefined && m.importance
            );
            if (hasRichMoments) {
                score += 5;
                details.push("✅ Moments include emotional intensity and importance");
            }
        }

        // Barriers (15 points - most valuable enhancement)
        if (data.extended_attributes.barriers && data.extended_attributes.barriers.length > 0) {
            score += 8;
            const hasTypedBarriers = data.extended_attributes.barriers.some(b => b.type);
            if (hasTypedBarriers) {
                score += 4;
                details.push("✅ Barriers include systematic type classification");
            }
            const hasImpactBarriers = data.extended_attributes.barriers.some(b => b.impact);
            if (hasImpactBarriers) {
                score += 3;
                details.push("✅ Barriers include impact assessment");
            }
        }

        // Use cases (5 points)
        if (data.extended_attributes.use_cases && data.extended_attributes.use_cases.length > 0) {
            score += 5;
            details.push("✅ Use cases documented");
        }

        // Success metrics (10 points)
        if (data.extended_attributes.success_metrics && data.extended_attributes.success_metrics.length > 0) {
            score += 10;
            details.push("✅ Success metrics defined");
        }
    }
    
    // Validation quality bonus (5 points)
    if (data.validation) {
        const hasHighConfidence = data.validation.confidence_level === 'high';
        const hasMultipleSources = data.validation.research_sources && data.validation.research_sources.length >= 2;
        const hasDetailedSources = data.validation.research_sources && data.validation.research_sources.some(s => s.date && s.confidence);
        
        if (hasHighConfidence && hasMultipleSources && hasDetailedSources) {
            score += 5;
            details.push("✅ High-quality validation with multiple sources");
        }
    }
    
    // Determine level
    let level, description;
    if (score >= 80) {
        level = "Comprehensive";
        description = "Professional-grade persona with comprehensive attributes";
    } else if (score >= 60) {
        level = "Professional";
        description = "Good persona with most attributes present";
    } else if (score >= 40) {
        level = "Basic";
        description = "Meets minimum requirements but lacks depth";
    } else {
        level = "Incomplete";
        description = "Missing required fields or critical attributes";
    }
    
    return {
        score,
        percentage: Math.round((score / maxScore) * 100),
        level,
        description,
        details
    };
}

function validatePersona(filePath, options = {}) {
    console.log(`🔍 Validating: ${filePath}`);

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const errors = [];
        const warnings = [];

        // Determine schema to use
        let schemaPath = options.schemaPath;
        if (!schemaPath && data.schema_info && data.schema_info.persona_type) {
            const schemaDir = options.schemaDir || DEFAULT_SCHEMA_DIR;
            try {
                schemaPath = findSchemaForPersonaType(data.schema_info.persona_type, schemaDir);
                console.log(`📋 Using schema: ${path.relative(process.cwd(), schemaPath)}`);
            } catch (error) {
                warnings.push(`Could not find schema for persona type: ${data.schema_info.persona_type}`);
                console.log(`⚠️  ${error.message}`);
            }
        }

        // Validate against JSON schema if available
        if (schemaPath) {
            try {
                const { validate } = setupValidator(schemaPath);
                const valid = validate(data);

                if (!valid && validate.errors) {
                    validate.errors.forEach(error => {
                        const errorPath = error.instancePath || error.dataPath || 'root';
                        const message = `${errorPath}: ${error.message}`;
                        errors.push(message);
                    });
                }
            } catch (error) {
                warnings.push(`Schema validation error: ${error.message}`);
                console.log(`⚠️  Schema validation failed: ${error.message}`);
            }
        }
        
        // Required sections check
        if (!data.schema_info) errors.push("Missing schema_info section");
        if (!data.identity) errors.push("Missing identity section");
        if (!data.core_attributes) errors.push("Missing core_attributes section");
        if (!data.validation) errors.push("Missing validation section");
        
        // Schema info validation (basic checks - schema validation handles detailed checks)
        if (data.schema_info) {
            if (!data.schema_info.version) warnings.push("Missing schema_info.version");
            if (!data.schema_info.standard) warnings.push("Missing schema_info.standard (required in v1.0.2)");
            if (!data.schema_info.persona_type) errors.push("Missing schema_info.persona_type");
            if (!data.schema_info.last_updated) warnings.push("Missing schema_info.last_updated");
            if (data.schema_info.standard && data.schema_info.standard !== "Service Design Persona Standard v1.0") {
                warnings.push(`schema_info.standard should be "Service Design Persona Standard v1.0"`);
            }
        }
        
        // Identity validation
        if (data.identity) {
            if (!data.identity.name) errors.push("Missing identity.name");
            if (!data.identity.id) errors.push("Missing identity.id");
            if (data.identity.id && !/^[a-z0-9_-]+$/.test(data.identity.id)) {
                errors.push("Identity ID must be lowercase letters, numbers, underscores, and hyphens only");
            }
            if (data.identity.summary && data.identity.summary.length > 500) {
                warnings.push("Identity summary is quite long - consider shortening for readability");
            }
        }
        
        // Core attributes validation
        if (data.core_attributes) {
            // Goals validation
            if (!data.core_attributes.goals || data.core_attributes.goals.length === 0) {
                errors.push("At least one goal is required");
            } else {
                data.core_attributes.goals.forEach((goal, index) => {
                    if (!goal.text) errors.push(`Goal ${index + 1}: text is required`);
                    if (goal.priority && !["primary", "secondary", "aspirational"].includes(goal.priority)) {
                        errors.push(`Goal ${index + 1}: priority must be primary, secondary, or aspirational`);
                    }
                    if (goal.timeframe && !["immediate", "short_term", "long_term"].includes(goal.timeframe)) {
                        errors.push(`Goal ${index + 1}: timeframe must be immediate, short_term, or long_term`);
                    }
                    if (!goal.priority || !goal.timeframe) {
                        warnings.push(`Goal ${index + 1}: Consider adding priority and timeframe for deeper insights`);
                    }
                });
            }
            
            // Pain points validation
            if (!data.core_attributes.pain_points || data.core_attributes.pain_points.length === 0) {
                errors.push("At least one pain point is required");
            } else {
                data.core_attributes.pain_points.forEach((pain, index) => {
                    if (!pain.text) errors.push(`Pain point ${index + 1}: text is required`);
                    if (pain.severity && (pain.severity < 1 || pain.severity > 5)) {
                        errors.push(`Pain point ${index + 1}: severity must be 1-5`);
                    }
                    if (pain.frequency && !["daily", "weekly", "monthly", "occasional", "rare"].includes(pain.frequency)) {
                        errors.push(`Pain point ${index + 1}: frequency must be daily, weekly, monthly, occasional, or rare`);
                    }
                    if (!pain.severity || !pain.frequency) {
                        warnings.push(`Pain point ${index + 1}: Consider adding severity and frequency for quantified analysis`);
                    }
                });
            }
            
            // Motivations validation
            if (!data.core_attributes.motivations || data.core_attributes.motivations.length === 0) {
                errors.push("At least one motivation is required");
            } else {
                data.core_attributes.motivations.forEach((motivation, index) => {
                    if (!motivation.text) errors.push(`Motivation ${index + 1}: text is required`);
                    if (motivation.type && !["intrinsic", "extrinsic", "social", "achievement"].includes(motivation.type)) {
                        errors.push(`Motivation ${index + 1}: type must be intrinsic, extrinsic, social, or achievement`);
                    }
                    if (!motivation.type) {
                        warnings.push(`Motivation ${index + 1}: Consider adding type classification for behavioral analysis`);
                    }
                });
            }
            
            
            // Experience level validation
            if (data.core_attributes.experience_level) {
                if (!["beginner", "intermediate", "advanced", "expert"].includes(data.core_attributes.experience_level)) {
                    errors.push("Experience level must be beginner, intermediate, advanced, or expert");
                }
            } else {
                warnings.push("No experience level specified - skill context helps tailor interface complexity");
            }
        }

        // Extended attributes validation (v1.0.2)
        if (data.extended_attributes) {
            // Note: Channel field validation is handled by JSON Schema (AJV)
            // This section only provides additional business logic validation
            if (data.extended_attributes.channels) {
                data.extended_attributes.channels.forEach((channel, index) => {
                    // Validate custom_channel when channel is "other"
                    if (channel.channel === "other" && !channel.custom_channel) {
                        errors.push(`Channel ${index + 1}: custom_channel is required when channel is "other"`);
                    }
                });
            } else {
                warnings.push("No channels specified - understanding touchpoint preferences is valuable for journey design");
            }

            // Moments that matter validation
            if (data.extended_attributes.moments_that_matter) {
                data.extended_attributes.moments_that_matter.forEach((moment, index) => {
                    if (!moment.moment) errors.push(`Moment ${index + 1}: moment description is required`);
                    if (moment.emotional_intensity !== undefined && (moment.emotional_intensity < -2 || moment.emotional_intensity > 2)) {
                        errors.push(`Moment ${index + 1}: emotional_intensity must be between -2 and 2`);
                    }
                    if (moment.importance && !["critical", "high", "medium", "low"].includes(moment.importance)) {
                        errors.push(`Moment ${index + 1}: importance must be critical, high, medium, or low`);
                    }
                });
            } else {
                warnings.push("No moments that matter specified - critical touchpoints drive design priorities");
            }

            // Barriers validation
            if (data.extended_attributes.barriers) {
                const validBarrierTypes = ["process", "technology", "knowledge", "resource", "policy", "cultural", "vision", "communications", "governance"];
                data.extended_attributes.barriers.forEach((barrier, index) => {
                    if (!barrier.barrier) errors.push(`Barrier ${index + 1}: barrier description is required`);
                    if (barrier.type && !validBarrierTypes.includes(barrier.type)) {
                        errors.push(`Barrier ${index + 1}: invalid type "${barrier.type}". Valid types: process, technology, knowledge, resource, policy, cultural, vision, communications, governance`);
                    }
                    if (barrier.impact && typeof barrier.impact !== "string") {
                        errors.push(`Barrier ${index + 1}: impact must be a descriptive string`);
                    }
                });
            } else {
                warnings.push("No barriers specified - systematic barrier analysis reveals root causes and enables targeted solutions");
            }

            // Use cases validation (v1.0.2: object array)
            if (data.extended_attributes.use_cases) {
                data.extended_attributes.use_cases.forEach((useCase, index) => {
                    if (!useCase.scenario) {
                        errors.push(`Use case ${index + 1}: scenario is required`);
                    } else if (useCase.scenario.length > 200) {
                        warnings.push(`Use case ${index + 1}: scenario quite long, consider shortening for clarity`);
                    }
                });
            } else {
                warnings.push("No use cases specified - understanding user scenarios helps prioritize features");
            }

            // Success metrics validation (v1.0.2: object array)
            if (data.extended_attributes.success_metrics) {
                data.extended_attributes.success_metrics.forEach((metric, index) => {
                    if (!metric.metric) {
                        errors.push(`Success metric ${index + 1}: metric is required`);
                    } else if (metric.metric.length > 200) {
                        warnings.push(`Success metric ${index + 1}: metric quite long, consider shortening for clarity`);
                    }
                });
            } else {
                warnings.push("No success metrics specified - measurable outcomes enable impact tracking");
            }
        }
        
        // Validation section check
        if (data.validation) {
            if (!data.validation.research_sources || data.validation.research_sources.length === 0) {
                errors.push("At least one research source is required for evidence-based personas");
            } else {
                data.validation.research_sources.forEach((source, index) => {
                    if (!source.source) errors.push(`Research source ${index + 1}: source description is required`);
                    if (!source.type) errors.push(`Research source ${index + 1}: type is required`);
                    if (source.type && !["interview", "survey", "analytics", "observation", "existing_research"].includes(source.type)) {
                        errors.push(`Research source ${index + 1}: type must be interview, survey, analytics, observation, or existing_research`);
                    }
                    if (source.confidence && !["high", "medium", "low"].includes(source.confidence)) {
                        errors.push(`Research source ${index + 1}: confidence must be high, medium, or low`);
                    }
                });
            }
            if (!data.validation.confidence_level) {
                warnings.push("No overall confidence level specified");
            } else if (!["high", "medium", "low"].includes(data.validation.confidence_level)) {
                errors.push("Confidence level must be high, medium, or low");
            }
        }
        
        // Business persona specific validation (v1.0.2: top-level)
        if (data.schema_info && data.schema_info.persona_type === "business") {
            if (data.business_context) {
                const bc = data.business_context;
                if (!bc.role_title) warnings.push("Business context: role_title is recommended for business personas");
                if (!bc.department) warnings.push("Business context: department is recommended for business personas");
                if (bc.company_size && !["1-10", "11-50", "51-200", "201-1000", "1000+"].includes(bc.company_size)) {
                    errors.push("Business context: company_size must be 1-10, 11-50, 51-200, 201-1000, or 1000+");
                }
                if (bc.seniority_level && !["individual_contributor", "team_lead", "manager", "director", "vp", "c_level"].includes(bc.seniority_level)) {
                    errors.push("Business context: seniority_level must be individual_contributor, team_lead, manager, director, vp, or c_level");
                }
            } else {
                warnings.push("Business personas should include business_context at top level");
            }
        }

        // Consumer persona specific validation (v1.0.2: top-level)
        if (data.schema_info && data.schema_info.persona_type === "consumer") {
            if (data.demographics) {
                const demo = data.demographics;
                if (!demo.age) warnings.push("Demographics: age is recommended for consumer personas");
                if (demo.age && (demo.age < 16 || demo.age > 99)) {
                    errors.push("Demographics: age must be between 16 and 99");
                }
            } else {
                warnings.push("Consumer personas should include demographics at top level");
            }
        }

        // Employee persona specific validation (v1.0.2: top-level)
        if (data.schema_info && data.schema_info.persona_type === "employee") {
            if (data.work_context) {
                const wc = data.work_context;
                if (!wc.role_department) warnings.push("Work context: role_department is recommended for employee personas");
            } else {
                warnings.push("Employee personas should include work_context at top level");
            }
        }
        
        // Calculate quality score
        const enhancementScore = calculateEnhancementScore(data);
        
        // Results
        console.log(`\n✅ Validation complete for ${path.basename(filePath)}`);
        
        if (errors.length > 0) {
            console.log(`\n❌ ERRORS (${errors.length}):`);
            errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
            warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        
        // Quality score display
        console.log(`\n📊 PROFESSIONAL QUALITY LEVEL:`);
        console.log(`   Score: ${enhancementScore.percentage}% (${enhancementScore.score}/110)`);
        console.log(`   Level: ${enhancementScore.level}`);
        console.log(`   ${enhancementScore.description}`);
        
        if (enhancementScore.details.length > 0) {
            console.log(`\n✨ Quality Highlights:`);
            enhancementScore.details.forEach(detail => console.log(`   ${detail}`));
        }
        
        // Overall assessment
        if (errors.length === 0 && warnings.length === 0 && enhancementScore.percentage >= 80) {
            console.log("\n🎉 Excellent! Professional-grade persona with comprehensive insights.");
        } else if (errors.length === 0 && enhancementScore.percentage >= 60) {
            console.log("\n✅ Valid! Good persona with room for improvement.");
        } else if (errors.length === 0) {
            console.log("\n✅ Valid but consider adding more attributes for richer insights.");
        }
        
        return { 
            errors, 
            warnings,
            enhancementScore
        };
        
    } catch (error) {
        console.log(`\n❌ FATAL ERROR: ${error.message}`);
        return { 
            errors: [error.message], 
            warnings: [],
            enhancementScore: { score: 0, percentage: 0, level: "Invalid", description: "File cannot be parsed" }
        };
    }
}

// Run validation if called directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log("Usage: node validate-persona.js <persona-file> [options]");
        console.log("\nOptions:");
        console.log("  --schema <path>    Path to custom schema file");
        console.log("  --schema-dir <dir> Directory containing schema files (default: ../../schemas)");
        console.log("\nExamples:");
        console.log("  node validate-persona.js ../examples/personas/david-chen.json");
        console.log("  node validate-persona.js persona.json --schema /path/to/custom-schema.json");
        console.log("  node validate-persona.js persona.json --schema-dir /path/to/schemas");
        process.exit(args.length === 0 ? 1 : 0);
    }

    const filePath = args[0];
    const options = {};

    // Parse optional arguments
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--schema' && args[i + 1]) {
            options.schemaPath = args[i + 1];
            i++;
        } else if (args[i] === '--schema-dir' && args[i + 1]) {
            options.schemaDir = args[i + 1];
            i++;
        }
    }

    const result = validatePersona(filePath, options);
    process.exit(result.errors.length > 0 ? 1 : 0);
}

module.exports = { validatePersona, calculateEnhancementScore };
