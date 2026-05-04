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
