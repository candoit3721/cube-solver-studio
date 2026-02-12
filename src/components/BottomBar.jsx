/**
 * BottomBar — Scramble, Scan, Edit, Solve, Reset, ? buttons + speed slider.
 */
import { useState } from 'react';
import { useCubeState } from '../hooks/useCubeState.jsx';
import '../styles/BottomBar.css';

export default function BottomBar({ onOpenEditor, onOpenCamera, onOpenNotation }) {
    const { state, scramble, solve, reset, speedRef } = useCubeState();
    const { mode, solution, step } = state;
    const [speed, setSpeed] = useState(5);

    const handleSpeedChange = (e) => {
        const v = Number(e.target.value);
        setSpeed(v);
        speedRef.current = v;
    };

    return (
        <footer className="bottom-bar">
            <div className="hint-overlay" style={{ opacity: mode === 'idle' && solution.length === 0 ? 1 : 0 }}>
                Press <strong>Scramble</strong> or <strong>Edit</strong> to begin
            </div>

            <div className="speed-control">
                <span>Speed</span>
                <input type="range" min="1" max="10" value={speed} onChange={handleSpeedChange} />
                <span className="speed-val">{speed}</span>
            </div>

            <div className="action-buttons">
                <button
                    className="btn"
                    disabled={mode === 'scrambling' || mode === 'solving'}
                    onClick={scramble}
                >Scramble</button>

                <button className="btn btn-accent" onClick={onOpenCamera}>🖥 Scan</button>
                <button className="btn btn-accent" onClick={onOpenEditor}>🎨 Edit</button>

                <button
                    className="btn"
                    disabled={mode !== 'ready' && mode !== 'paused'}
                    onClick={() => {
                        // Start solve loop
                        solve(solution, step);
                    }}
                >Solve</button>

                <button
                    className="btn"
                    disabled={mode === 'scrambling' || mode === 'solving'}
                    onClick={reset}
                >Reset</button>

                <button className="btn btn-sm" onClick={onOpenNotation}>?</button>
            </div>
        </footer>
    );
}
