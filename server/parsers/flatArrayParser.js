import { ParseError } from '../errors/AppError.js';
import { normalizeFacelets } from '../normalizers/colorNormalizer.js';

/**
 * Parse a flat 54-element array in URFDLB order.
 */
export function parseFlatArray(input) {
  if (!Array.isArray(input)) {
    throw new ParseError('flatArray must be an array');
  }
  if (input.length !== 54) {
    throw new ParseError(`flatArray must have exactly 54 elements, got ${input.length}`);
  }

  return normalizeFacelets(input);
}
