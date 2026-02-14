/**
 * Rubik's Cube constants — colors, moves, face mappings.
 */

export const FACE_HEX = {
  U: '#ffffff',
  D: '#ffd500',
  F: '#009e60',
  B: '#0051ba',
  R: '#c41e3a',
  L: '#ff5800',
};

export const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];

export const MOVES = {
  'U':  { axis: 'y', layer:  1, angle: -Math.PI / 2 },
  "U'": { axis: 'y', layer:  1, angle:  Math.PI / 2 },
  'U2': { axis: 'y', layer:  1, angle:  Math.PI },
  'D':  { axis: 'y', layer: -1, angle:  Math.PI / 2 },
  "D'": { axis: 'y', layer: -1, angle: -Math.PI / 2 },
  'D2': { axis: 'y', layer: -1, angle:  Math.PI },
  'R':  { axis: 'x', layer:  1, angle: -Math.PI / 2 },
  "R'": { axis: 'x', layer:  1, angle:  Math.PI / 2 },
  'R2': { axis: 'x', layer:  1, angle:  Math.PI },
  'L':  { axis: 'x', layer: -1, angle:  Math.PI / 2 },
  "L'": { axis: 'x', layer: -1, angle: -Math.PI / 2 },
  'L2': { axis: 'x', layer: -1, angle:  Math.PI },
  'F':  { axis: 'z', layer:  1, angle: -Math.PI / 2 },
  "F'": { axis: 'z', layer:  1, angle:  Math.PI / 2 },
  'F2': { axis: 'z', layer:  1, angle:  Math.PI },
  'B':  { axis: 'z', layer: -1, angle:  Math.PI / 2 },
  "B'": { axis: 'z', layer: -1, angle: -Math.PI / 2 },
  'B2': { axis: 'z', layer: -1, angle:  Math.PI },
};

export const MOVE_DESC = {
  'U': 'Top CW',       "U'": 'Top CCW',       'U2': 'Top 180°',
  'D': 'Bottom CW',    "D'": 'Bottom CCW',    'D2': 'Bottom 180°',
  'R': 'Right CW',     "R'": 'Right CCW',     'R2': 'Right 180°',
  'L': 'Left CW',      "L'": 'Left CCW',      'L2': 'Left 180°',
  'F': 'Front CW',     "F'": 'Front CCW',     'F2': 'Front 180°',
  'B': 'Back CW',      "B'": 'Back CCW',      'B2': 'Back 180°',
};

export const FACE_OF = (m) => m.charAt(0);

export const INVERT = (m) => {
  if (m.includes('2')) return m;           // X2 is its own inverse
  if (m.includes("'")) return m[0];       // X' -> X
  return m + "'";                          // X  -> X'
};
