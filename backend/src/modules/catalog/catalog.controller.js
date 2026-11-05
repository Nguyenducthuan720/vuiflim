import { validate } from '../../shared/validation/schemas.js';
import { catalogQuerySchema, movieSlugSchema } from './catalog.schemas.js';
export function createCatalogController(client) {
  return {
    seasons: async (req, res) =>
      res.json(await client.seasons(validate(movieSlugSchema, req.params.slug))),
    options: async (req, res) => res.json(await client.options()),
    list: async (req, res) => res.json(await client.list(validate(catalogQuerySchema, req.query))),
    detail: async (req, res) =>
      res.json(await client.detail(validate(movieSlugSchema, req.params.slug))),
  };
}
