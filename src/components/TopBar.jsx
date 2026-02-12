/**
 * TopBar — logo, step navigation, move display, status badge.
 */
import { useCubeState } from '../hooks/useCubeState.jsx';
import { FACE_HEX, FACE_OF } from '../engine/constants.js';
import { isBusy } from '../engine/animator.js';
import '../styles/TopBar.css';

export default function TopBar() {
    const { state, nextStep, prevStep, firstStep, lastStep, solve, stopPlaying } = useCubeState();
    const { mode, solution, step, playing } = state;

    const hasSol = solution.length > 0;
    const busy = isBusy();

    const badgeClass = {
        idle: 'solved', scrambling: 'scrambled', ready: 'ready', solving: 'solving', paused: 'ready',
    }[mode] || 'solved';
    const badgeLabel = {
        idle: 'SOLVED', scrambling: 'SCRAMBLING', ready: 'READY', solving: 'SOLVING', paused: 'PAUSED',
    }[mode] || 'SOLVED';

    const showMove = (mode === 'solving' || mode === 'ready' || mode === 'paused') && step > 0 && step <= solution.length;
    const currentMove = showMove ? solution[step - 1] : null;

    function handleTogglePlay() {
        if (playing) {
            stopPlaying();
        } else if (step < solution.length) {
            // Start solving from current step
            solve(solution, step);
        }
    }

    return (
        <header className="top-bar">
            <div className="logo">Rubik's Cube</div>

            <div className="top-controls">
                {showMove && (
                    <div className="move-display show">
                        <span className="face-dot" style={{ background: FACE_HEX[FACE_OF(currentMove)] || '#888' }} />
                        <span className="move-text">{currentMove} ({step}/{solution.length})</span>
                    </div>
                )}

                <div className="step-nav">
                    <button
                        className="step-btn" title="First"
                        disabled={!hasSol || step === 0 || busy}
                        onClick={() => firstStep(step, solution)}
                    >⏮</button>
                    <button
                        className="step-btn" title="Previous"
                        disabled={!hasSol || step === 0 || busy}
                        onClick={() => prevStep(step, solution)}
                    >◀</button>
                    <button
                        className="step-btn play-btn" title={playing ? 'Pause' : 'Play'}
                        disabled={!hasSol || step >= solution.length}
                        onClick={handleTogglePlay}
                    >{playing ? '⏸' : '▶'}</button>
                    <button
                        className="step-btn" title="Next"
                        disabled={!hasSol || step >= solution.length || busy}
                        onClick={() => nextStep(step, solution)}
                    >▶</button>
                    <button
                        className="step-btn" title="Last"
                        disabled={!hasSol || step >= solution.length || busy}
                        onClick={() => lastStep(step, solution)}
                    >⏭</button>
                </div>

                <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
            </div>
        </header>
    );
}
