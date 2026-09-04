// theme.js — design tokens + optional brand override for the PPTX renderer (spec §3).
// Unknown keys in an override are WARNED, not silently ignored (the BACK-033 lesson).

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TOKENS = require('../../design-tokens.json');
const FALLBACK_FONT = 'Calibri';
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));

function mergeTheme(base, override, prefix = '') {
  const merged = clone(base);
  const unknownKeys = [];
  const walk = (dst, src, pfx) => {
    for (const [k, v] of Object.entries(src)) {
      const p = pfx ? `${pfx}.${k}` : k;
      const exempt = /^typography\.metrics\.[^.]+$/.test(p);       // brands may add their own font's metrics
      if (!(k in dst) && !exempt) unknownKeys.push(p);
      if (isObj(v) && isObj(dst[k])) walk(dst[k], v, p);
      else dst[k] = isObj(v) ? clone(v) : v;
    }
  };
  walk(merged, override, prefix);
  return { merged, unknownKeys };
}

function resolveMetrics(theme) {
  const ff = theme.typography.fontFamily;
  return theme.typography.metrics[ff] || theme.typography.metrics[FALLBACK_FONT];
}

function loadTheme(themePath) {
  const warnings = [];
  if (!themePath) return { theme: clone(DEFAULT_TOKENS), warnings };
  let override;
  try {
    override = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  } catch (e) {
    const err = new Error(`theme "${path.basename(themePath)}" could not be read or parsed: ${e.message}`);
    err.code = 'THEME_UNREADABLE';
    throw err;
  }
  const { merged, unknownKeys } = mergeTheme(DEFAULT_TOKENS, override);
  for (const k of unknownKeys) warnings.push({ code: 'THEME_UNKNOWN_KEY', message: `theme key "${k}" is not a known token and will have no effect on defaults` });
  const ff = merged.typography.fontFamily;
  if (!merged.typography.metrics[ff]) {
    warnings.push({ code: 'THEME_METRICS_FALLBACK', message: `no font metrics for "${ff}"; using ${FALLBACK_FONT}'s for height estimation — add typography.metrics.${JSON.stringify(ff)} to the theme` });
  }
  return { theme: merged, warnings };
}

module.exports = { loadTheme, mergeTheme, resolveMetrics, DEFAULT_TOKENS, FALLBACK_FONT };
