import MovieImage from '../../../shared/components/MovieImage.jsx';
import React from 'react';
import { Play, Star } from 'lucide-react';
export default function CatalogMovieCard({ m, open }) {
  return (
    <article className="browse-card" key={m.id}>
      <div className="browse-poster">
        <button onClick={() => open(m)} aria-label={'Chi tiết ' + m.title}>
          <MovieImage
            src={m.poster}
            alternatives={m.posterCandidates || [m.backdrop]}
            alt={m.title}
          />
          <span className="browse-poster-shade" />
          <span className="browse-play">
            <Play fill="currentColor" size={22} />
          </span>
        </button>
        <span className="browse-quality">{m.quality || 'KKPHIM'}</span>
        {m.episodeCurrent && <span className="browse-episode">{m.episodeCurrent}</span>}
      </div>
      <button className="browse-title" onClick={() => open(m)}>
        {m.title}
      </button>
      <p className="browse-original">{m.original}</p>
      <div className="browse-meta">
        <span>{m.year || 'Đang cập nhật'}</span>
        {m.rating && (
          <span className="rating">
            <Star size={10} fill="currentColor" />
            {m.rating.toFixed(1)}
          </span>
        )}
        <span>{m.language || m.genres[0] || 'Xem chi tiết'}</span>
      </div>
    </article>
  );
}
