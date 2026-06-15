import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import theoryService from '../features/theory/theory.service';
import type { TheoryLessonItem } from '../features/theory/theory.types';

export default function TheoryDetailPage() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState<TheoryLessonItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const loadDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await theoryService.getTheoryBySlug(slug);
        if (!mounted) return;
        setLesson(result);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết bài học.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [slug]);

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

  return (
    <main className="app-page">
      <section className="site-container page-block">
        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        {!lesson ? null : (
          <Reveal>
            <p className="section-kicker">{lesson.topic}</p>
            <h1>{lesson.title}</h1>
            <p>Cấp độ: {lesson.level}</p>

            <AppCard>
              <h3>Nội dung</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{lesson.contentRichText || 'Bài học chưa có nội dung chi tiết.'}</p>
            </AppCard>

            {lesson.embeddedVideoUrl ? (
              <AppCard>
                <h3>Video tham khảo</h3>
                <a href={lesson.embeddedVideoUrl} target="_blank" rel="noreferrer">
                  Mở video
                </a>
              </AppCard>
            ) : null}
          </Reveal>
        )}
      </section>
    </main>
  );
}
