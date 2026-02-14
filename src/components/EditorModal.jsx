/**
 * EditorModal — manual pattern editor with cube net, color palette.
 */
import { useState } from 'react';
import { FACES, FACE_HEX } from '../engine/constants.js';
import { useCubeState } from '../hooks/useCubeState.jsx';
import { faceMapToFaceletString } from '../engine/solver.js';
import '../styles/EditorModal.css';

const NET_LAYOUT = [
    [null, 'U', null, null],
    ['L', 'F', 'R', 'B'],
    [null, 'D', null, null],
];

export default function EditorModal({ open, onClose }) {
    const { applyColorState } = useCubeState();
    const [editorState, setEditorState] = useState(() => {
        const s = {};
        FACES.forEach(f => { s[f] = Array(9).fill(f); });
        return s;
    });
    const [brush, setBrush] = useState('U');

    // Calculate counts
    const counts = FACES.reduce((acc, f) => { acc[f] = 0; return acc; }, {});
    FACES.forEach(f => {
        editorState[f].forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    });
    const isValid = FACES.every(f => counts[f] === 9);

    const handleCellClick = (face, idx) => {
        if (idx === 4) return; // Lock center
        setEditorState(prev => {
            const next = { ...prev };
            next[face] = [...prev[face]];
            next[face][idx] = brush;
            return next;
        });
    };

    const handleClear = () => {
        const s = {};
        FACES.forEach(f => { s[f] = Array(9).fill(f); });
        setEditorState(s);
    };

    const handleApply = () => {
        if (!isValid) return;
        applyColorState(editorState);
        onClose();
    };

    const getValidationMsg = () => {
        const missing = [];
        const extra = [];
        FACES.forEach(f => {
            const count = counts[f] || 0;
            if (count > 9) extra.push(`${f} (+${count - 9})`);
            if (count < 9) missing.push(`${f} (-${9 - count})`);
        });
        if (extra.length > 0 || missing.length > 0) {
            const parts = [];
            if (extra.length) parts.push(`Remove: ${extra.join(', ')}`);
            if (missing.length) parts.push(`Add: ${missing.join(', ')}`);
            return parts.join('. ');
        }

        // 2. Parity/Orientation Check (Advanced)
        if (typeof window.Cube !== 'undefined') {
            try {
                // Determine if valid
                const s = faceMapToFaceletString(editorState);
                window.Cube.fromString(s); // Throws if invalid
                return null;
            } catch (e) {
                let msg = e.message || "Invalid configuration";
                // Strip "Error:" prefix
                msg = msg.replace(/^Error:\s*/i, '');
                return "Impossible: " + msg;
            }
        }

        return null;
    };

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Pattern Editor</h2>
                <p className="modal-subtitle">Click cells to paint. Pick a color below, then tap each sticker.</p>

                <div className="cube-net">
                    {NET_LAYOUT.map((row, ri) => (
                        <div className="net-row" key={ri}>
                            {row.map((face, ci) => {
                                if (!face) return <div className="net-spacer" key={ci} />;
                                return (
                                    <div className="face-wrap" key={ci}>
                                        <div className="face-label">{face}</div>
                                        <div className="face-grid">
                                            {editorState[face].map((color, idx) => (
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

                <div className="palette">
                    {FACES.map(f => {
                        const count = counts[f] || 0;
                        const isOver = count > 9;
                        return (
                            <div
                                key={f}
                                className={`pb ${f === brush ? 'active' : ''} ${isOver ? 'over' : ''}`}
                                style={{
                                    background: FACE_HEX[f],
                                    borderColor: f === brush ? '#fff' : (isOver ? 'var(--red)' : 'transparent')
                                }}
                                title={`${f}: ${count}/9`}
                                onClick={() => setBrush(f)}
                            >
                                <span className="pb-count">{count}</span>
                            </div>
                        );
                    })}
                </div>

                {!isValid && <div className="editor-err">{getValidationMsg()}</div>}

                <div className="modal-actions">
                    <button className="btn" onClick={handleClear}>Reset</button>
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" disabled={!isValid} onClick={handleApply}>Apply</button>
                </div>
            </div>
        </div>
    );
}
