/**
 * Per-session color calibration for Rubik's cube scanning.
 *
 * Stores reference RGB values for each of the 6 face colors,
 * captured under the user's current lighting conditions.
 * Uses nearest-neighbor Euclidean RGB distance for classification.
 *
 * State is module-level (session-scoped) — cleared on page refresh.
 */

const FACE_IDS = ['U', 'D', 'F', 'B', 'R', 'L'];

/** @type {null | Record<string, {r: number, g: number, b: number}>} */
let refs = null;

export function setCalibration(faceId, rgb) {
    if (!refs) refs = {};
    refs[faceId] = { r: rgb.r, g: rgb.g, b: rgb.b };
}

export function setAllCalibrations(map) {
    refs = {};
    for (const face of FACE_IDS) {
        if (map[face]) {
            refs[face] = { r: map[face].r, g: map[face].g, b: map[face].b };
        }
    }
}

export function clearCalibration() {
    refs = null;
}

export function isCalibrated() {
    if (!refs) return false;
    return FACE_IDS.every(f => refs[f]);
}

export function getCalibrationData() {
    if (!refs) return null;
    const copy = {};
    for (const f of FACE_IDS) {
        if (refs[f]) copy[f] = { ...refs[f] };
    }
    return copy;
}

/**
 * Classify an RGB pixel using nearest-neighbor against calibration references.
 *
 * Confidence: 1 - (nearestDist / (nearestDist + secondDist))
 * High when nearest is much closer than second-nearest.
 */
export function classifyCalibrated(r, g, b) {
    if (!refs) return { face: null, confidence: 0 };

    // Dark pixel guard — matches HSV classifier's v < 40 behavior
    const v = Math.max(r, g, b);
    if (v < 40) return { face: null, confidence: 0.1 };

    let nearest = null;
    let nearestDist = Infinity;
    let secondDist = Infinity;

    for (const face of FACE_IDS) {
        const ref = refs[face];
        if (!ref) continue;
        const dr = r - ref.r;
        const dg = g - ref.g;
        const db = b - ref.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        if (dist < nearestDist) {
            secondDist = nearestDist;
            nearest = face;
            nearestDist = dist;
        } else if (dist < secondDist) {
            secondDist = dist;
        }
    }

    if (!nearest) return { face: null, confidence: 0 };

    // Max distance fallback — too far from all references, let HSV handle it
    if (nearestDist > 120) return { face: null, confidence: 0.15 };

    const confidence = (nearestDist + secondDist) > 0
        ? 1 - (nearestDist / (nearestDist + secondDist))
        : 1;

    return { face: nearest, confidence: Math.max(0, Math.min(1, confidence)) };
}
