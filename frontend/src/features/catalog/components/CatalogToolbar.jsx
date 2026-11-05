import React from 'react';
import MovieSearch from './MovieSearch.jsx';
export default function CatalogToolbar({
  type,
  filter,
  setType,
  setQ,
  setDraft,
  draft,
  setRetry,
  open,
}) {
  return (
    <div className="browse-toolbar">
      <div className="genre-tabs">
        {[
          ['all', 'Tất cả'],
          ['phim-le', 'Phim lẻ'],
          ['phim-bo', 'Phim bộ'],
          ['hoat-hinh', 'Hoạt hình'],
          ['tv-shows', 'TV Shows'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={type === value ? 'selected' : ''}
            onClick={() => {
              filter(setType, value);
              setQ('');
              setDraft('');
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <MovieSearch
        className="browse-search"
        label="Tìm trong danh mục"
        value={draft}
        onChange={setDraft}
        onSelect={(movie) => open(movie)}
        onSubmit={(keyword) => {
          filter(setQ, keyword);
          setType('all');
          setRetry((v) => v + 1);
        }}
      />
    </div>
  );
}
