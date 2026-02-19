/**
 * CalibrationModal — per-session color calibration for cube scanning.
 *
 * Guides the user through capturing one sample of each of the 6 cube
 * colors under their current lighting. The sampled RGB values are then
 * used for nearest-neighbor classification instead of hardcoded HSV.
 *
 * Phases: intro → 6 capture steps → review → apply/redo
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { FACE_HEX } from '../engine/constants.js';
import { setAllCalibrations, getCalibrationData } from '../scanner/colorCalibration.js';
import { sendCalibration } from '../scanner/cvBridge.js';
import '../styles/CalibrationModal.css';

const STEPS = [
    { face: 'U', label: 'White', color: '#ffffff' },
    { face: 'D', label: 'Yellow', color: '#ffd500' },
    { face: 'F', label: 'Green', color: '#009e60' },
    { face: 'B', label: 'Blue', color: '#0051ba' },
    { face: 'R', label: 'Red', color: '#c41e3a' },
    { face: 'L', label: 'Orange', color: '#ff5800' },
];

const ROLLING_WINDOW = 5;

export default function CalibrationModal({ isOpen, onClose, onComplete }) {
    const [phase, setPhase] = useState('intro'); // intro | capture | review
    const [stepIdx, setStepIdx] = useState(0);
    const [captured, setCaptured] = useState({}); // { U: {r,g,b}, D: ... }
    const [liveColor, setLiveColor] = useState(null); // current sampled {r,g,b}

    const videoRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const rollingRef = useRef([]); // rolling average buffer

    const currentStep = STEPS[stepIdx];

    /* ── Reset state ── */
    const resetAll = useCallback(() => {
        setPhase('intro');
        setStepIdx(0);
        setCaptured({});
        setLiveColor(null);
        rollingRef.current = [];
    }, []);

    /* ── Camera lifecycle ── */
    useEffect(() => {
        if (!isOpen || phase === 'intro' || phase === 'review') return;
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
            } catch {
                // Camera unavailable — handled gracefully
            }
        }

        startCamera();

        return () => {
            active = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [isOpen, phase]);

    /* ── Live sampling loop ── */
    useEffect(() => {
        if (!isOpen || phase !== 'capture') return;

        let active = true;

        const sampleLoop = () => {
            if (!active) return;

            const video = videoRef.current;
            if (video && video.videoWidth > 0 && streamRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const cx = Math.round(canvas.width / 2);
                const cy = Math.round(canvas.height / 2);
                // Tighter circular sample with dark-pixel filtering
                const sampleRadius = Math.min(canvas.width, canvas.height) * 0.04;
                const half = Math.round(sampleRadius);
                const x0 = Math.max(0, cx - half);
                const y0 = Math.max(0, cy - half);
                const x1 = Math.min(canvas.width - 1, cx + half);
                const y1 = Math.min(canvas.height - 1, cy + half);
                const pxData = imageData.data;

                let rSum = 0, gSum = 0, bSum = 0, pxCount = 0;
                for (let py = y0; py <= y1; py++) {
                    for (let px = x0; px <= x1; px++) {
                        const ddx = px - cx, ddy = py - cy;
                        if (ddx * ddx + ddy * ddy > half * half) continue;
                        const idx = (py * canvas.width + px) * 4;
                        const pr = pxData[idx], pg = pxData[idx + 1], pb = pxData[idx + 2];
                        if (pr + pg + pb < 80) continue; // skip dark edge pixels
                        rSum += pr; gSum += pg; bSum += pb; pxCount++;
                    }
                }
                const rgb = pxCount > 0
                    ? { r: Math.round(rSum / pxCount), g: Math.round(gSum / pxCount), b: Math.round(bSum / pxCount) }
                    : { r: 0, g: 0, b: 0 };

                // Rolling average for stability
                const buf = rollingRef.current;
                buf.push(rgb);
                if (buf.length > ROLLING_WINDOW) buf.shift();

                const avg = { r: 0, g: 0, b: 0 };
                for (const s of buf) { avg.r += s.r; avg.g += s.g; avg.b += s.b; }
                avg.r = Math.round(avg.r / buf.length);
                avg.g = Math.round(avg.g / buf.length);
                avg.b = Math.round(avg.b / buf.length);

                setLiveColor(avg);
            }

            rafRef.current = requestAnimationFrame(sampleLoop);
        };

        rafRef.current = requestAnimationFrame(sampleLoop);

        return () => {
            active = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isOpen, phase, stepIdx]);

    /* ── Clean up on close ── */
    useEffect(() => {
        if (!isOpen) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        }
    }, [isOpen]);

    /* ── Handlers ── */
    const handleStartCalibration = useCallback(() => {
        setPhase('capture');
        setStepIdx(0);
        setCaptured({});
        rollingRef.current = [];
    }, []);

    const handleSkip = useCallback(() => {
        onComplete(false);
    }, [onComplete]);

    const handleCapture = useCallback(() => {
        if (!liveColor) return;
        const face = STEPS[stepIdx].face;
        const next = { ...captured, [face]: { ...liveColor } };
        setCaptured(next);
        rollingRef.current = [];

        if (stepIdx < STEPS.length - 1) {
            setStepIdx(stepIdx + 1);
        } else {
            // All 6 captured — go to review
            // Stop camera
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            setPhase('review');
        }
    }, [liveColor, stepIdx, captured]);

    const handleApply = useCallback(() => {
        setAllCalibrations(captured);
        sendCalibration(captured);
        onComplete(true);
    }, [captured, onComplete]);

    const handleRedo = useCallback(() => {
        handleStartCalibration();
    }, [handleStartCalibration]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content calibration-modal" onClick={e => e.stopPropagation()}>
                <h2>Color Calibration</h2>
                <p className="modal-subtitle">Calibrate for your lighting conditions</p>

                {/* ── Intro ── */}
                {phase === 'intro' && (
                    <div className="calib-intro">
                        <p className="calib-intro-desc">
                            For best scanning accuracy, calibrate the 6 cube colors under
                            your current lighting. Hold each color's center sticker in front
                            of the camera one at a time.
                        </p>
                        <div className="calib-intro-actions">
                            <button className="btn btn-primary" onClick={handleStartCalibration}>
                                Start Calibration
                            </button>
                            <button className="btn" onClick={handleSkip}>
                                Skip (Use Defaults)
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Progress dots ── */}
                {phase === 'capture' && (
                    <div className="calib-progress">
                        {STEPS.map((step, i) => (
                            <div
                                key={step.face}
                                className={`calib-dot ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}
                            >
                                <span
                                    className="calib-dot-inner"
                                    style={{ background: step.color }}
                                />
                                {captured[step.face] && (
                                    <span className="calib-dot-check">&#10003;</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Capture step ── */}
                {phase === 'capture' && currentStep && (
                    <div className="calib-capture">
                        <p className="calib-instruction">
                            Hold the <strong style={{ color: currentStep.color }}>{currentStep.label}</strong> center
                            sticker in the circle
                        </p>

                        <div className="calib-video-wrap">
                            <video ref={videoRef} autoPlay playsInline muted className="calib-video" />
                            <div className={`calib-circle-overlay ${liveColor ? 'previewing' : ''}`}>
                                <div
                                    className="calib-preview-fill"
                                    style={{
                                        backgroundColor: liveColor
                                            ? `rgb(${liveColor.r}, ${liveColor.g}, ${liveColor.b})`
                                            : 'transparent'
                                    }}
                                />
                            </div>
                        </div>

                        {liveColor && (
                            <span className="calib-live-rgb">
                                RGB: {liveColor.r}, {liveColor.g}, {liveColor.b}
                            </span>
                        )}

                        <button
                            className="btn btn-primary calib-capture-btn"
                            onClick={handleCapture}
                            disabled={!liveColor}
                        >
                            Capture {currentStep.label}
                        </button>
                    </div>
                )}

                {/* ── Review ── */}
                {phase === 'review' && (
                    <div className="calib-review">
                        <p className="calib-review-title">Review captured colors</p>

                        <div className="calib-swatches">
                            {STEPS.map(step => {
                                const rgb = captured[step.face];
                                return (
                                    <div key={step.face} className="calib-swatch">
                                        <div
                                            className="calib-swatch-color"
                                            style={{
                                                backgroundColor: rgb
                                                    ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
                                                    : '#333'
                                            }}
                                        />
                                        <span className="calib-swatch-label">{step.label}</span>
                                        {rgb && (
                                            <span className="calib-swatch-rgb">
                                                {rgb.r}, {rgb.g}, {rgb.b}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="calib-review-actions">
                            <button className="btn btn-primary" onClick={handleApply}>Apply</button>
                            <button className="btn" onClick={handleRedo}>Redo</button>
                        </div>
                    </div>
                )}

                {/* ── Close button (always available) ── */}
                {phase !== 'intro' && (
                    <div className="modal-actions">
                        <button className="btn" onClick={onClose}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
}
