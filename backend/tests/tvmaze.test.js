import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createTvmazeClient } from '../src/integrations/tvmaze/tvmaze.client.js';
import { createApp } from '../src/app.js';

test('TVmaze HTTP integration: no auth, index/search/details, cache, errors and empty final batch', async (t) => {
  const calls = [];
  const show = {
    id: 1,
    name: 'Fixture',
    premiered: '2020-01-01',
    summary: '<p>A <b>story</b> &amp; more</p>',
    rating: { average: 8 },
    image: {
      medium: 'https://static.tvmaze.com/poster.jpg',
      original: 'https://evil.example/image.jpg',
    },
    genres: ['Drama'],
    language: 'English',
    runtime: 50,
  };
  const provider = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    calls.push({ path: url.pathname, params: url.searchParams, auth: req.headers.authorization });
    res.setHeader('Content-Type', 'application/json');
    const q = url.searchParams.get('q');
    if (q === 'rate') {
      res.writeHead(429);
      res.end('{}');
      return;
    }
    if (q === 'failure') {
      res.writeHead(500);
      res.end('{}');
      return;
    }
    if (q === 'bad-json') {
      res.end('invalid');
      return;
    }
    if (q === 'slow') {
      setTimeout(() => res.end('[]'), 150);
      return;
    }
    if (url.searchParams.get('page') === '99' || url.pathname === '/shows/999') {
      res.writeHead(404);
      res.end('{}');
      return;
    }
    if (url.pathname === '/search/shows') {
      res.end(JSON.stringify([{ score: 1, show }]));
      return;
    }
    if (url.pathname === '/shows/1') {
      res.end(JSON.stringify(show));
      return;
    }
    res.end(
      JSON.stringify([
        show,
        { ...show, id: 2, rating: { average: null }, image: null, summary: null },
      ]),
    );
  });
  await new Promise((r) => provider.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => provider.close(r)));
  const baseUrl = `http://127.0.0.1:${provider.address().port}`,
    client = createTvmazeClient({ baseUrl, timeout: 1000 });
  const app = createApp(
    { query: async () => ({ rows: [] }) },
    { origin: 'http://localhost:5173', tvmaze: client },
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(r)));
  const api = `http://127.0.0.1:${server.address().port}/api/catalog/tvmaze`;
  const list = await (await fetch(api + '/shows?page=2')).json();
  assert.equal(list.page, 2);
  assert.equal(list.batchSize, 2);
  assert.equal(list.hasNext, true);
  assert.equal(list.results[0].source, 'tvmaze');
  assert.equal(list.results[0].playable, false);
  assert.equal(list.results[0].description, 'A story & more');
  assert.equal(list.results[0].backdrop, null);
  assert.equal(list.results[1].rating, null);
  assert.equal(list.results[1].poster, null);
  assert.equal(calls[0].params.get('page'), '1');
  assert.equal(calls[0].auth, undefined);
  await fetch(api + '/shows?page=2');
  assert.equal(calls.length, 1);
  const search = await (await fetch(api + '/shows?q=Dark')).json();
  assert.equal(search.hasNext, false);
  assert.equal(search.search, true);
  assert.equal(calls.at(-1).path, '/search/shows');
  assert.equal(calls.at(-1).params.get('q'), 'Dark');
  const detail = await (await fetch(api + '/shows/1')).json();
  assert.equal(detail.title, 'Fixture');
  assert.equal(detail.duration, 50);
  const end = await (await fetch(api + '/shows?page=100')).json();
  assert.deepEqual(end.results, []);
  assert.equal(end.hasNext, false);
  assert.equal((await fetch(api + '/shows/999')).status, 404);
  assert.equal((await fetch(api + '/shows/invalid')).status, 400);
  assert.equal((await fetch(api + '/shows?page=0')).status, 400);
  for (const q of ['rate', 'failure', 'bad-json'])
    assert.equal((await fetch(api + '/shows?q=' + q)).status, 502);
  await assert.rejects(
    () => createTvmazeClient({ baseUrl, timeout: 20 }).list({ q: 'slow' }),
    (e) => e.status === 502,
  );
});
