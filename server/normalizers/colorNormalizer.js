import { ParseError } from '../errors/AppError.js';

// Map color names and letters to canonical face letters
const COLOR_MAP = {
  // Face letters (already canonical)
  U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B',
  // Lowercase
  u: 'U', r: 'R', f: 'F', d: 'D', l: 'L', b: 'B',
  // Color letters
  W: 'U', G: 'F', Y: 'D', O: 'L',
  w: 'U', g: 'F', y: 'D', o: 'L',
  // Red → R, Blue → B (ambiguous single letters handled by context)
  // Full color names
  white: 'U',
  red: 'R',
  green: 'F',
  yellow: 'D',
  orange: 'L',
  blue: 'B',
};

/**
 * Normalize a single color token to a canonical face letter (U/R/F/D/L/B).
 */
export function normalizeColor(token) {
  if (typeof token !== 'string') {
    throw new ParseError(`Invalid color value: ${token}`);
  }
  const trimmed = token.trim().toLowerCase();
  // Try exact match first (preserves case for single chars)
  const exact = COLOR_MAP[token];
  if (exact) return exact;
  // Try lowercase match
  const lower = COLOR_MAP[trimmed];
  if (lower) return lower;

  throw new ParseError(`Unknown color: "${token}"`);
}

/**
 * Normalize an array of 54 color tokens to canonical face letters.
 */
export function normalizeFacelets(facelets) {
  return facelets.map(normalizeColor);
}
