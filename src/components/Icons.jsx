/**
 * Icon wrappers using lucide-react — reliable, well-tested SVGs.
 */
import {
    Dices, Camera, Rotate3d, Pencil, Sparkles,
    RotateCcw, Sun, Moon, SunMoon,
} from 'lucide-react';

const sz = { size: 16, strokeWidth: 2 };

export const IconShuffle   = () => <Dices     {...sz} />;  // Scramble — dice = random
export const IconCamera    = () => <Camera    {...sz} />;  // Scan — camera
export const IconScan3D    = () => <Rotate3d  {...sz} />;  // 3D Scan — rotate in 3D
export const IconEdit      = () => <Pencil    {...sz} />;  // Edit
export const IconSparkle   = () => <Sparkles  {...sz} />;  // Solve
export const IconRotateCCW = () => <RotateCcw {...sz} />;  // Reset
export const IconSun       = () => <Sun       {...sz} />;  // Light theme
export const IconMoon      = () => <Moon      {...sz} />;  // Dark theme
export const IconAuto      = () => <SunMoon   {...sz} />;  // Auto theme
