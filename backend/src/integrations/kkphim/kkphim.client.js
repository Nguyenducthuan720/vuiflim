import { createProviderClient } from '../../shared/http/createProviderClient.js';
import { safeUrl, normalize, safeEmbed } from './kkphim.mapper.js';
import { loadSeasons } from './kkphim.seasons.js';
// Contract supplied by user: https://kkphim1.com/api-document
export function createKkphimClient({ baseUrl = 'https://phimapi.com', timeout = 12000 } = {}) {
  const { get } = createProviderClient({ baseUrl, timeout });

  return {
    seasons: (slug) => loadSeasons(get, slug),
    async options() {
      const clean = (d) => {
        const rows = Array.isArray(d) ? d : d.data?.items;
        if (!Array.isArray(rows)) throw fail('Danh mục bộ lọc không hợp lệ.');
        return rows
          .filter((v) => typeof v.name === 'string' && /^[a-z0-9-]+$/.test(v.slug))
          .map((v) => ({ name: v.name, slug: v.slug }));
      };
      const [genres, countries] = await Promise.all([get('/the-loai'), get('/quoc-gia')]);
      return { genres: clean(genres), countries: clean(countries) };
    },
    async list({
      q = '',
      type = 'all',
      page = 1,
      category = '',
      country = '',
      year = '',
      sort = 'modified.time',
    } = {}) {
      const d = await get(
        q ? '/v1/api/tim-kiem' : type === 'all' ? '/v1/api/danh-sach' : `/v1/api/danh-sach/${type}`,
        {
          page,
          limit: 24,
          ...(q ? { keyword: q } : {}),
          category,
          country,
          year,
          sort_field: sort,
          sort_type: 'desc',
        },
      );
      const body = d.data || d;
      if (!Array.isArray(body.items)) throw fail('KKPhim trả danh mục không hợp lệ.');
      const p = body.params?.pagination || body.pagination || d.pagination || {};
      const per = Number(p.totalItemsPerPage) || 24,
        total = Number(p.totalItems) || 0;
      return {
        page,
        totalResults: total,
        totalPages: Number(p.totalPages) || Math.max(1, Math.ceil(total / per)),
        results: body.items
          .filter((m) => typeof m.slug === 'string' && /^[a-z0-9-]+$/.test(m.slug))
          .map(normalize),
      };
    },
    async detail(slug) {
      const d = await get('/phim/' + encodeURIComponent(slug));
      if (!d.movie) throw fail('Không tìm thấy phim.', 404);
      const servers = (d.episodes || [])
        .map((s, i) => ({
          id: String(i),
          name: s.server_name || `Máy chủ ${i + 1}`,
          episodes: (s.server_data || [])
            .map((e, j) => ({
              id: String(j),
              name: e.name || `Tập ${j + 1}`,
              url: safeUrl(e.link_m3u8),
              embedUrl: safeEmbed(e.link_embed),
            }))
            .filter((e) => e.url || e.embedUrl),
        }))
        .filter((s) => s.episodes.length);
      return { ...normalize(d.movie), servers, playable: servers.length > 0 };
    },
  };
}
function fail(message, status = 502) {
  const e = Error(message);
  e.status = status;
  return e;
}
