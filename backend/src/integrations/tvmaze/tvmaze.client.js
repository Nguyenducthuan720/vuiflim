// Public provider contract: https://www.tvmaze.com/api
export function createTvmazeClient({ baseUrl = 'https://api.tvmaze.com', timeout = 10000 } = {}) {
  const cache = new Map(),
    pending = new Map();
  async function get(path, params = {}, emptyOn404 = false) {
    const url = new URL(baseUrl + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const key = url.toString(),
      entry = cache.get(key);
    if (entry && entry.expires > Date.now()) return entry.value;
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      let response;
      try {
        response = await fetch(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(timeout),
          redirect: 'error',
        });
      } catch {
        throw failure('Không kết nối được TVmaze. Kiểm tra Internet và thử lại.');
      }
      if (response.status === 404 && emptyOn404) return [];
      if (response.status === 404) throw failure('Không tìm thấy phim trên TVmaze.', 404);
      if (!response.ok)
        throw failure(
          response.status === 429
            ? 'TVmaze đang giới hạn yêu cầu. Vui lòng chờ rồi thử lại.'
            : 'TVmaze tạm thời không trả dữ liệu.',
        );
      let value;
      try {
        value = await response.json();
      } catch {
        throw failure('TVmaze trả dữ liệu không hợp lệ.');
      }
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, { value, expires: Date.now() + 300000 });
      return value;
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  }
  function normalize(show) {
    const safeImage = (value) => {
      try {
        const u = new URL(value);
        return u.protocol === 'https:' && u.hostname === 'static.tvmaze.com' ? u.href : null;
      } catch {
        return null;
      }
    };
    // Render provider HTML summaries as plain text only, never dangerouslySetInnerHTML.
    const summary =
      typeof show.summary === 'string'
        ? show.summary
            .replace(/<[^>]*>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '';
    return {
      id: show.id,
      type: 'series',
      source: 'tvmaze',
      playable: false,
      title: show.name || 'Chưa có tên',
      original: show.name || '',
      description: summary || 'Chưa có mô tả.',
      year: (show.premiered || '').slice(0, 4),
      rating: Number.isFinite(show.rating?.average) ? show.rating.average : null,
      poster: safeImage(show.image?.medium),
      backdrop: safeImage(show.image?.original),
      genres: Array.isArray(show.genres) ? show.genres.filter((g) => typeof g === 'string') : [],
      duration: show.averageRuntime || show.runtime || null,
      country: show.network?.country?.name || show.webChannel?.country?.name || '',
      language: show.language || '',
      status: show.status || '',
      providerUrl: `https://www.tvmaze.com/shows/${show.id}`,
    };
  }
  return {
    async list({ q = '', page = 1, sort = 'default' } = {}) {
      const raw = await get(q ? '/search/shows' : '/shows', q ? { q } : { page: page - 1 }, !q);
      if (!Array.isArray(raw)) throw failure('TVmaze trả danh mục không hợp lệ.');
      const results = (q ? raw.map((r) => r.show) : raw)
        .filter((s) => s && Number.isInteger(s.id))
        .map(normalize);
      if (sort === 'rating') results.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      // TVmaze indexes by ID range; page sizes vary and total number of pages is unknown.
      return {
        page,
        results,
        hasNext: !q && raw.length > 0,
        batchSize: results.length,
        search: Boolean(q),
      };
    },
    async detail(id) {
      const show = await get(`/shows/${id}`);
      if (!Number.isInteger(show?.id)) throw failure('TVmaze trả chi tiết không hợp lệ.');
      return normalize(show);
    },
  };
}
function failure(message, status = 502) {
  const e = Error(message);
  e.status = status;
  return e;
}
