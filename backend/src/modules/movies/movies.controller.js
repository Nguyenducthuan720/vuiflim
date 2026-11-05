import { createMoviesRepository } from './movies.repository.js';

import { movieService } from '../movies/movies.service.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createMoviesController(pool) {
  const repository = createMoviesRepository(pool);
  const movies = movieService(pool);
  return {
    listMovies: async (req, res) => {
      let list = await movies.list();
      const { q, genre, type, country, year, sort } = req.query;
      const norm = (s) =>
        s
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd');
      if (q) list = list.filter((m) => norm(m.title + ' ' + m.original).includes(norm(String(q))));
      for (const [key, value] of Object.entries({ genre, type, country }))
        if (value) list = list.filter((m) => m[key] === value);
      if (year) list = list.filter((m) => m.year === +year);
      if (sort === 'year') list.sort((a, b) => b.year - a.year);
      if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
      res.json(list);
    },
    getMovie: (req, res) => res.json(req.movie),
    getPlayback: async (req, res) => {
      const number = Number(req.params.episode);
      if (!Number.isInteger(number) || number < 1 || number > 500)
        return res.status(404).json({ error: 'Tập phim không tồn tại.' });
      const { rows } = await repository.findEpisode([req.movie.id, number]);
      if (!rows.length) return res.status(404).json({ error: 'Tập phim không tồn tại.' });
      res.json({ number: rows[0].number, title: rows[0].title, url: rows[0].video_url });
    },
  };
}
