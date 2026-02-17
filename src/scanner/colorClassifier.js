/**
 * Color classification for Rubik's cube face scanning.
 *
 * Uses HSV-based classification with continuous hue coverage —
 * every chromatic pixel maps to exactly one color with zero gaps.
 */

export const REFERENCE_COLORS = [
    { face: 'U', r: 255, g: 255, b: 255, label: 'White' },
    { face: 'D', r: 255, g: 213, b: 0, label: 'Yellow' },
    { face: 'F', r: 0, g: 158, b: 96, label: 'Green' },
    { face: 'B', r: 0, g: 81, b: 186, label: 'Blue' },
    { face: 'R', r: 196, g: 30, b: 58, label: 'Red' },
    { face: 'L', r: 255, g: 88, b: 0, label: 'Orange' },
];

/**
 * Convert RGB [0-255] to HSV (OpenCV-style).
 * H: 0-180, S: 0-255, V: 0-255
 */
export function rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    const v = max; // 0-255
    const s = max === 0 ? 0 : (d / max) * 255;

    let h = 0;
    if (d !== 0) {
        if (max === r) h = 30 * ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = 30 * ((b - r) / d + 2);
        else h = 30 * ((r - g) / d + 4);
    }

    return { h, s, v };
}

/**
 * Classify a single RGB pixel to a cube face color using HSV.
 *
 * HSV ranges (H: 0-180 OpenCV-style, S: 0-255, V: 0-255):
 *   White:  S < 60  AND V > 140
 *   Red:    H in [0, 8) or [160, 180]  AND S > 80  AND V <= 170
 *   Orange: H in [0, 22)  AND S > 80  AND (H >= 8 OR V > 170)
 *   Yellow: H in [22, 38)  AND S > 80
 *   Green:  H in [38, 85)  AND S > 50
 *   Blue:   H in [85, 160) AND S > 50
 *
 * Key insight for red/orange: orange stickers are always significantly
 * brighter (higher V) than red stickers. In the overlap zone (H < 8),
 * brightness disambiguates them.
 *
 * Returns { face, confidence } where confidence is 0-1.
 */
export function classifyColor(r, g, b) {
    const { h, s, v } = rgbToHsv(r, g, b);

    // Very dark pixels — cube body or shadow
    if (v < 40) return { face: null, confidence: 0.1 };

    // White: low saturation, reasonable brightness
    if (s < 60 && v > 140) {
        const conf = 0.6 + (v / 255) * 0.3 + ((60 - s) / 60) * 0.1;
        return { face: 'U', confidence: Math.min(1, conf) };
    }

    // Low saturation but not bright enough for white — ambiguous
    if (s < 50) return { face: null, confidence: 0.15 };

    // Chromatic classification — continuous hue bins with no gaps
    let face = null;
    let confidence = 0;

    if (h < 22 && !(h >= 160)) {
        // Red/Orange zone — use brightness to disambiguate.
        // Orange stickers: bright (V > 170), hue 0-22
        // Red stickers: darker (V <= 170), hue 0-8 or wrapping at 160+
        if (s > 80) {
            if (h >= 8 || v > 170) {
                // Orange: either clearly in the orange hue range (H >= 8),
                // or in the low-hue zone but bright (warm-shifted orange)
                face = 'L';
                const center = 14;
                confidence = 1 - Math.abs(h - center) / 16;
            } else {
                // Red: low hue AND not bright
                face = 'R';
                confidence = 1 - h / 20;
            }
        }
    } else if (h >= 160) {
        // Red — high-hue wrap-around (always red, never orange)
        if (s > 80) {
            face = 'R';
            confidence = 1 - (180 - h) / 20;
        }
    } else if (h < 38) {
        // Yellow
        if (s > 80) {
            face = 'D';
            const center = 29;
            confidence = 1 - Math.abs(h - center) / 18;
        }
    } else if (h < 85) {
        // Green
        if (s > 50) {
            face = 'F';
            const center = 60;
            confidence = 1 - Math.abs(h - center) / 47;
        }
    } else {
        // Blue (h >= 85 && h < 160)
        if (s > 50) {
            face = 'B';
            const center = 110;
            confidence = 1 - Math.abs(h - center) / 75;
        }
    }

    // If saturation was too low for the bin thresholds, still classify
    // by the closest bin but with reduced confidence
    if (!face && s >= 50) {
        if (h < 22 && h < 160) {
            // Red/orange zone — use brightness
            face = (h >= 8 || v > 170) ? 'L' : 'R';
            confidence = 0.3;
        } else if (h >= 160) { face = 'R'; confidence = 0.3; }
        else if (h < 38) { face = 'D'; confidence = 0.3; }
        else if (h < 85) { face = 'F'; confidence = 0.3; }
        else { face = 'B'; confidence = 0.3; }
    }

    // High-brightness, low-saturation white guard (warm light).
    // Only override when saturation is very low — avoids misclassifying
    // actual pale yellow/orange stickers in bright conditions.
    if (v > 230 && s < 55 && (face === 'D' || face === 'L')) {
        face = 'U';
        confidence = 0.45;
    }

    return { face, confidence: Math.max(0, Math.min(1, confidence)) };
}

/**
 * Sample a square region from ImageData and return average RGB.
 * Works directly with raw pixel buffer (no ctx.getImageData call needed).
 * @param {number} halfSize - Half the side length of the square sample region.
 */
export function sampleRegionFromData(imageData, imgWidth, cx, cy, halfSize) {
    const data = imageData.data;
    const size = Math.max(1, Math.round(halfSize));
    const x0 = Math.max(0, Math.round(cx - size));
    const y0 = Math.max(0, Math.round(cy - size));
    const x1 = Math.min(imgWidth - 1, Math.round(cx + size));
    const y1 = Math.min((data.length / 4 / imgWidth) - 1, Math.round(cy + size));

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const i = (y * imgWidth + x) * 4;
            rSum += data[i];
            gSum += data[i + 1];
            bSum += data[i + 2];
            count++;
        }
    }
    if (count === 0) return { r: 0, g: 0, b: 0 };
    return { r: rSum / count, g: gSum / count, b: bSum / count };
}
