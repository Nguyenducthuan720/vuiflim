import { Router } from 'express';

import { createMoviesController } from './movies.controller.js';
import { findMovie } from '../movies/movies.middleware.js';
export function moviesRoutes(pool) {
  const router = Router(),
    find = findMovie(pool),
    controller = createMoviesController(pool);
  router.get('/movies', controller.listMovies);
  router.get('/movies/:id', find, controller.getMovie);
  router.get('/movies/:id/playback/:episode', find, controller.getPlayback);
  return router;
}
