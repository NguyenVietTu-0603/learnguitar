import { useState } from 'react';
import { useEffect } from 'react';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import Reveal from '../components/common/Reveal';
import { useAuth } from '../context/useAuth';
import courseService from '../features/course/course.service';
import theoryService from '../features/theory/theory.service';
import noteService from '../features/note/note.service';
import quizService from '../features/quiz/quiz.service';
import type { CourseLevel, LessonType } from '../features/course/course.types';
import type { TheoryTopic } from '../features/theory/theory.types';
import type { QuizLessonTemplateItem } from '../features/quiz/quiz.types';

interface CourseForm {
  slug: string;
  title: string;
  level: CourseLevel;
  description: string;
}

interface ModuleForm {
  courseId: string;
  title: string;
  description: string;
}

interface LessonForm {
  courseId: string;
  moduleId: string;
  slug: string;
  title: string;
  lessonType: LessonType;
  level: CourseLevel;
  summary: string;
  quizLessonTemplateId: string;
}

interface TheoryForm {
  slug: string;
  title: string;
  topic: TheoryTopic;
  level: CourseLevel;
  contentRichText: string;
}

interface NoteForm {
  canonicalName: string;
  octave: number;
  frequencyHz: number;
  midiNumber: number;
}

const defaultCourse: CourseForm = {
  slug: '',
  title: '',
  level: 'beginner',
  description: '',
};

const defaultModule: ModuleForm = {
  courseId: '',
  title: '',
  description: '',
};

const defaultLesson: LessonForm = {
  courseId: '',
  moduleId: '',
  slug: '',
  title: '',
  lessonType: 'video',
  level: 'beginner',
  summary: '',
  quizLessonTemplateId: '',
};

const defaultTheory: TheoryForm = {
  slug: '',
  title: '',
  topic: 'scale',
  level: 'beginner',
  contentRichText: '',
};

const defaultNote: NoteForm = {
  canonicalName: 'C',
  octave: 4,
  frequencyHz: 261.63,
  midiNumber: 60,
};

export default function AdminStudioPage() {
  const { user } = useAuth();
  const [courseForm, setCourseForm] = useState<CourseForm>(defaultCourse);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(defaultModule);
  const [lessonForm, setLessonForm] = useState<LessonForm>(defaultLesson);
  const [theoryForm, setTheoryForm] = useState<TheoryForm>(defaultTheory);
  const [noteForm, setNoteForm] = useState<NoteForm>(defaultNote);
  const [quizLessonTemplates, setQuizLessonTemplates] = useState<QuizLessonTemplateItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      try {
        const result = await quizService.getQuizLessonTemplates({ page: 1, limit: 50 });
        if (!mounted) return;
        setQuizLessonTemplates(result.items);
      } catch {
        if (!mounted) return;
        setQuizLessonTemplates([]);
      }
    };

    loadTemplates();

    return () => {
      mounted = false;
    };
  }, []);

  const wrapSubmit = async (callback: () => Promise<void>) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      await callback();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <p className="section-kicker">Admin Studio</p>
          <h1>Tạo nội dung học tập</h1>
          <p>Tạo nhanh khóa học, module, lesson, theory lesson và note theo API backend mới.</p>
          <div className="stack-actions">
            <AppButton to="/quan-tri/quizzes" variant="secondary">Mở trang tạo quiz riêng</AppButton>
          </div>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        {message ? <p className="badge">{message}</p> : null}

        <div className="dashboard-grid">
          <AppCard>
            <h3>Tạo khóa học</h3>
            <div className="stack-actions">
              <input className="form-input" placeholder="Slug" value={courseForm.slug} onChange={(e) => setCourseForm((p) => ({ ...p, slug: e.target.value }))} />
              <input className="form-input" placeholder="Tiêu đề" value={courseForm.title} onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))} />
              <select className="form-input" value={courseForm.level} onChange={(e) => setCourseForm((p) => ({ ...p, level: e.target.value as CourseLevel }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <textarea className="form-input" placeholder="Mô tả" value={courseForm.description} onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))} />
              <AppButton disabled={isSubmitting} onClick={() => wrapSubmit(async () => {
                const created = await courseService.createCourse(courseForm);
                setMessage(`Đã tạo khóa học: ${created.title}`);
                setModuleForm((p) => ({ ...p, courseId: created.id }));
                setLessonForm((p) => ({ ...p, courseId: created.id }));
                setCourseForm(defaultCourse);
              })}>Tạo khóa học</AppButton>
            </div>
          </AppCard>

          <AppCard>
            <h3>Tạo module</h3>
            <div className="stack-actions">
              <input className="form-input" placeholder="Course ID" value={moduleForm.courseId} onChange={(e) => setModuleForm((p) => ({ ...p, courseId: e.target.value }))} />
              <input className="form-input" placeholder="Tiêu đề module" value={moduleForm.title} onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="form-input" placeholder="Mô tả" value={moduleForm.description} onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))} />
              <AppButton disabled={isSubmitting} onClick={() => wrapSubmit(async () => {
                const created = await courseService.createModule(moduleForm.courseId, {
                  title: moduleForm.title,
                  description: moduleForm.description,
                });
                setMessage(`Đã tạo module: ${created.title}`);
                setLessonForm((p) => ({ ...p, moduleId: created.id, courseId: moduleForm.courseId }));
                setModuleForm(defaultModule);
              })}>Tạo module</AppButton>
            </div>
          </AppCard>

          <AppCard>
            <h3>Tạo lesson</h3>
            <div className="stack-actions">
              <input className="form-input" placeholder="Course ID" value={lessonForm.courseId} onChange={(e) => setLessonForm((p) => ({ ...p, courseId: e.target.value }))} />
              <input className="form-input" placeholder="Module ID" value={lessonForm.moduleId} onChange={(e) => setLessonForm((p) => ({ ...p, moduleId: e.target.value }))} />
              <input className="form-input" placeholder="Lesson slug" value={lessonForm.slug} onChange={(e) => setLessonForm((p) => ({ ...p, slug: e.target.value }))} />
              <input className="form-input" placeholder="Tiêu đề lesson" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} />
              <select className="form-input" value={lessonForm.lessonType} onChange={(e) => setLessonForm((p) => ({ ...p, lessonType: e.target.value as LessonType }))}>
                <option value="video">Video</option>
                <option value="theory">Theory</option>
                <option value="quiz">Quiz</option>
              </select>
              <select className="form-input" value={lessonForm.level} onChange={(e) => setLessonForm((p) => ({ ...p, level: e.target.value as CourseLevel }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {lessonForm.lessonType === 'quiz' ? (
                <select
                  className="form-input"
                  value={lessonForm.quizLessonTemplateId}
                  onChange={(e) => setLessonForm((p) => ({ ...p, quizLessonTemplateId: e.target.value }))}
                >
                  <option value="">Chọn bài học quiz mẫu (optional)</option>
                  {quizLessonTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.quizCount} quiz)
                    </option>
                  ))}
                </select>
              ) : null}
              <textarea className="form-input" placeholder="Tóm tắt" value={lessonForm.summary} onChange={(e) => setLessonForm((p) => ({ ...p, summary: e.target.value }))} />
              <AppButton disabled={isSubmitting} onClick={() => wrapSubmit(async () => {
                const created = await courseService.createLesson(lessonForm.courseId, lessonForm.moduleId, {
                  slug: lessonForm.slug,
                  title: lessonForm.title,
                  lessonType: lessonForm.lessonType,
                  level: lessonForm.level,
                  summary: lessonForm.summary,
                  quizLessonTemplateId: lessonForm.quizLessonTemplateId || undefined,
                  isPublished: true,
                });
                setMessage(`Đã tạo lesson: ${created.title}`);
                setLessonForm(defaultLesson);
              })}>Tạo lesson</AppButton>
            </div>
          </AppCard>

          <AppCard>
            <h3>Tạo bài nhạc lý</h3>
            <div className="stack-actions">
              <input className="form-input" placeholder="Slug" value={theoryForm.slug} onChange={(e) => setTheoryForm((p) => ({ ...p, slug: e.target.value }))} />
              <input className="form-input" placeholder="Tiêu đề" value={theoryForm.title} onChange={(e) => setTheoryForm((p) => ({ ...p, title: e.target.value }))} />
              <select className="form-input" value={theoryForm.topic} onChange={(e) => setTheoryForm((p) => ({ ...p, topic: e.target.value as TheoryTopic }))}>
                <option value="scale">Scale</option>
                <option value="interval">Interval</option>
                <option value="rhythm">Rhythm</option>
                <option value="key">Key</option>
              </select>
              <select className="form-input" value={theoryForm.level} onChange={(e) => setTheoryForm((p) => ({ ...p, level: e.target.value as CourseLevel }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <textarea className="form-input" placeholder="Nội dung" value={theoryForm.contentRichText} onChange={(e) => setTheoryForm((p) => ({ ...p, contentRichText: e.target.value }))} />
              <AppButton disabled={isSubmitting} onClick={() => wrapSubmit(async () => {
                const created = await theoryService.createTheory({ ...theoryForm, isPublished: true });
                setMessage(`Đã tạo bài nhạc lý: ${created.title}`);
                setTheoryForm(defaultTheory);
              })}>Tạo bài nhạc lý</AppButton>
            </div>
          </AppCard>

          <AppCard>
            <h3>Tạo note</h3>
            <div className="stack-actions">
              <input className="form-input" placeholder="Canonical name" value={noteForm.canonicalName} onChange={(e) => setNoteForm((p) => ({ ...p, canonicalName: e.target.value }))} />
              <input className="form-input" type="number" placeholder="Octave" value={noteForm.octave} onChange={(e) => setNoteForm((p) => ({ ...p, octave: Number(e.target.value) }))} />
              <input className="form-input" type="number" step="0.01" placeholder="Frequency" value={noteForm.frequencyHz} onChange={(e) => setNoteForm((p) => ({ ...p, frequencyHz: Number(e.target.value) }))} />
              <input className="form-input" type="number" placeholder="Midi" value={noteForm.midiNumber} onChange={(e) => setNoteForm((p) => ({ ...p, midiNumber: Number(e.target.value) }))} />
              <AppButton disabled={isSubmitting} onClick={() => wrapSubmit(async () => {
                const created = await noteService.createNote({
                  canonicalName: noteForm.canonicalName,
                  octave: noteForm.octave,
                  frequencyHz: noteForm.frequencyHz,
                  midiNumber: noteForm.midiNumber,
                });
                setMessage(`Đã tạo note: ${created.note}`);
                setNoteForm(defaultNote);
              })}>Tạo note</AppButton>
            </div>
          </AppCard>
        </div>
      </section>
    </main>
  );
}
