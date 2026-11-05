const normalizeName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export function seasonTitle(value) {
  const title = String(value || '').trim();
  const match = title.match(
    /\s*[-–:]?\s*\(?\s*(?:phần|phan|mùa|mua|season|part)\s+(\d+)\s*\)?\s*$/i,
  );
  return {
    base: match ? title.slice(0, match.index).trim() : title,
    number: match ? Number(match[1]) : null,
  };
}
function identity(movie) {
  const original = seasonTitle(movie.origin_name),
    local = seasonTitle(movie.name);
  const raw = movie.tmdb?.season;
  return {
    original: normalizeName(original.base),
    local: normalizeName(local.base),
    number:
      raw !== null &&
      raw !== undefined &&
      raw !== '' &&
      Number.isInteger(Number(raw)) &&
      Number(raw) >= 0
        ? Number(raw)
        : (original.number ?? local.number),
    tvId:
      movie.tmdb?.type === 'tv' && movie.tmdb?.id && Number(movie.tmdb.id) > 0
        ? String(movie.tmdb.id)
        : null,
  };
}
export function groupSeasons(current, candidates) {
  const base = identity(current),
    seen = new Map([[current.slug, current]]);
  for (const movie of candidates) {
    if (!movie?.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(movie.slug)) continue;
    const candidate = identity(movie);
    let matches = false;
    if (base.tvId && candidate.tvId) matches = base.tvId === candidate.tvId;
    else if (candidate.number !== null && base.number !== null)
      matches = Boolean(
        base.original && candidate.original
          ? base.original === candidate.original
          : base.local && base.local === candidate.local,
      );
    if (matches) seen.set(movie.slug, movie);
  }
  return [...seen.values()]
    .map((m) => {
      const info = identity(m);
      return {
        id: m.slug,
        title: m.name || m.origin_name || m.slug,
        original: m.origin_name || '',
        seasonNumber: info.number,
        label:
          info.number === 0
            ? 'Phần đặc biệt'
            : info.number !== null
              ? `Phần ${info.number}`
              : m.name || 'Phần hiện tại',
        year: m.year || null,
        current: m.slug === current.slug,
      };
    })
    .sort(
      (a, b) =>
        (a.seasonNumber ?? Number.MAX_SAFE_INTEGER) - (b.seasonNumber ?? Number.MAX_SAFE_INTEGER) ||
        Number(a.year) - Number(b.year) ||
        a.title.localeCompare(b.title),
    );
}
export async function loadSeasons(get, slug) {
  const current = await get('/phim/' + encodeURIComponent(slug));
  if (!current.movie) {
    const e = Error('Không tìm thấy phim.');
    e.status = 404;
    throw e;
  }
  const movie = current.movie,
    info = identity(movie);
  if (info.number === null) return { results: groupSeasons(movie, []), partial: false };
  const keywords = [
    ...new Set([seasonTitle(movie.origin_name).base, seasonTitle(movie.name).base].filter(Boolean)),
  ];
  const candidates = [];
  let partial = false;
  for (const keyword of keywords) {
    try {
      for (let page = 1; page <= 3; page++) {
        const data = await get('/v1/api/tim-kiem', { keyword, limit: 64, page }),
          body = data.data || data;
        if (!Array.isArray(body.items)) {
          partial = true;
          break;
        }
        candidates.push(...body.items);
        const p = body.params?.pagination || body.pagination || {},
          pages =
            Number(p.totalPages) || Math.ceil((Number(p.totalItems) || body.items.length) / 64);
        if (page >= pages || body.items.length === 0) break;
        if (page === 3) partial = true;
      }
    } catch {
      partial = true;
    }
  }
  return { results: groupSeasons(movie, candidates), partial };
}
