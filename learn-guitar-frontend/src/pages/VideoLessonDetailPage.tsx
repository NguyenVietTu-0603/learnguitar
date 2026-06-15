import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import VideoPlayer from '../components/common/VideoPlayer';
import Reveal from '../components/common/Reveal';
import lessonService from '../features/lesson/lesson.service';
import type { VideoLesson } from '../features/lesson/lesson.types';
import { resolveMediaUrl } from '../utils/resolveUrl';

function formatDuration(sec?: number): string {
  if (!sec) return 'Không rõ';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} phút ${s > 0 ? s + ' giây' : ''}`.trim();
}

export default function VideoLessonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await lessonService.getLessonBySlug(slug);
        if (!mounted) return;
        setLesson(data);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải bài học.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="site-container page-block loading-wrap">
          <div className="auth-loader" aria-hidden="true" />
          <p>Đang tải bài học...</p>
        </section>
      </main>
    );
  }

  if (errorMessage || !lesson) {
    return (
      <main className="app-page">
        <section className="site-container page-block">
          <AppCard>
            <h3>Không tìm thấy bài học</h3>
            <p>{errorMessage || 'Bài học không tồn tại.'}</p>
            <Link to="/video-lessons" className="app-btn app-btn-ghost">← Quay lại danh sách</Link>
          </AppCard>
        </section>
      </main>
    );
  }

  const videoUrl = resolveMediaUrl(lesson.videoUrlHls);
  const thumbUrl = lesson.videoThumbnailUrl || undefined;

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <Link to="/video-lessons" className="vld-back">← Tất cả bài học</Link>
          <p className="section-kicker">Bài học video</p>
          <h1>{lesson.title}</h1>

          <div className="vld-grid">
            {/* Video Player */}
            <div className="vld-main">
              <VideoPlayer
                title={lesson.title}
                description={lesson.summary}
                thumbnailUrl={thumbUrl}
                duration={formatDuration(lesson.durationSec)}
                videoUrl={videoUrl}
              />

              {/* Notes */}
              <AppCard>
                <h3>📝 Điểm cần chú ý</h3>
                <ul>
                  <li>Khởi động với tempo chậm (60 BPM) trước khi tăng nhịp.</li>
                  <li>Giữ lực tay trái vừa đủ, tránh căng cơ khi bấm lâu.</li>
                  <li>Tập từng đoạn nhỏ, lặp lại ít nhất 5 lần trước khi nối.</li>
                  {lesson.summary ? <li>{lesson.summary}</li> : null}
                </ul>
              </AppCard>
            </div>

            {/* Sidebar */}
            <aside className="vld-sidebar">
              <AppCard>
                <h3>Thông tin bài học</h3>
                <div className="vld-meta">
                  <div className="vld-meta-row">
                    <span>Cấp độ</span>
                    <strong>
                      {{ beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' }[lesson.level]}
                    </strong>
                  </div>
                  <div className="vld-meta-row">
                    <span>Thời lượng</span>
                    <strong>{formatDuration(lesson.durationSec)}</strong>
                  </div>
                  <div className="vld-meta-row">
                    <span>Loại</span>
                    <strong>Video</strong>
                  </div>
                </div>
                {lesson.tags && lesson.tags.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#6a6258' }}>Tags:</p>
                    <div className="vlc-tags">
                      {lesson.tags.map((tag) => (
                        <span key={tag} className="vlc-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </AppCard>

              <AppCard>
                <h3>🎯 Tiếp theo</h3>
                <p style={{ color: '#6a6258', fontSize: '0.9rem' }}>Sau khi xem xong, hãy thực hành ngay và kiểm tra kiến thức qua quiz.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <Link to="/text-quiz" className="app-btn app-btn-primary">📋 Làm quiz liên quan</Link>
                  <Link to="/thuc-hanh" className="app-btn app-btn-ghost">🎸 Phòng thực hành</Link>
                  <Link to="/video-lessons" className="app-btn app-btn-ghost">← Bài học khác</Link>
                </div>
              </AppCard>
            </aside>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
