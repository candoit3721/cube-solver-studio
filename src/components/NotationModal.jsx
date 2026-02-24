/**
 * NotationModal — move notation reference.
 */
import { MOVE_DESC } from '../engine/constants.js';
import FaceBadge from './FaceBadge.jsx';

export default function NotationModal({ open, onClose }) {
    if (!open) return null;

    const groups = [
        { label: 'U — Top',    face: 'U', moves: ['U', "U'", 'U2'] },
        { label: 'D — Bottom', face: 'D', moves: ['D', "D'", 'D2'] },
        { label: 'R — Right',  face: 'R', moves: ['R', "R'", 'R2'] },
        { label: 'L — Left',   face: 'L', moves: ['L', "L'", 'L2'] },
        { label: 'F — Front',  face: 'F', moves: ['F', "F'", 'F2'] },
        { label: 'B — Back',   face: 'B', moves: ['B', "B'", 'B2'] },
    ];

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content nota-modal" onClick={e => e.stopPropagation()}>
                <h2>Move Notation</h2>
                <p className="modal-subtitle">Standard Rubik's Cube move notation. Clockwise as viewed facing the given face.</p>
                <div className="nota-grid">
                    {groups.map(g => (
                        <div key={g.label} className="nota-group">
                            <h4>{g.label}</h4>
                            {g.moves.map(m => (
                                <div key={m} className="nota-item">
                                    <FaceBadge face={g.face} suffix={m.slice(1)} />
                                    <span>{MOVE_DESC[m]}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
