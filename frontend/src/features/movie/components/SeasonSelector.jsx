import React from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import { useMovieSeasons } from '../hooks/useMovieSeasons.js';
import '../styles/seasons.css';
export default function SeasonSelector({ slug, onSelect }) {
  const { results, partial, loading, error, retry } = useMovieSeasons(slug);
  if (loading)
    return (
      <div className="season-loading" role="status">
        <Layers size={15} />
        Đang tìm các phần của phim…
      </div>
    );
  if (error)
    return (
      <div className="season-error">
        <span>Chưa tải được danh sách phần.</span>
        <button className="text-button" onClick={retry}>
          Thử lại
        </button>
      </div>
    );
  if (results.length <= 1 && !partial) return null;
  return (
    <div className="season-selector">
      <div className="season-selector-heading">
        <span>
          <Layers size={16} />
          Chọn phần phim
        </span>
        <small>{results.length} phần tìm thấy</small>
      </div>
      <div className="season-select-controls">
        <select
          aria-label="Chọn phần phim"
          value={slug}
          onChange={(e) => {
            const season = results.find((s) => s.id === e.target.value);
            if (season) onSelect({ id: season.id, title: season.title }, true);
          }}
        >
          {results.map((s) => (
            <option value={s.id} key={s.id}>
              {s.label}
              {s.year ? ' · ' + s.year : ''}
              {s.current ? ' · Đang chọn' : ''}
            </option>
          ))}
        </select>
        <div className="season-buttons">
          {results.map((s) => (
            <button
              key={s.id}
              className={s.id === slug ? 'selected' : ''}
              aria-current={s.id === slug ? 'true' : undefined}
              title={s.title}
              onClick={() => {
                if (s.id !== slug) onSelect({ id: s.id, title: s.title }, true);
              }}
            >
              {s.label}
              <ChevronRight size={12} />
            </button>
          ))}
        </div>
      </div>
      {partial && (
        <p className="season-partial">
          Danh sách có thể chưa đầy đủ do giới hạn hoặc lỗi nguồn.{' '}
          <button className="text-button" onClick={retry}>
            Tải lại
          </button>
        </p>
      )}
    </div>
  );
}
