/**
 * Three.js cube engine — scene, cubies, stickers.
 * Pure logic, no React dependency.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FACE_HEX } from './constants.js';

/* ── Color setup ── */
const FACE_THREE = {};
for (const [k, v] of Object.entries(FACE_HEX)) {
    FACE_THREE[k] = new THREE.Color(v);
}
const BODY_COLOR = new THREE.Color('#111111');

/* ── Shared geometries & materials ── */
function rrShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

const bodyGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96).toNonIndexed();
const bodyMat = new THREE.MeshStandardMaterial({
    color: BODY_COLOR, roughness: 0.5, metalness: 0.1,
});

const stickerGeo = new THREE.ShapeGeometry(rrShape(0.82, 0.82, 0.1));

// Stickers use MeshBasicMaterial so colours are unaffected by scene lighting.
// This guarantees every sticker renders at its exact defined colour regardless
// of which face is angled toward or away from the light sources.
const stickerMats = {};
function getStickerMat(face) {
    if (!stickerMats[face]) {
        stickerMats[face] = new THREE.MeshBasicMaterial({
            color: FACE_THREE[face],
        });
    }
    return stickerMats[face];
}

const dimmedMats = {};
function getDimmedMat(colorKey) {
    if (!dimmedMats[colorKey]) {
        const c = FACE_THREE[colorKey].clone();
        c.multiplyScalar(0.18); // darken to ~18% brightness so non-moving stickers fade out
        dimmedMats[colorKey] = new THREE.MeshBasicMaterial({ color: c });
    }
    return dimmedMats[colorKey];
}

// Face offset needed to compute global facelet indices for dimming
const FACE_OFFSET_CUBIE = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };

/* ── Sticker positioning for each face ── */
const STICKER_SPEC = [
    ['R', (cx) => cx === 1, [0.481, 0, 0], [0, Math.PI / 2, 0]],
    ['L', (cx) => cx === -1, [-0.481, 0, 0], [0, -Math.PI / 2, 0]],
    ['U', (_, cy) => cy === 1, [0, 0.481, 0], [-Math.PI / 2, 0, 0]],
    ['D', (_, cy) => cy === -1, [0, -0.481, 0], [Math.PI / 2, 0, 0]],
    ['F', (_, __, cz) => cz === 1, [0, 0, 0.481], [0, 0, 0]],
    ['B', (_, __, cz) => cz === -1, [0, 0, -0.481], [0, Math.PI, 0]],
];

/** Map (face, cubie-position) → index in the 9-cell face grid */
function getFaceIdx(face, x, y, z) {
    if (face === 'U') return (z + 1) * 3 + (x + 1);
    if (face === 'D') return (1 - z) * 3 + (x + 1);
    if (face === 'F') return (1 - y) * 3 + (x + 1);
    if (face === 'B') return (1 - y) * 3 + (1 - x);
    if (face === 'R') return (1 - y) * 3 + (1 - z);
    if (face === 'L') return (1 - y) * 3 + (z + 1);
    return 0;
}

function buildCubie(x, y, z, faceMap, dimmedFacelets = null) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(bodyGeo, bodyMat));

    for (const [face, test, pos, rot] of STICKER_SPEC) {
        if (test(x, y, z)) {
            let color = face;
            if (faceMap && faceMap[face]) {
                const idx = getFaceIdx(face, x, y, z);
                color = faceMap[face][idx];
            }
            let mat;
            if (dimmedFacelets) {
                const fIdx = FACE_OFFSET_CUBIE[face] + getFaceIdx(face, x, y, z);
                mat = dimmedFacelets.has(fIdx) ? getDimmedMat(color) : getStickerMat(color);
            } else {
                mat = getStickerMat(color);
            }
            const m = new THREE.Mesh(stickerGeo, mat);
            m.position.set(pos[0], pos[1], pos[2]);
            m.rotation.set(rot[0], rot[1], rot[2]);
            g.add(m);
        }
    }

    g.position.set(x, y, z);
    g.userData.pos = { x, y, z };
    return g;
}

/**
 * Create the full engine: scene, camera, renderer, cubies.
 * Call once on mount, passing the DOM container.
 */
export function createEngine(container) {
    const scene = new THREE.Scene();
    // No scene.background — canvas is transparent so the CSS background shows through.
    // Callers that need a specific background (e.g. HeroCube) can set engine.scene.background.

    const camera = new THREE.PerspectiveCamera(
        40, container.clientWidth / container.clientHeight, 0.1, 100
    );
    camera.position.set(10, 7.8, 10);

    const renderer = new THREE.WebGLRenderer({
        antialias: true, powerPreference: 'high-performance', alpha: true,
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, -1.2, 0);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.enablePan = false;
    orbit.minDistance = 7;
    orbit.maxDistance = 14;
    orbit.autoRotate = true;
    orbit.autoRotateSpeed = 1.2;

    renderer.domElement.addEventListener('pointerdown', () => {
        orbit.autoRotate = false;
    });

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 0.45));
    const dl1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dl1.position.set(6, 10, 8);
    scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.25);
    dl2.position.set(-4, -2, -6);
    scene.add(dl2);

    // Cubies array
    const cubies = [];

    /** Rebuild the cube (optionally with a faceMap for custom colors)
     *  options.dimmedFacelets — Set<number> of facelet indices (0–53) to render dimmed
     */
    function createCube(faceMap = null, options = {}) {
        const { dimmedFacelets = null } = options;
        for (const c of cubies) scene.remove(c);
        cubies.length = 0;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0) continue;
                    const c = buildCubie(x, y, z, faceMap, dimmedFacelets);
                    scene.add(c);
                    cubies.push(c);
                }
            }
        }
    }

    /** Handle window resize */
    function resize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /** Render loop tick */
    function render() {
        orbit.update();
        renderer.render(scene, camera);
    }

    /** Cleanup */
    function dispose() {
        renderer.forceContextLoss(); // immediately returns the WebGL context to the browser pool
        renderer.dispose();
        orbit.dispose();
        if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }

    return { scene, camera, renderer, orbit, cubies, createCube, resize, render, dispose };
}
