import { describe, it, expect } from 'vitest';
import { normalizeColor, normalizeFacelets } from '../normalizers/colorNormalizer.js';

describe('colorNormalizer', () => {
  describe('normalizeColor', () => {
    it('passes through canonical face letters', () => {
      expect(normalizeColor('U')).toBe('U');
      expect(normalizeColor('R')).toBe('R');
      expect(normalizeColor('F')).toBe('F');
      expect(normalizeColor('D')).toBe('D');
      expect(normalizeColor('L')).toBe('L');
      expect(normalizeColor('B')).toBe('B');
    });

    it('normalizes color letters', () => {
      expect(normalizeColor('W')).toBe('U');
      expect(normalizeColor('G')).toBe('F');
      expect(normalizeColor('Y')).toBe('D');
      expect(normalizeColor('O')).toBe('L');
    });

    it('normalizes full color names', () => {
      expect(normalizeColor('white')).toBe('U');
      expect(normalizeColor('red')).toBe('R');
      expect(normalizeColor('green')).toBe('F');
      expect(normalizeColor('yellow')).toBe('D');
      expect(normalizeColor('orange')).toBe('L');
      expect(normalizeColor('blue')).toBe('B');
    });

    it('handles case insensitivity', () => {
      expect(normalizeColor('u')).toBe('U');
      expect(normalizeColor('w')).toBe('U');
      expect(normalizeColor('White')).toBe('U');
    });

    it('throws on unknown colors', () => {
      expect(() => normalizeColor('X')).toThrow('Unknown color');
      expect(() => normalizeColor('purple')).toThrow('Unknown color');
    });

    it('throws on non-string input', () => {
      expect(() => normalizeColor(42)).toThrow('Invalid color value');
    });
  });

  describe('normalizeFacelets', () => {
    it('normalizes an array of color tokens', () => {
      const input = ['W', 'R', 'G', 'Y', 'O', 'B'];
      expect(normalizeFacelets(input)).toEqual(['U', 'R', 'F', 'D', 'L', 'B']);
    });
  });
});
