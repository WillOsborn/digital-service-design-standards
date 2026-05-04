// v2.0 Validator with auto-detection, YAML support, and lane type validation
// Supports: Actor, Mission, Experience
// Usage: node validate-v2.0.js path/to/file.json [or .yaml/.yml]

'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Resolve schema directory relative to project root (two levels up from this file:
// tools/validators -> tools -> schemas root -> v2.0/schemas)
const PROJECT_ROOT = path.join(__dirname, '../../');
const SCHEMA_DIR = path.join(PROJECT_ROOT, 'v2.0/schemas');

// Compile schemas ONCE at module load (avoid per-call Ajv instantiation)
const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
addFormats(ajv);

const validators = {
  Actor: ajv.compile(JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'actor.schema.json'), 'utf8'))),
  Mission: ajv.compile(JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'mission.schema.json'), 'utf8'))),
  Experience: ajv.compile(JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, 'experience.schema.json'), 'utf8')))
};

// Core lane IDs — schema validates these directly; skip lane-type check for them
const CORE_LANE_IDS = new Set(['channels', 'barriers', 'accessibility', 'emotion', 'emotions']);

/**
 * Load a file, parsing YAML or JSON based on extension.
 * @param {string} filePath - Absolute or relative path to file
 * @returns {Object} Parsed data
 */
function loadFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') {
    // Lazy-require js-yaml so the module still loads if js-yaml isn't installed
    // (JSON-only usage will still work)
    let yaml;
    try {
      yaml = require('js-yaml');
    } catch (e) {
      throw new Error('js-yaml is required for YAML file support. Run: npm install js-yaml');
    }
    return yaml.load(raw);
  }
  return JSON.parse(raw);
}

/**
 * Auto-detect schema type from the data.
 * Primary: $type field.
 * Fallback: structural heuristics.
 * @param {Object} data
 * @returns {'Actor'|'Mission'|'Experience'|null}
 */
function detectSchemaType(data) {
  if (data.$type === 'Actor') return 'Actor';
  if (data.$type === 'Mission') return 'Mission';
  if (data.$type === 'Experience') return 'Experience';

  // Heuristic fallbacks
  if (data.traits && data.contexts) return 'Actor';
  if (data.nodes && data.edges) return 'Mission';
  if (data.references && data.path) return 'Experience';

  return null;
}

/**
 * Validate lane content types for extended (non-core) lanes on a Mission or Experience.
 *
 * Rules:
 *   text   → laneContent[laneId] must be a string
 *   list   → laneContent[laneId] must be an array of strings
 *   metric → laneContent[laneId] must be an array of {metric, target} objects
 *
 * Core lanes (channels, barriers, accessibility, emotion) are schema-validated
 * already and are skipped here.
 *
 * Returns violations as warnings (not errors) — mismatched types are a content
 * issue, not a schema failure.
 *
 * @param {Object} data - Parsed artifact
 * @returns {string[]} Array of warning strings
 */
function validateLaneTypes(data) {
  const warnings = [];

  const lanes = data.lanes;
  if (!Array.isArray(lanes) || lanes.length === 0) return warnings;

  // Build a map of extended lane id → declared type
  const extendedLanes = {};
  for (const lane of lanes) {
    if (lane.id && lane.type && !CORE_LANE_IDS.has(lane.id)) {
      extendedLanes[lane.id] = lane.type;
    }
  }

  if (Object.keys(extendedLanes).length === 0) return warnings;

  // Collect all nodes to check (Mission nodes or Experience nodes)
  const nodes = data.nodes;
  if (!Array.isArray(nodes)) return warnings;

  nodes.forEach((node, idx) => {
    const nodeId = node.nodeId || node.nodeRef || `node[${idx}]`;
    const laneContent = node.laneContent;
    if (!laneContent || typeof laneContent !== 'object') return;

    for (const [laneId, declaredType] of Object.entries(extendedLanes)) {
      if (!(laneId in laneContent)) continue; // Not populated — fine

      const value = laneContent[laneId];

      switch (declaredType) {
        case 'text':
          if (typeof value !== 'string') {
            warnings.push(
              `Lane type mismatch at node "${nodeId}", lane "${laneId}": ` +
              `declared type "text" expects a string, got ${Array.isArray(value) ? 'array' : typeof value}`
            );
          }
          break;

        case 'list':
          if (!Array.isArray(value)) {
            warnings.push(
              `Lane type mismatch at node "${nodeId}", lane "${laneId}": ` +
              `declared type "list" expects an array of strings, got ${typeof value}`
            );
          } else {
            value.forEach((item, i) => {
              if (typeof item !== 'string') {
                warnings.push(
                  `Lane type mismatch at node "${nodeId}", lane "${laneId}[${i}]": ` +
                  `declared type "list" expects strings, got ${typeof item}`
                );
              }
            });
          }
          break;

        case 'metric':
          if (!Array.isArray(value)) {
            warnings.push(
              `Lane type mismatch at node "${nodeId}", lane "${laneId}": ` +
              `declared type "metric" expects an array of {metric, target} objects, got ${typeof value}`
            );
          } else {
            value.forEach((item, i) => {
              if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                warnings.push(
                  `Lane type mismatch at node "${nodeId}", lane "${laneId}[${i}]": ` +
                  `declared type "metric" expects {metric, target} objects, got ${typeof item}`
                );
              } else if (!('metric' in item)) {
                warnings.push(
                  `Lane type mismatch at node "${nodeId}", lane "${laneId}[${i}]": ` +
                  `declared type "metric" requires a "metric" property`
                );
              }
            });
          }
          break;

        // Other types (channel, barrier, accessibility, emotion) are core and skipped
        default:
          break;
      }
    }
  });

  return warnings;
}

/**
 * Validate a single parsed data object against its schema type.
 * @param {Object} data - Parsed artifact
 * @param {string} filePath - Source path (for error reporting)
 * @returns {{ valid: boolean, schemaType: string|null, errors: string[], warnings: string[] }}
 */
function validateData(data, filePath) {
  const errors = [];
  const warnings = [];

  const schemaType = detectSchemaType(data);
  if (!schemaType) {
    return {
      valid: false,
      schemaType: null,
      errors: [
        'Could not detect schema type. ' +
        'Ensure $type is one of: Actor, Mission, Experience, ' +
        'or that the document has the expected structural fields.'
      ],
      warnings
    };
  }

  // Schema validation
  const validate = validators[schemaType];
  const schemaValid = validate(data);

  if (!schemaValid && validate.errors) {
    validate.errors.forEach(err => {
      const loc = err.instancePath || 'root';
      errors.push(`${loc}: ${err.message}`);
    });
  }

  // Lane type validation (second pass, warnings only)
  if (schemaType === 'Mission' || schemaType === 'Experience') {
    const laneWarnings = validateLaneTypes(data);
    warnings.push(...laneWarnings);
  }

  return {
    valid: errors.length === 0,
    schemaType,
    errors,
    warnings
  };
}

/**
 * Validate a file (JSON or YAML) against v2.0 schemas.
 * @param {string} filePath - Path to file (relative paths resolved from cwd)
 * @returns {{ valid: boolean, schemaType: string|null, errors: string[], warnings: string[] }}
 */
function validateFile(filePath) {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  let data;
  try {
    data = loadFile(resolvedPath);
  } catch (err) {
    return {
      valid: false,
      schemaType: null,
      errors: [`Failed to load file: ${err.message}`],
      warnings: []
    };
  }

  return validateData(data, resolvedPath);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node validate-v2.0.js <file.json|file.yaml> [file2 ...]');
    console.log('\nv2.0 Validator — auto-detects Actor, Mission, or Experience');
    console.log('\nExamples:');
    console.log('  node validate-v2.0.js v2.0/examples/retail/actor-sarah-martinez.json');
    console.log('  node validate-v2.0.js my-actor.yaml');
    process.exit(args.length === 0 ? 1 : 0);
  }

  let allValid = true;

  for (const filePath of args) {
    console.log(`\nValidating: ${filePath}`);
    const result = validateFile(filePath);

    console.log(`  Type: ${result.schemaType || 'unknown'}`);
    console.log(`  Valid: ${result.valid}`);

    if (result.errors.length > 0) {
      console.log(`  Errors (${result.errors.length}):`);
      result.errors.forEach(e => console.log(`    - ${e}`));
      allValid = false;
    }

    if (result.warnings.length > 0) {
      console.log(`  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(w => console.log(`    - ${w}`));
    }

    if (result.valid) {
      console.log('  PASS');
    } else {
      console.log('  FAIL');
    }
  }

  process.exit(allValid ? 0 : 1);
}

module.exports = { validateFile, validateData, detectSchemaType };
