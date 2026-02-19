/**
 * Web Worker for OpenCV-based cube face detection.
 *
 * Two complementary detection approaches:
 *   A. "9-quad" — find 9 individual sticker contours, group into 3×3 grid
 *   B. "1-square" — find one large square (the whole face), subdivide into 3×3
 *
 * Approach B is critical for low-contrast faces (white, blue) where
 * inter-sticker borders are hard to detect.
 *
 * Memory safety: every cv.Mat from contours.get(i) is explicitly deleted
 * to prevent WASM heap exhaustion.
 */

/* global cv */

let ready = false;

self.importScripts('/opencv.js');

if (typeof cv === 'object' && cv.onRuntimeInitialized !== undefined) {
    cv.onRuntimeInitialized = () => { ready = true; self.postMessage({ type: 'ready' }); };
} else if (typeof cv === 'function') {
    cv().then(inst => { self.cv = inst; ready = true; self.postMessage({ type: 'ready' }); });
} else {
    ready = true;
    self.postMessage({ type: 'ready' });
}


/* ════════════════════════════════════════════════════════════
 *  MAIN ENTRY
 * ════════════════════════════════════════════════════════════ */

function detectFaceGrid(imageData, width, height) {
    if (!ready) return null;

    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();

    try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // ── Approach A: find 9 individual sticker quads ──
        let bestGrid = null;

        const threshStrategies = [
            () => makeAdaptiveThresh(gray, 11, 2),
            () => makeAdaptiveThresh(gray, 17, 3),
            () => makeAdaptiveThresh(gray, 7, 1),
            () => makeCanny(gray),
            () => makeOtsu(gray),
        ];

        for (const makeBinary of threshStrategies) {
            let binary = null;
            try {
                binary = makeBinary();
                const quads = extractQuads(binary, width, height);
                if (quads && quads.length >= 8) {
                    const grid = findGrid(quads);
                    if (grid && (!bestGrid || grid.score > bestGrid.score)) {
                        bestGrid = grid;
                    }
                }
            } catch { /* skip */ }
            finally { if (binary) binary.delete(); }
        }

        // ── Approach B: find one large square, subdivide into 3×3 ──
        for (const makeBinary of threshStrategies) {
            let binary = null;
            try {
                binary = makeBinary();
                const sq = findLargeSquare(binary, width, height);
                if (sq) {
                    const grid = squareToGrid(sq, width, height);
                    if (grid && (!bestGrid || grid.score > bestGrid.score)) {
                        bestGrid = grid;
                    }
                }
            } catch { /* skip */ }
            finally { if (binary) binary.delete(); }
        }

        if (!bestGrid) return null;

        const dewarped = dewarpGrid(src, bestGrid);
        return {
            cells: bestGrid.cells,
            bounds: bestGrid.bounds,
            dewarpedData: dewarped,
        };

    } finally {
        src.delete();
        gray.delete();
    }
}


/* ════════════════════════════════════════════════════════════
 *  BINARY IMAGE GENERATORS (each returns a cv.Mat caller must delete)
 * ════════════════════════════════════════════════════════════ */

function makeAdaptiveThresh(gray, blockSize, C) {
    const blurred = new cv.Mat();
    const thresh = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.adaptiveThreshold(blurred, thresh, 255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, blockSize, C);
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.dilate(thresh, thresh, kernel);
    kernel.delete();
    blurred.delete();
    return thresh; // caller deletes
}

function makeCanny(gray) {
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    const m = cv.mean(gray)[0];
    cv.Canny(blurred, edges, Math.max(0, m * 0.4), Math.min(255, m * 1.3));
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const dilated = new cv.Mat();
    cv.dilate(edges, dilated, kernel);
    kernel.delete();
    blurred.delete();
    edges.delete();
    return dilated; // caller deletes
}

function makeOtsu(gray) {
    const blurred = new cv.Mat();
    const thresh = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.dilate(thresh, thresh, kernel);
    kernel.delete();
    blurred.delete();
    return thresh; // caller deletes
}


/* ════════════════════════════════════════════════════════════
 *  APPROACH A — Extract individual sticker quads
 * ════════════════════════════════════════════════════════════ */

function extractQuads(binaryImg, width, height) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
        cv.findContours(binaryImg, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

        const imgArea = width * height;
        const minArea = imgArea * 0.0005;
        const maxArea = imgArea * 0.20;
        const quads = [];

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            try {
                const area = cv.contourArea(contour);
                if (area < minArea || area > maxArea) continue;

                const peri = cv.arcLength(contour, true);

                for (const eps of [0.02, 0.04, 0.06, 0.08]) {
                    const approx = new cv.Mat();
                    try {
                        cv.approxPolyDP(contour, approx, eps * peri, true);

                        if (approx.rows === 4 && cv.isContourConvex(approx)) {
                            const pts = [];
                            for (let j = 0; j < 4; j++) {
                                pts.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] });
                            }
                            const rect = cv.boundingRect(approx);
                            const aspect = rect.width / rect.height;

                            if (aspect > 0.25 && aspect < 4.0) {
                                const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
                                const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
                                quads.push({ pts, area, cx, cy, rect });
                                break; // matched — skip remaining epsilons
                            }
                        }
                    } finally {
                        approx.delete();
                    }
                }
            } finally {
                contour.delete(); // ← critical: prevents WASM heap leak
            }
        }

        return quads;
    } finally {
        contours.delete();
        hierarchy.delete();
    }
}


/* ════════════════════════════════════════════════════════════
 *  APPROACH B — Find one large square (the whole face)
 * ════════════════════════════════════════════════════════════ */

function findLargeSquare(binaryImg, width, height) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
        cv.findContours(binaryImg, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const imgArea = width * height;
        // The whole cube face should be 5-70% of the image
        const minArea = imgArea * 0.05;
        const maxArea = imgArea * 0.70;
        let bestSquare = null;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            try {
                const area = cv.contourArea(contour);
                if (area < minArea || area > maxArea) continue;

                const peri = cv.arcLength(contour, true);

                for (const eps of [0.02, 0.04, 0.06, 0.08]) {
                    const approx = new cv.Mat();
                    try {
                        cv.approxPolyDP(contour, approx, eps * peri, true);

                        if (approx.rows === 4 && cv.isContourConvex(approx)) {
                            const rect = cv.boundingRect(approx);
                            const aspect = rect.width / rect.height;

                            // Must be roughly square-ish
                            if (aspect > 0.5 && aspect < 2.0) {
                                // Prefer the largest square
                                if (!bestSquare || area > bestSquare.area) {
                                    const pts = [];
                                    for (let j = 0; j < 4; j++) {
                                        pts.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] });
                                    }
                                    bestSquare = { pts, area, rect };
                                }
                                break;
                            }
                        }
                    } finally {
                        approx.delete();
                    }
                }
            } finally {
                contour.delete();
            }
        }

        return bestSquare;
    } finally {
        contours.delete();
        hierarchy.delete();
    }
}

/**
 * Convert a single large square detection into a 3×3 grid
 * by subdividing the bounding rectangle.
 */
function squareToGrid(square, width, height) {
    const { rect, pts } = square;

    // Subdivide into 3×3
    const cellW = rect.width / 3;
    const cellH = rect.height / 3;

    if (cellW < 5 || cellH < 5) return null;

    const cells = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            cells.push({
                cx: rect.x + cellW * (col + 0.5),
                cy: rect.y + cellH * (row + 0.5),
                quad: null
            });
        }
    }

    // Score lower than 9-quad detection (less reliable) but still useful
    const score = 600 + square.area * 0.0005;

    return {
        cells,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        totalArea: square.area,
        score,
        detectedCount: 9
    };
}


/* ════════════════════════════════════════════════════════════
 *  GRID FINDING (for approach A)
 * ════════════════════════════════════════════════════════════ */

function findGrid(quads) {
    if (quads.length < 8) return null;

    const deduped = deduplicateQuads(quads);
    if (deduped.length < 8) return null;

    deduped.sort((a, b) => a.area - b.area);

    let bestGrid = null;

    for (let i = 0; i <= deduped.length - 8; i++) {
        const refArea = deduped[i].area;
        const group = [];
        for (let j = i; j < deduped.length; j++) {
            if (deduped[j].area <= refArea * 5.0) group.push(deduped[j]);
        }
        if (group.length < 8) continue;
        if (group.length > 30) {
            const med = group[Math.floor(group.length / 2)].area;
            group.sort((a, b) => Math.abs(a.area - med) - Math.abs(b.area - med));
            group.length = 20;
        }

        const g = tryFormGrid(group);
        if (g && (!bestGrid || g.score > bestGrid.score)) bestGrid = g;
    }

    return bestGrid;
}

function deduplicateQuads(quads) {
    const result = [];
    for (const q of quads) {
        const existIdx = result.findIndex(e => {
            const dx = e.cx - q.cx, dy = e.cy - q.cy;
            return Math.sqrt(dx * dx + dy * dy) < Math.sqrt((e.area + q.area) / 2) * 0.3;
        });
        if (existIdx < 0) {
            result.push(q);
        } else if (q.area > result[existIdx].area) {
            result[existIdx] = q;
        }
    }
    return result;
}

function tryFormGrid(quads) {
    if (quads.length < 8) return null;

    const centers = quads.map(q => ({ x: q.cx, y: q.cy, quad: q }));
    const sortedY = [...centers].sort((a, b) => a.y - b.y);

    const rows = clusterBy(sortedY, c => c.y, 3);
    if (!rows || rows.some(r => r.length < 2)) return null;

    const grid = [];
    for (const row of rows) {
        row.sort((a, b) => a.x - b.x);
        grid.push(row.length > 3 ? pickBestThree(row) : row.slice(0, 3));
    }

    const completeRows = grid.filter(r => r.length >= 3);
    if (completeRows.length < 2) return null;

    const xSp = [], ySp = [];
    for (const row of completeRows) {
        for (let i = 0; i < row.length - 1; i++) xSp.push(row[i + 1].x - row[i].x);
    }
    for (let col = 0; col < 3; col++) {
        const cc = [];
        for (const row of grid) {
            if (row.length >= 3) cc.push(row[col]);
            else if (row.length === 2 && col < 2) cc.push(row[col]);
        }
        for (let i = 0; i < cc.length - 1; i++) ySp.push(cc[i + 1].y - cc[i].y);
    }

    if (!xSp.length || !ySp.length) return null;
    const avgX = xSp.reduce((a, b) => a + b, 0) / xSp.length;
    const avgY = ySp.reduce((a, b) => a + b, 0) / ySp.length;
    if (avgX <= 0 || avgY <= 0) return null;

    if (!xSp.every(s => s > 0 && Math.abs(s - avgX) < avgX * 0.8)) return null;
    if (!ySp.every(s => s > 0 && Math.abs(s - avgY) < avgY * 0.8)) return null;

    const aspect = avgX / avgY;
    if (aspect < 0.33 || aspect > 3.0) return null;

    // Infer missing cells in 2-cell rows
    const fullGrid = [];
    for (const row of grid) {
        if (row.length >= 3) {
            fullGrid.push(row.slice(0, 3));
        } else if (row.length === 2) {
            const gap = row[1].x - row[0].x;
            if (Math.abs(gap - avgX) < avgX * 0.5) {
                if (row[0].x > completeRows[0][0].x + avgX * 0.3) {
                    fullGrid.push([{ x: row[0].x - avgX, y: row[0].y, quad: null }, row[0], row[1]]);
                } else {
                    fullGrid.push([row[0], row[1], { x: row[1].x + avgX, y: row[1].y, quad: null }]);
                }
            } else if (Math.abs(gap - avgX * 2) < avgX * 0.8) {
                fullGrid.push([row[0], { x: (row[0].x + row[1].x) / 2, y: (row[0].y + row[1].y) / 2, quad: null }, row[1]]);
            } else {
                fullGrid.push(row);
            }
        }
    }

    let detected = 0;
    const cells = [], allQ = [];
    for (const row of fullGrid) {
        for (const c of row) {
            cells.push({ cx: c.x, cy: c.y, quad: c.quad });
            if (c.quad) { allQ.push(c.quad); detected++; }
        }
    }
    if (detected < 7) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const q of allQ) for (const p of q.pts) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }

    const cons = 1 - (
        xSp.reduce((s, x) => s + Math.abs(x - avgX), 0) / xSp.length / avgX +
        ySp.reduce((s, y) => s + Math.abs(y - avgY), 0) / ySp.length / avgY
    ) / 2;

    return {
        cells,
        bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        totalArea: allQ.reduce((s, q) => s + q.area, 0),
        score: detected * 100 + cons * 50 + allQ.reduce((s, q) => s + q.area, 0) * 0.001,
        detectedCount: detected
    };
}

function pickBestThree(row) {
    if (row.length <= 3) return row;
    let best = null, bestDev = Infinity;
    for (let i = 0; i < row.length - 2; i++)
        for (let j = i + 1; j < row.length - 1; j++)
            for (let k = j + 1; k < row.length; k++) {
                const d1 = row[j].x - row[i].x, d2 = row[k].x - row[j].x;
                const avg = (d1 + d2) / 2;
                if (avg <= 0) continue;
                const dev = Math.abs(d1 - d2) / avg;
                if (dev < bestDev) { bestDev = dev; best = [row[i], row[j], row[k]]; }
            }
    return best || row.slice(0, 3);
}

function clusterBy(items, keyFn, k) {
    if (items.length < k) return null;
    const gaps = [];
    for (let i = 1; i < items.length; i++)
        gaps.push({ index: i, gap: keyFn(items[i]) - keyFn(items[i - 1]) });
    gaps.sort((a, b) => b.gap - a.gap);
    if (gaps.length < k - 1) return null;
    const splits = gaps.slice(0, k - 1).map(g => g.index).sort((a, b) => a - b);
    const clusters = [];
    let start = 0;
    for (const idx of splits) { clusters.push(items.slice(start, idx)); start = idx; }
    clusters.push(items.slice(start));
    return clusters.length === k ? clusters : null;
}


/* ════════════════════════════════════════════════════════════
 *  PERSPECTIVE DEWARP
 * ════════════════════════════════════════════════════════════ */

function dewarpGrid(src, grid) {
    const SIZE = 300;
    const b = grid.bounds;
    const margin = Math.max(b.width, b.height) * 0.08;
    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        b.x - margin, b.y - margin,
        b.x + b.width + margin, b.y - margin,
        b.x - margin, b.y + b.height + margin,
        b.x + b.width + margin, b.y + b.height + margin,
    ]);
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, SIZE, 0, 0, SIZE, SIZE, SIZE]);
    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(SIZE, SIZE));
    const rgba = new Uint8ClampedArray(dst.data);
    srcPts.delete(); dstPts.delete(); M.delete(); dst.delete();
    return { data: rgba, width: SIZE, height: SIZE };
}


/* ════════════════════════════════════════════════════════════
 *  MESSAGE HANDLER
 * ════════════════════════════════════════════════════════════ */

self.onmessage = function(e) {
    const { type, id, buffer, width, height } = e.data;
    if (type === 'detect') {
        try {
            const imgData = new ImageData(new Uint8ClampedArray(buffer), width, height);
            const result = detectFaceGrid(imgData, width, height);
            self.postMessage({ type: 'result', id, result });
        } catch (err) {
            self.postMessage({ type: 'result', id, result: null, error: err.message });
        }
    } else if (type === 'calibrate') {
        // Calibration data received — stored for potential future use.
        // Currently color classification runs on the main thread, not in this worker.
        self._calibrationRefs = e.data.refs || null;
    }
};
