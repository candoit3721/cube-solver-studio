/**
 * Algorithm method definitions.
 *
 * To add a new method (e.g. CFOP), append an entry to ALGORITHM_METHODS.
 * Each method has:
 *   id      — unique key used as React key and URL anchor
 *   name    — display title
 *   desc    — short description shown under the title
 *   steps[] — ordered list of algorithm steps:
 *     step   — step number label
 *     phase  — step name
 *     moves  — array of move strings, or null for intuitive steps
 *     note   — what this step does / when to apply it
 *     tip    — practical hint
 */
export const ALGORITHM_METHODS = [
  {
    id: 'lbl',
    name: 'Layer-by-Layer (Beginner)',
    shortName: 'LBL',
    desc: 'The most approachable method. Solve the cube one layer at a time. Hold: white on top for steps 1–3, yellow on top for steps 4–7.',
    steps: [
      {
        step: 1,
        phase: 'White Cross',
        moves: null,
        note: 'Intuitive — no fixed algorithm. Move white edges into position one by one.',
        tip: 'Work from the top down. Rotate U to line up each edge with its center, then bring it home.',
      },
      {
        step: 2,
        phase: 'White Corners',
        moves: ["R'", "D'", 'R', 'D'],
        note: 'Repeat until the corner drops in with white on top.',
        tip: 'If the corner is in the top layer, first kick it out by doing the trigger once.',
      },
      {
        step: 3,
        phase: 'Middle Layer — Right Insert',
        moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
        note: 'When the edge needs to go right.',
        tip: "Mirror: U' L' U L U F U' F' for left insert.",
      },
      {
        step: 4,
        phase: 'Yellow Cross',
        moves: ['F', 'R', 'U', "R'", "U'", "F'"],
        note: 'Apply 1–3 times. Recognise dot / L-shape / line patterns.',
        tip: 'Dot → apply 3×. L-shape → align top-left, apply 2×. Line → align horizontal, apply 1×.',
      },
      {
        step: 5,
        phase: 'Yellow Edge Permutation',
        moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
        note: 'Cycles three top edges counter-clockwise. Find a solved edge and put it in the back.',
        tip: 'If no edge is solved, apply once then re-check.',
      },
      {
        step: 6,
        phase: 'Yellow Corner Permutation',
        moves: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
        note: 'Cycles three corners. Find a correct corner and keep it in the front-left.',
        tip: "Apply from the correct corner's position, repeat as needed.",
      },
      {
        step: 7,
        phase: 'Yellow Corner Orientation',
        moves: ['R', 'U', "R'", "U'"],
        note: 'Twist corners in the front-right position. Then U to move to the next corner.',
        tip: 'Never rotate the top layer while doing this — only after each corner is solved.',
      },
    ],
  },
  // Add future methods here, e.g.:
  // {
  //   id: 'cfop',
  //   name: 'CFOP (Advanced)',
  //   shortName: 'CFOP',
  //   desc: 'Cross, F2L, OLL, PLL — the most popular speedcubing method.',
  //   steps: [ ... ],
  // },
];
