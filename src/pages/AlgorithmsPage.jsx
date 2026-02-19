/**
 * AlgorithmsPage — notation guide and LBL algorithm reference.
 */
import { Link } from 'react-router-dom';
import '../styles/AlgorithmsPage.css';

const FACE_COLORS = {
  U: '#f5f5f5', D: '#f4d03f', F: '#27ae60',
  B: '#2980b9', R: '#e74c3c', L: '#e67e22',
};

const NOTATION = [
  { letter: 'U', name: 'Up',    desc: 'Top face clockwise 90°' },
  { letter: 'D', name: 'Down',  desc: 'Bottom face clockwise 90°' },
  { letter: 'F', name: 'Front', desc: 'Front face clockwise 90°' },
  { letter: 'B', name: 'Back',  desc: 'Back face clockwise 90°' },
  { letter: 'R', name: 'Right', desc: 'Right face clockwise 90°' },
  { letter: 'L', name: 'Left',  desc: 'Left face clockwise 90°' },
];

const MODIFIERS = [
  { sym: "X'",  desc: "Counter-clockwise (anti-prime)" },
  { sym: 'X2',  desc: 'Double turn (180°)' },
];

const LBL_ALGS = [
  {
    phase: 'White Cross',
    step: 1,
    moves: null,
    note: 'Intuitive — no fixed algorithm. Move white edges into position one by one.',
    tip: 'Work from the top down. Rotate U to line up each edge with its center, then bring it home.',
  },
  {
    phase: 'White Corners',
    step: 2,
    moves: ["R'", "D'", 'R', 'D'],
    note: 'Repeat until the corner drops in with white on top.',
    tip: "If the corner is in the top layer, first kick it out by doing the trigger once.",
  },
  {
    phase: 'Middle Layer — Right Insert',
    step: 3,
    moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
    note: 'When the edge needs to go right.',
    tip: "Mirror: U' L' U L U F U' F' for left insert.",
  },
  {
    phase: 'Yellow Cross',
    step: 4,
    moves: ['F', 'R', 'U', "R'", "U'", "F'"],
    note: 'Apply 1–3 times. Start recognising dot / L-shape / line patterns.',
    tip: 'Dot → apply 3×. L-shape → align it top-left, apply 2×. Line → align horizontal, apply 1×.',
  },
  {
    phase: 'Yellow Edge Permutation',
    step: 5,
    moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
    note: 'Cycles three top edges counter-clockwise. Find a solved edge and put it in the back.',
    tip: 'If no edge is solved, apply once, then re-check.',
  },
  {
    phase: 'Yellow Corner Permutation',
    step: 6,
    moves: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
    note: 'Cycles three corners. Find a correct corner and keep it in the front-left.',
    tip: "Apply the algorithm from the correct corner's position, repeat as needed.",
  },
  {
    phase: 'Yellow Corner Orientation',
    step: 7,
    moves: ['R', 'U', "R'", "U'"],
    note: 'Twist corners in the front-right position. Then U to move to next corner.',
    tip: 'Never rotate the top layer while doing this — only after each corner is solved.',
  },
];

function AlgTokens({ moves }) {
  if (!moves) return null;
  return (
    <div className="alg-tokens">
      {moves.map((m, i) => (
        <span
          key={i}
          className="alg-token"
          style={{ '--face-color': FACE_COLORS[m[0]] || '#888' }}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

export default function AlgorithmsPage() {
  return (
    <div className="algorithms-page">

      {/* ── Notation Guide ── */}
      <section className="alg-section">
        <h1 className="alg-page-title">Notation Guide</h1>
        <p className="alg-page-sub">
          Every Rubik's Cube algorithm uses a standard notation. Each letter represents a face,
          and a suffix modifies the direction or amount of the turn.
        </p>

        <div className="notation-grid">
          {NOTATION.map(({ letter, name, desc }) => (
            <div key={letter} className="notation-card">
              <div
                className="notation-badge"
                style={{ background: FACE_COLORS[letter] }}
              >
                {letter}
              </div>
              <div className="notation-info">
                <div className="notation-name">{name} face</div>
                <div className="notation-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="modifier-section">
          <h2 className="modifier-heading">Suffixes</h2>
          <div className="modifier-grid">
            {MODIFIERS.map(({ sym, desc }) => (
              <div key={sym} className="modifier-card">
                <code className="modifier-sym">{sym}</code>
                <span className="modifier-desc">{desc}</span>
              </div>
            ))}
          </div>
          <p className="modifier-example">
            Examples: <code>R</code> = right face clockwise, <code>R'</code> = right face counter-clockwise, <code>R2</code> = right face 180°.
          </p>
        </div>
      </section>

      {/* ── LBL Algorithm Reference ── */}
      <section className="alg-section">
        <h2 className="alg-section-title">LBL Algorithm Reference</h2>
        <p className="alg-section-sub">
          The complete set of algorithms for the Layer-by-Layer beginner method.
          Hold: white on top for steps 1–3, yellow on top for steps 4–7.
        </p>

        <div className="lbl-grid">
          {LBL_ALGS.map(({ phase, step, moves, note, tip }) => (
            <article key={phase} className="lbl-card">
              <div className="lbl-step-label">Step {step}</div>
              <h3 className="lbl-phase-name">{phase}</h3>
              {moves ? <AlgTokens moves={moves} /> : (
                <div className="lbl-intuitive">Intuitive</div>
              )}
              <p className="lbl-note">{note}</p>
              <div className="lbl-tip">
                <span className="tip-label">Tip:</span> {tip}
              </div>
              <Link to="/solve" className="lbl-try-link">Try it in Solver →</Link>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
