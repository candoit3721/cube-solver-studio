/**
 * EditorModal — manual pattern editor with cube net, color palette.
 */
import { useState } from 'react';
import { FACES, FACE_HEX } from '../engine/constants.js';
import { useCubeState } from '../hooks/useCubeState.jsx';
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
    const [error, setError] = useState('');

    const handleCellClick = (face, idx) => {
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
        setError('');
    };

    const handleApply = () => {
        // Validate: each color must appear exactly 9 times
        const counts = {};
        FACES.forEach(f => {
            editorState[f].forEach(c => { counts[c] = (counts[c] || 0) + 1; });
        });
        const bad = Object.entries(counts).filter(([, v]) => v !== 9);
        if (bad.length) {
            setError(`Need exactly 9 of each color. ${bad.map(([k, v]) => k + ':' + v).join(', ')}`);
            return;
        }
        setError('');
        applyColorState(editorState);
        onClose();
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
                                                    className="cell"
                                                    style={{ background: FACE_HEX[color] }}
                                                    onClick={() => handleCellClick(face, idx)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="palette">
                    {FACES.map(f => (
                        <div
                            key={f}
                            className={`pb ${f === brush ? 'active' : ''}`}
                            style={{ background: FACE_HEX[f] }}
                            title={f}
                            onClick={() => setBrush(f)}
                        />
                    ))}
                </div>

                {error && <div className="editor-err">{error}</div>}

                <div className="modal-actions">
                    <button className="btn" onClick={handleClear}>Clear</button>
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleApply}>Apply to Cube</button>
                </div>
            </div>
        </div>
    );
}
