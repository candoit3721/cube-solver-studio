/**
 * LearnPage — 7-chapter beginner Layer-by-Layer guide.
 */
import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LearnPage.css';
import ChapterCube from '../components/ChapterCube.jsx';
import AlgTooltipCube from '../components/AlgTooltipCube.jsx';
import { CHAPTER_STATES } from '../engine/chapterStates.js';
import { faceMapToState, stateToFaceMap, applyMove } from '../engine/cubeState.js';

const CHAPTERS = [
  {
    id: 'white-cross',
    name: 'White Cross',
    goal: 'White edges aligned with their center colors',
    why: "The cross is the foundation — every layer-by-layer solve starts here. You're building a \"+\" shape on the white face while ensuring each edge's side color matches its center.",
    alg: null,
    algNote: 'Intuitive — no fixed algorithm. Move edges into place one by one.',
    hold: 'White face up.',
  },
  {
    id: 'white-corners',
    name: 'White Corners',
    goal: 'First layer fully solved',
    why: "With the cross done, slot each corner into position using a simple \"insert\" trigger. Repeat the trigger until the corner drops in correctly.",
    alg: ["R'", "D'", 'R', 'D'],
    algNote: 'Repeat the trigger until the corner is oriented correctly.',
    hold: 'White face up.',
    startFaceMap: CHAPTER_STATES[0],
  },
  {
    id: 'middle-layer',
    name: 'Middle Layer',
    goal: 'First two layers (F2L) complete',
    why: 'Flip the cube so yellow is on top (white solved layer at the bottom). Solve the 4 middle-layer edges one at a time — bring each edge into the top (yellow) layer, then rotate the top layer until the edge\'s front sticker matches the front centre. The sticker on the yellow face tells you which algorithm to use: red goes right, orange goes left.',
    hold: 'Yellow face up, white layer solved at bottom.',
    algs: [
      {
        label: '→ Right insert',
        moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
        note: 'Top sticker is red → belongs on the right face → front-right slot.',
        stateIndex: 7,
        startFaceMap: CHAPTER_STATES[7],
        // Camera angled to show front + right + top faces clearly
        cameraPosition: [5.5, 4.2, 5.5],
        // Red arrow from the edge piece in the U layer down-right into the FR slot
        arrows: [
          { origin: [0.3, 1.5, 1.8], dir: [1, -1, 0], length: 2.1,
            color: 0xe74c3c, headLength: 0.55, headWidth: 0.32 },
        ],
      },
      {
        label: '← Left insert',
        moves: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"],
        note: 'Top sticker is orange → belongs on the left face → front-left slot.',
        stateIndex: 8,
        startFaceMap: CHAPTER_STATES[8],
        // Camera mirrored to show front + left + top faces clearly
        cameraPosition: [-5.5, 4.2, 5.5],
        // Orange arrow from the edge piece in the U layer down-left into the FL slot
        arrows: [
          { origin: [-0.3, 1.5, 1.8], dir: [-1, -1, 0], length: 2.1,
            color: 0xe67e22, headLength: 0.55, headWidth: 0.32 },
        ],
      },
    ],
  },
  {
    id: 'yellow-cross',
    name: 'Yellow Cross',
    goal: 'Yellow cross on top face',
    why: "Flip the cube so yellow is on top. Orient yellow edges to form a cross. You may start with a dot, an \"L\", or a line shape — the algorithm cycles through these states.",
    alg: ['F', 'R', 'U', "R'", "U'", "F'"],
    algNote: 'Apply 1–3 times depending on starting shape.',
    hold: 'Yellow face up.',
    startFaceMap: CHAPTER_STATES[2],
  },
  {
    id: 'yellow-edge-perm',
    name: 'Yellow Edge Permutation',
    goal: 'Yellow cross edges match their centers',
    why: 'The yellow cross exists but the side colors may be wrong. Cycle edges around until each edge matches its center color.',
    alg: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
    algNote: 'Applies a 3-cycle of the top edges.',
    hold: 'Yellow face up. Find a solved edge and keep it in the back.',
    startFaceMap: CHAPTER_STATES[3],
  },
  {
    id: 'yellow-corner-perm',
    name: 'Yellow Corner Permutation',
    goal: 'All corners in correct positions',
    why: "Move yellow corners to their correct positions (colors may still be twisted). Find a corner that's already correct and use it as an anchor.",
    alg: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
    algNote: '3-corner cycle. Repeat as needed.',
    hold: 'Yellow face up.',
    startFaceMap: CHAPTER_STATES[4],
  },
  {
    id: 'yellow-corner-orient',
    name: 'Yellow Corner Orientation',
    goal: 'Cube fully solved',
    why: "The final step! Move each incorrect corner to the front-right-top position. Apply the trigger 2× if yellow faces right, or 4× if yellow faces front. The bottom layers will look scrambled while you work — that's normal, everything resolves when all corners are done.",
    alg: ["R'", "D'", 'R', 'D'],
    algNote: "Apply 2× (yellow sticker faces right) or 4× (yellow sticker faces front) per corner. Then use U or U' — not a whole-cube rotation — to bring the next incorrect corner to the front-right-top position. Repeat until all yellow stickers face up.",
    hold: 'Yellow face up. Work corner by corner at the front-right position.',
    startFaceMap: CHAPTER_STATES[5],
  },
];

function AlgTokens({ moves, startFaceMap }) {
  const FACE_COLORS = { U: '#f5f5f5', D: '#f4d03f', F: '#27ae60', B: '#2980b9', R: '#e74c3c', L: '#e67e22' };
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipLeft, setTooltipLeft] = useState(0);
  const containerRef = useRef(null);

  // Precompute the cube state after each move in the sequence
  const intermediateStates = useMemo(() => {
    if (!startFaceMap) return null;
    const start = faceMapToState(startFaceMap);
    const states = [];
    let current = start;
    for (const move of moves) {
      current = applyMove(current, move);
      states.push(stateToFaceMap(current));
    }
    return states;
  }, [startFaceMap, moves]);

  return (
    <div ref={containerRef} className="alg-tokens">
      {moves.map((m, i) => (
        <span
          key={i}
          className={`alg-token${intermediateStates ? ' alg-token--hoverable' : ''}`}
          style={{ '--face-color': FACE_COLORS[m[0]] || '#aaa' }}
          onMouseEnter={(e) => {
            if (!intermediateStates) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltipLeft(rect.left - containerRect.left + rect.width / 2);
            setHoveredIdx(i);
          }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {m}
        </span>
      ))}

      {/* Single persistent tooltip cube — always mounted so the engine isn't recreated on each hover */}
      {intermediateStates && (
        <div
          className={`alg-token-tooltip${hoveredIdx !== null ? ' alg-token-tooltip--visible' : ''}`}
          style={{ left: tooltipLeft }}
        >
          <AlgTooltipCube
            faceMap={hoveredIdx !== null ? intermediateStates[hoveredIdx] : intermediateStates[0]}
            size={140}
          />
          <p className="alg-token-tooltip-label">
            {hoveredIdx !== null ? moves.slice(0, hoveredIdx + 1).join(' ') : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <div className="learn-page">
      {/* Sidebar */}
      <nav className="learn-sidebar">
        <div className="learn-sidebar-title">Chapters</div>
        {CHAPTERS.map((ch, i) => (
          <a key={ch.id} href={`#${ch.id}`} className="learn-sidebar-link">
            <span className="learn-sidebar-num">{i + 1}</span>
            {ch.name}
          </a>
        ))}
      </nav>

      {/* Content */}
      <main className="learn-content">
        <header className="learn-header">
          <h1>Beginner's Guide: Layer by Layer</h1>
          <p>The most popular method to solve a Rubik's Cube — 7 steps, no memorisation required beyond a few simple algorithms.</p>
        </header>

        {CHAPTERS.map((ch, i) => (
          <section key={ch.id} id={ch.id} className="learn-chapter">
            <div className="chapter-label">Step {i + 1}</div>
            <h2 className="chapter-name">{ch.name}</h2>
            <div className="chapter-goal">Goal: {ch.goal}</div>

            <div className="chapter-body">
              {/* Left: rotatable goal-state cube (auto-rotates to show full cube) */}
              <div className="chapter-cube-col">
                <ChapterCube faceMap={CHAPTER_STATES[i]} autoRotate={true} />
                <p className="chapter-cube-caption">Goal state</p>
              </div>

              {/* Right: explanation + algorithm + practice link */}
              <div className="chapter-text-col">
                <p className="chapter-why">{ch.why}</p>

                <div className="chapter-hold">
                  <span className="hold-label">Hold the cube:</span> {ch.hold}
                </div>

                {ch.algs ? (
                  <div className="chapter-algs-duo">
                    {ch.algs.map((a, ai) => (
                      <div key={ai} className="chapter-alg-panel">
                        <div className="alg-panel-direction">{a.label}</div>
                        <ChapterCube faceMap={CHAPTER_STATES[a.stateIndex]} size={160} cameraPosition={a.cameraPosition} />
                        <p className="alg-panel-caption">edge ready in top layer</p>
                        <AlgTokens moves={a.moves} startFaceMap={a.startFaceMap} />
                        <div className="alg-note">{a.note}</div>
                      </div>
                    ))}
                  </div>
                ) : ch.alg ? (
                  <div className="chapter-alg">
                    <div className="alg-label">Algorithm</div>
                    <AlgTokens moves={ch.alg} startFaceMap={ch.startFaceMap} />
                    <div className="alg-note">{ch.algNote}</div>
                  </div>
                ) : (
                  <div className="chapter-alg">
                    <div className="alg-note">{ch.algNote}</div>
                  </div>
                )}

                <Link to="/solve" className="chapter-practice-link">
                  Practice in Solver →
                </Link>
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
