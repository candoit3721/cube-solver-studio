import { ParseError } from '../errors/AppError.js';
import { createSolvedState, applyMoves } from '../../src/engine/cubeState.js';

const VALID_MOVES = new Set([
  'U', "U'", 'U2', 'D', "D'", 'D2',
  'R', "R'", 'R2', 'L', "L'", 'L2',
  'F', "F'", 'F2', 'B', "B'", 'B2',
]);

/**
 * Parse a scramble (moves applied to a solved cube).
 * Accepts a string like "R U R' U'" or an array ["R", "U", "R'", "U'"].
 * Returns a 54-element facelet array representing the scrambled state.
 */
export function parseScramble(input) {
  let moves;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new ParseError('scramble string is empty');
    }
    moves = trimmed.split(/\s+/);
  } else if (Array.isArray(input)) {
    if (input.length === 0) {
      throw new ParseError('scramble array is empty');
    }
    moves = input;
  } else {
    throw new ParseError('scramble must be a string or array of moves');
  }

  for (const move of moves) {
    if (!VALID_MOVES.has(move)) {
      throw new ParseError(`Invalid move: "${move}"`);
    }
  }

  return applyMoves(createSolvedState(), moves);
}
