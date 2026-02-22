/**
 * TutorialOverlay — step-by-step guided tour highlighting each button.
 */
import { useState, useEffect } from 'react';
import '../styles/TutorialOverlay.css';

const STEPS = [
    {
        selector: '[data-tutorial="scramble"]',
        title: 'Scramble',
        desc: 'Randomly scrambles the cube into a solvable state. Start here to practice solving!',
    },
    {
        selector: '[data-tutorial="method"]',
        title: 'Solve Approach',
        desc: 'Toggle between Optimal (fewest moves) and Beginner (layer-by-layer with full explanations — great for learning).',
    },
    {
        selector: '[data-tutorial="solve"]',
        title: 'Solve & Reset',
        desc: 'Solve computes the solution for the current cube state. Reset returns it to solved instantly.',
    },
    {
        selector: '[data-tutorial="playback"]',
        title: 'Playback Controls',
        desc: 'Play/pause the solution animation, or step forward and backward one move at a time.',
    },
    {
        selector: '[data-tutorial="speed"]',
        title: 'Speed',
        desc: 'Drag to control how fast the cube animates during solution playback.',
    },
    {
        selector: '[data-tutorial="panel-toggle"]',
        title: 'Solution Steps Panel',
        desc: 'Open the steps panel to see each solving phase with explanations, goals, and algorithms.',
    },
    {
        selector: '[data-tutorial="scan"]',
        title: 'Camera Scan',
        desc: 'Use your camera to automatically detect the colors of your physical Rubik\'s cube.',
    },
    {
        selector: '[data-tutorial="edit"]',
        title: 'Manual Edit',
        desc: 'Set each face color manually to input any cube pattern you want to solve.',
    },
];

const TOOLTIP_W = 300;
const TOOLTIP_H = 170; // estimated
const GAP = 28;        // gap between spotlight and tooltip
const PAD = 8;         // spotlight padding around element

function pickSide(hl, vw, vh) {
    const spaceBelow = vh - (hl.top + hl.height + PAD);
    const spaceAbove = hl.top - PAD;
    const spaceRight = vw - (hl.left + hl.width + PAD);
    const spaceLeft = hl.left - PAD;

    if (spaceBelow >= TOOLTIP_H + GAP) return 'below';
    if (spaceAbove >= TOOLTIP_H + GAP) return 'above';
    if (spaceRight >= TOOLTIP_W + GAP) return 'right';
    if (spaceLeft >= TOOLTIP_W + GAP) return 'left';
    return 'below'; // fallback
}

function tooltipPosition(hl, side, vw, vh) {
    const hlTop = hl.top - PAD;
    const hlLeft = hl.left - PAD;
    const hlW = hl.width + PAD * 2;
    const hlH = hl.height + PAD * 2;
    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

    switch (side) {
        case 'below':
            return {
                top: hlTop + hlH + GAP,
                left: clamp(hlLeft + hlW / 2 - TOOLTIP_W / 2, 12, vw - TOOLTIP_W - 12),
                arrowDir: 'up',
                arrowX: clamp(hlLeft + hlW / 2, 20, vw - 20),
            };
        case 'above':
            return {
                top: hlTop - TOOLTIP_H - GAP,
                left: clamp(hlLeft + hlW / 2 - TOOLTIP_W / 2, 12, vw - TOOLTIP_W - 12),
                arrowDir: 'down',
                arrowX: clamp(hlLeft + hlW / 2, 20, vw - 20),
            };
        case 'right':
            return {
                top: clamp(hlTop + hlH / 2 - TOOLTIP_H / 2, 12, vh - TOOLTIP_H - 12),
                left: hlLeft + hlW + GAP,
                arrowDir: 'left',
                arrowY: clamp(hlTop + hlH / 2, 20, vh - 20),
            };
        case 'left':
        default:
            return {
                top: clamp(hlTop + hlH / 2 - TOOLTIP_H / 2, 12, vh - TOOLTIP_H - 12),
                left: hlLeft - TOOLTIP_W - GAP,
                arrowDir: 'right',
                arrowY: clamp(hlTop + hlH / 2, 20, vh - 20),
            };
    }
}

export default function TutorialOverlay({ onClose }) {
    const [stepIdx, setStepIdx] = useState(0);
    const [highlight, setHighlight] = useState(null);

    useEffect(() => { moveToStep(stepIdx); }, [stepIdx]);

    const moveToStep = (idx) => {
        let i = idx;
        while (i < STEPS.length) {
            const el = document.querySelector(STEPS[i].selector);
            if (el) {
                const r = el.getBoundingClientRect();
                setHighlight({ top: r.top, left: r.left, width: r.width, height: r.height, step: i });
                return;
            }
            i++;
        }
        onClose();
    };

    const next = () => {
        const nextIdx = (highlight?.step ?? stepIdx) + 1;
        if (nextIdx >= STEPS.length) onClose();
        else setStepIdx(nextIdx);
    };

    const prev = () => setStepIdx(Math.max(0, (highlight?.step ?? stepIdx) - 1));

    if (!highlight) return null;

    const currentStep = STEPS[highlight.step];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const hlTop = highlight.top - PAD;
    const hlLeft = highlight.left - PAD;
    const hlW = highlight.width + PAD * 2;
    const hlH = highlight.height + PAD * 2;

    const side = pickSide(highlight, vw, vh);
    const pos = tooltipPosition(highlight, side, vw, vh);

    const isFirst = highlight.step === 0;
    const isLast = highlight.step >= STEPS.length - 1;
    const progress = ((highlight.step + 1) / STEPS.length) * 100;

    return (
        <div className="tutorial-overlay" onClick={onClose}>
            {/* Dark overlay with spotlight cutout */}
            <svg className="tutorial-mask">
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect x={hlLeft} y={hlTop} width={hlW} height={hlH} rx="12" fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#spotlight-mask)" />
            </svg>

            {/* Spotlight ring */}
            <div className="tutorial-ring" style={{ top: hlTop, left: hlLeft, width: hlW, height: hlH }} />

            {/* Tooltip card */}
            <div
                className={`tutorial-tooltip tt-side-${pos.arrowDir}`}
                style={{ top: pos.top, left: pos.left, width: TOOLTIP_W }}
                onClick={e => e.stopPropagation()}
            >
                {/* Progress bar */}
                <div className="tt-progress-bar">
                    <div className="tt-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="tt-step">Step {highlight.step + 1} of {STEPS.length}</div>
                <div className="tt-title">{currentStep.title}</div>
                <div className="tt-desc">{currentStep.desc}</div>

                <div className="tt-footer">
                    <button className="tt-skip" onClick={onClose}>Skip</button>
                    <div className="tt-nav">
                        {!isFirst && <button className="tt-prev" onClick={prev}>← Back</button>}
                        <button className="tt-next" onClick={next}>
                            {isLast ? 'Done ✓' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
