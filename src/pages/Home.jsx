/**
 * Home — landing page with hero, feature strip, and how-it-works.
 */
import { Link } from 'react-router-dom';
import HeroCube from '../components/HeroCube.jsx';
import '../styles/Home.css';

const FEATURES = [
  {
    title: 'Solver',
    icon: '🎯',
    desc: 'Point your camera or paint the stickers. Get an optimal or beginner solution in seconds.',
    link: '/solve',
    cta: 'Open Solver',
  },
  {
    title: 'Learn',
    icon: '📖',
    desc: 'Master the Layer-by-Layer method with 7 guided steps and algorithm explanations.',
    link: '/learn',
    cta: 'Start Learning',
  },
  {
    title: 'Algorithms',
    icon: '📋',
    desc: 'Every move explained. The notation guide and all key LBL algorithms in one place.',
    link: '/algorithms',
    cta: 'View Reference',
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Enter your cube', desc: 'Scan with your camera or paint the stickers manually.' },
  { step: 2, title: 'Choose a method', desc: 'Optimal (shortest path) or Beginner (layer-by-layer).' },
  { step: 3, title: 'Follow the solution', desc: 'Step through the animated solution at your own pace.' },
];

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <HeroCube />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-headline">Solve any Rubik's Cube — step by step.</h1>
          <p className="hero-sub">Scan your cube, get a solution, and learn the method.</p>
          <div className="hero-ctas">
            <Link to="/solve" className="cta-primary">Scan &amp; Solve</Link>
            <Link to="/learn" className="cta-secondary">Learn the Method</Link>
            <Link to="/algorithms" className="cta-secondary">Algorithm Reference</Link>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="features">
        {FEATURES.map(({ title, icon, desc, link, cta }) => (
          <article key={title} className="feature-card">
            <div className="feature-icon">{icon}</div>
            <h2 className="feature-title">{title}</h2>
            <p className="feature-desc">{desc}</p>
            <Link to={link} className="feature-link">{cta} →</Link>
          </article>
        ))}
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <h2 className="hiw-heading">How it works</h2>
        <div className="hiw-steps">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div key={step} className="hiw-step">
              <div className="hiw-number">{step}</div>
              <h3 className="hiw-title">{title}</h3>
              <p className="hiw-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
