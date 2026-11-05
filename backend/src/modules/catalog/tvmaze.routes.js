import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/validation/schemas.js';
import { createTvmazeClient } from '../../integrations/tvmaze/tvmaze.client.js';
const listSchema = z.object({
  q: z.string().trim().max(150).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  sort: z.enum(['default', 'rating']).default('default'),
});
export function tvmazeRoutes(client = createTvmazeClient()) {
  const router = Router();
  router.get('/shows', async (req, res) =>
    res.json(await client.list(validate(listSchema, req.query))),
  );
  router.get('/shows/:id', async (req, res) =>
    res.json(
      await client.detail(
        validate(z.coerce.number().int().positive().max(2147483647), req.params.id),
      ),
    ),
  );
  return router;
}
