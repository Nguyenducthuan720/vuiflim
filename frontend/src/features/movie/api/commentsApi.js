import { api } from '../../../shared/api/httpClient.js';
export const fetchComments = (slug, page) =>
  api(`/catalog/kkphim/movies/${encodeURIComponent(slug)}/comments?page=${page}`);
export const createComment = (slug, body) =>
  api(`/catalog/kkphim/movies/${encodeURIComponent(slug)}/comments`, 'POST', { body });
export const deleteComment = (id) => api(`/catalog-comments/${id}`, 'DELETE');
