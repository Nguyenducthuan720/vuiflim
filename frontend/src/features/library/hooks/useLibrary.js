import { useEffect, useState } from 'react';
import { api } from '../../../shared/api/httpClient.js';
export function useLibrary(user, view, requestLogin, notify) {
  const [movies, setMovies] = useState([]),
    [library, setLibrary] = useState({ favorites: [], history: [] }),
    [libraryError, setLibraryError] = useState('');
  async function sync() {
    if (!user) return;
    try {
      setLibrary(await api('/library'));
      setLibraryError('');
    } catch (e) {
      setLibraryError(e.message);
    }
  }
  async function load() {
    try {
      setMovies(await api('/movies'));
      setLibraryError('');
    } catch (e) {
      setLibraryError(e.message);
    }
  }
  useEffect(() => {
    if (user) {
      sync();
      load();
    } else {
      setLibrary({ favorites: [], history: [] });
      setMovies([]);
    }
  }, [user]);
  async function favorite(m) {
    if (!user) {
      requestLogin();
      return;
    }
    try {
      await api('/favorites/' + m.id, library.favorites.includes(m.id) ? 'DELETE' : 'PUT');
      await sync();
    } catch (e) {
      notify(e.message);
    }
  }
  const filtered = movies.filter((m) =>
    view === 'saved'
      ? library.favorites.includes(m.id)
      : view === 'history'
        ? library.history.some((h) => h.movie_id === m.id)
        : true,
  );
  if (view === 'history')
    filtered.sort(
      (a, b) =>
        Number(library.history.find((h) => h.movie_id === b.id)?.updated || 0) -
        Number(library.history.find((h) => h.movie_id === a.id)?.updated || 0),
    );
  return { library, libraryError, filtered, sync, load, favorite };
}
