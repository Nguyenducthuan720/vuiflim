import React, { useEffect, useId, useRef, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import MovieImage from '../../../shared/components/MovieImage.jsx';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions.js';
import '../styles/search-suggestions.css';
export default function MovieSearch({
  value,
  onChange,
  onSubmit,
  onSelect,
  className = '',
  label = 'Tìm phim',
  placeholder = 'Gõ một phần tên phim…',
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(-1),
    ref = useRef(),
    listId = useId();
  const shown = open && Boolean(value.trim());
  const { movies, total, loading, error } = useSearchSuggestions(value, shown);
  useEffect(() => setActive(-1), [value]);
  useEffect(() => {
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  function choose(movie) {
    setOpen(false);
    setActive(-1);
    onSelect(movie);
  }
  function submit(e) {
    e.preventDefault();
    setOpen(false);
    setActive(-1);
    onSubmit(value.trim());
  }
  return (
    <form
      ref={ref}
      className={className + ' movie-search'}
      onSubmit={submit}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Search size={17} />
      <input
        aria-label={label}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? listId + '-' + active : undefined}
        placeholder={placeholder}
        value={value}
        maxLength={150}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
            setActive(-1);
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (movies.length ? (i + 1) % movies.length : -1));
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (movies.length ? (i - 1 + movies.length) % movies.length : -1));
          }
          if (e.key === 'Enter' && shown && active >= 0 && movies[active]) {
            e.preventDefault();
            choose(movies[active]);
          }
        }}
      />
      <button type="submit" aria-label="Xem tất cả kết quả">
        <ArrowRight size={16} />
      </button>
      {shown && (
        <div className="search-suggestions">
          <div className="suggestion-heading">
            {loading ? 'Đang tìm phim…' : `Gợi ý cho “${value.trim()}”`}
          </div>
          {loading ? (
            <p className="suggestion-status" role="status">
              Đang tải gợi ý…
            </p>
          ) : error ? (
            <p className="suggestion-status error" role="alert">
              {error}
            </p>
          ) : (
            <>
              <div role="listbox" id={listId} aria-label="Phim gợi ý">
                {movies.map((movie, i) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    id={listId + '-' + i}
                    className={'suggestion-option ' + (active === i ? 'is-active' : '')}
                    key={movie.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(movie)}
                  >
                    <MovieImage
                      src={movie.poster}
                      alternatives={movie.posterCandidates || [movie.backdrop]}
                      alt=""
                      className="suggestion-poster"
                    />
                    <span className="suggestion-info">
                      <strong>{movie.title}</strong>
                      <small>{movie.original}</small>
                      <span>
                        {movie.year || 'Đang cập nhật'}
                        {movie.language ? ' · ' + movie.language : ''}
                      </span>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
              {!movies.length ? (
                <p className="suggestion-status">Chưa tìm thấy phim. Thử từ khóa khác.</p>
              ) : (
                <button type="submit" className="suggestion-all">
                  Xem tất cả {total.toLocaleString('vi-VN')} kết quả
                  <ArrowRight size={14} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}
