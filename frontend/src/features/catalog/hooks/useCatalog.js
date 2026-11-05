import { useState, useEffect } from 'react';
import { fetchCatalogOptions, fetchCatalog } from '../api/catalogApi.js';
export function useCatalog(requestedType, requestedQuery, onOpenMovie) {
  const [draft, setDraft] = useState(''),
    [q, setQ] = useState(''),
    [type, setType] = useState(requestedType),
    [page, setPage] = useState(1),
    [category, setCategory] = useState(''),
    [country, setCountry] = useState(''),
    [year, setYear] = useState(''),
    [sort, setSort] = useState('modified.time'),
    [options, setOptions] = useState({ genres: [], countries: [] }),
    [optionError, setOptionError] = useState(''),
    [data, setData] = useState({ results: [], totalPages: 1, totalResults: 0 }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setType(requestedType);
    setQ(requestedQuery);
    setDraft(requestedQuery);
    setPage(1);
    setCategory('');
    setCountry('');
    setYear('');
  }, [requestedType, requestedQuery]);
  useEffect(() => {
    let active = true;
    fetchCatalogOptions()
      .then((d) => {
        if (active) {
          setOptions(d);
          setOptionError('');
        }
      })
      .catch((e) => {
        if (active) setOptionError(e.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      q,
      type,
      page: String(page),
      category,
      country,
      year,
      sort,
    });
    fetchCatalog(params)
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
  }, [q, type, page, category, country, year, sort, retry]);
  function filter(set, value) {
    set(value);
    setPage(1);
  }
  function reset() {
    setQ('');
    setDraft('');
    setType('all');
    setCategory('');
    setCountry('');
    setYear('');
    setSort('modified.time');
    setPage(1);
  }
  function open(movie, play = false) {
    onOpenMovie(movie, play);
  }
  const heroes =
    !q && !category && !country && !year && page === 1
      ? data.results.filter((m) => m.backdrop || m.poster).slice(0, 5)
      : [];
  const changePage = (p) => {
    setPage(p);
    document.getElementById('browse-catalog')?.scrollIntoView({ behavior: 'smooth' });
  };
  return {
    draft,
    setDraft,
    q,
    setQ,
    type,
    setType,
    page,
    category,
    country,
    year,
    sort,
    options,
    optionError,
    data,
    loading,
    error,
    setRetry,
    filter,
    setCategory,
    setCountry,
    setYear,
    setSort,
    reset,
    open,
    heroes,
    changePage,
  };
}
