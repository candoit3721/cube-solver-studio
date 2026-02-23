/**
 * IsoCube — animated CSS 3D cube for error pages.
 * Each face shows a full 3×3 sticker grid.
 * variant: 'scrambled' (404) | 'broken' (500)
 */

const W = '#ffffff';
const Y = '#ffd500';
const G = '#009e60';
const B = '#0051ba';
const R = '#c41e3a';
const O = '#ff5800';
const X = null; // void / missing sticker

const VARIANTS = {
  // 404 — every face has wrong colors
  scrambled: {
    front:  [R, W, G,  Y, G, O,  B, R, W],
    back:   [O, G, Y,  W, B, R,  G, Y, R],
    top:    [B, R, O,  G, W, Y,  R, B, G],
    bottom: [W, Y, B,  O, R, G,  Y, W, B],
    right:  [G, B, R,  W, O, Y,  B, G, W],
    left:   [Y, O, W,  B, G, R,  O, Y, R],
  },
  // 500 — mostly solved but center stickers are missing/void
  broken: {
    front:  [G, G, G,  G, X, G,  G, G, G],
    back:   [B, B, B,  B, B, B,  B, B, B],
    top:    [W, W, W,  X, W, X,  W, W, W],
    bottom: [Y, Y, Y,  Y, Y, Y,  Y, Y, Y],
    right:  [R, R, X,  R, R, R,  X, R, R],
    left:   [O, O, O,  O, O, O,  O, O, O],
  },
};

const FACE_NAMES = ['front', 'back', 'top', 'bottom', 'right', 'left'];

export default function IsoCube({ variant = 'scrambled', size = 160 }) {
  const config = VARIANTS[variant] ?? VARIANTS.scrambled;

  return (
    <div className="iso-scene" style={{ '--size': `${size}px`, '--half': `${size / 2}px` }}>
      <div className={`iso-cube iso-cube--${variant}`}>
        {FACE_NAMES.map(face => (
          <div key={face} className={`iso-face iso-face--${face}`}>
            <div className="iso-sticker-grid">
              {config[face].map((color, i) =>
                color ? (
                  <div key={i} className="iso-sticker" style={{ background: color }} />
                ) : (
                  <div key={i} className="iso-sticker iso-sticker--void" />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
