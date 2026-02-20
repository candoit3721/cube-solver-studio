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

  // 7 — Right insert SETUP (yellow face up, white layer solved at bottom).
  // U = yellow face (on top). D = white face (fully solved at bottom).
  // U[7]=R  → red sticker on U face at UF position = edge goes to Right/red face
  // F[1]=F  → green sticker on front face = matches front centre
  // FL, BL, BR middle edges solved; FR slot has displaced yellow-green edge (F[5]=F, R[3]=D).
  // Yellow-layer corners scrambled for a realistic mid-solve appearance.
  // Color counts: U×9 D×9 F×9 B×9 R×9 L×9
  {
    U: ['B','D','D',  'R','D','L',  'D','R','F'],
    D: ['U','U','U',  'U','U','U',  'U','U','U'],
    F: ['F','F','R',  'F','F','F',  'F','F','F'],
    R: ['D','D','R',  'D','R','R',  'R','R','R'],
    L: ['D','D','L',  'L','L','L',  'L','L','L'],
    B: ['B','B','L',  'B','B','B',  'B','B','B'],
  },

  // 8 — Left insert SETUP (yellow face up, white layer solved at bottom).
  // U[7]=L  → orange sticker on U face at UF position = edge goes to Left/orange face
  // F[1]=F  → green sticker on front face = matches front centre
  // FR, BL, BR middle edges solved; FL slot has displaced yellow-green edge (F[3]=F, L[5]=D).
  // Yellow-layer corners scrambled for a realistic mid-solve appearance.
  // Color counts: U×9 D×9 F×9 B×9 R×9 L×9
  {
    U: ['L','D','B',  'L','D','B',  'F','L','D'],
    D: ['U','U','U',  'U','U','U',  'U','U','U'],
    F: ['L','F','F',  'F','F','F',  'F','F','F'],
    R: ['R','D','D',  'R','R','R',  'R','R','R'],
    L: ['B','D','D',  'L','L','D',  'L','L','L'],
    B: ['R','R','D',  'B','B','B',  'B','B','B'],
  },
];
