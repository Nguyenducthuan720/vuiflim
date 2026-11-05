// SQL persistence boundary for the library feature.
export function createLibraryRepository(pool) {
  return {
    listFavorites: (parameters = []) =>
      pool.query(
        'SELECT movie_id FROM favorites JOIN movies ON movies.id=favorites.movie_id WHERE user_id=$1 AND movies.published=TRUE',
        parameters,
      ),
    listHistory: (parameters = []) =>
      pool.query(
        'SELECT movie_id,position,episode,updated FROM history JOIN movies ON movies.id=history.movie_id WHERE user_id=$1 AND movies.published=TRUE ORDER BY updated DESC',
        parameters,
      ),
    saveFavorite: (parameters = []) =>
      pool.query(
        'INSERT INTO favorites(user_id,movie_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        parameters,
      ),
    removeFavorite: (parameters = []) =>
      pool.query('DELETE FROM favorites WHERE user_id=$1 AND movie_id=$2', parameters),
    saveProgress: (parameters = []) =>
      pool.query(
        'INSERT INTO history(user_id,movie_id,position,episode,updated) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(user_id,movie_id) DO UPDATE SET position=excluded.position,episode=excluded.episode,updated=excluded.updated',
        parameters,
      ),
    clearHistory: (parameters = []) =>
      pool.query('DELETE FROM history WHERE user_id=$1', parameters),
  };
}
