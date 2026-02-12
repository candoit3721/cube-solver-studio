/**
 * CameraModal — camera scanner for cube faces.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { FACES, FACE_HEX } from '../engine/constants.js';
import { useCubeState } from '../hooks/useCubeState.jsx';
import '../styles/CameraModal.css';

const SCAN_FACES = ['U', 'D', 'F', 'B', 'R', 'L'];

function classifyColor(r, g, b) {
    const colors = [
        { face: 'U', r: 255, g: 255, b: 255 },
        { face: 'D', r: 255, g: 213, b: 0 },
        { face: 'F', r: 0, g: 158, b: 96 },
        { face: 'B', r: 0, g: 81, b: 186 },
        { face: 'R', r: 196, g: 30, b: 58 },
        { face: 'L', r: 255, g: 88, b: 0 },
    ];
    let best = null, bestD = Infinity;
    for (const c of colors) {
        const d = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
        if (d < bestD) { bestD = d; best = c.face; }
    }
    return best;
}

export default function CameraModal({ open, onClose }) {
    const { applyColorState } = useCubeState();
    const videoRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const [scanned, setScanned] = useState({});
    const [status, setStatus] = useState('Point camera at each face of the cube');

    const count = Object.keys(scanned).length;

    const resetScan = useCallback(() => {
        setScanned({});
        setStatus('Point camera at each face of the cube');
    }, []);

    const sampleGrid = useCallback((video) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const w = video.videoWidth, h = video.videoHeight;
        const cx = w / 2, cy = h / 2, sz = Math.min(w, h) * 0.4;
        const result = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const px = cx - sz / 2 + sz * col / 2.5 + sz / 5;
                const py = cy - sz / 2 + sz * row / 2.5 + sz / 5;
                const d = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
                result.push(classifyColor(d[0], d[1], d[2]));
            }
        }
        return result;
    }, []);

    const scanLoop = useCallback(() => {
        if (!videoRef.current || !streamRef.current) return;
        const grid = sampleGrid(videoRef.current);
        const center = grid[4];
        setScanned(prev => {
            if (prev[center]) return prev;
            const next = { ...prev, [center]: grid };
            const c = Object.keys(next).length;
            if (c >= 6) setStatus('All faces scanned! Click Apply.');
            return next;
        });
    }, [sampleGrid]);

    useEffect(() => {
        if (!open) return;
        let active = true;

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                intervalRef.current = setInterval(scanLoop, 500);
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

    const handleApply = () => {
        if (count < 6) return;
        const faceMap = {};
        FACES.forEach(f => { faceMap[f] = scanned[f] || Array(9).fill(f); });
        onClose();
        applyColorState(faceMap);
    };

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content cam-modal" onClick={e => e.stopPropagation()}>
                <h2>Camera Scanner</h2>
                <div className="cam-video-wrap">
                    <video ref={videoRef} autoPlay playsInline muted className="cam-video" />
                    <div className="cam-overlay">
                        <div className="scan-grid" />
                    </div>
                </div>

                <p className="cam-status">{status}</p>
                <p className="cam-count">{count} / 6 faces scanned</p>

                <div className="cam-faces">
                    {SCAN_FACES.map(f => (
                        <div
                            key={f}
                            className={`cam-face ${scanned[f] ? 'done' : ''}`}
                            style={{ borderBottomColor: FACE_HEX[f] }}
                        >{f}</div>
                    ))}
                </div>

                <div className="modal-actions">
                    <button className="btn" onClick={resetScan}>Reset Scan</button>
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" disabled={count < 6} onClick={handleApply}>Apply</button>
                </div>
            </div>
        </div>
    );
}
