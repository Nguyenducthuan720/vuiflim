import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { createReviewsController } from './reviews.controller.js';
import { findMovie } from '../movies/movies.middleware.js';
export function reviewsRoutes(pool) {
  const router = Router(),
    find = findMovie(pool),
    controller = createReviewsController(pool);
  router.get('/movies/:id/reviews', find, controller.listReviews);
  router.post('/movies/:id/reviews', requireAuth, find, controller.createReview);
  router.delete('/reviews/:id', requireAuth, controller.deleteReview);
  return router;
}
