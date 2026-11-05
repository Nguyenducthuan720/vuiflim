import React from 'react';
import { Settings } from 'lucide-react';
export default function AppFooter({ navigate, load, user, setAdmin }) {
  return (
    <footer className="app-footer">
      <div>
        <a
          className="logo"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          vui<span>phim</span>
          <i />
        </a>
        <p>Một không gian nhỏ, vạn câu chuyện.</p>
      </div>
      <div className="footer-links">
        <button onClick={() => navigate('saved')}>Danh sách của tôi</button>
        <button onClick={() => navigate('history')}>Lịch sử xem</button>
        <button
          onClick={() => {
            load();
            navigate('local');
          }}
        >
          Kho VuiPhim
        </button>
        {user?.role === 'admin' && (
          <button onClick={() => setAdmin(true)}>
            <Settings size={13} />
            Quản trị
          </button>
        )}
      </div>
      <a
        className="provider-credit"
        href="https://kkphim1.com/api-document"
        target="_blank"
        rel="noreferrer"
      >
        Nguồn danh mục & trình phát: KKPhim ↗
      </a>
    </footer>
  );
}
