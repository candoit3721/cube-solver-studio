import Cube from 'cubejs';
import { SolverError } from '../errors/AppError.js';

let initialized = false;

/**
 * Initialize the Kociemba solver tables. Call once at server startup.
 * Takes ~2-5 seconds to build pruning tables.
 */
export function initKociemba() {
  if (initialized) return;
  Cube.initSolver();
  initialized = true;
}

/**
 * Check if the Kociemba solver is ready.
 */
export function isKociembaReady() {
  return initialized;
}

/**
 * Solve using the Kociemba (two-phase) algorithm via cubejs.
 * Input: 54-element facelet array in URFDLB order.
 * Returns: { moves: string[], moveCount: number }
 */
export function solveKociemba(facelets) {
  if (!initialized) {
    throw new SolverError('Kociemba solver not initialized. Call initKociemba() first.');
  }

  const faceletStr = facelets.join('');
  let cube;
  try {
    cube = Cube.fromString(faceletStr);
  } catch (err) {
    throw new SolverError(`Failed to create cube from facelets: ${err.message}`);
  }

  let solution;
  try {
    solution = cube.solve(22);
  } catch (err) {
    throw new SolverError(`Kociemba solver failed: ${err.message}`);
  }

  if (!solution || solution === '') {
    return { moves: [], moveCount: 0 };
  }

  const moves = solution.trim().split(/\s+/);
  return { moves, moveCount: moves.length };
}
