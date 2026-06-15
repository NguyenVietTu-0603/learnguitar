import { useEffect, useState } from 'react';
import quizChordService from '../features/quizchord/quizchord.service';
import chordService from '../features/chord/chord.service';
import ChordDiagram from '../components/chord/ChordDiagram';
import '../styles/quizchord.css'
import { resolveMediaUrl } from '../utils/resolveUrl';
import type {
  QuizChordQuestion,
  QuizChordAnswerResponse
} from '../features/quizchord/quizchord.types';
import type { Chord } from '../features/chord/chord.types';

export default function QuizChordPage() {
  const [questions, setQuestions] = useState<QuizChordQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<QuizChordAnswerResponse | null>(null);

  const [chordMap, setChordMap] = useState<Record<string, Chord>>({});

  // 👉 Load quiz + fetch chord data cho từng question
  useEffect(() => {
    let mounted = true;

    const loadQuiz = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await quizChordService.generateQuiz({
          category: 'major',
          difficulty: 'beginner'
        });

        if (!mounted) return;
        setQuestions(res.questions);

    const allChordsRes = await chordService.getChords({ limit: 200 });

    // Map id → slug
    const idToSlug: Record<string, string> = {};
    for (const chord of allChordsRes.chords) {
      idToSlug[chord.id] = chord.slug;
    }

    // Fetch đủ data qua slug
    const entries = await Promise.all(
      res.questions.map(async (q) => {
        const slug = idToSlug[q.questionId];
        if (!slug) return null;
        try {
          const chord = await chordService.getChordBySlug(slug);
          return [q.questionId, chord] as const;
        } catch {
          return null;
        }
      })
    );

    if (!mounted) return;

    const map: Record<string, Chord> = {};
    for (const entry of entries) {
      if (entry) map[entry[0]] = entry[1];
    }
    setChordMap(map);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không tải được quiz.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadQuiz();

    return () => {
      mounted = false;
    };
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentChord = currentQuestion ? chordMap[currentQuestion.questionId] : null;

  // 👉 Chọn đáp án
  const handleSelect = async (optionId: string) => {
    if (!currentQuestion || result) return;

    setSelectedId(optionId);

    try {
      const res = await quizChordService.checkAnswer({
        questionId: currentQuestion.questionId,
        selectedId: optionId
      });
      setResult(res);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Lỗi kiểm tra đáp án.');
    }
  };

  // 👉 Câu tiếp theo
  const handleNext = () => {
    setSelectedId(null);
    setResult(null);
    setCurrentIndex((prev) => prev + 1);
  };

  // ================= UI =================

  if (isLoading) {
    return (
      <main className="quiz-state">
        <div className="auth-loader" aria-hidden="true" />
        <p>Đang tải câu hỏi...</p>
      </main>
    );
  }

  if (errorMessage) {
    return <main className="quiz-state quiz-error">{errorMessage}</main>;
  }

  if (!currentQuestion) {
    return <main className="quiz-state">Bạn đã hoàn thành quiz 🎉</main>;
  }

  return (
    <main className="quiz-page">
      <section className="quiz-container">

        {/* Progress */}
        <p className="quiz-progress">
          Câu {currentIndex + 1} / {questions.length}
        </p>

        <p className="quiz-question">{currentQuestion.question}</p>

        {/* 👉 Chord Diagram — dùng data fetch từ chordService */}
        {currentChord ? (
          <ChordDiagram
            chordName={currentChord.displayName || currentChord.name}
            positions={currentChord.positions}
            fingers={currentChord.fingers}
            audioUrl={currentChord.audioUrl}
            size={320}
          />
        ) : currentQuestion.diagramSvg ? (
          // Fallback nếu chordService không có
          <div dangerouslySetInnerHTML={{ __html: currentQuestion.diagramSvg }} />
        ) : currentQuestion.audioUrl ? (
          // Fallback audio nếu không có diagram
          <audio controls src={resolveMediaUrl(currentQuestion.audioUrl) ?? undefined} className="quiz-audio" />
        ) : null}

        {/* 👉 Options */}
        <div className="quiz-options">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedId === opt.id;
            const isCorrect = result?.correctId === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={!!result}
                className={[
                  'quiz-option',
                  isSelected ? 'selected' : '',
                  result ? (isCorrect ? 'correct' : isSelected ? 'wrong' : '') : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* 👉 Result */}
        {result && (
          <div className="quiz-result">
            {result.isCorrect ? (
              <p className="correct">✅ Chính xác!</p>
            ) : (
              <p className="wrong">
                ❌ Sai. Đáp án đúng là: <strong>{result.correctLabel}</strong>
              </p>
            )}

            {result.explanation && (
              <p className="quiz-explanation">{result.explanation}</p>
            )}

            <button onClick={handleNext} className="app-btn app-btn-primary">
              {currentIndex + 1 < questions.length ? 'Câu tiếp theo' : 'Hoàn thành'}
            </button>
          </div>
        )}

      </section>
    </main>
  );
}