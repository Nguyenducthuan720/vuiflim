import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../shared/api/httpClient.js';
const empty = {
  title: '',
  original: '',
  genre: '',
  country: '',
  director: '',
  cast: '',
  poster: '',
  backdrop: '',
  year: new Date().getFullYear(),
  duration: 90,
  rating: 0,
  type: 'movie',
  description: '',
  license: '',
  featured: false,
  published: false,
  episodeList: [{ number: 1, title: 'Phim đầy đủ', videoUrl: '' }],
};
export default function AdminPanel({ notify, onChanged }) {
  const [movies, setMovies] = useState([]),
    [editing, setEditing] = useState(null),
    [data, setData] = useState(empty),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [reviews, setReviews] = useState([]),
    [tab, setTab] = useState('movies');
  async function load() {
    try {
      const [m, r] = await Promise.all([api('/admin/movies'), api('/admin/reviews')]);
      setMovies(m);
      setReviews(r);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  function edit(m) {
    setData(
      m
        ? { ...m, episodeList: m.episodeList.map((e) => ({ ...e })) }
        : { ...empty, episodeList: [{ number: 1, title: 'Phim đầy đủ', videoUrl: '' }] },
    );
    setEditing(m?.id || 'new');
    setError('');
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(
        '/admin/movies' + (editing === 'new' ? '' : '/' + editing),
        editing === 'new' ? 'POST' : 'PUT',
        data,
      );
      setEditing(null);
      await load();
      onChanged();
      notify('Đã lưu phim.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(m) {
    if (!confirm(`Xóa vĩnh viễn “${m.title}” và dữ liệu liên quan?`)) return;
    try {
      await api('/admin/movies/' + m.id, 'DELETE');
      await load();
      onChanged();
      notify('Đã xóa phim.');
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="admin-panel">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">VUIPHIM / QUẢN TRỊ</span>
          <h2>
            {editing
              ? editing === 'new'
                ? 'Thêm phim mới'
                : 'Chỉnh sửa phim'
              : 'Quản lý nội dung'}
          </h2>
        </div>
        {editing ? (
          <button className="secondary" onClick={() => setEditing(null)}>
            <ArrowLeft size={16} />
            Quay lại
          </button>
        ) : (
          <button className="primary" onClick={() => edit()}>
            <Plus size={16} />
            Thêm phim
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {editing ? (
        <form onSubmit={submit} className="admin-form">
          {[
            ['title', 'Tên phim'],
            ['original', 'Tên gốc'],
            ['genre', 'Thể loại'],
            ['country', 'Quốc gia'],
            ['director', 'Đạo diễn'],
            ['cast', 'Diễn viên'],
            ['poster', 'Poster: HTTPS hoặc /media/...'],
            ['backdrop', 'Ảnh bìa: HTTPS hoặc /media/...'],
          ].map(([k, l]) => (
            <label key={k}>
              {l}
              <input
                value={data[k]}
                onChange={(e) => set(k, e.target.value)}
                required={['title', 'original', 'genre', 'country', 'poster', 'backdrop'].includes(
                  k,
                )}
                maxLength={2048}
              />
            </label>
          ))}
          <label>
            Loại phim
            <select
              value={data.type}
              onChange={(e) => {
                const type = e.target.value;
                setData((d) => ({
                  ...d,
                  type,
                  episodeList:
                    type === 'movie' ? [{ ...d.episodeList[0], number: 1 }] : d.episodeList,
                }));
              }}
            >
              <option value="movie">Phim lẻ</option>
              <option value="series">Phim bộ</option>
            </select>
          </label>
          {[
            ['year', 'Năm phát hành', 1888, 2100],
            ['duration', 'Thời lượng mỗi tập (phút)', 1, 10000],
            ['rating', 'Điểm tham khảo', 0, 10],
          ].map(([k, l, min, max]) => (
            <label key={k}>
              {l}
              <input
                type="number"
                required
                value={data[k]}
                min={min}
                max={max}
                step={k === 'rating' ? '.1' : '1'}
                onChange={(e) => set(k, Number(e.target.value))}
              />
            </label>
          ))}
          <label className="full">
            Nội dung phim
            <textarea
              value={data.description}
              onChange={(e) => set('description', e.target.value)}
              required
              maxLength={10000}
            />
          </label>
          <label className="full">
            Bản quyền & ghi công
            <textarea
              value={data.license}
              onChange={(e) => set('license', e.target.value)}
              placeholder="Chủ sở hữu, giấy phép, nguồn gốc và ghi công."
              required
              maxLength={4000}
            />
          </label>
          <div className="admin-checks full">
            <label>
              <input
                type="checkbox"
                checked={data.published}
                onChange={(e) => set('published', e.target.checked)}
              />
              Công khai phim
            </label>
            <label>
              <input
                type="checkbox"
                checked={data.featured}
                onChange={(e) => set('featured', e.target.checked)}
              />
              Hiển thị tiêu điểm
            </label>
          </div>
          <section className="episode-editor full">
            <h3>Nguồn phát {data.type === 'series' ? 'từng tập' : ''}</h3>
            <p className="muted">URL MP4 hoặc HLS (.m3u8). Mỗi tập có một nguồn riêng.</p>
            {data.episodeList.map((ep, i) => (
              <div className="episode-row" key={i}>
                <span>{i + 1}</span>
                <input
                  aria-label={`Tên tập ${i + 1}`}
                  value={ep.title}
                  placeholder="Tên tập"
                  required
                  maxLength={250}
                  onChange={(e) =>
                    set(
                      'episodeList',
                      data.episodeList.map((v, j) =>
                        j === i ? { ...v, title: e.target.value } : v,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`Nguồn tập ${i + 1}`}
                  value={ep.videoUrl}
                  placeholder="https://.../film.mp4 hoặc /media/film.mp4"
                  required
                  onChange={(e) =>
                    set(
                      'episodeList',
                      data.episodeList.map((v, j) =>
                        j === i ? { ...v, videoUrl: e.target.value } : v,
                      ),
                    )
                  }
                />
                {data.episodeList.length > 1 && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Xóa tập ${i + 1}`}
                    onClick={() =>
                      set(
                        'episodeList',
                        data.episodeList
                          .filter((_, j) => j !== i)
                          .map((v, j) => ({ ...v, number: j + 1 })),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {data.type === 'series' && (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  set('episodeList', [
                    ...data.episodeList,
                    {
                      number: data.episodeList.length + 1,
                      title: 'Tập ' + (data.episodeList.length + 1),
                      videoUrl: '',
                    },
                  ])
                }
              >
                <Plus size={16} />
                Thêm tập
              </button>
            )}
          </section>
          <button className="primary" disabled={busy}>
            <Check size={16} />
            {busy ? 'Đang lưu…' : 'Lưu phim'}
          </button>
        </form>
      ) : (
        <>
          <div className="admin-tabs">
            <button onClick={() => setTab('movies')} className={tab === 'movies' ? 'selected' : ''}>
              Kho phim ({movies.length})
            </button>
            <button
              onClick={() => setTab('reviews')}
              className={tab === 'reviews' ? 'selected' : ''}
            >
              Bình luận ({reviews.length})
            </button>
          </div>
          {tab === 'movies' ? (
            <div className="admin-list">
              {movies.length ? (
                movies.map((m) => (
                  <div key={m.id}>
                    <div>
                      <b>{m.title}</b>
                      <small>
                        {m.published ? 'Công khai' : 'Bản nháp'} · {m.episodes} tập · {m.year}
                      </small>
                    </div>
                    <div>
                      <button
                        className="icon-button"
                        aria-label={'Sửa ' + m.title}
                        onClick={() => edit(m)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={'Xóa ' + m.title}
                        onClick={() => remove(m)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <h3>Kho phim chưa có nội dung</h3>
                  <p>Thêm phim cùng nguồn phát và thông tin bản quyền.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-reviews">
              {reviews.map((r) => (
                <article key={r.id}>
                  <b>
                    {r.name} · {r.title}
                  </b>
                  <p>{r.body}</p>
                  <button
                    className="text-button"
                    onClick={async () => {
                      try {
                        await api('/reviews/' + r.id, 'DELETE');
                        load();
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Xóa bình luận
                  </button>
                </article>
              ))}
              {!reviews.length && <p className="muted">Chưa có bình luận.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
