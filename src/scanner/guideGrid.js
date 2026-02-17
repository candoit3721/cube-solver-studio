/**
 * Guide grid geometry for fixed-overlay cube face scanning.
 *
 * Computes a centered 3x3 grid of sample positions given video dimensions.
 * The user aligns the cube face to this static grid, eliminating detection.
 */

/**
 * Compute the visible region of a video displayed with object-fit: cover.
 * Returns the viewport rectangle in video-coordinate space.
 *
 * With cover, the video is scaled uniformly until it fills the container,
 * then excess is cropped. This function returns which part of the raw video
 * is actually visible on screen.
 *
 * @param {number} videoWidth  - Intrinsic video width (e.g. 1920)
 * @param {number} videoHeight - Intrinsic video height (e.g. 1080)
 * @param {number} containerWidth  - CSS layout width of the video element
 * @param {number} containerHeight - CSS layout height of the video element
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getCoverViewport(videoWidth, videoHeight, containerWidth, containerHeight) {
    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;

    if (videoAspect > containerAspect) {
        // Video is wider than container — left/right sides cropped
        const visibleWidth = videoHeight * containerAspect;
        return {
            x: (videoWidth - visibleWidth) / 2,
            y: 0,
            width: visibleWidth,
            height: videoHeight,
        };
    } else {
        // Video is taller than container — top/bottom cropped
        const visibleHeight = videoWidth / containerAspect;
        return {
            x: 0,
            y: (videoHeight - visibleHeight) / 2,
            width: videoWidth,
            height: visibleHeight,
        };
    }
}

/**
 * Compute guide grid geometry for a given video size.
 *
 * @param {number} videoWidth
 * @param {number} videoHeight
 * @param {number} [sizeFraction=0.5] - Grid side as fraction of min(w, h), range 0.2-0.8
 * @param {{ x: number, y: number, width: number, height: number }} [viewport] -
 *   Visible region from getCoverViewport(). When provided, the grid is centered
 *   within this region and sized relative to it (so it always fits on screen).
 * @returns {{ gridX: number, gridY: number, gridSize: number, cellSize: number, cells: {cx: number, cy: number, size: number}[] }}
 */
export function getGuideGeometry(videoWidth, videoHeight, sizeFraction = 0.5, viewport = null) {
    // Use viewport bounds if provided, otherwise full video
    const vx = viewport ? viewport.x : 0;
    const vy = viewport ? viewport.y : 0;
    const vw = viewport ? viewport.width : videoWidth;
    const vh = viewport ? viewport.height : videoHeight;

    const minDim = Math.min(vw, vh);
    const gridSize = Math.round(minDim * Math.max(0.2, Math.min(0.8, sizeFraction)));
    const cellSize = gridSize / 3;

    // Center the grid within the viewport region
    const gridX = Math.round(vx + (vw - gridSize) / 2);
    const gridY = Math.round(vy + (vh - gridSize) / 2);

    // 9 cells in row-major order (top-left to bottom-right)
    const cells = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            cells.push({
                cx: gridX + col * cellSize + cellSize / 2,
                cy: gridY + row * cellSize + cellSize / 2,
                size: cellSize,
            });
        }
    }

    return { gridX, gridY, gridSize, cellSize, cells };
}
