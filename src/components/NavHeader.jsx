/**
 * NavHeader — site-wide sticky navigation.
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/NavHeader.css';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/solve', label: 'Solve' },
  { to: '/learn', label: 'Learn' },
  { to: '/algorithms', label: 'Algorithms' },
];

export default function NavHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-header">
      <NavLink to="/" className="nav-logo" end>
        Rubik's Cube
      </NavLink>

      <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
        {NAV_LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        className="nav-hamburger"
        aria-label="Toggle menu"
        onClick={() => setOpen(o => !o)}
      >
        {open ? '✕' : '☰'}
      </button>
    </header>
  );
}
