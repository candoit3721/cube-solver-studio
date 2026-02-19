/**
 * LearnPage — 7-chapter beginner Layer-by-Layer guide.
 */
import { Link } from 'react-router-dom';
import '../styles/LearnPage.css';
import ChapterCube from '../components/ChapterCube.jsx';
import { CHAPTER_STATES } from '../engine/chapterStates.js';

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
  },
  {
    id: 'middle-layer',
    name: 'Middle Layer',
    goal: 'First two layers (F2L) complete',
    why: 'Solve the middle ring of edges. Each edge piece drops in from the top layer using one of two mirror algorithms — choose based on which side the slot is on.',
    hold: 'White face up, solved layers at the bottom.',
    algs: [
      {
        label: '→ Right insert',
        moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
        note: 'Edge goes into the front-right slot.',
        stateIndex: 8,
      },
      {
        label: '← Left insert',
        moves: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"],
        note: 'Edge goes into the front-left slot.',
        stateIndex: 9,
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
  },
  {
    id: 'yellow-edge-perm',
    name: 'Yellow Edge Permutation',
    goal: 'Yellow cross edges match their centers',
    why: 'The yellow cross exists but the side colors may be wrong. Cycle edges around until each edge matches its center color.',
    alg: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
    algNote: 'Applies a 3-cycle of the top edges.',
    hold: 'Yellow face up. Find a solved edge and keep it in the back.',
  },
  {
    id: 'yellow-corner-perm',
    name: 'Yellow Corner Permutation',
    goal: 'All corners in correct positions',
    why: "Move yellow corners to their correct positions (colors may still be twisted). Find a corner that's already correct and use it as an anchor.",
    alg: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
    algNote: '3-corner cycle. Repeat as needed.',
    hold: 'Yellow face up.',
  },
  {
    id: 'yellow-corner-orient',
    name: 'Yellow Corner Orientation',
    goal: 'Cube fully solved',
    why: "The final step! Twist each corner in-place using the trigger until its yellow sticker faces up. Don't panic if the cube looks scrambled mid-algorithm — it resolves.",
    alg: ['R', 'U', "R'", "U'"],
    algNote: 'Repeat per corner, then U to rotate the top layer.',
    hold: 'Yellow face up. Work corner by corner at the front-right position.',
  },
];

function AlgTokens({ moves }) {
  const FACE_COLORS = { U: '#f5f5f5', D: '#f4d03f', F: '#27ae60', B: '#2980b9', R: '#e74c3c', L: '#e67e22' };
  return (
    <div className="alg-tokens">
      {moves.map((m, i) => {
        const face = m[0];
        return (
          <span
            key={i}
            className="alg-token"
            style={{ '--face-color': FACE_COLORS[face] || '#aaa' }}
          >
            {m}
          </span>
        );
      })}
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
              {/* Left: rotatable goal-state cube */}
              <div className="chapter-cube-col">
                <ChapterCube faceMap={CHAPTER_STATES[i]} />
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
                        <ChapterCube faceMap={CHAPTER_STATES[a.stateIndex]} size={160} />
                        <p className="alg-panel-caption">target slot</p>
                        <AlgTokens moves={a.moves} />
                        <div className="alg-note">{a.note}</div>
                      </div>
                    ))}
                  </div>
                ) : ch.alg ? (
                  <div className="chapter-alg">
                    <div className="alg-label">Algorithm</div>
                    <AlgTokens moves={ch.alg} />
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
