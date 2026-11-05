import { useLibrary } from '../features/library/hooks/useLibrary.js';
import { useSession } from '../features/auth/hooks/useSession.js';
import LibraryPage from '../features/library/pages/LibraryPage.jsx';
import AppFooter from './layout/AppFooter.jsx';
import AppHeader from './layout/AppHeader.jsx';
import React, { useState, useEffect } from 'react';
import MovieDetailsPage from '../features/movie/pages/MovieDetailsPage.jsx';
import { useMovieRoute } from './hooks/useMovieRoute.js';
import { Check, X } from 'lucide-react';
import KkphimCatalog from '../features/catalog/pages/CatalogPage.jsx';
import AuthModal from '../features/auth/components/AuthModal.jsx';
import AccountModal from '../features/account/components/AccountModal.jsx';
import AdminPanel from '../features/admin/components/AdminPanel.jsx';
import Overlay from '../shared/components/Modal.jsx';

import MovieModal from '../features/library/components/MovieDetailsModal.jsx';
import '../shared/styles/base.css';
import '../features/catalog/styles/catalog.css';
import './styles/layout.css';
import '../features/movie/styles/movie-details.css';
import '../features/player/styles/player.css';
import '../shared/styles/images.css';
export default function App() {
  const [catalogRevision, setCatalogRevision] = useState(0);
  const { route: movieRoute, openMovie, leaveMovie } = useMovieRoute();
  const [view, setView] = useState('home'),
    [search, setSearch] = useState(''),
    [query, setQuery] = useState(''),
    [auth, setAuth] = useState(null),
    [account, setAccount] = useState(false),
    [admin, setAdmin] = useState(false),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(''),
    [selected, setSelected] = useState(null),
    [playing, setPlaying] = useState(false);
  const { user, setUser } = useSession();
  const notify = (message) => setNotice(message);
  const { library, libraryError, filtered, sync, load, favorite } = useLibrary(
    user,
    view,
    () => setAuth('login'),
    notify,
  );
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(''), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    document.body.style.overflow = auth || account || admin || selected ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [auth, account, admin, selected]);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === 'Escape') {
        setAuth(null);
        setAccount(false);
        setAdmin(false);
        setSelected(null);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  function navigate(next) {
    leaveMovie();
    setCatalogRevision((v) => v + 1);
    setView(next);
    setQuery('');
    setSearch('');
    setMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const online = ['home', 'movie', 'series', 'animation'].includes(view);

  return (
    <div className="app-shell">
      <AppHeader
        view={view}
        navigate={navigate}
        mobile={mobile}
        setMobile={setMobile}
        search={search}
        setSearch={setSearch}
        setView={(next) => {
          leaveMovie();
          setView(next);
        }}
        setQuery={setQuery}
        user={user}
        setAccount={setAccount}
        setAuth={setAuth}
        onSelectMovie={openMovie}
      />
      <main className="app-main">
        {movieRoute ? (
          <MovieDetailsPage
            key={movieRoute.slug}
            movie={movieRoute.movie}
            autoPlay={movieRoute.autoPlay}
            user={user}
            onLogin={() => setAuth('login')}
            onBack={() => navigate('home')}
            onOpenMovie={openMovie}
          />
        ) : online ? (
          <KkphimCatalog
            key={view + ':' + catalogRevision}
            requestedType={
              view === 'movie'
                ? 'phim-le'
                : view === 'series'
                  ? 'phim-bo'
                  : view === 'animation'
                    ? 'hoat-hinh'
                    : 'all'
            }
            requestedQuery={query}
            onOpenMovie={openMovie}
          />
        ) : (
          <LibraryPage
            view={view}
            user={user}
            filtered={filtered}
            library={library}
            libraryError={libraryError}
            setAuth={setAuth}
            sync={sync}
            load={load}
            favorite={favorite}
            setSelected={setSelected}
            setPlaying={setPlaying}
            navigate={navigate}
          />
        )}
      </main>
      <AppFooter navigate={navigate} load={load} user={user} setAdmin={setAdmin} />
      {auth && (
        <AuthModal
          mode={auth}
          setMode={setAuth}
          close={() => setAuth(null)}
          onSuccess={(u) => {
            setUser(u);
            setAuth(null);
            notify('Chào mừng ' + u.name);
          }}
        />
      )}
      {account && user && (
        <AccountModal
          user={user}
          close={() => setAccount(false)}
          onLogout={() => setUser(null)}
          onHistory={() => navigate('history')}
          onAdmin={() => setAdmin(true)}
          onClear={sync}
          notify={notify}
        />
      )}
      {admin && (
        <Overlay close={() => setAdmin(false)} className="admin-modal">
          <AdminPanel onChanged={load} notify={notify} />
        </Overlay>
      )}
      {selected && (
        <MovieModal
          movie={selected}
          playing={playing}
          setPlaying={setPlaying}
          close={() => {
            setSelected(null);
            sync();
          }}
          saved={library.favorites.includes(selected.id)}
          onSave={() => favorite(selected)}
          user={user}
          login={() => setAuth('login')}
          history={library.history.find((h) => h.movie_id === selected.id)}
          notify={notify}
          onProgressSaved={sync}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button aria-label="Đóng thông báo" onClick={() => setNotice('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
