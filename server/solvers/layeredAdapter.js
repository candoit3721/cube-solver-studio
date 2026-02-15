import { solveLayered } from '../../src/engine/layeredSolver.js';
import { SolverError } from '../errors/AppError.js';

/**
 * Solve using the beginner's layered method.
 * Input: 54-element facelet array.
 * Returns: { moves: string[], moveCount: number, phases: Array }
 */
export function solveWithLayered(facelets) {
  const state = [...facelets];
  const result = solveLayered(state);

  if (result.error) {
    throw new SolverError(`Layered solver failed: ${result.error}`);
  }

  return {
    moves: result.moves,
    moveCount: result.moves.length,
    phases: result.phases.map(p => ({
      name: p.name,
      moves: p.moves,
      moveCount: p.moves.length,
    })),
  };
}
