import { validateStructure } from './structureValidator.js';
import { validateCounts } from './countValidator.js';
import { validateCenters } from './centerValidator.js';
import { validateParity } from './parityValidator.js';
import { CubeState } from '../domain/CubeState.js';

/**
 * Run all validators in order and return a validated CubeState.
 * Each step depends on the previous passing.
 * Order: structure → counts → centers → parity
 */
export function validate(facelets) {
  validateStructure(facelets);
  validateCounts(facelets);
  validateCenters(facelets);
  validateParity(facelets);
  return new CubeState(facelets);
}
