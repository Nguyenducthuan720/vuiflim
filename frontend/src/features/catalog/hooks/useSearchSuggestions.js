import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue.js';
import { fetchCatalog } from '../api/catalogApi.js';
export function useSearchSuggestions(value, enabled) {
  const keyword = value.trim(),
    debounced = useDebouncedValue(keyword, 300);
  const [result, setResult] = useState({ keyword: '', movies: [], total: 0 }),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (!enabled || !debounced) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    fetchCatalog({ q: debounced, page: 1, type: 'all' })
      .then((data) => {
        if (active)
          setResult({
            keyword: debounced,
            movies: data.results.slice(0, 6),
            total: data.totalResults,
          });
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setResult({ keyword: debounced, movies: [], total: 0 });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debounced, enabled]);
  return {
    movies: result.keyword === keyword ? result.movies : [],
    total: result.keyword === keyword ? result.total : 0,
    loading: Boolean(keyword) && enabled && (debounced !== keyword || loading),
    error: result.keyword === keyword ? error : '',
  };
}
