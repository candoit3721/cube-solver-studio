/**
 * Scan accumulator — multi-frame confirmation for cube face scanning.
 *
 * Collects color classification results over multiple frames and
 * uses majority voting to confirm stable readings before accepting a face.
 */

const WINDOW_MS = 2000;      // 2-second sliding window
const MIN_FRAMES = 5;        // minimum frames needed to confirm
const MIN_AVG_CONFIDENCE = 0.6;

/**
 * Create a new scan accumulator instance.
 */
export function createAccumulator() {
    // Per-face sample buffers: { [faceId]: [{ colors, confidences, timestamp }] }
    const buffers = {};

    return {
        /**
         * Add a frame sample for a detected face.
         * @param {string} faceId - Center cell face letter (U/D/F/B/R/L)
         * @param {string[]} colors - 9-element array of face letters
         * @param {number[]} confidences - 9-element array of confidences [0-1]
         */
        addFrame(faceId, colors, confidences) {
            if (!faceId) return;
            if (!buffers[faceId]) buffers[faceId] = [];
            buffers[faceId].push({
                colors: [...colors],
                confidences: [...confidences],
                timestamp: Date.now()
            });
            // Keep buffer manageable — at 250ms intervals, ~8 frames per 2s window
            if (buffers[faceId].length > 16) {
                buffers[faceId] = buffers[faceId].slice(-10);
            }
        },

        /**
         * Check if a face has enough consistent frames to be confirmed.
         * @param {string} faceId
         * @returns {{ confirmed: boolean, colors?: string[], avgConfidence?: number }}
         */
        checkConfirmation(faceId) {
            if (!buffers[faceId]) return { confirmed: false };

            const now = Date.now();
            // Filter to recent frames within the window
            const recent = buffers[faceId].filter(s => now - s.timestamp < WINDOW_MS);
            if (recent.length < MIN_FRAMES) return { confirmed: false };

            // Per-cell majority vote
            const resultColors = [];
            let totalConfidence = 0;
            let allAgreed = true;

            for (let i = 0; i < 9; i++) {
                // Count votes per color at this position
                const votes = {};
                let confSum = 0;
                for (const sample of recent) {
                    const c = sample.colors[i];
                    if (c === null) continue;
                    votes[c] = (votes[c] || 0) + 1;
                    confSum += sample.confidences[i];
                }

                // Find majority
                let bestColor = null, bestCount = 0;
                for (const [color, count] of Object.entries(votes)) {
                    if (count > bestCount) { bestCount = count; bestColor = color; }
                }

                // Center cell (index 4) needs unanimous agreement
                // Edge/corner cells need ≥ 3/4 majority (or 75% of samples)
                const threshold = i === 4
                    ? recent.length
                    : Math.ceil(recent.length * 0.75);

                if (bestCount < threshold) {
                    allAgreed = false;
                    break;
                }

                resultColors.push(bestColor);
                totalConfidence += confSum / recent.length;
            }

            if (!allAgreed) return { confirmed: false };

            const avgConfidence = totalConfidence / 9;
            if (avgConfidence < MIN_AVG_CONFIDENCE) return { confirmed: false };

            return {
                confirmed: true,
                colors: resultColors,
                avgConfidence
            };
        },

        /** Reset accumulator for one face or all faces. */
        reset(faceId) {
            if (faceId) {
                delete buffers[faceId];
            } else {
                Object.keys(buffers).forEach(k => delete buffers[k]);
            }
        },

        /** Get raw buffer for debugging/display */
        getBufferSize(faceId) {
            return buffers[faceId]?.length || 0;
        }
    };
}
