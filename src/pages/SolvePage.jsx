/**
 * SolvePage — wraps the existing solver app in a route.
 */
import { CubeProvider } from '../hooks/useCubeState.jsx';
import { AppInner } from '../App.jsx';

export default function SolvePage() {
  return (
    <CubeProvider>
      <AppInner />
    </CubeProvider>
  );
}
