import React, { useState, useEffect } from 'react';
import VideoPlayer from './HlsPlayer.jsx';
export default function ProviderPlayer({ episode }) {
  const [mode, setMode] = useState(episode.embedUrl ? 'embed' : 'hls'),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setMode(episode.embedUrl ? 'embed' : 'hls');
    setAttempt(0);
  }, [episode.embedUrl, episode.url]);
  return (
    <div className="provider-player">
      <div className="player-modes">
        <span>Trình phát</span>
        {episode.embedUrl && (
          <button className={mode === 'embed' ? 'selected' : ''} onClick={() => setMode('embed')}>
            Máy chủ cung cấp
          </button>
        )}
        {episode.url && (
          <button className={mode === 'hls' ? 'selected' : ''} onClick={() => setMode('hls')}>
            HLS trực tiếp
          </button>
        )}
        <button onClick={() => setAttempt((v) => v + 1)}>Tải lại</button>
      </div>
      {mode === 'embed' && episode.embedUrl ? (
        <iframe
          key={episode.embedUrl + attempt}
          className="provider-frame"
          src={episode.embedUrl}
          title={'Trình phát ' + episode.name}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : episode.url ? (
        <VideoPlayer key={episode.url + attempt} sourceUrl={episode.url} episode={1} />
      ) : (
        <p className="error">Nguồn phát không khả dụng. Chọn máy chủ khác.</p>
      )}
      <p className="provider-help">
        Nếu không phát được, thử trình phát còn lại hoặc đổi máy chủ/ngôn ngữ bên dưới.
      </p>
    </div>
  );
}
