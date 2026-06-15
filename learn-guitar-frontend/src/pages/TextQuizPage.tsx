import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import textquizService from '../features/textquiz/textquiz.service';
import type { TextQuizItem, QuizLevel } from '../features/textquiz/textquiz.types';

const LEVEL_LABEL: Record<QuizLevel, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
};

const LEVEL_BADGE: Record<QuizLevel, string> = {
  beginner: '#6b8e5f',
  intermediate: '#c9a030',
  advanced: '#c0552a',
};

const QUIZ_ICONS = ['🎸', '🎵', '🎼', '🎹', '🎤', '🎧'];

export default function TextQuizPage() {
  const [quizzes, setQuizzes] = useState<TextQuizItem[]>([]);
  const [level, setLevel] = useState<QuizLevel | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await textquizService.getTextQuizzes({ level, limit: 24 });
        if (!mounted) return;
        setQuizzes(result.quizzes);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải quiz.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [level]);

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Kiểm tra kiến thức</p>
          <h1>Quiz Lý thuyết Guitar</h1>
          <p>Kiểm tra và củng cố kiến thức lý thuyết guitar qua các bài quiz văn bản ngắn gọn.</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="tab-toolbar" style={{ gridTemplateColumns: '1fr auto' }}>
            <select
              className="form-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as QuizLevel | '')}
            >
              <option value="">Tất cả cấp độ</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung bình</option>
              <option value="advanced">Nâng cao</option>
            </select>
            <button type="button" className="app-btn app-btn-ghost" onClick={() => setLevel('')}>Đặt lại</button>
          </div>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {isLoading ? (
          <div className="loading-wrap">
            <div className="auth-loader" aria-hidden="true" />
            <p>Đang tải danh sách quiz...</p>
          </div>
        ) : (
          <Reveal delay={120}>
            {quizzes.length === 0 ? (
              <AppCard>
                <p style={{ textAlign: 'center', color: '#6a6258' }}>Chưa có quiz nào. Hãy thêm dữ liệu mẫu trước!</p>
              </AppCard>
            ) : (
              <div className="list-grid">
                {quizzes.map((quiz, index) => (
                  <AppCard key={quiz.id} className="tq-card">
                    <div className="tq-icon">{QUIZ_ICONS[index % QUIZ_ICONS.length]}</div>
                    <span className="tq-level" style={{ color: LEVEL_BADGE[quiz.level] }}>
                      {LEVEL_LABEL[quiz.level]}
                    </span>
                    <h3 className="tq-title">{quiz.title}</h3>
                    {quiz.description ? <p className="tq-desc">{quiz.description}</p> : null}
                    <div className="tq-actions">
                      <Link to={`/text-quiz/${quiz.slug}`} className="app-btn app-btn-primary">
                        📋 Bắt đầu Quiz
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
