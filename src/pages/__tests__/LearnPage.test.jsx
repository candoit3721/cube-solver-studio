import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LearnPage from '../LearnPage.jsx';

describe('LearnPage', () => {
  it('renders all 7 chapter headings', () => {
    render(<MemoryRouter><LearnPage /></MemoryRouter>);
    const h2 = (name) => screen.getByRole('heading', { level: 2, name });
    expect(h2(/white cross/i)).toBeInTheDocument();
    expect(h2(/white corners/i)).toBeInTheDocument();
    expect(h2(/middle layer/i)).toBeInTheDocument();
    expect(h2(/yellow cross/i)).toBeInTheDocument();
    expect(h2(/yellow edge/i)).toBeInTheDocument();
    expect(h2(/yellow corner perm/i)).toBeInTheDocument();
    expect(h2(/yellow corner orient/i)).toBeInTheDocument();
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
