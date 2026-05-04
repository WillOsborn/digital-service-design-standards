// v2.0 Validator with auto-detection, YAML support, lane type validation,
// cross-reference validation, and quality scoring.
// Supports: Actor, Mission, Experience
//
// Usage (single file):
//   node validate-v2.0.js v2.0/examples/retail/actor-sarah-martinez.json
//
// Usage (batch / directory):
//   node validate-v2.0.js v2.0/examples/retail/
//   node validate-v2.0.js v2.0/examples/ --check-refs
//   node validate-v2.0.js file.json --schema-dir v2.0/schemas/

'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Resolve schema directory relative to project root (two levels up from this file:
// tools/validators -> tools -> schemas root -> v2.0/schemas)
const PROJECT_ROOT = path.join(__dirname, '../../');
let SCHEMA_DIR = path.join(PROJECT_ROOT, 'v2.0/schemas');

// Quality scoring module (loaded lazily to allow schema dir override)
const scoring = require('./v2.0-quality-scoring');

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
 * Check cross-references for an Experience artifact against a known artifact set.
 * Verifies:
 *   - references.actorRef resolves to an Actor in the artifact set
 *   - references.missionRef resolves to a Mission in the artifact set
 *   - path.nodeSequence IDs all exist in the referenced Mission's nodes
 *
 * For Actor and Mission, no cross-reference checking is performed (returns []).
 *
 * @param {Object} data - Parsed artifact
 * @param {string} schemaType - 'Actor', 'Mission', or 'Experience'
 * @param {Array<{id: string, schemaType: string, data: Object}>} artifacts - Known artifacts
 * @returns {string[]} Cross-reference error messages
 */
function checkCrossRefs(data, schemaType, artifacts) {
  if (schemaType !== 'Experience') return [];

  const errors = [];
  const refs = (data.references) || {};
  const actorRef = refs.actorRef;
  const missionRef = refs.missionRef;

  // Find referenced Actor
  const actorArtifact = actorRef
    ? artifacts.find(a => a.id === actorRef && a.schemaType === 'Actor')
    : null;

  if (actorRef && !actorArtifact) {
    errors.push(`Cross-ref: actorRef "${actorRef}" not found in artifact set`);
  }

  // Find referenced Mission
  const missionArtifact = missionRef
    ? artifacts.find(a => a.id === missionRef && a.schemaType === 'Mission')
    : null;

  if (missionRef && !missionArtifact) {
    errors.push(`Cross-ref: missionRef "${missionRef}" not found in artifact set`);
  }

  // Check nodeSequence IDs exist in the Mission
  if (missionArtifact) {
    const missionNodeIds = new Set(
      (missionArtifact.data.nodes || []).map(n => n.nodeId).filter(Boolean)
    );
    const nodeSeq = (data.path && Array.isArray(data.path.nodeSequence))
      ? data.path.nodeSequence
      : [];

    for (const nodeId of nodeSeq) {
      if (!missionNodeIds.has(nodeId)) {
        errors.push(`Cross-ref: nodeSequence ID "${nodeId}" does not exist in mission "${missionRef}"`);
      }
    }

    // Also check nodes[].nodeRef
    const expNodes = Array.isArray(data.nodes) ? data.nodes : [];
    for (const node of expNodes) {
      const ref = node.nodeRef;
      if (ref && !missionNodeIds.has(ref)) {
        errors.push(`Cross-ref: nodes[].nodeRef "${ref}" does not exist in mission "${missionRef}"`);
      }
    }
  }

  return errors;
}

/**
 * Load all JSON/YAML files from a directory tree as an artifact set.
 * Returns an array of { id, schemaType, data } objects.
 * @param {string} dirPath - Directory to scan
 * @returns {Array<{id: string, schemaType: string, data: Object}>}
 */
function loadArtifactSet(dirPath) {
  const artifacts = [];
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (_) {
    return artifacts;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      artifacts.push(...loadArtifactSet(fullPath));
    } else if (/\.(json|yaml|yml)$/.test(entry.name)) {
      try {
        const data = loadFile(fullPath);
        const schemaType = detectSchemaType(data);
        if (schemaType && data.id) {
          artifacts.push({ id: data.id, schemaType, data });
        }
      } catch (_) {
        // Skip unreadable or non-artifact files
      }
    }
  }
  return artifacts;
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
 * @param {Object} [options]
 * @param {boolean} [options.checkRefs] - Run cross-reference validation
 * @param {string}  [options.artifactsDir] - Directory to scan for reference artifacts
 * @param {Array}   [options.artifacts] - Pre-loaded artifact set (overrides artifactsDir)
 * @returns {{ valid: boolean, schemaType: string|null, errors: string[], warnings: string[], refErrors: string[], quality: Object|null }}
 */
function validateFile(filePath, options) {
  const opts = options || {};
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
      warnings: [],
      refErrors: [],
      quality: null
    };
  }

  const result = validateData(data, resolvedPath);

  // Quality scoring
  result.quality = scoring.scoreArtifact(data);

  // Cross-reference validation
  result.refErrors = [];
  if (opts.checkRefs && result.schemaType) {
    let artifacts = opts.artifacts;
    if (!artifacts) {
      const searchDir = opts.artifactsDir || path.dirname(resolvedPath);
      artifacts = loadArtifactSet(searchDir);
    }
    result.refErrors = checkCrossRefs(data, result.schemaType, artifacts);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Batch validation — collect all JSON/YAML files from a path (file or dir)
// ---------------------------------------------------------------------------

/**
 * Collect all JSON/YAML file paths under a path (file or directory).
 * @param {string} targetPath
 * @returns {string[]} Absolute file paths
 */
function collectFiles(targetPath) {
  const resolved = path.isAbsolute(targetPath)
    ? targetPath
    : path.join(process.cwd(), targetPath);

  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch (_) {
    return [resolved]; // Will fail gracefully in validateFile
  }

  if (stat.isFile()) return [resolved];

  // Directory: recurse
  const results = [];
  const entries = fs.readdirSync(resolved, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(resolved, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (/\.(json|yaml|yml)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log('Usage: node validate-v2.0.js <file|dir> [file|dir ...] [options]');
    console.log('\nv2.0 Validator — auto-detects Actor, Mission, or Experience');
    console.log('\nOptions:');
    console.log('  --check-refs          Validate cross-references (actorRef, missionRef, nodeSequence IDs)');
    console.log('  --schema-dir <dir>    Override schema directory (default: v2.0/schemas/)');
    console.log('\nExamples:');
    console.log('  node validate-v2.0.js v2.0/examples/retail/actor-sarah-martinez.json');
    console.log('  node validate-v2.0.js v2.0/examples/retail/');
    console.log('  node validate-v2.0.js v2.0/examples/ --check-refs');
    console.log('  node validate-v2.0.js file.json --schema-dir v2.0/schemas/');
    process.exit(rawArgs.length === 0 ? 1 : 0);
  }

  // Parse flags
  const checkRefs = rawArgs.includes('--check-refs');
  let schemaDir = null;
  const targets = [];

  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === '--check-refs') continue;
    if (rawArgs[i] === '--schema-dir') {
      schemaDir = rawArgs[++i];
      continue;
    }
    targets.push(rawArgs[i]);
  }

  // Override schema directory if requested
  if (schemaDir) {
    const overrideDir = path.isAbsolute(schemaDir) ? schemaDir : path.join(process.cwd(), schemaDir);
    try {
      // Re-compile schemas from the override directory
      const ajvNew = new (require('ajv'))({ allErrors: true, strict: false, validateSchema: false });
      require('ajv-formats')(ajvNew);
      validators.Actor = ajvNew.compile(JSON.parse(fs.readFileSync(path.join(overrideDir, 'actor.schema.json'), 'utf8')));
      validators.Mission = ajvNew.compile(JSON.parse(fs.readFileSync(path.join(overrideDir, 'mission.schema.json'), 'utf8')));
      validators.Experience = ajvNew.compile(JSON.parse(fs.readFileSync(path.join(overrideDir, 'experience.schema.json'), 'utf8')));
    } catch (err) {
      console.error(`Error loading schemas from ${overrideDir}: ${err.message}`);
      process.exit(1);
    }
  }

  // Collect all files to validate
  const filePaths = [];
  for (const target of targets) {
    filePaths.push(...collectFiles(target));
  }

  if (filePaths.length === 0) {
    console.error('No files found to validate.');
    process.exit(1);
  }

  // Load full artifact set for cross-ref checking (spans all target dirs)
  let artifactSet = [];
  if (checkRefs) {
    const dirsToScan = new Set();
    for (const target of targets) {
      const resolved = path.isAbsolute(target) ? target : path.join(process.cwd(), target);
      let stat;
      try { stat = fs.statSync(resolved); } catch (_) { continue; }
      dirsToScan.add(stat.isDirectory() ? resolved : path.dirname(resolved));
    }
    for (const dir of dirsToScan) {
      artifactSet.push(...loadArtifactSet(dir));
    }
  }

  let allValid = true;
  let passCount = 0;
  let failCount = 0;

  for (const filePath of filePaths) {
    const relPath = path.relative(process.cwd(), filePath);
    console.log(`\nValidating: ${relPath}`);

    const result = validateFile(filePath, { checkRefs, artifacts: checkRefs ? artifactSet : undefined });

    console.log(`  Type:    ${result.schemaType || 'unknown'}`);

    if (result.quality) {
      console.log(`  Quality: ${result.quality.score}/${result.quality.max}`);
    }

    if (result.errors.length > 0) {
      console.log(`  Errors (${result.errors.length}):`);
      result.errors.forEach(e => console.log(`    - ${e}`));
      allValid = false;
    }

    if (result.refErrors && result.refErrors.length > 0) {
      console.log(`  Ref Errors (${result.refErrors.length}):`);
      result.refErrors.forEach(e => console.log(`    - ${e}`));
      allValid = false;
    }

    if (result.warnings.length > 0) {
      console.log(`  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(w => console.log(`    - ${w}`));
    }

    const fileValid = result.valid && (result.refErrors ? result.refErrors.length === 0 : true);
    console.log(`  ${fileValid ? 'PASS' : 'FAIL'}`);
    if (fileValid) passCount++; else { failCount++; allValid = false; }
  }

  if (filePaths.length > 1) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`  Batch result: ${passCount} passed, ${failCount} failed`);
    console.log('='.repeat(40));
  }

  process.exit(allValid ? 0 : 1);
}

module.exports = { validateFile, validateData, detectSchemaType, checkCrossRefs };
