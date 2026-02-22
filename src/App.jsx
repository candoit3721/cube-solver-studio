/**
 * App — main layout shell, wires all components together.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { CubeProvider, useCubeState } from './hooks/useCubeState.jsx';
import CubeCanvas from './components/CubeCanvas.jsx';
import TopBar from './components/TopBar.jsx';
import BottomBar from './components/BottomBar.jsx';
import SidePanel from './components/SidePanel.jsx';
import EditorModal from './components/EditorModal.jsx';
import CameraModal from './components/CameraModal.jsx';
import FreeScanModal from './components/FreeScanModal.jsx';
import CalibrationModal from './components/CalibrationModal.jsx';
import NotationModal from './components/NotationModal.jsx';
import TutorialOverlay from './components/TutorialOverlay.jsx';
import { isCalibrated } from './scanner/colorCalibration.js';
import { checkHealth } from './api/cubeApi.js';
import './App.css';

function useBackendHealth() {
  const [online, setOnline] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const ok = await checkHealth();
      if (!cancelled) setOnline(ok);
    };
    poll();
    intervalRef.current = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(intervalRef.current); };
  }, []);

  return online;
}

export function AppInner() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [freeScanOpen, setFreeScanOpen] = useState(false);
  const [notationOpen, setNotationOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [pendingScanMode, setPendingScanMode] = useState(null); // 'scan' | 'freeScan' | null
  const [panelOpen, setPanelOpen] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const backendOnline = useBackendHealth();

  const openWithCalibrationGate = useCallback((mode) => {
    if (isCalibrated()) {
      if (mode === 'scan') setCameraOpen(true);
      else setFreeScanOpen(true);
    } else {
      setPendingScanMode(mode);
      setCalibrationOpen(true);
    }
  }, []);

  const handleCalibrationComplete = useCallback((/* didCalibrate */) => {
    setCalibrationOpen(false);
    if (pendingScanMode === 'scan') setCameraOpen(true);
    else if (pendingScanMode === 'freeScan') setFreeScanOpen(true);
    setPendingScanMode(null);
  }, [pendingScanMode]);

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
      if (editorOpen || cameraOpen || freeScanOpen || calibrationOpen || notationOpen) return;

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
  }, [editorOpen, cameraOpen, freeScanOpen, calibrationOpen, notationOpen, state, scramble, solve, stopPlaying, nextStep, prevStep, firstStep, lastStep, reset]);

  return (
    <>
      <div className={`server-banner ${backendOnline ? '' : 'show'}`}>
        Server unavailable — start the backend to enable solving
      </div>
      <CubeCanvas />
      <TopBar />
      <BottomBar
        onOpenEditor={() => setEditorOpen(true)}
        onOpenCamera={() => openWithCalibrationGate('scan')}
        onOpenFreeScan={() => openWithCalibrationGate('freeScan')}
        onOpenTutorial={() => setTutorialOpen(true)}
      />
      <SidePanel open={panelOpen} onToggle={() => setPanelOpen(p => !p)} onOpenNotation={() => setNotationOpen(true)} />
      <EditorModal open={editorOpen} onClose={() => setEditorOpen(false)} />
      <CalibrationModal
        isOpen={calibrationOpen}
        onClose={() => { setCalibrationOpen(false); setPendingScanMode(null); }}
        onComplete={handleCalibrationComplete}
      />
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} />
      <FreeScanModal open={freeScanOpen} onClose={() => setFreeScanOpen(false)} />
      <NotationModal open={notationOpen} onClose={() => setNotationOpen(false)} />
      {tutorialOpen && <TutorialOverlay onClose={() => setTutorialOpen(false)} />}
    </>
  );
}

export default function App() {
  return (
    <CubeProvider>
      <AppInner />
    </CubeProvider>
  );
}
