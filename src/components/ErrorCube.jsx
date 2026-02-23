/**
 * ErrorCube — Three.js cube for error pages.
 * Reuses the same engine/rendering as HeroCube, in a fixed-size box.
 * variant: 'scrambled' (404) | 'broken' (500)
 */
import { useRef, useEffect } from 'react';
import { createEngine } from '../engine/cubeEngine.js';

// Engine uses face letters (U/R/F/D/L/B) as colour keys.
// 404 — every face shows wrong colours
const SCRAMBLED_FACE_MAP = {
  U: ['R','U','F','D','F','B','B','R','U'],
  R: ['F','B','R','U','B','D','B','F','U'],
  F: ['R','U','F','D','F','L','B','R','U'],
  D: ['U','D','B','B','R','F','D','U','B'],
  L: ['D','L','U','B','F','R','L','D','R'],
  B: ['L','F','D','U','B','R','F','D','R'],
};

// 500 — mostly solved, one centre sticker swapped per visible face
const BROKEN_FACE_MAP = {
  U: ['U','U','U', 'U','R','U', 'U','U','U'],
  R: ['R','R','R', 'R','R','R', 'R','R','R'],
  F: ['F','F','F', 'F','F','F', 'F','F','F'],
  D: ['D','D','D', 'D','U','D', 'D','D','D'],
  L: ['L','L','L', 'L','L','L', 'L','L','L'],
  B: ['B','B','B', 'B','B','B', 'B','B','B'],
};

const FACE_MAPS = { scrambled: SCRAMBLED_FACE_MAP, broken: BROKEN_FACE_MAP };

export default function ErrorCube({ variant = 'scrambled', size = 260 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = createEngine(container);
    engine.createCube(FACE_MAPS[variant] ?? SCRAMBLED_FACE_MAP);

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
  }, [variant]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden' }}
    />
  );
}
