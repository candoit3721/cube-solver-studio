/**
 * Move animation system — animated + instant moves.
 */
import * as THREE from 'three';
import { MOVES } from './constants.js';

function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function snapCubie(c) {
    c.position.x = Math.round(c.position.x);
    c.position.y = Math.round(c.position.y);
    c.position.z = Math.round(c.position.z);
    c.userData.pos = {
        x: c.position.x,
        y: c.position.y,
        z: c.position.z,
    };
}

let busy = false;
export function isBusy() { return busy; }

/**
 * Animate a single move over `dur` milliseconds.
 * Returns a promise that resolves when the animation completes.
 */
export function doMoveAnimated(scene, cubies, name, dur) {
    return new Promise((resolve) => {
        const def = MOVES[name];
        if (!def || busy) { resolve(); return; }

        const { axis, layer, angle } = def;
        const lc = cubies.filter(c => Math.round(c.userData.pos[axis]) === layer);
        if (!lc.length) { resolve(); return; }

        const pivot = new THREE.Group();
        scene.add(pivot);
        for (const c of lc) pivot.attach(c);

        busy = true;
        let t0 = 0;

        function tick(now) {
            if (!t0) t0 = now;
            const t = Math.min((now - t0) / dur, 1);
            const e = ease(t);
            pivot.rotation[axis] = angle * e;

            if (t < 1) {
                requestAnimationFrame(tick);
                return;
            }

            for (const c of lc) { scene.attach(c); snapCubie(c); }
            scene.remove(pivot);
            busy = false;
            resolve();
        }

        requestAnimationFrame(tick);
    });
}

/**
 * Apply a move instantly (no animation).
 */
export function doMoveInstant(scene, cubies, name) {
    const def = MOVES[name];
    if (!def) return;

    const { axis, layer, angle } = def;
    const lc = cubies.filter(c => Math.round(c.userData.pos[axis]) === layer);
    if (!lc.length) return;

    const pivot = new THREE.Group();
    scene.add(pivot);
    for (const c of lc) pivot.attach(c);
    pivot.rotation[axis] = angle;
    for (const c of lc) { scene.attach(c); snapCubie(c); }
    scene.remove(pivot);
}
