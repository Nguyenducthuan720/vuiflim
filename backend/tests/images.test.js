import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeUrl, normalize } from '../src/integrations/kkphim/kkphim.mapper.js';
test('KKPhim image path variants resolve without duplicate folders', () => {
  const cases = [
    ['poster.jpg', 'https://phimimg.com/uploads/movies/poster.jpg'],
    ['uploads/movies/2026/a.webp', 'https://phimimg.com/uploads/movies/2026/a.webp'],
    ['/uploads/movies/2026/a.webp', 'https://phimimg.com/uploads/movies/2026/a.webp'],
    ['upload/vod/2024/a.jpg', 'https://phimimg.com/upload/vod/2024/a.jpg'],
    ['/upload/vod/2024/a.jpg', 'https://phimimg.com/upload/vod/2024/a.jpg'],
    ['//phimimg.com/upload/vod/a.jpg', 'https://phimimg.com/upload/vod/a.jpg'],
    ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/a.jpg'],
  ];
  for (const [input, expected] of cases) assert.equal(safeUrl(input, true), expected);
  assert.equal(safeUrl('javascript:alert(1)', true), null);
  assert.equal(safeUrl('', true), null);
  const m = normalize({
    slug: 'a',
    poster_url: 'upload/vod/a.jpg',
    thumb_url: 'uploads/movies/b.webp',
  });
  assert.deepEqual(m.posterCandidates, [
    'https://phimimg.com/upload/vod/a.jpg',
    'https://phimimg.com/uploads/movies/b.webp',
  ]);
});
