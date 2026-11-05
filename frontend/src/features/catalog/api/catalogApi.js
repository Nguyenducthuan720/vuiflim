import { api } from '../../../shared/api/httpClient.js';
export const fetchCatalogOptions = () => api('/catalog/kkphim/options');
export const fetchCatalog = (params) =>
  api('/catalog/kkphim/movies?' + new URLSearchParams(params));
