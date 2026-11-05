import { useEffect, useState } from 'react';
function current() {
  const match = window.location.pathname.match(/^\/phim\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  return match
    ? {
        slug: match[1],
        movie: window.history.state?.movie || { id: match[1] },
        autoPlay: new URLSearchParams(window.location.search).get('xem') === '1',
      }
    : null;
}
export function useMovieRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const update = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  function openMovie(movie, play = false) {
    window.history.pushState(
      { movie },
      '',
      `/phim/${encodeURIComponent(movie.id)}${play ? '?xem=1' : ''}`,
    );
    setRoute(current());
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function leaveMovie() {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
      setRoute(null);
    }
  }
  return { route, openMovie, leaveMovie };
}
