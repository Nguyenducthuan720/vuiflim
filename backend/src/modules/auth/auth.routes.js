import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from './auth.middleware.js';
import { createAuthController } from './auth.controller.js';
export function authRoutes(pool, secure) {
  const router = Router(),
    controller = createAuthController(pool, secure);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Thử quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  });
  router.post('/register', limiter, controller.register);
  router.post('/login', limiter, controller.login);
  router.post('/logout', controller.logout);
  router.patch('/password', requireAuth, controller.changePassword);
  return router;
}
