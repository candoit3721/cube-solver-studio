import { describe, it, expect, beforeAll } from 'vitest';
import { solve } from '../solvers/solverAdapter.js';
import { initKociemba } from '../solvers/kociembaAdapter.js';
import { createSolvedState, applyMoves, verifySolution } from '../../src/engine/cubeState.js';

const SOLVED = createSolvedState();

beforeAll(() => {
  initKociemba();
});

describe('solverAdapter', () => {
  describe('already solved', () => {
    it('detects already-solved cube', () => {
      const result = solve(SOLVED, 'optimal');
      expect(result.alreadySolved).toBe(true);
      expect(result.moves).toEqual([]);
      expect(result.moveCount).toBe(0);
    });
  });

  describe('kociemba (optimal)', () => {
    it('solves a simple scramble', () => {
      const scrambled = applyMoves(SOLVED, ['R', 'U', "R'", "U'"]);
      const result = solve(scrambled, 'optimal');
      expect(result.solved).toBe(true);
      expect(result.method).toBe('kociemba');
      expect(result.moveCount).toBeGreaterThan(0);
      expect(verifySolution(scrambled, result.moves)).toBe(true);
    });

    it('solves a longer scramble', () => {
      const scrambled = applyMoves(SOLVED, ['R', 'U', 'F2', "L'", 'D', "B'"]);
      const result = solve(scrambled, 'optimal');
      expect(result.solved).toBe(true);
      expect(verifySolution(scrambled, result.moves)).toBe(true);
    });
  });

  describe('layered (beginner)', () => {
    it('solves a simple scramble', () => {
      const scrambled = applyMoves(SOLVED, ['R', 'U', "R'", "U'"]);
      const result = solve(scrambled, 'beginner');
      expect(result.solved).toBe(true);
      expect(result.method).toBe('layered');
      expect(result.phases).not.toBeNull();
      expect(result.phases.length).toBeGreaterThan(0);
      expect(verifySolution(scrambled, result.moves)).toBe(true);
    });

    it('returns phase information', () => {
      const scrambled = applyMoves(SOLVED, ['R', 'U', 'F2']);
      const result = solve(scrambled, 'beginner');
      expect(result.phases).toBeInstanceOf(Array);
      for (const phase of result.phases) {
        expect(phase).toHaveProperty('name');
        expect(phase).toHaveProperty('moves');
        expect(phase).toHaveProperty('moveCount');
      }
    });
  });
});
