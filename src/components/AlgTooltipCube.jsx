/**
 * AlgTooltipCube — static, non-interactive 3D cube for algorithm token tooltips.
 * Creates the engine and cube on mount; disposes on unmount.
 * Designed to be conditionally rendered (only while hovered) to keep
 * total WebGL context count within browser limits.
 */
import { useEffect, useRef } from 'react';
import { createEngine } from '../engine/cubeEngine.js';

export default function AlgTooltipCube({ faceMap, size = 110 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = createEngine(container);
    engine.orbit.enableRotate = false;
    engine.orbit.enableZoom = false;
    engine.orbit.autoRotate = false;
    engine.createCube(faceMap); // faceMap is fixed at mount; changes handled by remounting

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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally ignores faceMap — it's stable for the lifetime of this mount

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden', background: '#0a0a14' }}
    />
  );
}
