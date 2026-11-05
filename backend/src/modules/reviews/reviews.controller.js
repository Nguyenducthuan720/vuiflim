import { createReviewsRepository } from './reviews.repository.js';
import { randomUUID } from 'node:crypto';
import { movieService } from '../movies/movies.service.js';
import { reviewSchema, validate } from '../../shared/validation/schemas.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createReviewsController(pool) {
  const repository = createReviewsRepository(pool);
  const movies = movieService(pool);
  return {
    listReviews: async (req, res) => res.json((await repository.listByMovie([req.movie.id])).rows),
    createReview: async (req, res) => {
      const d = validate(reviewSchema, req.body);
      await repository.createReview([
        randomUUID(),
        req.user.id,
        req.movie.id,
        d.body,
        d.rating,
        Date.now(),
      ]);
      res.status(201).json({ ok: true });
    },
    deleteReview: async (req, res) => {
      if (!uuid.test(req.params.id))
        return res.status(404).json({ error: 'Không tìm thấy bình luận.' });
      const result = await repository.deleteOwnedReview([
        req.params.id,
        req.user.id,
        req.user.role === 'admin',
      ]);
      if (!result.rowCount) return res.status(404).json({ error: 'Không tìm thấy bình luận.' });
      res.json({ ok: true });
    },
  };
}
