import { createAdminRepository } from './admin.repository.js';

import { movieService } from '../movies/movies.service.js';
import { movieSchema, validate } from '../../shared/validation/schemas.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createAdminController(pool) {
  const repository = createAdminRepository(pool);
  const movies = movieService(pool);
  return {
    listMovies: async (req, res) => res.json(await movies.list(true)),
    createMovie: async (req, res) =>
      res.status(201).json(await movies.save(validate(movieSchema, req.body))),
    updateMovie: async (req, res) =>
      res.json(await movies.save(validate(movieSchema, req.body), req.movie.id)),
    deleteMovie: async (req, res) => {
      await repository.deleteMovie([req.movie.id]);
      res.json({ ok: true });
    },
    listReviews: async (req, res) => res.json((await repository.listAllReviews([])).rows),
  };
}
