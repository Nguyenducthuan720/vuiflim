import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { createAdminController } from './admin.controller.js';
import { findMovie } from '../movies/movies.middleware.js';
export function adminRoutes(pool) {
  const router = Router(),
    find = findMovie(pool),
    controller = createAdminController(pool);
  router.use('/admin', requireAuth, requireAdmin);
  router.get('/admin/movies', controller.listMovies);
  router.post('/admin/movies', controller.createMovie);
  router.put('/admin/movies/:id', find, controller.updateMovie);
  router.delete('/admin/movies/:id', find, controller.deleteMovie);
  router.get('/admin/reviews', controller.listReviews);
  return router;
}
