/**
 * SolvePage — wraps the existing solver app in a route.
 */
import { CubeProvider } from '../hooks/useCubeState.jsx';
import { AppInner } from '../App.jsx';

export default function SolvePage() {
  return (
    <div className="solve-page" style={{ '--page-footer-h': '42px' }}>
      <CubeProvider>
        <AppInner />
      </CubeProvider>
    </div>
  );
}
