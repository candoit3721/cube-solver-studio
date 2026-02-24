/**
 * AlgorithmsPage — notation guide and algorithm method reference.
 * Algorithm data lives in src/data/algorithms.js — add methods there.
 */
import { useState } from 'react';
import '../styles/AlgorithmsPage.css';
import FaceBadge from '../components/FaceBadge.jsx';
import { ALGORITHM_METHODS } from '../data/algorithms.js';

const NOTATION = [
  { letter: 'U', name: 'Up',    desc: 'Top face clockwise 90°' },
  { letter: 'D', name: 'Down',  desc: 'Bottom face clockwise 90°' },
  { letter: 'F', name: 'Front', desc: 'Front face clockwise 90°' },
  { letter: 'B', name: 'Back',  desc: 'Back face clockwise 90°' },
  { letter: 'R', name: 'Right', desc: 'Right face clockwise 90°' },
  { letter: 'L', name: 'Left',  desc: 'Left face clockwise 90°' },
];

const MODIFIERS = [
  { sym: "X'", desc: 'Counter-clockwise (anti-prime)' },
  { sym: 'X2', desc: 'Double turn (180°)' },
];

function AlgTokens({ moves }) {
  if (!moves) return null;
  return (
    <div className="alg-tokens">
      {moves.map((m, i) => (
        <FaceBadge key={i} face={m[0]} suffix={m.slice(1)} />
      ))}
    </div>
  );
}

function MethodSection({ method }) {
  return (
    <section className="alg-section" id={method.id}>
      <h2 className="alg-section-title">{method.name}</h2>
      <p className="alg-section-sub">{method.desc}</p>
      <div className="lbl-grid">
        {method.steps.map(({ step, phase, moves, note, tip }) => (
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
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AlgorithmsPage() {
  const [activeId, setActiveId] = useState(ALGORITHM_METHODS[0].id);
  const activeMethod = ALGORITHM_METHODS.find(m => m.id === activeId);

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
              <FaceBadge face={letter} />
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
            Examples: <code>R</code> = right face clockwise,{' '}
            <code>R'</code> = right face counter-clockwise,{' '}
            <code>R2</code> = right face 180°.
          </p>
        </div>
      </section>

      {/* ── Method tabs ── */}
      <div className="alg-tabs">
        {ALGORITHM_METHODS.map(m => (
          <button
            key={m.id}
            className={`alg-tab ${m.id === activeId ? 'alg-tab--active' : ''}`}
            onClick={() => setActiveId(m.id)}
          >
            <span className="alg-tab-short">{m.shortName}</span>
            <span className="alg-tab-full">{m.name}</span>
          </button>
        ))}
      </div>

      {/* ── Active method ── */}
      {activeMethod && <MethodSection method={activeMethod} />}

    </div>
  );
}
