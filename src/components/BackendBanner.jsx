/**
 * BackendBanner — flow element shown when the backend API is unreachable.
 * Appears between NavHeader and main content; polls every 5 s.
 * Sets --backend-banner-h on <html> so fixed-position solve-page elements
 * can shift down accordingly.
 */
import { useState, useEffect, useRef } from 'react';
import { checkHealth } from '../api/cubeApi.js';
import '../styles/OfflineBanner.css';

const BANNER_H = '32px';

export default function BackendBanner() {
  const [offline, setOffline] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const ok = await checkHealth();
      if (!cancelled) setOffline(!ok);
    };
    poll();
    intervalRef.current = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--backend-banner-h',
      offline ? BANNER_H : '0px'
    );
  }, [offline]);

  if (!offline) return null;

  return (
    <div className="backend-banner" role="alert">
      <span className="offline-icon">⚠</span>
      <span className="offline-text">
        Server unavailable — start the backend to enable solving.
      </span>
    </div>
  );
}
