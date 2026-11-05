import React, { useState } from 'react';
import { Clock, LogOut, Settings } from 'lucide-react';
import Overlay from '../../../shared/components/Modal.jsx';
import { api } from '../../../shared/api/httpClient.js';
export default function AccountModal({
  user,
  close,
  onLogout,
  onHistory,
  onAdmin,
  onClear,
  notify,
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.newPassword !== data.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      setBusy(false);
      return;
    }
    try {
      await api('/auth/password', 'PATCH', data);
      onLogout();
      close();
      notify('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Overlay close={close} className="auth-modal">
      <span className="eyebrow">TÀI KHOẢN CỦA BẠN</span>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <div className="account-links">
        <button
          className="secondary"
          onClick={() => {
            onHistory();
            close();
          }}
        >
          <Clock size={16} />
          Lịch sử xem
        </button>
        {user.role === 'admin' && (
          <button
            className="secondary"
            onClick={() => {
              onAdmin();
              close();
            }}
          >
            <Settings size={16} />
            Quản trị
          </button>
        )}
      </div>
      <form onSubmit={change}>
        <h3>Đổi mật khẩu</h3>
        <label>
          Mật khẩu hiện tại
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            maxLength={128}
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            name="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <label>
          Xác nhận mật khẩu mới
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Đổi mật khẩu'}
        </button>
      </form>
      <div className="account-footer">
        <button
          className="text-button"
          onClick={async () => {
            if (!confirm('Xóa toàn bộ lịch sử xem của bạn?')) return;
            try {
              await api('/history', 'DELETE');
              onClear();
              notify('Đã xóa lịch sử.');
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Xóa lịch sử xem
        </button>
        <button
          className="text-button"
          onClick={async () => {
            try {
              await api('/auth/logout', 'POST');
              onLogout();
              close();
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <LogOut size={14} />
          Đăng xuất
        </button>
      </div>
    </Overlay>
  );
}
