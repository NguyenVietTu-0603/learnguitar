import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import ProgressRing from '../components/common/ProgressRing';
import Reveal from '../components/common/Reveal';
import courseService from '../features/course/course.service';
import type { CourseDetail, LessonItem } from '../features/course/course.types';
import progressService from '../features/progress/progress.service';
import { useAuth } from '../context/useAuth';

const formatDuration = (durationSec?: number): string => {
  if (!durationSec || durationSec <= 0) return 'Chưa cập nhật thời lượng';
  return `${Math.max(1, Math.round(durationSec / 60))} phút`;
};

export default function CourseDetailPage() {
  const { isAuthenticated } = useAuth();
  const { slug } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessonPercentBySlug, setLessonPercentBySlug] = useState<Record<string, number>>({});
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const loadCourse = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const detail = await courseService.getCourseBySlug(slug);

        if (!mounted) return;
        setCourse(detail);

        if (!isAuthenticated) {
          setLessonPercentBySlug({});
          setIsEnrolled(false);
          return;
        }

        const [progress, myCourses] = await Promise.all([
          progressService.getMyProgress(detail.id),
          courseService.getMyCourses(),
        ]);
        if (!mounted) return;

        const map = progress.lessonProgress.reduce<Record<string, number>>((acc, lesson) => {
          if (lesson.slug) {
            acc[lesson.slug] = lesson.percent;
          }
          return acc;
        }, {});

        setLessonPercentBySlug(map);
        setIsEnrolled(myCourses.items.some((item) => item.course.id === detail.id));
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu khóa học.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, slug]);

  const lessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        ...lesson,
        moduleTitle: module.title,
      }))
    );
  }, [course]);

  const completedLessons = lessons.filter((lesson) => (lessonPercentBySlug[lesson.slug] ?? 0) >= 95).length;
  const inProgressLessons = lessons.filter((lesson) => {
    const percent = lessonPercentBySlug[lesson.slug] ?? 0;
    return percent > 0 && percent < 95;
  }).length;
  const totalPercent = lessons.length
    ? Math.round(lessons.reduce((sum, lesson) => sum + (lessonPercentBySlug[lesson.slug] ?? 0), 0) / lessons.length)
    : 0;

  const getLessonStatus = (lesson: LessonItem): string => {
    const percent = lessonPercentBySlug[lesson.slug] ?? 0;
    if (percent >= 95) return 'Đã học';
    if (percent > 0) return 'Đang học';
    return isAuthenticated ? 'Sắp học' : 'Đăng nhập để theo dõi';
  };

  const handleEnroll = async () => {
    if (!course || isEnrolled) return;

    setIsEnrolling(true);
    setErrorMessage(null);
    setEnrollMessage(null);

    try {
      await courseService.enrollCourse(course.id);
      setIsEnrolled(true);
      setEnrollMessage('Bạn đã đăng ký khóa học này. Từ giờ có thể tiếp tục học trong mục Khóa học của tôi.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể đăng ký khóa học.');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="site-container page-block loading-wrap">
          <div className="auth-loader" aria-hidden="true"></div>
          <p>Đang tải khóa học...</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="app-page">
        <section className="site-container page-block">
          <p className="auth-error">{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="app-page">
        <section className="site-container page-block">
          <AppCard>
            <h3>Không tìm thấy khóa học</h3>
            <p>Vui lòng chọn một khóa học khác.</p>
          </AppCard>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="site-container page-block course-grid">
        <Reveal>
          <p className="section-kicker">Khóa học nổi bật</p>
          <h1>Khóa học: {course.title}</h1>
          <p>{course.description || 'Lộ trình được chia thành các bài học ngắn để bạn luyện đều mỗi ngày.'}</p>

          <div className="course-pillars">
            <span>Trình độ: {course.level}</span>
            <span>Tổng module: {course.modules.length}</span>
            <span>Tổng bài học: {lessons.length}</span>
            <span>Slug: {course.slug}</span>
          </div>

          <div className="hero-actions">
            {isAuthenticated ? (
              isEnrolled ? (
                <>
                  <span className="soft-badge">Đã có trong khóa học của tôi</span>
                  <AppButton to="/khoa-hoc-cua-toi" variant="secondary">
                    Mở khu vực học tập
                  </AppButton>
                </>
              ) : (
                <button type="button" className="app-btn app-btn-primary" onClick={handleEnroll} disabled={isEnrolling}>
                  {isEnrolling ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
                </button>
              )
            ) : (
              <AppButton to="/login">Đăng nhập để đăng ký</AppButton>
            )}
          </div>

          {enrollMessage ? <p className="badge">{enrollMessage}</p> : null}

          <AppCard className="lesson-list-card">
            <h3>Danh sách bài học</h3>
            {lessons.length === 0 ? (
              <p>Khóa học chưa có bài học công khai.</p>
            ) : (
              lessons.map((lesson) => (
                <article key={lesson.id} className="lesson-item">
                  <div>
                    <h4>{lesson.title}</h4>
                    <p>
                      {formatDuration(lesson.durationSec)} · {lesson.lessonType} · {(lesson as LessonItem & { moduleTitle?: string }).moduleTitle}
                    </p>
                  </div>
                  <div className="lesson-actions">
                    <span className="soft-badge">{getLessonStatus(lesson)}</span>
                    <Link
                      to={`/khoa-hoc/${course.slug}/bai-hoc/${lesson.slug}`}
                      state={{
                        lesson,
                        courseId: course.id,
                        courseSlug: course.slug,
                        courseTitle: course.title,
                      }}
                      className="app-btn app-btn-ghost"
                    >
                      Vào bài
                    </Link>
                  </div>
                </article>
              ))
            )}
          </AppCard>
        </Reveal>

        <Reveal delay={120}>
          <AppCard className="course-side-card">
            <ProgressRing value={totalPercent} label="Tiến độ khóa học" />
            <ul>
              <li>{completedLessons} bài đã hoàn thành</li>
              <li>{inProgressLessons} bài đang luyện</li>
              <li>{Math.max(0, lessons.length - completedLessons - inProgressLessons)} bài chưa bắt đầu</li>
            </ul>
            <AppButton to="/dashboard" variant="secondary">
              Về bảng điều khiển
            </AppButton>
          </AppCard>
        </Reveal>
      </section>
    </main>
  );
}
