/**
 * HeroCube — read-only Three.js cube for the Home page hero.
 * Does not use CubeProvider — creates its own engine instance.
 */
import { useRef, useEffect } from 'react';
import { createEngine } from '../engine/cubeEngine.js';

// Pre-baked scrambled face map for the hero display
const SCRAMBLED_FACE_MAP = {
  U: ['U','R','U','F','U','B','U','L','U'],
  D: ['D','L','D','R','D','F','D','B','D'],
  F: ['F','U','F','D','F','L','F','R','F'],
  B: ['B','D','B','U','B','R','B','L','B'],
  R: ['R','F','R','B','R','U','R','D','R'],
  L: ['L','B','L','F','L','D','L','U','L'],
};

export default function HeroCube() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = createEngine(containerRef.current);
    engine.createCube(SCRAMBLED_FACE_MAP);

    let animId;
    function loop() {
      animId = requestAnimationFrame(loop);
      engine.render();
    }
    loop();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  return <div ref={containerRef} className="hero-cube-container" />;
}
