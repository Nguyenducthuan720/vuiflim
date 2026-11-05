import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { migrate } from '../src/database/migrate.js';
let db, pool, server, base, cookie, adminCookie, id, otherCookie;
const origin = 'http://localhost:5173';
const movie = {
  title: 'Integration Film',
  original: 'Integration Film',
  year: 2025,
  genre: 'Tài liệu',
  country: 'Việt Nam',
  rating: 8,
  duration: 12,
  type: 'series',
  description: 'A test record, never seeded in production.',
  director: 'Director',
  cast: '',
  poster: '/media/poster.jpg',
  backdrop: '/media/backdrop.jpg',
  license: 'Test fixture only',
  featured: true,
  published: false,
  episodeList: [
    { number: 1, title: 'Episode 1', videoUrl: '/media/one.mp4' },
    { number: 2, title: 'Episode 2', videoUrl: 'https://example.com/two.m3u8' },
  ],
};
async function request(path, method = 'GET', body, token = cookie, requestOrigin = origin) {
  const res = await fetch(base + path, {
    method,
    headers: {
      Origin: requestOrigin,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Cookie: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: res.status,
    data: await res.json(),
    cookie: res.headers.get('set-cookie')?.split(';')[0],
    headers: res.headers,
  };
}
before(async () => {
  if (process.env.TEST_DATABASE_URL) {
    if (!new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test'))
      throw Error('TEST_DATABASE_URL must point to a dedicated database ending in _test.');
    pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await migrate(pool);
    await migrate(pool);
    assert.equal(
      Number((await pool.query('SELECT COUNT(*) AS total FROM users')).rows[0].total),
      0,
      'Test database must be empty.',
    );
  } else {
    db = new PGlite();
    await db.exec(
      await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8'),
    );
    await db.exec(
      await readFile(new URL('../migrations/002_catalog_comments.sql', import.meta.url), 'utf8'),
    );
    const query = async (sql, params = []) => {
      const result = await db.query(sql, params);
      return { ...result, rowCount: result.affectedRows ?? result.rows.length };
    };
    pool = { query, connect: async () => ({ query, release() {} }) };
  }
  const app = createApp(pool, {
    origin,
    secure: false,
    kkphim: {
      detail: async (slug) => {
        if (slug === 'missing') {
          const e = Error('Không tìm thấy phim.');
          e.status = 404;
          throw e;
        }
        return { id: slug, title: 'Catalog Fixture' };
      },
    },
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
  const uid = randomUUID();
  await pool.query('INSERT INTO users(id,name,email,password,role) VALUES ($1,$2,$3,$4,$5)', [
    uid,
    'Admin',
    'admin@example.com',
    await argon2.hash('admin-password-123'),
    'admin',
  ]);
  adminCookie = (
    await request(
      '/auth/login',
      'POST',
      { email: 'admin@example.com', password: 'admin-password-123' },
      null,
    )
  ).cookie;
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await db?.close();
  if (process.env.TEST_DATABASE_URL && pool) await pool.end();
});
test('catalog starts empty and health checks SQL', async () => {
  assert.equal((await request('/health')).status, 200);
  assert.deepEqual((await request('/movies')).data, []);
});
test('registration, cookie security, duplicates and invalid input', async () => {
  assert.equal(
    (await request('/auth/register', 'POST', { name: 'A', email: 'bad', password: 'short' }))
      .status,
    400,
  );
  const r = await request('/auth/register', 'POST', {
    name: 'Viewer',
    email: 'VIEWER@example.com',
    password: 'viewer-password',
  });
  assert.equal(r.status, 201);
  cookie = r.cookie;
  assert.equal(r.data.role, 'user');
  assert.equal(r.data.email, 'viewer@example.com');
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  assert.match(r.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal(
    (
      await request('/auth/register', 'POST', {
        name: 'B',
        email: 'viewer@example.com',
        password: 'other-password',
      })
    ).status,
    409,
  );
  assert.equal(
    (await request('/auth/login', 'POST', { email: 'viewer@example.com', password: 'incorrect' }))
      .status,
    401,
  );
  assert.equal((await request('/me')).data.name, 'Viewer');
});
test('CSRF and admin boundaries', async () => {
  assert.equal((await request('/admin/movies', 'POST', movie, null)).status, 401);
  assert.equal((await request('/admin/movies', 'POST', movie)).status, 403);
  assert.equal(
    (await request('/auth/logout', 'POST', undefined, cookie, 'https://evil.example')).status,
    403,
  );
  assert.equal(
    (
      await request(
        '/admin/movies',
        'POST',
        { ...movie, poster: 'javascript:alert(1)' },
        adminCookie,
      )
    ).status,
    400,
  );
});
test('admin creates draft, edits and publishes; episode playback is separate', async () => {
  const r = await request('/admin/movies', 'POST', movie, adminCookie);
  assert.equal(r.status, 201);
  id = r.data.id;
  assert.equal(r.data.episodes, 2);
  assert.deepEqual((await request('/movies')).data, []);
  assert.equal((await request('/movies/' + id)).status, 404);
  assert.equal(
    (await request('/admin/movies/' + id, 'PUT', { ...movie, published: true }, adminCookie))
      .status,
    200,
  );
  const list = (await request('/movies?q=Integration&genre=' + encodeURIComponent('Tài liệu')))
    .data;
  assert.equal(list.length, 1);
  assert.equal(list[0].episodeList[0].videoUrl, undefined);
  assert.equal((await request(`/movies/${id}/playback/1`)).data.url, '/media/one.mp4');
  assert.equal(
    (await request(`/movies/${id}/playback/2`)).data.url,
    'https://example.com/two.m3u8',
  );
  assert.equal((await request(`/movies/${id}/playback/3`)).status, 404);
});
test('favorite requests are idempotent and history validates episode', async () => {
  assert.equal((await request('/favorites/' + id, 'PUT')).status, 200);
  await request('/favorites/' + id, 'PUT');
  assert.deepEqual((await request('/library')).data.favorites, [id]);
  assert.equal((await request('/history/' + id, 'PUT', { position: 45, episode: 2 })).status, 200);
  assert.equal((await request('/library')).data.history[0].position, 45);
  assert.equal((await request('/history/' + id, 'PUT', { position: -1, episode: 2 })).status, 400);
  assert.equal((await request('/history/' + id, 'PUT', { position: 1, episode: 5 })).status, 400);
  await request('/favorites/' + id, 'DELETE');
  assert.deepEqual((await request('/library')).data.favorites, []);
});
test('comments persist as text and can only be removed by owner/admin', async () => {
  assert.equal(
    (
      await request('/movies/' + id + '/reviews', 'POST', {
        body: '<script>alert(1)</script>',
        rating: 8,
      })
    ).status,
    201,
  );
  const review = (await request('/movies/' + id + '/reviews')).data[0];
  assert.equal(review.body, '<script>alert(1)</script>');
  otherCookie = (
    await request(
      '/auth/register',
      'POST',
      { name: 'Other', email: 'other@example.com', password: 'other-password' },
      null,
    )
  ).cookie;
  assert.equal(
    (await request('/reviews/' + review.id, 'DELETE', undefined, otherCookie)).status,
    404,
  );
  assert.deepEqual((await request('/library', 'GET', undefined, otherCookie)).data.history, []);
  assert.equal(
    (await request('/reviews/' + review.id, 'DELETE', undefined, adminCookie)).status,
    200,
  );
});
test('malformed IDs, invalid episodes and SQL-like search do not crash', async () => {
  assert.equal((await request('/movies/not-a-uuid')).status, 404);
  assert.equal((await request(`/movies/${id}/playback/invalid`)).status, 404);
  assert.equal((await request(`/movies/${id}/playback/1.5`)).status, 404);
  assert.deepEqual((await request('/movies?q=' + encodeURIComponent("' OR 1=1 --"))).data, []);
  assert.equal(
    (
      await request(
        '/admin/movies',
        'POST',
        { ...movie, episodeList: [{ ...movie.episodeList[0], number: 2 }] },
        adminCookie,
      )
    ).status,
    400,
  );
});
test('catalog comments persist per slug and enforce owner/admin deletion', async () => {
  const path = '/catalog/kkphim/movies/catalog-fixture/comments';
  assert.equal((await request(path, 'POST', { body: 'hello' }, null)).status, 401);
  assert.equal((await request(path, 'POST', { body: '   ' })).status, 400);
  assert.equal(
    (await request('/catalog/kkphim/movies/missing/comments', 'POST', { body: 'hello' })).status,
    404,
  );
  assert.equal(
    (await request(path, 'POST', { body: '<script>text stays plain</script>' })).status,
    201,
  );
  const list = await request(path);
  assert.equal(list.data.total, 1);
  assert.equal(list.data.results[0].body, '<script>text stays plain</script>');
  assert.equal((await request('/catalog/kkphim/movies/another-film/comments')).data.total, 0);
  assert.equal((await request(path + '?page=0')).status, 400);
  const commentId = list.data.results[0].id;
  assert.equal(
    (await request('/catalog-comments/' + commentId, 'DELETE', undefined, otherCookie)).status,
    404,
  );
  assert.equal(
    (await request('/catalog-comments/' + commentId, 'DELETE', undefined, cookie)).status,
    200,
  );
  await request(path, 'POST', { body: 'Can be moderated' });
  const second = (await request(path)).data.results[0];
  assert.equal(
    (await request('/catalog-comments/' + second.id, 'DELETE', undefined, adminCookie)).status,
    200,
  );
  assert.equal((await request(path)).data.total, 0);
});
test('password changes revoke all sessions, logout revokes cookies', async () => {
  assert.equal(
    (
      await request('/auth/password', 'PATCH', {
        currentPassword: 'viewer-password',
        newPassword: 'changed-password',
      })
    ).status,
    200,
  );
  assert.equal((await request('/me')).data, null);
  const login = await request(
    '/auth/login',
    'POST',
    { email: 'viewer@example.com', password: 'changed-password' },
    null,
  );
  cookie = login.cookie;
  assert.equal(login.status, 200);
  assert.equal((await request('/auth/logout', 'POST')).status, 200);
  assert.equal((await request('/library')).status, 401);
});
test('delete movie cascades all dependent records', async () => {
  assert.equal(
    (await request('/admin/movies/' + id, 'DELETE', undefined, adminCookie)).status,
    200,
  );
  assert.equal((await request('/movies/' + id)).status, 404);
  assert.equal((await pool.query('SELECT * FROM history')).rows.length, 0);
  assert.equal((await pool.query('SELECT * FROM episodes')).rows.length, 0);
});
