import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, Play, Star, MessageSquare } from 'lucide-react';
import { useMovieDetails } from '../hooks/useMovieDetails.js';
import MovieImage from '../../../shared/components/MovieImage.jsx';
import MovieDescription from '../components/MovieDescription.jsx';
import EpisodeSelector from '../components/EpisodeSelector.jsx';
import SeasonSelector from '../components/SeasonSelector.jsx';
import MovieComments from '../components/MovieComments.jsx';
import ProviderPlayer from '../../player/components/ProviderPlayer.jsx';
import '../styles/movie-page.css';
export default function MovieDetailsPage({
  movie,
  autoPlay = false,
  user,
  onLogin,
  onBack,
  onOpenMovie,
}) {
  const state = useMovieDetails(movie, autoPlay),
    { detail, error, setRetry, playing, setPlaying, m, server, episode } = state;
  const playerRef = useRef();
  useEffect(() => {
    if (!detail) return;
    const previous = document.title;
    document.title = detail.title + ' — VuiPhim';
    return () => {
      document.title = previous;
    };
  }, [detail]);
  useEffect(() => {
    if (playing && episode)
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [playing, episode?.url, episode?.embedUrl]);
  function watch() {
    setPlaying(true);
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <article className="movie-detail-page">
      <div className="movie-page-backdrop">
        {m.backdrop && (
          <MovieImage
            src={m.backdrop}
            alternatives={m.backdropCandidates || [m.poster]}
            alt=""
            loading="eager"
          />
        )}
      </div>
      <div className="movie-page-container">
        <nav className="movie-breadcrumb" aria-label="Đường dẫn">
          <button onClick={onBack}>
            <ArrowLeft size={14} />
            Khám phá
          </button>
          <ChevronRight size={12} />
          <span>{detail?.title || 'Chi tiết phim'}</span>
        </nav>
        {error ? (
          <div className="movie-page-error">
            <h1>Chưa tải được thông tin phim</h1>
            <p role="alert">{error}</p>
            <button className="primary" onClick={() => setRetry((v) => v + 1)}>
              Thử lại
            </button>
            <button className="secondary" onClick={onBack}>
              Về danh mục
            </button>
          </div>
        ) : !detail ? (
          <div className="movie-page-loading" role="status">
            <div className="spinner" />
            <p>Đang mở câu chuyện của bạn…</p>
          </div>
        ) : (
          <>
            <header className="movie-page-overview">
              <MovieImage
                className="movie-page-poster"
                src={m.poster}
                alternatives={m.posterCandidates || [m.backdrop]}
                alt={m.title}
                loading="eager"
              />
              <div className="movie-page-title">
                <span className="eyebrow">
                  VUIPHIM / {m.type === 'series' ? 'PHIM BỘ' : 'PHIM LẺ'}
                </span>
                <h1>{m.title}</h1>
                <p className="movie-page-original">{m.original}</p>
                <div className="movie-page-tags">
                  <span>{m.year}</span>
                  {m.quality && <span className="quality-tag">{m.quality}</span>}
                  <span>{m.duration}</span>
                  {m.rating && (
                    <span className="rating">
                      <Star size={14} fill="currentColor" />
                      {m.rating.toFixed(1)}
                    </span>
                  )}
                  <span>{m.language}</span>
                </div>
                <div className="movie-page-genres">
                  {m.genres.map((g) => (
                    <span key={g}>{g}</span>
                  ))}
                </div>
                <p className="movie-page-teaser">{m.description}</p>
                <div className="movie-page-actions">
                  <button className="primary" disabled={!detail.playable} onClick={watch}>
                    <Play size={18} fill="currentColor" />
                    {detail.playable ? 'Xem phim ngay' : 'Chưa có nguồn phát'}
                  </button>
                  <a className="secondary" href="#binh-luan">
                    <MessageSquare size={17} />
                    Bình luận
                  </a>
                </div>
              </div>
            </header>
            <div className="movie-page-columns">
              <div className="movie-page-main">
                {!detail.playable && <SeasonSelector slug={movie.id} onSelect={onOpenMovie} />}
                {detail.playable && (
                  <section className="movie-page-watch" ref={playerRef} id="xem-phim">
                    <div className="movie-section-heading">
                      <div>
                        <span className="section-kicker">THƯỞNG THỨC BỘ PHIM</span>
                        <h2>{playing ? 'Đang xem · ' + episode?.name : 'Chọn tập để bắt đầu'}</h2>
                      </div>
                      <span>{server?.name}</span>
                    </div>
                    {playing && episode ? (
                      <ProviderPlayer episode={episode} />
                    ) : (
                      <button className="movie-player-start" onClick={watch}>
                        <span>
                          <Play size={32} fill="currentColor" />
                        </span>
                        <b>Bắt đầu xem phim</b>
                      </button>
                    )}
                    <EpisodeSelector
                      {...state}
                      seasonControl={<SeasonSelector slug={movie.id} onSelect={onOpenMovie} />}
                    />
                  </section>
                )}
                <section className="movie-page-story">
                  <MovieDescription m={m} showFacts={false} />
                </section>
                <MovieComments slug={movie.id} user={user} onLogin={onLogin} />
              </div>
              <aside className="movie-page-aside">
                <span className="section-kicker">HỒ SƠ BỘ PHIM</span>
                <h2>Thông tin chi tiết</h2>
                <dl>
                  <div>
                    <dt>Tên gốc</dt>
                    <dd>{m.original || 'Đang cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Quốc gia</dt>
                    <dd>{m.country || 'Đang cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Đạo diễn</dt>
                    <dd>{m.director || 'Đang cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Diễn viên</dt>
                    <dd>{m.cast || 'Đang cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Tình trạng</dt>
                    <dd>{m.episodeCurrent || 'Đang cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Máy chủ khả dụng</dt>
                    <dd>{detail.servers.length} máy chủ</dd>
                  </div>
                </dl>
                <button className="text-button" onClick={onBack}>
                  <ArrowLeft size={14} />
                  Khám phá phim khác
                </button>
              </aside>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
