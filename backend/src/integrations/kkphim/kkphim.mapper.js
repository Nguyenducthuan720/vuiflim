export function safeUrl(value, images = false) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const trimmed = value.trim();
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const imagePath = trimmed.replace(/^\/+/, '');
    const base = /^uploads?\//i.test(imagePath)
      ? 'https://phimimg.com/'
      : 'https://phimimg.com/uploads/movies/';
    const input = trimmed.startsWith('//')
      ? 'https:' + trimmed
      : isAbsolute
        ? trimmed
        : images
          ? imagePath
          : trimmed;
    const u = new URL(input, images ? base : undefined);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}
export function normalize(m) {
  return {
    id: m.slug,
    title: m.name || m.origin_name || 'Chưa có tên',
    original: m.origin_name || '',
    year: m.year || null,
    poster: safeUrl(m.poster_url, true) || safeUrl(m.thumb_url, true),
    posterCandidates: [
      ...new Set([safeUrl(m.poster_url, true), safeUrl(m.thumb_url, true)].filter(Boolean)),
    ],
    backdrop: safeUrl(m.thumb_url, true) || safeUrl(m.poster_url, true),
    backdropCandidates: [
      ...new Set([safeUrl(m.thumb_url, true), safeUrl(m.poster_url, true)].filter(Boolean)),
    ],
    type: m.type === 'series' ? 'series' : 'movie',
    source: 'kkphim',
    rating:
      Number.isFinite(m.tmdb?.vote_average) && m.tmdb.vote_average > 0 ? m.tmdb.vote_average : null,
    description: String(m.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim(),
    genres: (m.category || []).map((g) => g.name),
    country: (m.country || []).map((g) => g.name).join(', '),
    cast: (m.actor || []).join(', '),
    director: (m.director || []).join(', '),
    duration: m.time || '',
    quality: m.quality || '',
    language: m.lang || '',
    episodeCurrent: m.episode_current || '',
  };
}
export function safeEmbed(value) {
  try {
    const u = new URL(value);
    if (
      u.protocol !== 'https:' ||
      u.hostname !== 'player.phimapi.com' ||
      u.port ||
      u.username ||
      u.password ||
      u.pathname !== '/player/'
    )
      return null;
    const video = new URL(u.searchParams.get('url'));
    return video.protocol === 'https:' && !video.username && !video.password ? u.href : null;
  } catch {
    return null;
  }
}
