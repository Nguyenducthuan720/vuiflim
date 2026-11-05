import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { fetchComments, createComment, deleteComment } from '../api/commentsApi.js';
export default function MovieComments({ slug, user, onLogin }) {
  const [data, setData] = useState({ results: [], total: 0 }),
    [page, setPage] = useState(1),
    [body, setBody] = useState(''),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchComments(slug, page)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, page, retry]);
  async function submit(e) {
    e.preventDefault();
    if (!user) {
      onLogin();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createComment(slug, body);
      setBody('');
      setPage(1);
      setRetry((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!window.confirm('Xóa bình luận này?')) return;
    setBusy(true);
    try {
      await deleteComment(id);
      if (data.results.length === 1 && page > 1) setPage((v) => v - 1);
      else setRetry((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="movie-comments" id="binh-luan">
      <div className="comments-heading">
        <h2>
          <MessageSquare size={21} />
          Bình luận <span>{data.total}</span>
        </h2>
        <p>Chia sẻ cảm nhận của bạn về bộ phim.</p>
      </div>
      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <div className="comment-avatar">{user.name[0].toUpperCase()}</div>
          <div>
            <label htmlFor="movie-comment">Bình luận với tên {user.name}</label>
            <textarea
              id="movie-comment"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              maxLength={1000}
              placeholder="Bạn nghĩ gì về bộ phim? Đừng tiết lộ nội dung quan trọng nhé…"
            />
            <div className="comment-form-footer">
              <span>{body.length}/1000</span>
              <button className="primary" disabled={busy || !body.trim()}>
                <Send size={14} />
                {busy ? 'Đang gửi…' : 'Gửi bình luận'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-signin">
          <MessageSquare size={22} />
          <p>Đăng nhập để tham gia trò chuyện cùng mọi người.</p>
          <button className="primary" onClick={onLogin}>
            Đăng nhập
          </button>
        </div>
      )}
      {error && (
        <div className="comment-error" role="alert">
          <p>{error}</p>
          <button className="text-button" onClick={() => setRetry((v) => v + 1)}>
            Tải lại bình luận
          </button>
        </div>
      )}
      {loading ? (
        <p className="muted" role="status">
          Đang tải bình luận…
        </p>
      ) : data.results.length ? (
        <>
          <div className="comment-list">
            {data.results.map((c) => (
              <article key={c.id}>
                <div className="comment-avatar">{c.name[0]?.toUpperCase()}</div>
                <div className="comment-content">
                  <div className="comment-meta">
                    <b>{c.name}</b>
                    <time dateTime={new Date(Number(c.created)).toISOString()}>
                      {new Date(Number(c.created)).toLocaleString('vi-VN')}
                    </time>
                    {user && (user.id === c.user_id || user.role === 'admin') && (
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={'Xóa bình luận của ' + c.name}
                        onClick={() => remove(c.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p>{c.body}</p>
                </div>
              </article>
            ))}
          </div>
          {data.total > 20 && (
            <div className="catalog-pagination">
              <button
                className="secondary"
                disabled={page <= 1}
                onClick={() => setPage((v) => v - 1)}
              >
                <ArrowLeft size={14} />
                Trước
              </button>
              <span>
                {page}/{Math.ceil(data.total / 20)}
              </span>
              <button
                className="secondary"
                disabled={page * 20 >= data.total}
                onClick={() => setPage((v) => v + 1)}
              >
                Tiếp
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        !error && (
          <div className="comments-empty">
            Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm nhận!
          </div>
        )
      )}
    </section>
  );
}
