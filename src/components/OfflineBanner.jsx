/**
 * OfflineBanner — flow element shown when the browser loses connectivity.
 * Appears between NavHeader and main content; dismissible.
 */
import { useState, useEffect } from 'react';
import '../styles/OfflineBanner.css';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOffline(true); setDismissed(false); };
    const goOnline  = () => { setOffline(false); setDismissed(false); };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div className="offline-banner" role="alert">
      <span className="offline-icon">⬛</span>
      <span className="offline-text">
        You're offline — the cube solver won't work until you reconnect.
      </span>
      <button
        className="offline-dismiss"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  );
}
