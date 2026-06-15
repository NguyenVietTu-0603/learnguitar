import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import theoryService from '../features/theory/theory.service';
import type { TheoryLessonItem, TheoryTopic } from '../features/theory/theory.types';
import type { CourseLevel } from '../features/course/course.types';

export default function TheoryPage() {
  const [topic, setTopic] = useState<TheoryTopic | ''>('');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [lessons, setLessons] = useState<TheoryLessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadLessons = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await theoryService.getTheoryLessons({ topic, level, page: 1, limit: 24 });
        if (!mounted) return;
        setLessons(result.lessons);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải bài học nhạc lý.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadLessons();

    return () => {
      mounted = false;
    };
  }, [level, topic]);

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Nhạc lý guitar</p>
          <h1>Thư viện bài học nhạc lý</h1>
          <p>Hệ thống bài học theo topic và cấp độ để bạn học đúng thứ tự.</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="tab-toolbar">
            <select className="form-input" value={topic} onChange={(event) => setTopic(event.target.value as TheoryTopic | '')}>
              <option value="">Tất cả topic</option>
              <option value="scale">Scale</option>
              <option value="interval">Interval</option>
              <option value="rhythm">Rhythm</option>
              <option value="key">Key</option>
            </select>

            <select className="form-input" value={level} onChange={(event) => setLevel(event.target.value as CourseLevel | '')}>
              <option value="">Tất cả cấp độ</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {isLoading ? (
          <div className="loading-wrap">
            <div className="auth-loader" aria-hidden="true"></div>
            <p>Đang tải bài học nhạc lý...</p>
          </div>
        ) : (
          <div className="list-grid">
            {lessons.length === 0 ? (
              <AppCard>
                <h3>Chưa có dữ liệu</h3>
                <p>Thử đổi bộ lọc hoặc thêm bài học mới ở trang quản trị.</p>
              </AppCard>
            ) : (
              lessons.map((lesson) => (
                <AppCard key={lesson.id}>
                  <p className="section-kicker">{lesson.topic}</p>
                  <h3>{lesson.title}</h3>
                  <div className="list-card-meta">
                    <span>Cấp độ: {lesson.level}</span>
                    <span>{lesson.tags?.length || 0} tags</span>
                  </div>
                  <Link to={`/nhac-ly/${lesson.slug}`} className="app-btn app-btn-primary">
                    Xem chi tiết
                  </Link>
                </AppCard>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
