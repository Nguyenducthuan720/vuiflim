import { createLibraryRepository } from './library.repository.js';

import { movieService } from '../movies/movies.service.js';
import { historySchema, validate } from '../../shared/validation/schemas.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createLibraryController(pool) {
  const repository = createLibraryRepository(pool);
  const movies = movieService(pool);
  return {
    getLibrary: async (req, res) => {
      const favorites = await repository.listFavorites([req.user.id]);
      const history = await repository.listHistory([req.user.id]);
      res.json({ favorites: favorites.rows.map((r) => r.movie_id), history: history.rows });
    },
    saveFavorite: async (req, res) => {
      await repository.saveFavorite([req.user.id, req.movie.id]);
      res.json({ saved: true });
    },
    removeFavorite: async (req, res) => {
      await repository.removeFavorite([req.user.id, req.movie.id]);
      res.json({ saved: false });
    },
    saveProgress: async (req, res) => {
      const d = validate(historySchema, req.body);
      if (d.episode > req.movie.episodes)
        return res.status(400).json({ error: 'Tập phim không tồn tại.' });
      await repository.saveProgress([req.user.id, req.movie.id, d.position, d.episode, Date.now()]);
      res.json({ ok: true });
    },
    clearHistory: async (req, res) => {
      await repository.clearHistory([req.user.id]);
      res.json({ ok: true });
    },
  };
}
