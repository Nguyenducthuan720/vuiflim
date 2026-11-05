import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { groupSeasons, seasonTitle } from '../src/integrations/kkphim/kkphim.seasons.js';
import { createKkphimClient } from '../src/integrations/kkphim/kkphim.client.js';
import { createApp } from '../src/app.js';
const part = (n) => ({
  slug: 'story-season-' + n,
  name: `Câu Chuyện (Phần ${n})`,
  origin_name: `The Story (Season ${n})`,
  year: 2020 + n,
  tmdb: { id: '100', type: 'tv', season: n },
});
test('season grouping uses shared TV identity and excludes spin-offs/remakes', () => {
  const results = groupSeasons(part(2), [
    part(5),
    part(1),
    part(2),
    part(3),
    { ...part(4), slug: 'different-remake', tmdb: { id: '200', type: 'tv', season: 4 } },
    {
      slug: 'making-of-story',
      name: 'Hậu trường',
      origin_name: 'Making of The Story',
      tmdb: { id: '300', type: 'movie' },
    },
  ]);
  assert.deepEqual(
    results.map((s) => s.seasonNumber),
    [1, 2, 3, 5],
  );
  assert.equal(results.filter((s) => s.current).length, 1);
  assert.equal(results[1].id, 'story-season-2');
  assert.equal(seasonTitle('The Story (Season 12)').base, 'The Story');
  assert.equal(seasonTitle('Câu Chuyện (Phần 2)').number, 2);
  const noId = (n) => ({ ...part(n), tmdb: {} });
  assert.deepEqual(
    groupSeasons(noId(1), [
      noId(2),
      { ...noId(3), slug: 'spin-off', origin_name: 'The Story: Spin-off (Season 3)' },
    ]).map((s) => s.seasonNumber),
    [1, 2],
  );
});
test('season endpoint searches provider and keeps current season when one query fails', async (t) => {
  const provider = createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    res.setHeader('Content-Type', 'application/json');
    if (u.pathname.startsWith('/phim/')) {
      res.end(JSON.stringify({ status: true, movie: part(2), episodes: [] }));
      return;
    }
    if (u.searchParams.get('keyword') === 'Câu Chuyện') {
      res.writeHead(500);
      res.end('{}');
      return;
    }
    res.end(
      JSON.stringify({
        status: 'success',
        data: {
          items: [part(4), part(1), part(3), part(2)],
          params: { pagination: { totalItems: 4, totalItemsPerPage: 64 } },
        },
      }),
    );
  });
  await new Promise((r) => provider.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => provider.close(r)));
  const client = createKkphimClient({ baseUrl: `http://127.0.0.1:${provider.address().port}` });
  const app = createApp(
    { query: async () => ({ rows: [] }) },
    { origin: 'http://localhost:5173', kkphim: client },
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}/api/catalog/kkphim/movies/`;
  const response = await fetch(base + 'story-season-2/seasons'),
    data = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(
    data.results.map((s) => s.seasonNumber),
    [1, 2, 3, 4],
  );
  assert.equal(data.partial, true);
  assert.equal((await fetch(base + 'invalid%2Fslug/seasons')).status, 400);
});
