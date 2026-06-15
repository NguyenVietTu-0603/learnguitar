import { useEffect, useMemo, useState } from 'react';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import Reveal from '../components/common/Reveal';
import ChordDiagram from '../components/chord/ChordDiagram';
import quizService from '../features/quiz/quiz.service';
import type {
  QuizLessonTemplateDetail,
  QuizLessonTemplateItem,
  QuizQuestion,
  QuizSubmitData,
} from '../features/quiz/quiz.types';

export default function QuizLessonPracticePage() {
  const [templates, setTemplates] = useState<QuizLessonTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<QuizLessonTemplateDetail | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [instantFeedback, setInstantFeedback] = useState<Record<string, { isCorrect: boolean; correctOption: string }>>({});
  const [submitResult, setSubmitResult] = useState<QuizSubmitData | null>(null);

  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingTemplateDetail, setIsLoadingTemplateDetail] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      setErrorMessage(null);

      try {
        const result = await quizService.getQuizLessonTemplates({ page: 1, limit: 50 });
        if (!mounted) return;
        setTemplates(result.items);
        if (result.items.length > 0) {
          setSelectedTemplateId(result.items[0].id);
        }
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách bài học quiz.');
      } finally {
        if (mounted) setIsLoadingTemplates(false);
      }
    };

    loadTemplates();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null);
      return;
    }

    let mounted = true;

    const loadTemplateDetail = async () => {
      setIsLoadingTemplateDetail(true);
      setErrorMessage(null);

      try {
        const detail = await quizService.getQuizLessonTemplateDetail(selectedTemplateId);
        if (!mounted) return;
        setSelectedTemplate(detail);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải chi tiết bài học quiz.');
        setSelectedTemplate(null);
      } finally {
        if (mounted) setIsLoadingTemplateDetail(false);
      }
    };

    loadTemplateDetail();

    return () => {
      mounted = false;
    };
  }, [selectedTemplateId]);

  const answeredCount = useMemo(() => {
    return questions.filter((item) => Boolean(answers[item.questionId])).length;
  }, [answers, questions]);

  const handleStartQuiz = async (quizId: string) => {
    setIsStarting(true);
    setErrorMessage(null);
    setSubmitResult(null);

    try {
      const result = await quizService.startQuiz(quizId, { mode: 'practice' });
      setActiveQuizId(quizId);
      setAttemptId(result.attemptId);
      setQuestions(result.questions);
      setAnswers({});
      setInstantFeedback({});
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể bắt đầu quiz.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectOption = (questionId: string, selectedOption: string) => {
    const question = questions.find((item) => item.questionId === questionId);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));

    if (question?.answerKey?.correctOption) {
      const normalize = (value: string) => value.trim().toUpperCase();
      const accepted = [question.answerKey.correctOption, ...(question.answerKey.aliases || [])].map(normalize);
      const isCorrect = accepted.includes(normalize(selectedOption));

      setInstantFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect,
          correctOption: question.answerKey?.correctOption || '',
        },
      }));
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizId || !attemptId || questions.length === 0) {
      setErrorMessage('Chưa có lượt quiz hợp lệ để nộp.');
      return;
    }

    const missed = questions.filter((item) => !answers[item.questionId]);
    if (missed.length > 0) {
      setErrorMessage('Bạn cần chọn đáp án cho tất cả câu hỏi trước khi nộp.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payloadAnswers = questions.map((item) => ({
        questionId: item.questionId,
        questionToken: item.questionToken,
        selectedOption: answers[item.questionId],
      }));

      const result = await quizService.submitQuiz(activeQuizId, {
        attemptId,
        idempotencyKey: `${attemptId}-${Date.now()}`,
        answers: payloadAnswers,
      });

      setSubmitResult(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể nộp bài quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-page">
      <section className="site-container page-block dashboard-grid">
        <Reveal>
          <p className="section-kicker">Quiz Lessons</p>
          <h1>Chọn bài học quiz và bắt đầu làm bài</h1>
          <p>
            Chọn một bài học quiz đã tạo, sau đó nhấn vào từng quiz con để bắt đầu. Bạn cần trả lời hết câu hỏi trước khi nộp.
          </p>
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <AppCard>
            <h3>Danh sách bài học quiz</h3>
            {isLoadingTemplates ? <p>Đang tải danh sách bài học...</p> : null}
            {!isLoadingTemplates && templates.length === 0 ? <p>Chưa có bài học quiz nào đã publish.</p> : null}
            {!isLoadingTemplates ? (
              <select
                className="form-input"
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.quizCount} quiz)
                  </option>
                ))}
              </select>
            ) : null}
          </AppCard>

          <AppCard>
            <h3>Quiz con trong bài học</h3>
            {isLoadingTemplateDetail ? <p>Đang tải quiz...</p> : null}
            {!isLoadingTemplateDetail && selectedTemplate ? (
              <div className="exercise-list">
                {selectedTemplate.quizzes.length === 0 ? <p>Bài học này chưa có quiz con.</p> : null}
                {selectedTemplate.quizzes.map((quiz, index) => (
                  <article key={quiz.id} className="exercise-item">
                    <div>
                      <strong>
                        Quiz {index + 1}: {quiz.title}
                      </strong>
                      <p>{quiz.questions[0]?.prompt || 'Chưa có câu hỏi'}</p>
                    </div>
                    <button
                      type="button"
                      className="app-btn app-btn-secondary"
                      onClick={() => handleStartQuiz(quiz.id)}
                      disabled={isStarting}
                    >
                      {isStarting && activeQuizId === quiz.id ? 'Đang bắt đầu...' : 'Làm quiz'}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </AppCard>
        </Reveal>

        <Reveal delay={120}>
          <AppCard>
            <h3>Làm quiz</h3>
            {!activeQuizId ? <p>Hãy chọn một quiz con từ danh sách bên trái.</p> : null}
            {activeQuizId && questions.length === 0 ? <p>Quiz đang tải câu hỏi...</p> : null}
            {questions.length > 0 ? (
              <>
                <p>
                  Tiến độ: {answeredCount}/{questions.length} câu đã chọn đáp án.
                </p>
                <div className="exercise-list">
                  {questions.map((question, index) => (
                    <article key={question.questionId} className="exercise-item">
                      <div>
                        <strong>
                          Câu {index + 1}: {question.prompt}
                        </strong>
                        {question.chordSnapshot ? (
                          <div style={{ marginTop: 10, marginBottom: 10 }}>
                            <ChordDiagram
                              chordName={question.chordSnapshot.displayName}
                              positions={question.chordSnapshot.positions}
                              fingers={question.chordSnapshot.fingers || []}
                              audioUrl={question.chordSnapshot.audioUrl || question.audioUrl || null}
                              size={180}
                            />
                          </div>
                        ) : null}
                        <div className="stack-actions" style={{ marginTop: 8 }}>
                          {(question.options || []).map((option) => (
                            <button
                              key={`${question.questionId}-${option}`}
                              type="button"
                              className={`app-btn ${answers[question.questionId] === option ? 'app-btn-primary' : 'app-btn-ghost'}`}
                              onClick={() => handleSelectOption(question.questionId, option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {instantFeedback[question.questionId] ? (
                          <p className={instantFeedback[question.questionId].isCorrect ? 'quiz-answer-correct' : 'quiz-answer-wrong'}>
                            {instantFeedback[question.questionId].isCorrect
                              ? 'Chính xác!'
                              : `Chưa đúng. Đáp án đúng: ${instantFeedback[question.questionId].correctOption}`}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
                <AppButton onClick={handleSubmitQuiz} disabled={isSubmitting}>
                  {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài quiz'}
                </AppButton>
              </>
            ) : null}

            {submitResult ? (
              <p className="badge">
                Điểm: {submitResult.score} - Đúng: {submitResult.correctCount}/{submitResult.totalQuestions}
              </p>
            ) : null}
          </AppCard>
        </Reveal>
      </section>
    </main>
  );
}
