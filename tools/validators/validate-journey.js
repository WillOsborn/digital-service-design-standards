// Journey validator with dynamic schema loading
// Usage: node validate-journey.js path/to/journey.json [--schema path/to/schema.json]

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Default schema location (relative to this file: validators -> tools -> schemas root -> v1.0.2)
const DEFAULT_SCHEMA_DIR = path.join(__dirname, '../../v1.0.2');

/**
 * Load a JSON schema file
 * @param {string} schemaPath - Path to the schema file
 * @returns {Object} - Loaded schema
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
 * Find journey schema file
 * @param {string} schemaDir - Directory containing schema files
 * @returns {string} - Path to the schema file
 */
function findJourneySchema(schemaDir) {
    // v1.0.2: Schema is in schemas/ directory
    const schemaPath = path.join(schemaDir, 'schemas', 'journey-schema.json');
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

    const schema = loadSchema(schemaPath);
    const validate = ajv.compile(schema);
    return { ajv, validate };
}

function validateJourney(filePath, options = {}) {
    console.log(`🔍 Validating: ${filePath}`);

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const errors = [];
        const warnings = [];

        // Determine schema to use
        let schemaPath = options.schemaPath;
        if (!schemaPath) {
            const schemaDir = options.schemaDir || DEFAULT_SCHEMA_DIR;
            try {
                schemaPath = findJourneySchema(schemaDir);
                console.log(`📋 Using schema: ${path.relative(process.cwd(), schemaPath)}`);
            } catch (error) {
                warnings.push(`Could not find journey schema`);
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
        
        // Required top-level fields check
        if (!data.schema_info) errors.push("Missing schema_info");
        if (!data.lanes) errors.push("Missing lanes");
        if (!data.journey) errors.push("Missing journey");
        
        // Schema info validation (basic checks - schema validation handles detailed checks)
        if (data.schema_info) {
            if (!data.schema_info.version) warnings.push("Missing schema_info.version (required in v1.0.2)");
            if (!data.schema_info.standard) warnings.push("Missing schema_info.standard (required in v1.0.2)");
            if (!data.schema_info.last_updated) warnings.push("Missing schema_info.last_updated");
            if (data.schema_info.standard && data.schema_info.standard !== "Service Design Journey Standard v1.0") {
                warnings.push(`schema_info.standard should be "Service Design Journey Standard v1.0"`);
            }
        }
        
        // Lanes validation
        if (data.lanes) {
            if (!data.lanes.standard) errors.push("Missing lanes.standard array");
            if (data.lanes.standard && data.lanes.standard.length === 0) {
                warnings.push("No standard lanes defined - journey may lack structure");
            }
            
            // Validate lane definitions
            if (data.lanes.standard) {
                data.lanes.standard.forEach((lane, index) => {
                    if (!lane.id) errors.push(`Standard lane ${index + 1}: missing id`);
                    if (!lane.label) errors.push(`Standard lane ${index + 1}: missing label`);
                    if (!lane.type) errors.push(`Standard lane ${index + 1}: missing type`);
                    
                    if (lane.id && !/^[a-z][a-z0-9_-]*$/.test(lane.id)) {
                        errors.push(`Standard lane ${index + 1}: id must start with lowercase letter and contain only lowercase, numbers, underscores, hyphens`);
                    }
                    
                    if (lane.type && !["text", "list", "metric", "emotion", "reference", "barrier", "channel"].includes(lane.type)) {
                        errors.push(`Standard lane ${index + 1}: invalid type "${lane.type}"`);
                    }
                });
            }
        }
        
        // Journey validation
        if (data.journey) {
            if (!data.journey.id) errors.push("Missing journey.id");
            if (!data.journey.title) errors.push("Missing journey.title");
            if (!data.journey.purpose) errors.push("Missing journey.purpose");
            if (!data.journey.summary) errors.push("Missing journey.summary");
            if (!data.journey.context) errors.push("Missing journey.context");
            if (!data.journey.phases) errors.push("Missing journey.phases");
            if (!data.journey.validation) errors.push("Missing journey.validation");
            
            // Journey ID validation
            if (data.journey.id && !/^[a-zA-Z0-9_-]+$/.test(data.journey.id)) {
                errors.push("Journey ID must contain only letters, numbers, underscores, and hyphens");
            }
            
            // Context validation
            if (data.journey.context) {
                if (!data.journey.context.persona_context) {
                    errors.push("Missing journey.context.persona_context");
                }
                if (data.journey.context.persona_id) {
                    // Check if persona ID follows naming convention
                    if (!/^[a-z0-9_-]+$/.test(data.journey.context.persona_id)) {
                        warnings.push("Persona ID should be lowercase with hyphens/underscores for consistency");
                    }
                } else {
                    warnings.push("No persona_id specified - consider linking to specific persona");
                }
            }
            
            // Phases validation
            if (data.journey.phases) {
                if (data.journey.phases.length === 0) {
                    errors.push("Journey must have at least one phase");
                }
                
                data.journey.phases.forEach((phase, phaseIndex) => {
                    if (!phase.id) errors.push(`Phase ${phaseIndex + 1}: missing id`);
                    if (!phase.name) errors.push(`Phase ${phaseIndex + 1}: missing name`);
                    if (!phase.steps) errors.push(`Phase ${phaseIndex + 1}: missing steps`);
                    
                    if (phase.id && !/^[a-zA-Z0-9_-]+$/.test(phase.id)) {
                        errors.push(`Phase ${phaseIndex + 1}: id must contain only letters, numbers, underscores, hyphens`);
                    }
                    
                    if (phase.steps) {
                        if (phase.steps.length === 0) {
                            errors.push(`Phase ${phaseIndex + 1}: must have at least one step`);
                        }
                        
                        phase.steps.forEach((step, stepIndex) => {
                            if (!step.id) errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: missing id`);
                            if (!step.name) errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: missing name`);
                            
                            if (step.id && !/^[a-zA-Z0-9_-]+$/.test(step.id)) {
                                errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: id must contain only letters, numbers, underscores, hyphens`);
                            }
                            
                            // Enhanced validations for lane content
                            if (step.lane_content) {
                                // Emotion validation (v1.0.2: emotions object with state and intensity)
                                if (step.lane_content.emotions !== undefined) {
                                    if (typeof step.lane_content.emotions !== 'object') {
                                        errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: emotions must be an object with 'state' and 'intensity'`);
                                    } else {
                                        if (step.lane_content.emotions.intensity !== undefined) {
                                            if (!Number.isInteger(step.lane_content.emotions.intensity) ||
                                                step.lane_content.emotions.intensity < -2 ||
                                                step.lane_content.emotions.intensity > 2) {
                                                errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: emotions.intensity must be integer from -2 to +2`);
                                            }
                                        }
                                    }
                                }

                                // Backward compatibility: warn about deprecated emotion field
                                if (step.lane_content.emotion !== undefined) {
                                    warnings.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: 'emotion' field is deprecated, use 'emotions' object instead`);
                                }

                                // Common lane content field validation (informational - schema allows additionalProperties)
                                if (step.lane_content.actions !== undefined && !Array.isArray(step.lane_content.actions)) {
                                    warnings.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: 'actions' should be an array of strings`);
                                }
                                if (step.lane_content.thoughts !== undefined && typeof step.lane_content.thoughts !== 'string') {
                                    warnings.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: 'thoughts' should be a string`);
                                }
                                if (step.lane_content.opportunities !== undefined && !Array.isArray(step.lane_content.opportunities)) {
                                    warnings.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}: 'opportunities' should be an array of strings`);
                                }

                                // Barriers validation (v1.0.2: uses 'type' and 'workarounds' fields)
                                if (step.lane_content.barriers) {
                                    const validBarrierTypes = ["process", "technology", "knowledge", "resource", "policy", "cultural", "vision", "communications", "governance"];
                                    step.lane_content.barriers.forEach((barrier, barrierIndex) => {
                                        if (!barrier.type || !validBarrierTypes.includes(barrier.type)) {
                                            errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}, Barrier ${barrierIndex + 1}: invalid type. Valid types: process, technology, knowledge, resource, policy, cultural, vision, communications, governance`);
                                        }
                                        if (!barrier.description) {
                                            errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}, Barrier ${barrierIndex + 1}: missing description`);
                                        }
                                        if (barrier.severity && (barrier.severity < 1 || barrier.severity > 5)) {
                                            errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}, Barrier ${barrierIndex + 1}: severity must be 1-5`);
                                        }
                                    });
                                }
                                
                                // Channels validation (v1.0.2: channel + medium + serviceModel structure)
                                // Note: Field validation is handled by JSON Schema (AJV)
                                // This section only provides additional business logic validation
                                if (step.lane_content.channels) {
                                    step.lane_content.channels.forEach((channel, channelIndex) => {
                                        // Validate custom_channel when channel is "other"
                                        if (channel.channel === "other" && !channel.custom_channel) {
                                            errors.push(`Phase ${phaseIndex + 1}, Step ${stepIndex + 1}, Channel ${channelIndex + 1}: custom_channel is required when channel is 'other'`);
                                        }
                                    });
                                }
                            }
                        });
                    }
                    
                    // Moments that matter validation
                    if (phase.moments_that_matter) {
                        phase.moments_that_matter.forEach((moment, momentIndex) => {
                            if (!moment.step_id) {
                                errors.push(`Phase ${phaseIndex + 1}, Moment ${momentIndex + 1}: missing step_id`);
                            }
                            if (!moment.moment) {
                                errors.push(`Phase ${phaseIndex + 1}, Moment ${momentIndex + 1}: missing moment description`);
                            }
                            if (moment.importance && !["critical", "high", "medium", "low"].includes(moment.importance)) {
                                errors.push(`Phase ${phaseIndex + 1}, Moment ${momentIndex + 1}: invalid importance level`);
                            }
                            if (moment.emotional_intensity !== undefined) {
                                if (!Number.isInteger(moment.emotional_intensity) ||
                                    moment.emotional_intensity < -2 ||
                                    moment.emotional_intensity > 2) {
                                    errors.push(`Phase ${phaseIndex + 1}, Moment ${momentIndex + 1}: emotional_intensity must be integer from -2 to +2`);
                                }
                            }
                        });
                    }
                });
            }
            
            // Validation section check
            if (data.journey.validation) {
                if (!data.journey.validation.research_sources || data.journey.validation.research_sources.length === 0) {
                    warnings.push("No research sources - journeys should be evidence-based");
                }
                if (!data.journey.validation.confidence_level) {
                    warnings.push("No confidence level specified");
                }
                
                if (data.journey.validation.research_sources) {
                    data.journey.validation.research_sources.forEach((source, index) => {
                        if (!source.source) {
                            errors.push(`Research source ${index + 1}: missing source description`);
                        }
                        if (!source.type) {
                            errors.push(`Research source ${index + 1}: missing type`);
                        }
                        if (source.type && !["interview", "survey", "analytics", "observation", "existing_research"].includes(source.type)) {
                            errors.push(`Research source ${index + 1}: invalid type "${source.type}". Valid types: interview, survey, analytics, observation, existing_research`);
                        }
                    });
                }
            }
        }
        
        // Data quality checks
        if (data.journey && data.journey.phases) {
            const totalSteps = data.journey.phases.reduce((sum, phase) => sum + (phase.steps ? phase.steps.length : 0), 0);
            if (totalSteps < 3) {
                warnings.push("Very few steps defined - consider adding more detail for actionable insights");
            }
            
            // Check for consistent emotional progression (v1.0.2: emotions.intensity)
            const emotionIntensities = [];
            data.journey.phases.forEach(phase => {
                if (phase.steps) {
                    phase.steps.forEach(step => {
                        if (step.lane_content && step.lane_content.emotions && step.lane_content.emotions.intensity !== undefined) {
                            emotionIntensities.push(step.lane_content.emotions.intensity);
                        }
                        // Backward compatibility: also check deprecated emotion field
                        if (step.lane_content && step.lane_content.emotion !== undefined) {
                            emotionIntensities.push(step.lane_content.emotion);
                        }
                    });
                }
            });

            if (emotionIntensities.length > 0) {
                const hasVariation = Math.max(...emotionIntensities) - Math.min(...emotionIntensities) > 0;
                if (!hasVariation) {
                    warnings.push("Emotional state doesn't vary - consider capturing emotional journey progression");
                }
            }
        }
        
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
        
        if (errors.length === 0 && warnings.length === 0) {
            console.log("\n🎉 Perfect! No issues found.");
        }
        
        // Additional insights
        if (errors.length === 0) {
            console.log("\n📊 Journey Insights:");
            if (data.journey && data.journey.phases) {
                const totalSteps = data.journey.phases.reduce((sum, phase) => sum + (phase.steps ? phase.steps.length : 0), 0);
                console.log(`   - ${data.journey.phases.length} phases with ${totalSteps} total steps`);
                
                // Count barriers by type
                const barrierCounts = {};
                data.journey.phases.forEach(phase => {
                    if (phase.steps) {
                        phase.steps.forEach(step => {
                            if (step.lane_content && step.lane_content.barriers) {
                                step.lane_content.barriers.forEach(barrier => {
                                    // v1.0.2: barrier_type -> type
                                    barrierCounts[barrier.type] = (barrierCounts[barrier.type] || 0) + 1;
                                });
                            }
                        });
                    }
                });
                
                if (Object.keys(barrierCounts).length > 0) {
                    console.log(`   - Barrier types identified: ${Object.keys(barrierCounts).join(', ')}`);
                }
                
                // Count channels (v1.0.2: channel, medium, and serviceModel fields)
                const channelMediums = new Set();
                const channelServiceModels = new Set();
                const channelTypes = new Set();
                data.journey.phases.forEach(phase => {
                    if (phase.steps) {
                        phase.steps.forEach(step => {
                            if (step.lane_content && step.lane_content.channels) {
                                step.lane_content.channels.forEach(channel => {
                                    if (channel.medium) channelMediums.add(channel.medium);
                                    if (channel.serviceModel) channelServiceModels.add(channel.serviceModel);
                                    if (channel.channel) channelTypes.add(channel.channel);
                                });
                            }
                        });
                    }
                });

                if (channelMediums.size > 0) {
                    console.log(`   - Channel mediums: ${Array.from(channelMediums).join(', ')}`);
                }
                if (channelServiceModels.size > 0) {
                    console.log(`   - Service models: ${Array.from(channelServiceModels).join(', ')}`);
                }
                if (channelTypes.size > 0) {
                    console.log(`   - Channel types used: ${Array.from(channelTypes).join(', ')}`);
                }
            }
        }
        
        return { errors, warnings };
        
    } catch (error) {
        console.log(`\n❌ FATAL ERROR: ${error.message}`);
        return { errors: [error.message], warnings: [] };
    }
}

// Run validation if called directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log("Usage: node validate-journey.js <journey-file> [options]");
        console.log("\nOptions:");
        console.log("  --schema <path>    Path to custom schema file");
        console.log("  --schema-dir <dir> Directory containing schema files (default: ../../)");
        console.log("\nExamples:");
        console.log("  node validate-journey.js ../examples/journeys/sample-journey.json");
        console.log("  node validate-journey.js journey.json --schema /path/to/custom-schema.json");
        console.log("  node validate-journey.js journey.json --schema-dir /path/to/schemas");
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

    const result = validateJourney(filePath, options);
    process.exit(result.errors.length > 0 ? 1 : 0);
}

module.exports = { validateJourney };
