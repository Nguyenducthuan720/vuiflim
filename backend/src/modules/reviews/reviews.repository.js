// SQL persistence boundary for the reviews feature.
export function createReviewsRepository(pool) {
  return {
    listByMovie: (parameters = []) =>
      pool.query(
        'SELECT reviews.id,users.name,reviews.body,reviews.rating,reviews.created FROM reviews JOIN users ON reviews.user_id=users.id WHERE movie_id=$1 ORDER BY created DESC LIMIT 200',
        parameters,
      ),
    createReview: (parameters = []) =>
      pool.query(
        'INSERT INTO reviews(id,user_id,movie_id,body,rating,created) VALUES ($1,$2,$3,$4,$5,$6)',
        parameters,
      ),
    deleteOwnedReview: (parameters = []) =>
      pool.query(
        'DELETE FROM reviews WHERE id=$1 AND (user_id=$2 OR $3=TRUE) RETURNING id',
        parameters,
      ),
  };
}
