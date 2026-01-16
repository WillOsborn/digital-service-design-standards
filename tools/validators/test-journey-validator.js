// Test suite for journey validator (v1.0.2)
// Usage: node test-journey-validator.js

const fs = require('fs');
const path = require('path');
const { validateJourney } = require('./validate-journey');

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

console.log('🧪 Running Journey Validator Test Suite (v1.0.2)\n');

// Test 1: Valid minimal journey
runTest('Valid minimal journey', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [
                {
                    "id": "actions",
                    "label": "User Actions",
                    "type": "text"
                }
            ]
        },
        "journey": {
            "id": "test-journey",
            "title": "Test Journey",
            "purpose": "Test purpose",
            "summary": "Test summary",
            "context": {
                "persona_context": "Test persona context"
            },
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "goal": "Test goal",
                    "steps": [
                        {
                            "id": "step1",
                            "name": "Step 1"
                        }
                    ]
                }
            ],
            "validation": {
                "research_sources": [
                    {
                        "source": "Test interviews",
                        "type": "interview",
                        "confidence": "high"
                    }
                ],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-valid-minimal.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-valid-minimal.json');
    assert(result.errors.length === 0, `Expected 0 errors, got ${result.errors.length}: ${result.errors.join(', ')}`);
    fs.unlinkSync('/tmp/test-valid-minimal.json');
});

// Test 2: Missing required fields
runTest('Missing required fields', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2"
        }
    };
    fs.writeFileSync('/tmp/test-missing-fields.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-missing-fields.json');
    assert(result.errors.length > 0, 'Expected errors for missing fields');
    assertArrayIncludes(result.errors, 'Missing lanes');
    assertArrayIncludes(result.errors, 'Missing journey');
    fs.unlinkSync('/tmp/test-missing-fields.json');
});

// Test 3: v1.0.2 field names (version not spec_version)
runTest('schema_info.version (v1.0.2)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "actions", "label": "Actions", "type": "text"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [{"id": "step1", "name": "Step 1"}]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-version-field.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-version-field.json');
    assert(result.warnings.length === 0 || !result.warnings.some(w => w.includes('spec_version')),
        'Should not warn about spec_version when version is present');
    fs.unlinkSync('/tmp/test-version-field.json');
});

// Test 4: Missing schema_info.standard
runTest('Missing schema_info.standard warning', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "actions", "label": "Actions", "type": "text"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [{"id": "step1", "name": "Step 1"}]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-missing-standard.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-missing-standard.json');
    assertArrayIncludes(result.warnings, 'schema_info.standard');
    fs.unlinkSync('/tmp/test-missing-standard.json');
});

// Test 5: Channel types (v1.0.2: 5 types)
runTest('Valid channel types (v1.0.2: 5 types)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "channels", "label": "Channels", "type": "channel"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [
                        {
                            "id": "step1",
                            "name": "Step 1",
                            "lane_content": {
                                "channels": [
                                    {"channel_type": "digital", "name": "Website"},
                                    {"channel_type": "physical", "name": "Store"},
                                    {"channel_type": "human", "name": "Support call"},
                                    {"channel_type": "hybrid", "name": "Video conference"},
                                    {"channel_type": "self_service", "name": "Chatbot"}
                                ]
                            }
                        }
                    ]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-channel-types.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-channel-types.json');
    assert(result.errors.length === 0, `Expected 0 errors for valid v1.0.2 channels, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-channel-types.json');
});

// Test 6: Invalid old channel types
runTest('Invalid old channel types (v1.0.1)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "channels", "label": "Channels", "type": "channel"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [
                        {
                            "id": "step1",
                            "name": "Step 1",
                            "lane_content": {
                                "channels": [
                                    {"channel_type": "social", "name": "Facebook"}  // Invalid in v1.0.2
                                ]
                            }
                        }
                    ]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-invalid-channel.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-invalid-channel.json');
    assert(result.errors.length > 0, 'Expected error for invalid channel type');
    assertArrayIncludes(result.errors, 'invalid channel_type');
    fs.unlinkSync('/tmp/test-invalid-channel.json');
});

// Test 7: Barrier type field (type not barrier_type)
runTest('Barrier type field (v1.0.2)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "barriers", "label": "Barriers", "type": "barrier"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [
                        {
                            "id": "step1",
                            "name": "Step 1",
                            "lane_content": {
                                "barriers": [
                                    {
                                        "type": "technology",
                                        "description": "System integration issues",
                                        "severity": 4,
                                        "workarounds": "Manual data entry"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-barrier-type.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-barrier-type.json');
    assert(result.errors.length === 0, `Expected 0 errors for barrier with type field, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-barrier-type.json');
});

// Test 8: All 9 barrier types
runTest('All 9 barrier types valid', () => {
    const barriers = [
        {"type": "process", "description": "Test"},
        {"type": "technology", "description": "Test"},
        {"type": "knowledge", "description": "Test"},
        {"type": "resource", "description": "Test"},
        {"type": "policy", "description": "Test"},
        {"type": "cultural", "description": "Test"},
        {"type": "vision", "description": "Test"},
        {"type": "communications", "description": "Test"},
        {"type": "governance", "description": "Test"}
    ];
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "barriers", "label": "Barriers", "type": "barrier"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [
                        {
                            "id": "step1",
                            "name": "Step 1",
                            "lane_content": {"barriers": barriers}
                        }
                    ]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-all-barriers.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-all-barriers.json');
    assert(result.errors.length === 0, `Expected 0 errors for all barrier types, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-all-barriers.json');
});

// Test 9: emotional_intensity (not emotional_state) in moments
runTest('Moments use emotional_intensity (v1.0.2)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "actions", "label": "Actions", "type": "text"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "moments_that_matter": [
                        {
                            "step_id": "step1",
                            "moment": "Critical decision point",
                            "importance": "critical",
                            "emotional_intensity": -2
                        }
                    ],
                    "steps": [
                        {
                            "id": "step1",
                            "name": "Step 1"
                        }
                    ]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-emotional-intensity.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-emotional-intensity.json');
    assert(result.errors.length === 0, `Expected 0 errors for emotional_intensity, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-emotional-intensity.json');
});

// Test 10: Research source ordering (interview-first in v1.0.2)
runTest('Research source types (interview-first ordering)', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "actions", "label": "Actions", "type": "text"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [{"id": "step1", "name": "Step 1"}]
                }
            ],
            "validation": {
                "research_sources": [
                    {"source": "User interviews", "type": "interview"},
                    {"source": "Survey results", "type": "survey"},
                    {"source": "Web analytics", "type": "analytics"},
                    {"source": "Field observations", "type": "observation"},
                    {"source": "Industry report", "type": "existing_research"}
                ],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-research-types.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-research-types.json');
    assert(result.errors.length === 0, `Expected 0 errors for valid research types, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-research-types.json');
});

// Test 11: Invalid lane types
runTest('Invalid lane types', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [
                {"id": "invalid", "label": "Invalid", "type": "unknown"}
            ]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {"persona_context": "Test"},
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [{"id": "step1", "name": "Step 1"}]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-invalid-lane.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-invalid-lane.json');
    assert(result.errors.length > 0, 'Expected error for invalid lane type');
    assertArrayIncludes(result.errors, 'invalid type "unknown"');
    fs.unlinkSync('/tmp/test-invalid-lane.json');
});

// Test 12: Persona ID linkage
runTest('Persona ID linkage', () => {
    const testData = {
        "schema_info": {
            "version": "1.0.2",
            "standard": "Service Design Journey Standard v1.0",
            "last_updated": "2025-11-25T10:00:00Z"
        },
        "lanes": {
            "standard": [{"id": "actions", "label": "Actions", "type": "text"}]
        },
        "journey": {
            "id": "test",
            "title": "Test",
            "purpose": "Test",
            "summary": "Test",
            "context": {
                "persona_id": "david-chen",
                "persona_context": "Hospital CTO evaluating systems"
            },
            "phases": [
                {
                    "id": "phase1",
                    "name": "Phase 1",
                    "steps": [{"id": "step1", "name": "Step 1"}]
                }
            ],
            "validation": {
                "research_sources": [{"source": "Test", "type": "interview"}],
                "confidence_level": "high"
            }
        }
    };
    fs.writeFileSync('/tmp/test-persona-id.json', JSON.stringify(testData, null, 2));
    const result = validateJourney('/tmp/test-persona-id.json');
    assert(result.errors.length === 0, `Expected 0 errors with persona_id, got ${result.errors.length}`);
    fs.unlinkSync('/tmp/test-persona-id.json');
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
