import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { createLibraryController } from './library.controller.js';
import { findMovie } from '../movies/movies.middleware.js';
export function libraryRoutes(pool) {
  const router = Router(),
    find = findMovie(pool),
    controller = createLibraryController(pool);
  router.get('/library', requireAuth, controller.getLibrary);
  router.put('/favorites/:id', requireAuth, find, controller.saveFavorite);
  router.delete('/favorites/:id', requireAuth, find, controller.removeFavorite);
  router.put('/history/:id', requireAuth, find, controller.saveProgress);
  router.delete('/history', requireAuth, controller.clearHistory);
  return router;
}
