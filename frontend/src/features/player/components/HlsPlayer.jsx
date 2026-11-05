import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../shared/api/httpClient.js';
export default function VideoPlayer({ movieId, episode, position = 0, onProgress, sourceUrl }) {
  const ref = useRef(),
    callback = useRef(onProgress),
    last = useRef(0),
    hlsRef = useRef();
  callback.current = onProgress;
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [qualities, setQualities] = useState([]),
    [quality, setQuality] = useState(-1);
  useEffect(() => {
    let active = true,
      hls;
    const video = ref.current;
    last.current = 0;
    setLoading(true);
    setError('');
    setQualities([]);
    setQuality(-1);
    const progress = () => {
      if (video.currentTime > 0) callback.current?.(video.currentTime, episode);
    };
    const loaded = () => {
      setLoading(false);
      if (position > 0 && Number.isFinite(video.duration))
        video.currentTime = Math.min(position, Math.max(0, video.duration - 1));
      video.play().catch(() => {});
    };
    const failure = (message) => {
      setLoading(false);
      setError(
        typeof message === 'string'
          ? message
          : 'Trình duyệt không phát được nguồn này. Hãy thử máy chủ hoặc trình phát khác.',
      );
    };
    const time = () => {
      if (Date.now() - last.current > 10000) {
        last.current = Date.now();
        progress();
      }
    };
    video.addEventListener('loadedmetadata', loaded);
    video.addEventListener('error', failure);
    video.addEventListener('timeupdate', time);
    video.addEventListener('pause', progress);
    video.addEventListener('ended', progress);
    window.addEventListener('pagehide', progress);
    (sourceUrl
      ? Promise.resolve({ url: sourceUrl })
      : api(`/movies/${movieId}/playback/${episode}`)
    )
      .then(async (data) => {
        if (!active) return;
        if (
          /\.m3u8(?:$|\?)/i.test(data.url) &&
          !video.canPlayType('application/vnd.apple.mpegurl')
        ) {
          const { default: Hls } = await import('hls.js');
          if (!active) return;
          if (!Hls.isSupported()) {
            failure('Trình duyệt chưa hỗ trợ HLS. Hãy dùng trình phát máy chủ cung cấp.');
            return;
          }
          hls = new Hls({ capLevelToPlayerSize: true });
          hlsRef.current = hls;
          hls.on(Hls.Events.MANIFEST_PARSED, () =>
            setQualities(
              hls.levels.map((level, index) => ({
                index,
                height: level.height,
                bitrate: level.bitrate,
              })),
            ),
          );
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              const code = data.response?.code;
              failure(
                data.type === Hls.ErrorTypes.NETWORK_ERROR
                  ? `Không tải được video${code ? ' (HTTP ' + code + ')' : ''}. Có thể do mạng, CORS hoặc nguồn đã ngừng. Hãy thử trình phát máy chủ cung cấp.`
                  : `Lỗi giải mã video (${data.details}). Hãy thử trình phát hoặc máy chủ khác.`,
              );
            }
          });
          hls.loadSource(data.url);
          hls.attachMedia(video);
        } else video.src = data.url;
      })
      .catch((e) => {
        if (active) {
          setLoading(false);
          setError(e.message);
        }
      });
    return () => {
      active = false;
      progress();
      video.removeEventListener('loadedmetadata', loaded);
      video.removeEventListener('error', failure);
      video.removeEventListener('timeupdate', time);
      video.removeEventListener('pause', progress);
      video.removeEventListener('ended', progress);
      window.removeEventListener('pagehide', progress);
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [movieId, episode, sourceUrl]);
  return (
    <div className="video-area">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        aria-label={`Trình phát tập ${episode}`}
      />
      {loading && (
        <p className="player-status" role="status">
          Đang tải nguồn phát…
        </p>
      )}
      {error && (
        <p className="error player-status" role="alert">
          {error}
        </p>
      )}
      {qualities.length > 1 && (
        <label className="player-quality">
          Chất lượng{' '}
          <select
            value={quality}
            onChange={(e) => {
              setQuality(+e.target.value);
              if (hlsRef.current) hlsRef.current.currentLevel = +e.target.value;
            }}
          >
            <option value={-1}>Tự động</option>
            {qualities.map((q) => (
              <option key={q.index} value={q.index}>
                {q.height ? q.height + 'p' : Math.round(q.bitrate / 1000) + ' kbps'}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
