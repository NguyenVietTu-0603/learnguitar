import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import textquizService from '../features/textquiz/textquiz.service';
import type { TextQuizDetail, TextQuizQuestion } from '../features/textquiz/textquiz.types';

type AnswerState = 'idle' | 'correct' | 'wrong';

interface QuestionResult {
  selected: number;
  state: AnswerState;
}

export default function TextQuizDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quiz, setQuiz] = useState<TextQuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<number, QuestionResult>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await textquizService.getTextQuizBySlug(slug);
        if (!mounted) return;
        setQuiz(data);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải quiz.');
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
          <p>Đang tải quiz...</p>
        </section>
      </main>
    );
  }

  if (errorMessage || !quiz) {
    return (
      <main className="app-page">
        <section className="site-container page-block">
          <AppCard>
            <h3>Không tìm thấy quiz</h3>
            <p>{errorMessage || 'Quiz không tồn tại.'}</p>
            <Link to="/text-quiz" className="app-btn app-btn-ghost">← Quay lại</Link>
          </AppCard>
        </section>
      </main>
    );
  }

  const questions: TextQuizQuestion[] = quiz.questions || [];
  const currentQ = questions[currentIndex];
  const currentResult = results[currentIndex];
  const answered = currentResult !== undefined;

  const handleSelect = (optionIndex: number) => {
    if (answered) return;
    const isCorrect = optionIndex === currentQ.correctIndex;
    setResults((prev) => ({
      ...prev,
      [currentIndex]: { selected: optionIndex, state: isCorrect ? 'correct' : 'wrong' },
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setResults({});
    setShowExplanation(false);
    setFinished(false);
  };

  // Score screen
  if (finished) {
    const correctCount = Object.values(results).filter((r) => r.state === 'correct').length;
    const total = questions.length;
    const percent = Math.round((correctCount / total) * 100);
    const grade = percent >= 80 ? '🏆 Xuất sắc!' : percent >= 60 ? '👍 Khá tốt!' : '📚 Cần ôn thêm!';

    return (
      <main className="app-page">
        <section className="site-container page-block">
          <Reveal>
            <AppCard className="tq-result-card">
              <div className="tq-result-icon">🎸</div>
              <h2>{grade}</h2>
              <p className="tq-result-score">{correctCount} / {total} câu đúng</p>
              <div className="tq-result-bar">
                <div className="tq-result-fill" style={{ width: `${percent}%` }} />
              </div>
              <p style={{ color: '#6a6258', marginTop: 8 }}>{percent}% chính xác</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="app-btn app-btn-primary" onClick={handleRestart}>🔄 Làm lại</button>
                <Link to="/text-quiz" className="app-btn app-btn-ghost">← Quiz khác</Link>
                <Link to="/video-lessons" className="app-btn app-btn-ghost">🎥 Xem bài học video</Link>
              </div>

              {/* Review answers */}
              <div style={{ marginTop: 28, textAlign: 'left', width: '100%' }}>
                <h3 style={{ marginBottom: 12 }}>Xem lại đáp án</h3>
                {questions.map((q, i) => {
                  const r = results[i];
                  return (
                    <div key={i} className={`tq-review-item ${r?.state === 'correct' ? 'tq-review-correct' : 'tq-review-wrong'}`}>
                      <p><strong>Câu {i + 1}:</strong> {q.prompt}</p>
                      <p>Đáp án đúng: <strong>{q.options[q.correctIndex]}</strong></p>
                      {r && r.selected !== q.correctIndex ? (
                        <p style={{ color: '#a6432b' }}>Bạn chọn: {q.options[r.selected]}</p>
                      ) : null}
                      {q.explanation ? <p className="tq-explanation">{q.explanation}</p> : null}
                    </div>
                  );
                })}
              </div>
            </AppCard>
          </Reveal>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <Link to="/text-quiz" className="vld-back">← Danh sách quiz</Link>
          <p className="section-kicker">Quiz lý thuyết</p>
          <h1>{quiz.title}</h1>
          {quiz.description ? <p style={{ color: '#6a6258' }}>{quiz.description}</p> : null}

          <div className="tq-progress-bar">
            <div
              className="tq-progress-fill"
              style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            />
          </div>
          <p className="tq-progress-label">Câu {currentIndex + 1} / {questions.length}</p>

          <AppCard className="tq-question-card">
            <h2 className="tq-prompt">{currentQ.prompt}</h2>

            <div className="tq-options">
              {currentQ.options.map((opt, i) => {
                let cls = 'tq-option';
                if (answered) {
                  if (i === currentQ.correctIndex) cls += ' tq-option-correct';
                  else if (i === currentResult.selected && currentResult.state === 'wrong') cls += ' tq-option-wrong';
                  else cls += ' tq-option-dim';
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                  >
                    <span className="tq-opt-letter">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {showExplanation && currentQ.explanation ? (
              <div className={`tq-feedback ${currentResult.state === 'correct' ? 'tq-feedback-correct' : 'tq-feedback-wrong'}`}>
                {currentResult.state === 'correct' ? '✅ Chính xác! ' : '❌ Chưa đúng. '}
                {currentQ.explanation}
              </div>
            ) : null}

            {answered ? (
              <button type="button" className="app-btn app-btn-primary tq-next-btn" onClick={handleNext}>
                {currentIndex + 1 < questions.length ? 'Câu tiếp →' : '🏁 Xem kết quả'}
              </button>
            ) : null}
          </AppCard>
        </Reveal>
      </section>
    </main>
  );
}
