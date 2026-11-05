import React, { useState, useEffect } from 'react';
import { Check, Play, Plus, Star } from 'lucide-react';
import { api } from '../../../shared/api/httpClient.js';
import Overlay from '../../../shared/components/Modal.jsx';
import VideoPlayer from '../../player/components/HlsPlayer.jsx';
export default function MovieModal({
  movie: m,
  playing,
  setPlaying,
  close,
  saved,
  onSave,
  user,
  login,
  history,
  notify,
  onProgressSaved,
}) {
  const [reviews, setReviews] = useState([]),
    [body, setBody] = useState(''),
    [rating, setRating] = useState(8),
    [episode, setEpisode] = useState(history?.episode <= m.episodes ? history.episode : 1),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api('/movies/' + m.id + '/reviews')
      .then(setReviews)
      .catch((e) => notify(e.message));
  }, [m.id]);
  async function progress(position, number) {
    if (!user) return;
    try {
      await api('/history/' + m.id, 'PUT', { position, episode: number });
      onProgressSaved?.();
    } catch (e) {
      notify(e.message);
    }
  }
  async function review(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/movies/' + m.id + '/reviews', 'POST', { body, rating: +rating });
      setBody('');
      setReviews(await api('/movies/' + m.id + '/reviews'));
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Overlay close={close} className="detail-modal">
      {playing ? (
        <VideoPlayer
          movieId={m.id}
          episode={episode}
          position={history?.episode === episode ? history.position : 0}
          onProgress={progress}
        />
      ) : (
        <div
          className="detail-cover"
          style={{
            backgroundImage: `linear-gradient(0deg,#141419,transparent),url(${m.backdrop})`,
          }}
        />
      )}
      <div className="detail-body">
        <div className="eyebrow">
          {m.type === 'series' ? 'PHIM BỘ' : 'PHIM LẺ'} / {m.country}
        </div>
        <h2>{m.title}</h2>
        <p className="detail-original">{m.original}</p>
        <div className="hero-meta">
          <span className="rating">
            <Star size={14} fill="currentColor" />
            {m.rating}
          </span>
          <span>{m.year}</span>
          <span>{m.duration} phút</span>
          <span>{m.genre}</span>
        </div>
        <div className="detail-actions">
          <button className="primary" disabled={playing} onClick={() => setPlaying(true)}>
            <Play size={17} fill="currentColor" />
            {playing ? 'Đang xem' : history?.position ? 'Tiếp tục xem' : 'Xem phim'}
          </button>
          <button className="secondary" onClick={onSave}>
            {saved ? <Check size={17} /> : <Plus size={17} />}{' '}
            {saved ? 'Đã lưu' : 'Danh sách của tôi'}
          </button>
        </div>
        <p className="synopsis">{m.description}</p>
        <div className="credits">
          <p>
            <span>Đạo diễn</span>
            {m.director || 'Đang cập nhật'}
          </p>
          <p>
            <span>Diễn viên</span>
            {m.cast || 'Đang cập nhật'}
          </p>
        </div>
        {m.type === 'series' && (
          <div className="episodes">
            <h3>Danh sách tập</h3>
            <div>
              {m.episodeList.map((ep) => (
                <button
                  key={ep.number}
                  className={episode === ep.number ? 'selected' : ''}
                  onClick={() => {
                    setEpisode(ep.number);
                    setPlaying(true);
                  }}
                >
                  Tập {ep.number} · {ep.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="license">
          <h3>Bản quyền & ghi công</h3>
          <p>{m.license}</p>
        </div>
        <section className="reviews">
          <h3>
            Góc cảm nhận <span>{reviews.length}</span>
          </h3>
          {user ? (
            <form onSubmit={review}>
              <textarea
                aria-label="Nhận xét"
                placeholder="Bộ phim để lại điều gì trong bạn?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                maxLength={1000}
              />
              <div>
                <label>
                  Đánh giá{' '}
                  <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}/10
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary" disabled={busy}>
                  {busy ? 'Đang gửi…' : 'Gửi cảm nhận'}
                </button>
              </div>
            </form>
          ) : (
            <p>
              <button className="text-button" onClick={login}>
                Đăng nhập
              </button>{' '}
              để chia sẻ cảm nhận.
            </p>
          )}
          {reviews.map((r) => (
            <article className="review" key={r.id}>
              <div>
                <b>{r.name}</b>
                <span>
                  <Star size={12} />
                  {r.rating}/10
                </span>
              </div>
              <p>{r.body}</p>
              <small>{new Date(Number(r.created)).toLocaleDateString('vi-VN')}</small>
              {user?.role === 'admin' && (
                <button
                  className="text-button"
                  onClick={async () => {
                    try {
                      await api('/reviews/' + r.id, 'DELETE');
                      setReviews(reviews.filter((x) => x.id !== r.id));
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  Xóa bình luận
                </button>
              )}
            </article>
          ))}
          {!reviews.length && <p className="muted">Hãy là người đầu tiên chia sẻ cảm nhận.</p>}
        </section>
      </div>
    </Overlay>
  );
}
