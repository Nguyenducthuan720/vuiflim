import { reviewsRoutes } from './modules/reviews/reviews.routes.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import express from 'express';
import { catalogCommentsRoutes } from './modules/reviews/catalogComments.routes.js';
import { moviesRoutes } from './modules/movies/movies.routes.js';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRoutes } from './modules/auth/auth.routes.js';
import { authMiddleware } from './modules/auth/auth.middleware.js';
import { publicUser } from './modules/auth/auth.helpers.js';

import { catalogRoutes } from './modules/catalog/tmdb.routes.js';
import { tvmazeRoutes } from './modules/catalog/tvmaze.routes.js';
import { kkphimRoutes } from './modules/catalog/catalog.routes.js';
export function createApp(pool, config = {}) {
  const origin = config.origin || process.env.APP_ORIGIN;
  if (!origin) throw Error('APP_ORIGIN is required.');
  const secure = config.secure ?? process.env.COOKIE_SECURE === 'true';
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 0));
  app.use(helmet());
  app.use(express.json({ limit: '128kb' }));
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin !== origin)
      return res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
    next();
  });
  app.get('/api/health', async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'postgresql' });
  });
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Bạn gửi yêu cầu quá nhanh. Vui lòng chờ một phút.' },
    }),
  );
  app.use('/api', authMiddleware(pool));
  app.use('/api/catalog/tmdb', catalogRoutes(config.tmdb));
  app.use('/api/catalog/tvmaze', tvmazeRoutes(config.tvmaze));
  app.use('/api/catalog/kkphim', kkphimRoutes(config.kkphim));
  app.use('/api', catalogCommentsRoutes(pool, config.kkphim));
  app.use('/api/auth', authRoutes(pool, secure));
  app.get('/api/me', (req, res) => res.json(req.user ? publicUser(req.user) : null));
  app.use('/api', moviesRoutes(pool));
  app.use('/api', reviewsRoutes(pool));
  app.use('/api', libraryRoutes(pool));
  app.use('/api', adminRoutes(pool));
  app.use((req, res) => res.status(404).json({ error: 'API không tồn tại.' }));
  app.use((err, req, res, next) => {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Email hoặc dữ liệu đã tồn tại.' });
    const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
    if (status >= 500) console.error('Request failed:', err.message);
    res.status(status).json({
      error:
        status === 502 || status === 503
          ? err.message
          : status >= 500
            ? 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
            : err.message,
    });
  });
  return app;
}
