import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
// Try distinct provider alternatives before rendering a deliberate placeholder.
export default function MovieImage({
  src,
  alternatives = [],
  alt = '',
  className = '',
  loading = 'lazy',
  ...props
}) {
  const urls = [...new Set([src, ...alternatives].filter((v) => typeof v === 'string' && v))];
  const signature = urls.join('|');
  const [failed, setFailed] = useState([]);
  useEffect(() => setFailed([]), [signature]);
  const current = urls.find((url) => !failed.includes(url));
  if (!current)
    return (
      <span
        className={'movie-image-placeholder ' + className}
        role="img"
        aria-label={alt ? `Chưa có ảnh: ${alt}` : 'Chưa có ảnh'}
      >
        <ImageOff size={24} />
        <span>{alt || 'Ảnh đang cập nhật'}</span>
      </span>
    );
  return (
    <img
      {...props}
      className={className}
      src={current}
      alt={alt}
      loading={loading}
      onError={() => setFailed((previous) => [...previous, current])}
    />
  );
}
