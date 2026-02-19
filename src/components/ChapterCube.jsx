/**
 * ChapterCube — small interactive 3D cube showing a goal state.
 * Standalone: uses createEngine directly, no CubeProvider needed.
 * IntersectionObserver lazy-boots the engine only when in view.
 *
 * Props:
 *   faceMap       – cube colour state
 *   size          – pixel size (default 220)
 *   autoRotate    – orbit auto-spin (default false)
 *   cameraPosition– [x,y,z] initial camera position (default engine default)
 *   arrows        – array of { origin:[x,y,z], dir:[x,y,z], length, color,
 *                              headLength, headWidth } — rendered as ArrowHelpers
 *                   in the scene so they rotate with the cube when dragged.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createEngine } from '../engine/cubeEngine.js';
import '../styles/ChapterCube.css';

export default function ChapterCube({
  faceMap,
  size = 220,
  autoRotate = false,
  cameraPosition = null,
  arrows = [],
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let engine = null;
    let animId = null;
    let disposed = false;

    function tick() {
      if (disposed) return;
      animId = requestAnimationFrame(tick);
      engine.render();
    }

    function pause() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    }

    function resume() {
      if (animId || !engine || disposed) return;
      tick();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!engine) {
            engine = createEngine(container);
            engine.createCube(faceMap);
            // Disable zoom so wheel events pass through for page scrolling
            engine.orbit.enableZoom = false;
            engine.orbit.autoRotate = autoRotate;

            if (cameraPosition) {
              engine.camera.position.set(...cameraPosition);
            }

            // Add 3D arrows to the scene — they live in world space so they
            // rotate naturally with the cube when the user drags.
            arrows.forEach(({
              origin,
              dir,
              length = 2,
              color = 0xffd700,
              headLength = 0.45,
              headWidth = 0.28,
            }) => {
              const direction = new THREE.Vector3(...dir).normalize();
              const orig = new THREE.Vector3(...origin);
              const arrow = new THREE.ArrowHelper(
                direction, orig, length, color, headLength, headWidth,
              );
              engine.scene.add(arrow);
            });
          }
          resume();
        } else {
          pause();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    const onResize = () => engine?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      pause();
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      engine?.dispose();
    };
  // arrows / cameraPosition / autoRotate are only read once on engine init —
  // they are stable constants coming from the CHAPTERS definition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceMap]);

  return <div ref={containerRef} className="chapter-cube" style={{ width: size, height: size }} />;
}
