import { useEffect, useState } from 'react';
export function useHeroCarousel(movies, paused = false) {
  const [index, setIndex] = useState(0),
    [manualPause, setManualPause] = useState(false),
    [reduced, setReduced] = useState(false),
    [hidden, setHidden] = useState(false);
  const signature = movies.map((m) => m.id).join('|');
  useEffect(() => setIndex(0), [signature]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    update();
    visibility();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  const running = !paused && !manualPause && !reduced && !hidden && movies.length > 1;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % movies.length), 6000);
    return () => clearTimeout(timer);
  }, [index, running, signature]);
  const goTo = (i) => setIndex((i + movies.length) % movies.length);
  return {
    index: movies.length ? index % movies.length : 0,
    goTo,
    manualPause,
    setManualPause,
    running,
  };
}
