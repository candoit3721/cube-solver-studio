import { ParseError } from '../errors/AppError.js';
import { normalizeFacelets } from '../normalizers/colorNormalizer.js';

const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Parse Singmaster notation: "U:WWWWWWWWW/R:RRRRRRRRR/F:GGGGGGGGG/D:YYYYYYYYY/L:OOOOOOOOO/B:BBBBBBBBB"
 * Each face is labeled with its letter, colon, then 9 color characters, separated by "/".
 */
export function parseSingmaster(input) {
  if (typeof input !== 'string') {
    throw new ParseError('singmaster must be a string');
  }

  const parts = input.trim().split('/');
  if (parts.length !== 6) {
    throw new ParseError(`singmaster must have 6 face sections separated by "/", got ${parts.length}`);
  }

  const faceData = {};
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      throw new ParseError(`Each face section must have "FACE:colors" format, got "${part}"`);
    }
    const label = part.slice(0, colonIdx).trim().toUpperCase();
    const colors = part.slice(colonIdx + 1).trim();

    if (!FACE_ORDER.includes(label)) {
      throw new ParseError(`Unknown face label: "${label}"`);
    }
    if (colors.length !== 9) {
      throw new ParseError(`Face "${label}" must have 9 colors, got ${colors.length}`);
    }
    faceData[label] = colors.split('');
  }

  for (const face of FACE_ORDER) {
    if (!faceData[face]) {
      throw new ParseError(`Missing face: "${face}"`);
    }
  }

  const facelets = [];
  for (const face of FACE_ORDER) {
    facelets.push(...faceData[face]);
  }

  return normalizeFacelets(facelets);
}
