import { useState, useEffect } from 'react';
import { fetchMovie } from '../api/movieApi.js';
export function useMovieDetails(movie, autoPlay) {
  const [detail, setDetail] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0),
    [serverIndex, setServerIndex] = useState(0),
    [episodeIndex, setEpisodeIndex] = useState(0),
    [playing, setPlaying] = useState(autoPlay),
    [episodeSearch, setEpisodeSearch] = useState('');
  useEffect(() => {
    let active = true;
    setDetail(null);
    setError('');
    fetchMovie(movie.id)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [movie.id, retry]);
  const m = detail || movie,
    server = detail?.servers[serverIndex],
    episode = server?.episodes[episodeIndex];
  return {
    detail,
    error,
    setRetry,
    serverIndex,
    setServerIndex,
    episodeIndex,
    setEpisodeIndex,
    playing,
    setPlaying,
    episodeSearch,
    setEpisodeSearch,
    m,
    server,
    episode,
  };
}
