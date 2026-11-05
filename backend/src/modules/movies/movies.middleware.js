import { movieService } from './movies.service.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function findMovie(pool) {
  const movies = movieService(pool);
  const find = async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Không tìm thấy phim.' });
    req.movie = await movies.get(req.params.id, req.user?.role === 'admin');
    if (!req.movie) return res.status(404).json({ error: 'Không tìm thấy phim.' });
    next();
  };

  return find;
}
