/**
 * Kociemba solver integration.
 * cubejs is loaded via <script> tag in index.html (global `Cube`).
 */

import { faceMapToState, applyMoves, isSolved } from './cubeState.js';

let solverReady = false;

/** Initialize the solver (call once on app start) */
export function initSolver() {
    if (typeof window.Cube !== 'undefined') {
        window.Cube.initSolver();
        solverReady = true;
        console.log('[solver] Kociemba solver initialized');
    } else {
        console.warn('[solver] cubejs not loaded — solver unavailable');
    }
}

export function isSolverReady() {
    return solverReady;
}

/**
 * Convert the app's faceMap → cubejs facelet string.
 * cubejs order: U(9) R(9) F(9) D(9) L(9) B(9)
 */
export function faceMapToFaceletString(faceMap) {
    const order = ['U', 'R', 'F', 'D', 'L', 'B'];
    return order.map(f => faceMap[f].join('')).join('');
}

/**
 * Parse solver output string → array of move strings.
 */
export function parseSolverMoves(solStr) {
    if (!solStr || !solStr.trim()) return [];
    return solStr.trim().split(/\s+/);
}

/**
 * Verify that a move sequence solves the given faceMap.
 */
export function verifySolution(faceMap, moves) {
    const state = faceMapToState(faceMap);
    const result = applyMoves(state, moves);
    return isSolved(result);
}

// Persistent worker instance — reused across solves to avoid
// expensive re-initialization of pruning tables.
let worker = null;

function getWorker() {
    if (!worker) {
        worker = new Worker('/solver-worker.js');
    }
    return worker;
}

/**
 * Solve a given faceMap ASYNC using Web Worker.
 * Returns Promise resolving to { moves: string[], error?: string }.
 */
export function solveFaceMap(faceMap) {
    return new Promise((resolve) => {
        const faceletStr = faceMapToFaceletString(faceMap);
        const w = getWorker();

        // 15s timeout — first call may need to build pruning tables
        const timeout = setTimeout(() => {
            w.terminate();
            worker = null;
            resolve({ moves: [], error: "Solver timed out. Pattern may be unsolvable." });
        }, 15000);

        w.onmessage = (e) => {
            clearTimeout(timeout);
            const { success, solution, error } = e.data;
            if (success) {
                const moves = parseSolverMoves(solution);
                // Verify the solution actually solves the cube
                if (moves.length > 0 && !verifySolution(faceMap, moves)) {
                    console.warn('[solver] Solution verification failed:', solution);
                    resolve({ moves, error: "Solution did not fully solve the cube." });
                } else {
                    resolve({ moves });
                }
            } else {
                resolve({ moves: [], error: "Solver error: " + error });
            }
        };

        w.onerror = (e) => {
            clearTimeout(timeout);
            w.terminate();
            worker = null;
            resolve({ moves: [], error: "Worker error: " + e.message });
        };

        w.postMessage({ faceletStr });
    });
}
