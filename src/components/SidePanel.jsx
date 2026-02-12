/**
 * SidePanel — solution phases, method selector, step highlighting.
 */
import { useState } from 'react';
import { useCubeState } from '../hooks/useCubeState.jsx';
import '../styles/SidePanel.css';

const BEGINNER_PHASES = [
    { name: 'White Cross', desc: 'Form a cross on the white face.', icon: '✚' },
    { name: 'White Corners', desc: 'Place white corner pieces.', icon: '◱' },
    { name: 'Second Layer', desc: 'Insert middle layer edges.', icon: '▬' },
    { name: 'Yellow Cross', desc: 'Orient yellow edges for a cross.', icon: '✚' },
    { name: 'Yellow Edges', desc: 'Position yellow cross edges.', icon: '↻' },
    { name: 'Yellow Corners Position', desc: 'Move yellow corners to correct spots.', icon: '◲' },
    { name: 'Yellow Corners Orient', desc: 'Twist yellow corners to complete.', icon: '✦' },
];

const ADVANCED_PHASES = [
    { name: 'Cross', desc: 'Solve the bottom cross efficiently.', icon: '✚' },
    { name: 'F2L', desc: 'Pair and insert corner+edge into slots.', icon: '▦' },
    { name: 'OLL', desc: 'Orient all last-layer pieces. 57 algorithms.', icon: '⬛' },
    { name: 'PLL', desc: 'Permute last-layer pieces. 21 algorithms.', icon: '↺' },
];

export default function SidePanel({ open, onToggle }) {
    const { state, jumpToStep } = useCubeState();
    const { solution, step, mode, sidePanelErr, sidePanelSolved } = state;
    const [method, setMethod] = useState('beginner');

    const phases = method === 'beginner' ? BEGINNER_PHASES : ADVANCED_PHASES;
    const phaseCount = phases.length;
    const movesPerPhase = Math.max(1, Math.ceil(solution.length / phaseCount));

    const phaseGroups = phases.map((p, i) => {
        const start = i * movesPerPhase;
        const end = Math.min(start + movesPerPhase, solution.length);
        return { ...p, moves: solution.slice(start, end), startIdx: start, endIdx: end };
    }).filter(pg => pg.moves.length > 0);

    const renderOverview = () => {
        if (sidePanelErr) {
            return <><strong>Custom Pattern Applied</strong><br />{sidePanelErr}</>;
        }
        if (sidePanelSolved) {
            return <><strong>Already Solved!</strong><br />The pattern is already in the solved state.</>;
        }
        if (solution.length === 0) return null;
        if (method === 'beginner') {
            return <><strong>Layer-by-Layer Method</strong><br />Solves the cube one layer at a time.<br /><strong>{solution.length} moves total</strong></>;
        }
        return <><strong>CFOP Method (Fridrich)</strong><br />Advanced speedcubing method: Cross → F2L → OLL → PLL.<br /><strong>{solution.length} moves total</strong></>;
    };

    const overview = renderOverview();

    return (
        <>
            <button className={`panel-toggle ${open ? 'active' : ''}`} onClick={onToggle}>
                📋 Steps
            </button>
            <aside className={`side-panel ${open ? 'open' : ''}`}>
                <div className="sp-header">
                    <h3>Solution</h3>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="method-select">
                        <option value="beginner">Beginner</option>
                        <option value="advanced">Advanced (CFOP)</option>
                    </select>
                </div>

                {overview && <div className="sp-overview">{overview}</div>}

                <div className="sp-steps">
                    {phaseGroups.map((pg, pi) => {
                        let cardClass = 'sp-card';
                        if (step >= pg.endIdx) cardClass += ' done';
                        else if (step >= pg.startIdx && step < pg.endIdx) cardClass += ' active';

                        return (
                            <div key={pi}>
                                <div className="sp-phase-header">{pg.icon} Phase {pi + 1}: {pg.name}</div>
                                <div
                                    className={cardClass}
                                    onClick={() => jumpToStep(pg.startIdx, step, solution)}
                                >
                                    <div className="sp-desc">{pg.desc}</div>
                                    <div className="sp-moves">{pg.moves.join(' ')}</div>
                                    <div className="sp-phase">{pg.moves.length} move{pg.moves.length !== 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}
