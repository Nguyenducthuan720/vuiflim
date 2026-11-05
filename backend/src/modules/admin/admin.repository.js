// SQL persistence boundary for the admin feature.
export function createAdminRepository(pool) {
  return {
    deleteMovie: (parameters = []) => pool.query('DELETE FROM movies WHERE id=$1', parameters),
    listAllReviews: (parameters = []) =>
      pool.query(
        'SELECT reviews.*,users.name,movies.title FROM reviews JOIN users ON users.id=reviews.user_id JOIN movies ON movies.id=reviews.movie_id ORDER BY created DESC LIMIT 200',
        parameters,
      ),
  };
}
