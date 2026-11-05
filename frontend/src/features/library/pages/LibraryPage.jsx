import React from 'react';
import { Clock, Heart } from 'lucide-react';
import MovieCard from '../components/MovieCard.jsx';
export default function LibraryPage({
  view,
  user,
  filtered,
  library,
  libraryError,
  setAuth,
  sync,
  load,
  favorite,
  setSelected,
  setPlaying,
  navigate,
}) {
  return (
    <section className="personal-page">
      <span className="eyebrow">KHÔNG GIAN CỦA BẠN</span>
      <h1>
        {view === 'saved'
          ? 'Danh sách của tôi'
          : view === 'history'
            ? 'Tiếp tục xem'
            : 'Kho phim riêng VuiPhim'}
      </h1>
      <p className="muted">Phim từ kho VuiPhim được quản lý bằng tài khoản của bạn.</p>
      {!user && view !== 'local' ? (
        <div className="empty">
          <Heart size={32} />
          <h3>Lưu những câu chuyện bạn yêu thích</h3>
          <button className="primary" onClick={() => setAuth('login')}>
            Đăng nhập
          </button>
        </div>
      ) : libraryError ? (
        <div className="empty">
          <p className="error">{libraryError}</p>
          <button
            className="secondary"
            onClick={() => {
              sync();
              load();
            }}
          >
            Thử lại
          </button>
        </div>
      ) : filtered.length ? (
        <div className="movie-grid">
          {filtered.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              saved={library.favorites.includes(m.id)}
              onSave={() => favorite(m)}
              onOpen={() => {
                setSelected(m);
                setPlaying(false);
              }}
              progress={
                view === 'history'
                  ? library.history.find((h) => h.movie_id === m.id)?.position
                  : null
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Clock size={32} />
          <h3>Chưa có phim trong mục này</h3>
          <button className="primary" onClick={() => navigate('home')}>
            Khám phá phim online
          </button>
        </div>
      )}
    </section>
  );
}
