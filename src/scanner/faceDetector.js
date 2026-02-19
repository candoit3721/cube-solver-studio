/**
 * Face detector — extracts 9 cell colors from a dewarped cube face image.
 *
 * Takes the 300x300 dewarped image from the CV worker and samples
 * colors at the 9 cell positions, classifying each via the HSV classifier.
 */

import { classifyColor, sampleRegionFromData } from './colorClassifier.js';

const DEWARPED_SIZE = 300;
const CELL_SIZE = DEWARPED_SIZE / 3;  // 100px per cell

/**
 * Sample and classify the 9 cells from a dewarped 300x300 face image.
 *
 * @param {{ data: Uint8ClampedArray, width: number, height: number }} dewarpedData
 * @returns {{ colors: string[], confidences: number[], centerFace: string|null }}
 */
export function classifyDewarpedFace(dewarpedData) {
    const { data, width } = dewarpedData;

    // Create an ImageData-like object for sampleRegionFromData
    const imageData = { data };
    const sampleRadius = CELL_SIZE * 0.2;  // sample ~40% of cell width

    const colors = [];
    const confidences = [];

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const cx = col * CELL_SIZE + CELL_SIZE / 2;
            const cy = row * CELL_SIZE + CELL_SIZE / 2;

            const avg = sampleRegionFromData(imageData, width, cx, cy, sampleRadius);
            const { face, confidence } = classifyColor(avg.r, avg.g, avg.b);

            colors.push(face);
            confidences.push(confidence);
        }
    }

    return {
        colors,
        confidences,
        centerFace: colors[4]  // center cell identifies the face
    };
}

/**
 * Compute bounding box in video coordinates from detection result.
 * Used for drawing detection indicators on the overlay.
 */
export function getDetectionBounds(detectionResult) {
    if (!detectionResult || !detectionResult.bounds) return null;
    return detectionResult.bounds;
}
