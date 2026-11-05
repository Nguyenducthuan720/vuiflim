import React from 'react';
import { Play, Search } from 'lucide-react';
export default function EpisodeSelector({
  server,
  detail,
  serverIndex,
  setServerIndex,
  setEpisodeIndex,
  episodeIndex,
  setEpisodeSearch,
  episodeSearch,
  setPlaying,
  seasonControl,
}) {
  return (
    <section className="cinema-episodes">
      <div className="browse-heading">
        <h3>Chọn máy chủ & tập phim</h3>
        <span>{server.episodes.length} tập</span>
      </div>
      {seasonControl}
      <div className="server-tabs">
        {detail.servers.map((s, i) => (
          <button
            key={s.id}
            className={serverIndex === i ? 'selected' : ''}
            onClick={() => {
              setServerIndex(i);
              setEpisodeIndex(0);
              setEpisodeSearch('');
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="episode-filter">
        <Search size={14} />
        <input
          aria-label="Tìm số tập"
          placeholder="Tìm tập…"
          value={episodeSearch}
          onChange={(e) => setEpisodeSearch(e.target.value)}
        />
      </div>
      <div className="cinema-episode-grid">
        {server.episodes
          .map((ep, i) => ({ ep, i }))
          .filter(({ ep }) => ep.name.toLowerCase().includes(episodeSearch.toLowerCase()))
          .map(({ ep, i }) => (
            <button
              key={ep.id}
              className={episodeIndex === i ? 'selected' : ''}
              onClick={() => {
                setEpisodeIndex(i);
                setPlaying(true);
              }}
            >
              <Play size={12} />
              {ep.name}
            </button>
          ))}
      </div>
    </section>
  );
}
