import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavHeader from '../NavHeader.jsx';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('NavHeader', () => {
  it('renders all five navigation links', () => {
    renderWithRouter(<NavHeader />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solve/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algorithms/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /api/i })).toBeInTheDocument();
  });

  it('renders the logo text', () => {
    renderWithRouter(<NavHeader />);
    expect(screen.getByText(/rubik/i)).toBeInTheDocument();
  });
});
