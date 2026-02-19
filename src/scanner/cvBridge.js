/**
 * Promise-based bridge for communicating with the OpenCV Web Worker.
 *
 * Handles lazy loading, request/response correlation, and cleanup.
 */

let worker = null;
let readyPromise = null;
let requestId = 0;
const pending = new Map();

/**
 * Initialize the CV worker. Returns a promise that resolves when
 * OpenCV.js WASM is loaded and ready inside the worker.
 *
 * Safe to call multiple times — returns the existing promise if already loading.
 */
export function initCVWorker() {
    if (readyPromise) return readyPromise;

    readyPromise = new Promise((resolve, reject) => {
        try {
            worker = new Worker('/cvWorker.js', { type: 'classic' });
        } catch (err) {
            readyPromise = null;
            reject(new Error('Failed to create CV worker: ' + err.message));
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('OpenCV.js load timed out (30s)'));
            readyPromise = null;
        }, 30000);

        worker.onmessage = (e) => {
            if (e.data.type === 'ready') {
                clearTimeout(timeout);
                // Replace onmessage with the normal handler
                worker.onmessage = handleMessage;
                resolve();
                return;
            }

            // Handle normal messages during init race
            handleMessage(e);
        };

        worker.onerror = (err) => {
            clearTimeout(timeout);
            readyPromise = null;
            reject(new Error('CV worker error: ' + err.message));
        };
    });

    return readyPromise;
}

function handleMessage(e) {
    const { type } = e.data;

    if (type === 'result') {
        const p = pending.get(e.data.id);
        if (p) {
            pending.delete(e.data.id);
            if (e.data.error) {
                p.reject(new Error(e.data.error));
            } else {
                p.resolve(e.data.result);
            }
        }
    }
}

/**
 * Send an image frame to the worker for face detection.
 *
 * @param {ImageData} imageData - Raw RGBA pixel data from canvas
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Promise<Object|null>} Detection result or null if no face found
 */
export function detectFace(imageData, width, height) {
    if (!worker) {
        return Promise.reject(new Error('CV worker not initialized'));
    }

    const id = ++requestId;

    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });

        // Send raw buffer for zero-copy transfer.
        // ImageData itself isn't transferable in all browsers,
        // so we extract the buffer and reconstruct in the worker.
        const buffer = imageData.data.buffer;
        worker.postMessage(
            { type: 'detect', id, buffer, width, height },
            [buffer]
        );
    });
}

/**
 * Terminate the worker and clean up resources.
 */
export function terminateCVWorker() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    readyPromise = null;
    pending.clear();
}

/**
 * Send calibration reference colors to the worker so its local
 * classifyColor can use nearest-neighbor RGB matching.
 *
 * @param {Record<string, {r: number, g: number, b: number}>} refs
 */
export function sendCalibration(refs) {
    if (!worker) return;
    worker.postMessage({ type: 'calibrate', refs });
}

/**
 * Check if the worker is ready.
 */
export function isCVReady() {
    return worker !== null && readyPromise !== null;
}
