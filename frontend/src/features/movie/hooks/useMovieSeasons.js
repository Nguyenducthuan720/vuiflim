import { useEffect, useState } from 'react';
import { fetchMovieSeasons } from '../api/movieApi.js';
export function useMovieSeasons(slug) {
  const [data, setData] = useState({ results: [], partial: false }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchMovieSeasons(slug)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, retry]);
  return { ...data, loading, error, retry: () => setRetry((v) => v + 1) };
}
