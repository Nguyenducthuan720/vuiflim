export async function api(url, method = 'GET', body) {
  const res = await fetch('/api' + url, {
    method,
    credentials: 'same-origin',
    keepalive: method === 'PUT' && url.startsWith('/history/'),
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.headers.get('content-type')?.includes('application/json'))
    throw Error('Máy chủ chưa sẵn sàng. Vui lòng thử lại.');
  const data = await res.json();
  if (!res.ok) throw Error(data.error || 'Không thể kết nối.');
  return data;
}
