import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import SolvePage from './pages/SolvePage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AlgorithmsPage from './pages/AlgorithmsPage.jsx';

// Pages with Three.js require WebGL — mock them here.
// Routing is what's under test, not the page UI.
vi.mock('./pages/Home.jsx', () => ({
  default: () => <div>Home</div>,
}));
vi.mock('./pages/SolvePage.jsx', () => ({
  default: () => <div>Solver</div>,
}));

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
