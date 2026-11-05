import React, { useState } from 'react';
import { ArrowRight, Clapperboard } from 'lucide-react';
import { api } from '../../../shared/api/httpClient.js';
import Overlay from '../../../shared/components/Modal.jsx';
export default function AuthModal({ mode, setMode, close, onSuccess }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      onSuccess(await api('/auth/' + (mode === 'register' ? 'register' : 'login'), 'POST', data));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Overlay close={close} className="auth-modal">
      <div className="auth-symbol">
        <Clapperboard size={27} />
      </div>
      <span className="eyebrow">MỘT TÀI KHOẢN. VẠN CÂU CHUYỆN.</span>
      <h2>{mode === 'register' ? 'Bắt đầu hành trình' : 'Chào mừng trở lại'}</h2>
      <p>Lưu những bộ phim yêu thích và tiếp nối cảm xúc.</p>
      <form onSubmit={submit} key={mode}>
        {mode === 'register' && (
          <label>
            Tên của bạn
            <input
              name="name"
              required
              maxLength={80}
              autoComplete="name"
              placeholder="Bạn muốn được gọi là gì?"
            />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ban@example.com"
          />
        </label>
        <label>
          Mật khẩu
          <input
            name="password"
            type="password"
            minLength={mode === 'register' ? 8 : 1}
            maxLength={128}
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder="Ít nhất 8 ký tự"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'Đang xử lý…' : mode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="auth-switch">
        {mode === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
        <button
          onClick={() => {
            setMode(mode === 'register' ? 'login' : 'register');
            setError('');
          }}
        >
          {mode === 'register' ? 'Đăng nhập' : 'Đăng ký miễn phí'}
        </button>
      </div>
    </Overlay>
  );
}
