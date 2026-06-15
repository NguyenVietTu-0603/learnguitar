import { useState, useRef } from 'react';

interface VideoPlayerProps {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  videoUrl?: string | null;
}

export default function VideoPlayer({ title, description, thumbnailUrl, duration, videoUrl }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 100);
  };

  if (videoUrl && isPlaying) {
    return (
      <section className="video-player-card" aria-label="Trình phát bài học">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          className="video-actual"
          style={{ width: '100%', display: 'block', maxHeight: '480px', background: '#000', borderRadius: '0' }}
        >
          Trình duyệt không hỗ trợ video.
        </video>
        <div className="video-player-content">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="video-player-card" aria-label="Trình phát bài học">
      <div className="video-thumb-wrapper">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="video-thumb" loading="lazy" />
        ) : (
          <div className="video-thumb" style={{ background: 'linear-gradient(135deg,#2c2422,#5c4a31)', display: 'grid', placeItems: 'center', color: '#c9a66b', fontSize: '3rem' }}>
            🎸
          </div>
        )}
        <button
          type="button"
          className="video-play-btn"
          aria-label={`Phát video ${title}`}
          onClick={videoUrl ? handlePlay : undefined}
          style={{ cursor: videoUrl ? 'pointer' : 'default' }}
        >
          ▶
        </button>
        {duration ? <span className="video-duration">{duration}</span> : null}
        {!videoUrl ? (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
            Video chưa có
          </span>
        ) : null}
      </div>
      <div className="video-player-content">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
    </section>
  );
}
