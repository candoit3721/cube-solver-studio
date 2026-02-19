/**
 * Face tracker — manages multi-face progress for free-rotation scanning.
 *
 * Orchestrates detection → classification → accumulation → confirmation
 * for all 6 cube faces. Identifies each face by its center sticker color.
 *
 * After all 6 faces are captured, getResult() applies orientation correction
 * (using adjacency constraints) and snap correction (ensuring 9 of each color).
 */

import { createAccumulator } from './scanAccumulator.js';
import { FACES } from '../engine/constants.js';
import { orientFaces, snapCorrectAll } from './faceOrienter.js';

// Center sticker → face mapping
const CENTER_TO_FACE = {
    U: 'U',  // White
    D: 'D',  // Yellow
    F: 'F',  // Green
    B: 'B',  // Blue
    R: 'R',  // Red
    L: 'L',  // Orange
};

/**
 * Create a new face tracker instance.
 *
 * @returns {Object} Tracker with methods to process detections and query progress.
 */
export function createFaceTracker() {
    // Per-face accumulators
    const accumulators = {};
    FACES.forEach(f => { accumulators[f] = createAccumulator(); });

    // Confirmed face colors: { U: string[9] | null, ... }
    const confirmed = {};
    FACES.forEach(f => { confirmed[f] = null; });

    // Track recently rejected face to avoid spamming
    let lastRejection = null;

    return {
        /**
         * Process a detected face — classify, accumulate, and confirm.
         *
         * @param {string[]} colors - 9-element array of face letters (from classifier)
         * @param {number[]} confidences - 9-element confidence values
         * @returns {{ event: string, face?: string, colors?: string[], progress?: Object }}
         *   event is one of: 'accumulated', 'confirmed', 'duplicate', 'rejected', 'no_center'
         */
        processDetection(colors, confidences) {
            const centerFace = colors[4];

            // If center cell couldn't be classified, skip
            if (!centerFace || !CENTER_TO_FACE[centerFace]) {
                return { event: 'no_center' };
            }

            const faceId = CENTER_TO_FACE[centerFace];

            // Already confirmed — skip
            if (confirmed[faceId]) {
                return { event: 'duplicate', face: faceId };
            }

            // Feed into face-specific accumulator
            accumulators[faceId].addFrame(faceId, colors, confidences);

            // Check for confirmation
            const check = accumulators[faceId].checkConfirmation(faceId);

            if (!check.confirmed) {
                return {
                    event: 'accumulated',
                    face: faceId,
                    bufferSize: accumulators[faceId].getBufferSize(faceId)
                };
            }

            // Confirmed! For faces 1-5, do basic color count validation.
            // For the 6th face, accept as-is — orientation + snap correction
            // happens in getResult() after all faces are captured.
            const confirmedCount = FACES.filter(f => confirmed[f]).length;

            if (confirmedCount < 5) {
                // Faces 1-5: validate color counts don't exceed 9
                const colorCounts = {};
                FACES.forEach(f => { colorCounts[f] = 0; });
                for (const f of FACES) {
                    if (confirmed[f]) {
                        for (const c of confirmed[f]) {
                            colorCounts[c] = (colorCounts[c] || 0) + 1;
                        }
                    }
                }
                for (const c of check.colors) {
                    colorCounts[c] = (colorCounts[c] || 0) + 1;
                }

                const overLimit = Object.entries(colorCounts).find(([, n]) => n > 9);
                if (overLimit) {
                    accumulators[faceId].reset(faceId);
                    lastRejection = { face: faceId, reason: `Too many ${overLimit[0]} stickers` };
                    return {
                        event: 'rejected',
                        face: faceId,
                        reason: lastRejection.reason
                    };
                }
            }

            // Accept this face
            confirmed[faceId] = check.colors;

            return {
                event: 'confirmed',
                face: faceId,
                colors: check.colors,
                progress: this.getProgress()
            };
        },

        /**
         * Get current scanning progress.
         */
        getProgress() {
            const capturedFaces = FACES.filter(f => confirmed[f]);
            const remaining = FACES.filter(f => !confirmed[f]);

            return {
                captured: capturedFaces.length,
                total: 6,
                complete: capturedFaces.length >= 6,
                faces: { ...confirmed },
                capturedList: capturedFaces,
                remainingList: remaining
            };
        },

        /**
         * Get confirmed colors for all faces, with orientation and snap correction.
         *
         * 1. Orient faces using adjacency constraints (fixes unknown camera rotation)
         * 2. Snap-correct to ensure exactly 9 of each color
         *
         * Returns null if not all 6 faces are captured.
         */
        getResult() {
            if (FACES.some(f => !confirmed[f])) return null;

            const raw = {};
            FACES.forEach(f => { raw[f] = [...confirmed[f]]; });

            const oriented = orientFaces(raw);
            return snapCorrectAll(oriented);
        },

        /**
         * Get raw (unoriented) confirmed colors. Used for progress display
         * during scanning — orientation is applied only on final getResult().
         */
        getRawFaces() {
            const result = {};
            FACES.forEach(f => { result[f] = confirmed[f] ? [...confirmed[f]] : null; });
            return result;
        },

        /**
         * Remove a confirmed face (allow re-scan).
         */
        resetFace(faceId) {
            confirmed[faceId] = null;
            accumulators[faceId] = createAccumulator();
        },

        /**
         * Reset all tracking state.
         */
        resetAll() {
            FACES.forEach(f => {
                confirmed[f] = null;
                accumulators[f] = createAccumulator();
            });
            lastRejection = null;
        },

        /**
         * Get the last rejection info (for UI feedback).
         */
        getLastRejection() {
            return lastRejection;
        }
    };
}
