import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import lessonService from '../features/lesson/lesson.service';
import type { VideoLesson, CourseLevel } from '../features/lesson/lesson.types';

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
};

const LEVEL_COLOR: Record<CourseLevel, string> = {
  beginner: '#6b8e5f',
  intermediate: '#c9a030',
  advanced: '#c0552a',
};

function formatDuration(sec?: number): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoLessonsPage() {
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await lessonService.getLessons({ lessonType: 'video', level, search, limit: 24 });
        if (!mounted) return;
        setLessons(result.lessons);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải bài học.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [level, search]);

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Học qua video</p>
          <h1>Bài học Video Guitar</h1>
          <p>Xem và thực hành theo hướng dẫn video từ cơ bản đến nâng cao.</p>
        </Reveal>

        <Reveal delay={80}>
          <form
            className="tab-toolbar"
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
          >
            <input
              className="form-input"
              placeholder="Tìm bài học..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select
              className="form-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as CourseLevel | '')}
            >
              <option value="">Tất cả cấp độ</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung bình</option>
              <option value="advanced">Nâng cao</option>
            </select>
            <div className="stack-actions">
              <button type="submit" className="app-btn app-btn-primary">Tìm</button>
              <button type="button" className="app-btn app-btn-ghost" onClick={() => { setSearchInput(''); setSearch(''); setLevel(''); }}>
                Đặt lại
              </button>
            </div>
          </form>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {isLoading ? (
          <div className="loading-wrap">
            <div className="auth-loader" aria-hidden="true" />
            <p>Đang tải bài học...</p>
          </div>
        ) : (
          <Reveal delay={120}>
            {lessons.length === 0 ? (
              <AppCard>
                <p style={{ textAlign: 'center', color: '#6a6258' }}>Chưa có bài học video nào. Thêm dữ liệu mẫu trước nhé!</p>
              </AppCard>
            ) : (
              <div className="video-lessons-grid">
                {lessons.map((lesson) => (
                  <AppCard key={lesson.id} className="video-lesson-card">
                    <div className="vlc-thumb">
                      {lesson.videoThumbnailUrl ? (
                        <img src={lesson.videoThumbnailUrl} alt={lesson.title} loading="lazy" />
                      ) : (
                        <div className="vlc-thumb-placeholder">🎸</div>
                      )}
                      {lesson.durationSec ? (
                        <span className="vlc-duration">{formatDuration(lesson.durationSec)}</span>
                      ) : null}
                    </div>
                    <div className="vlc-body">
                      <span
                        className="vlc-level"
                        style={{ color: LEVEL_COLOR[lesson.level] }}
                      >
                        {LEVEL_LABEL[lesson.level]}
                      </span>
                      <h3 className="vlc-title">{lesson.title}</h3>
                      {lesson.summary ? <p className="vlc-summary">{lesson.summary}</p> : null}
                      {lesson.tags && lesson.tags.length > 0 ? (
                        <div className="vlc-tags">
                          {lesson.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="vlc-tag">#{tag}</span>
                          ))}
                        </div>
                      ) : null}
                      <Link to={`/video-lessons/${lesson.slug}`} className="app-btn app-btn-primary vlc-btn">
                        ▶ Xem bài học
                      </Link>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </Reveal>
        )}
      </section>
    </main>
  );
}
