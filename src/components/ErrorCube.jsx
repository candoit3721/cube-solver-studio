/**
 * ErrorCube — Three.js cube for error pages.
 * Reuses the same engine/rendering as HeroCube, in a fixed-size box.
 * variant: 'scrambled' (404) | 'broken' (500)
 */
import { useRef, useEffect } from 'react';
import { createEngine } from '../engine/cubeEngine.js';

// Engine uses face letters (U/R/F/D/L/B) as colour keys.
// 404 — valid scrambled state (derived from: R U R' U' R' F R2 U' R' U' R U R' F')
// Centers are always fixed: U[4]=U, R[4]=R, F[4]=F, D[4]=D, L[4]=L, B[4]=B
// Each color appears exactly 9 times across all 54 stickers.
const SCRAMBLED_FACE_MAP = {
  U: ['F','U','L', 'R','U','U', 'F','B','R'],
  R: ['U','R','B', 'F','R','D', 'U','F','D'],
  F: ['D','F','R', 'L','F','U', 'B','L','R'],
  D: ['L','D','F', 'B','D','R', 'L','B','U'],
  L: ['B','L','D', 'U','L','B', 'R','D','F'],
  B: ['D','B','U', 'F','B','L', 'U','R','L'],
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
