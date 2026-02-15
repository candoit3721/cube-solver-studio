import { ParseError } from '../errors/AppError.js';
import { parseFaceMap } from './faceMapParser.js';
import { parseFaceletString } from './faceletStringParser.js';
import { parseFlatArray } from './flatArrayParser.js';
import { parseScramble } from './scrambleParser.js';
import { parseSingmaster } from './singmasterParser.js';

const PARSERS = {
  faceMap: parseFaceMap,
  faceletString: parseFaceletString,
  flatArray: parseFlatArray,
  scramble: parseScramble,
  singmaster: parseSingmaster,
};

/**
 * Detect the format of the cube input automatically.
 */
function detectFormat(cube) {
  if (typeof cube === 'string') {
    const trimmed = cube.trim();
    // Singmaster: contains "/" and ":"
    if (trimmed.includes('/') && trimmed.includes(':')) {
      return 'singmaster';
    }
    // Facelet string: exactly 54 characters, all letters
    if (trimmed.length === 54 && /^[A-Za-z]+$/.test(trimmed)) {
      return 'faceletString';
    }
    // Scramble: contains move notation (space-separated, face letters + optional ' or 2)
    if (/^[URFDLB]['2]?(\s+[URFDLB]['2]?)*$/i.test(trimmed)) {
      return 'scramble';
    }
    // If it's a 54-char string that didn't match faceletString, try it as faceletString anyway
    if (trimmed.length === 54) {
      return 'faceletString';
    }
    // Default to scramble for other strings
    return 'scramble';
  }

  if (Array.isArray(cube)) {
    // Array of 54 elements → flatArray
    if (cube.length === 54) {
      return 'flatArray';
    }
    // Array of strings that look like moves → scramble
    if (cube.length > 0 && cube.every(item => typeof item === 'string')) {
      return 'scramble';
    }
    return 'flatArray';
  }

  if (typeof cube === 'object' && cube !== null) {
    // Has face keys → faceMap
    const keys = Object.keys(cube);
    if (keys.some(k => ['U', 'R', 'F', 'D', 'L', 'B'].includes(k))) {
      return 'faceMap';
    }
  }

  throw new ParseError('Unable to detect cube format. Provide a "format" field or use a supported format.');
}

/**
 * Parse cube input into a 54-element facelet array.
 * Auto-detects format if not specified.
 * Returns { facelets, detectedFormat }.
 */
export function parseCube(cube, format) {
  const resolvedFormat = format || detectFormat(cube);
  const parser = PARSERS[resolvedFormat];

  if (!parser) {
    throw new ParseError(`Unknown format: "${resolvedFormat}". Supported: ${Object.keys(PARSERS).join(', ')}`);
  }

  const facelets = parser(cube);
  return { facelets, detectedFormat: resolvedFormat };
}

export const SUPPORTED_FORMATS = Object.keys(PARSERS);
