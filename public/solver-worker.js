/* eslint-disable no-restricted-globals */

// Import cubejs libraries from CDN for worker context
importScripts(
    'https://cdn.jsdelivr.net/npm/cubejs@1.3.0/lib/cube.js',
    'https://cdn.jsdelivr.net/npm/cubejs@1.3.0/lib/solve.js'
);

let initialized = false;

self.onmessage = function (e) {
    const { faceletStr } = e.data;

    try {
        if (!initialized) {
            if (typeof Cube === 'undefined') {
                throw new Error('Cube library failed to load in worker');
            }
            // Initialize solver tables (expensive, done once)
            Cube.initSolver();
            initialized = true;
        }

        const cube = Cube.fromString(faceletStr);
        // This call is synchronous and blocking within the worker
        const solution = cube.solve(22);
        self.postMessage({ success: true, solution });
    } catch (err) {
        self.postMessage({ success: false, error: err.message || 'Solver error' });
    }
};
