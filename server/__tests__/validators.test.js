import { describe, it, expect } from 'vitest';
import { validate } from '../validators/validationPipeline.js';
import { createSolvedState, applyMoves } from '../../src/engine/cubeState.js';

const SOLVED = createSolvedState();

describe('validators', () => {
  it('accepts a solved cube', () => {
    const cubeState = validate(SOLVED);
    expect(cubeState.isSolved()).toBe(true);
  });

  it('accepts a scrambled but valid cube', () => {
    const scrambled = applyMoves(SOLVED, ['R', 'U', "R'", "U'"]);
    const cubeState = validate(scrambled);
    expect(cubeState.isSolved()).toBe(false);
    expect(cubeState.facelets.length).toBe(54);
  });

  it('rejects wrong length', () => {
    expect(() => validate(SOLVED.slice(0, 53))).toThrow('54');
  });

  it('rejects invalid face letters', () => {
    const bad = [...SOLVED];
    bad[0] = 'X';
    expect(() => validate(bad)).toThrow('Invalid face letter');
  });

  it('rejects wrong color counts', () => {
    const bad = [...SOLVED];
    // Replace a U with an R (10 R's, 8 U's)
    bad[0] = 'R';
    expect(() => validate(bad)).toThrow('Each color must appear exactly 9 times');
  });

  it('rejects wrong centers', () => {
    const bad = [...SOLVED];
    // Swap centers of U (index 4) and D (index 31)
    bad[4] = 'D';
    bad[31] = 'U';
    // Fix counts: also swap two non-center pieces
    bad[0] = 'D';
    bad[27] = 'U';
    expect(() => validate(bad)).toThrow('Center facelets');
  });

  it('rejects flipped edge (edge parity)', () => {
    const bad = [...SOLVED];
    // Flip the UF edge: swap facelets at indices 7 and 19
    bad[7] = 'F';
    bad[19] = 'U';
    expect(() => validate(bad)).toThrow('Edge parity error');
  });

  it('rejects twisted corner (corner parity)', () => {
    const bad = [...SOLVED];
    // Twist UFR corner: rotate the 3 stickers at [8, 20, 9]
    // Solved: [8]=U, [20]=F, [9]=R → twist to [8]=R, [20]=U, [9]=F
    bad[8] = 'R';
    bad[20] = 'U';
    bad[9] = 'F';
    expect(() => validate(bad)).toThrow('Corner orientation parity');
  });

  it('rejects swapped edges (permutation parity)', () => {
    const bad = [...SOLVED];
    // Swap two edges: UF (7,19) and UR (5,10)
    bad[7] = SOLVED[5];
    bad[19] = SOLVED[10];
    bad[5] = SOLVED[7];
    bad[10] = SOLVED[19];
    expect(() => validate(bad)).toThrow('Permutation parity');
  });
});
