/**
 * faceOrienter.js — Orients scanned faces using Rubik's cube adjacency constraints.
 *
 * In free-scan mode, camera orientation relative to each face is unknown,
 * so the scanned 3×3 grid could be rotated 0°, 90°, 180°, or 270°.
 *
 * This module finds the rotation for each face that maximizes valid adjacency
 * constraints:
 *   - Edge pieces can't have opposite colors (U/D, F/B, R/L)
 *   - Corner pieces must have one color from each opposite pair
 *
 * Brute-forces all 4^6 = 4096 rotation combinations (instant).
 *
 * Face indexing convention (looking at a face straight on):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 *
 * Physical corner/edge positions derived from standard cube assembly:
 *   UFR corner: U[8], F[2], R[0]
 *   UFL corner: U[6], F[0], L[2]
 *   etc.
 */

import { FACES } from '../engine/constants.js';

/* ── Opposite face pairs ── */

const OPPOSITES = [['U', 'D'], ['F', 'B'], ['R', 'L']];

/* ── Physical corner positions: [faceA, idxA, faceB, idxB, faceC, idxC] ── */

const CORNERS = [
    ['U', 8, 'F', 2, 'R', 0],
    ['U', 6, 'F', 0, 'L', 2],
    ['U', 2, 'B', 0, 'R', 2],
    ['U', 0, 'B', 2, 'L', 0],
    ['D', 2, 'F', 8, 'R', 6],
    ['D', 0, 'F', 6, 'L', 8],
    ['D', 8, 'B', 6, 'R', 8],
    ['D', 6, 'B', 8, 'L', 6],
];

/* ── Physical edge positions: [faceA, idxA, faceB, idxB] ── */

const EDGES = [
    ['U', 7, 'F', 1],
    ['U', 5, 'R', 1],
    ['U', 1, 'B', 1],
    ['U', 3, 'L', 1],
    ['D', 1, 'F', 7],
    ['D', 5, 'R', 7],
    ['D', 7, 'B', 7],
    ['D', 3, 'L', 7],
    ['F', 5, 'R', 3],
    ['F', 3, 'L', 5],
    ['B', 3, 'R', 5],
    ['B', 5, 'L', 3],
];

/* ── Piece validity checks ── */

function isValidEdge(c1, c2) {
    if (c1 === c2) return false;
    return !OPPOSITES.some(([a, b]) =>
        (c1 === a && c2 === b) || (c1 === b && c2 === a)
    );
}

function isValidCorner(c1, c2, c3) {
    if (c1 === c2 || c1 === c3 || c2 === c3) return false;
    const colors = [c1, c2, c3];
    return OPPOSITES.every(([a, b]) =>
        !(colors.includes(a) && colors.includes(b))
    );
}

/* ── Face rotation ── */

/**
 * Rotate a 9-element face array 90° clockwise.
 *   0 1 2      6 3 0
 *   3 4 5  →   7 4 1
 *   6 7 8      8 5 2
 */
function rotateCW(colors) {
    return [
        colors[6], colors[3], colors[0],
        colors[7], colors[4], colors[1],
        colors[8], colors[5], colors[2],
    ];
}

function rotateN(colors, n) {
    let result = colors;
    for (let i = 0; i < (n % 4); i++) {
        result = rotateCW(result);
    }
    return result;
}

/* ── Scoring ── */

/**
 * Score a rotation combination by counting valid adjacency constraints.
 * Corners weighted 3× (more diagnostic — 3 faces involved).
 * Max score = 8×3 + 12×1 = 36.
 */
function scoreRotation(faces) {
    let score = 0;

    for (const [fA, iA, fB, iB, fC, iC] of CORNERS) {
        if (isValidCorner(faces[fA][iA], faces[fB][iB], faces[fC][iC])) {
            score += 3;
        }
    }

    for (const [fA, iA, fB, iB] of EDGES) {
        if (isValidEdge(faces[fA][iA], faces[fB][iB])) {
            score += 1;
        }
    }

    return score;
}

/* ── Main entry point ── */

/**
 * Find the correct rotation for each scanned face.
 *
 * @param {Object} faceMap - { U: string[9], D: string[9], F: string[9], B: string[9], R: string[9], L: string[9] }
 * @returns {Object} Corrected faceMap with best rotations applied
 */
export function orientFaces(faceMap) {
    // Pre-compute all 4 rotations for each face
    const allRotations = {};
    for (const f of FACES) {
        allRotations[f] = [
            faceMap[f],
            rotateN(faceMap[f], 1),
            rotateN(faceMap[f], 2),
            rotateN(faceMap[f], 3),
        ];
    }

    let bestScore = -1;
    let bestRots = [0, 0, 0, 0, 0, 0];

    // FACES = ['U', 'D', 'R', 'L', 'F', 'B']
    for (let r0 = 0; r0 < 4; r0++)
    for (let r1 = 0; r1 < 4; r1++)
    for (let r2 = 0; r2 < 4; r2++)
    for (let r3 = 0; r3 < 4; r3++)
    for (let r4 = 0; r4 < 4; r4++)
    for (let r5 = 0; r5 < 4; r5++) {
        const rots = [r0, r1, r2, r3, r4, r5];
        const rotated = {};
        for (let i = 0; i < 6; i++) {
            rotated[FACES[i]] = allRotations[FACES[i]][rots[i]];
        }

        const score = scoreRotation(rotated);
        if (score > bestScore) {
            bestScore = score;
            bestRots = [...rots];
        }
    }

    const result = {};
    for (let i = 0; i < 6; i++) {
        result[FACES[i]] = [...allRotations[FACES[i]][bestRots[i]]];
    }
    return result;
}

/* ── Snap-correction scoring ── */

/**
 * Score a configuration for snap-correction candidate evaluation.
 * Extends basic validity scoring with uniqueness constraints —
 * real Rubik's cubes never have duplicate corner triples or edge pairs.
 */
function scoreForSnap(faces) {
    let score = scoreRotation(faces);

    // Penalize duplicate corner color combinations (impossible on a real cube)
    const cornerKeys = new Set();
    for (const [fA, iA, fB, iB, fC, iC] of CORNERS) {
        const key = [faces[fA][iA], faces[fB][iB], faces[fC][iC]].sort().join('');
        if (cornerKeys.has(key)) score -= 6;
        cornerKeys.add(key);
    }

    // Penalize duplicate edge color pairs
    const edgeKeys = new Set();
    for (const [fA, iA, fB, iB] of EDGES) {
        const key = [faces[fA][iA], faces[fB][iB]].sort().join('');
        if (edgeKeys.has(key)) score -= 3;
        edgeKeys.add(key);
    }

    return score;
}

/**
 * Global snap-correction: ensure exactly 9 of each color across all faces.
 *
 * For each over-counted color, evaluates ALL candidate replacement positions
 * and picks the swap that maximizes corner/edge validity + uniqueness.
 * This prevents blindly replacing a correct sticker when the actual
 * misclassification is elsewhere (e.g. Orange misread as Red).
 *
 * @param {Object} faceMap - { U: string[9], ... }
 * @returns {Object} Corrected faceMap
 */
export function snapCorrectAll(faceMap) {
    const counts = {};
    FACES.forEach(f => { counts[f] = 0; });
    for (const face of FACES) {
        for (const c of faceMap[face]) {
            counts[c] = (counts[c] || 0) + 1;
        }
    }

    if (FACES.every(f => counts[f] === 9)) return faceMap;

    const result = {};
    FACES.forEach(f => { result[f] = [...faceMap[f]]; });

    const over = FACES.filter(f => counts[f] > 9);
    const under = FACES.filter(f => counts[f] < 9);

    for (const overColor of over) {
        while (counts[overColor] > 9 && under.length > 0) {
            const neediest = under.reduce((a, b) =>
                (9 - counts[a]) > (9 - counts[b]) ? a : b, under[0]);
            if (!neediest || counts[neediest] >= 9) break;

            // Collect all candidate stickers of overColor on non-home faces
            const candidates = [];
            for (const face of FACES) {
                if (face === overColor) continue;
                for (let i = 0; i < 9; i++) {
                    if (i === 4) continue;
                    if (result[face][i] !== overColor) continue;
                    candidates.push({ face, idx: i });
                }
            }

            if (candidates.length === 0) break;

            // Evaluate each candidate swap and pick the best
            let bestCandidate = candidates[0];
            let bestScore = -Infinity;

            for (const cand of candidates) {
                // Simulate the swap
                result[cand.face][cand.idx] = neediest;
                let score = scoreForSnap(result);
                // Tiebreaker: prefer placing replacement on its home face
                if (cand.face === neediest) score += 0.1;
                result[cand.face][cand.idx] = overColor; // undo

                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = cand;
                }
            }

            // Apply the best swap
            result[bestCandidate.face][bestCandidate.idx] = neediest;
            counts[overColor]--;
            counts[neediest]++;

            if (counts[neediest] >= 9) {
                const idx = under.indexOf(neediest);
                if (idx !== -1) under.splice(idx, 1);
            }
        }
    }

    return result;
}
