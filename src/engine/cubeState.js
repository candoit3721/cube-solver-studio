/**
 * Pure cube state representation for solving.
 * 54-element facelet array in URFDLB order matching cubejs convention.
 * Each element is a face letter: U, R, F, D, L, B.
 */

// --- Constants ---
const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];
const FACE_OFFSET = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };

// Face index within a 3x3 face grid (same formula as cubeEngine.js)
function getFaceIdx(face, x, y, z) {
  switch (face) {
    case 'U': return (z + 1) * 3 + (x + 1);
    case 'D': return (1 - z) * 3 + (x + 1);
    case 'F': return (1 - y) * 3 + (x + 1);
    case 'B': return (1 - y) * 3 + (1 - x);
    case 'R': return (1 - y) * 3 + (1 - z);
    case 'L': return (1 - y) * 3 + (z + 1);
    default: return 0;
  }
}

// Sticker specs: [faceName, axis-value condition, normal direction vector]
const STICKER_FACES = [
  ['R', 'x', 1, [1, 0, 0]],
  ['L', 'x', -1, [-1, 0, 0]],
  ['U', 'y', 1, [0, 1, 0]],
  ['D', 'y', -1, [0, -1, 0]],
  ['F', 'z', 1, [0, 0, 1]],
  ['B', 'z', -1, [0, 0, -1]],
];

// --- Move permutation computation ---
// Rotation matrices for axis rotations
function rotatePoint(axis, angle, x, y, z) {
  const c = Math.round(Math.cos(angle));
  const s = Math.round(Math.sin(angle));
  switch (axis) {
    case 'y': return [x * c + z * s, y, -x * s + z * c];
    case 'x': return [x, y * c - z * s, y * s + z * c];
    case 'z': return [x * c - y * s, x * s + y * c, z];
    default: return [x, y, z];
  }
}

function rotateDir(axis, angle, dx, dy, dz) {
  return rotatePoint(axis, angle, dx, dy, dz);
}

function dirToFace(dx, dy, dz) {
  if (dx === 1) return 'R';
  if (dx === -1) return 'L';
  if (dy === 1) return 'U';
  if (dy === -1) return 'D';
  if (dz === 1) return 'F';
  if (dz === -1) return 'B';
  return null;
}

// Move definitions matching constants.js
const MOVE_DEFS = {
  'U':  { axis: 'y', layer: 1, angle: -Math.PI / 2 },
  "U'": { axis: 'y', layer: 1, angle: Math.PI / 2 },
  'U2': { axis: 'y', layer: 1, angle: Math.PI },
  'D':  { axis: 'y', layer: -1, angle: Math.PI / 2 },
  "D'": { axis: 'y', layer: -1, angle: -Math.PI / 2 },
  'D2': { axis: 'y', layer: -1, angle: Math.PI },
  'R':  { axis: 'x', layer: 1, angle: -Math.PI / 2 },
  "R'": { axis: 'x', layer: 1, angle: Math.PI / 2 },
  'R2': { axis: 'x', layer: 1, angle: Math.PI },
  'L':  { axis: 'x', layer: -1, angle: Math.PI / 2 },
  "L'": { axis: 'x', layer: -1, angle: -Math.PI / 2 },
  'L2': { axis: 'x', layer: -1, angle: Math.PI },
  'F':  { axis: 'z', layer: 1, angle: -Math.PI / 2 },
  "F'": { axis: 'z', layer: 1, angle: Math.PI / 2 },
  'F2': { axis: 'z', layer: 1, angle: Math.PI },
  'B':  { axis: 'z', layer: -1, angle: Math.PI / 2 },
  "B'": { axis: 'z', layer: -1, angle: -Math.PI / 2 },
  'B2': { axis: 'z', layer: -1, angle: Math.PI },
};

/**
 * Compute the facelet permutation for a move.
 * Returns array P where: newState[i] = oldState[P[i]]
 */
function computePermutation(axis, layer, angle) {
  // Start with identity
  const perm = Array.from({ length: 54 }, (_, i) => i);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const pos = { x, y, z };
        if (pos[axis] !== layer) continue;

        // New cubie position after rotation
        const [nx, ny, nz] = rotatePoint(axis, angle, x, y, z);

        // For each sticker on this cubie
        for (const [face, fAxis, fVal, dir] of STICKER_FACES) {
          if (pos[fAxis] !== fVal) continue;

          // Old facelet index
          const oldIdx = FACE_OFFSET[face] + getFaceIdx(face, x, y, z);

          // New sticker direction after rotation
          const [ndx, ndy, ndz] = rotateDir(axis, angle, dir[0], dir[1], dir[2]);
          const newFace = dirToFace(ndx, ndy, ndz);

          // New facelet index
          const newIdx = FACE_OFFSET[newFace] + getFaceIdx(newFace, nx, ny, nz);

          // newState[newIdx] = oldState[oldIdx]
          perm[newIdx] = oldIdx;
        }
      }
    }
  }
  return perm;
}

// Pre-compute all move permutations
const PERMS = {};
for (const [name, def] of Object.entries(MOVE_DEFS)) {
  PERMS[name] = computePermutation(def.axis, def.layer, def.angle);
}

// All 18 move names
const ALL_MOVES = Object.keys(MOVE_DEFS);

// --- Cube state operations ---

/** Create a solved state */
export function createSolvedState() {
  const state = new Array(54);
  for (const face of FACE_ORDER) {
    const off = FACE_OFFSET[face];
    for (let i = 0; i < 9; i++) state[off + i] = face;
  }
  return state;
}

/** Parse a facelet string (54 chars, URFDLB) into state array */
export function parseState(faceletStr) {
  if (faceletStr.length !== 54) throw new Error('Invalid facelet string length');
  return faceletStr.split('');
}

/** Convert state array to facelet string */
export function stateToString(state) {
  return state.join('');
}

/** Convert faceMap (editor format) to state array */
export function faceMapToState(faceMap) {
  const state = new Array(54);
  for (const face of FACE_ORDER) {
    const off = FACE_OFFSET[face];
    for (let i = 0; i < 9; i++) {
      state[off + i] = faceMap[face][i];
    }
  }
  return state;
}

/** Apply a single move to a state. Returns NEW state array. */
export function applyMove(state, move) {
  const perm = PERMS[move];
  if (!perm) throw new Error('Unknown move: ' + move);
  const newState = new Array(54);
  for (let i = 0; i < 54; i++) {
    newState[i] = state[perm[i]];
  }
  return newState;
}

/** Apply a sequence of moves. Returns NEW state array. */
export function applyMoves(state, moves) {
  let s = state;
  for (const m of moves) {
    s = applyMove(s, m);
  }
  return s;
}

/** Check if state is fully solved */
export function isSolved(state) {
  for (const face of FACE_ORDER) {
    const off = FACE_OFFSET[face];
    for (let i = 0; i < 9; i++) {
      if (state[off + i] !== face) return false;
    }
  }
  return true;
}

/** Verify that applying moves to initialState produces a solved cube */
export function verifySolution(initialState, moves) {
  const result = applyMoves(initialState, moves);
  return isSolved(result);
}

/** Invert a move */
export function invertMove(move) {
  if (move.includes('2')) return move;
  if (move.includes("'")) return move[0];
  return move + "'";
}

/** Invert a move sequence */
export function invertMoves(moves) {
  return moves.slice().reverse().map(invertMove);
}

// --- Piece definitions ---
// Edge positions: [facelet1, facelet2]
export const EDGES = [
  [7, 19],   // 0: UF
  [5, 10],   // 1: UR
  [1, 46],   // 2: UB
  [3, 37],   // 3: UL
  [23, 12],  // 4: FR
  [21, 41],  // 5: FL
  [48, 14],  // 6: BR
  [50, 39],  // 7: BL
  [28, 25],  // 8: DF
  [32, 16],  // 9: DR
  [34, 52],  // 10: DB
  [30, 43],  // 11: DL
];

// Corner positions: [facelet1, facelet2, facelet3]
export const CORNERS = [
  [8, 20, 9],    // 0: UFR
  [6, 18, 38],   // 1: UFL
  [2, 11, 45],   // 2: UBR
  [0, 47, 36],   // 3: UBL
  [29, 26, 15],  // 4: DFR
  [27, 24, 44],  // 5: DFL
  [35, 17, 51],  // 6: DBR
  [33, 42, 53],  // 7: DBL
];

// Edge position names for reference
export const EDGE_NAMES = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'];
export const CORNER_NAMES = ['UFR', 'UFL', 'UBR', 'UBL', 'DFR', 'DFL', 'DBR', 'DBL'];

/**
 * Find which edge position contains the edge with the given two colors.
 * Returns { pos: index, flipped: boolean }
 * flipped=false means color1 is at facelet1 of that edge position.
 */
export function findEdge(state, color1, color2) {
  for (let i = 0; i < EDGES.length; i++) {
    const [a, b] = EDGES[i];
    if (state[a] === color1 && state[b] === color2) return { pos: i, flipped: false };
    if (state[a] === color2 && state[b] === color1) return { pos: i, flipped: true };
  }
  return null;
}

/**
 * Find which corner position contains the corner with the given three colors.
 * Returns { pos: index, twist: 0|1|2 }
 * twist=0 means color1 is at facelet1, twist=1 means color1 at facelet2, etc.
 */
export function findCorner(state, color1, color2, color3) {
  const colors = new Set([color1, color2, color3]);
  for (let i = 0; i < CORNERS.length; i++) {
    const [a, b, c] = CORNERS[i];
    const cSet = new Set([state[a], state[b], state[c]]);
    if (colors.size === cSet.size && [...colors].every(x => cSet.has(x))) {
      if (state[a] === color1) return { pos: i, twist: 0 };
      if (state[b] === color1) return { pos: i, twist: 1 };
      if (state[c] === color1) return { pos: i, twist: 2 };
    }
  }
  return null;
}

/** Get the color at a specific facelet index */
export function getColor(state, idx) {
  return state[idx];
}

// Export constants for use in solver
export { FACE_OFFSET, FACE_ORDER, ALL_MOVES, PERMS };
