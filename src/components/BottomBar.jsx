/**
 * BottomBar — controls, playback, action buttons.
 */
import { useState } from 'react';
import { useCubeState } from '../hooks/useCubeState.jsx';
import { isBusy } from '../engine/animator.js';
import {
    IconShuffle, IconCamera, IconScan3D, IconEdit,
    IconSparkle, IconRotateCCW,
} from './Icons.jsx';
import '../styles/BottomBar.css';

export default function BottomBar({ onOpenEditor, onOpenCamera, onOpenFreeScan, onOpenTutorial }) {
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
    const isProcessing = mode === 'scrambling' || mode === 'solving';
    const isOptimal = solverMethod === 'optimal';

    return (
        <>
            <footer className="bottom-bar">
                <div className="controls-stack">

                    {/* Row 1: Set Pattern (60%) + Approach (40%) */}
                    <div className="workflow-row">

                        {/* Set Pattern box — no label, just buttons */}
                        <div className="wf-box wf-box-set">
                            <div className="wf-box-body">
                                <div className="pattern-grid">
                                    {/* Row 1: Scramble | Edit */}
                                    <button className="btn wf-btn" data-tutorial="scramble" disabled={isProcessing} onClick={scramble}>
                                        <IconShuffle /> Scramble
                                    </button>
                                    <button className="btn wf-btn btn-accent" data-tutorial="edit" onClick={onOpenEditor}>
                                        <IconEdit /> Edit
                                    </button>
                                    {/* Row 2: Scan | 3D Scan */}
                                    <button className="btn wf-btn btn-accent" data-tutorial="scan" onClick={onOpenCamera}>
                                        <IconCamera /> Scan
                                    </button>
                                    <button className="btn wf-btn btn-accent" onClick={onOpenFreeScan}>
                                        <IconScan3D /> 3D Scan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Approach box — label inside */}
                        <div className="wf-box wf-box-approach">
                            <div className="wf-box-body approach-body">
                                <div className="approach-inner" data-tutorial="method">
                                    <div className="approach-label">Approach</div>
                                    <label className={`method-toggle${isOptimal ? ' active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={isOptimal}
                                            disabled={isProcessing}
                                            onChange={() => setMethod(isOptimal ? 'beginner' : 'optimal')}
                                        />
                                        <span className="toggle-track">
                                            <span className="toggle-thumb" />
                                        </span>
                                        <span className="toggle-text">
                                            <span className="toggle-name">{isOptimal ? 'Optimal' : 'Beginner'}</span>
                                            <span className="toggle-desc">{isOptimal ? 'Shortest path' : 'Layer-by-layer'}</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Playback */}
                    <div className={`playback-row${!hasSol ? ' playback-inactive' : ''}`} data-tutorial="playback">
                        <div className="playback-controls">
                            <button className="pb-btn" disabled={!hasSol || playing || step <= 0 || busy} onClick={() => firstStep(step, solution)} title="First step">⏮</button>
                            <button className="pb-btn" disabled={!hasSol || playing || step <= 0 || busy} onClick={() => prevStep(step, solution)} title="Step back">❮</button>
                            <button
                                className="pb-btn pb-play"
                                disabled={!hasSol || (!playing && step >= solution.length)}
                                onClick={() => playing ? stopPlaying() : solve(solution, step, state.customPattern)}
                                title={playing ? 'Pause' : 'Play'}
                            >{playing ? '⏸' : '▶'}</button>
                            <button className="pb-btn" disabled={!hasSol || playing || step >= solution.length || busy} onClick={() => nextStep(step, solution)} title="Step forward">❯</button>
                            <button className="pb-btn" disabled={!hasSol || playing || step >= solution.length || busy} onClick={() => lastStep(step, solution)} title="Last step">⏭</button>
                        </div>
                        <div className="speed-control" data-tutorial="speed">
                            <span>Speed</span>
                            <input type="range" min="1" max="10" value={speed} onChange={handleSpeedChange} disabled={!hasSol} />
                            <span className="speed-val">{speed}</span>
                        </div>
                    </div>

                    {/* Row 3: Solve + Reset + Tour */}
                    <div className="action-row" data-tutorial="solve">
                        <button className="btn action-btn btn-solve-green" disabled={isProcessing} onClick={() => solve(solution, step, state.customPattern)}>
                            <IconSparkle /> Solve
                        </button>
                        <button className="btn action-btn btn-reset" disabled={isProcessing} onClick={reset}>
                            <IconRotateCCW /> Reset
                        </button>
                        <button className="tour-btn" onClick={onOpenTutorial} aria-label="How to use" data-tutorial="tour">
                            ?
                            <span className="tour-tooltip">How to use this app</span>
                        </button>
                    </div>

                </div>
            </footer>
        </>
    );
}
