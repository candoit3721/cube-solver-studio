import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire Three.js engine before importing ChapterCube
vi.mock('../../engine/cubeEngine.js', () => ({
  createEngine: vi.fn(() => ({
    createCube: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    orbit: { autoRotate: true },
  })),
}));

// Mock IntersectionObserver (not available in jsdom)
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('IntersectionObserver', vi.fn(function() {
    return { observe: mockObserve, disconnect: mockDisconnect };
  }));
});

import ChapterCube from '../ChapterCube.jsx';
import { CHAPTER_STATES } from '../../engine/chapterStates.js';

describe('ChapterCube', () => {
  it('renders a .chapter-cube container div', () => {
    const { container } = render(<ChapterCube faceMap={CHAPTER_STATES[0]} />);
    expect(container.querySelector('.chapter-cube')).not.toBeNull();
  });

  it('sets up an IntersectionObserver on mount', () => {
    render(<ChapterCube faceMap={CHAPTER_STATES[0]} />);
    expect(IntersectionObserver).toHaveBeenCalledTimes(1);
    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it('renders without crashing for all 7 phase states', () => {
    CHAPTER_STATES.forEach((faceMap) => {
      expect(() => render(<ChapterCube faceMap={faceMap} />)).not.toThrow();
    });
  });
});
