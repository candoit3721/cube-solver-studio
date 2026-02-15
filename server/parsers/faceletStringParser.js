import { ParseError } from '../errors/AppError.js';
import { normalizeFacelets } from '../normalizers/colorNormalizer.js';

/**
 * Parse a 54-character facelet string in URFDLB order.
 * Each character represents a face color.
 */
export function parseFaceletString(input) {
  if (typeof input !== 'string') {
    throw new ParseError('faceletString must be a string');
  }
  const trimmed = input.trim();
  if (trimmed.length !== 54) {
    throw new ParseError(`faceletString must be exactly 54 characters, got ${trimmed.length}`);
  }

  return normalizeFacelets(trimmed.split(''));
}
