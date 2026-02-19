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
    ['Up face', 'Down face', 'Front face', 'Back face', 'Right face', 'Left face'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
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
