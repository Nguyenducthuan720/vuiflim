export function createTmdbClient({
  token = process.env.TMDB_READ_ACCESS_TOKEN,
  baseUrl = 'https://api.themoviedb.org/3',
  timeout = 8000,
} = {}) {
  const cache = new Map(),
    pending = new Map();
  async function get(path, params = {}) {
    if (!token?.trim()) {
      const e = Error('Chưa cấu hình TMDB_READ_ACCESS_TOKEN trong backend/.env.');
      e.status = 503;
      throw e;
    }
    const url = new URL(baseUrl + path);
    url.searchParams.set('language', 'vi-VN');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    const key = url.toString(),
      entry = cache.get(key);
    if (entry && entry.expires > Date.now()) return entry.value;
    if (pending.has(key)) return pending.get(key);
    const request = (async () => {
      let response;
      try {
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${token.trim()}`, accept: 'application/json' },
          signal: AbortSignal.timeout(timeout),
          redirect: 'error',
        });
      } catch {
        const e = Error('Không kết nối được TMDB. Vui lòng thử lại sau.');
        e.status = 502;
        throw e;
      }
      if (!response.ok) {
        const e = Error(
          response.status === 401 || response.status === 403
            ? 'Token TMDB không hợp lệ hoặc chưa được cấp quyền.'
            : response.status === 429
              ? 'TMDB đang giới hạn yêu cầu. Vui lòng chờ rồi thử lại.'
              : 'TMDB tạm thời không trả dữ liệu.',
        );
        e.status = 502;
        throw e;
      }
      let value;
      try {
        value = await response.json();
      } catch {
        const e = Error('TMDB trả dữ liệu không hợp lệ.');
        e.status = 502;
        throw e;
      }
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, { value, expires: Date.now() + 300000 });
      return value;
    })();
    pending.set(key, request);
    try {
      return await request;
    } finally {
      pending.delete(key);
    }
  }
  const image = (path, size) =>
    typeof path === 'string' && /^\/[a-zA-Z0-9._-]+$/.test(path)
      ? `https://image.tmdb.org/t/p/${size}${path}`
      : null;
  function normalize(m, type) {
    return {
      id: m.id,
      type,
      title: m.title || m.name || m.original_title || m.original_name || 'Chưa có tên',
      original: m.original_title || m.original_name || '',
      description: m.overview || 'Chưa có mô tả tiếng Việt.',
      year: (m.release_date || m.first_air_date || '').slice(0, 4),
      rating: Number.isFinite(m.vote_average) ? m.vote_average : 0,
      poster: image(m.poster_path, 'w500'),
      backdrop: image(m.backdrop_path, 'w1280'),
      source: 'tmdb',
      playable: false,
      tmdbUrl: `https://www.themoviedb.org/${type === 'series' ? 'tv' : 'movie'}/${m.id}`,
    };
  }
  return {
    configured: () => Boolean(token?.trim()),
    async list({ type = 'movie', q = '', page = 1, sort = 'popular' } = {}) {
      const resource = type === 'series' ? 'tv' : 'movie';
      const data = await get(q ? `/search/${resource}` : `/${resource}/${sort}`, {
        page,
        ...(q ? { query: q, include_adult: false } : {}),
      });
      if (!Array.isArray(data.results)) {
        const e = Error('TMDB trả danh mục không hợp lệ.');
        e.status = 502;
        throw e;
      }
      return {
        page,
        totalPages: Math.min(Number(data.total_pages) || 0, 500),
        totalResults: Number(data.total_results) || 0,
        results: data.results
          .filter((m) => Number.isInteger(m.id) && !m.adult)
          .map((m) => normalize(m, type)),
      };
    },
    async detail(type, id) {
      const resource = type === 'series' ? 'tv' : 'movie',
        m = await get(`/${resource}/${id}`);
      if (m.adult) {
        const e = Error('Nội dung không được hiển thị.');
        e.status = 404;
        throw e;
      }
      return {
        ...normalize(m, type),
        genres: (m.genres || []).map((g) => g.name),
        duration: m.runtime || m.episode_run_time?.[0] || null,
        country: (m.production_countries || []).map((c) => c.name).join(', '),
      };
    },
  };
}
