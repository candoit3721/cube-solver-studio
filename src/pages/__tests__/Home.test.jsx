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
    expect(screen.getByRole('link', { name: /learn the method/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algorithm reference/i })).toBeInTheDocument();
  });

  it('renders three feature cards', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
  });
});
