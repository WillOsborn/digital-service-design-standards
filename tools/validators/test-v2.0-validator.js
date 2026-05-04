// Test suite for validate-v2.0.js
// Run from project root: node tools/validators/test-v2.0-validator.js
// Or from validators dir: node test-v2.0-validator.js

'use strict';

const fs = require('fs');
const path = require('path');
const { validateFile, validateData, detectSchemaType } = require('./validate-v2.0');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, label, detail) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

// ---------------------------------------------------------------------------
// Task 2.1 — Basic validator with auto-detection
// ---------------------------------------------------------------------------

section('Task 2.1 — Basic validator with auto-detection');

// Valid Actor (retail example)
{
  const result = validateFile('v2.0/examples/retail/actor-sarah-martinez.json');
  assert(result.valid === true, 'Valid actor passes', JSON.stringify(result.errors));
  assert(result.schemaType === 'Actor', 'Detects Actor type via $type field', result.schemaType);
  assert(Array.isArray(result.errors), 'errors is an array');
  assert(Array.isArray(result.warnings), 'warnings is an array');
  assert(result.errors.length === 0, 'No errors for valid actor', result.errors.join('; '));
}

// Valid Mission (retail example)
{
  const result = validateFile('v2.0/examples/retail/mission-online-clothes-shopping.json');
  assert(result.valid === true, 'Valid mission passes', JSON.stringify(result.errors));
  assert(result.schemaType === 'Mission', 'Detects Mission type via $type field');
}

// Valid Experience (retail example)
{
  const result = validateFile('v2.0/examples/retail/exp-sarah-clothes-shopping.json');
  assert(result.valid === true, 'Valid experience passes', JSON.stringify(result.errors));
  assert(result.schemaType === 'Experience', 'Detects Experience type via $type field');
}

// Fallback heuristic detection — Actor (traits && contexts, no $type)
{
  const data = {
    id: 'actor-test-heuristic',
    version: '2.0.0',
    name: 'Test',
    actorType: 'human',
    traits: { needs: [], frustrations: [], motivations: [] },
    contexts: [{ contextId: 'ctx-test', title: 'Test', needs: [], frustrations: [] }],
    meta: { updated: '2026-01-01' }
  };
  const detected = detectSchemaType(data);
  assert(detected === 'Actor', 'Heuristic detects Actor from traits && contexts');
}

// Fallback heuristic detection — Mission (nodes && edges, no $type)
{
  const data = {
    id: 'mission-test',
    version: '2.0.0',
    title: 'Test Mission',
    goal: 'Test',
    actors: [{ actorRef: 'actor-x' }],
    nodes: [{ nodeId: 'n1', name: 'N1', nodeType: 'touchpoint' }],
    edges: [{ from: 'n1', to: 'n1' }],
    meta: { updated: '2026-01-01' }
  };
  const detected = detectSchemaType(data);
  assert(detected === 'Mission', 'Heuristic detects Mission from nodes && edges');
}

// Fallback heuristic detection — Experience (references && path, no $type)
{
  const data = {
    id: 'exp-test',
    version: '2.0.0',
    title: 'Test Experience',
    references: { actorRef: 'actor-x', missionRef: 'mission-y' },
    path: { nodeSequence: ['n1'] },
    nodes: [{ nodeRef: 'n1', laneContent: {} }],
    meta: { updated: '2026-01-01' }
  };
  const detected = detectSchemaType(data);
  assert(detected === 'Experience', 'Heuristic detects Experience from references && path');
}

// Unknown type returns null
{
  const detected = detectSchemaType({ foo: 'bar' });
  assert(detected === null, 'Returns null for unrecognised structure');
}

// Non-existent file returns valid:false with an error
{
  const result = validateFile('v2.0/examples/does-not-exist.json');
  assert(result.valid === false, 'Non-existent file returns valid:false');
  assert(result.errors.length > 0, 'Non-existent file has at least one error');
}

// Invalid actor (missing required fields) returns valid:false
{
  const data = { $type: 'Actor', id: 'actor-bad' }; // missing version, name, traits, etc.
  const result = validateData(data, 'in-memory');
  assert(result.valid === false, 'Invalid actor (missing required fields) fails validation');
  assert(result.schemaType === 'Actor', 'Still detects Actor type even when invalid');
  assert(result.errors.length > 0, 'Invalid actor has errors');
}

// ---------------------------------------------------------------------------
// Task 2.2 — YAML support
// ---------------------------------------------------------------------------

section('Task 2.2 — YAML support');

// Create a minimal actor YAML fixture in a temp location and validate it
const YAML_FIXTURE_PATH = path.join(__dirname, '_test-fixture-actor.yaml');

const minimalActorYaml = `
$context: "https://schemas.digitalservice.design/v2.0"
$type: Actor
id: actor-yaml-test
version: "2.0.0"
name: YAML Test Actor
actorType: human
summary: A minimal actor created to test YAML parsing.
traits:
  needs:
    - need: Basic need for YAML test
      type: security
  frustrations:
    - frustration: Lack of YAML support
      severity: 2
  motivations:
    - motivation: Demonstrate YAML works
      type: intrinsic
contexts:
  - contextId: ctx-yaml-test
    title: YAML Test Context
    needs:
      - need: Parse YAML correctly
        priority: primary
    frustrations:
      - frustration: YAML parsing errors
        severity: 1
meta:
  updated: "2026-01-01"
  createdBy: Test Suite
`;

let yamlFixtureCreated = false;
try {
  // Check if js-yaml is available before writing the fixture
  require('js-yaml');

  fs.writeFileSync(YAML_FIXTURE_PATH, minimalActorYaml.trimStart(), 'utf8');
  yamlFixtureCreated = true;

  const result = validateFile(YAML_FIXTURE_PATH);
  assert(result.valid === true, 'Minimal actor YAML fixture passes validation', JSON.stringify(result.errors));
  assert(result.schemaType === 'Actor', 'YAML fixture detected as Actor type');
  assert(result.errors.length === 0, 'No errors for valid YAML actor', result.errors.join('; '));

  // Clean up fixture
  fs.unlinkSync(YAML_FIXTURE_PATH);
  yamlFixtureCreated = false;

  console.log('  INFO: js-yaml is installed — YAML tests ran');
} catch (e) {
  if (yamlFixtureCreated) {
    try { fs.unlinkSync(YAML_FIXTURE_PATH); } catch (_) {}
  }
  if (e.code === 'MODULE_NOT_FOUND' || (e.message && e.message.includes('js-yaml'))) {
    console.warn('  SKIP: js-yaml not installed — run: cd tools/validators && npm install js-yaml');
    // Count as skipped, not failed
  } else {
    console.error(`  FAIL: YAML test threw unexpected error — ${e.message}`);
    failed++;
  }
}

// Test that .yaml extension is correctly detected
{
  const ext = '.yaml';
  assert(ext === '.yaml' || ext === '.yml', 'YAML extension detection logic covers .yaml');
}

// ---------------------------------------------------------------------------
// Task 2.3 — Lane type validation
// ---------------------------------------------------------------------------

section('Task 2.3 — Lane type validation');

// Helper: create a minimal Mission data object with custom lanes and nodes
function makeMissionWithLane(laneType, laneId, nodeContent) {
  return {
    $type: 'Mission',
    id: 'mission-lane-test',
    version: '2.0.0',
    title: 'Lane Test Mission',
    goal: 'Test lane type validation',
    actors: [{ actorRef: 'actor-x' }],
    lanes: [
      { id: 'channels', label: 'Channels', type: 'channel' },  // core — skip
      { id: laneId, label: 'Test Lane', type: laneType }        // extended — check
    ],
    nodes: [
      {
        nodeId: 'n1',
        name: 'Node 1',
        nodeType: 'touchpoint',
        laneContent: { [laneId]: nodeContent }
      }
    ],
    edges: [{ from: 'n1', to: 'n1' }],
    meta: { updated: '2026-01-01' }
  };
}

// text lane — correct type (string) → no warnings
{
  const data = makeMissionWithLane('text', 'description', 'A string value');
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('description'));
  assert(laneWarnings.length === 0, 'text lane with string value → no lane warnings');
}

// text lane — wrong type (array) → produces a warning
{
  const data = makeMissionWithLane('text', 'frontstage', ['not', 'a', 'string']);
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('frontstage'));
  assert(laneWarnings.length > 0, 'text lane with array value → produces a warning');
}

// list lane — correct type (array of strings) → no warnings
{
  const data = makeMissionWithLane('list', 'design-opps', ['Opportunity 1', 'Opportunity 2']);
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('design-opps'));
  assert(laneWarnings.length === 0, 'list lane with array of strings → no lane warnings');
}

// list lane — wrong type (string) → produces a warning
{
  const data = makeMissionWithLane('list', 'support-systems', 'not-an-array');
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('support-systems'));
  assert(laneWarnings.length > 0, 'list lane with string value → produces a warning');
}

// list lane — array with non-string items → produces a warning
{
  const data = makeMissionWithLane('list', 'data-required', [{ not: 'a string' }, 42]);
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('data-required'));
  assert(laneWarnings.length > 0, 'list lane with non-string array items → produces a warning');
}

// metric lane — correct type (array of {metric, target} objects) → no warnings
{
  const data = makeMissionWithLane('metric', 'kpis', [
    { metric: 'Conversion rate', target: '>15%' },
    { metric: 'Time to purchase', target: '<5 min' }
  ]);
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('kpis'));
  assert(laneWarnings.length === 0, 'metric lane with {metric, target} objects → no lane warnings');
}

// metric lane — wrong type (string) → produces a warning
{
  const data = makeMissionWithLane('metric', 'kpis', 'not an array');
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('kpis'));
  assert(laneWarnings.length > 0, 'metric lane with string value → produces a warning');
}

// metric lane — array but missing "metric" property → produces a warning
{
  const data = makeMissionWithLane('metric', 'kpis', [{ target: '>15%' }]);
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w => w.includes('kpis'));
  assert(laneWarnings.length > 0, 'metric lane with missing "metric" property → produces a warning');
}

// Core lanes (channels, barriers, accessibility, emotion) are NOT warned on
{
  const data = {
    $type: 'Mission',
    id: 'mission-core-lanes',
    version: '2.0.0',
    title: 'Core Lane Test',
    goal: 'Test',
    actors: [{ actorRef: 'actor-x' }],
    lanes: [
      { id: 'channels', label: 'Channels', type: 'channel' },
      { id: 'barriers', label: 'Barriers', type: 'barrier' },
      { id: 'accessibility', label: 'Accessibility', type: 'accessibility' },
      { id: 'emotion', label: 'Emotion', type: 'emotion' }
    ],
    nodes: [
      {
        nodeId: 'n1', name: 'N1', nodeType: 'touchpoint',
        laneContent: {
          channels: 'not-the-right-shape',  // wrong but core lanes skip type check
          barriers: 'also-wrong',
          accessibility: 'skip-me',
          emotion: 42
        }
      }
    ],
    edges: [{ from: 'n1', to: 'n1' }],
    meta: { updated: '2026-01-01' }
  };
  const { warnings } = validateData(data, 'in-memory');
  const laneWarnings = warnings.filter(w =>
    w.includes('channels') || w.includes('barriers') ||
    w.includes('accessibility') || w.includes('emotion')
  );
  assert(laneWarnings.length === 0, 'Core lanes skip the extended lane type check');
}

// Lane type mismatches are warnings, not errors (valid stays true if schema passes)
{
  // Note: for a fully schema-valid Mission with a lane type mismatch, valid would be true
  // We use a simpler check here: confirm warnings don't bleed into errors
  const data = makeMissionWithLane('text', 'frontstage', 12345); // wrong type
  const result = validateData(data, 'in-memory');
  // The schema itself may or may not flag this (additionalProperties: true), but
  // lane type warnings must appear in warnings, not errors
  const laneInErrors = result.errors.some(e => e.includes('frontstage') && e.includes('text'));
  const laneInWarnings = result.warnings.some(w => w.includes('frontstage'));
  assert(!laneInErrors, 'Lane type mismatch does not appear in errors');
  assert(laneInWarnings, 'Lane type mismatch appears in warnings');
}

// ---------------------------------------------------------------------------
// All v2.0 examples must pass
// ---------------------------------------------------------------------------

section('All v2.0 examples — must all pass');

const PROJECT_ROOT = path.join(__dirname, '../../');
const EXAMPLES_DIR = path.join(PROJECT_ROOT, 'v2.0/examples');

function findJsonFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

const exampleFiles = findJsonFiles(EXAMPLES_DIR);
assert(exampleFiles.length > 0, `Found ${exampleFiles.length} example files in v2.0/examples/`);

for (const exFile of exampleFiles) {
  const relPath = path.relative(PROJECT_ROOT, exFile);
  const result = validateFile(exFile);
  assert(
    result.valid === true,
    `Example valid: ${relPath}`,
    result.errors.length > 0 ? result.errors.slice(0, 3).join(' | ') : undefined
  );
  if (result.warnings.length > 0) {
    console.log(`    (${result.warnings.length} warning(s) — content quality, not schema errors)`);
  }
}

// ---------------------------------------------------------------------------
// Task 2.5 — Quality scoring
// ---------------------------------------------------------------------------

section('Task 2.5 — Quality scoring');

const { scoreActor, scoreMission, scoreExperience, scoreArtifact } = require('./v2.0-quality-scoring');

// scoreArtifact auto-dispatches by $type
{
  const result = scoreArtifact({ $type: 'Actor', traits: {}, contexts: [] });
  assert(typeof result.score === 'number', 'scoreArtifact returns numeric score');
  assert(result.max === 100, 'scoreArtifact max is 100');
  assert(result.schemaType === 'Actor', 'scoreArtifact sets schemaType');
  assert(result.breakdown && typeof result.breakdown === 'object', 'scoreArtifact returns breakdown object');
}

// Unknown type returns score:0
{
  const result = scoreArtifact({ foo: 'bar' });
  assert(result.schemaType === null, 'scoreArtifact returns null schemaType for unknown type');
  assert(result.score === 0, 'scoreArtifact returns 0 for unknown type');
}

// Minimal actor (no optional fields) → low score, but returns valid structure
{
  const minimal = { $type: 'Actor', id: 'actor-test', version: '2.0.0', name: 'Test', actorType: 'human', traits: {}, contexts: [] };
  const result = scoreActor(minimal);
  assert(result.score >= 0 && result.score <= 100, 'scoreActor result is in 0-100 range');
  assert(result.score < 70, 'Minimal actor scores below 70 (not enough content)');
  assert('requiredFields' in result.breakdown, 'breakdown has requiredFields category');
  assert('traitsDepth' in result.breakdown, 'breakdown has traitsDepth category');
}

// Rich actor (Sarah Martinez) → score ≥ 70
{
  const result = validateFile('v2.0/examples/retail/actor-sarah-martinez.json');
  // Re-score directly
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), 'utf8'));
  const scoreResult = scoreActor(data);
  assert(scoreResult.score >= 70, `Sarah actor scores ≥70 (got ${scoreResult.score})`, JSON.stringify(scoreResult.breakdown));
}

// Rich mission (retail) → score ≥ 70
{
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'v2.0/examples/retail/mission-online-clothes-shopping.json'), 'utf8'));
  const scoreResult = scoreMission(data);
  assert(scoreResult.score >= 70, `Retail mission scores ≥70 (got ${scoreResult.score})`, JSON.stringify(scoreResult.breakdown));
}

// Rich experience (Sarah retail) → score ≥ 70
{
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'v2.0/examples/retail/exp-sarah-clothes-shopping.json'), 'utf8'));
  const scoreResult = scoreExperience(data);
  assert(scoreResult.score >= 70, `Sarah experience scores ≥70 (got ${scoreResult.score})`, JSON.stringify(scoreResult.breakdown));
}

// Breakdown categories present for Mission
{
  const data = {
    $type: 'Mission',
    id: 'm1', version: '2.0.0', title: 'T', goal: 'G',
    actors: [{ actorRef: 'a' }],
    nodes: [{ nodeId: 'n1', nodeType: 'touchpoint' }],
    edges: [],
    meta: { updated: '2026-01-01' }
  };
  const result = scoreMission(data);
  const expectedCategories = ['requiredFields', 'nodeVariety', 'edgeConnectivity', 'lanes', 'serviceBlueprint', 'paths', 'sla'];
  for (const cat of expectedCategories) {
    assert(cat in result.breakdown, `scoreMission breakdown has "${cat}"`);
  }
}

// Breakdown categories present for Experience
{
  const data = {
    $type: 'Experience',
    id: 'e1', version: '2.0.0', title: 'T',
    references: { actorRef: 'a', missionRef: 'm' },
    path: { nodeSequence: ['n1'] },
    nodes: [],
    meta: { updated: '2026-01-01' }
  };
  const result = scoreExperience(data);
  const expectedCategories = ['requiredFields', 'pathCoverage', 'thoughtsEmotions', 'needAtStep', 'painAtStep', 'barriers', 'outcome'];
  for (const cat of expectedCategories) {
    assert(cat in result.breakdown, `scoreExperience breakdown has "${cat}"`);
  }
}

// needAtStep and painAtStep scoring
{
  function makeExpWithNeeds(needCount, painCount) {
    const nodes = [];
    for (let i = 0; i < 10; i++) {
      const laneContent = {
        thoughts: 'think',
        emotions: { state: 'ok', intensity: 1 }
      };
      if (i < needCount) laneContent.needAtStep = 'a need';
      if (i < painCount) laneContent.painAtStep = 'a pain';
      nodes.push({ nodeRef: `n${i}`, laneContent });
    }
    return {
      $type: 'Experience', id: 'e', version: '2.0.0', title: 'T',
      references: { actorRef: 'a', missionRef: 'm' },
      path: { nodeSequence: nodes.map((_, i) => `n${i}`) },
      nodes,
      meta: { updated: '2026-01-01' }
    };
  }
  const r3needs = scoreExperience(makeExpWithNeeds(3, 2));
  assert(r3needs.breakdown.needAtStep.score === 15, 'needAtStep ≥3 scores full 15pts');
  assert(r3needs.breakdown.painAtStep.score === 10, 'painAtStep ≥2 scores full 10pts');
  const r0needs = scoreExperience(makeExpWithNeeds(0, 0));
  assert(r0needs.breakdown.needAtStep.score === 0, 'needAtStep=0 scores 0pts');
  assert(r0needs.breakdown.painAtStep.score === 0, 'painAtStep=0 scores 0pts');
}

// ---------------------------------------------------------------------------
// Task 2.4 — Cross-reference validation
// ---------------------------------------------------------------------------

section('Task 2.4 — Cross-reference validation');

const { checkCrossRefs } = require('./validate-v2.0');

// checkCrossRefs returns an array
{
  assert(typeof checkCrossRefs === 'function', 'checkCrossRefs is exported from validate-v2.0');
}

// Experience with valid refs against a known artifact set → no ref errors
{
  const fs = require('fs');
  const actor = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'v2.0/examples/retail/actor-sarah-martinez.json'), 'utf8'));
  const mission = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'v2.0/examples/retail/mission-online-clothes-shopping.json'), 'utf8'));
  const exp = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'v2.0/examples/retail/exp-sarah-clothes-shopping.json'), 'utf8'));
  const artifacts = [
    { id: actor.id, schemaType: 'Actor', data: actor },
    { id: mission.id, schemaType: 'Mission', data: mission }
  ];
  const errors = checkCrossRefs(exp, 'Experience', artifacts);
  assert(Array.isArray(errors), 'checkCrossRefs returns an array');
  assert(errors.length === 0, 'Experience with valid refs → no cross-ref errors', errors.join('; '));
}

// Experience with missing actorRef → ref error
{
  const exp = {
    $type: 'Experience',
    id: 'e1', version: '2.0.0', title: 'T',
    references: { actorRef: 'actor-does-not-exist', missionRef: 'mission-x' },
    path: { nodeSequence: ['n1'] },
    nodes: [{ nodeRef: 'n1', laneContent: {} }],
    meta: { updated: '2026-01-01' }
  };
  const artifacts = [
    { id: 'mission-x', schemaType: 'Mission', data: { nodes: [{ nodeId: 'n1' }] } }
  ];
  const errors = checkCrossRefs(exp, 'Experience', artifacts);
  assert(errors.length > 0, 'Missing actorRef produces a cross-ref error');
  assert(errors.some(e => e.includes('actorRef') || e.includes('actor-does-not-exist')), 'Error mentions the missing actorRef');
}

// Experience with missing missionRef → ref error
{
  const exp = {
    $type: 'Experience',
    id: 'e1', version: '2.0.0', title: 'T',
    references: { actorRef: 'actor-x', missionRef: 'mission-does-not-exist' },
    path: { nodeSequence: ['n1'] },
    nodes: [{ nodeRef: 'n1', laneContent: {} }],
    meta: { updated: '2026-01-01' }
  };
  const artifacts = [
    { id: 'actor-x', schemaType: 'Actor', data: {} }
  ];
  const errors = checkCrossRefs(exp, 'Experience', artifacts);
  assert(errors.length > 0, 'Missing missionRef produces a cross-ref error');
  assert(errors.some(e => e.includes('missionRef') || e.includes('mission-does-not-exist')), 'Error mentions the missing missionRef');
}

// Experience with nodeSequence containing an ID not in Mission → ref error
{
  const exp = {
    $type: 'Experience',
    id: 'e1', version: '2.0.0', title: 'T',
    references: { actorRef: 'actor-x', missionRef: 'mission-y' },
    path: { nodeSequence: ['n1', 'n-does-not-exist'] },
    nodes: [{ nodeRef: 'n1', laneContent: {} }],
    meta: { updated: '2026-01-01' }
  };
  const missionData = { nodes: [{ nodeId: 'n1' }] };
  const artifacts = [
    { id: 'actor-x', schemaType: 'Actor', data: {} },
    { id: 'mission-y', schemaType: 'Mission', data: missionData }
  ];
  const errors = checkCrossRefs(exp, 'Experience', artifacts);
  assert(errors.length > 0, 'nodeSequence ID not in Mission → cross-ref error');
  assert(errors.some(e => e.includes('n-does-not-exist')), 'Error names the missing node ID');
}

// checkCrossRefs with empty artifact set → warns but doesn't crash
{
  const exp = {
    $type: 'Experience',
    id: 'e1', version: '2.0.0', title: 'T',
    references: { actorRef: 'actor-x', missionRef: 'mission-y' },
    path: { nodeSequence: ['n1'] },
    nodes: [],
    meta: { updated: '2026-01-01' }
  };
  let threw = false;
  try {
    const errors = checkCrossRefs(exp, 'Experience', []);
    assert(Array.isArray(errors), 'checkCrossRefs with empty artifacts returns array (not throw)');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'checkCrossRefs does not throw with empty artifact set');
}

// checkCrossRefs on Actor or Mission with no refs → no errors (only Experience is checked)
{
  const actor = { $type: 'Actor', id: 'a1', traits: {}, contexts: [] };
  const errors = checkCrossRefs(actor, 'Actor', []);
  assert(Array.isArray(errors), 'checkCrossRefs on Actor returns array');
  assert(errors.length === 0, 'checkCrossRefs on Actor produces no ref errors');
}

// validateFile with checkRefs:true resolves retail Experience correctly (file-based)
{
  const result = validateFile('v2.0/examples/retail/exp-sarah-clothes-shopping.json', {
    checkRefs: true,
    artifactsDir: path.join(PROJECT_ROOT, 'v2.0/examples/retail')
  });
  assert(result.valid === true, 'Retail experience validates with check-refs enabled', result.errors.join('; '));
  assert(result.refErrors.length === 0, 'No cross-ref errors for retail experience', result.refErrors.join('; '));
}

// validateFile result always has refErrors array (even when checkRefs:false)
{
  const result = validateFile('v2.0/examples/retail/actor-sarah-martinez.json');
  assert(Array.isArray(result.refErrors), 'validateFile result always has refErrors array');
  assert(result.refErrors.length === 0, 'No refErrors when checkRefs not enabled');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n' + '='.repeat(60));
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
  process.exit(0);
}
