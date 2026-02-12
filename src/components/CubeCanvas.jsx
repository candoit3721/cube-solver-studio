/**
 * CubeCanvas — mounts the Three.js engine into a container div.
 */
import { useRef, useEffect } from 'react';
import { createEngine } from '../engine/cubeEngine.js';
import { useCubeState } from '../hooks/useCubeState.jsx';

export default function CubeCanvas() {
    const containerRef = useRef(null);
    const { engineRef } = useCubeState();

    useEffect(() => {
        if (!containerRef.current) return;

        const engine = createEngine(containerRef.current);
        engine.createCube();
        engineRef.current = engine;

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
            engineRef.current = null;
        };
    }, [engineRef]);

    return <div ref={containerRef} id="canvas-container" />;
}
