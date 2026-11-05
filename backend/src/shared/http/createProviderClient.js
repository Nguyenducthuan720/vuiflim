export function createProviderClient({ baseUrl, timeout = 12000 }) {
  const cache = new Map(),
    pending = new Map();
  async function get(path, params = {}) {
    const url = new URL(baseUrl + path);
    for (const [k, v] of Object.entries(params))
      if (v !== '' && v !== undefined) url.searchParams.set(k, String(v));
    const key = url.toString(),
      hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      let r;
      try {
        r = await fetch(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(timeout),
          redirect: 'error',
        });
      } catch {
        throw fail('Không kết nối được KKPhim. Kiểm tra mạng và thử lại.');
      }
      if (!r.ok)
        throw fail(
          r.status === 429
            ? 'KKPhim đang giới hạn yêu cầu. Vui lòng thử lại sau.'
            : 'KKPhim tạm thời không trả dữ liệu.',
          r.status === 404 ? 404 : 502,
        );
      let d;
      try {
        d = await r.json();
      } catch {
        throw fail('KKPhim trả dữ liệu không hợp lệ.');
      }
      if (d.status === false || d.status === 'error')
        throw fail('Không tìm thấy dữ liệu trên KKPhim.', 404);
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, { value: d, expires: Date.now() + 120000 });
      return d;
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  }

  return { get };
}
function fail(message, status = 502) {
  const error = Error(message);
  error.status = status;
  return error;
}
