import { describe, it, expect } from 'vitest';
import { parseCube } from '../parsers/index.js';
import { createSolvedState } from '../../src/engine/cubeState.js';

const SOLVED = createSolvedState();
const SOLVED_STR = SOLVED.join('');

describe('parsers', () => {
  describe('faceletString', () => {
    it('parses a solved cube string', () => {
      const { facelets, detectedFormat } = parseCube(SOLVED_STR, 'faceletString');
      expect(facelets).toEqual(SOLVED);
      expect(detectedFormat).toBe('faceletString');
    });

    it('auto-detects a 54-char string', () => {
      const { detectedFormat } = parseCube(SOLVED_STR);
      expect(detectedFormat).toBe('faceletString');
    });

    it('rejects wrong-length strings', () => {
      expect(() => parseCube('UUUUU', 'faceletString')).toThrow();
    });
  });

  describe('faceMap', () => {
    it('parses a faceMap object', () => {
      const faceMap = {
        U: Array(9).fill('U'),
        R: Array(9).fill('R'),
        F: Array(9).fill('F'),
        D: Array(9).fill('D'),
        L: Array(9).fill('L'),
        B: Array(9).fill('B'),
      };
      const { facelets } = parseCube(faceMap, 'faceMap');
      expect(facelets).toEqual(SOLVED);
    });

    it('normalizes color names in faceMap', () => {
      const faceMap = {
        U: Array(9).fill('white'),
        R: Array(9).fill('red'),
        F: Array(9).fill('green'),
        D: Array(9).fill('yellow'),
        L: Array(9).fill('orange'),
        B: Array(9).fill('blue'),
      };
      const { facelets } = parseCube(faceMap, 'faceMap');
      expect(facelets).toEqual(SOLVED);
    });

    it('auto-detects faceMap objects', () => {
      const faceMap = {
        U: Array(9).fill('U'),
        R: Array(9).fill('R'),
        F: Array(9).fill('F'),
        D: Array(9).fill('D'),
        L: Array(9).fill('L'),
        B: Array(9).fill('B'),
      };
      const { detectedFormat } = parseCube(faceMap);
      expect(detectedFormat).toBe('faceMap');
    });
  });

  describe('flatArray', () => {
    it('parses a flat 54-element array', () => {
      const { facelets } = parseCube([...SOLVED], 'flatArray');
      expect(facelets).toEqual(SOLVED);
    });

    it('auto-detects a 54-element array', () => {
      const { detectedFormat } = parseCube([...SOLVED]);
      expect(detectedFormat).toBe('flatArray');
    });
  });

  describe('scramble', () => {
    it('parses a scramble string', () => {
      const { facelets, detectedFormat } = parseCube("R U R' U'", 'scramble');
      expect(facelets.length).toBe(54);
      expect(detectedFormat).toBe('scramble');
      // Should not be solved
      expect(facelets).not.toEqual(SOLVED);
    });

    it('parses a scramble array', () => {
      const { facelets } = parseCube(["R", "U", "R'", "U'"], 'scramble');
      expect(facelets.length).toBe(54);
    });

    it('auto-detects a move string', () => {
      const { detectedFormat } = parseCube("R U R' U'");
      expect(detectedFormat).toBe('scramble');
    });

    it('auto-detects a move array', () => {
      const { detectedFormat } = parseCube(["R", "U"]);
      expect(detectedFormat).toBe('scramble');
    });

    it('rejects invalid moves', () => {
      expect(() => parseCube('X Y Z', 'scramble')).toThrow('Invalid move');
    });
  });

  describe('singmaster', () => {
    it('parses singmaster notation', () => {
      const input = 'U:UUUUUUUUU/R:RRRRRRRRR/F:FFFFFFFFF/D:DDDDDDDDD/L:LLLLLLLLL/B:BBBBBBBBB';
      const { facelets } = parseCube(input, 'singmaster');
      expect(facelets).toEqual(SOLVED);
    });

    it('normalizes colors in singmaster', () => {
      const input = 'U:WWWWWWWWW/R:RRRRRRRRR/F:GGGGGGGGG/D:YYYYYYYYY/L:OOOOOOOOO/B:BBBBBBBBB';
      const { facelets } = parseCube(input, 'singmaster');
      expect(facelets).toEqual(SOLVED);
    });

    it('auto-detects singmaster format', () => {
      const input = 'U:UUUUUUUUU/R:RRRRRRRRR/F:FFFFFFFFF/D:DDDDDDDDD/L:LLLLLLLLL/B:BBBBBBBBB';
      const { detectedFormat } = parseCube(input);
      expect(detectedFormat).toBe('singmaster');
    });
  });
});
