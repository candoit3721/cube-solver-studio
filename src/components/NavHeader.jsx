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
  { to: '/api-explorer', label: 'API' },
];

export default function NavHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-header">
      <NavLink to="/" className="nav-logo" end>
        <span className="nav-logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="88 58 340 358" width="26" height="26">
            <polygon points="256,70 416,160 256,250 96,160"  fill="#1a1a2e" stroke="#1a1a2e" strokeWidth="6" strokeLinejoin="round"/>
            <polygon points="96,160 256,250 256,410 96,320"  fill="#1a1a2e" stroke="#1a1a2e" strokeWidth="6" strokeLinejoin="round"/>
            <polygon points="416,160 256,250 256,410 416,320" fill="#1a1a2e" stroke="#1a1a2e" strokeWidth="6" strokeLinejoin="round"/>
            <polygon points="256,76 299,100 256,124 213,100"   fill="#FF1F1F" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="309,106 352,130 309,154 266,130"  fill="#00C830" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="362,136 405,160 362,184 319,160"  fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="203,106 246,130 203,154 160,130"  fill="#FF5500" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="256,136 299,160 256,184 213,160"  fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="309,166 352,190 309,214 266,190"  fill="#FF5500" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="150,136 193,160 150,184 107,160"  fill="#FFE000" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="203,166 246,190 203,214 160,190"  fill="#00C830" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="256,196 299,220 256,244 213,220"  fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="410,168 367,193 367,237 410,212"  fill="#1565FF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="357,198 314,223 314,267 357,242"  fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="304,228 261,253 261,297 304,272"  fill="#FF1F1F" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="410,221 367,246 367,290 410,265"  fill="#FFE000" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="357,251 314,276 314,320 357,295"  fill="#FF1F1F" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="304,281 261,306 261,350 304,325"  fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="410,274 367,299 367,343 410,318"  fill="#00C830" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="357,304 314,329 314,373 357,348"  fill="#FFFFFF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="304,334 261,359 261,403 304,378"  fill="#FFE000" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="416,160 256,250 256,410 416,320"  fill="black" opacity="0.15"/>
            <polygon points="102,168 145,193 145,237 102,212"  fill="#FFE000" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="155,198 198,223 198,267 155,242"  fill="#00C830" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="208,228 251,253 251,297 208,272"  fill="#1565FF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="102,221 145,246 145,290 102,265"  fill="#00C830" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="155,251 198,276 198,320 155,295"  fill="#FF5500" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="208,281 251,306 251,350 208,325"  fill="#00C830" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="102,274 145,299 145,343 102,318"  fill="#1565FF" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="155,304 198,329 198,373 155,348"  fill="#FFE000" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="208,334 251,359 251,403 208,378"  fill="#FF5500" stroke="#1a1a2e" strokeWidth="4" strokeLinejoin="round"/>
            <polygon points="96,160 256,250 256,410 96,320"    fill="black" opacity="0.32"/>
          </svg>
        </span>
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
