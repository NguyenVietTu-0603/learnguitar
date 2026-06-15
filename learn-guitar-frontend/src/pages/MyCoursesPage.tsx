import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import Reveal from '../components/common/Reveal';
import courseService from '../features/course/course.service';
import type { MyCourseItem } from '../features/course/course.types';

const statusOptions: Array<{ value: '' | 'enrolled' | 'completed' | 'paused'; label: string }> = [
  { value: '', label: 'Tất cả khóa học' },
  { value: 'enrolled', label: 'Đang học' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'paused', label: 'Tạm dừng' },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

export default function MyCoursesPage() {
  const [status, setStatus] = useState<'' | 'enrolled' | 'completed' | 'paused'>('');
  const [courses, setCourses] = useState<MyCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCourses = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await courseService.getMyCourses(status || undefined);
        if (!mounted) return;
        setCourses(result.items);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách khóa học của bạn.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      mounted = false;
    };
  }, [status]);

  const totals = useMemo(() => {
    return courses.reduce(
      (acc, item) => {
        acc.lessons += item.summary.totalLessons;
        acc.completed += item.summary.completedLessons;
        return acc;
      },
      { lessons: 0, completed: 0 }
    );
  }, [courses]);

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Khu vực học tập cá nhân</p>
          <h1>Khóa học của tôi</h1>
          <p>Theo dõi những khóa đã đăng ký, tiếp tục bài đang học dở và xem tiến độ từng lộ trình.</p>
        </Reveal>

        <Reveal delay={80}>
          <AppCard className="catalog-toolbar">
            <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="course-summary-strip">
              <span>{courses.length} khóa học</span>
              <span>{totals.completed}/{totals.lessons} bài đã xong</span>
            </div>
          </AppCard>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {isLoading ? (
          <div className="loading-wrap">
            <div className="auth-loader" aria-hidden="true"></div>
            <p>Đang tải khóa học của bạn...</p>
          </div>
        ) : courses.length === 0 ? (
          <AppCard>
            <h3>Bạn chưa đăng ký khóa học nào</h3>
            <p>Hãy vào thư viện khóa học để chọn một lộ trình phù hợp và bắt đầu học.</p>
            <AppButton to="/khoa-hoc">Khám phá khóa học</AppButton>
          </AppCard>
        ) : (
          <div className="course-catalog-grid my-courses-grid">
            {courses.map((item, index) => (
              <Reveal key={item.id} delay={index * 40}>
                <AppCard className="my-course-card">
                  <div className="course-pillars">
                    <span>{item.course.level}</span>
                    <span>{item.summary.progressPercent}% hoàn thành</span>
                    <span>Cập nhật: {formatDate(item.lastAccessAt)}</span>
                  </div>

                  <h3>{item.course.title}</h3>
                  <p>{item.course.description || 'Lộ trình học thực hành với các bài ngắn, dễ theo dõi theo từng ngày.'}</p>

                  <div className="my-course-stats">
                    <strong>{item.summary.completedLessons}/{item.summary.totalLessons}</strong>
                    <span>bài học đã hoàn thành</span>
                  </div>

                  <div className="my-course-resume">
                    <h4>Tiếp tục học</h4>
                    {item.resumeLesson ? (
                      <>
                        <p>
                          {item.resumeLesson.title} · {item.resumeLesson.percent || 0}%
                        </p>
                        <Link
                          to={`/khoa-hoc/${item.course.slug}/bai-hoc/${item.resumeLesson.slug}`}
                          className="app-btn app-btn-primary"
                        >
                          Mở bài học
                        </Link>
                      </>
                    ) : (
                      <p>Khóa học này chưa có bài học khả dụng để tiếp tục.</p>
                    )}
                  </div>

                  <div className="hero-actions">
                    <AppButton to={`/khoa-hoc/${item.course.slug}`} variant="secondary">
                      Xem lộ trình
                    </AppButton>
                    {item.nextLesson ? (
                      <Link to={`/khoa-hoc/${item.course.slug}/bai-hoc/${item.nextLesson.slug}`} className="app-btn app-btn-ghost">
                        Bài tiếp theo
                      </Link>
                    ) : null}
                  </div>
                </AppCard>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
