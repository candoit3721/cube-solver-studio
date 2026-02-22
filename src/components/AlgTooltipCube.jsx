/**
 * AlgTooltipCube — static, non-interactive 3D cube for algorithm token tooltips.
 * Creates the engine and cube on mount; disposes on unmount.
 * Designed to be conditionally rendered (only while hovered) to keep
 * total WebGL context count within browser limits.
 *
 * Props:
 *   faceMap  – goal-state face map (fixed for the lifetime of this mount)
 *   size     – px width/height (default 110)
 *   move     – optional move name e.g. "R", "U'". When provided:
 *              • non-moving stickers are dimmed to ~18% brightness
 *              • a rotation-direction arc is overlaid on the moving face
 */
import { useEffect, useRef } from 'react';
import { createEngine } from '../engine/cubeEngine.js';
import { PERMS } from '../engine/cubeState.js';
import RotationArc from './RotationArc.jsx';

// ── Arc overlay config ─────────────────────────────────────────────────────
// xFrac/yFrac: center of the arc as a fraction of `size`, targeting the
// projected screen position of each face's center when camera = [5.5, 4.2, 5.5].
// cw: true = ↻, false = ↺ as seen by the viewer from the camera position.
//
// U/R/F faces are directly visible → arc on face center.
// D face is barely visible (bottom edge) → arc near bottom center.
// L/B faces are hidden from this camera → no arc (dimming alone is enough).
// Double moves (U2 etc.) have no preferred direction → no arc.
const ARC_INFO = {
  // U/D: flat horizontal ellipse — reads as a spinning disc viewed from above.
  // Arc starts at the right (tail), sweeps CW 270° to the top (arrowhead).
  // Both U and U' have their arrowhead at the top of the arc, so they are
  // symmetric and the tip is always above the starting point.
  'U':   { xFrac: 0.50, yFrac: 0.21, cw: true,  variant: 'horizontal' },
  "U'":  { xFrac: 0.50, yFrac: 0.21, cw: false, variant: 'horizontal' },
  // R/L/F rotate around a horizontal axis — vertical rotation plane → tall narrow arc.
  // L/L' use camera [-5.5,4.2,5.5] so the L face is directly visible; by mirror
  // symmetry with R, the L face projects to xFrac≈0.24. Viewed from -X, L CW = cw:true.
  'R':   { xFrac: 0.76, yFrac: 0.47, cw: true,  variant: 'vertical' },
  "R'":  { xFrac: 0.76, yFrac: 0.47, cw: false, variant: 'vertical' },
  'L':   { xFrac: 0.24, yFrac: 0.47, cw: true,  variant: 'vertical' },
  "L'":  { xFrac: 0.24, yFrac: 0.47, cw: false, variant: 'vertical' },
  'F':   { xFrac: 0.29, yFrac: 0.70, cw: true,  variant: 'vertical' },
  "F'":  { xFrac: 0.29, yFrac: 0.70, cw: false, variant: 'vertical' },
  // D barely visible at the bottom; same horizontal arc layout as U.
  'D':   { xFrac: 0.50, yFrac: 0.83, cw: false, variant: 'horizontal' },
  "D'":  { xFrac: 0.50, yFrac: 0.83, cw: true,  variant: 'horizontal' },
};

export default function AlgTooltipCube({ faceMap, size = 110, move = null, cameraPosition = null }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Compute the set of non-moving facelet indices so the engine can dim them
    let dimmedFacelets = null;
    if (move && PERMS[move]) {
      const perm = PERMS[move];
      dimmedFacelets = new Set();
      for (let i = 0; i < 54; i++) {
        if (perm[i] === i) dimmedFacelets.add(i);
      }
      // Face centers are always fixed points in any single-face permutation, so they
      // get incorrectly dimmed. Un-dim the active face's center so it shows at full brightness.
      const FACE_CENTER = { U: 4, R: 13, F: 22, D: 31, L: 40, B: 49 };
      const centerIdx = FACE_CENTER[move[0]];
      if (centerIdx !== undefined) dimmedFacelets.delete(centerIdx);
    }

    const engine = createEngine(container);
    if (cameraPosition) engine.camera.position.set(...cameraPosition);
    engine.orbit.enableRotate = false;
    engine.orbit.enableZoom = false;
    engine.orbit.autoRotate = false;
    engine.createCube(faceMap, { dimmedFacelets }); // faceMap & move are fixed at mount

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
  }, []); // intentionally ignores faceMap/move — both are stable for the lifetime of this mount

  const arcInfo = move ? ARC_INFO[move] : null;

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#0a0a14',
        position: 'relative',
      }}
    >
      {arcInfo && (
        <div
          style={{
            position: 'absolute',
            left: arcInfo.xFrac * size,
            top: arcInfo.yFrac * size,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
            // Soft glow to match the glassmorphism tooltip aesthetic
            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.45))',
          }}
        >
          <RotationArc clockwise={arcInfo.cw} variant={arcInfo.variant} size={Math.round(size * 0.36)} rotateDeg={arcInfo.rotateDeg ?? 0} />
        </div>
      )}
    </div>
  );
}
