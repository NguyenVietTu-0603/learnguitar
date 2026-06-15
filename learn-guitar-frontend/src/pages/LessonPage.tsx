import { Link, useLocation, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import VideoPlayer from '../components/common/VideoPlayer';
import Reveal from '../components/common/Reveal';
import courseService from '../features/course/course.service';
import lessonService from '../features/lesson/lesson.service';
import type { LessonItem } from '../features/course/course.types';
import type { VideoLesson } from '../features/lesson/lesson.types';
import progressService from '../features/progress/progress.service';
import { useAuth } from '../context/useAuth';

interface LessonLocationState {
  lesson?: LessonItem;
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
}

const parseQuizIdFromTags = (tags: string[] | undefined): string | null => {
  if (!Array.isArray(tags)) return null;
  const entry = tags.find((item) => item.toLowerCase().startsWith('quiz:'));
  if (!entry) return null;
  const value = entry.slice(5).trim();
  return value || null;
};

export default function LessonPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { slug, courseSlug } = useParams();
  const state = (location.state as LessonLocationState | null) ?? null;
  const [lesson, setLesson] = useState<LessonItem | null>(state?.lesson ?? null);
  const [resolvedCourseSlug, setResolvedCourseSlug] = useState<string>(state?.courseSlug || courseSlug || '');
  const [courseTitle, setCourseTitle] = useState(state?.courseTitle ?? 'Khóa học guitar');
  const [relatedLessons, setRelatedLessons] = useState<VideoLesson[]>([]);
  const [courseLessons, setCourseLessons] = useState<LessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const loadLesson = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (state?.lesson && state.lesson.slug === slug) {
          if (mounted) {
            setLesson(state.lesson);
            setResolvedCourseSlug(state.courseSlug || courseSlug || '');
            setCourseTitle(state.courseTitle || 'Khóa học guitar');
          }
          return;
        }

        const found = await courseService.findLessonBySlug(slug, courseSlug || state?.courseSlug);
        if (!mounted) return;

        if (!found) {
          setErrorMessage('Không tìm thấy bài học theo slug này.');
          setLesson(null);
          return;
        }

        setLesson(found.lesson);
        setResolvedCourseSlug(found.course.slug);
        setCourseTitle(found.course.title);
        setCourseLessons(found.course.modules.flatMap((module) => module.lessons));
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải bài học.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadLesson();

    return () => {
      mounted = false;
    };
  }, [courseSlug, slug, state?.courseSlug, state?.courseTitle, state?.lesson]);

  useEffect(() => {
    if (!lesson) {
      setRelatedLessons([]);
      return;
    }

    let mounted = true;

    const loadRelatedLessons = async () => {
      try {
        const result = await lessonService.getLessons({
          lessonType: lesson.lessonType,
          level: lesson.level,
          limit: 6,
        });
        if (!mounted) return;
        setRelatedLessons(result.lessons.filter((item) => item.slug !== lesson.slug).slice(0, 3));
      } catch {
        if (!mounted) return;
        setRelatedLessons([]);
      }
    };

    loadRelatedLessons();

    return () => {
      mounted = false;
    };
  }, [lesson]);

  const linkedQuizId = useMemo(() => parseQuizIdFromTags(lesson?.tags), [lesson?.tags]);

  const currentLessonIndex = useMemo(() => {
    if (!lesson || courseLessons.length === 0) return -1;
    return courseLessons.findIndex((item) => item.slug === lesson.slug);
  }, [courseLessons, lesson]);

  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < courseLessons.length - 1 ? courseLessons[currentLessonIndex + 1] : null;

  const transcriptParagraphs = useMemo(() => {
    if (!lesson) return [];

    const chunks = [
      lesson.summary || '',
      lesson.tags?.length ? `Từ khóa trọng tâm: ${lesson.tags.join(', ')}.` : '',
      lesson.lessonType === 'quiz'
        ? 'Hãy hoàn thành phần thực hành để củng cố phản xạ trước khi chuyển sang bài kế tiếp.'
        : 'Sau khi xem video, hãy chơi chậm lại một lượt và tự ghi âm để đối chiếu tiến bộ của mình.',
    ].filter(Boolean);

    return chunks;
  }, [lesson]);

  const materialHighlights = useMemo(() => {
    if (!lesson) return [];

    return [
      `${Math.max(1, Math.round((lesson.durationSec || 0) / 60))} phút học có hướng dẫn`,
      lesson.lessonType === 'video' ? 'Có video minh họa để quan sát tay trái và nhịp tay phải.' : 'Có phần thực hành gắn trực tiếp với bài học.',
      lesson.tags?.length ? `Bám theo ${lesson.tags.length} tag chính để ôn tập đúng trọng tâm.` : 'Có thể kết hợp với tab, hợp âm và phòng thực hành để học sâu hơn.',
    ];
  }, [lesson]);

  const practiceSummary = useMemo(() => {
    if (!lesson) return null;
    return `${lesson.lessonType === 'quiz' ? 'Làm quiz ngắn' : 'Thực hành chậm'} trong ${Math.max(5, Math.round((lesson.durationSec || 0) / 120))} phút để giữ nhịp học đều.`;
  }, [lesson]);

  const practicePoints = useMemo(() => {
    if (!lesson) return [];

    const points = [
      'Khởi động chậm ở 60-70 BPM trước khi tăng nhịp.',
      'Giữ lực tay trái vừa đủ để tránh mỏi và rè dây.',
    ];

    if (lesson.tags && lesson.tags.length > 0) {
      points.push(`Tag chính: ${lesson.tags.join(', ')}`);
    }

    if (lesson.summary) {
      points.push(lesson.summary);
    }

    return points;
  }, [lesson]);

  const markCompleted = async () => {
    if (!lesson) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const duration = lesson.durationSec ?? 0;
      await progressService.updateLessonProgress(lesson.id, {
        markCompleted: true,
        watchedSec: duration,
        accumulatedSec: duration,
      });
      setSuccessMessage('Đã cập nhật tiến độ bài học thành công.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật tiến độ bài học.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="site-container page-block loading-wrap">
          <div className="auth-loader" aria-hidden="true"></div>
          <p>Đang tải bài học...</p>
        </section>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="app-page">
        <section className="site-container page-block">
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
          <AppCard>
            <h3>Không tìm thấy bài học</h3>
            <p>Bạn có thể quay lại trang khóa học để chọn bài khác.</p>
            <AppButton to="/">Về trang chủ</AppButton>
          </AppCard>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="site-container page-block lesson-grid">
        <Reveal>
          <p className="section-kicker">Bài học chi tiết</p>
          <h1>Bài học: {lesson.title}</h1>
          <p>{courseTitle}</p>
          <VideoPlayer
            title={lesson.title}
            description={lesson.summary || 'Bài học tập trung vào kỹ thuật nền tảng và phản xạ nhịp ổn định.'}
            thumbnailUrl={
              lesson.videoThumbnailUrl ||
              'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1400&q=80'
            }
            duration={`${Math.max(1, Math.round((lesson.durationSec || 0) / 60))} phút`}
            videoUrl={lesson.videoUrlHls}
          />

          <AppCard>
            <h3>Điểm cần chú ý</h3>
            <ul>
              {practicePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {practiceSummary ? <p>{practiceSummary}</p> : null}
            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
            {successMessage ? <p className="badge">{successMessage}</p> : null}

            {isAuthenticated ? (
              <AppButton onClick={markCompleted} disabled={isSaving}>
                {isSaving ? 'Đang cập nhật...' : 'Đánh dấu đã hoàn thành'}
              </AppButton>
            ) : (
              <p>
                Bạn cần <Link to="/login">đăng nhập</Link> để cập nhật tiến độ học.
              </p>
            )}
          </AppCard>

          <AppCard>
            <h3>Tóm tắt nội dung bài học</h3>
            <div className="lesson-transcript">
              {transcriptParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </AppCard>
        </Reveal>

        <Reveal delay={140}>
          <AppCard>
            <h3>Tài liệu bài học</h3>
            <ul>
              <li>Loại bài: {lesson.lessonType}</li>
              <li>Cấp độ: {lesson.level}</li>
              <li>Slug: {lesson.slug}</li>
            </ul>

            <AppCard className="lesson-material-card">
              <h4>Tài nguyên đi kèm</h4>
              <ul>
                {materialHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AppCard>

            <div className="stack-actions">
              <Link
                to={linkedQuizId ? `/thuc-hanh?quizId=${encodeURIComponent(linkedQuizId)}` : '/thuc-hanh'}
                state={{
                  prefillQuizId: linkedQuizId,
                  lessonId: lesson.id,
                  lessonSlug: lesson.slug,
                  lessonDurationSec: lesson.durationSec,
                  courseSlug: resolvedCourseSlug,
                  courseTitle,
                  courseId: lesson.courseId,
                }}
                className="app-btn app-btn-primary"
              >
                {lesson.lessonType === 'quiz' ? 'Làm quiz của bài học' : 'Mở phòng thực hành'}
              </Link>
              {resolvedCourseSlug ? (
                <AppButton to={`/khoa-hoc/${resolvedCourseSlug}`} variant="secondary">
                  Quay lại khóa học
                </AppButton>
              ) : null}
              <AppButton to="/tab-nhac" variant="ghost">
                Xem tab liên quan
              </AppButton>
            </div>
            {lesson.lessonType === 'quiz' && !linkedQuizId ? (
              <p className="auth-error">Bài học dạng quiz chưa gắn Quiz ID trong tag (dùng format quiz:YOUR_QUIZ_ID).</p>
            ) : null}
          </AppCard>

          <AppCard>
            <h3>Điều hướng bài học</h3>
            <div className="lesson-navigation-grid">
              <div>
                <p className="section-kicker">Bài trước</p>
                {previousLesson ? (
                  <Link to={`/khoa-hoc/${resolvedCourseSlug}/bai-hoc/${previousLesson.slug}`} className="app-btn app-btn-ghost">
                    {previousLesson.title}
                  </Link>
                ) : (
                  <p>Đây là bài đầu tiên trong lộ trình.</p>
                )}
              </div>
              <div>
                <p className="section-kicker">Bài tiếp theo</p>
                {nextLesson ? (
                  <Link to={`/khoa-hoc/${resolvedCourseSlug}/bai-hoc/${nextLesson.slug}`} className="app-btn app-btn-secondary">
                    {nextLesson.title}
                  </Link>
                ) : (
                  <p>Bạn đang ở bài cuối cùng hiện có.</p>
                )}
              </div>
            </div>
          </AppCard>

          <AppCard>
            <h3>Bài học liên quan</h3>
            {relatedLessons.length === 0 ? (
              <p>Chưa có bài học liên quan phù hợp để gợi ý thêm.</p>
            ) : (
              <div className="exercise-list">
                {relatedLessons.map((item) => (
                  <article key={item.id} className="exercise-item">
                    <div>
                      <strong>{item.title}</strong>
                      <p>
                        {item.lessonType} · {item.level} · {Math.max(1, Math.round((item.durationSec || 0) / 60))} phút
                      </p>
                    </div>
                    <Link to={`/bai-hoc/${item.slug}`} className="app-btn app-btn-ghost">
                      Mở bài
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </AppCard>
        </Reveal>
      </section>
    </main>
  );
}
