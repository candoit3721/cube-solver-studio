/**
 * Icon wrappers using lucide-react — reliable, well-tested SVGs.
 */
import {
    Dices, Camera, Rotate3d, Pencil, Sparkles,
    RotateCcw, Compass, BookOpen,
} from 'lucide-react';

const sz = { size: 16, strokeWidth: 2 };

export const IconShuffle   = () => <Dices     {...sz} />;  // Scramble — dice = random
export const IconCamera    = () => <Camera    {...sz} />;  // Scan — camera
export const IconScan3D    = () => <Rotate3d  {...sz} />;  // 3D Scan — rotate in 3D
export const IconEdit      = () => <Pencil    {...sz} />;  // Edit
export const IconSparkle   = () => <Sparkles  {...sz} />;  // Solve
export const IconRotateCCW = () => <RotateCcw {...sz} />;  // Reset
export const IconCompass   = () => <Compass   {...sz} />;  // Tour
export const IconBook      = () => <BookOpen  {...sz} />;  // Notation
