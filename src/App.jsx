/**
 * App — main layout shell, wires all components together.
 */
import { useState, useEffect, useCallback } from 'react';
import { CubeProvider, useCubeState } from './hooks/useCubeState.jsx';
import CubeCanvas from './components/CubeCanvas.jsx';
import TopBar from './components/TopBar.jsx';
import BottomBar from './components/BottomBar.jsx';
import SidePanel from './components/SidePanel.jsx';
import EditorModal from './components/EditorModal.jsx';
import CameraModal from './components/CameraModal.jsx';
import NotationModal from './components/NotationModal.jsx';
import { initSolver } from './engine/solver.js';
import './App.css';

function AppInner() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [notationOpen, setNotationOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const { state, scramble, solve, stopPlaying, nextStep, prevStep, firstStep, lastStep, reset } = useCubeState();

  // Open side panel automatically when there's a solution
  useEffect(() => {
    if ((state.solution.length > 0 || state.sidePanelErr) && !panelOpen) {
      setPanelOpen(true);
    }
  }, [state.solution.length, state.sidePanelErr]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.repeat) return;
      // Don't capture keys when a modal is open
      if (editorOpen || cameraOpen || notationOpen) return;

      switch (e.key) {
        case 's': case 'S': scramble(); break;
        case ' ':
          e.preventDefault();
          if (state.playing) stopPlaying();
          else if (state.step < state.solution.length) solve(state.solution, state.step);
          break;
        case 'ArrowRight': nextStep(state.step, state.solution); break;
        case 'ArrowLeft': prevStep(state.step, state.solution); break;
        case 'Home': firstStep(state.step, state.solution); break;
        case 'End': lastStep(state.step, state.solution); break;
        case 'r': case 'R':
          if (!e.metaKey && !e.ctrlKey) reset();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editorOpen, cameraOpen, notationOpen, state, scramble, solve, stopPlaying, nextStep, prevStep, firstStep, lastStep, reset]);

  return (
    <>
      <CubeCanvas />
      <TopBar />
      <BottomBar
        onOpenEditor={() => setEditorOpen(true)}
        onOpenCamera={() => setCameraOpen(true)}
        onOpenNotation={() => setNotationOpen(true)}
      />
      <SidePanel open={panelOpen} onToggle={() => setPanelOpen(p => !p)} />
      <EditorModal open={editorOpen} onClose={() => setEditorOpen(false)} />
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} />
      <NotationModal open={notationOpen} onClose={() => setNotationOpen(false)} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize the Kociemba solver in the background
    initSolver();
  }, []);

  return (
    <CubeProvider>
      <AppInner />
    </CubeProvider>
  );
}
