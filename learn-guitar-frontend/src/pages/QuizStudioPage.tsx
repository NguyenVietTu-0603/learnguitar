import { useEffect, useState } from 'react';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import Reveal from '../components/common/Reveal';
import { useAuth } from '../context/useAuth';
import quizService from '../features/quiz/quiz.service';
import chordService from '../features/chord/chord.service';
import type { Chord } from '../features/chord/chord.types';
import type { ChordGuessQuizInput, QuizLessonTemplateItem } from '../features/quiz/quiz.types';

interface QuizLessonFormState {
  slug: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  isPublished: boolean;
}

interface QuizUnitFormState {
  prompt: string;
  audioUrl: string;
  chordSlug: string;
  wrongChordA: string;
  wrongChordB: string;
  wrongChordC: string;
  difficultyWeight: number;
}

const defaultLessonForm: QuizLessonFormState = {
  slug: '',
  title: '',
  level: 'beginner',
  summary: '',
  isPublished: true,
};

const createDefaultQuizUnit = (): QuizUnitFormState => ({
  prompt: 'Nhìn sơ đồ bấm và chọn tên hợp âm đúng',
  audioUrl: '',
  chordSlug: '',
  wrongChordA: '',
  wrongChordB: '',
  wrongChordC: '',
  difficultyWeight: 1,
});

export default function QuizStudioPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const [lessonForm, setLessonForm] = useState<QuizLessonFormState>(defaultLessonForm);
  const [createdTemplate, setCreatedTemplate] = useState<QuizLessonTemplateItem | null>(null);
  const [quizCount, setQuizCount] = useState(1);
  const [quizForms, setQuizForms] = useState<QuizUnitFormState[]>([createDefaultQuizUnit()]);
  const [chords, setChords] = useState<Chord[]>([]);
  const [isChordsLoading, setIsChordsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadChords = async () => {
      setIsChordsLoading(true);
      try {
        const result = await chordService.getChords({ page: 1, limit: 50 });
        if (!mounted) return;
        setChords(result.chords);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách hợp âm.');
      } finally {
        if (mounted) setIsChordsLoading(false);
      }
    };

    loadChords();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setQuizForms((prev) => {
      if (prev.length === quizCount) return prev;
      if (prev.length > quizCount) return prev.slice(0, quizCount);
      const extra = Array.from({ length: quizCount - prev.length }, () => createDefaultQuizUnit());
      return [...prev, ...extra];
    });
  }, [quizCount]);

  const wrapSubmit = async (callback: () => Promise<void>) => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await callback();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể thực hiện thao tác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuizLessonTemplate = async () => {
    await wrapSubmit(async () => {
      const created = await quizService.createQuizLessonTemplate({
        slug: lessonForm.slug,
        title: lessonForm.title,
        summary: lessonForm.summary,
        level: lessonForm.level,
        isPublished: lessonForm.isPublished,
      });
      setCreatedTemplate(created);
      setMessage(`Đã tạo bài học quiz mẫu: ${created.title}. Tiếp theo tạo các quiz con bên dưới.`);
    });
  };

  const updateQuizFormField = (index: number, field: keyof QuizUnitFormState, value: string | number) => {
    setQuizForms((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleCreateQuizBatch = async () => {
    if (!createdTemplate?.id) {
      setErrorMessage('Bạn cần tạo bài học quiz mẫu trước.');
      return;
    }

    for (let index = 0; index < quizForms.length; index += 1) {
      const item = quizForms[index];
      const row = index + 1;

      if (!item.prompt.trim()) {
        setErrorMessage(`Quiz con #${row} đang thiếu câu hỏi.`);
        return;
      }

      if (!item.chordSlug || !item.wrongChordA || !item.wrongChordB || !item.wrongChordC) {
        setErrorMessage(`Quiz con #${row} cần chọn đủ 1 hợp âm đúng và 3 hợp âm sai.`);
        return;
      }

      const unique = new Set([item.chordSlug, item.wrongChordA, item.wrongChordB, item.wrongChordC]);
      if (unique.size !== 4) {
        setErrorMessage(`Quiz con #${row} đang có hợp âm bị trùng. Vui lòng chọn 4 hợp âm khác nhau.`);
        return;
      }
    }

    await wrapSubmit(async () => {
      const payload: { quizzes: ChordGuessQuizInput[] } = {
        quizzes: quizForms.map((item, index) => ({
          title: `Quiz ${index + 1}`,
          prompt: item.prompt.trim(),
          audioUrl: item.audioUrl.trim() || undefined,
          correctChordSlug: item.chordSlug,
          wrongChordSlugs: [item.wrongChordA, item.wrongChordB, item.wrongChordC],
          difficultyWeight: Number(item.difficultyWeight || 1),
        })),
      };

      const created = await quizService.createChordGuessBatch(createdTemplate.id, payload);
      setCreatedTemplate((prev) =>
        prev
          ? {
              ...prev,
              quizCount: prev.quizCount + created.createdCount,
            }
          : prev
      );
      setQuizForms(Array.from({ length: quizCount }, () => createDefaultQuizUnit()));
      setMessage(`Đã tạo ${created.createdCount} quiz cho bài học mẫu ${createdTemplate.title}.`);
    });
  };

  const chordOptions = chords.map((item) => ({
    value: item.slug,
    label: `${item.displayName} (${item.slug})`,
  }));

  if (!canManage) {
    return (
      <main className="app-page">
        <section className="site-container page-block">
          <AppCard>
            <h3>Bạn chưa có quyền truy cập</h3>
            <p>Trang này dành cho vai trò teacher hoặc admin.</p>
          </AppCard>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Quiz Lesson Studio</p>
          <h1>Tạo bài học đoán hợp âm theo flow mới</h1>
          <p>
            Bước 1: tạo bài học quiz mẫu độc lập. Bước 2: chọn số quiz con và điền từng quiz với 1 hợp âm đúng + 3 hợp âm sai.
            Các hợp âm được chọn trực tiếp từ dữ liệu có sẵn trong database.
          </p>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        {message ? <p className="badge">{message}</p> : null}

        <div className="dashboard-grid">
          <AppCard>
            <h3>1) Tạo bài học đoán hợp âm</h3>
            <div className="stack-actions">
              <input
                className="form-input"
                placeholder="Tên bài học (slug)"
                value={lessonForm.slug}
                onChange={(e) => setLessonForm((p) => ({ ...p, slug: e.target.value }))}
              />
              <input
                className="form-input"
                placeholder="Tên hiển thị bài học"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="form-input"
                placeholder="Mô tả ngắn (optional)"
                value={lessonForm.summary}
                onChange={(e) => setLessonForm((p) => ({ ...p, summary: e.target.value }))}
              />
              <select
                className="form-input"
                value={lessonForm.level}
                onChange={(e) => setLessonForm((p) => ({ ...p, level: e.target.value as QuizLessonFormState['level'] }))}
              >
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={lessonForm.isPublished}
                  onChange={(e) => setLessonForm((p) => ({ ...p, isPublished: e.target.checked }))}
                />
                Public ngay sau khi tạo
              </label>
              <AppButton disabled={isSubmitting} onClick={handleCreateQuizLessonTemplate}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo bài học quiz mẫu'}
              </AppButton>
            </div>
            {createdTemplate ? <p className="badge">Template hiện tại: {createdTemplate.title} - ID: {createdTemplate.id}</p> : null}
          </AppCard>

          <AppCard>
            <h3>2) Chọn số lượng quiz con</h3>
            <div className="stack-actions">
              <input
                className="form-input"
                type="number"
                min={1}
                max={30}
                value={quizCount}
                onChange={(e) => setQuizCount(Math.max(1, Math.min(30, Number(e.target.value || 1))))}
              />
              <p>{isChordsLoading ? 'Đang tải danh sách hợp âm...' : `Có ${chords.length} hợp âm để chọn.`}</p>
            </div>
          </AppCard>
        </div>

        <section className="page-block">
          <Reveal>
            <h2>3) Tạo {quizCount} quiz con</h2>
          </Reveal>
          <div className="course-catalog-grid">
            {quizForms.map((item, index) => (
              <AppCard key={`quiz-form-${index}`} className="course-catalog-card">
                <h3>Quiz con #{index + 1}</h3>
                <p className="section-kicker">Tên sẽ tự tạo: Quiz {index + 1}</p>
                <input
                  className="form-input"
                  placeholder="Câu hỏi"
                  value={item.prompt}
                  onChange={(e) => updateQuizFormField(index, 'prompt', e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="Audio URL (optional)"
                  value={item.audioUrl}
                  onChange={(e) => updateQuizFormField(index, 'audioUrl', e.target.value)}
                />

                <select
                  className="form-input"
                  value={item.chordSlug}
                  onChange={(e) => updateQuizFormField(index, 'chordSlug', e.target.value)}
                >
                  <option value="">Chọn hợp âm đúng</option>
                  {chordOptions.map((option) => (
                    <option key={`correct-${index}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="form-input"
                  value={item.wrongChordA}
                  onChange={(e) => updateQuizFormField(index, 'wrongChordA', e.target.value)}
                >
                  <option value="">Chọn hợp âm sai 1</option>
                  {chordOptions.map((option) => (
                    <option key={`wrongA-${index}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="form-input"
                  value={item.wrongChordB}
                  onChange={(e) => updateQuizFormField(index, 'wrongChordB', e.target.value)}
                >
                  <option value="">Chọn hợp âm sai 2</option>
                  {chordOptions.map((option) => (
                    <option key={`wrongB-${index}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="form-input"
                  value={item.wrongChordC}
                  onChange={(e) => updateQuizFormField(index, 'wrongChordC', e.target.value)}
                >
                  <option value="">Chọn hợp âm sai 3</option>
                  {chordOptions.map((option) => (
                    <option key={`wrongC-${index}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  className="form-input"
                  type="number"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={item.difficultyWeight}
                  onChange={(e) => updateQuizFormField(index, 'difficultyWeight', Number(e.target.value || 1))}
                />
              </AppCard>
            ))}
          </div>

          <div className="stack-actions" style={{ marginTop: 12 }}>
            <AppButton disabled={isSubmitting || !createdTemplate} onClick={handleCreateQuizBatch}>
              {isSubmitting ? 'Đang tạo quiz...' : 'Submit tạo toàn bộ quiz con'}
            </AppButton>
          </div>
        </section>
      </section>
    </main>
  );
}
