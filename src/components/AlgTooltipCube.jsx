/**
 * AlgTooltipCube — static, non-interactive 3D cube for algorithm token tooltips.
 * Creates ONE engine on mount; updates cube colours via createCube() on faceMap changes.
 * No orbit rotation, no zoom, no auto-rotation.
 */
import { useEffect, useRef } from 'react';
import { createEngine } from '../engine/cubeEngine.js';

export default function AlgTooltipCube({ faceMap, size = 140 }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);

  // Create the engine once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = createEngine(container);
    engine.orbit.enableRotate = false;
    engine.orbit.enableZoom = false;
    engine.orbit.autoRotate = false;
    engineRef.current = engine;

    let disposed = false;
    let animId = null;
    const tick = () => {
      if (disposed) return;
      animId = requestAnimationFrame(tick);
      engine.render();
    };
    tick();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update cube colours without recreating the engine
  useEffect(() => {
    engineRef.current?.createCube(faceMap);
  }, [faceMap]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden', background: '#0a0a14' }}
    />
  );
}
