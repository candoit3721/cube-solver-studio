import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ApiExplorerPage from '../ApiExplorerPage.jsx';

vi.mock('../../api/cubeApi.js', () => ({
  validateCube: vi.fn().mockResolvedValue({ valid: true, isSolved: false, facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }),
  solveCube: vi.fn().mockResolvedValue({ solved: true, moves: ["U", "R"], moveCount: 2, movesString: "U R", method: 'kociemba' }),
}));

function renderPage() {
  return render(<MemoryRouter><ApiExplorerPage /></MemoryRouter>);
}

describe('ApiExplorerPage', () => {
  it('renders both endpoint panels', () => {
    renderPage();
    expect(screen.getByText('/api/validate')).toBeInTheDocument();
    expect(screen.getByText('/api/solve')).toBeInTheDocument();
  });

  it('renders example picker pills for validate panel', () => {
    renderPage();
    const pills = screen.getAllByRole('button', { name: /facelet string/i });
    expect(pills.length).toBeGreaterThanOrEqual(1);
  });

  it('pre-fills textarea with first example on load', () => {
    renderPage();
    const textareas = screen.getAllByRole('textbox');
    expect(textareas[0].value).toContain('"cube"');
  });

  it('sends validate request and shows response', async () => {
    const user = userEvent.setup();
    renderPage();
    const sendButtons = screen.getAllByRole('button', { name: /send/i });
    await user.click(sendButtons[0]);
    expect(await screen.findByText(/"valid"/)).toBeInTheDocument();
  });

  it('sends solve request and shows response', async () => {
    const user = userEvent.setup();
    renderPage();
    const sendButtons = screen.getAllByRole('button', { name: /send/i });
    await user.click(sendButtons[1]);
    expect(await screen.findByText(/"solved"/)).toBeInTheDocument();
  });

  it('shows error message on bad JSON in textarea', async () => {
    const user = userEvent.setup();
    renderPage();
    const textareas = screen.getAllByRole('textbox');
    await user.clear(textareas[0]);
    await user.type(textareas[0], 'not json');
    const sendButtons = screen.getAllByRole('button', { name: /send/i });
    await user.click(sendButtons[0]);
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });
});
