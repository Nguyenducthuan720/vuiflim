import MovieImage from '../../../shared/components/MovieImage.jsx';
import React from 'react';
import { Check, Play, Plus, Star } from 'lucide-react';
export default function MovieCard({ movie: m, saved, onSave, onOpen, rank, progress }) {
  return (
    <article className="movie-card">
      <div className="poster">
        <button className="poster-open" onClick={onOpen} aria-label={'Chi tiết ' + m.title}>
          <MovieImage src={m.poster} alternatives={[m.backdrop]} alt={m.title} />
          <span className="poster-fallback">{m.original}</span>
          <span className="poster-gradient" />
          <span className="play-hover">
            <Play size={24} fill="currentColor" />
          </span>
        </button>
        <span className="poster-quality">{m.type === 'series' ? 'PHIM BỘ' : 'PHIM LẺ'}</span>
        <button
          className={'save-button ' + (saved ? 'is-saved' : '')}
          onClick={onSave}
          aria-label={saved ? 'Bỏ lưu ' + m.title : 'Lưu ' + m.title}
        >
          {saved ? <Check size={15} /> : <Plus size={15} />}
        </button>
        <span className="poster-rating">
          <Star fill="currentColor" size={11} />
          {m.rating.toFixed(1)}
        </span>
        {rank && <span className="rank">{String(rank).padStart(2, '0')}</span>}
        {progress > 0 && (
          <div className="progress-track">
            <i style={{ width: Math.min(100, (progress / (m.duration * 60)) * 100) + '%' }} />
          </div>
        )}
      </div>
      <button className="movie-title" onClick={onOpen}>
        {m.title}
      </button>
      <div className="movie-original">{m.original}</div>
      <div className="movie-info">
        <span>{m.year}</span>
        <i />
        <span>{m.genre}</span>
        <span className="card-duration">
          {m.type === 'series' ? m.episodes + ' tập' : m.duration + 'p'}
        </span>
      </div>
    </article>
  );
}
