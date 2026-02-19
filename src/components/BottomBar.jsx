/**
 * BottomBar — controls, playback, action buttons.
 */
import { useState } from 'react';
import { useCubeState } from '../hooks/useCubeState.jsx';
import { isBusy } from '../engine/animator.js';
import '../styles/BottomBar.css';

export default function BottomBar({ onOpenEditor, onOpenCamera, onOpenFreeScan, onOpenNotation }) {
    const {
        state, scramble, solve, reset, speedRef, setMethod,
        stopPlaying, nextStep, prevStep, firstStep, lastStep,
    } = useCubeState();
    const { mode, solution, step, solverMethod, playing } = state;
    const [speed, setSpeed] = useState(5);
    const busy = isBusy();

    const handleSpeedChange = (e) => {
        const v = Number(e.target.value);
        setSpeed(v);
        speedRef.current = v;
    };

    const hasSol = solution.length > 0;

    return (
        <footer className="bottom-bar">
            {!hasSol && (
                <div className="hint-overlay" style={{ opacity: mode === 'idle' ? 1 : 0 }}>
                    Press <strong>Scramble</strong> or <strong>Edit</strong> to begin
                </div>
            )}

            <div className="controls-row">
                <div className="method-toggle">
                    <button
                        className={`method-btn ${solverMethod === 'optimal' ? 'active' : ''}`}
                        disabled={mode === 'scrambling' || mode === 'solving'}
                        onClick={() => setMethod('optimal')}
                    >Optimal</button>
                    <button
                        className={`method-btn ${solverMethod === 'beginner' ? 'active' : ''}`}
                        disabled={mode === 'scrambling' || mode === 'solving'}
                        onClick={() => setMethod('beginner')}
                    >Beginner</button>
                </div>
                <div className="speed-control">
                    <span>Speed</span>
                    <input type="range" min="1" max="10" value={speed} onChange={handleSpeedChange} />
                    <span className="speed-val">{speed}</span>
                </div>
            </div>

            {hasSol && (
                <div className="playback-controls">
                    <button
                        className="pb-btn"
                        disabled={playing || step <= 0 || busy}
                        onClick={() => firstStep(step, solution)}
                        title="First step"
                    >⏮</button>
                    <button
                        className="pb-btn"
                        disabled={playing || step <= 0 || busy}
                        onClick={() => prevStep(step, solution)}
                        title="Step back"
                    >❮</button>
                    <button
                        className="pb-btn pb-play"
                        disabled={!playing && step >= solution.length}
                        onClick={() => {
                            if (playing) {
                                stopPlaying();
                            } else {
                                solve(solution, step, state.customPattern);
                            }
                        }}
                        title={playing ? 'Pause' : 'Play'}
                    >{playing ? '⏸' : '▶'}</button>
                    <button
                        className="pb-btn"
                        disabled={playing || step >= solution.length || busy}
                        onClick={() => nextStep(step, solution)}
                        title="Step forward"
                    >❯</button>
                    <button
                        className="pb-btn"
                        disabled={playing || step >= solution.length || busy}
                        onClick={() => lastStep(step, solution)}
                        title="Last step"
                    >⏭</button>
                </div>
            )}

            <div className="action-buttons">
                <button
                    className="btn"
                    disabled={mode === 'scrambling' || mode === 'solving'}
                    onClick={scramble}
                >Scramble</button>

                <button className="btn btn-accent" onClick={onOpenCamera}>🖥 Scan</button>
                <button className="btn btn-accent" onClick={onOpenFreeScan}>🔄 Free Scan</button>
                <button className="btn btn-accent" onClick={onOpenEditor}>🎨 Edit</button>

                <button
                    className="btn"
                    disabled={mode === 'scrambling' || mode === 'solving'}
                    onClick={() => solve(solution, step, state.customPattern)}
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
