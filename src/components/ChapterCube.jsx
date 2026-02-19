/**
 * ChapterCube — small interactive 3D cube showing a goal state.
 * Standalone: uses createEngine directly, no CubeProvider needed.
 * IntersectionObserver lazy-boots the engine only when in view.
 */
import { useEffect, useRef } from 'react';
import { createEngine } from '../engine/cubeEngine.js';
import '../styles/ChapterCube.css';

export default function ChapterCube({ faceMap, size = 220 }) {
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
            // Disable zoom so wheel events pass through to the page for scrolling
            engine.orbit.enableZoom = false;
          }
          resume();
        } else {
          pause();
        }
      },
      { threshold: 0.1 }
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
  }, [faceMap]);

  return <div ref={containerRef} className="chapter-cube" style={{ width: size, height: size }} />;
}
