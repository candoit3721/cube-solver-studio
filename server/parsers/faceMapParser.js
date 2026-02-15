import { ParseError } from '../errors/AppError.js';
import { normalizeFacelets } from '../normalizers/colorNormalizer.js';

const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Parse a faceMap object: { U: [...9], R: [...9], F: [...9], D: [...9], L: [...9], B: [...9] }
 * Returns a normalized 54-element facelet array in URFDLB order.
 */
export function parseFaceMap(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ParseError('faceMap must be a non-null object');
  }

  const facelets = [];
  for (const face of FACE_ORDER) {
    const arr = input[face];
    if (!Array.isArray(arr) || arr.length !== 9) {
      throw new ParseError(`Face "${face}" must be an array of 9 elements`);
    }
    facelets.push(...arr);
  }

  return normalizeFacelets(facelets);
}
