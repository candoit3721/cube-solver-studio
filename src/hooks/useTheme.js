import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'theme-mode';
const MODES = ['auto', 'dark', 'light'];

function isDaytime(lat) {
  const hour = new Date().getHours();
  const absLat = Math.abs(lat);
  const sunrise = 6 - (absLat / 90) * 1.5;
  const sunset  = 20 + (absLat / 90) * 1.5;
  return hour >= sunrise && hour < sunset;
}

function resolveEffective(mode, geo) {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  // auto
  if (geo !== null) return isDaytime(geo.lat) ? 'light' : 'dark';
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    if (mq.matches) return 'light';
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20 ? 'light' : 'dark';
}

export default function useTheme() {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(stored) ? stored : 'auto';
  });
  const [geo, setGeo] = useState(null);
  const intervalRef = useRef(null);

  // Request geolocation once on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        pos => setGeo({ lat: pos.coords.latitude }),
        () => {} // silently ignore denial
      );
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Apply theme and set up auto-refresh interval
  useEffect(() => {
    const apply = () => {
      const effective = resolveEffective(mode, geo);
      document.documentElement.setAttribute('data-theme', effective);
    };

    apply();

    if (mode === 'auto') {
      intervalRef.current = setInterval(apply, 60_000);
    }
    return () => clearInterval(intervalRef.current);
  }, [mode, geo]);

  function cycleMode() {
    setMode(prev => {
      const next = MODES[(MODES.indexOf(prev) + 1) % MODES.length];
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return { mode, cycleMode };
}
