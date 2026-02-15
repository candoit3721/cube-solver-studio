import { solveKociemba, isKociembaReady } from './kociembaAdapter.js';
import { solveWithLayered } from './layeredAdapter.js';
import { verifySolution, isSolved } from '../../src/engine/cubeState.js';
import { SolverError } from '../errors/AppError.js';

/**
 * Unified solver dispatch. Routes to the appropriate solver based on method.
 * Verifies the solution after solving.
 *
 * @param {string[]} facelets - 54-element facelet array
 * @param {string} method - "optimal" (kociemba) or "beginner" (layered)
 * @returns {object} Solution result
 */
export function solve(facelets, method = 'optimal') {
  const startTime = Date.now();

  if (isSolved(facelets)) {
    return {
      solved: true,
      alreadySolved: true,
      moves: [],
      moveCount: 0,
      movesString: '',
      method: method === 'optimal' ? 'kociemba' : 'layered',
      phases: null,
      elapsedMs: Date.now() - startTime,
    };
  }

  let result;
  let solverName;

  if (method === 'beginner') {
    result = solveWithLayered(facelets);
    solverName = 'layered';
  } else {
    if (!isKociembaReady()) {
      throw new SolverError('Kociemba solver is not ready yet. Try again shortly.');
    }
    result = solveKociemba(facelets);
    solverName = 'kociemba';
  }

  // Verify the solution
  if (result.moves.length > 0 && !verifySolution(facelets, result.moves)) {
    throw new SolverError(`Solver produced an invalid solution (${solverName}). The moves do not solve the cube.`);
  }

  return {
    solved: true,
    alreadySolved: false,
    moves: result.moves,
    moveCount: result.moveCount,
    movesString: result.moves.join(' '),
    method: solverName,
    phases: result.phases || null,
    elapsedMs: Date.now() - startTime,
  };
}

export const SUPPORTED_METHODS = ['optimal', 'beginner'];
