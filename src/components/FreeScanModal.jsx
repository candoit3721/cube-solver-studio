/**
 * FreeScanModal — free-rotation cube scanner using OpenCV contour detection.
 *
 * The user holds the cube and rotates it freely. The system auto-detects
 * faces as they appear, identifies them by center sticker, and progressively
 * captures all 6 faces. On completion, transitions to review/edit flow.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FACES, FACE_HEX, FACE_LETTER, FACE_NAME, NET_LAYOUT } from '../engine/constants.js';
import { useCubeState } from '../hooks/useCubeState.jsx';
import { validateCube } from '../api/cubeApi.js';
import { classifyDewarpedFace } from '../scanner/faceDetector.js';
import { createFaceTracker } from '../scanner/faceTracker.js';
import { initCVWorker, detectFace, terminateCVWorker } from '../scanner/cvBridge.js';
import '../styles/FreeScanModal.css';
import '../styles/EditorModal.css';


/* ── Singmaster notation helpers (same as CameraModal) ── */

function faceGridToSingmaster(faceId, grid) {
    return `${faceId}: ${grid.map(c => FACE_LETTER[c] || '?').join('')}`;
}

function fullSingmaster(faces) {
    return ['U', 'D', 'F', 'B', 'R', 'L']
        .filter(f => faces[f])
        .map(f => faceGridToSingmaster(f, faces[f]));
}


export default function FreeScanModal({ open, onClose }) {
    const { applyColorState } = useCubeState();
    const videoRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const overlayRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const trackerRef = useRef(createFaceTracker());
    const processingRef = useRef(false);

    const [cvReady, setCvReady] = useState(false);
    const [cvError, setCvError] = useState(null);
    const [progress, setProgress] = useState({ captured: 0, total: 6, faces: {}, remainingList: FACES, capturedList: [] });
    const [orientedFaces, setOrientedFaces] = useState(null);  // set when all 6 captured
    const [phase, setPhase] = useState('scanning');   // scanning | review | editing
    const [status, setStatus] = useState('Loading OpenCV...');
    const [detecting, setDetecting] = useState(null);  // face being detected, or null
    const [justCaptured, setJustCaptured] = useState(null);
    const [fps, setFps] = useState(0);
    const [lowFpsCount, setLowFpsCount] = useState(0);
    const [noDetectCount, setNoDetectCount] = useState(0);

    // Edit mode state (reuses same pattern as CameraModal)
    const [editState, setEditState] = useState({});
    const [editBrush, setEditBrush] = useState('U');
    const [applyError, setApplyError] = useState(null);

    // FPS tracking
    const fpsFrames = useRef([]);
    const lastFrameTime = useRef(0);

    // Motion blur detection
    const prevBoundsRef = useRef(null);

    /* ── Reset ── */
    const resetScan = useCallback(() => {
        trackerRef.current = createFaceTracker();
        setProgress({ captured: 0, total: 6, faces: {}, remainingList: [...FACES], capturedList: [] });
        setPhase('scanning');
        setStatus('Rotate cube slowly to scan each face');
        setDetecting(null);
        setJustCaptured(null);
        setEditState({});
        setApplyError(null);
        setOrientedFaces(null);
        setNoDetectCount(0);
        setLowFpsCount(0);
        prevBoundsRef.current = null;
        fpsFrames.current = [];
        lastFrameTime.current = 0;
    }, []);

    /* ── Draw detection overlay ── */
    const drawOverlay = useCallback((bounds, isDetecting) => {
        const overlay = overlayRef.current;
        const video = videoRef.current;
        if (!overlay || !video) return;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;

        overlay.width = overlay.clientWidth;
        overlay.height = overlay.clientHeight;
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (!bounds) return;

        // Map video coords to overlay coords (object-fit: cover)
        const videoAspect = vw / vh;
        const overlayAspect = overlay.width / overlay.height;
        let sx, sy, ox, oy;

        if (videoAspect > overlayAspect) {
            // Video is wider — cropped left/right
            const visibleWidth = vh * overlayAspect;
            sx = overlay.width / visibleWidth;
            sy = overlay.height / vh;
            ox = (vw - visibleWidth) / 2;
            oy = 0;
        } else {
            // Video is taller — cropped top/bottom
            const visibleHeight = vw / overlayAspect;
            sx = overlay.width / vw;
            sy = overlay.height / visibleHeight;
            ox = 0;
            oy = (vh - visibleHeight) / 2;
        }

        const rx = (bounds.x - ox) * sx;
        const ry = (bounds.y - oy) * sy;
        const rw = bounds.width * sx;
        const rh = bounds.height * sy;

        // Draw detection rectangle
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDetecting
            ? 'rgba(0, 200, 83, 0.8)'
            : 'rgba(255, 183, 77, 0.6)';
        ctx.setLineDash(isDetecting ? [] : [6, 4]);
        ctx.strokeRect(rx, ry, rw, rh);

        // Draw corner markers
        const cornerLen = Math.min(rw, rh) * 0.15;
        ctx.lineWidth = 3;
        ctx.strokeStyle = isDetecting
            ? 'rgba(0, 200, 83, 0.9)'
            : 'rgba(255, 183, 77, 0.8)';
        ctx.setLineDash([]);

        // Top-left
        ctx.beginPath();
        ctx.moveTo(rx, ry + cornerLen);
        ctx.lineTo(rx, ry);
        ctx.lineTo(rx + cornerLen, ry);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(rx + rw - cornerLen, ry);
        ctx.lineTo(rx + rw, ry);
        ctx.lineTo(rx + rw, ry + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(rx, ry + rh - cornerLen);
        ctx.lineTo(rx, ry + rh);
        ctx.lineTo(rx + cornerLen, ry + rh);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(rx + rw - cornerLen, ry + rh);
        ctx.lineTo(rx + rw, ry + rh);
        ctx.lineTo(rx + rw, ry + rh - cornerLen);
        ctx.stroke();
    }, []);

    /* ── Detection loop ── */
    const runDetection = useCallback(async () => {
        if (!videoRef.current || !streamRef.current || processingRef.current) return;
        if (phase !== 'scanning') return;

        const video = videoRef.current;
        if (video.videoWidth === 0) return;

        processingRef.current = true;

        try {
            // Downscale to ~480p for faster CV processing.
            // Full HD frames (1920×1080 = 8MB) are too slow for real-time CV.
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const MAX_DIM = 480;
            const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // FPS tracking
            const now = performance.now();
            if (lastFrameTime.current > 0) {
                fpsFrames.current.push(now - lastFrameTime.current);
                if (fpsFrames.current.length > 10) fpsFrames.current.shift();
                const avgMs = fpsFrames.current.reduce((a, b) => a + b, 0) / fpsFrames.current.length;
                const currentFps = Math.round(1000 / avgMs);
                setFps(currentFps);
                if (currentFps < 10) {
                    setLowFpsCount(c => c + 1);
                } else {
                    setLowFpsCount(0);
                }
            }
            lastFrameTime.current = now;

            // Send to CV worker for detection
            const result = await detectFace(imageData, canvas.width, canvas.height);

            if (!result) {
                setDetecting(null);
                setNoDetectCount(c => c + 1);
                drawOverlay(null, false);
                processingRef.current = false;
                return;
            }

            // Reset no-detect counter on successful detection
            setNoDetectCount(0);

            // Scale bounds back to full video coordinates for overlay drawing
            const invScale = 1 / scale;
            const videoBounds = {
                x: result.bounds.x * invScale,
                y: result.bounds.y * invScale,
                width: result.bounds.width * invScale,
                height: result.bounds.height * invScale,
            };

            // Motion blur rejection — if bounds moved too much since last frame, skip
            if (prevBoundsRef.current) {
                const prev = prevBoundsRef.current;
                const dx = Math.abs(videoBounds.x - prev.x);
                const dy = Math.abs(videoBounds.y - prev.y);
                const maxShift = videoBounds.width * 0.3;
                if (dx > maxShift || dy > maxShift) {
                    prevBoundsRef.current = videoBounds;
                    setDetecting(null);
                    drawOverlay(videoBounds, false);
                    processingRef.current = false;
                    return;
                }
            }
            prevBoundsRef.current = videoBounds;

            // Classify the dewarped face
            const { colors, confidences, centerFace } = classifyDewarpedFace(result.dewarpedData);

            if (!centerFace) {
                setDetecting(null);
                drawOverlay(videoBounds, false);
                processingRef.current = false;
                return;
            }

            setDetecting(centerFace);
            drawOverlay(videoBounds, true);

            // Feed to tracker
            const tracker = trackerRef.current;
            const event = tracker.processDetection(colors, confidences);

            if (event.event === 'confirmed') {
                const prog = tracker.getProgress();
                setProgress({
                    captured: prog.captured,
                    total: prog.total,
                    faces: prog.faces,
                    remainingList: prog.remainingList,
                    capturedList: prog.capturedList
                });

                setJustCaptured(event.face);
                setTimeout(() => setJustCaptured(j => j === event.face ? null : j), 800);

                if (prog.complete) {
                    // Apply orientation correction using adjacency constraints
                    const corrected = tracker.getResult();
                    setOrientedFaces(corrected);
                    setPhase('review');
                    setStatus('All 6 faces captured! Orientations corrected. Review below.');
                } else {
                    setStatus(`Captured ${event.face} face (${prog.captured}/6). Show the next face.`);
                }
            } else if (event.event === 'rejected') {
                setStatus(`Rejected ${event.face}: ${event.reason}. Hold steady.`);
            }

        } catch {
            // detectFace can fail if worker is busy or buffer was transferred
        }

        processingRef.current = false;
    }, [phase, drawOverlay]);

    /* ── Animation frame loop ── */
    useEffect(() => {
        if (!open || !cvReady || phase !== 'scanning') return;

        let active = true;
        const loop = () => {
            if (!active) return;
            runDetection();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            active = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [open, cvReady, phase, runDetection]);

    /* ── OpenCV + Camera lifecycle ── */
    useEffect(() => {
        if (!open) return;
        let active = true;

        async function init() {
            // Load OpenCV worker
            try {
                setStatus('Loading OpenCV...');
                await initCVWorker();
                if (!active) return;
                setCvReady(true);
            } catch (err) {
                if (!active) return;
                setCvError(err.message);
                setStatus('Failed to load OpenCV: ' + err.message);
                return;
            }

            // Start camera
            try {
                setStatus('Starting camera...');
                let stream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                }
                if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                setStatus('Rotate cube slowly to scan each face');
            } catch (e) {
                setStatus('Camera not available: ' + e.message);
            }
        }

        init();

        return () => {
            active = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            terminateCVWorker();
            setCvReady(false);
        };
    }, [open]);

    /* ── Transition to edit mode ── */
    const startEdit = useCallback(() => {
        const src = orientedFaces || trackerRef.current.getResult();
        if (!src) return;

        const copy = {};
        FACES.forEach(f => { copy[f] = src[f] ? [...src[f]] : Array(9).fill(f); });
        setEditState(copy);
        setPhase('editing');
        setStatus('Tap cells to fix misplaced colors, then Apply.');
    }, [orientedFaces]);

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
                        if (state[f][i] === overColor && f !== overColor && !worstCell) {
                            worstCell = i;
                            worstFace = f;
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
    const handleApply = useCallback(async () => {
        const faceMap = {};
        const src = phase === 'editing' ? editState : (orientedFaces || trackerRef.current.getResult() || {});
        FACES.forEach(f => { faceMap[f] = src[f] || Array(9).fill(f); });

        setApplyError(null);
        try {
            const data = await validateCube(faceMap, { format: 'faceMap' });
            if (!data.valid) throw new Error('Invalid cube pattern');
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
    }, [phase, editState, orientedFaces, onClose, applyColorState]);

    /* ── Remove a single face ── */
    const removeFace = useCallback((face) => {
        trackerRef.current.resetFace(face);
        setOrientedFaces(null); // orientation invalidated
        const prog = trackerRef.current.getProgress();
        setProgress({
            captured: prog.captured,
            total: prog.total,
            faces: prog.faces,
            remainingList: prog.remainingList,
            capturedList: prog.capturedList
        });
        setPhase('scanning');
        setStatus(`Removed ${face}. Show it to the camera again.`);
    }, []);

    if (!open) return null;

    // During scanning, show raw (unoriented) faces for progress.
    // In review/apply, show oriented faces.
    const displayFaces = (phase === 'review' && orientedFaces)
        ? orientedFaces
        : progress.faces;
    const singmaster = fullSingmaster(phase === 'editing' ? editState : displayFaces);

    /* ── Progress ring ── */
    const circumference = 2 * Math.PI * 20;
    const ringOffset = circumference - (progress.captured / progress.total) * circumference;

    /* ── Flat net renderer ── */
    const renderFlatNet = (className, clickable) => (
        <div className={className}>
            {NET_LAYOUT.map((row, ri) => (
                <div className="net-row" key={ri}>
                    {row.map((face, ci) => {
                        if (!face) return <div className="net-spacer-sm" key={ci} />;
                        const isScanned = !!displayFaces[face];
                        const grid = isScanned
                            ? displayFaces[face]
                            : Array(9).fill(face);
                        return (
                            <div
                                className={`face-wrap-sm ${isScanned && clickable ? 'scanned' : ''} ${!isScanned && clickable ? 'clickable' : ''}`}
                                key={ci}
                                onClick={() => clickable && isScanned && removeFace(face)}
                                title={isScanned && clickable ? `Click to rescan ${face}` : ''}
                            >
                                <div className="face-label-sm">{face}</div>
                                <div className={`face-grid-sm ${!isScanned ? 'unscanned' : ''} ${justCaptured === face ? 'just-confirmed' : ''}`}>
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
            <div className="modal-content freescan-modal" onClick={e => e.stopPropagation()}>
                <h2>Free Scan</h2>
                <p className="modal-subtitle">Hold the cube and rotate it — faces are detected automatically</p>

                {/* ── Loading state ── */}
                {!cvReady && !cvError && (
                    <div className="freescan-loading">
                        <div className="freescan-loading-spinner" />
                        <span className="freescan-loading-text">{status}</span>
                    </div>
                )}

                {/* ── Error state ── */}
                {cvError && (
                    <div className="freescan-loading">
                        <span className="freescan-loading-text">{cvError}</span>
                        <button className="btn" onClick={onClose}>Close</button>
                    </div>
                )}

                {/* ── Video feed (scanning phase) ── */}
                {cvReady && (
                    <div className="freescan-video-wrap" style={{ display: phase === 'scanning' ? '' : 'none' }}>
                        <video ref={videoRef} autoPlay playsInline muted className="freescan-video" />
                        <canvas ref={overlayRef} className="freescan-overlay-canvas" />

                        {detecting && phase === 'scanning' && (
                            <div className="freescan-detect-badge">
                                Detecting {detecting} face...
                            </div>
                        )}

                        {!detecting && phase === 'scanning' && cvReady && (
                            <div className="freescan-detect-badge searching">
                                Searching for cube face...
                            </div>
                        )}

                        {fps > 0 && (
                            <div className={`freescan-fps ${fps < 10 ? 'warning' : ''}`}>
                                {fps} FPS
                            </div>
                        )}
                    </div>
                )}

                {/* ── Progress section ── */}
                {cvReady && phase === 'scanning' && (
                    <>
                        <div className="freescan-progress">
                            {/* Progress ring */}
                            <div className="freescan-ring">
                                <svg viewBox="0 0 44 44">
                                    <circle className="freescan-ring-bg" cx="22" cy="22" r="20" />
                                    <circle
                                        className={`freescan-ring-fill ${progress.complete ? 'complete' : ''}`}
                                        cx="22" cy="22" r="20"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={ringOffset}
                                    />
                                </svg>
                                <div className="freescan-ring-text">
                                    {progress.captured}/{progress.total}
                                </div>
                            </div>

                            {/* Face checklist */}
                            <div className="freescan-checklist">
                                {FACES.map(f => {
                                    const captured = !!displayFaces[f];
                                    return (
                                        <div
                                            key={f}
                                            className={`freescan-face-chip ${captured ? 'captured' : ''} ${justCaptured === f ? 'just-captured' : ''}`}
                                        >
                                            <span className="freescan-face-dot" style={{ background: FACE_HEX[f] }} />
                                            <span>{f}</span>
                                            {captured && <span className="freescan-face-check">&#10003;</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Guidance */}
                        {progress.remainingList.length > 0 && (
                            <p className="freescan-guidance">
                                Show the <strong>{progress.remainingList.map(f => FACE_NAME[f]).join(', ')}</strong> face{progress.remainingList.length > 1 ? 's' : ''}
                            </p>
                        )}

                        {/* Low FPS hint */}
                        {lowFpsCount > 20 && (
                            <div className="freescan-hint">
                                <span className="freescan-hint-icon">&#9888;</span>
                                <span>Low performance detected. Try holding the cube more steadily, or switch to guided Scan mode.</span>
                            </div>
                        )}

                        {/* No detection fallback hint */}
                        {noDetectCount > 30 && lowFpsCount <= 20 && (
                            <div className="freescan-hint">
                                <span className="freescan-hint-icon">&#128269;</span>
                                <span>Having trouble detecting the cube. Hold it closer to the camera with the face facing straight toward you, or try the guided Scan mode.</span>
                            </div>
                        )}
                    </>
                )}

                {/* ── Status ── */}
                {cvReady && <p className="freescan-status">{status}</p>}

                {/* ── Flat net (scanning + review) ── */}
                {cvReady && phase === 'scanning' && renderFlatNet('freescan-minicube', true)}
                {cvReady && phase === 'review' && renderFlatNet('freescan-review-net', true)}

                {/* ── Singmaster ── */}
                {progress.captured > 0 && phase !== 'editing' && (
                    <div className="cam-singmaster">
                        <div className="cam-singmaster-label">Singmaster</div>
                        <div className="cam-singmaster-grid">
                            {singmaster.map((entry, i) => (
                                <code key={i} className="cam-singmaster-entry">{entry}</code>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Edit mode ── */}
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
                                                            {idx === 4 && <span className="lock-icon">&#128274;</span>}
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

                {/* ── Error ── */}
                {applyError && phase !== 'editing' && (
                    <div className="freescan-error">{applyError}</div>
                )}

                {/* ── Actions ── */}
                <div className="modal-actions">
                    {phase === 'scanning' && cvReady && (
                        <>
                            <button className="btn" onClick={resetScan}>Reset</button>
                            <button className="btn" onClick={onClose}>Cancel</button>
                        </>
                    )}
                    {phase === 'review' && (
                        <>
                            <button className="btn" onClick={resetScan}>Rescan All</button>
                            <button className="btn" onClick={() => { setPhase('scanning'); setStatus('Rotate cube slowly to scan each face'); }}>Back</button>
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
                    {!cvReady && !cvError && (
                        <button className="btn" onClick={onClose}>Cancel</button>
                    )}
                </div>
            </div>
        </div>
    );
}
