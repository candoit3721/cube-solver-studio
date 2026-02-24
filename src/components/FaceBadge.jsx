/**
 * FaceBadge — move token matching the Learn page alg-token style:
 * grey pill with a coloured left-border stripe.
 * Used by NotationModal and AlgorithmsPage.
 */
import { FACE_HEX } from '../engine/constants.js';

/**
 * @param {string} face    — U D F B R L
 * @param {string} [suffix] — modifier: ' or 2 (empty for plain move)
 */
// U face is white — use a visible grey border instead
const BORDER_COLOR = { U: '#999' };

export default function FaceBadge({ face, suffix = '' }) {
    const faceColor = BORDER_COLOR[face] ?? (FACE_HEX[face] ?? '#888');
    return (
        <span
            className="alg-token"
            style={{ '--face-color': faceColor }}
        >
            {face}{suffix}
        </span>
    );
}
