import { ValidationError } from '../errors/AppError.js';

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Validate that each face color appears exactly 9 times.
 */
export function validateCounts(facelets) {
  const counts = {};
  for (const f of FACES) counts[f] = 0;

  for (const c of facelets) {
    counts[c] = (counts[c] || 0) + 1;
  }

  const errors = [];
  for (const f of FACES) {
    if (counts[f] !== 9) {
      errors.push(`${f}: ${counts[f]}`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Each color must appear exactly 9 times. Found: ${errors.join(', ')}`,
      'colorCount'
    );
  }
}
