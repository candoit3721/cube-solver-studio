/**
 * RotationArc — filled tapered curved arrow showing rotation direction.
 * Wide at the tail, narrowing to a sharp point, with a triangular arrowhead at the tip.
 *
 * Variants:
 *   'horizontal' – flat ellipse for U/D.
 *                  Starts at 3 o'clock (right), sweeps CW 270° to 12 o'clock (top).
 *                  Arrowhead sits at the TOP for both CW and CCW → always above the tail.
 *   'vertical'   – tall ellipse for R/L/F.
 *                  Starts at 12 o'clock (top), sweeps CW 270° to 9 o'clock (left).
 *                  Arrowhead at 9 o'clock, pointing up.
 *   'circle'     – circular fallback, same sweep as vertical.
 *
 * CCW is produced by mirroring on X (scale(-1,1)).
 * rotateDeg tilts the whole shape AFTER the CW/CCW flip.
 *
 * Props:
 *   clockwise  – true = ↻, false = ↺
 *   size       – px width/height of the SVG element
 *   color      – fill color (default: white)
 *   opacity    – overall opacity (default: 0.85)
 *   variant    – 'horizontal' | 'vertical' | 'circle'
 *   rotateDeg  – optional post-flip tilt in degrees (default: 0)
 */

/**
 * Build the filled tapered arc path.
 * Outer edge: constant ellipse (rx, ry) from startAngle sweeping 270° CW.
 * Inner edge: same ellipse but band width decreases from bandWidth (tail) to 0 (tip).
 */
function buildArcPath(rx, ry, bandWidth, startAngle, segments = 28) {
  const sweepAngle = 1.5 * Math.PI; // 270°
  const outer = [];
  const inner = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + sweepAngle * t;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    outer.push([rx * cos, ry * sin]);

    const band = bandWidth * (1 - t);
    inner.push([
      Math.max(rx * 0.04, rx - band) * cos,
      Math.max(ry * 0.04, ry - band) * sin,
    ]);
  }

  const f = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`;
  const fwd = outer.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p)}`).join(' ');
  const rev = [...inner].reverse().map((p) => `L${f(p)}`).join(' ');
  return `${fwd} ${rev} Z`;
}

/**
 * Build the arrowhead triangle at the tip of the arc.
 * tipAngle: angle of the tip on the ellipse.
 * headDir: unit vector of the arc's travel direction at the tip.
 * The triangle extends hh units in headDir from the tip, with base width hw.
 */
function buildHeadPath(rx, ry, tipAngle, headDir, hw, hh) {
  const tx = rx * Math.cos(tipAngle);
  const ty = ry * Math.sin(tipAngle);
  const [dx, dy] = headDir;
  const px = -dy; const py = dx; // perpendicular to travel direction

  return [
    `M${(tx + dx * hh).toFixed(2)},${(ty + dy * hh).toFixed(2)}`,
    `L${(tx + px * hw).toFixed(2)},${(ty + py * hw).toFixed(2)}`,
    `L${(tx - px * hw).toFixed(2)},${(ty - py * hw).toFixed(2)}`,
    'Z',
  ].join(' ');
}

// startAngle: where the thick tail begins (radians, standard math: 0=right, -π/2=top)
// tipAngle:   where the arrowhead sits (end of the 270° CW sweep from startAngle)
// headDir:    unit vector of arc travel direction at tipAngle
const SHAPES = {
  // Horizontal: tail at right (3 o'clock), tip at top (12 o'clock).
  // At 12 o'clock the arc is moving rightward → arrowhead points right.
  // After scale(-1,1) for CCW: tail at left, tip at top, arrowhead points left.
  // Both CW and CCW end at the very top — symmetric, always above the starting point.
  horizontal: {
    rx: 15, ry: 5.5, band: 4.5,
    startAngle: 0,             // 3 o'clock
    tipAngle: -Math.PI / 2,   // 12 o'clock
    headDir: [1, 0],           // rightward at 12 o'clock (CW travel direction)
    hw: 4, hh: 5,
    vb: '-17 -13 34 21',
  },
  // Vertical: tail at top (12 o'clock), tip at left (9 o'clock).
  // Tangent at 9 o'clock is upward → arrowhead points up.
  vertical: {
    rx: 9, ry: 16, band: 5.5,
    startAngle: -Math.PI / 2, // 12 o'clock
    tipAngle: Math.PI,        // 9 o'clock
    headDir: [0, -1],          // upward
    hw: 4.5, hh: 5.5,
    vb: '-17 -23 28 42',
  },
  // Circle: same sweep as vertical but circular.
  circle: {
    rx: 13, ry: 13, band: 5,
    startAngle: -Math.PI / 2,
    tipAngle: Math.PI,
    headDir: [0, -1],
    hw: 4.5, hh: 5.5,
    vb: '-21 -21 36 36',
  },
};

export default function RotationArc({
  clockwise = true,
  size = 38,
  color = '#ffffff',
  opacity = 0.85,
  variant = 'circle',
  rotateDeg = 0,
}) {
  const sh = SHAPES[variant] ?? SHAPES.circle;
  const arcPath  = buildArcPath(sh.rx, sh.ry, sh.band, sh.startAngle);
  const headPath = buildHeadPath(sh.rx, sh.ry, sh.tipAngle, sh.headDir, sh.hw, sh.hh);

  // Apply flip for CCW, then optional tilt — both transforms share the same tilt angle
  // so U and U' look symmetrically tilted (if rotateDeg is used).
  let transform;
  if (clockwise) {
    transform = rotateDeg ? `rotate(${rotateDeg})` : undefined;
  } else {
    transform = rotateDeg
      ? `rotate(${rotateDeg}) scale(-1,1)`
      : 'scale(-1,1)';
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={sh.vb}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <g transform={transform} fill={color} opacity={opacity}>
        <path d={arcPath} />
        <path d={headPath} />
      </g>
    </svg>
  );
}
