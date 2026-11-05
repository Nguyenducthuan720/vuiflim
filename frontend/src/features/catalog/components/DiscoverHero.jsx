import MovieImage from '../../../shared/components/MovieImage.jsx';
import React, { useState } from 'react';
import { Info, Play, ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { useHeroCarousel } from '../hooks/useHeroCarousel.js';
import '../styles/hero-carousel.css';
export default function DiscoverHero({ movies = [], q, open, paused = false }) {
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  const { index, goTo, manualPause, setManualPause } = useHeroCarousel(
    movies,
    paused || hovered || focused,
  );
  const hero = movies[index];
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Phim tiêu điểm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      className={'discover-hero ' + (!hero ? 'is-quiet' : '')}
      style={
        hero
          ? {
              backgroundImage: `linear-gradient(90deg,#0c0c10 0%,#0c0c10c9 35%,#0c0c1010 85%),linear-gradient(0deg,#0c0c10,transparent 50%),url(${hero.backdrop})`,
            }
          : undefined
      }
    >
      {hero && (
        <MovieImage
          key={hero.id}
          className="discover-backdrop"
          src={hero.backdrop}
          alternatives={hero.backdropCandidates || [hero.poster]}
          alt=""
          loading="eager"
        />
      )}
      <div className="discover-hero-inner hero-slide-content" key={hero?.id || 'search'}>
        <span className="eyebrow">
          <span />
          CHỌN MỘT BỘ PHIM. BẮT ĐẦU MỘT CÂU CHUYỆN.
        </span>
        <h1>{q ? `Tìm kiếm “${q}”` : hero?.title || 'Điện ảnh, theo cách của bạn.'}</h1>
        {hero && !q ? (
          <>
            <p className="hero-original">{hero.original}</p>
            <div className="hero-meta">
              <span>{hero.year}</span>
              {hero.quality && <span className="outline-label">{hero.quality}</span>}
              <span>{hero.language || 'Thông tin & tập phim'}</span>
            </div>
            <div className="hero-buttons">
              <button className="primary" onClick={() => open(hero, true)}>
                <Play size={18} fill="currentColor" />
                Xem ngay
              </button>
              <button className="secondary" onClick={() => open(hero)}>
                <Info size={18} />
                Chi tiết phim
              </button>
            </div>
          </>
        ) : (
          <p className="hero-description">
            Phim lẻ, phim bộ và những câu chuyện mới. Tìm kiếm, lọc và chọn tập ngay trong một không
            gian.
          </p>
        )}
      </div>
      {movies.length > 1 && (
        <div className="hero-carousel-controls">
          <button aria-label="Phim trước" onClick={() => goTo(index - 1)}>
            <ChevronLeft size={18} />
          </button>
          <div className="hero-carousel-dots">
            {movies.map((movie, i) => (
              <button
                key={movie.id}
                className={i === index ? 'active' : ''}
                aria-label={'Chuyển đến ' + movie.title}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <span>
            {String(index + 1).padStart(2, '0')} / {String(movies.length).padStart(2, '0')}
          </span>
          <button aria-label="Phim tiếp theo" onClick={() => goTo(index + 1)}>
            <ChevronRight size={18} />
          </button>
          <button
            aria-label={manualPause ? 'Bật tự chuyển phim' : 'Tạm dừng tự chuyển phim'}
            aria-pressed={manualPause}
            onClick={() => setManualPause((v) => !v)}
          >
            {manualPause ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      )}
    </section>
  );
}
