import { useEffect, useMemo, useState } from 'react';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import Reveal from '../components/common/Reveal';
import courseService from '../features/course/course.service';
import type { CourseLevel, CourseListItem } from '../features/course/course.types';

const levelOptions: Array<{ value: '' | CourseLevel; label: string }> = [
  { value: '', label: 'Tất cả trình độ' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'' | CourseLevel>('');

  useEffect(() => {
    let mounted = true;

    const loadCourses = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await courseService.getCourses({
          page: 1,
          limit: 24,
          level,
          search: search.trim() || undefined,
        });

        if (!mounted) return;
        setCourses(result.courses);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách khóa học.');
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
  }, [level, search]);

  const totalByLevel = useMemo(() => {
    return {
      beginner: courses.filter((item) => item.level === 'beginner').length,
      intermediate: courses.filter((item) => item.level === 'intermediate').length,
      advanced: courses.filter((item) => item.level === 'advanced').length,
    };
  }, [courses]);

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Thư viện khóa học</p>
          <h1>Khóa học guitar theo lộ trình thực tế</h1>
          <p>Lọc theo trình độ và từ khóa để vào thẳng nội dung phù hợp với bạn.</p>
        </Reveal>

        <Reveal delay={80}>
          <AppCard className="catalog-toolbar">
            <input
              className="form-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mô tả"
            />
            <select
              className="form-input"
              value={level}
              onChange={(event) => setLevel(event.target.value as '' | CourseLevel)}
            >
              {levelOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AppCard>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        <Reveal delay={120}>
          <div className="course-summary-strip">
            <span>Tổng: {courses.length}</span>
            <span>Beginner: {totalByLevel.beginner}</span>
            <span>Intermediate: {totalByLevel.intermediate}</span>
            <span>Advanced: {totalByLevel.advanced}</span>
          </div>
        </Reveal>

        {isLoading ? (
          <section className="site-container page-block loading-wrap">
            <div className="auth-loader" aria-hidden="true"></div>
            <p>Đang tải khóa học...</p>
          </section>
        ) : (
          <div className="course-catalog-grid">
            {courses.length === 0 ? (
              <AppCard>
                <h3>Chưa có khóa học phù hợp</h3>
                <p>Hãy thử đổi từ khóa tìm kiếm hoặc bộ lọc trình độ.</p>
              </AppCard>
            ) : (
              courses.map((course, index) => (
                <Reveal key={course.id} delay={index * 40}>
                  <AppCard className="course-catalog-card">
                    <p className="section-kicker">{course.level}</p>
                    <h3>{course.title}</h3>
                    <p>{course.description || 'Lộ trình chia thành các bài học ngắn, dễ theo dõi mỗi ngày.'}</p>
                    <div className="stack-actions">
                      <AppButton to={`/khoa-hoc/${course.slug}`}>Xem chi tiết</AppButton>
                    </div>
                  </AppCard>
                </Reveal>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}