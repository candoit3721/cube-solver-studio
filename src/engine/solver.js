/**
 * Kociemba solver integration.
 * cubejs is loaded via <script> tag in index.html (global `Cube`).
 */

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
 * Solve a given faceMap. Returns { moves: string[], error?: string }.
 */
export function solveFaceMap(faceMap) {
    if (!solverReady || typeof window.Cube === 'undefined') {
        return { moves: [], error: 'Solver is still initializing, please wait a moment and try again.' };
    }

    try {
        const faceletStr = faceMapToFaceletString(faceMap);
        const cube = window.Cube.fromString(faceletStr);
        const solutionStr = cube.solve();
        const moves = parseSolverMoves(solutionStr);

        if (moves.length > 0) {
            return { moves };
        } else {
            return { moves: [], solved: true };
        }
    } catch (err) {
        console.error('[solver] Error:', err);
        return {
            moves: [],
            error: `Could not solve: ${err.message || 'invalid pattern'}. Ensure each color appears exactly 9 times.`,
        };
    }
}
