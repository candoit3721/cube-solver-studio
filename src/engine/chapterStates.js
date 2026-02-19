// src/engine/chapterStates.js
// Goal-state faceMap for each of the 7 LBL phases.
// Values are face-letter codes: U=white D=yellow F=green B=blue R=red L=orange
// Each face: 9-element row-major array viewed from outside the cube.

export const CHAPTER_STATES = [
  // 1 — White Cross
  // U cross (idx 1,3,4,5,7); matching edge stickers on side faces
  {
    U: ['F','U','B',  'U','U','U',  'R','U','L'],
    D: ['R','F','L',  'B','D','F',  'L','B','R'],
    F: ['L','F','R',  'F','F','F',  'D','U','D'],
    B: ['R','B','L',  'B','B','B',  'D','D','U'],
    L: ['U','L','D',  'L','L','L',  'B','R','F'],
    R: ['D','R','U',  'R','R','R',  'F','L','B'],
  },

  // 2 — White Corners
  // U face all white; top row of every side solved
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['R','F','L',  'B','D','F',  'L','B','R'],
    F: ['F','F','F',  'D','F','U',  'R','L','B'],
    B: ['B','B','B',  'D','B','U',  'L','R','F'],
    L: ['L','L','L',  'F','L','U',  'B','D','R'],
    R: ['R','R','R',  'B','R','U',  'F','D','L'],
  },

  // 3 — Middle Layer (F2L)
  // Top two layers solved; bottom layer scrambled
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['R','F','L',  'B','D','F',  'L','B','R'],
    F: ['F','F','F',  'F','F','F',  'D','B','R'],
    B: ['B','B','B',  'B','B','B',  'F','D','L'],
    L: ['L','L','L',  'L','L','L',  'R','D','F'],
    R: ['R','R','R',  'R','R','R',  'B','D','L'],
  },

  // 4 — Yellow Cross
  // F2L done; D face has yellow cross (idx 1,3,4,5,7); corners + side edges mismatched
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['R','D','F',  'D','D','D',  'B','D','L'],
    F: ['F','F','F',  'F','F','F',  'R','D','L'],
    B: ['B','B','B',  'B','B','B',  'F','D','R'],
    L: ['L','L','L',  'L','L','L',  'B','D','F'],
    R: ['R','R','R',  'R','R','R',  'L','D','B'],
  },

  // 5 — Yellow Edge Permutation
  // D cross with all 4 edges aligned to side centers; D corners still scrambled
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['R','D','B',  'D','D','D',  'L','D','F'],
    F: ['F','F','F',  'F','F','F',  'R','F','B'],
    B: ['B','B','B',  'B','B','B',  'F','B','L'],
    L: ['L','L','L',  'L','L','L',  'B','L','F'],
    R: ['R','R','R',  'R','R','R',  'F','R','B'],
  },

  // 6 — Yellow Corner Permutation
  // Corners in correct slots; 2 are still twisted (non-yellow on D, yellow bleeding to sides)
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['D','D','R',  'D','D','D',  'B','D','D'],
    F: ['F','F','F',  'F','F','F',  'F','F','D'],
    B: ['B','B','B',  'B','B','B',  'L','B','B'],
    L: ['L','L','L',  'L','L','L',  'D','L','L'],
    R: ['R','R','R',  'R','R','R',  'F','R','R'],
  },

  // 7 — Solved
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['D','D','D',  'D','D','D',  'D','D','D'],
    F: ['F','F','F',  'F','F','F',  'F','F','F'],
    B: ['B','B','B',  'B','B','B',  'B','B','B'],
    L: ['L','L','L',  'L','L','L',  'L','L','L'],
    R: ['R','R','R',  'R','R','R',  'R','R','R'],
  },

  // 8 — Right insert result: top layer solved, FR middle edge placed (idx F[5]=F, R[3]=R)
  // Shows where the front-right slot is and what a correct right insert achieves.
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['F','R','L',  'B','D','R',  'L','F','B'],
    F: ['F','F','F',  'L','F','F',  'D','R','B'],
    R: ['R','R','R',  'R','R','B',  'F','D','L'],
    L: ['L','L','L',  'B','L','R',  'B','D','F'],
    B: ['B','B','B',  'F','B','L',  'R','D','L'],
  },

  // 9 — Left insert result: top layer solved, FL middle edge placed (idx F[3]=F, L[5]=L)
  // Shows where the front-left slot is and what a correct left insert achieves.
  {
    U: ['U','U','U',  'U','U','U',  'U','U','U'],
    D: ['F','L','R',  'B','D','L',  'R','F','B'],
    F: ['F','F','F',  'F','F','R',  'D','L','B'],
    R: ['R','R','R',  'B','R','L',  'F','D','F'],
    L: ['L','L','L',  'B','L','L',  'F','D','R'],
    B: ['B','B','B',  'R','B','F',  'L','D','L'],
  },
];
