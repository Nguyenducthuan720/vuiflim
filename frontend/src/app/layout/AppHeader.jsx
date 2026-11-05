import React from 'react';
import { Menu, Play } from 'lucide-react';
import MovieSearch from '../../features/catalog/components/MovieSearch.jsx';
export default function AppHeader({
  view,
  navigate,
  mobile,
  setMobile,
  search,
  setSearch,
  setView,
  setQuery,
  user,
  setAccount,
  setAuth,
  onSelectMovie,
}) {
  return (
    <header className="app-header">
      <a
        className="logo"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigate('home');
        }}
      >
        <span className="logo-mark">
          <Play size={16} fill="currentColor" />
        </span>
        vui<span>phim</span>
        <i />
      </a>
      <button
        className="mobile-menu icon-button"
        aria-label="Mở menu"
        onClick={() => setMobile(!mobile)}
      >
        <Menu />
      </button>
      <nav className={mobile ? 'mobile-open' : ''}>
        {[
          ['home', 'Khám phá'],
          ['movie', 'Phim lẻ'],
          ['series', 'Phim bộ'],
          ['animation', 'Hoạt hình'],
        ].map(([key, label]) => (
          <button key={key} className={view === key ? 'active' : ''} onClick={() => navigate(key)}>
            {label}
          </button>
        ))}
      </nav>
      <MovieSearch
        className="header-search"
        label="Tìm phim trực tuyến"
        value={search}
        onChange={setSearch}
        onSelect={onSelectMovie}
        onSubmit={(keyword) => {
          setView('home');
          setQuery(keyword);
          setMobile(false);
        }}
      />
      <div className="header-actions">
        {user ? (
          <button
            className="avatar"
            aria-label="Tài khoản"
            title={user.name}
            onClick={() => setAccount(true)}
          >
            {user.name[0].toUpperCase()}
          </button>
        ) : (
          <button className="login" onClick={() => setAuth('login')}>
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
