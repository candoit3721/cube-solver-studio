/**
 * Layered (beginner's method) Rubik's Cube Solver
 * Phases 1-2: IDDFS for cross, algorithmic triggers for corners
 * Phase 3: Algorithmic middle-layer insertion
 * Phases 4-7: Known last-layer algorithms
 *
 * Face offsets: U=0, R=9, F=18, D=27, L=36, B=45
 * Colors: U=white, R=red, F=green, D=yellow, L=orange, B=blue
 */

import {
  applyMove,
  applyMoves,
  isSolved,
  FACE_OFFSET,
  ALL_MOVES,
  CORNERS,
  EDGES,
} from './cubeState.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

// Cross edge definitions: [U-facelet, side-facelet, side-center]
const CROSS_EDGES = [
  [7, 19, 22],  // UF
  [5, 10, 13],  // UR
  [1, 46, 49],  // UB
  [3, 37, 40],  // UL
];

// Corner definitions for white corners
const CORNER_DEFS = [
  { slot: 0, facelets: [8, 20, 9],   dSlot: 4, trigger: ["R'", "D'", "R", "D"] },
  { slot: 1, facelets: [6, 18, 38],  dSlot: 5, trigger: ["L", "D", "L'", "D'"] },
  { slot: 2, facelets: [2, 11, 45],  dSlot: 6, trigger: ["B'", "D'", "B", "D"] },
  { slot: 3, facelets: [0, 47, 36],  dSlot: 7, trigger: ["B", "D", "B'", "D'"] },
];

const D_CORNER_CYCLE = [4, 6, 7, 5];

// Middle edge slot definitions with insertion algorithms
// Each slot has two insertion cases based on which D-layer position the edge enters from.
// insertions[0]: edge's face1 color is on the side face of the D position
// insertions[1]: edge's face2 color is on the side face of the D position
const MID_SLOT_DEFS = [
  {
    name: 'FR', facelets: [23, 12], centers: [22, 13],
    insertions: [
      { dLocalIdx: 0, alg: ["D'", "R'", "D", "R", "D", "F", "D'", "F'"] },   // from DF
      { dLocalIdx: 1, alg: ["D", "F", "D'", "F'", "D'", "R'", "D", "R"] },   // from DR
    ],
  },
  {
    name: 'FL', facelets: [21, 41], centers: [22, 40],
    insertions: [
      { dLocalIdx: 0, alg: ["D", "L", "D'", "L'", "D'", "F'", "D", "F"] },   // from DF
      { dLocalIdx: 3, alg: ["D'", "F'", "D", "F", "D", "L", "D'", "L'"] },   // from DL
    ],
  },
  {
    name: 'BR', facelets: [48, 14], centers: [49, 13],
    insertions: [
      { dLocalIdx: 2, alg: ["D", "R", "D'", "R'", "D'", "B'", "D", "B"] },   // from DB
      { dLocalIdx: 1, alg: ["D'", "B'", "D", "B", "D", "R", "D'", "R'"] },   // from DR
    ],
  },
  {
    name: 'BL', facelets: [50, 39], centers: [49, 40],
    insertions: [
      { dLocalIdx: 2, alg: ["D'", "L'", "D", "L", "D", "B", "D'", "B'"] },   // from DB
      { dLocalIdx: 3, alg: ["D", "B", "D'", "B'", "D'", "L'", "D", "L"] },   // from DL
    ],
  },
];

// D-layer edge info: local index 0-3 = DF, DR, DB, DL
const D_EDGE_INFO = [
  { edgeIdx: 8,  dFacelet: 28, sideFacelet: 25 },  // DF
  { edgeIdx: 9,  dFacelet: 32, sideFacelet: 16 },  // DR
  { edgeIdx: 10, dFacelet: 34, sideFacelet: 52 },  // DB
  { edgeIdx: 11, dFacelet: 30, sideFacelet: 43 },  // DL
];

// D-face facelets of D-layer edges
const D_CROSS = [28, 32, 34, 30];

// D-edge side facelets and their centers
const D_EDGE_SIDES = [
  { side: 25, center: 22 },  // DF
  { side: 16, center: 13 },  // DR
  { side: 52, center: 49 },  // DB
  { side: 43, center: 40 },  // DL
];

// D CW cycle: DF(0) → DR(1) → DB(2) → DL(3) → DF(0)
const D_CYCLE_POS = [0, 1, 2, 3]; // maps local D-edge index → cycle position

// ---------------------------------------------------------------------------
// IDDFS search engine
// ---------------------------------------------------------------------------
function iddfs(state, goalFn, maxDepth, moveSet) {
  if (goalFn(state)) return [];
  const moves = moveSet || ALL_MOVES;
  for (let d = 1; d <= maxDepth; d++) {
    const result = dfs(state, goalFn, d, '', [], moves);
    if (result) return result;
  }
  return null;
}

function dfs(state, goalFn, depth, lastFace, acc, moves) {
  if (depth === 0) return goalFn(state) ? acc.slice() : null;
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const face = move[0];
    if (face === lastFace) continue;
    if (OPPOSITE[face] === lastFace && face > lastFace) continue;
    const ns = applyMove(state, move);
    acc.push(move);
    const result = dfs(ns, goalFn, depth - 1, face, acc, moves);
    if (result) return result;
    acc.pop();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function apply(state, seq, acc) {
  for (const m of seq) acc.push(m);
  return applyMoves(state, seq);
}

function faceOf(idx) {
  if (idx < 9) return 'U';
  if (idx < 18) return 'R';
  if (idx < 27) return 'F';
  if (idx < 36) return 'D';
  if (idx < 45) return 'L';
  return 'B';
}

function dRotsBetweenCorners(fromIdx, toIdx) {
  const f = D_CORNER_CYCLE.indexOf(fromIdx);
  const t = D_CORNER_CYCLE.indexOf(toIdx);
  if (f === -1 || t === -1) return 0;
  return ((t - f) + 4) % 4;
}

function findCornerPos(state, colors) {
  const cset = new Set(colors);
  for (let i = 0; i < CORNERS.length; i++) {
    const [a, b, c] = CORNERS[i];
    const found = new Set([state[a], state[b], state[c]]);
    if (cset.size === found.size && [...cset].every(x => found.has(x))) {
      return { pos: i, twist: state[a] === colors[0] ? 0 : state[b] === colors[0] ? 1 : 2 };
    }
  }
  return null;
}

// Compute D rotations needed to move from D-local-index `from` to `to`
function dRotsNeeded(from, to) {
  const fp = D_CYCLE_POS[from];
  const tp = D_CYCLE_POS[to];
  return ((tp - fp) + 4) % 4;
}

function dRotMoves(n) {
  if (n === 0) return [];
  if (n === 1) return ['D'];
  if (n === 2) return ['D2'];
  return ["D'"];
}

// Find a middle-layer edge by its two colors. Returns position info.
function findMidEdge(state, c1, c2) {
  // Check D-layer positions first (indices 8-11)
  for (let li = 0; li < 4; li++) {
    const { dFacelet, sideFacelet } = D_EDGE_INFO[li];
    if ((state[dFacelet] === c1 && state[sideFacelet] === c2) ||
        (state[dFacelet] === c2 && state[sideFacelet] === c1)) {
      return { inD: true, dLocalIdx: li, sideColor: state[sideFacelet] };
    }
  }
  // Check middle-layer positions (indices 4-7 in EDGES)
  for (let si = 0; si < 4; si++) {
    const [f1, f2] = MID_SLOT_DEFS[si].facelets;
    if ((state[f1] === c1 && state[f2] === c2) ||
        (state[f1] === c2 && state[f2] === c1)) {
      return { inD: false, slotIdx: si };
    }
  }
  // Check U-layer (shouldn't normally happen after F2L, but handle gracefully)
  for (let ei = 0; ei < 4; ei++) {
    const [a, b] = EDGES[ei];
    if ((state[a] === c1 && state[b] === c2) ||
        (state[a] === c2 && state[b] === c1)) {
      return { inU: true };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// PHASE 1: White Cross (IDDFS per edge, max depth 7)
// ---------------------------------------------------------------------------
function solveWhiteCross(startState) {
  const moves = [];
  let s = startState;

  for (let i = 0; i < 4; i++) {
    const placed = CROSS_EDGES.slice(0, i);
    const [uF, sF, cF] = CROSS_EDGES[i];

    const goalFn = (st) => {
      if (st[uF] !== 'U' || st[sF] !== st[cF]) return false;
      for (const [pu, ps, pc] of placed) {
        if (st[pu] !== 'U' || st[ps] !== st[pc]) return false;
      }
      return true;
    };

    const seq = iddfs(s, goalFn, 7);
    if (seq) {
      s = applyMoves(s, seq);
      moves.push(...seq);
    }
  }

  return { state: s, moves };
}

// ---------------------------------------------------------------------------
// PHASE 2: White Corners (algorithmic trigger approach)
// ---------------------------------------------------------------------------
function solveWhiteCorners(startState) {
  const moves = [];
  let s = startState;

  for (const def of CORNER_DEFS) {
    const [uF, f2, f3] = def.facelets;
    const solvedColors = ['U', s[FACE_OFFSET[faceOf(f2)] + 4], s[FACE_OFFSET[faceOf(f3)] + 4]];

    for (let attempt = 0; attempt < 30; attempt++) {
      if (s[uF] === 'U' && s[f2] === solvedColors[1] && s[f3] === solvedColors[2]) break;

      const found = findCornerPos(s, solvedColors);
      if (!found) break;

      if (found.pos <= 3) {
        const kickDef = CORNER_DEFS[found.pos];
        s = apply(s, kickDef.trigger, moves);
        continue;
      }

      const dRot = dRotsBetweenCorners(found.pos, def.dSlot);
      if (dRot > 0) {
        s = apply(s, dRotMoves(dRot), moves);
      }

      s = apply(s, def.trigger, moves);
    }
  }

  return { state: s, moves };
}

// ---------------------------------------------------------------------------
// PHASE 3: Middle Layer Edges (algorithmic insertion)
// ---------------------------------------------------------------------------
function solveMiddleLayer(startState) {
  const moves = [];
  let s = startState;

  for (let si = 0; si < 4; si++) {
    const slot = MID_SLOT_DEFS[si];
    const c1 = s[slot.centers[0]]; // face1 center color
    const c2 = s[slot.centers[1]]; // face2 center color

    // Already solved?
    if (s[slot.facelets[0]] === c1 && s[slot.facelets[1]] === c2) continue;

    // Find the edge
    let found = findMidEdge(s, c1, c2);
    if (!found) continue;

    // If in a middle slot, kick it out
    if (!found.inD) {
      if (found.inU) {
        // Rare: edge is in U layer. Use IDDFS fallback for this edge.
        s = midEdgeFallback(s, slot, si, moves);
        continue;
      }
      // Kick from middle slot to D layer
      const kickSlot = MID_SLOT_DEFS[found.slotIdx];
      s = apply(s, kickSlot.insertions[0].alg, moves);
      // Re-find in D layer
      found = findMidEdge(s, c1, c2);
      if (!found || !found.inD) {
        // Fallback: try the other kick algorithm
        s = apply(s, kickSlot.insertions[1].alg, moves);
        found = findMidEdge(s, c1, c2);
        if (!found || !found.inD) {
          // Edge lost - use IDDFS fallback
          s = midEdgeFallback(s, slot, si, moves);
          continue;
        }
      }
    }

    // Edge is in D layer at found.dLocalIdx
    // Determine which insertion case to use
    const sideColor = found.sideColor;
    let insertIdx;
    if (sideColor === c1) {
      insertIdx = 0;
    } else {
      insertIdx = 1;
    }

    const insertion = slot.insertions[insertIdx];
    const targetDLocal = insertion.dLocalIdx;

    // Rotate D to bring edge to the correct D position
    const rots = dRotsNeeded(found.dLocalIdx, targetDLocal);
    if (rots > 0) {
      s = apply(s, dRotMoves(rots), moves);
    }

    // Apply insertion algorithm
    s = apply(s, insertion.alg, moves);
  }

  return { state: s, moves };
}

// IDDFS fallback for a single middle edge (restricted moves, low depth)
function midEdgeFallback(state, slot, slotIdx, moves) {
  const c1 = state[slot.centers[0]];
  const c2 = state[slot.centers[1]];
  const prevSlots = MID_SLOT_DEFS.slice(0, slotIdx);

  // Build preservation check
  const preserved = [];
  for (const [u, si, c] of CROSS_EDGES) {
    preserved.push([u, 'U']);
    preserved.push([si, state[c]]);
  }
  for (const def of CORNER_DEFS) {
    for (const f of def.facelets) preserved.push([f, state[f]]);
  }
  for (const ps of prevSlots) {
    preserved.push([ps.facelets[0], state[ps.facelets[0]]]);
    preserved.push([ps.facelets[1], state[ps.facelets[1]]]);
  }

  const goalFn = (st) => {
    if (st[slot.facelets[0]] !== c1 || st[slot.facelets[1]] !== c2) return false;
    for (const [idx, val] of preserved) {
      if (st[idx] !== val) return false;
    }
    return true;
  };

  // Restricted IDDFS: no U moves (quarter turns only)
  const restricted = ['D', "D'", 'R', "R'", 'F', "F'", 'L', "L'", 'B', "B'"];
  const seq = iddfs(state, goalFn, 9, restricted);
  if (seq) {
    for (const m of seq) moves.push(m);
    return applyMoves(state, seq);
  }
  return state;
}

// ---------------------------------------------------------------------------
// PHASE 4: Yellow Cross (pure algorithmic — F' R' D' R D F variants)
// ---------------------------------------------------------------------------
// These algorithms flip 2 D-face edge stickers while preserving F2L.
const OLL_CROSS_ALGS = [
  ["F'", "R'", "D'", "R", "D", "F"],    // flips DF+DR orientation
  ["R'", "B'", "D'", "B", "D", "R"],    // flips DR+DB orientation
  ["B'", "L'", "D'", "L", "D", "B"],    // flips DB+DL orientation
  ["L'", "F'", "D'", "F", "D", "L"],    // flips DL+DF orientation
];

function solveYellowCross(startState) {
  const moves = [];
  let s = startState;

  for (let iter = 0; iter < 4; iter++) {
    const dCount = D_CROSS.filter(f => s[f] === 'D').length;
    if (dCount === 4) break;

    // Try each OLL cross algorithm variant with each D setup.
    // Pick the one that maximizes oriented D-face edges.
    let bestState = null, bestMoves = null, bestCount = dCount;

    for (const alg of OLL_CROSS_ALGS) {
      for (const setup of [[], ['D'], ['D2'], ["D'"]]) {
        const t = applyMoves(applyMoves(s, setup), alg);
        const c = D_CROSS.filter(f => t[f] === 'D').length;
        if (c > bestCount) {
          bestCount = c;
          bestState = t;
          bestMoves = [...setup, ...alg];
        }
      }
    }

    if (!bestMoves) {
      // No single algorithm improves — shouldn't happen with correct algs,
      // but fall back to IDDFS as safety net.
      const preserved = buildF2LCheck(s);
      const goalFn = (st) => {
        for (const f of D_CROSS) if (st[f] !== 'D') return false;
        for (const [idx, val] of preserved) if (st[idx] !== val) return false;
        return true;
      };
      const restricted = ['D', "D'", 'R', "R'", 'F', "F'", 'L', "L'", 'B', "B'"];
      const seq = iddfs(s, goalFn, 8, restricted);
      if (seq) {
        for (const m of seq) moves.push(m);
        return { state: applyMoves(s, seq), moves };
      }
      return { state: s, moves, error: 'Yellow cross failed' };
    }

    for (const m of bestMoves) moves.push(m);
    s = bestState;
  }

  if (!D_CROSS.every(f => s[f] === 'D')) {
    return { state: s, moves, error: 'Yellow cross incomplete' };
  }
  return { state: s, moves };
}

// ---------------------------------------------------------------------------
// PHASE 5: Yellow Edge Permutation (algorithmic Ua/Ub perm)
// ---------------------------------------------------------------------------
const UA_PERM = ["R", "D'", "R", "D", "R", "D", "R", "D'", "R'", "D'", "R2"];
const UB_PERM = ["R2", "D", "R", "D", "R'", "D'", "R'", "D'", "R'", "D", "R'"];

function countCorrectDEdges(st) {
  let count = 0;
  for (const { side, center } of D_EDGE_SIDES) {
    if (st[side] === st[center]) count++;
  }
  return count;
}

function solveYellowEdgePerm(startState) {
  const moves = [];
  let s = startState;

  // Try up to 6 iterations (covers 3-cycle, double-swap, and 4-cycle cases)
  for (let iter = 0; iter < 6; iter++) {
    // Find best D alignment
    let bestD = 0, bestCount = 0;
    for (let d = 0; d < 4; d++) {
      const dm = dRotMoves(d);
      const t = dm.length ? applyMoves(s, dm) : s;
      const c = countCorrectDEdges(t);
      if (c > bestCount) { bestCount = c; bestD = d; }
    }
    if (bestD > 0) s = apply(s, dRotMoves(bestD), moves);
    if (bestCount === 4) break;

    // Try all combinations: D-setup + alg, pick the one that gives best result after optimal D alignment
    let bestAlg = null, bestSetup = [], bestNext = -1;
    for (const alg of [UA_PERM, UB_PERM]) {
      for (const setup of [[], ['D'], ['D2'], ["D'"]]) {
        const t = applyMoves(applyMoves(s, setup), alg);
        for (let d = 0; d < 4; d++) {
          const dm = dRotMoves(d);
          const tt = dm.length ? applyMoves(t, dm) : t;
          const c = countCorrectDEdges(tt);
          if (c > bestNext) { bestNext = c; bestAlg = alg; bestSetup = setup; }
        }
      }
    }
    if (bestSetup.length) s = apply(s, bestSetup, moves);
    s = apply(s, bestAlg || UA_PERM, moves);
  }

  // Final D alignment
  for (let d = 0; d < 4; d++) {
    const dm = dRotMoves(d);
    const t = dm.length ? applyMoves(s, dm) : s;
    if (countCorrectDEdges(t) === 4) {
      if (dm.length) s = apply(s, dm, moves);
      break;
    }
  }

  // Verify D cross is intact
  const crossOk = D_CROSS.every(f => s[f] === 'D');
  const edgesOk = countCorrectDEdges(s) === 4;
  if (!crossOk || !edgesOk) {
    return { state: s, moves, error: 'Edge permutation failed' };
  }
  return { state: s, moves };
}

// ---------------------------------------------------------------------------
// PHASE 6: Yellow Corner Permutation (algorithmic Niklas)
// ---------------------------------------------------------------------------
const NIKLAS = ["D", "R", "D'", "L'", "D", "R'", "D'", "L"];
const NIKLAS_INV = ["L'", "D", "R", "D'", "L", "D", "R'", "D'"];

function expectedCornerColors(cornerIdx) {
  const map = {
    4: ['D', 'F', 'R'],
    5: ['D', 'F', 'L'],
    6: ['D', 'B', 'R'],
    7: ['D', 'B', 'L'],
  };
  return map[cornerIdx];
}

function countCorrectDCorners(st) {
  let count = 0;
  for (let i = 4; i <= 7; i++) {
    const [a, b, c] = CORNERS[i];
    const colors = new Set([st[a], st[b], st[c]]);
    const expected = expectedCornerColors(i);
    if (expected.every(e => colors.has(e))) count++;
  }
  return count;
}

function solveYellowCornerPerm(startState) {
  const moves = [];
  let s = startState;

  // Use conjugated Niklas: setup + Niklas + undo_setup
  // This preserves edges while 3-cycling corners.
  const SETUPS = [
    [[], []],
    [['D'], ["D'"]],
    [['D2'], ['D2']],
    [["D'"], ['D']],
  ];

  for (let iter = 0; iter < 8; iter++) {
    if (countCorrectDCorners(s) === 4) break;

    // Try all conjugated variants, pick best
    let bestSeq = null, bestCount = countCorrectDCorners(s);
    for (const alg of [NIKLAS, NIKLAS_INV]) {
      for (const [setup, undo] of SETUPS) {
        const fullSeq = [...setup, ...alg, ...undo];
        const t = applyMoves(s, fullSeq);
        const c = countCorrectDCorners(t);
        if (c > bestCount) {
          bestCount = c;
          bestSeq = fullSeq;
        }
      }
    }

    if (bestSeq) {
      s = apply(s, bestSeq, moves);
    } else {
      // No greedy improvement — apply base Niklas to change state
      s = apply(s, NIKLAS, moves);
    }
  }

  if (countCorrectDCorners(s) !== 4) {
    return { state: s, moves, error: 'Corner permutation failed' };
  }
  return { state: s, moves };
}

// ---------------------------------------------------------------------------
// PHASE 7: Yellow Corner Orientation
// ---------------------------------------------------------------------------
function solveYellowCornerOrient(startState) {
  const moves = [];
  let s = startState;
  const trigger = ["R", "U", "R'", "U'"];

  for (let corner = 0; corner < 4; corner++) {
    for (let pair = 0; pair < 3; pair++) {
      if (s[29] === 'D') break;
      s = apply(s, trigger, moves);
      s = apply(s, trigger, moves);
    }
    if (corner < 3) {
      s = apply(s, ['D'], moves);
    }
  }

  // Fix D-layer alignment
  for (let i = 0; i < 4; i++) {
    if (D_EDGE_SIDES.every(({ side, center }) => s[side] === s[center])) break;
    s = apply(s, ['D'], moves);
  }

  return { state: s, moves };
}

// ---------------------------------------------------------------------------
// Helpers for preservation
// ---------------------------------------------------------------------------
function buildF2LCheck(state) {
  const checks = [];
  for (const [u, si] of CROSS_EDGES) {
    checks.push([u, state[u]]);
    checks.push([si, state[si]]);
  }
  for (const def of CORNER_DEFS) {
    for (const f of def.facelets) {
      checks.push([f, state[f]]);
    }
  }
  for (const { facelets: [f1, f2] } of MID_SLOT_DEFS) {
    checks.push([f1, state[f1]]);
    checks.push([f2, state[f2]]);
  }
  return checks;
}

// ---------------------------------------------------------------------------
// Main solver
// ---------------------------------------------------------------------------
export function solveLayered(state) {
  if (isSolved(state)) return { moves: [], phases: [] };

  const startState = state;
  const phases = [];
  const allMoves = [];
  let s = state;

  const phaseRunners = [
    ['White Cross',               solveWhiteCross],
    ['White Corners',             solveWhiteCorners],
    ['Middle Layer',              solveMiddleLayer],
    ['Yellow Cross',              solveYellowCross],
    ['Yellow Edge Permutation',   solveYellowEdgePerm],
    ['Yellow Corner Permutation', solveYellowCornerPerm],
    ['Yellow Corner Orientation', solveYellowCornerOrient],
  ];

  for (const [name, fn] of phaseRunners) {
    let result;
    try {
      result = fn(s);
    } catch (err) {
      return { moves: allMoves, phases, error: `${name} threw: ${err.message}` };
    }

    s = result.state;
    const phaseMoves = result.moves || [];
    allMoves.push(...phaseMoves);
    phases.push({ name, moves: phaseMoves });

    if (result.error) {
      return { moves: allMoves, phases, error: `${name}: ${result.error}` };
    }
  }

  const finalState = applyMoves(startState, allMoves);
  if (!isSolved(finalState)) {
    return { moves: allMoves, phases, error: 'Solver did not fully solve the cube.' };
  }

  return { moves: allMoves, phases };
}
