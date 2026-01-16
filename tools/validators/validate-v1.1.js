// v1.1 Validator with auto-detection and quality scoring
// Supports: core-persona, role-card, pairing, journey
// Usage: node validate-v1.1.js path/to/file.json [--schema-dir path/to/v1.1]

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Default schema location (relative to this file: validators -> tools -> schemas root -> v1.1)
const DEFAULT_SCHEMA_DIR = path.join(__dirname, '../../v1.1');

// Schema type to file mapping
const SCHEMA_FILES = {
    'core-persona': 'core-persona.schema.json',
    'role-card': 'role-card.schema.json',
    'pairing': 'pairing.schema.json',
    'journey': 'journey-schema.json'
};

// ID patterns for reference validation
const ID_PATTERNS = {
    persona: /^persona-[a-z0-9_-]+$/,
    role: /^role-[a-z0-9_-]+$/,
    pairing: /^pairing-[a-z0-9_-]+$/
};

// Valid barrier types (9-type taxonomy)
const VALID_BARRIER_TYPES = [
    'process', 'technology', 'knowledge', 'resource',
    'policy', 'cultural', 'vision', 'communications', 'governance'
];

/**
 * Load a JSON schema file
 * @param {string} schemaPath - Path to the schema file
 * @returns {Object} - Loaded schema
 */
function loadSchema(schemaPath) {
    try {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        return JSON.parse(schemaContent);
    } catch (error) {
        throw new Error(`Failed to load schema from ${schemaPath}: ${error.message}`);
    }
}

/**
 * Auto-detect schema type from document
 * @param {Object} data - Document data
 * @returns {string|null} - Schema type or null if not detected
 */
function detectSchemaType(data) {
    if (data.schema_info && data.schema_info.schema_type) {
        return data.schema_info.schema_type;
    }

    // Fallback detection based on structure
    if (data.behavioural_attributes) return 'core-persona';
    if (data.roleBasedNeeds && data.roleBasedFrustrations) return 'role-card';
    if (data.references && data.synthesis) return 'pairing';
    if (data.lanes && data.journey) return 'journey';

    return null;
}

/**
 * Find schema file for given type
 * @param {string} schemaType - Type of schema
 * @param {string} schemaDir - Directory containing schemas
 * @returns {string} - Path to schema file
 */
function findSchemaForType(schemaType, schemaDir) {
    const schemaFile = SCHEMA_FILES[schemaType];
    if (!schemaFile) {
        throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const schemaPath = path.join(schemaDir, 'schemas', schemaFile);
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
        validateSchema: false
    });
    addFormats(ajv);

    const schema = loadSchema(schemaPath);
    const validate = ajv.compile(schema);
    return { ajv, validate };
}

/**
 * Calculate quality score for Core Persona
 * @param {Object} data - Persona data
 * @returns {Object} - Quality score details
 */
function calculatePersonaQuality(data) {
    let score = 0;
    const maxScore = 100;
    const details = [];

    // Required fields (40 points)
    if (data.schema_info) score += 5;
    if (data.identity && data.identity.id && data.identity.name) score += 5;
    if (data.behavioural_attributes) {
        if (data.behavioural_attributes.personalNeeds?.length > 0) score += 10;
        if (data.behavioural_attributes.personalFrustrations?.length > 0) score += 10;
        if (data.behavioural_attributes.motivations?.length > 0) score += 10;
    }

    // Optional enrichment (60 points)
    if (data.demographics) {
        score += 5;
        if (data.demographics.age && data.demographics.location) {
            score += 5;
            details.push("✅ Demographics include age and location");
        }
    }

    if (data.behavioural_attributes) {
        if (data.behavioural_attributes.attitudes?.length > 0) {
            score += 5;
            details.push("✅ Attitudes documented");
        }
        if (data.behavioural_attributes.technologyComfort) {
            score += 5;
            details.push("✅ Technology comfort specified");
        }
        if (data.behavioural_attributes.communicationPreferences) {
            score += 5;
            details.push("✅ Communication preferences defined");
        }
        if (data.behavioural_attributes.influences?.length > 0) {
            score += 5;
            details.push("✅ Influences documented");
        }
        if (data.behavioural_attributes.behaviouralPatterns?.length > 0) {
            score += 5;
            details.push("✅ Behavioural patterns captured");
        }
        if (data.behavioural_attributes.riskTolerance) {
            score += 5;
            details.push("✅ Risk tolerance specified");
        }
        if (data.behavioural_attributes.decisionMakingStyle) {
            score += 5;
            details.push("✅ Decision-making style documented");
        }
    }

    // Validation quality (15 points)
    if (data.validation) {
        if (data.validation.research_sources?.length >= 2) {
            score += 10;
            details.push("✅ Multiple research sources");
        } else if (data.validation.research_sources?.length === 1) {
            score += 5;
        }
        if (data.validation.confidence_level === 'high') {
            score += 5;
            details.push("✅ High confidence level");
        }
    }

    return calculateLevel(score, maxScore, details, 'Core Persona');
}

/**
 * Calculate quality score for Role Card
 * @param {Object} data - Role card data
 * @returns {Object} - Quality score details
 */
function calculateRoleQuality(data) {
    let score = 0;
    const maxScore = 100;
    const details = [];

    // Required fields (40 points)
    if (data.schema_info) score += 5;
    if (data.identity?.id && data.identity?.title) score += 10;
    if (data.roleBasedNeeds?.length >= 3) {
        score += 15;
        details.push("✅ At least 3 role-based needs");
    } else if (data.roleBasedNeeds?.length > 0) {
        score += 10;
    }
    if (data.roleBasedFrustrations?.length >= 3) {
        score += 10;
        details.push("✅ At least 3 role-based frustrations");
    } else if (data.roleBasedFrustrations?.length > 0) {
        score += 5;
    }

    // Optional enrichment (60 points)
    if (data.roleType) {
        score += 5;
        details.push("✅ Role type specified");
    }

    if (data.roleContext) {
        score += 10;
        if (data.roleContext.consumerContext || data.roleContext.businessContext ||
            data.roleContext.employeeContext || data.roleContext.otherContext) {
            score += 10;
            details.push("✅ Role context provided");
        }
    }

    // Check needs quality
    const hasEnhancedNeeds = data.roleBasedNeeds?.some(n => n.priority && n.timeframe);
    if (hasEnhancedNeeds) {
        score += 10;
        details.push("✅ Needs include priority and timeframe");
    }

    // Check frustrations quality
    const hasEnhancedFrustrations = data.roleBasedFrustrations?.some(f => f.severity && f.frequency);
    if (hasEnhancedFrustrations) {
        score += 10;
        details.push("✅ Frustrations include severity and frequency");
    }

    if (data.extensions?.custom) {
        score += 5;
        details.push("✅ Custom extensions used");
    }

    return calculateLevel(score, maxScore, details, 'Role Card');
}

/**
 * Calculate quality score for Pairing
 * @param {Object} data - Pairing data
 * @returns {Object} - Quality score details
 */
function calculatePairingQuality(data) {
    let score = 0;
    const maxScore = 100;
    const details = [];

    // Required fields (40 points)
    if (data.schema_info) score += 5;
    if (data.identity?.id) score += 5;
    if (data.references?.personaRef && data.references?.roleRefs?.length > 0) {
        score += 10;
        details.push("✅ Valid persona and role references");
    }
    if (data.synthesis?.goalsAsExperienced?.length > 0) score += 10;
    if (data.synthesis?.painPoints?.length > 0) score += 10;

    // Optional enrichment (60 points)
    if (data.synthesis?.quote) {
        score += 5;
        details.push("✅ Representative quote provided");
    }

    if (data.synthesis?.barriers?.length > 0) {
        score += 10;
        const hasEmergence = data.synthesis.barriers.some(b => b.emergesFrom);
        if (hasEmergence) {
            score += 5;
            details.push("✅ Barriers include emergesFrom synthesis");
        }
    }

    if (data.synthesis?.opportunities?.length > 0) {
        score += 5;
        details.push("✅ Opportunities identified");
    }

    // Check for emergence documentation
    const hasPainEmergence = data.synthesis?.painPoints?.some(p => p.emergesFrom);
    if (hasPainEmergence) {
        score += 5;
        details.push("✅ Pain points include emergesFrom synthesis");
    }

    // Check goal sources
    const hasGoalSources = data.synthesis?.goalsAsExperienced?.some(g => g.source);
    if (hasGoalSources) {
        score += 5;
        details.push("✅ Goals specify source (persona/role/persona+role)");
    }

    // Extended context
    if (data.extendedContext?.channels?.length > 0) {
        score += 5;
        details.push("✅ Channels documented");
    }
    if (data.extendedContext?.moments_that_matter?.length > 0) {
        score += 5;
        details.push("✅ Moments that matter captured");
    }
    if (data.extendedContext?.use_cases?.length > 0) {
        score += 5;
        details.push("✅ Use cases defined");
    }

    // Validation
    if (data.validation?.research_sources?.length > 0) {
        score += 5;
    }

    return calculateLevel(score, maxScore, details, 'Pairing');
}

/**
 * Calculate quality score for Journey
 * @param {Object} data - Journey data
 * @returns {Object} - Quality score details
 */
function calculateJourneyQuality(data) {
    let score = 0;
    const maxScore = 100;
    const details = [];

    // Required fields (40 points)
    if (data.schema_info) score += 5;
    if (data.lanes?.standard?.length > 0) score += 5;
    if (data.journey?.id && data.journey?.title) score += 5;
    if (data.journey?.context?.persona_context) score += 5;
    if (data.journey?.phases?.length > 0) score += 10;
    if (data.journey?.validation?.research_sources?.length > 0) score += 10;

    // v1.1 compositional references (20 points)
    if (data.journey?.context?.personaRef) {
        score += 10;
        details.push("✅ Uses v1.1 personaRef");
    }
    if (data.journey?.context?.roleRefs?.length > 0) {
        score += 10;
        details.push("✅ Uses v1.1 roleRefs");
    }

    // Journey richness (40 points)
    const totalSteps = data.journey?.phases?.reduce((sum, phase) =>
        sum + (phase.steps?.length || 0), 0) || 0;

    if (totalSteps >= 5) {
        score += 10;
        details.push(`✅ ${totalSteps} steps across phases`);
    } else if (totalSteps > 0) {
        score += 5;
    }

    // Check for barriers with types
    let barrierCount = 0;
    let hasEmergence = false;
    data.journey?.phases?.forEach(phase => {
        phase.steps?.forEach(step => {
            if (step.lane_content?.barriers) {
                barrierCount += step.lane_content.barriers.length;
                if (step.lane_content.barriers.some(b => b.emergesFrom)) {
                    hasEmergence = true;
                }
            }
        });
    });

    if (barrierCount > 0) {
        score += 10;
        details.push(`✅ ${barrierCount} barriers identified`);
    }
    if (hasEmergence) {
        score += 5;
        details.push("✅ Barriers include emergesFrom (v1.1 synthesis)");
    }

    // Check for channels
    let channelCount = 0;
    data.journey?.phases?.forEach(phase => {
        phase.steps?.forEach(step => {
            if (step.lane_content?.channels) {
                channelCount += step.lane_content.channels.length;
            }
        });
    });

    if (channelCount > 0) {
        score += 5;
        details.push(`✅ ${channelCount} channel interactions mapped`);
    }

    // Moments that matter
    const momentCount = data.journey?.phases?.reduce((sum, phase) =>
        sum + (phase.moments_that_matter?.length || 0), 0) || 0;

    if (momentCount > 0) {
        score += 5;
        details.push(`✅ ${momentCount} moments that matter identified`);
    }

    return calculateLevel(score, maxScore, details, 'Journey');
}

/**
 * Calculate level from score
 * @param {number} score - Raw score
 * @param {number} maxScore - Maximum possible score
 * @param {Array} details - Quality details
 * @param {string} type - Schema type name
 * @returns {Object} - Quality assessment
 */
function calculateLevel(score, maxScore, details, type) {
    const percentage = Math.round((score / maxScore) * 100);

    let level, description;
    if (percentage >= 80) {
        level = "Comprehensive";
        description = `Professional-grade ${type} with comprehensive attributes`;
    } else if (percentage >= 60) {
        level = "Professional";
        description = `Good ${type} with most attributes present`;
    } else if (percentage >= 40) {
        level = "Basic";
        description = `Meets minimum requirements but lacks depth`;
    } else {
        level = "Incomplete";
        description = `Missing required fields or critical attributes`;
    }

    return { score, percentage, level, description, details };
}

/**
 * Validate Core Persona document
 * @param {Object} data - Persona data
 * @returns {Object} - Validation results
 */
function validateCorePersona(data) {
    const errors = [];
    const warnings = [];

    // ID pattern validation
    if (data.identity?.id && !ID_PATTERNS.persona.test(data.identity.id)) {
        errors.push(`Identity ID must match pattern: persona-[a-z0-9_-]+ (got: ${data.identity.id})`);
    }

    // Behavioural attributes validation
    if (data.behavioural_attributes) {
        const ba = data.behavioural_attributes;

        if (!ba.personalNeeds || ba.personalNeeds.length === 0) {
            errors.push("At least one personalNeed is required");
        } else {
            ba.personalNeeds.forEach((need, i) => {
                if (!need.text) errors.push(`Personal need ${i + 1}: text is required`);
            });
        }

        if (!ba.personalFrustrations || ba.personalFrustrations.length === 0) {
            errors.push("At least one personalFrustration is required");
        } else {
            ba.personalFrustrations.forEach((frust, i) => {
                if (!frust.text) errors.push(`Personal frustration ${i + 1}: text is required`);
                if (frust.severity && (frust.severity < 1 || frust.severity > 5)) {
                    errors.push(`Personal frustration ${i + 1}: severity must be 1-5`);
                }
            });
        }

        if (!ba.motivations || ba.motivations.length === 0) {
            errors.push("At least one motivation is required");
        } else {
            ba.motivations.forEach((mot, i) => {
                if (!mot.text) errors.push(`Motivation ${i + 1}: text is required`);
            });
        }

        // Optional recommendations
        if (!ba.technologyComfort) {
            warnings.push("Consider adding technologyComfort for behavioural context");
        }
        if (!ba.attitudes || ba.attitudes.length === 0) {
            warnings.push("Consider adding attitudes for deeper behavioural understanding");
        }
    }

    // Validation section
    if (!data.validation) {
        errors.push("Missing validation section");
    } else {
        if (!data.validation.research_sources || data.validation.research_sources.length === 0) {
            errors.push("At least one research source is required");
        }
        if (!data.validation.confidence_level) {
            warnings.push("No confidence level specified");
        }
    }

    return { errors, warnings };
}

/**
 * Validate Role Card document
 * @param {Object} data - Role card data
 * @returns {Object} - Validation results
 */
function validateRoleCard(data) {
    const errors = [];
    const warnings = [];

    // ID pattern validation
    if (data.identity?.id && !ID_PATTERNS.role.test(data.identity.id)) {
        errors.push(`Identity ID must match pattern: role-[a-z0-9_-]+ (got: ${data.identity.id})`);
    }

    // Title required
    if (!data.identity?.title) {
        errors.push("identity.title is required for Role Cards");
    }

    // Role-based needs validation
    if (!data.roleBasedNeeds || data.roleBasedNeeds.length === 0) {
        errors.push("At least one roleBasedNeed is required");
    } else {
        data.roleBasedNeeds.forEach((need, i) => {
            if (!need.text) errors.push(`Role-based need ${i + 1}: text is required`);
        });

        if (data.roleBasedNeeds.length < 3) {
            warnings.push("Consider adding at least 3 role-based needs for comprehensive coverage");
        }
    }

    // Role-based frustrations validation
    if (!data.roleBasedFrustrations || data.roleBasedFrustrations.length === 0) {
        errors.push("At least one roleBasedFrustration is required");
    } else {
        data.roleBasedFrustrations.forEach((frust, i) => {
            if (!frust.text) errors.push(`Role-based frustration ${i + 1}: text is required`);
            if (frust.severity && (frust.severity < 1 || frust.severity > 5)) {
                errors.push(`Role-based frustration ${i + 1}: severity must be 1-5`);
            }
        });

        if (data.roleBasedFrustrations.length < 3) {
            warnings.push("Consider adding at least 3 role-based frustrations");
        }
    }

    // Role context recommendations
    if (!data.roleContext) {
        warnings.push("Consider adding roleContext for richer role definition");
    }

    if (!data.roleType) {
        warnings.push("Consider specifying roleType (e.g., Consumer, Employee, Business)");
    }

    return { errors, warnings };
}

/**
 * Validate Pairing document
 * @param {Object} data - Pairing data
 * @returns {Object} - Validation results
 */
function validatePairing(data) {
    const errors = [];
    const warnings = [];

    // ID pattern validation
    if (data.identity?.id && !ID_PATTERNS.pairing.test(data.identity.id)) {
        errors.push(`Identity ID must match pattern: pairing-[a-z0-9_-]+ (got: ${data.identity.id})`);
    }

    // References validation
    if (!data.references) {
        errors.push("Missing references section");
    } else {
        if (!data.references.personaRef) {
            errors.push("references.personaRef is required");
        } else if (!ID_PATTERNS.persona.test(data.references.personaRef)) {
            errors.push(`personaRef must match pattern: persona-[a-z0-9_-]+ (got: ${data.references.personaRef})`);
        }

        if (!data.references.roleRefs || data.references.roleRefs.length === 0) {
            errors.push("At least one roleRef is required");
        } else {
            data.references.roleRefs.forEach((ref, i) => {
                if (!ID_PATTERNS.role.test(ref)) {
                    errors.push(`roleRef ${i + 1} must match pattern: role-[a-z0-9_-]+ (got: ${ref})`);
                }
            });
        }
    }

    // Synthesis validation
    if (!data.synthesis) {
        errors.push("Missing synthesis section");
    } else {
        if (!data.synthesis.goalsAsExperienced || data.synthesis.goalsAsExperienced.length === 0) {
            errors.push("At least one goalsAsExperienced is required");
        } else {
            data.synthesis.goalsAsExperienced.forEach((goal, i) => {
                if (!goal.text) errors.push(`Goal ${i + 1}: text is required`);
            });

            const hasSources = data.synthesis.goalsAsExperienced.some(g => g.source);
            if (!hasSources) {
                warnings.push("Consider adding source (persona/role/persona+role) to goals");
            }
        }

        if (!data.synthesis.painPoints || data.synthesis.painPoints.length === 0) {
            errors.push("At least one painPoint is required");
        } else {
            data.synthesis.painPoints.forEach((pain, i) => {
                if (!pain.text) errors.push(`Pain point ${i + 1}: text is required`);
            });

            const hasEmergence = data.synthesis.painPoints.some(p => p.emergesFrom);
            if (!hasEmergence) {
                warnings.push("Consider adding emergesFrom to pain points to explain persona-role synthesis");
            }
        }

        // Barriers validation
        if (data.synthesis.barriers) {
            data.synthesis.barriers.forEach((barrier, i) => {
                if (!barrier.barrier) errors.push(`Barrier ${i + 1}: barrier description is required`);
                if (!barrier.type) {
                    errors.push(`Barrier ${i + 1}: type is required`);
                } else if (!VALID_BARRIER_TYPES.includes(barrier.type)) {
                    errors.push(`Barrier ${i + 1}: invalid type "${barrier.type}". Valid: ${VALID_BARRIER_TYPES.join(', ')}`);
                }
            });

            const hasEmergence = data.synthesis.barriers.some(b => b.emergesFrom);
            if (!hasEmergence) {
                warnings.push("Consider adding emergesFrom to barriers to explain synthesis");
            }
        } else {
            warnings.push("Consider adding barriers with the 9-type taxonomy");
        }

        if (!data.synthesis.quote) {
            warnings.push("Consider adding a representative quote");
        }
    }

    // Validation section
    if (!data.validation) {
        errors.push("Missing validation section");
    } else {
        if (!data.validation.research_sources || data.validation.research_sources.length === 0) {
            errors.push("At least one research source is required");
        }
        if (!data.validation.confidence_level) {
            warnings.push("No confidence level specified");
        }
    }

    return { errors, warnings };
}

/**
 * Validate Journey document
 * @param {Object} data - Journey data
 * @returns {Object} - Validation results
 */
function validateJourney(data) {
    const errors = [];
    const warnings = [];

    // Lanes validation
    if (!data.lanes?.standard || data.lanes.standard.length === 0) {
        errors.push("At least one standard lane is required");
    }

    // Journey validation
    if (!data.journey) {
        errors.push("Missing journey section");
        return { errors, warnings };
    }

    const j = data.journey;

    if (!j.id) errors.push("Missing journey.id");
    if (!j.title) errors.push("Missing journey.title");
    if (!j.purpose) errors.push("Missing journey.purpose");
    if (!j.summary) errors.push("Missing journey.summary");

    // Context validation
    if (!j.context) {
        errors.push("Missing journey.context");
    } else {
        if (!j.context.persona_context) {
            errors.push("Missing journey.context.persona_context");
        }

        // v1.1 compositional references
        if (j.context.personaRef) {
            if (!ID_PATTERNS.persona.test(j.context.personaRef)) {
                errors.push(`personaRef must match pattern: persona-[a-z0-9_-]+ (got: ${j.context.personaRef})`);
            }
        } else if (!j.context.persona_id) {
            warnings.push("Consider using v1.1 personaRef for compositional model");
        }

        if (j.context.roleRefs) {
            j.context.roleRefs.forEach((ref, i) => {
                if (!ID_PATTERNS.role.test(ref)) {
                    errors.push(`roleRef ${i + 1} must match pattern: role-[a-z0-9_-]+ (got: ${ref})`);
                }
            });
        } else if (j.context.personaRef) {
            warnings.push("Consider adding roleRefs when using personaRef for full v1.1 model");
        }

        if (j.context.pairingRef && !ID_PATTERNS.pairing.test(j.context.pairingRef)) {
            errors.push(`pairingRef must match pattern: pairing-[a-z0-9_-]+ (got: ${j.context.pairingRef})`);
        }

        // Deprecation warning
        if (j.context.persona_id && !j.context.personaRef) {
            warnings.push("persona_id is deprecated - consider migrating to personaRef + roleRefs");
        }
    }

    // Phases validation
    if (!j.phases || j.phases.length === 0) {
        errors.push("At least one phase is required");
    } else {
        j.phases.forEach((phase, pi) => {
            if (!phase.id) errors.push(`Phase ${pi + 1}: missing id`);
            if (!phase.name) errors.push(`Phase ${pi + 1}: missing name`);
            if (!phase.steps || phase.steps.length === 0) {
                errors.push(`Phase ${pi + 1}: at least one step is required`);
            } else {
                phase.steps.forEach((step, si) => {
                    if (!step.id) errors.push(`Phase ${pi + 1}, Step ${si + 1}: missing id`);
                    if (!step.name) errors.push(`Phase ${pi + 1}, Step ${si + 1}: missing name`);

                    // Validate barriers
                    if (step.lane_content?.barriers) {
                        step.lane_content.barriers.forEach((barrier, bi) => {
                            if (!barrier.type || !VALID_BARRIER_TYPES.includes(barrier.type)) {
                                errors.push(`Phase ${pi + 1}, Step ${si + 1}, Barrier ${bi + 1}: invalid type`);
                            }
                            if (!barrier.description) {
                                errors.push(`Phase ${pi + 1}, Step ${si + 1}, Barrier ${bi + 1}: missing description`);
                            }
                        });
                    }

                    // Validate channels
                    if (step.lane_content?.channels) {
                        step.lane_content.channels.forEach((channel, ci) => {
                            if (channel.channel === 'other' && !channel.custom_channel) {
                                errors.push(`Phase ${pi + 1}, Step ${si + 1}, Channel ${ci + 1}: custom_channel required when channel is 'other'`);
                            }
                        });
                    }
                });
            }
        });
    }

    // Validation section
    if (!j.validation) {
        errors.push("Missing journey.validation");
    } else {
        if (!j.validation.research_sources || j.validation.research_sources.length === 0) {
            warnings.push("No research sources - journeys should be evidence-based");
        }
        if (!j.validation.confidence_level) {
            warnings.push("No confidence level specified");
        }
    }

    return { errors, warnings };
}

/**
 * Main validation function
 * @param {string} filePath - Path to file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation results
 */
function validate(filePath, options = {}) {
    console.log(`🔍 Validating: ${filePath}`);

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let errors = [];
        let warnings = [];

        // Detect schema type
        const schemaType = detectSchemaType(data);
        if (!schemaType) {
            console.log("\n❌ FATAL: Could not detect schema type");
            console.log("   Ensure schema_info.schema_type is one of: core-persona, role-card, pairing, journey");
            return { errors: ["Could not detect schema type"], warnings: [], qualityScore: null };
        }

        console.log(`📋 Detected schema type: ${schemaType}`);

        // Find and validate against JSON schema
        const schemaDir = options.schemaDir || DEFAULT_SCHEMA_DIR;
        try {
            const schemaPath = findSchemaForType(schemaType, schemaDir);
            console.log(`📋 Using schema: ${path.relative(process.cwd(), schemaPath)}`);

            const { validate: ajvValidate } = setupValidator(schemaPath);
            const valid = ajvValidate(data);

            if (!valid && ajvValidate.errors) {
                ajvValidate.errors.forEach(error => {
                    const errorPath = error.instancePath || error.dataPath || 'root';
                    errors.push(`${errorPath}: ${error.message}`);
                });
            }
        } catch (error) {
            warnings.push(`Schema validation skipped: ${error.message}`);
            console.log(`⚠️  ${error.message}`);
        }

        // Type-specific validation
        let typeValidation;
        let qualityScore;

        switch (schemaType) {
            case 'core-persona':
                typeValidation = validateCorePersona(data);
                qualityScore = calculatePersonaQuality(data);
                break;
            case 'role-card':
                typeValidation = validateRoleCard(data);
                qualityScore = calculateRoleQuality(data);
                break;
            case 'pairing':
                typeValidation = validatePairing(data);
                qualityScore = calculatePairingQuality(data);
                break;
            case 'journey':
                typeValidation = validateJourney(data);
                qualityScore = calculateJourneyQuality(data);
                break;
        }

        errors = errors.concat(typeValidation.errors);
        warnings = warnings.concat(typeValidation.warnings);

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
        console.log(`\n📊 QUALITY LEVEL:`);
        console.log(`   Score: ${qualityScore.percentage}% (${qualityScore.score}/100)`);
        console.log(`   Level: ${qualityScore.level}`);
        console.log(`   ${qualityScore.description}`);

        if (qualityScore.details.length > 0) {
            console.log(`\n✨ Quality Highlights:`);
            qualityScore.details.forEach(detail => console.log(`   ${detail}`));
        }

        // Overall assessment
        if (errors.length === 0 && qualityScore.percentage >= 80) {
            console.log("\n🎉 Excellent! Professional-grade document with comprehensive insights.");
        } else if (errors.length === 0 && qualityScore.percentage >= 60) {
            console.log("\n✅ Valid! Good document with room for improvement.");
        } else if (errors.length === 0) {
            console.log("\n✅ Valid but consider adding more attributes for richer insights.");
        }

        return { errors, warnings, qualityScore };

    } catch (error) {
        console.log(`\n❌ FATAL ERROR: ${error.message}`);
        return {
            errors: [error.message],
            warnings: [],
            qualityScore: { score: 0, percentage: 0, level: "Invalid", description: "File cannot be parsed" }
        };
    }
}

// Run validation if called directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log("Usage: node validate-v1.1.js <file.json> [options]");
        console.log("\nv1.1 Validator - Auto-detects and validates all v1.1 schema types");
        console.log("\nSupported types:");
        console.log("  - core-persona  (behavioural attributes)");
        console.log("  - role-card     (contextual demands)");
        console.log("  - pairing       (persona + role synthesis)");
        console.log("  - journey       (experience over time)");
        console.log("\nOptions:");
        console.log("  --schema-dir <dir>  Directory containing v1.1 schemas (default: ../../v1.1)");
        console.log("\nExamples:");
        console.log("  node validate-v1.1.js ../../v1.1/examples/personas/persona-sarah-martinez.json");
        console.log("  node validate-v1.1.js document.json --schema-dir /path/to/v1.1");
        process.exit(args.length === 0 ? 1 : 0);
    }

    const filePath = args[0];
    const options = {};

    // Parse optional arguments
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--schema-dir' && args[i + 1]) {
            options.schemaDir = args[i + 1];
            i++;
        }
    }

    const result = validate(filePath, options);
    process.exit(result.errors.length > 0 ? 1 : 0);
}

module.exports = { validate, detectSchemaType };
