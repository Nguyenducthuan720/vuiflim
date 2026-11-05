// SQL persistence boundary for the movies feature.
export function createMoviesRepository(pool) {
  return {
    findEpisode: (parameters = []) =>
      pool.query(
        'SELECT number,title,video_url FROM episodes WHERE movie_id=$1 AND number=$2',
        parameters,
      ),
  };
}
