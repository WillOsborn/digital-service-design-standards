// Test suite for persona validator (v1.0.2)
// Usage: node test-persona-validator.js

const fs = require('fs');
const path = require('path');
const { validatePersona } = require('./validate-persona');

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
    totalTests++;
    try {
        testFn();
        console.log(`✅ PASS: ${testName}`);
        passedTests++;
        return true;
    } catch (error) {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Error: ${error.message}`);
        failedTests++;
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertArrayIncludes(array, value, message) {
    if (!array.some(item => item.includes(value))) {
        throw new Error(message || `Expected array to include "${value}"`);
    }
}

console.log('🧪 Running Persona Validator Test Suite (v1.0.2)\n');

// Test 1: Valid consumer persona
runTest('Valid consumer persona (sarah-martinez)', () => {
    const result = validatePersona('../../examples/sarah-martinez-consumer.json');
    assert(result.errors.length === 0, `Expected 0 errors, got ${result.errors.length}`);
    assert(result.enhancementScore.percentage >= 95, `Expected quality >= 95%, got ${result.enhancementScore.percentage}%`);
});

// Test 2: Valid business persona
runTest('Valid business persona (david-chen)', () => {
    const result = validatePersona('../../examples/david-chen-business.json');
    assert(result.errors.length === 0, `Expected 0 errors, got ${result.errors.length}`);
    assert(result.enhancementScore.percentage >= 95, `Expected quality >= 95%, got ${result.enhancementScore.percentage}%`);
});

// Test 3: Valid employee persona
runTest('Valid employee persona (maria-rodriguez)', () => {
    const result = validatePersona('../../examples/maria-rodriguez-employee.json');
    assert(result.errors.length === 0, `Expected 0 errors, got ${result.errors.length}`);
    assert(result.enhancementScore.percentage >= 90, `Expected quality >= 90%, got ${result.enhancementScore.percentage}%`);
});

// Test 4: Missing required sections
runTest('Missing required sections', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "persona_type": "consumer"
        }
    };
    fs.writeFileSync('/tmp/test-missing-sections.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-missing-sections.json');
    assert(result.errors.length > 0, 'Expected errors for missing sections');
    assertArrayIncludes(result.errors, 'Missing identity section');
    assertArrayIncludes(result.errors, 'Missing core_attributes section');
    fs.unlinkSync('/tmp/test-missing-sections.json');
});

// Test 5: Invalid channel types (v1.0.2: 5 types)
runTest('Invalid channel types (v1.0.2 taxonomy)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "extended_attributes": {
            "channels": [
                { "name": "Social media", "type": "social" }  // Invalid in v1.0.2
            ]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-invalid-channel.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-invalid-channel.json');
    assert(result.errors.length > 0, 'Expected error for invalid channel type');
    assertArrayIncludes(result.errors, 'invalid type "social"');
    fs.unlinkSync('/tmp/test-invalid-channel.json');
});

// Test 6: Invalid preference levels (v1.0.2: preferred/acceptable/avoided)
runTest('Invalid channel preference levels', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "extended_attributes": {
            "channels": [
                { "name": "Website", "type": "digital", "preference_level": "primary" }  // Invalid
            ]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-invalid-preference.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-invalid-preference.json');
    assert(result.errors.length > 0, 'Expected error for invalid preference level');
    assertArrayIncludes(result.errors, 'preference_level must be preferred, acceptable, or avoided');
    fs.unlinkSync('/tmp/test-invalid-preference.json');
});

// Test 7: Use cases as objects (v1.0.2)
runTest('Use cases validation (object array)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "extended_attributes": {
            "use_cases": [
                { "scenario": "Shopping online" },
                { "scenario": "Comparing products", "trigger": "Need arises" }
            ]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-use-cases.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-use-cases.json');
    assert(result.errors.length === 0, `Expected 0 errors for valid use cases, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-use-cases.json');
});

// Test 8: emotional_intensity (not emotional_state)
runTest('Moments use emotional_intensity (v1.0.2)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "extended_attributes": {
            "moments_that_matter": [
                { "moment": "First purchase", "emotional_intensity": 2, "importance": "high" }
            ]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-emotional-intensity.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-emotional-intensity.json');
    assert(result.errors.length === 0, `Expected 0 errors, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-emotional-intensity.json');
});

// Test 9: Barriers impact as string (not integer)
runTest('Barriers impact as string (v1.0.2)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "extended_attributes": {
            "barriers": [
                {
                    "barrier": "Complex checkout process",
                    "type": "process",
                    "impact": "Causes 30% cart abandonment rate"
                }
            ]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-barrier-impact.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-barrier-impact.json');
    assert(result.errors.length === 0, `Expected 0 errors, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-barrier-impact.json');
});

// Test 10: Type-specific context at top level (v1.0.2)
runTest('Business context at top level (v1.0.2)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "business",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "business_context": {
            "role_title": "CTO",
            "department": "Technology"
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-business-context.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-business-context.json');
    assert(result.warnings.length === 0 || !result.warnings.some(w => w.includes('extensions')),
        'Should not warn about extensions when business_context is at top level');
    fs.unlinkSync('/tmp/test-business-context.json');
});

// Test 11: Missing schema_info.standard
runTest('Missing schema_info.standard warning', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-missing-standard.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-missing-standard.json');
    assertArrayIncludes(result.warnings, 'schema_info.standard');
    fs.unlinkSync('/tmp/test-missing-standard.json');
});

// Test 12: Success metrics as objects (v1.0.2)
runTest('Success metrics validation (object array)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Persona Standard v1.0",
            "persona_type": "consumer",
            "last_updated": "2025-11-25"
        },
        "identity": { "name": "Test", "id": "test" },
        "core_attributes": {
            "goals": [{"text": "Test goal"}],
            "pain_points": [{"text": "Test pain"}],
            "motivations": [{"text": "Test motivation"}]
        },
        "extended_attributes": {
            "success_metrics": [
                { "metric": "Purchase conversion rate", "target": "5%", "current_state": "3%" }
            ]
        },
        "validation": {
            "research_sources": [{"source": "Test", "type": "interview"}],
            "confidence_level": "medium"
        }
    };
    fs.writeFileSync('/tmp/test-success-metrics.json', JSON.stringify(testData, null, 2));
    const result = validatePersona('/tmp/test-success-metrics.json');
    assert(result.errors.length === 0, `Expected 0 errors for valid success metrics, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-success-metrics.json');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
