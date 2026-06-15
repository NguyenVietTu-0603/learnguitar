import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import ChordDiagram from '../components/chord/ChordDiagram';
import textquizService from '../features/textquiz/textquiz.service';
import quizChordService from '../features/quizchord/quizchord.service';
import chordService from '../features/chord/chord.service';
import type { TextQuizItem, QuizLevel } from '../features/textquiz/textquiz.types';
import type { QuizChordQuestion, QuizChordAnswerResponse } from '../features/quizchord/quizchord.types';
import type { Chord } from '../features/chord/chord.types';
import { resolveMediaUrl } from '../utils/resolveUrl';
import '../styles/quizchord.css';

type ActiveTab = 'theory' | 'chord';

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Text Quiz Section ─────────────────────────────────────────────────────────
function TheorySection() {
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
    <div className="quiz-tab-content">
      <div className="quiz-section-header">
        <div>
          <h2>📋 Quiz Lý thuyết Guitar</h2>
          <p>Kiểm tra và củng cố kiến thức lý thuyết qua các bài quiz văn bản.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-input"
            value={level}
            onChange={(e) => setLevel(e.target.value as QuizLevel | '')}
            style={{ minWidth: 140 }}
          >
            <option value="">Tất cả cấp độ</option>
            <option value="beginner">Cơ bản</option>
            <option value="intermediate">Trung bình</option>
            <option value="advanced">Nâng cao</option>
          </select>
          {level ? (
            <button type="button" className="app-btn app-btn-ghost" onClick={() => setLevel('')}>
              Đặt lại
            </button>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

      {isLoading ? (
        <div className="loading-wrap">
          <div className="auth-loader" aria-hidden="true" />
          <p>Đang tải quiz lý thuyết...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <AppCard>
          <p style={{ textAlign: 'center', color: '#6a6258' }}>
            Chưa có quiz lý thuyết nào. Hãy chạy seed script để thêm dữ liệu mẫu!
          </p>
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
    </div>
  );
}

// ── Chord Quiz Section ────────────────────────────────────────────────────────
function ChordSection() {
  const [questions, setQuestions] = useState<QuizChordQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<QuizChordAnswerResponse | null>(null);
  const [chordMap, setChordMap] = useState<Record<string, Chord>>({});
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  const loadQuiz = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentIndex(0);
    setSelectedId(null);
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setFinished(false);

    try {
      const res = await quizChordService.generateQuiz({ category: 'major', difficulty: 'beginner' });
      setQuestions(res.questions);

      const allChordsRes = await chordService.getChords({ limit: 200 });
      const idToSlug: Record<string, string> = {};
      for (const chord of allChordsRes.chords) idToSlug[chord.id] = chord.slug;

      const entries = await Promise.all(
        res.questions.map(async (q) => {
          const slug = idToSlug[q.questionId];
          if (!slug) return null;
          try {
            const chord = await chordService.getChordBySlug(slug);
            return [q.questionId, chord] as const;
          } catch { return null; }
        })
      );
      const map: Record<string, Chord> = {};
      for (const entry of entries) { if (entry) map[entry[0]] = entry[1]; }
      setChordMap(map);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không tải được quiz hợp âm.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadQuiz(); }, []);

  const currentQuestion = questions[currentIndex];
  const currentChord = currentQuestion ? chordMap[currentQuestion.questionId] : null;

  const handleSelect = async (optionId: string) => {
    if (!currentQuestion || result) return;
    setSelectedId(optionId);
    try {
      const res = await quizChordService.checkAnswer({
        questionId: currentQuestion.questionId,
        selectedId: optionId,
      });
      setResult(res);
      setScore((prev) => ({
        correct: prev.correct + (res.isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Lỗi kiểm tra đáp án.');
    }
  };

  const handleNext = () => {
    setSelectedId(null);
    setResult(null);
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-wrap">
        <div className="auth-loader" aria-hidden="true" />
        <p>Đang tải quiz hợp âm...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="quiz-tab-content">
        <p className="auth-error">{errorMessage}</p>
        <button type="button" className="app-btn app-btn-primary" onClick={loadQuiz}>Thử lại</button>
      </div>
    );
  }

  if (finished) {
    const percent = Math.round((score.correct / score.total) * 100);
    const grade = percent >= 80 ? '🏆 Xuất sắc!' : percent >= 60 ? '👍 Khá tốt!' : '📚 Cần ôn thêm!';
    return (
      <div className="quiz-tab-content">
        <div className="tq-result-card" style={{ margin: '0 auto' }}>
          <div className="tq-result-icon">🎸</div>
          <h2>{grade}</h2>
          <p className="tq-result-score">{score.correct} / {score.total} hợp âm đúng</p>
          <div className="tq-result-bar">
            <div className="tq-result-fill" style={{ width: `${percent}%` }} />
          </div>
          <p style={{ color: '#6a6258', marginTop: 8 }}>{percent}% chính xác</p>
          <button type="button" className="app-btn app-btn-primary" onClick={loadQuiz} style={{ marginTop: 20 }}>
            🔄 Chơi lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="quiz-tab-content">
      <div className="quiz-section-header">
        <div>
          <h2>🎸 Quiz Nhận biết Hợp âm</h2>
          <p>Nhìn sơ đồ hợp âm và chọn tên đúng — luyện tai và mắt cùng lúc.</p>
        </div>
        <div className="quiz-chord-score">
          <span>✅ {score.correct}</span>
          <span style={{ color: '#b0a090' }}>Câu {currentIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="tq-progress-bar">
        <div className="tq-progress-fill" style={{ width: `${((currentIndex) / questions.length) * 100}%` }} />
      </div>

      <div className="quiz-chord-layout">
        {/* Chord Diagram */}
        <div className="quiz-chord-diagram-col">
          <AppCard>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#7a7268', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Hợp âm này là gì?
            </p>
            {currentChord ? (
              <ChordDiagram
                chordName="?"
                positions={currentChord.positions}
                fingers={currentChord.fingers}
                audioUrl={currentChord.audioUrl}
                size={280}
              />
            ) : currentQuestion.diagramSvg ? (
              <div dangerouslySetInnerHTML={{ __html: currentQuestion.diagramSvg }} />
            ) : currentQuestion.audioUrl ? (
              <audio controls src={resolveMediaUrl(currentQuestion.audioUrl) ?? undefined} className="quiz-audio" />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#a09080' }}>Không có sơ đồ</div>
            )}
          </AppCard>
        </div>

        {/* Options */}
        <div className="quiz-chord-options-col">
          <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#2f2a22' }}>{currentQuestion.question}</p>
          <div className="tq-options">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedId === opt.id;
              const isCorrect = result?.correctId === opt.id;
              let cls = 'tq-option';
              if (result) {
                if (isCorrect) cls += ' tq-option-correct';
                else if (isSelected) cls += ' tq-option-wrong';
                else cls += ' tq-option-dim';
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cls}
                  onClick={() => handleSelect(opt.id)}
                  disabled={!!result}
                >
                  <span className="tq-opt-letter">{opt.label[0]}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>

          {result ? (
            <>
              <div className={`tq-feedback ${result.isCorrect ? 'tq-feedback-correct' : 'tq-feedback-wrong'}`}>
                {result.isCorrect ? '✅ Chính xác!' : `❌ Sai. Đáp án đúng: ${result.correctLabel}`}
                {result.explanation ? ` — ${result.explanation}` : ''}
              </div>
              <button type="button" className="app-btn app-btn-primary tq-next-btn" onClick={handleNext}>
                {currentIndex + 1 < questions.length ? 'Câu tiếp →' : '🏁 Xem kết quả'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main Hub Page ─────────────────────────────────────────────────────────────
export default function QuizPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Luyện tập & kiểm tra</p>
          <h1>Trung tâm Quiz</h1>
          <p>Kiểm tra kiến thức lý thuyết và khả năng nhận biết hợp âm guitar.</p>
        </Reveal>

        {/* Tab bar */}
        <Reveal delay={60}>
          <div className="quiz-hub-tabs">
            <button
              type="button"
              className={`quiz-hub-tab ${activeTab === 'theory' ? 'quiz-hub-tab-active' : ''}`}
              onClick={() => setActiveTab('theory')}
            >
              📋 Quiz Lý thuyết
            </button>
            <button
              type="button"
              className={`quiz-hub-tab ${activeTab === 'chord' ? 'quiz-hub-tab-active' : ''}`}
              onClick={() => setActiveTab('chord')}
            >
              🎸 Quiz Hợp âm
            </button>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {activeTab === 'theory' ? <TheorySection /> : <ChordSection />}
        </Reveal>
      </section>
    </main>
  );
}
