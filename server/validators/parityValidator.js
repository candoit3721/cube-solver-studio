import { ValidationError } from '../errors/AppError.js';
import { EDGES, CORNERS } from '../../src/engine/cubeState.js';

/**
 * Reference edge orientation: which face is the "primary" face for each edge position.
 * For an edge at position i, the first facelet index in EDGES[i] belongs to the
 * "primary" face of that slot.
 */
const EDGE_PRIMARY_FACES = ['U', 'U', 'U', 'U', 'F', 'F', 'B', 'B', 'D', 'D', 'D', 'D'];

/**
 * Reference corner orientation: which face is the "primary" face for each corner position.
 * For a corner at position i, the first facelet index in CORNERS[i] belongs to the
 * "primary" face of that slot.
 */
const CORNER_PRIMARY_FACES = ['U', 'U', 'U', 'U', 'D', 'D', 'D', 'D'];

/**
 * Determine edge orientation (flip).
 * Returns 0 if correctly oriented, 1 if flipped.
 */
function edgeOrientation(state, edgeIdx) {
  const [f1, f2] = EDGES[edgeIdx];
  const c1 = state[f1];
  const c2 = state[f2];

  // Find where this edge belongs
  const primaryFace = EDGE_PRIMARY_FACES[edgeIdx];

  // An edge is correctly oriented (0) if its primary-face color is on the primary-face slot.
  // For U/D edges: the U/D color should be at the first facelet position.
  // For E-slice edges: the F/B color should be at the first facelet position.
  const udSet = new Set(['U', 'D']);

  if (udSet.has(primaryFace)) {
    // This slot is in U or D layer. Edge is oriented if the U or D sticker is at f1.
    return udSet.has(c1) ? 0 : 1;
  }
  // E-layer slot. Edge is oriented if the F or B sticker is at f1.
  const fbSet = new Set(['F', 'B']);
  return fbSet.has(c1) ? 0 : 1;
}

/**
 * Corners where f2/f3 in the CORNERS array are in reverse clockwise order
 * relative to the standard Kociemba convention. For these corners, twist
 * values 1 and 2 must be swapped to get a consistent orientation definition
 * where the sum of twists is always 0 mod 3 for solvable cubes.
 *
 * Derived by comparing CORNERS[i] facelet order against Kociemba's CW convention:
 *   CORNERS[0]=[8,20,9]  UFR: U,F,R but CW is U,R,F → swapped
 *   CORNERS[1]=[6,18,38] UFL: U,F,L and CW is U,F,L → correct
 *   CORNERS[2]=[2,11,45] UBR: U,R,B but CW is U,B,R → swapped
 *   CORNERS[3]=[0,47,36] UBL: U,B,L but CW is U,L,B → swapped
 *   CORNERS[4]=[29,26,15] DFR: D,F,R and CW is D,F,R → correct
 *   CORNERS[5]=[27,24,44] DFL: D,F,L but CW is D,L,F → swapped
 *   CORNERS[6]=[35,17,51] DBR: D,R,B and CW is D,R,B → correct
 *   CORNERS[7]=[33,42,53] DBL: D,L,B but CW is D,B,L → swapped
 */
const CORNER_CW_SWAP = [true, false, true, true, false, true, false, true];

/**
 * Determine corner orientation (twist).
 * Returns 0, 1, or 2 for the twist amount.
 */
function cornerOrientation(state, cornerIdx) {
  const [f1, f2, f3] = CORNERS[cornerIdx];
  const c1 = state[f1];

  const udSet = new Set(['U', 'D']);

  let twist;
  if (udSet.has(c1)) twist = 0;
  else if (udSet.has(state[f2])) twist = 1;
  else twist = 2;

  // Adjust for corners where f2/f3 are in reverse CW order
  if (CORNER_CW_SWAP[cornerIdx] && twist !== 0) {
    twist = 3 - twist;
  }

  return twist;
}

/**
 * Count inversions in a permutation to determine parity.
 * Returns the number of inversions (pairs where i < j but perm[i] > perm[j]).
 */
function countInversions(perm) {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions;
}

/**
 * Identify which of the 12 edge slots each physical edge occupies.
 * Returns a permutation array.
 */
function getEdgePermutation(state) {
  // Define the 12 edges by their solved colors
  const solvedEdgeColors = [
    ['U', 'F'], ['U', 'R'], ['U', 'B'], ['U', 'L'],
    ['F', 'R'], ['F', 'L'], ['B', 'R'], ['B', 'L'],
    ['D', 'F'], ['D', 'R'], ['D', 'B'], ['D', 'L'],
  ];

  const perm = new Array(12);

  for (let slot = 0; slot < 12; slot++) {
    const [f1, f2] = EDGES[slot];
    const c1 = state[f1];
    const c2 = state[f2];

    // Find which edge piece this is
    for (let piece = 0; piece < 12; piece++) {
      const [e1, e2] = solvedEdgeColors[piece];
      if ((c1 === e1 && c2 === e2) || (c1 === e2 && c2 === e1)) {
        perm[slot] = piece;
        break;
      }
    }

    if (perm[slot] === undefined) {
      throw new ValidationError(
        `Invalid edge at position ${slot}: colors ${c1}${c2} don't form a valid edge`,
        'edgeParity'
      );
    }
  }

  return perm;
}

/**
 * Identify which of the 8 corner slots each physical corner occupies.
 * Returns a permutation array.
 */
function getCornerPermutation(state) {
  const solvedCornerColors = [
    new Set(['U', 'F', 'R']), new Set(['U', 'F', 'L']),
    new Set(['U', 'B', 'R']), new Set(['U', 'B', 'L']),
    new Set(['D', 'F', 'R']), new Set(['D', 'F', 'L']),
    new Set(['D', 'B', 'R']), new Set(['D', 'B', 'L']),
  ];

  const perm = new Array(8);

  for (let slot = 0; slot < 8; slot++) {
    const [f1, f2, f3] = CORNERS[slot];
    const colors = new Set([state[f1], state[f2], state[f3]]);

    for (let piece = 0; piece < 8; piece++) {
      const expected = solvedCornerColors[piece];
      if (colors.size === expected.size && [...colors].every(c => expected.has(c))) {
        perm[slot] = piece;
        break;
      }
    }

    if (perm[slot] === undefined) {
      throw new ValidationError(
        `Invalid corner at position ${slot}: colors ${state[f1]}${state[f2]}${state[f3]} don't form a valid corner`,
        'cornerParity'
      );
    }
  }

  return perm;
}

/**
 * Full parity validation. Checks:
 * 1. Edge orientation parity (sum of flips must be even)
 * 2. Corner orientation parity (sum of twists must be divisible by 3)
 * 3. Permutation parity (edge and corner permutation parity must match)
 */
export function validateParity(facelets) {
  // Edge orientation parity
  let edgeFlipSum = 0;
  for (let i = 0; i < 12; i++) {
    edgeFlipSum += edgeOrientation(facelets, i);
  }
  if (edgeFlipSum % 2 !== 0) {
    throw new ValidationError(
      'Edge orientation parity error: the sum of edge flips is odd, which means an edge piece has been flipped in place. This state is not reachable by legal moves.',
      'edgeParity'
    );
  }

  // Corner orientation parity
  let cornerTwistSum = 0;
  for (let i = 0; i < 8; i++) {
    cornerTwistSum += cornerOrientation(facelets, i);
  }
  if (cornerTwistSum % 3 !== 0) {
    throw new ValidationError(
      'Corner orientation parity error: the sum of corner twists is not divisible by 3, which means a corner piece has been twisted in place. This state is not reachable by legal moves.',
      'cornerParity'
    );
  }

  // Permutation parity
  const edgePerm = getEdgePermutation(facelets);
  const cornerPerm = getCornerPermutation(facelets);

  const edgeInversions = countInversions(edgePerm);
  const cornerInversions = countInversions(cornerPerm);

  if (edgeInversions % 2 !== cornerInversions % 2) {
    throw new ValidationError(
      'Permutation parity error: the edge and corner permutation parities do not match. This means two pieces have been swapped, making the cube unsolvable.',
      'permutationParity'
    );
  }
}
