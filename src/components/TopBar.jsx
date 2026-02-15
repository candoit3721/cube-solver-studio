/**
 * TopBar — logo, current move display, status badge.
 */
import { useCubeState } from '../hooks/useCubeState.jsx';
import { FACE_HEX, FACE_OF } from '../engine/constants.js';
import '../styles/TopBar.css';

export default function TopBar() {
    const { state } = useCubeState();
    const { mode, solution, step } = state;

    const badgeClass = {
        idle: 'solved', scrambling: 'scrambled', ready: 'ready', solving: 'solving', paused: 'ready',
    }[mode] || 'solved';
    const badgeLabel = {
        idle: 'SOLVED', scrambling: 'SCRAMBLING', ready: 'READY', solving: 'SOLVING', paused: 'PAUSED',
    }[mode] || 'SOLVED';

    const showMove = (mode === 'solving' || mode === 'ready' || mode === 'paused') && step > 0 && step <= solution.length;
    const currentMove = showMove ? solution[step - 1] : null;

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

                <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
            </div>
        </header>
    );
}
