import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import ProgressRing from '../components/common/ProgressRing';
import Reveal from '../components/common/Reveal';
import InteractiveFretboard from '../components/chord/InteractiveFretboard';
import noteService from '../features/note/note.service';
import quizService from '../features/quiz/quiz.service';
import type { LeaderboardData, PracticeQuizPickerItem, QuizMode, QuizQuestion, QuizSubmitData } from '../features/quiz/quiz.types';
import progressService from '../features/progress/progress.service';
import { useAuth } from '../context/useAuth';

interface QuizAnswerForm {
  selectedOption?: string;
  stringNumber?: number;
  fret?: number;
}

interface PracticeRoomLocationState {
  prefillQuizId?: string | null;
  lessonId?: string;
  lessonSlug?: string;
  lessonDurationSec?: number;
  courseSlug?: string;
  courseTitle?: string;
  courseId?: string;
}

export default function PracticeRoomPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeState = (location.state as PracticeRoomLocationState | null) ?? null;

  const initialQuizId = (routeState?.prefillQuizId || searchParams.get('quizId') || '').trim();
  const [quizId, setQuizId] = useState(initialQuizId);
  const [availableQuizzes, setAvailableQuizzes] = useState<PracticeQuizPickerItem[]>([]);
  const [isQuizCatalogLoading, setIsQuizCatalogLoading] = useState(false);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerForm>>({});
  const [submitResult, setSubmitResult] = useState<QuizSubmitData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [highlightedNotes, setHighlightedNotes] = useState<string[]>(['C', 'E', 'G']);
  const [fretString, setFretString] = useState(1);
  const [fretNumber, setFretNumber] = useState(0);
  const [positionResult, setPositionResult] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    const nextQuizId = (routeState?.prefillQuizId || searchParams.get('quizId') || '').trim();
    if (nextQuizId) {
      setQuizId(nextQuizId);
    }
  }, [routeState?.prefillQuizId, searchParams]);

  useEffect(() => {
    let mounted = true;

    const loadQuizCatalog = async () => {
      setIsQuizCatalogLoading(true);

      try {
        const items = await quizService.getPracticeQuizzes({
          lessonId: routeState?.lessonId,
          courseId: routeState?.courseId,
          limit: 24,
        });
        if (!mounted) return;
        setAvailableQuizzes(items);
        if (!quizId && items.length > 0) {
          setQuizId(items[0].id);
        }
      } catch {
        if (!mounted) return;
        setAvailableQuizzes([]);
      } finally {
        if (mounted) {
          setIsQuizCatalogLoading(false);
        }
      }
    };

    loadQuizCatalog();

    return () => {
      mounted = false;
    };
  }, [quizId, routeState?.courseId, routeState?.lessonId]);

  const quizProgress = useMemo(() => {
    if (questions.length === 0) return 0;
    const answered = questions.filter((q) => {
      const answer = answers[q.questionId];
      if (!answer) return false;
      if (q.questionType === 'fret_select') {
        return Number.isFinite(answer.stringNumber) && Number.isFinite(answer.fret);
      }
      return Boolean(answer.selectedOption);
    }).length;
    return Math.round((answered / questions.length) * 100);
  }, [answers, questions]);

  const selectedQuiz = useMemo(
    () => availableQuizzes.find((item) => item.id === quizId) ?? null,
    [availableQuizzes, quizId]
  );

  const startQuiz = async () => {
    if (!quizId.trim()) {
      setQuizError('Vui lòng chọn một quiz để bắt đầu.');
      return;
    }

    setIsQuizLoading(true);
    setQuizError(null);
    setSubmitResult(null);

    try {
      const result = await quizService.startQuiz(quizId.trim(), { mode });
      setAttemptId(result.attemptId);
      setQuestions(result.questions);
      setAnswers({});

      const board = await quizService.getLeaderboard(quizId.trim(), 'weekly');
      setLeaderboard(board);
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : 'Không thể bắt đầu quiz.');
      setQuestions([]);
      setAttemptId(null);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!attemptId || questions.length === 0) {
      setQuizError('Chưa có lượt làm quiz để nộp.');
      return;
    }

    setIsQuizSubmitting(true);
    setQuizError(null);

    try {
      const payloadAnswers = questions.map((question) => {
        const answer = answers[question.questionId] || {};
        const selectedPosition =
          question.questionType === 'fret_select' && Number.isFinite(answer.stringNumber) && Number.isFinite(answer.fret)
            ? {
                stringNumber: Number(answer.stringNumber),
                fret: Number(answer.fret),
              }
            : undefined;

        return {
          questionId: question.questionId,
          questionToken: question.questionToken,
          selectedOption: answer.selectedOption,
          selectedPosition,
        };
      });

      const result = await quizService.submitQuiz(quizId.trim(), {
        attemptId,
        idempotencyKey: `${attemptId}-${Date.now()}`,
        answers: payloadAnswers,
      });
      setSubmitResult(result);

      if (isAuthenticated && routeState?.lessonId) {
        await progressService.updateLessonProgress(routeState.lessonId, {
          watchedSec: Number(routeState.lessonDurationSec || 0),
          accumulatedSec: Number(routeState.lessonDurationSec || 0),
          quizBestScore: result.score,
        });
      }

      const board = await quizService.getLeaderboard(quizId.trim(), 'weekly');
      setLeaderboard(board);
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : 'Không thể nộp bài quiz.');
    } finally {
      setIsQuizSubmitting(false);
    }
  };

  const loadRandomNotes = async () => {
    setNoteError(null);

    try {
      const notes = await noteService.getRandomNotes({ count: 5, level: 'beginner' });
      const normalized = notes.map((item) => item.canonicalName.replace('b', '#'));
      setHighlightedNotes(normalized.length > 0 ? normalized : ['C', 'E', 'G']);
    } catch (error) {
      setNoteError(error instanceof Error ? error.message : 'Không thể tải random note.');
    }
  };

  const lookupFretPosition = async () => {
    setNoteError(null);
    setPositionResult(null);

    try {
      const result = await noteService.getNoteByPosition(fretString, fretNumber);
      setPositionResult(`${result.note.canonicalName}${result.note.octave}`);
    } catch (error) {
      setNoteError(error instanceof Error ? error.message : 'Không thể tra nốt theo vị trí.');
    }
  };

  const updateChoice = (questionId: string, selectedOption: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOption,
      },
    }));
  };

  const updatePosition = (questionId: string, field: 'stringNumber' | 'fret', value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  return (
    <main className="app-page">
      <section className="site-container page-block practice-grid">
        <Reveal>
          <p className="section-kicker">Phòng thực hành</p>
          <h1>Quiz và luyện cảm âm theo dữ liệu thật</h1>
          <p>
            Chọn quiz từ danh sách gợi ý, nộp bài để nhận điểm và theo dõi bảng xếp hạng ngay tại đây.
          </p>
          {routeState?.lessonSlug ? (
            <p className="badge">
              Phiên này đang gắn với bài học: {routeState.lessonSlug}
              {routeState.courseTitle ? ` · ${routeState.courseTitle}` : ''}
            </p>
          ) : null}

          <AppCard className="metronome-card">
            <h3>Quiz</h3>
            <div className="metronome-display">{quizProgress}%</div>
            <div className="stack-actions practice-picker-stack">
              <select className="form-input" value={quizId} onChange={(event) => setQuizId(event.target.value)}>
                <option value="">Chọn quiz để bắt đầu</option>
                {availableQuizzes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · {item.level}
                  </option>
                ))}
              </select>
              <select
                className="form-input"
                value={mode}
                onChange={(event) => setMode(event.target.value as QuizMode)}
              >
                <option value="practice">Practice</option>
                <option value="exam">Exam</option>
              </select>
              <button type="button" className="app-btn app-btn-secondary" onClick={startQuiz} disabled={isQuizLoading || !quizId}>
                {isQuizLoading ? 'Đang bắt đầu...' : 'Bắt đầu quiz'}
              </button>
            </div>
            {isQuizCatalogLoading ? <p>Đang tải danh sách quiz...</p> : null}
            {selectedQuiz ? <p className="soft-badge">Đang chọn: {selectedQuiz.title}</p> : null}
            {quizError ? <p className="auth-error">{quizError}</p> : null}
          </AppCard>

          <AppCard>
            <h3>Câu hỏi</h3>
            <div className="exercise-list">
              {questions.length === 0 ? <p>Chưa có câu hỏi. Hãy chọn quiz từ danh sách và bắt đầu.</p> : null}
              {questions.map((question, index) => (
                <article key={question.questionId} className="exercise-item">
                  <div>
                    <strong>Câu {index + 1}: {question.prompt}</strong>
                    <p>Loại: {question.questionType}</p>

                    {question.questionType === 'fret_select' ? (
                      <div className="stack-actions">
                        <input
                          className="form-input"
                          type="number"
                          min={1}
                          max={6}
                          placeholder="Dây"
                          onChange={(event) => updatePosition(question.questionId, 'stringNumber', Number(event.target.value))}
                        />
                        <input
                          className="form-input"
                          type="number"
                          min={0}
                          max={22}
                          placeholder="Ngăn"
                          onChange={(event) => updatePosition(question.questionId, 'fret', Number(event.target.value))}
                        />
                      </div>
                    ) : (
                      <div className="stack-actions">
                        {(question.options || []).map((option) => (
                          <button
                            type="button"
                            key={`${question.questionId}-${option}`}
                            className="app-btn app-btn-ghost"
                            onClick={() => updateChoice(question.questionId, option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <AppButton onClick={submitQuiz} disabled={questions.length === 0 || isQuizSubmitting}>
              {isQuizSubmitting ? 'Đang nộp...' : 'Nộp bài quiz'}
            </AppButton>

            {submitResult ? (
              <p className="badge">
                Điểm: {submitResult.score} · Đúng: {submitResult.correctCount}/{submitResult.totalQuestions}
              </p>
            ) : null}
          </AppCard>
        </Reveal>

        <Reveal delay={120}>
          <AppCard className="practice-side-card">
            <ProgressRing value={quizProgress} label="Tiến độ quiz" />
            <p>Leaderboard tuần</p>
            {leaderboard?.items.slice(0, 5).map((item) => (
              <p key={`${item.user.id}-${item.rank}`}>
                #{item.rank} {item.user.name} · {item.bestScore}
              </p>
            ))}
            <div className="hero-actions">
              <AppButton to="/dashboard">Xem thành tích</AppButton>
              {routeState?.courseSlug ? (
                <Link to={`/khoa-hoc/${routeState.courseSlug}`} className="app-btn app-btn-ghost">
                  Quay lại bài học
                </Link>
              ) : null}
            </div>
          </AppCard>

          <AppCard>
            <h3>Note/Fretboard Practice</h3>
            <div className="stack-actions">
              <AppButton variant="ghost" onClick={loadRandomNotes}>Lấy 5 nốt ngẫu nhiên</AppButton>
              <input
                className="form-input"
                type="number"
                min={1}
                max={6}
                value={fretString}
                onChange={(event) => setFretString(Number(event.target.value))}
              />
              <input
                className="form-input"
                type="number"
                min={0}
                max={22}
                value={fretNumber}
                onChange={(event) => setFretNumber(Number(event.target.value))}
              />
              <AppButton variant="secondary" onClick={lookupFretPosition}>Tra nốt</AppButton>
            </div>

            {positionResult ? <p>Nốt tại vị trí đã chọn: <strong>{positionResult}</strong></p> : null}
            {noteError ? <p className="auth-error">{noteError}</p> : null}

            <InteractiveFretboard highlightedNotes={highlightedNotes} />
          </AppCard>
        </Reveal>
      </section>
    </main>
  );
}
