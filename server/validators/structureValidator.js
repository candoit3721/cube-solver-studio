import { ValidationError } from '../errors/AppError.js';

const VALID_FACES = new Set(['U', 'R', 'F', 'D', 'L', 'B']);

/**
 * Validate basic structure: must be an array of 54 valid face letters.
 */
export function validateStructure(facelets) {
  if (!Array.isArray(facelets)) {
    throw new ValidationError('Facelets must be an array', 'structure');
  }
  if (facelets.length !== 54) {
    throw new ValidationError(`Expected 54 facelets, got ${facelets.length}`, 'structure');
  }
  for (let i = 0; i < 54; i++) {
    if (!VALID_FACES.has(facelets[i])) {
      throw new ValidationError(`Invalid face letter "${facelets[i]}" at index ${i}`, 'structure');
    }
  }
}
