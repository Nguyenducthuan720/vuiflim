import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createTmdbClient } from '../src/integrations/tmdb/tmdb.client.js';
import { createApp } from '../src/app.js';

test('TMDB integration over HTTP: pagination, search, details, cache and provider failures', async (t) => {
  const calls = [];
  const provider = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    calls.push({ url, auth: req.headers.authorization });
    res.setHeader('Content-Type', 'application/json');
    const query = url.searchParams.get('query');
    if (query === 'bad-token') {
      res.writeHead(401);
      res.end('{}');
      return;
    }
    if (query === 'rate') {
      res.writeHead(429);
      res.end('{}');
      return;
    }
    if (query === 'failure') {
      res.writeHead(500);
      res.end('{}');
      return;
    }
    if (query === 'broken') {
      res.end('invalid json');
      return;
    }
    if (query === 'slow') {
      setTimeout(() => res.end('{}'), 200);
      return;
    }
    const m = {
      id: 12,
      title: 'Phim thử nghiệm',
      original_title: 'Fixture',
      overview: 'Mô tả',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: '2024-01-01',
      vote_average: 8,
    };
    if (url.pathname === '/movie/12') {
      res.end(JSON.stringify({ ...m, genres: [{ name: 'Drama' }], runtime: 120 }));
      return;
    }
    res.end(
      JSON.stringify({
        results: [m, { ...m, id: 13, adult: true }, { ...m, id: 14, poster_path: null }],
        total_pages: 1000,
        total_results: 30000,
      }),
    );
  });
  await new Promise((r) => provider.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${provider.address().port}`;
  t.after(() => new Promise((r) => provider.close(r)));
  const client = createTmdbClient({ token: 'test-only-token', baseUrl, timeout: 1000 });
  const pool = { query: async () => ({ rows: [] }) };
  const app = createApp(pool, { origin: 'http://localhost:5173', tmdb: client });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(r)));
  const api = `http://127.0.0.1:${server.address().port}/api/catalog/tmdb`;
  const response = await fetch(api + '/movies?page=2');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.page, 2);
  assert.equal(data.totalPages, 500);
  assert.equal(data.results.length, 2);
  assert.equal(data.results[0].playable, false);
  assert.equal(data.results[1].poster, null);
  assert.match(data.results[0].poster, /https:\/\/image.tmdb.org/);
  assert.equal(calls[0].url.pathname, '/movie/popular');
  assert.equal(calls[0].url.searchParams.get('language'), 'vi-VN');
  assert.equal(calls[0].auth, 'Bearer test-only-token');
  assert.ok(!JSON.stringify(data).includes('test-only-token'));
  await fetch(api + '/movies?page=2');
  assert.equal(calls.length, 1, 'second request uses cache');
  await fetch(api + '/movies?type=series&q=hello');
  assert.equal(calls.at(-1).url.pathname, '/search/tv');
  assert.equal(calls.at(-1).url.searchParams.get('include_adult'), 'false');
  const detail = await (await fetch(api + '/movies/movie/12')).json();
  assert.equal(detail.duration, 120);
  assert.deepEqual(detail.genres, ['Drama']);
  assert.equal(detail.playable, false);
  for (const q of ['bad-token', 'rate', 'failure', 'broken']) {
    const r = await fetch(api + '/movies?q=' + q);
    assert.equal(r.status, 502);
    assert.ok(!(await r.text()).includes('test-only-token'));
  }
  assert.equal((await fetch(api + '/movies?page=501')).status, 400);
  assert.equal((await fetch(api + '/movies?type=wrong')).status, 400);
  assert.equal((await fetch(api + '/movies/movie/not-id')).status, 400);
  const timed = createTmdbClient({ token: 'test-only-token', baseUrl, timeout: 25 });
  await assert.rejects(
    () => timed.list({ q: 'slow' }),
    (e) => e.status === 502,
  );
  const missing = createTmdbClient({ token: '' });
  assert.equal(missing.configured(), false);
  await assert.rejects(
    () => missing.list(),
    (e) => e.status === 503,
  );
  const missingServer = createApp(pool, { origin: 'http://localhost:5173', tmdb: missing }).listen(
    0,
    '127.0.0.1',
  );
  await new Promise((r) => missingServer.once('listening', r));
  t.after(() => new Promise((r) => missingServer.close(r)));
  const missingResponse = await fetch(
    `http://127.0.0.1:${missingServer.address().port}/api/catalog/tmdb/movies`,
  );
  assert.equal(missingResponse.status, 503);
  assert.match((await missingResponse.json()).error, /TMDB_READ_ACCESS_TOKEN/);
});
