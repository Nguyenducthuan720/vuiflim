import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../auth/auth.middleware.js';
import { createKkphimClient } from '../../integrations/kkphim/kkphim.client.js';
import { createCatalogCommentsController } from './catalogComments.controller.js';
export function catalogCommentsRoutes(pool, client = createKkphimClient()) {
  const router = Router(),
    controller = createCatalogCommentsController(pool, client);
  const limiter = rateLimit({
    windowMs: 60000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Bạn bình luận quá nhanh. Vui lòng chờ một phút.' },
  });
  router.get('/catalog/kkphim/movies/:slug/comments', controller.list);
  router.post('/catalog/kkphim/movies/:slug/comments', requireAuth, limiter, controller.create);
  router.delete('/catalog-comments/:id', requireAuth, controller.remove);
  return router;
}
