/**
 * CameraModal — guide-overlay camera scanner for cube faces.
 *
 * Features:
 * - Fixed 3x3 guide grid overlay — user aligns cube face to it
 * - HSV-based color sampling at 9 known positions
 * - Progressive flat net display fills in as faces are scanned
 * - Singmaster notation shown during all phases
 * - Editable grid to tweak misplaced stickers before applying
 * - Auto-corrects based on cube constraints (each color appears exactly 9 times)
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FACES, FACE_HEX } from '../engine/constants.js';
import { useCubeState } from '../hooks/useCubeState.jsx';
import { validateCube } from '../api/cubeApi.js';
import { classifyColor, sampleRegionFromData } from '../scanner/colorClassifier.js';
import { getGuideGeometry, getCoverViewport } from '../scanner/guideGrid.js';
import { createAccumulator } from '../scanner/scanAccumulator.js';
import '../styles/CameraModal.css';
import '../styles/EditorModal.css';


/* ── Singmaster notation helpers ─────────────────────────────── */

const FACE_LETTER = { U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O' };

function faceGridToSingmaster(faceId, grid) {
    return `${faceId}: ${grid.map(c => FACE_LETTER[c] || '?').join('')}`;
}

function fullSingmaster(scanned) {
    return ['U', 'D', 'F', 'B', 'R', 'L']
        .filter(f => scanned[f])
        .map(f => faceGridToSingmaster(f, scanned[f]));
}


/**
 * Snap-correct a camera scan for the last face to match cube constraints.
 * Keeps camera-determined positions where colors match what's needed;
 * replaces over-counted colors with under-counted ones for mismatches.
 */
function snapToRemainingColors(scannedFaces, faceId, cameraColors) {
    // Count colors already used across the 5 scanned faces
    const counts = {};
    FACES.forEach(f => { counts[f] = 0; });
    for (const f of Object.keys(scannedFaces)) {
        for (const c of scannedFaces[f]) {
            counts[c] = (counts[c] || 0) + 1;
        }
    }

    // Remaining needed per color
    const remaining = {};
    FACES.forEach(f => { remaining[f] = 9 - (counts[f] || 0); });

    const result = [...cameraColors];
    result[4] = faceId; // center is always the face's own color
    remaining[faceId] = Math.max(0, remaining[faceId] - 1);

    // First pass: keep camera colors that match a remaining need
    const locked = Array(9).fill(false);
    locked[4] = true;
    for (let i = 0; i < 9; i++) {
        if (i === 4) continue;
        const c = result[i];
        if (c && remaining[c] > 0) {
            remaining[c]--;
            locked[i] = true;
        }
    }

    // Second pass: fill unmatched cells with leftover remaining colors
    const pool = [];
    FACES.forEach(f => {
        for (let i = 0; i < remaining[f]; i++) pool.push(f);
    });

    let pi = 0;
    for (let i = 0; i < 9; i++) {
        if (locked[i]) continue;
        result[i] = pi < pool.length ? pool[pi++] : faceId;
    }

    return result;
}


/* ── Component ───────────────────────────────────────────────── */

const NET_LAYOUT = [
    [null, 'U', null, null],
    ['L', 'F', 'R', 'B'],
    [null, 'D', null, null],
];

export default function CameraModal({ open, onClose }) {
    const { applyColorState } = useCubeState();
    const videoRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const overlayRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const accumulatorRef = useRef(createAccumulator());

    const [scanned, setScanned] = useState({});
    const [livePreview, setLivePreview] = useState(null);
    const [liveColors, setLiveColors] = useState(null); // 9-element array of {r,g,b} for live dots
    const [status, setStatus] = useState('Align cube face to the guide grid');
    const [phase, setPhase] = useState('scanning');
    const [editState, setEditState] = useState({});
    const [editBrush, setEditBrush] = useState('U');
    const [justConfirmed, setJustConfirmed] = useState(null);
    const [targetFace, setTargetFace] = useState('U');
    const [guideSize, setGuideSize] = useState(0.65);
    const [confirmFlash, setConfirmFlash] = useState(false);
    const [centerMismatch, setCenterMismatch] = useState(null); // detected center color when it disagrees
    const centerMismatchCount = useRef(0);
    const targetFaceRef = useRef('U');
    const guideSizeRef = useRef(0.65);

    // Keep refs in sync with state so scanLoop can read latest without re-creation
    targetFaceRef.current = targetFace;
    guideSizeRef.current = guideSize;

    const SCAN_ORDER = ['U', 'F', 'R', 'B', 'L', 'D'];
    const count = Object.keys(scanned).length;

    /* ── Reset ── */
    const resetScan = useCallback(() => {
        setScanned({});
        setLivePreview(null);
        setLiveColors(null);
        accumulatorRef.current = createAccumulator();
        setStatus('Align cube face to the guide grid');
        setPhase('scanning');
        setEditState({});
        setJustConfirmed(null);
        setConfirmFlash(false);
        setTargetFace('U');
        setCenterMismatch(null);
        centerMismatchCount.current = 0;
    }, []);

    /* ── Draw guide overlay on canvas ── */
    const drawOverlay = useCallback((geometry, cellResults, isConfirmed, viewport) => {
        const overlay = overlayRef.current;
        if (!overlay) return;
        const video = videoRef.current;
        if (!video) return;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;

        overlay.width = overlay.clientWidth;
        overlay.height = overlay.clientHeight;
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (!geometry) return;

        // Map video coords to overlay coords, accounting for object-fit: cover.
        // The viewport tells us which portion of the raw video is visible on screen.
        const vp = viewport || { x: 0, y: 0, width: vw, height: vh };
        const sx = overlay.width / vp.width;
        const sy = overlay.height / vp.height;
        const mapX = (x) => (x - vp.x) * sx;
        const mapY = (y) => (y - vp.y) * sy;

        const { gridX, gridY, gridSize, cells } = geometry;
        const rx = mapX(gridX);
        const ry = mapY(gridY);
        const rw = gridSize * sx;
        const rh = gridSize * sy;

        // Grid color: green when confirmed, orange/white otherwise
        const lineColor = isConfirmed
            ? 'rgba(0, 200, 83, 0.9)'
            : 'rgba(255, 255, 255, 0.7)';

        // Outer border
        ctx.lineWidth = 2;
        ctx.strokeStyle = lineColor;
        ctx.setLineDash([]);
        ctx.strokeRect(rx, ry, rw, rh);

        // Inner 3x3 grid lines
        ctx.lineWidth = 1;
        ctx.strokeStyle = isConfirmed
            ? 'rgba(0, 200, 83, 0.6)'
            : 'rgba(255, 255, 255, 0.4)';

        const cellW = rw / 3;
        const cellH = rh / 3;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(rx + cellW * i, ry);
            ctx.lineTo(rx + cellW * i, ry + rh);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rx, ry + cellH * i);
            ctx.lineTo(rx + rw, ry + cellH * i);
            ctx.stroke();
        }

        // Draw live color dots in each cell
        if (cellResults) {
            const dotRadius = Math.min(cellW, cellH) * 0.22;
            for (let i = 0; i < 9; i++) {
                const cell = cells[i];
                const cr = cellResults[i];
                if (!cr) continue;

                const dotX = mapX(cell.cx);
                const dotY = mapY(cell.cy);

                ctx.beginPath();
                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgb(${Math.round(cr.r)}, ${Math.round(cr.g)}, ${Math.round(cr.b)})`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }, []);

    /* ── Main scan loop ── */
    const scanLoop = useCallback(() => {
        if (!videoRef.current || !streamRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Compute visible viewport for object-fit: cover so the guide grid
        // is centered within what the user actually sees on screen
        const overlay = overlayRef.current;
        const viewport = (overlay && overlay.clientWidth > 0)
            ? getCoverViewport(canvas.width, canvas.height, overlay.clientWidth, overlay.clientHeight)
            : null;

        const geometry = getGuideGeometry(canvas.width, canvas.height, guideSizeRef.current, viewport);
        const sampleRadius = geometry.cellSize / 5;

        const faces = [];
        const confidences = [];
        const cellRgbs = [];

        // Sample each of the 9 cells
        for (const cell of geometry.cells) {
            const avg = sampleRegionFromData(imageData, canvas.width, cell.cx, cell.cy, sampleRadius);
            cellRgbs.push(avg);
            const { face, confidence } = classifyColor(avg.r, avg.g, avg.b);
            faces.push(face);
            confidences.push(confidence);
        }

        const curTarget = targetFaceRef.current;

        // Display faces: replace nulls with target for visual preview only
        const displayFaces = faces.map((f) => f || curTarget);

        const avgConf = confidences.reduce((a, b) => a + b, 0) / 9;

        setLivePreview({
            face: curTarget,
            grid: displayFaces,
            confidence: Math.round(avgConf * 100)
        });
        setLiveColors(cellRgbs);

        // Detect center-cell mismatch using raw detection (before override).
        // Warn the user if the center sticker doesn't look like the target face.
        const detectedCenter = faces[4]; // raw classification
        if (detectedCenter && detectedCenter !== curTarget && confidences[4] > 0.5) {
            centerMismatchCount.current++;
            if (centerMismatchCount.current >= 4) {
                setCenterMismatch(detectedCenter);
            }
        } else {
            centerMismatchCount.current = 0;
            setCenterMismatch(null);
        }

        // Feed to accumulator with center cell forced to target face.
        // Center stickers often have logos/markings that confuse classification.
        // The user explicitly selects which face to scan, so we trust that choice.
        const accFaces = [...faces];
        const accConfs = [...confidences];
        accFaces[4] = curTarget;
        accConfs[4] = 1.0;

        const acc = accumulatorRef.current;
        acc.addFrame(curTarget, accFaces, accConfs);

        // Check confirmation for the target face
        setScanned(prev => {
            if (prev[curTarget]) {
                drawOverlay(geometry, cellRgbs, true, viewport);
                return prev;
            }

            const check = acc.checkConfirmation(curTarget);
            drawOverlay(geometry, cellRgbs, check.confirmed, viewport);

            if (!check.confirmed) return prev;

            const scannedCount = Object.keys(prev).length;
            let confirmedColors = check.colors;

            if (scannedCount >= 5) {
                // Last face: snap-correct camera colors to match remaining
                // color constraints instead of rejecting misclassifications.
                confirmedColors = snapToRemainingColors(prev, curTarget, check.colors);
            } else {
                // Faces 1-5: reject if any color would exceed 9 total
                const colorCounts = {};
                for (const f of Object.keys(prev)) {
                    for (const c of prev[f]) {
                        colorCounts[c] = (colorCounts[c] || 0) + 1;
                    }
                }
                for (const c of confirmedColors) {
                    colorCounts[c] = (colorCounts[c] || 0) + 1;
                }
                const overLimit = Object.entries(colorCounts).find(([, n]) => n > 9);
                if (overLimit) {
                    acc.reset(curTarget);
                    setStatus(`Rejected ${curTarget}: too many ${overLimit[0]} stickers. Hold steady.`);
                    return prev;
                }
            }

            // Confirmed!
            const next = { ...prev, [curTarget]: confirmedColors };
            const c = Object.keys(next).length;

            setJustConfirmed(curTarget);
            setConfirmFlash(true);
            setTimeout(() => {
                setJustConfirmed(j => j === curTarget ? null : j);
                setConfirmFlash(false);
            }, 700);

            if (c >= 6) {
                setStatus('All 6 faces scanned! Review below.');
                setPhase('review');
            } else {
                setStatus(`Scanned ${curTarget} face (${c}/6). Show the next face.`);
                // Auto-advance to next unscanned face
                const nextTarget = SCAN_ORDER.find(f => !next[f]) || null;
                if (nextTarget) {
                    targetFaceRef.current = nextTarget;
                    setTargetFace(nextTarget);
                }
            }
            return next;
        });
    }, [drawOverlay]);

    /* ── Camera lifecycle ── */
    useEffect(() => {
        if (!open) return;
        let active = true;

        async function startCamera() {
            try {
                let stream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                }
                if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                intervalRef.current = setInterval(scanLoop, 250);
            } catch (e) {
                setStatus('Camera not available: ' + e.message);
            }
        }

        startCamera();
        return () => {
            active = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    }, [open, scanLoop]);

    /* ── Transition to edit mode ── */
    const startEdit = useCallback(() => {
        const copy = {};
        FACES.forEach(f => { copy[f] = scanned[f] ? [...scanned[f]] : Array(9).fill(f); });
        setEditState(copy);
        setPhase('editing');
        setStatus('Tap cells to fix misplaced colors, then Apply.');
    }, [scanned]);

    /* ── Edit mode handlers ── */
    const handleCellClick = useCallback((face, idx) => {
        if (idx === 4) return;
        setApplyError(null);
        setEditState(prev => {
            const next = { ...prev };
            next[face] = [...prev[face]];
            next[face][idx] = editBrush;
            return next;
        });
    }, [editBrush]);

    /* ── Validation ── */
    const editCounts = useMemo(() => {
        if (phase !== 'editing') return null;
        const counts = {};
        FACES.forEach(f => { counts[f] = 0; });
        FACES.forEach(f => {
            (editState[f] || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; });
        });
        return counts;
    }, [editState, phase]);

    const isValid = useMemo(() => {
        if (!editCounts) return false;
        return FACES.every(f => editCounts[f] === 9);
    }, [editCounts]);

    const validationMsg = useMemo(() => {
        if (!editCounts) return null;
        const issues = [];
        FACES.forEach(f => {
            const c = editCounts[f] || 0;
            if (c > 9) issues.push(`${f}(${FACE_LETTER[f]}): +${c - 9}`);
            if (c < 9) issues.push(`${f}(${FACE_LETTER[f]}): -${9 - c}`);
        });
        return issues.length > 0 ? issues.join(', ') : null;
    }, [editCounts]);

    /* ── Auto-correct ── */
    const autoCorrect = useCallback(() => {
        const state = {};
        FACES.forEach(f => { state[f] = [...(editState[f] || Array(9).fill(f))]; });

        const counts = {};
        FACES.forEach(f => { counts[f] = 0; });
        FACES.forEach(f => state[f].forEach(c => { counts[c]++; }));

        const over = FACES.filter(f => counts[f] > 9);
        const under = FACES.filter(f => counts[f] < 9);

        if (over.length === 0 && under.length === 0) return;

        for (const overColor of over) {
            while (counts[overColor] > 9) {
                let worstCell = null, worstFace = null;
                for (const f of FACES) {
                    for (let i = 0; i < 9; i++) {
                        if (i === 4) continue;
                        if (state[f][i] === overColor) {
                            if (f !== overColor && !worstCell) {
                                worstCell = i;
                                worstFace = f;
                            }
                        }
                    }
                }
                if (worstFace == null) break;

                const neediest = under.reduce((a, b) =>
                    (9 - counts[a]) > (9 - counts[b]) ? a : b, under[0]);
                if (!neediest || counts[neediest] >= 9) break;

                state[worstFace][worstCell] = neediest;
                counts[overColor]--;
                counts[neediest]++;

                if (counts[neediest] >= 9) {
                    const idx = under.indexOf(neediest);
                    if (idx !== -1) under.splice(idx, 1);
                }
            }
        }

        setEditState(state);
    }, [editState]);

    /* ── Apply to cube ── */
    const [applyError, setApplyError] = useState(null);

    const handleApply = useCallback(async () => {
        const faceMap = {};
        const src = phase === 'editing' ? editState : scanned;
        FACES.forEach(f => { faceMap[f] = src[f] || Array(9).fill(f); });

        // Validate before applying — catch parity errors while user can still fix
        setApplyError(null);
        try {
            const data = await validateCube(faceMap, { format: 'faceMap' });
            if (!data.valid) {
                throw new Error('Invalid cube pattern');
            }
        } catch (err) {
            setApplyError(err.message);
            if (phase !== 'editing') {
                const copy = {};
                FACES.forEach(f => { copy[f] = faceMap[f] ? [...faceMap[f]] : Array(9).fill(f); });
                setEditState(copy);
                setPhase('editing');
                setStatus('Validation failed — fix highlighted stickers, then Apply again.');
            }
            return;
        }

        onClose();
        applyColorState(faceMap);
    }, [phase, editState, scanned, onClose, applyColorState]);

    /* ── Remove a single face scan ── */
    const removeFace = useCallback((face) => {
        setScanned(prev => {
            const next = { ...prev };
            delete next[face];
            return next;
        });
        accumulatorRef.current.reset(face);
        setTargetFace(face);
        setPhase('scanning');
        setStatus(`Removed ${face}. Show it to the camera again.`);
    }, []);

    /* ── Flat net click handler ── */
    const handleNetFaceClick = useCallback((face, isScanned) => {
        if (isScanned) {
            removeFace(face);
        } else {
            setTargetFace(face);
        }
    }, [removeFace]);

    if (!open) return null;

    const singmaster = fullSingmaster(phase === 'editing' ? editState : scanned);

    /* ── Flat net renderer (shared between scanning and review) ── */
    const renderFlatNet = (className, clickable) => (
        <div className={className}>
            {NET_LAYOUT.map((row, ri) => (
                <div className="net-row" key={ri}>
                    {row.map((face, ci) => {
                        if (!face) return <div className="net-spacer-sm" key={ci} />;
                        const isScanned = !!scanned[face];
                        const isTarget = face === targetFace && !isScanned;
                        const grid = isScanned
                            ? scanned[face]
                            : Array(9).fill(face);
                        return (
                            <div
                                className={`face-wrap-sm ${isScanned && clickable ? 'scanned' : ''} ${!isScanned && clickable ? 'clickable' : ''}`}
                                key={ci}
                                onClick={() => clickable && handleNetFaceClick(face, isScanned)}
                                title={isScanned && clickable ? `Click to rescan ${face}` : (!isScanned && clickable ? `Scan ${face} next` : '')}
                            >
                                <div className="face-label-sm">{face}</div>
                                <div className={`face-grid-sm ${!isScanned ? 'unscanned' : ''} ${justConfirmed === face ? 'just-confirmed' : ''} ${isTarget ? 'target-highlight' : ''}`}>
                                    {grid.map((color, idx) => (
                                        <div
                                            key={idx}
                                            className={`cell-sm ${!isScanned && idx === 4 ? 'center-prefill' : ''}`}
                                            style={{
                                                background: isScanned ? FACE_HEX[color] : undefined,
                                                '--center-color': !isScanned && idx === 4 ? FACE_HEX[face] : undefined,
                                            }}
                                        />
                                    ))}
                                </div>
                                {isScanned && clickable && (
                                    <span className="face-remove-x">&times;</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content cam-modal" onClick={e => e.stopPropagation()}>
                <h2>Camera Scanner</h2>

                {/* ── Face selector (scanning phase only) ── */}
                {phase === 'scanning' && (
                    <div className="cam-face-selector">
                        <div className="cam-face-selector-label">
                            Scan: <span className="cam-target-name" style={{ color: FACE_HEX[targetFace] }}>{targetFace} face</span>
                        </div>
                        <div className="cam-face-btns">
                            {SCAN_ORDER.map(f => (
                                <button
                                    key={f}
                                    className={`cam-face-btn ${f === targetFace ? 'target' : ''} ${scanned[f] ? 'done' : ''}`}
                                    style={{ background: FACE_HEX[f] }}
                                    onClick={() => {
                                        centerMismatchCount.current = 0;
                                        setCenterMismatch(null);
                                        if (scanned[f]) {
                                            removeFace(f);
                                        } else {
                                            setTargetFace(f);
                                        }
                                    }}
                                    title={scanned[f] ? `${f} scanned — click to rescan` : `Scan ${f} next`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Video feed — always mounted to keep stream alive, hidden when not scanning ── */}
                <div className="cam-video-wrap" style={{ display: phase === 'scanning' ? '' : 'none' }}>
                    <video ref={videoRef} autoPlay playsInline muted className="cam-video" />
                    <canvas ref={overlayRef} className="cam-overlay-canvas" />
                    {livePreview && phase === 'scanning' && (
                        <div className={`cam-live-badge ${!scanned[targetFace] ? 'accumulating' : ''}`}>
                            Scanning for {targetFace} &middot; {livePreview.confidence}%
                        </div>
                    )}
                    {centerMismatch && !scanned[targetFace] && phase === 'scanning' && (
                        <div className="cam-mismatch-warning">
                            Center looks like {centerMismatch} — wrong face?
                        </div>
                    )}
                </div>

                {/* ── Guide size slider (scanning phase only) ── */}
                {phase === 'scanning' && (
                    <div className="cam-scale-slider">
                        <label>Guide size:</label>
                        <input
                            type="range"
                            min={20}
                            max={80}
                            value={Math.round(guideSize * 100)}
                            onChange={e => setGuideSize(Number(e.target.value) / 100)}
                        />
                        <span className="cam-scale-value">{Math.round(guideSize * 100)}%</span>
                    </div>
                )}

                {/* ── Status ── */}
                <p className="cam-status">{status}</p>
                <p className="cam-count">{count} / 6 faces scanned</p>

                {/* ── Progressive flat net (scanning phase) ── */}
                {phase === 'scanning' && renderFlatNet('cam-scan-net', true)}

                {/* ── Review: flat net of scanned results ── */}
                {phase === 'review' && renderFlatNet('cam-review-net', true)}

                {/* ── Singmaster notation (scanning + review) ── */}
                {count > 0 && phase !== 'editing' && (
                    <div className="cam-singmaster">
                        <div className="cam-singmaster-label">Singmaster</div>
                        <div className="cam-singmaster-grid">
                            {singmaster.map((entry, i) => (
                                <code key={i} className="cam-singmaster-entry">{entry}</code>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Edit mode: full cube net + palette ── */}
                {phase === 'editing' && (
                    <>
                        <div className="cam-singmaster">
                            <div className="cam-singmaster-label">Singmaster</div>
                            <div className="cam-singmaster-grid">
                                {singmaster.map((entry, i) => (
                                    <code key={i} className="cam-singmaster-entry">{entry}</code>
                                ))}
                            </div>
                        </div>

                        <div className="cam-edit-net">
                            {NET_LAYOUT.map((row, ri) => (
                                <div className="net-row" key={ri}>
                                    {row.map((face, ci) => {
                                        if (!face) return <div className="net-spacer" key={ci} />;
                                        const grid = editState[face] || Array(9).fill(face);
                                        return (
                                            <div className="face-wrap" key={ci}>
                                                <div className="face-label">{face}</div>
                                                <div className="face-grid">
                                                    {grid.map((color, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`cell ${idx === 4 ? 'center-cell' : ''}`}
                                                            style={{ background: FACE_HEX[color] }}
                                                            onClick={() => handleCellClick(face, idx)}
                                                        >
                                                            {idx === 4 && <span className="lock-icon">🔒</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Color palette */}
                        <div className="palette">
                            {FACES.map(f => {
                                const c = editCounts?.[f] || 0;
                                const isOver = c > 9;
                                return (
                                    <div
                                        key={f}
                                        className={`pb ${f === editBrush ? 'active' : ''} ${isOver ? 'over' : ''}`}
                                        style={{
                                            background: FACE_HEX[f],
                                            borderColor: f === editBrush ? '#fff' : (isOver ? 'var(--red)' : 'transparent')
                                        }}
                                        title={`${f} (${FACE_LETTER[f]}): ${c}/9`}
                                        onClick={() => setEditBrush(f)}
                                    >
                                        <span className="pb-count">{c}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {validationMsg && <div className="editor-err">{validationMsg}</div>}
                        {applyError && <div className="editor-err">{applyError}</div>}
                    </>
                )}

                {/* ── Actions ── */}
                <div className="modal-actions">
                    {phase === 'scanning' && (
                        <>
                            <button className="btn" onClick={resetScan}>Reset</button>
                            <button className="btn" onClick={onClose}>Cancel</button>
                            {count >= 6 && (
                                <button className="btn btn-primary" onClick={() => setPhase('review')}>
                                    Review
                                </button>
                            )}
                        </>
                    )}
                    {phase === 'review' && (
                        <>
                            <button className="btn" onClick={resetScan}>Rescan All</button>
                            <button className="btn" onClick={() => setPhase('scanning')}>Back</button>
                            <button className="btn" onClick={startEdit}>Edit</button>
                            <button className="btn btn-primary" onClick={handleApply}>Apply</button>
                        </>
                    )}
                    {phase === 'editing' && (
                        <>
                            <button className="btn" onClick={autoCorrect}>Auto-fix</button>
                            <button className="btn" onClick={() => setPhase('review')}>Back</button>
                            <button className="btn btn-primary" disabled={!isValid} onClick={handleApply}>Apply</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
