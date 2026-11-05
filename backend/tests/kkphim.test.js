import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createKkphimClient } from '../src/integrations/kkphim/kkphim.client.js';
import { createApp } from '../src/app.js';
test('KKPhim HTTP: search, types, pagination, HLS servers, cache, validation and provider failures', async (t) => {
  const calls = [];
  const movie = {
    slug: 'test-film',
    name: 'Phim thử',
    origin_name: 'Fixture',
    year: 2025,
    poster_url: 'uploads/movies/2025/poster.jpg',
    thumb_url: 'https://cdn.example.com/image.jpg',
    content: '<p>A story</p>',
    actor: ['Actor'],
    director: ['Director'],
    category: [{ name: 'Drama' }],
    country: [{ name: 'VN' }],
    tmdb: { vote_average: 8 },
  };
  const provider = createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    calls.push(u);
    res.setHeader('Content-Type', 'application/json');
    const q = u.searchParams.get('keyword');
    if (u.pathname === '/the-loai' || u.pathname === '/quoc-gia') {
      res.end(
        JSON.stringify({ status: 'success', data: { items: [{ name: 'Drama', slug: 'drama' }] } }),
      );
      return;
    }
    if (q === 'failure' || q === 'rate') {
      res.writeHead(q === 'rate' ? 429 : 500);
      res.end('{}');
      return;
    }
    if (q === 'invalid') {
      res.end('bad json');
      return;
    }
    if (q === 'slow') {
      setTimeout(() => res.end('{}'), 150);
      return;
    }
    if (u.pathname === '/phim/missing') {
      res.end(JSON.stringify({ status: false }));
      return;
    }
    if (u.pathname.startsWith('/phim/')) {
      res.end(
        JSON.stringify({
          status: true,
          movie,
          episodes: [
            {
              server_name: 'Vietsub',
              server_data: [
                {
                  name: 'Tập 1',
                  link_m3u8: 'https://cdn.example.com/1.m3u8',
                  link_embed:
                    'https://player.phimapi.com/player/?url=https%3A%2F%2Fcdn.example.com%2F1.m3u8',
                },
                { name: 'Tập 2', link_m3u8: 'https://cdn.example.com/2.m3u8' },
                { name: 'Bad', link_m3u8: 'javascript:alert(1)' },
                { name: 'Embed only', link_embed: 'https://embed.example.com/' },
                {
                  name: 'Official embed only',
                  link_embed:
                    'https://player.phimapi.com/player/?url=https%3A%2F%2Fcdn.example.com%2F3.m3u8',
                },
                {
                  name: 'Unsafe inner URL',
                  link_embed: 'https://player.phimapi.com/player/?url=javascript%3Aalert(1)',
                },
              ],
            },
            {
              server_name: 'Lồng tiếng',
              server_data: [{ name: 'Full', link_m3u8: 'https://cdn.example.com/dub.m3u8' }],
            },
          ],
        }),
      );
      return;
    }
    const result = {
      items: [movie],
      params: { pagination: { totalItems: 25, totalItemsPerPage: 24, currentPage: 1 } },
    };
    res.end(
      JSON.stringify(
        u.pathname === '/danh-sach/phim-moi-cap-nhat'
          ? {
              status: true,
              items: [movie],
              pagination: { totalItems: 25, totalItemsPerPage: 24, totalPages: 2 },
            }
          : { status: 'success', data: result },
      ),
    );
  });
  await new Promise((r) => provider.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => provider.close(r)));
  const baseUrl = `http://127.0.0.1:${provider.address().port}`;
  const client = createKkphimClient({ baseUrl, timeout: 1000 });
  const app = createApp(
    { query: async () => ({ rows: [] }) },
    { origin: 'http://localhost:5173', kkphim: client },
  );
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}/api/catalog/kkphim`;
  const list = await (await fetch(base + '/movies')).json();
  assert.equal(list.results[0].title, 'Phim thử');
  assert.equal(list.totalPages, 2);
  assert.match(list.results[0].poster, /^https:/);
  assert.equal(list.results[0].poster, 'https://phimimg.com/uploads/movies/2025/poster.jpg');
  assert.equal(list.results[0].backdrop, 'https://cdn.example.com/image.jpg');
  await fetch(base + '/movies');
  assert.equal(calls.length, 1);
  const search = await (await fetch(base + '/movies?q=test')).json();
  assert.equal(search.totalPages, 2);
  assert.equal(calls.at(-1).pathname, '/v1/api/tim-kiem');
  assert.equal(calls.at(-1).searchParams.get('keyword'), 'test');
  await fetch(base + '/movies?type=phim-le');
  assert.equal(calls.at(-1).pathname, '/v1/api/danh-sach/phim-le');
  const detail = await (await fetch(base + '/movies/test-film')).json();
  assert.equal(detail.playable, true);
  assert.equal(detail.description, 'A story');
  assert.equal(detail.servers.length, 2);
  assert.equal(detail.servers[0].episodes.length, 3);
  assert.match(detail.servers[0].episodes[0].embedUrl, /^https:\/\/player\.phimapi\.com\/player\//);
  assert.equal(detail.servers[0].episodes[2].url, null);
  assert.ok(detail.servers[0].episodes[2].embedUrl);
  assert.notEqual(detail.servers[0].episodes[0].url, detail.servers[0].episodes[1].url);
  assert.equal(detail.servers[1].name, 'Lồng tiếng');
  assert.ok(!JSON.stringify(detail).includes('javascript:'));
  assert.ok(!JSON.stringify(detail).includes('embed.example'));
  const options = await (await fetch(base + '/options')).json();
  assert.deepEqual(options.genres, [{ name: 'Drama', slug: 'drama' }]);
  assert.equal(options.countries[0].slug, 'drama');
  await fetch(base + '/movies?category=drama&country=vn&year=2025&sort=year');
  assert.equal(calls.at(-1).pathname, '/v1/api/danh-sach');
  assert.equal(calls.at(-1).searchParams.get('category'), 'drama');
  assert.equal(calls.at(-1).searchParams.get('year'), '2025');
  assert.equal((await fetch(base + '/movies?category=bad%2Fslug')).status, 400);
  assert.equal((await fetch(base + '/movies?year=no')).status, 400);
  assert.equal((await fetch(base + '/movies/missing')).status, 404);
  assert.equal((await fetch(base + '/movies?type=unknown')).status, 400);
  assert.equal((await fetch(base + '/movies?page=0')).status, 400);
  assert.equal((await fetch(base + '/movies/bad%2Fslug')).status, 400);
  for (const q of ['failure', 'rate', 'invalid'])
    assert.equal((await fetch(base + '/movies?q=' + q)).status, 502);
  await assert.rejects(
    () => createKkphimClient({ baseUrl, timeout: 20 }).list({ q: 'slow' }),
    (e) => e.status === 502,
  );
});
