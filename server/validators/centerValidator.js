import { ValidationError } from '../errors/AppError.js';

// Center facelet indices: U=4, R=13, F=22, D=31, L=40, B=49
const CENTERS = [
  { index: 4, face: 'U' },
  { index: 13, face: 'R' },
  { index: 22, face: 'F' },
  { index: 31, face: 'D' },
  { index: 40, face: 'L' },
  { index: 49, face: 'B' },
];

/**
 * Validate that center facelets match their expected face.
 * Centers don't move on a standard cube, so index 4 must be U, etc.
 */
export function validateCenters(facelets) {
  const errors = [];
  for (const { index, face } of CENTERS) {
    if (facelets[index] !== face) {
      errors.push(`Center ${face} (index ${index}) has "${facelets[index]}" instead of "${face}"`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Center facelets must match their face: ${errors.join('; ')}`,
      'centers'
    );
  }
}
