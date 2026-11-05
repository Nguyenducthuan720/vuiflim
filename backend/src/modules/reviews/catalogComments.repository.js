export function createCatalogCommentsRepository(pool) {
  return {
    list: (slug, limit, offset) =>
      pool.query(
        'SELECT c.id,c.user_id,c.body,c.created,u.name FROM catalog_comments c JOIN users u ON u.id=c.user_id WHERE c.provider=$1 AND c.movie_slug=$2 ORDER BY c.created DESC,c.id DESC LIMIT $3 OFFSET $4',
        ['kkphim', slug, limit, offset],
      ),
    count: (slug) =>
      pool.query(
        'SELECT COUNT(*) AS total FROM catalog_comments WHERE provider=$1 AND movie_slug=$2',
        ['kkphim', slug],
      ),
    create: (values) =>
      pool.query(
        'INSERT INTO catalog_comments(id,user_id,provider,movie_slug,movie_title,body,created) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        values,
      ),
    remove: (id, userId, isAdmin) =>
      pool.query(
        'DELETE FROM catalog_comments WHERE id=$1 AND (user_id=$2 OR $3=TRUE) RETURNING id',
        [id, userId, isAdmin],
      ),
  };
}
