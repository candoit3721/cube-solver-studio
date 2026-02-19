# Site Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the single-page Rubik's cube tool into a 4-page site (Home, Solver, Learn, Algorithms) using React Router v6 while preserving all existing functionality.

**Architecture:** React Router v6 with a Layout wrapper (NavHeader + `<Outlet>`). Existing `AppInner` becomes the Solver page with zero changes. New pages are static content components. The Home hero uses a standalone `HeroCube` component (calls `createEngine()` directly, no context).

**Tech Stack:** React 19, React Router v6, Vite 7, Vitest + React Testing Library, Three.js (existing)

**Design doc:** `docs/plans/2026-02-19-site-redesign-design.md`

---

## Task 1: Install dependencies + set up Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/test-setup.js`

### Step 1: Install packages

```bash
npm install react-router-dom
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Step 2: Update `vite.config.js` to add test config

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})
```

### Step 3: Create `src/test-setup.js`

```js
import '@testing-library/jest-dom';
```

### Step 4: Add test script to `package.json`

Add to the `"scripts"` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

### Step 5: Verify vitest works

```bash
npm run test:run
```
Expected: "No test files found" (passes with 0 tests — that's fine).

### Step 6: Commit

```bash
git add package.json vite.config.js src/test-setup.js
git commit -m "chore: add react-router-dom and vitest test infrastructure"
```

---

## Task 2: Create NavHeader

**Files:**
- Create: `src/components/NavHeader.jsx`
- Create: `src/styles/NavHeader.css`
- Create: `src/components/__tests__/NavHeader.test.jsx`

### Step 1: Write the failing test

```jsx
// src/components/__tests__/NavHeader.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavHeader from '../NavHeader.jsx';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('NavHeader', () => {
  it('renders all four navigation links', () => {
    renderWithRouter(<NavHeader />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solve/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algorithms/i })).toBeInTheDocument();
  });

  it('renders the logo text', () => {
    renderWithRouter(<NavHeader />);
    expect(screen.getByText(/rubik/i)).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm run test:run
```
Expected: FAIL — "Cannot find module '../NavHeader.jsx'"

### Step 3: Create `src/components/NavHeader.jsx`

```jsx
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
        Rubik's Solver
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
```

### Step 4: Create `src/styles/NavHeader.css`

```css
.nav-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 1.5rem;
  background: #0a0a14;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 2rem;
}

.nav-logo {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
  letter-spacing: 0.02em;
  white-space: nowrap;
  margin-right: auto;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.15s, background 0.15s;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.nav-hamburger {
  display: none;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

@media (max-width: 600px) {
  .nav-hamburger {
    display: block;
  }

  .nav-links {
    display: none;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    flex-direction: column;
    background: #0a0a14;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.5rem 1rem 1rem;
    gap: 0.25rem;
  }

  .nav-links.nav-open {
    display: flex;
  }

  .nav-link {
    padding: 0.6rem 0.8rem;
    font-size: 1rem;
  }
}
```

### Step 5: Run tests to verify they pass

```bash
npm run test:run
```
Expected: PASS — 2 tests pass.

### Step 6: Commit

```bash
git add src/components/NavHeader.jsx src/styles/NavHeader.css src/components/__tests__/NavHeader.test.jsx
git commit -m "feat: add NavHeader with site navigation"
```

---

## Task 3: Set up router and Layout, wire into main.jsx

**Files:**
- Create: `src/router.jsx`
- Create: `src/pages/SolvePage.jsx` (placeholder)
- Create: `src/pages/Home.jsx` (placeholder)
- Create: `src/pages/LearnPage.jsx` (placeholder)
- Create: `src/pages/AlgorithmsPage.jsx` (placeholder)
- Modify: `src/main.jsx`
- Create: `src/router.test.jsx`

### Step 1: Create placeholder pages (needed before router test)

`src/pages/Home.jsx`:
```jsx
export default function Home() {
  return <div>Home</div>;
}
```

`src/pages/SolvePage.jsx`:
```jsx
export default function SolvePage() {
  return <div>Solver</div>;
}
```

`src/pages/LearnPage.jsx`:
```jsx
export default function LearnPage() {
  return <div>Learn</div>;
}
```

`src/pages/AlgorithmsPage.jsx`:
```jsx
export default function AlgorithmsPage() {
  return <div>Algorithms</div>;
}
```

### Step 2: Write the failing router test

```jsx
// src/router.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import SolvePage from './pages/SolvePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AlgorithmsPage from './pages/AlgorithmsPage.jsx';

function AppRoutes({ initialEntry = '/' }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/solve" element={<SolvePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/algorithms" element={<AlgorithmsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('routing', () => {
  it('renders Home at /', () => {
    render(<AppRoutes initialEntry="/" />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders SolvePage at /solve', () => {
    render(<AppRoutes initialEntry="/solve" />);
    expect(screen.getByText('Solver')).toBeInTheDocument();
  });

  it('renders LearnPage at /learn', () => {
    render(<AppRoutes initialEntry="/learn" />);
    expect(screen.getByText('Learn')).toBeInTheDocument();
  });

  it('renders AlgorithmsPage at /algorithms', () => {
    render(<AppRoutes initialEntry="/algorithms" />);
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
  });
});
```

### Step 3: Run test to verify it fails

```bash
npm run test:run
```
Expected: FAIL — modules not found (placeholders not created yet).

### Step 4: Verify placeholders exist, run tests again

```bash
npm run test:run
```
Expected: PASS — 4 routing tests pass.

### Step 5: Create `src/router.jsx`

```jsx
/**
 * AppRouter — React Router v6 setup with Layout wrapper.
 */
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import NavHeader from './components/NavHeader.jsx';
import Home from './pages/Home.jsx';
import SolvePage from './pages/SolvePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AlgorithmsPage from './pages/AlgorithmsPage.jsx';

function Layout() {
  return (
    <>
      <NavHeader />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'solve', element: <SolvePage /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'algorithms', element: <AlgorithmsPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### Step 6: Update `src/main.jsx` to use AppRouter

Current `main.jsx` renders `<App />`. Replace with `<AppRouter />`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './router.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
```

### Step 7: Visual smoke test in browser

```bash
npm run dev
```
Navigate to `http://localhost:5173` — should see "Home" text with NavHeader.
Navigate to `http://localhost:5173/solve` — should see "Solver" text.
Navigate to `http://localhost:5173/learn` — should see "Learn" text.
Navigate to `http://localhost:5173/algorithms` — should see "Algorithms" text.
Nav links should work. Active link should be highlighted.

### Step 8: Commit

```bash
git add src/router.jsx src/pages/ src/main.jsx src/router.test.jsx
git commit -m "feat: add React Router v6 with layout and placeholder pages"
```

---

## Task 4: Wire existing app into SolvePage

The existing `App.jsx` renders `AppInner` (the full solver UI) inside `CubeProvider`. `AppInner` renders `CubeCanvas`, `TopBar`, `BottomBar`, `SidePanel`, and all modals. `TopBar` shows the cube status badge and current move — it's solver-specific and should stay. The `NavHeader` replaces the page-level navigation but `TopBar` remains as an in-solver status bar.

**Files:**
- Modify: `src/App.jsx` — export `AppInner` so SolvePage can use it
- Modify: `src/pages/SolvePage.jsx` — replace placeholder with real solver

### Step 1: Export `AppInner` from `src/App.jsx`

In `src/App.jsx`, change:
```js
function AppInner() {
```
to:
```js
export function AppInner() {
```

(The default `App` export stays unchanged, it's no longer used but don't delete it.)

### Step 2: Update `src/pages/SolvePage.jsx`

```jsx
/**
 * SolvePage — wraps the existing solver app in a route.
 */
import { CubeProvider } from '../hooks/useCubeState.jsx';
import { AppInner } from '../App.jsx';

export default function SolvePage() {
  return (
    <CubeProvider>
      <AppInner />
    </CubeProvider>
  );
}
```

### Step 3: Visual smoke test

```bash
npm run dev
```
Navigate to `http://localhost:5173/solve`.
Expected: Full 3D cube app renders with TopBar, BottomBar, all buttons. NavHeader is visible above. All functionality works (scramble, solve, camera, editor).

### Step 4: Test NavHeader logo no longer says "Rubik's Cube" twice

`TopBar` renders "Rubik's Cube" as its logo. `NavHeader` renders "Rubik's Solver". These are distinct enough. If you want to hide the TopBar logo on the solve page:
- In `src/styles/TopBar.css`, the `.logo` class can optionally be hidden (but leave it for now — assess visually).

### Step 5: Commit

```bash
git add src/App.jsx src/pages/SolvePage.jsx
git commit -m "feat: wire existing solver into SolvePage route"
```

---

## Task 5: Create Home page

**Files:**
- Create: `src/components/HeroCube.jsx` — standalone Three.js cube for hero background
- Modify: `src/pages/Home.jsx` — full landing page
- Create: `src/styles/Home.css`
- Create: `src/pages/__tests__/Home.test.jsx`

### Step 1: Write the failing test

```jsx
// src/pages/__tests__/Home.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home.jsx';

// HeroCube uses Three.js which can't run in jsdom — mock it
vi.mock('../../components/HeroCube.jsx', () => ({
  default: () => <div data-testid="hero-cube" />,
}));

describe('Home', () => {
  it('renders the main headline', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders three CTA links', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /scan.*solve/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algorithm/i })).toBeInTheDocument();
  });

  it('renders three feature cards', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm run test:run
```
Expected: FAIL — modules not found.

### Step 3: Create `src/components/HeroCube.jsx`

This is a standalone Three.js cube that doesn't need `CubeProvider`. It calls `createEngine()` directly with a scrambled face map.

```jsx
/**
 * HeroCube — read-only Three.js cube for the Home page hero.
 * Does not use CubeProvider — creates its own engine instance.
 */
import { useRef, useEffect } from 'react';
import { createEngine } from '../engine/cubeEngine.js';
import { FACES } from '../engine/constants.js';

// Pre-baked scrambled face map for the hero display
const SCRAMBLED_FACE_MAP = {
  U: ['U','R','U','F','U','B','U','L','U'],
  D: ['D','L','D','R','D','F','D','B','D'],
  F: ['F','U','F','D','F','L','F','R','F'],
  B: ['B','D','B','U','B','R','B','L','B'],
  R: ['R','F','R','B','R','U','R','D','R'],
  L: ['L','B','L','F','L','D','L','U','L'],
};

export default function HeroCube() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = createEngine(containerRef.current);
    engine.createCube(SCRAMBLED_FACE_MAP);

    let animId;
    function loop() {
      animId = requestAnimationFrame(loop);
      engine.render();
    }
    loop();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  return <div ref={containerRef} className="hero-cube-container" />;
}
```

### Step 4: Create `src/pages/Home.jsx`

```jsx
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
```

### Step 5: Create `src/styles/Home.css`

```css
.home {
  min-height: 100vh;
}

/* ── Hero ── */
.hero {
  position: relative;
  height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-cube-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 20, 0.55) 0%,
    rgba(10, 10, 20, 0.75) 100%
  );
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 2rem;
  max-width: 640px;
}

.hero-headline {
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: #fff;
}

.hero-sub {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 2rem;
}

.hero-ctas {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-primary {
  padding: 0.7rem 1.6rem;
  background: #fff;
  color: #0a0a14;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: opacity 0.15s;
}

.cta-primary:hover { opacity: 0.88; }

.cta-secondary {
  padding: 0.7rem 1.6rem;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: background 0.15s;
}

.cta-secondary:hover { background: rgba(255, 255, 255, 0.2); }

/* ── Feature strip ── */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 4rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-icon { font-size: 2rem; }

.feature-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.feature-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  flex: 1;
  margin: 0;
}

.feature-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: auto;
}

.feature-link:hover { color: #fff; }

/* ── How it works ── */
.how-it-works {
  padding: 4rem 2rem;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.hiw-heading {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 2.5rem;
  color: #fff;
}

.hiw-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.hiw-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.hiw-number {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
}

.hiw-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.hiw-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
}
```

### Step 6: Run tests

```bash
npm run test:run
```
Expected: Home tests PASS (HeroCube is mocked, no Three.js in tests).

### Step 7: Visual smoke test

```bash
npm run dev
```
Navigate to `http://localhost:5173`. Verify:
- Hero section fills viewport with scrambled 3D cube background
- Headline, subtext, 3 CTA buttons visible
- Feature cards render in a grid
- "How it works" section renders
- All links navigate correctly

### Step 8: Commit

```bash
git add src/components/HeroCube.jsx src/pages/Home.jsx src/styles/Home.css src/pages/__tests__/Home.test.jsx
git commit -m "feat: add Home landing page with hero, features, and how-it-works"
```

---

## Task 6: Create LearnPage

**Files:**
- Modify: `src/pages/LearnPage.jsx` — replace placeholder
- Create: `src/styles/LearnPage.css`
- Create: `src/pages/__tests__/LearnPage.test.jsx`

### Background: Phase content

The `PHASE_INFO` object in `src/components/SidePanel.jsx` already contains `why`, `goal`, and `alg` for all 7 phases. The LearnPage will replicate and expand this content inline (copying it is fine — no need to extract to a shared file, since the learn page will eventually have richer content than the side panel).

### Step 1: Write the failing test

```jsx
// src/pages/__tests__/LearnPage.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LearnPage from '../LearnPage.jsx';

describe('LearnPage', () => {
  it('renders all 7 chapter headings', () => {
    render(<MemoryRouter><LearnPage /></MemoryRouter>);
    expect(screen.getByText(/white cross/i)).toBeInTheDocument();
    expect(screen.getByText(/white corners/i)).toBeInTheDocument();
    expect(screen.getByText(/middle layer/i)).toBeInTheDocument();
    expect(screen.getByText(/yellow cross/i)).toBeInTheDocument();
    expect(screen.getByText(/yellow edge/i)).toBeInTheDocument();
    expect(screen.getByText(/yellow corner perm/i)).toBeInTheDocument();
    expect(screen.getByText(/yellow corner orient/i)).toBeInTheDocument();
  });

  it('renders a Practice in Solver link for each chapter', () => {
    render(<MemoryRouter><LearnPage /></MemoryRouter>);
    const practiceLinks = screen.getAllByRole('link', { name: /practice.*solver/i });
    expect(practiceLinks).toHaveLength(7);
    practiceLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/solve');
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm run test:run
```
Expected: FAIL — "Learn" placeholder doesn't have any chapters.

### Step 3: Create `src/pages/LearnPage.jsx`

```jsx
/**
 * LearnPage — 7-chapter beginner Layer-by-Layer guide.
 */
import { Link } from 'react-router-dom';
import '../styles/LearnPage.css';

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
    alg: ["R'", 'D\'', 'R', 'D'],
    algNote: 'Repeat the trigger until the corner is oriented correctly.',
    hold: 'White face up.',
  },
  {
    id: 'middle-layer',
    name: 'Middle Layer',
    goal: 'First two layers (F2L) complete',
    why: 'Now solve the middle ring of edges. Each edge is inserted from the bottom layer using one of two mirror algorithms depending on which side it needs to go.',
    alg: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
    algNote: 'Right insert (use mirror for left): U R U\' R\' U\' F\' U F',
    hold: 'White face up, solved layers at the bottom.',
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
    goal: "Yellow cross edges match their centers",
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

            <p className="chapter-why">{ch.why}</p>

            <div className="chapter-hold">
              <span className="hold-label">Hold the cube:</span> {ch.hold}
            </div>

            {ch.alg ? (
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
          </section>
        ))}
      </main>
    </div>
  );
}
```

### Step 4: Create `src/styles/LearnPage.css`

```css
.learn-page {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: calc(100vh - 56px);
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Sidebar ── */
.learn-sidebar {
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 2rem 1rem 2rem 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
}

.learn-sidebar-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.75rem;
}

.learn-sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.15s, background 0.15s;
  margin-bottom: 0.15rem;
}

.learn-sidebar-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.learn-sidebar-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Content ── */
.learn-content {
  padding: 2.5rem 3rem;
}

.learn-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.learn-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.75rem;
}

.learn-header p {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
}

/* ── Chapter ── */
.learn-chapter {
  padding: 2.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.learn-chapter:last-child {
  border-bottom: none;
}

.chapter-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.4rem;
}

.chapter-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.5rem;
}

.chapter-goal {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1.25rem;
  font-style: italic;
}

.chapter-why {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
  margin: 0 0 1.25rem;
  max-width: 640px;
}

.chapter-hold {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1.25rem;
}

.hold-label {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

/* ── Algorithm ── */
.chapter-alg {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.alg-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.75rem;
}

.alg-tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.alg-token {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.07);
  border-left: 3px solid var(--face-color, #888);
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
}

.alg-note {
  font-size: 0.825rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

/* ── Practice link ── */
.chapter-practice-link {
  display: inline-block;
  padding: 0.5rem 1.1rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}

.chapter-practice-link:hover {
  background: rgba(255, 255, 255, 0.13);
  color: #fff;
}

/* ── Mobile ── */
@media (max-width: 700px) {
  .learn-page {
    grid-template-columns: 1fr;
  }

  .learn-sidebar {
    position: static;
    height: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 1rem 1rem 0.5rem;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .learn-sidebar-title {
    width: 100%;
    margin-bottom: 0.4rem;
  }

  .learn-sidebar-link {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  .learn-content {
    padding: 1.5rem 1.25rem;
  }
}
```

### Step 5: Run tests

```bash
npm run test:run
```
Expected: PASS — all LearnPage tests pass.

### Step 6: Visual smoke test

```bash
npm run dev
```
Navigate to `http://localhost:5173/learn`. Verify:
- Sidebar with 7 numbered chapters (sticky on desktop)
- Each chapter renders with name, goal, why, algorithm tokens (color-coded), "Practice in Solver →" link
- Algorithm tokens have left-border color matching the face (white/yellow/green etc.)
- Mobile: sidebar becomes a horizontal wrap

### Step 7: Commit

```bash
git add src/pages/LearnPage.jsx src/styles/LearnPage.css src/pages/__tests__/LearnPage.test.jsx
git commit -m "feat: add LearnPage with 7-chapter beginner LBL guide"
```

---

## Task 7: Create AlgorithmsPage

**Files:**
- Modify: `src/pages/AlgorithmsPage.jsx` — replace placeholder
- Create: `src/styles/AlgorithmsPage.css`
- Create: `src/pages/__tests__/AlgorithmsPage.test.jsx`

### Step 1: Write the failing test

```jsx
// src/pages/__tests__/AlgorithmsPage.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AlgorithmsPage from '../AlgorithmsPage.jsx';

describe('AlgorithmsPage', () => {
  it('renders the notation section heading', () => {
    render(<MemoryRouter><AlgorithmsPage /></MemoryRouter>);
    expect(screen.getByText(/notation guide/i)).toBeInTheDocument();
  });

  it('renders all 6 face names in the notation table', () => {
    render(<MemoryRouter><AlgorithmsPage /></MemoryRouter>);
    ['Up', 'Down', 'Front', 'Back', 'Right', 'Left'].forEach(name => {
      expect(screen.getByText(new RegExp(name, 'i'))).toBeInTheDocument();
    });
  });

  it('renders the LBL algorithms section', () => {
    render(<MemoryRouter><AlgorithmsPage /></MemoryRouter>);
    expect(screen.getByText(/LBL algorithm reference/i)).toBeInTheDocument();
  });

  it('renders all 7 algorithm phase names', () => {
    render(<MemoryRouter><AlgorithmsPage /></MemoryRouter>);
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm run test:run
```
Expected: FAIL — placeholder doesn't have required content.

### Step 3: Create `src/pages/AlgorithmsPage.jsx`

```jsx
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
    tip: 'Mirror: U\' L\' U L U F U\' F\' for left insert.',
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
    tip: 'Apply the algorithm from the correct corner\'s position, repeat as needed.',
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
```

### Step 4: Create `src/styles/AlgorithmsPage.css`

```css
.algorithms-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
}

.alg-page-title {
  font-size: 1.9rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.75rem;
}

.alg-page-sub,
.alg-section-sub {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0 0 2rem;
  max-width: 600px;
}

.alg-section {
  margin-bottom: 4rem;
}

.alg-section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.75rem;
}

/* ── Notation grid ── */
.notation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.notation-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.notation-badge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  color: #111;
  flex-shrink: 0;
}

.notation-name {
  font-weight: 700;
  color: #fff;
  font-size: 0.9rem;
}

.notation-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.15rem;
}

/* ── Modifiers ── */
.modifier-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.75rem;
}

.modifier-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.modifier-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
}

.modifier-sym {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: rgba(255,255,255,0.08);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.modifier-desc {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.65);
}

.modifier-example {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

.modifier-example code {
  background: rgba(255,255,255,0.08);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* ── LBL grid ── */
.lbl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.lbl-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.lbl-step-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
}

.lbl-phase-name {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.alg-tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.alg-token {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  background: rgba(255,255,255,0.06);
  border-left: 3px solid var(--face-color, #888);
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #fff;
}

.lbl-intuitive {
  font-size: 0.85rem;
  font-style: italic;
  color: rgba(255,255,255,0.4);
}

.lbl-note {
  font-size: 0.825rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.5;
  margin: 0;
}

.lbl-tip {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.45);
  line-height: 1.5;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.tip-label {
  font-weight: 700;
  color: rgba(255,255,255,0.6);
}

.lbl-try-link {
  display: inline-block;
  margin-top: auto;
  padding-top: 0.25rem;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 0.825rem;
  font-weight: 600;
  transition: color 0.15s;
}

.lbl-try-link:hover { color: #fff; }

@media (max-width: 500px) {
  .algorithms-page { padding: 1.5rem 1rem 3rem; }
}
```

### Step 5: Run all tests

```bash
npm run test:run
```
Expected: All tests PASS.

### Step 6: Visual smoke test

```bash
npm run dev
```
Navigate to `http://localhost:5173/algorithms`. Verify:
- Notation grid shows all 6 face cards with colored badges
- Suffixes section shows `'` and `2` modifiers
- LBL grid shows 7 algorithm cards with color-coded tokens
- "Try it in Solver →" links navigate to `/solve`

### Step 7: Final full-site smoke test

Navigate through all 4 pages, verify:
- NavHeader active link highlights correctly on each page
- Home → Solve → Learn → Algorithms all work
- `/solve` loads the full 3D cube app
- All existing solver features work (scramble, camera, editor, solve, step playback)
- Mobile: hamburger menu works on all pages, Learn sidebar becomes horizontal

### Step 8: Commit

```bash
git add src/pages/AlgorithmsPage.jsx src/styles/AlgorithmsPage.css src/pages/__tests__/AlgorithmsPage.test.jsx
git commit -m "feat: add AlgorithmsPage with notation guide and LBL reference"
```

---

## Summary

| Task | What it builds | New files |
|------|---------------|-----------|
| 1 | Test infra + router dep | `test-setup.js`, config updates |
| 2 | NavHeader | `NavHeader.jsx`, `NavHeader.css`, test |
| 3 | Router + Layout + placeholders | `router.jsx`, 4 page stubs, `main.jsx` update |
| 4 | SolvePage (existing app) | `SolvePage.jsx`, `App.jsx` export |
| 5 | Home landing page | `Home.jsx`, `HeroCube.jsx`, `Home.css`, test |
| 6 | LearnPage (7 LBL chapters) | `LearnPage.jsx`, `LearnPage.css`, test |
| 7 | AlgorithmsPage (notation + algs) | `AlgorithmsPage.jsx`, `AlgorithmsPage.css`, test |

Total new files: ~16 files. Zero changes to any existing engine, solver, scanner, or modal code.
