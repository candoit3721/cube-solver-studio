/**
 * SidePanel — solution phases, method selector, step highlighting.
 */
import { useCubeState } from '../hooks/useCubeState.jsx';
import '../styles/SidePanel.css';

const PHASE_INFO = {
    'White Cross': {
        why: 'The cross is the foundation — every layer-by-layer solve starts here. You\'re building a "+" shape on the white face while ensuring each edge\'s side color matches its center.',
        goal: 'White edges aligned with their center colors',
        alg: 'Intuitive — no fixed algorithm, move edges into place one by one',
    },
    'White Corners': {
        why: 'With the cross done, slot each corner into position using a simple "insert" trigger (R\' D\' R D). This completes the entire first layer.',
        goal: 'First layer fully solved',
        alg: 'R\' D\' R D — repeated until corner is oriented correctly',
    },
    'Middle Layer': {
        why: 'Now solve the middle ring of edges. Each edge is inserted from the bottom layer using one of two mirror algorithms (left or right insert).',
        goal: 'First two layers (F2L) complete',
        alg: 'U R U\' R\' U\' F\' U F (right) or U\' L\' U L U F U\' F\' (left)',
    },
    'Yellow Cross': {
        why: 'Flip the cube so yellow is on top. Orient yellow edges to form a cross — you may start with a dot, an "L", or a line shape.',
        goal: 'Yellow cross on top face',
        alg: 'F R U R\' U\' F\' — apply 1-3 times depending on starting shape',
    },
    'Yellow Edge Perm': {
        why: 'The yellow cross exists but the side colors may be wrong. Cycle edges around until each matches its center color.',
        goal: 'Yellow cross edges match their centers',
        alg: 'R U R\' U R U2 R\' — swap edges into position',
    },
    'Yellow Corner Perm': {
        why: 'Move yellow corners to their correct positions (colors may still be twisted). Look for a corner that\'s already correct and use it as an anchor.',
        goal: 'All corners in correct positions',
        alg: 'U R U\' L\' U R\' U\' L — 3-corner cycle',
    },
    'Yellow Corner Orient': {
        why: 'The final step! Twist each corner in-place using R\' D\' R D until its yellow sticker faces up. Don\'t panic if the cube looks scrambled mid-algorithm — it resolves.',
        goal: 'Cube fully solved',
        alg: 'R\' D\' R D — repeated per corner, then U to rotate top',
    },
};

export default function SidePanel({ open, onToggle, onOpenNotation }) {
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
                    <strong>Beginner&apos;s Method</strong><br />
                    Layer-by-layer solution in {phaseGroups.length} phases.<br />
                    <strong>{solution.length} moves total</strong>
                    <div className="sp-learn-note">
                        This is the standard LBL (Layer-By-Layer) method — the most popular way to learn solving. Each phase has a clear goal and uses simple, repeatable algorithms.
                    </div>
                </>
            );
        }

        return (
            <>
                <strong>Optimal Solution</strong><br />
                <strong>{solution.length} moves</strong> — shortest path via Kociemba&apos;s algorithm.
                <div className="sp-callout">
                    <strong>Hold Cube:</strong>{' '}
                    <span style={{ color: '#2ecc71' }}>Green</span> toward you,{' '}
                    <span style={{ color: '#fff' }}>White</span> on top
                </div>
                <div className="sp-learn-note">
                    This is a computer-optimized solution — the moves don&apos;t follow human-intuitive steps. It&apos;s great for speed, but not for learning.<br /><br />
                    <strong>Want to understand each step?</strong> Switch to <strong>Beginner</strong> mode for a guided, phase-by-phase walkthrough with explanations.
                </div>
            </>
        );
    };

    const overview = renderOverview();

    return (
        <>
            <button className={`panel-toggle ${open ? 'active' : ''}`} onClick={onToggle} data-tutorial="panel-toggle" title={open ? 'Hide steps' : 'Show steps'}>
                {open ? (
                    /* panel open → chevron points right = collapse/hide */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="15" y1="3" x2="15" y2="21"/>
                        <polyline points="9 7 13 12 9 17"/>
                    </svg>
                ) : (
                    /* panel closed → chevron points left = expand/show */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="15" y1="3" x2="15" y2="21"/>
                        <polyline points="11 7 7 12 11 17"/>
                    </svg>
                )}
            </button>
            <aside className={`side-panel ${open ? 'open' : ''}`}>
                <div className="sp-header">
                    <h3>Solution Steps</h3>
                </div>

                {overview && <div className="sp-overview">{overview}</div>}

                {solution.length > 0 && (
                    <button className="sp-notation-banner" onClick={onOpenNotation}>
                        <span className="sp-notation-icon">📖</span>
                        <span className="sp-notation-text">
                            <span className="sp-notation-label">Move Notation Guide</span>
                            <span className="sp-notation-sub">R, U, F, L, D, B — what each move means</span>
                        </span>
                        <span className="sp-notation-arrow">→</span>
                    </button>
                )}

                <div className="sp-steps">
                    {phaseGroups.map((pg, pi) => {
                        const info = PHASE_INFO[pg.name];
                        let cardClass = 'sp-card';
                        if (step >= pg.endIdx) cardClass += ' done';
                        else if (step >= pg.startIdx && step < pg.endIdx) cardClass += ' active';

                        return (
                            <div key={pi}>
                                <div className="sp-phase-header">
                                    Step {pi + 1}: {pg.name}
                                    {info && <span className="sp-goal">Goal: {info.goal}</span>}
                                </div>
                                <div
                                    className={cardClass}
                                    onClick={() => jumpToStep(pg.startIdx, step, solution)}
                                >
                                    {info && (
                                        <div className="sp-explanation">
                                            {info.why}
                                            <div className="sp-algorithm">Algorithm: <code>{info.alg}</code></div>
                                        </div>
                                    )}
                                    <div className="sp-desc">{pg.desc}</div>
                                    <div className="sp-moves">{pg.moves.join(' ')}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </aside>
        </>
    );
}
