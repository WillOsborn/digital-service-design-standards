// Complete test suite for v1.0.1 schemas
const fs = require('fs');
const path = require('path');
const { validatePersona } = require('./validate-persona');
const { validateJourney } = require('./validate-journey');

function findFiles(dir, extension) {
    const files = [];
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...findFiles(fullPath, extension));
            } else if (item.endsWith(extension)) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Directory doesn't exist or can't be read, return empty array
        console.log(`Note: Directory ${dir} not found or inaccessible`);
    }
    return files;
}

function validateSchemaStructure(schemaDir) {
    console.log('🏗️  Validating Schema Structure:');
    console.log('=================================');

    const baseDir = schemaDir || path.join(__dirname, '../../v1.0.2');
    const requiredFiles = [
        'base/persona-base.json',
        'persona/business-persona.json',
        'persona/consumer-persona.json',
        'persona/employee-persona.json',
        'journey/journey-schema.json',
        'patterns/pattern-schema.json'
    ];
    
    let structureErrors = 0;
    
    for (const file of requiredFiles) {
        const filePath = path.join(baseDir, file);
        if (fs.existsSync(filePath)) {
            // Verify it's valid JSON
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const version = data.$id ? data.$id.match(/v\d+\.\d+\.\d+/)?.[0] : 'unknown';
                console.log(`✅ ${file} (${version})`);
            } catch (error) {
                console.log(`❌ ${file} - INVALID JSON`);
                structureErrors++;
            }
        } else {
            console.log(`❌ ${file} - MISSING`);
            structureErrors++;
        }
    }
    
    console.log(`\nSchema files found: ${requiredFiles.length - structureErrors}/${requiredFiles.length}`);
    return structureErrors;
}

function runAllTests(options = {}) {
    console.log('🧪 Digital Service Design Schemas - Complete Validation Suite');
    console.log('===============================================================\n');

    const schemaDir = options.schemaDir || path.join(__dirname, '../../v1.0.2');
    const baseDir = schemaDir;

    // First validate schema structure
    const structureErrors = validateSchemaStructure(schemaDir);
    
    const personaFiles = findFiles(path.join(baseDir, 'examples/personas'), '.json');
    const journeyFiles = findFiles(path.join(baseDir, 'examples/journeys'), '.json');
    
    let totalErrors = structureErrors;
    let totalWarnings = 0;
    let totalFiles = 0;
    
    // Test personas
    console.log('\n📋 Testing Personas:');
    console.log('====================');
    
    if (personaFiles.length === 0) {
        console.log('No persona files found in examples/personas/');
    } else {
        for (const file of personaFiles) {
            totalFiles++;
            const result = validatePersona(file, { schemaDir });
            totalErrors += result.errors.length;
            totalWarnings += result.warnings.length;
            console.log('');
        }
    }
    
    // Test journeys
    console.log('\n🗺️  Testing Journeys:');
    console.log('=====================');
    
    if (journeyFiles.length === 0) {
        console.log('No journey files found in examples/journeys/');
    } else {
        for (const file of journeyFiles) {
            totalFiles++;
            const result = validateJourney(file, { schemaDir });
            totalErrors += result.errors.length;
            totalWarnings += result.warnings.length;
            console.log('');
        }
    }
    
    // Schema cross-validation
    console.log('\n🔗 Cross-Validation Checks:');
    console.log('============================');
    
    // Check for persona references in journeys
    const personaIds = new Set();
    for (const file of personaFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (data.identity && data.identity.id) {
                personaIds.add(data.identity.id);
            }
        } catch (error) {
            // Already caught in individual validation
        }
    }
    
    let crossValidationIssues = 0;
    for (const file of journeyFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (data.journey && data.journey.context && data.journey.context.persona_id) {
                const referencedPersona = data.journey.context.persona_id;
                if (!personaIds.has(referencedPersona)) {
                    console.log(`⚠️  ${path.basename(file)}: references persona "${referencedPersona}" which was not found in examples`);
                    crossValidationIssues++;
                } else {
                    console.log(`✅ ${path.basename(file)}: valid persona reference to "${referencedPersona}"`);
                }
            }
        } catch (error) {
            // Already caught in individual validation
        }
    }
    
    if (crossValidationIssues === 0 && journeyFiles.length > 0) {
        console.log('✅ All persona references validated');
    } else if (journeyFiles.length === 0) {
        console.log('ℹ️  No journey files to validate');
    }
    
    // Taxonomy compliance check
    console.log('\n🏷️  Taxonomy Compliance:');
    console.log('========================');
    
    const validBarrierTypes = ["process", "technology", "knowledge", "resource", "policy", "cultural", "vision", "communications", "governance"];
    const validChannelTypes = ["digital", "physical", "social", "media", "direct", "in_person_events", "self_service_digital", "personal_interaction", "mobile_app", "social_recommendations"];
    
    let taxonomyIssues = 0;
    
    // Check personas
    for (const file of personaFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            const personaName = data.identity?.name || path.basename(file);
            
            // Check barriers
            if (data.core_attributes?.barriers) {
                data.core_attributes.barriers.forEach((barrier, index) => {
                    if (barrier.type && !validBarrierTypes.includes(barrier.type)) {
                        console.log(`❌ ${personaName}: Invalid barrier type "${barrier.type}" in barrier ${index + 1}`);
                        taxonomyIssues++;
                    }
                });
            }
            
            // Check channels
            if (data.core_attributes?.channels) {
                data.core_attributes.channels.forEach((channel, index) => {
                    if (channel.type && !validChannelTypes.includes(channel.type)) {
                        console.log(`❌ ${personaName}: Invalid channel type "${channel.type}" in channel ${index + 1}`);
                        taxonomyIssues++;
                    }
                });
            }
        } catch (error) {
            // Already caught in individual validation
        }
    }
    
    if (taxonomyIssues === 0 && personaFiles.length > 0) {
        console.log('✅ All barrier and channel types comply with taxonomies');
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('=================');
    console.log(`Schema files: ${6 - structureErrors}/6 present and valid`);
    console.log(`Example files tested: ${totalFiles}`);
    console.log(`  - Personas: ${personaFiles.length}`);
    console.log(`  - Journeys: ${journeyFiles.length}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Total warnings: ${totalWarnings}`);
    console.log(`Cross-validation issues: ${crossValidationIssues}`);
    console.log(`Taxonomy compliance issues: ${taxonomyIssues}`);
    
    // Schema analysis
    if (totalErrors === 0) {
        console.log('\n📈 Professional Quality Analysis:');
        console.log('==================================');
        
        // Analyze comprehensive persona fields
        let comprehensiveCount = 0;
        let totalBarriers = 0;
        let totalChannels = 0;
        let totalMoments = 0;
        
        const qualityScores = [];
        
        for (const file of personaFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (data.core_attributes) {
                    let hasComprehensiveFields = 0;
                    
                    if (data.core_attributes.barriers) {
                        hasComprehensiveFields++;
                        totalBarriers += (data.core_attributes.barriers || []).length;
                    }
                    if (data.core_attributes.channels) {
                        hasComprehensiveFields++;
                        totalChannels += (data.core_attributes.channels || []).length;
                    }
                    if (data.core_attributes.moments_that_matter) {
                        hasComprehensiveFields++;
                        totalMoments += (data.core_attributes.moments_that_matter || []).length;
                    }
                    
                    if (hasComprehensiveFields >= 2) comprehensiveCount++;
                    
                    // Simple quality estimate
                    let score = 40; // base
                    if (data.core_attributes.goals?.length > 0) score += 10;
                    if (data.core_attributes.pain_points?.length > 0) score += 10;
                    if (data.core_attributes.motivations?.length > 0) score += 5;
                    if (data.core_attributes.barriers?.length > 0) score += 15;
                    if (data.core_attributes.channels?.length > 0) score += 10;
                    if (data.core_attributes.moments_that_matter?.length > 0) score += 10;
                    
                    qualityScores.push(score);
                }
            } catch (error) {
                // Skip invalid files
            }
        }
        
        if (personaFiles.length > 0) {
            const avgQuality = Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length);
            console.log(`Personas with comprehensive attributes: ${comprehensiveCount}/${personaFiles.length}`);
            console.log(`Average quality score: ${avgQuality}% (estimated)`);
            console.log(`Total barriers documented: ${totalBarriers}`);
            console.log(`Total channels documented: ${totalChannels}`);
            console.log(`Total moments documented: ${totalMoments}`);
        }
        
        // Analyze journeys
        if (journeyFiles.length > 0) {
            let journeyBarriers = 0;
            let journeyChannels = 0;
            let journeyMoments = 0;
            
            for (const file of journeyFiles) {
                try {
                    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                    if (data.journey && data.journey.phases) {
                        data.journey.phases.forEach(phase => {
                            if (phase.steps) {
                                phase.steps.forEach(step => {
                                    if (step.lane_content) {
                                        journeyBarriers += (step.lane_content.barriers || []).length;
                                        journeyChannels += (step.lane_content.channels || []).length;
                                    }
                                });
                            }
                            journeyMoments += (phase.moments_that_matter || []).length;
                        });
                    }
                } catch (error) {
                    // Skip invalid files
                }
            }
            
            console.log(`\nJourney Integration Metrics:`);
            console.log(`  Barriers mapped to journeys: ${journeyBarriers}`);
            console.log(`  Channels used in journeys: ${journeyChannels}`);
            console.log(`  Moments documented in journeys: ${journeyMoments}`);
        }
    }
    
    // Final verdict
    const hasIssues = totalErrors > 0 || crossValidationIssues > 0 || taxonomyIssues > 0 || structureErrors > 0;
    
    if (!hasIssues) {
        console.log('\n🎉 SUCCESS! All tests passed!');
        console.log('================================');
        console.log('✅ Schemas are production-ready');
        console.log('✅ Examples validate correctly');
        console.log('✅ Cross-references are valid');
        console.log('✅ Taxonomies are compliant');
        console.log('\n🚀 Your v1.0.1 schemas are ready for publication!');
    } else {
        console.log('\n⚠️  ISSUES FOUND - Please review and fix:');
        console.log('=========================================');
        if (structureErrors > 0) console.log(`❌ ${structureErrors} schema structure issues`);
        if (totalErrors > 0) console.log(`❌ ${totalErrors} validation errors in examples`);
        if (crossValidationIssues > 0) console.log(`❌ ${crossValidationIssues} cross-reference issues`);
        if (taxonomyIssues > 0) console.log(`❌ ${taxonomyIssues} taxonomy compliance issues`);
        console.log('\n💡 Run individual validators for detailed error messages.');
    }
    
    return { 
        totalFiles, 
        totalErrors, 
        totalWarnings, 
        crossValidationIssues,
        taxonomyIssues,
        structureErrors,
        personaCount: personaFiles.length,
        journeyCount: journeyFiles.length,
        passed: !hasIssues
    };
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--schema-dir' && args[i + 1]) {
            options.schemaDir = args[i + 1];
            i++;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log("Usage: node run-all-tests.js [options]");
            console.log("\nOptions:");
            console.log("  --schema-dir <dir> Directory containing schema files (default: ../../)");
            console.log("\nExamples:");
            console.log("  node run-all-tests.js");
            console.log("  node run-all-tests.js --schema-dir /path/to/schemas");
            process.exit(0);
        }
    }

    const results = runAllTests(options);
    process.exit(results.passed ? 0 : 1);
}

module.exports = { runAllTests, validateSchemaStructure };
