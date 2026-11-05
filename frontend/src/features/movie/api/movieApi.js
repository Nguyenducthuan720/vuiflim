import { api } from '../../../shared/api/httpClient.js';
export const fetchMovie = (slug) => api('/catalog/kkphim/movies/' + encodeURIComponent(slug));
export const fetchMovieSeasons = (slug) =>
  api('/catalog/kkphim/movies/' + encodeURIComponent(slug) + '/seasons');
