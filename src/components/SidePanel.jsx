/**
 * SidePanel — solution phases, method selector, step highlighting.
 */
import { useCubeState } from '../hooks/useCubeState.jsx';
import '../styles/SidePanel.css';

// Simplified phase display for Kociemba solver results
// We group moves into chunks for readability, as optimal solutions don't follow beginner phases.

export default function SidePanel({ open, onToggle }) {
    const { state, jumpToStep } = useCubeState();
    const { solution, step, sidePanelErr, sidePanelSolved, phases } = state;

    // Build phase groups: use real phases from beginner solver, or chunk for optimal
    const phaseGroups = [];
    if (solution.length > 0) {
        if (phases && phases.length > 0) {
            let offset = 0;
            for (const phase of phases) {
                if (phase.moves.length > 0) {
                    phaseGroups.push({
                        name: phase.name,
                        desc: `${phase.moves.length} move${phase.moves.length !== 1 ? 's' : ''}`,
                        moves: phase.moves,
                        startIdx: offset,
                        endIdx: offset + phase.moves.length,
                    });
                }
                offset += phase.moves.length;
            }
        } else {
            const CHUNK_SIZE = 5;
            for (let i = 0; i < solution.length; i += CHUNK_SIZE) {
                const chunk = solution.slice(i, i + CHUNK_SIZE);
                phaseGroups.push({
                    name: `Part ${Math.floor(i / CHUNK_SIZE) + 1}`,
                    desc: `Moves ${i + 1} - ${Math.min(i + CHUNK_SIZE, solution.length)}`,
                    moves: chunk,
                    startIdx: i,
                    endIdx: i + chunk.length,
                });
            }
        }
    }

    const renderOverview = () => {
        if (sidePanelErr) {
            return <><strong>Custom Pattern Applied</strong><br />{sidePanelErr}</>;
        }
        if (sidePanelSolved) {
            return <><strong>Already Solved!</strong><br />The pattern is already in the solved state.</>;
        }
        if (solution.length === 0) return null;

        if (phases && phases.length > 0) {
            return (
                <>
                    <strong>Beginner&apos;s Method</strong><br />Layer-by-layer solution in {phaseGroups.length} phases.<br /><strong>{solution.length} moves total</strong>
                </>
            );
        }

        return (
            <>
                <strong>Optimal Solution</strong><br />Found shortest path using Kociemba algorithm.<br /><strong>{solution.length} moves total</strong>
                <div style={{ marginTop: '0.8rem', padding: '0.6rem', background: '#2a2a35', borderRadius: '4px', border: '1px solid #444', fontSize: '0.9em', lineHeight: '1.4' }}>
                    ⚠️ <strong>Hold Cube Correctly:</strong><br />
                    1. <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Green Center</span> facing <strong>YOU</strong><br />
                    2. <span style={{ color: '#fff', fontWeight: 'bold' }}>White Center</span> facing <strong>UP</strong><br />
                    <em>(Use &apos;Play&apos; button to confirm moves)</em>
                </div>
            </>
        );
    };

    const overview = renderOverview();

    return (
        <>
            <button className={`panel-toggle ${open ? 'active' : ''}`} onClick={onToggle}>
                📋 Steps
            </button>
            <aside className={`side-panel ${open ? 'open' : ''}`}>
                <div className="sp-header">
                    <h3>Solution Steps</h3>
                </div>

                {overview && <div className="sp-overview">{overview}</div>}

                <div className="sp-steps">
                    {phaseGroups.map((pg, pi) => {
                        let cardClass = 'sp-card';
                        if (step >= pg.endIdx) cardClass += ' done';
                        else if (step >= pg.startIdx && step < pg.endIdx) cardClass += ' active';

                        return (
                            <div key={pi}>
                                <div className="sp-phase-header">Step {pi + 1}: {pg.name}</div>
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
