import { Router } from 'express';
import { createKkphimClient } from '../../integrations/kkphim/kkphim.client.js';
import { createCatalogController } from './catalog.controller.js';
export function kkphimRoutes(client = createKkphimClient()) {
  const router = Router(),
    controller = createCatalogController(client);
  router.get('/options', controller.options);
  router.get('/movies', controller.list);
  router.get('/movies/:slug', controller.detail);
  router.get('/movies/:slug/seasons', controller.seasons);
  return router;
}
