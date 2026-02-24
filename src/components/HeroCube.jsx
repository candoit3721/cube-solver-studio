/**
 * HeroCube — read-only Three.js cube for the Home page hero.
 * Scene background adapts to the current theme.
 */
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createEngine } from '../engine/cubeEngine.js';

const SCRAMBLED_FACE_MAP = {
  U: ['U','R','U','F','U','B','U','L','U'],
  D: ['D','L','D','R','D','F','D','B','D'],
  F: ['F','U','F','D','F','L','F','R','F'],
  B: ['B','D','B','U','B','R','B','L','B'],
  R: ['R','F','R','B','R','U','R','D','R'],
  L: ['L','B','L','F','L','D','L','U','L'],
};

const BG_DARK  = new THREE.Color('#0a0a14');
const BG_LIGHT = new THREE.Color('#cdd8ee');

function getThemeBg() {
  return document.documentElement.dataset.theme === 'light' ? BG_LIGHT : BG_DARK;
}

export default function HeroCube() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = createEngine(containerRef.current);
    engine.scene.background = getThemeBg();
    engine.createCube(SCRAMBLED_FACE_MAP);

    let animId;
    function loop() {
      animId = requestAnimationFrame(loop);
      engine.render();
    }
    loop();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    // Watch theme changes and update scene background
    const observer = new MutationObserver(() => {
      engine.scene.background = getThemeBg();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      engine.dispose();
    };
  }, []);

  return <div ref={containerRef} className="hero-cube-container" />;
}
