import { pool, query } from './database/pool.js';
import { createApp } from './app.js';
await pool.query('SELECT name FROM schema_migrations LIMIT 1');
const app = createApp(pool);
const server = app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () =>
  console.log(`VuiPhim API listening on port ${process.env.PORT || 3001}`),
);
const cleanup = setInterval(
  () =>
    pool
      .query('DELETE FROM sessions WHERE expires<$1', [Date.now()])
      .catch((e) => console.error('Session cleanup:', e.message)),
  3600000,
);
cleanup.unref();
async function shutdown() {
  clearInterval(cleanup);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
