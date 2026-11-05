import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/validation/schemas.js';
import { createTmdbClient } from '../../integrations/tmdb/tmdb.client.js';
const listSchema = z.object({
  type: z.enum(['movie', 'series']).default('movie'),
  q: z.string().trim().max(150).default(''),
  page: z.coerce.number().int().min(1).max(500).default(1),
  sort: z.enum(['popular', 'top_rated']).default('popular'),
});
export function catalogRoutes(client = createTmdbClient()) {
  const router = Router();
  router.get('/status', (req, res) => res.json({ configured: client.configured() }));
  router.get('/movies', async (req, res) =>
    res.json(await client.list(validate(listSchema, req.query))),
  );
  router.get('/movies/:type/:id', async (req, res) => {
    const type = validate(z.enum(['movie', 'series']), req.params.type),
      id = validate(z.coerce.number().int().positive().max(2147483647), req.params.id);
    res.json(await client.detail(type, id));
  });
  return router;
}
