import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import courseService from '../features/course/course.service';
import theoryService from '../features/theory/theory.service';
import noteService from '../features/note/note.service';
import quizService from '../features/quiz/quiz.service';
import type { CourseLevel, LessonType, CourseListItem, CourseModule } from '../features/course/course.types';
import type { TheoryTopic } from '../features/theory/theory.types';
import type { QuizLessonTemplateItem } from '../features/quiz/quiz.types';
import './AdminStudioPage.css';

type StudioSection = 'course' | 'theory' | 'notes' | 'links';
type CourseStep = 'select' | 'module' | 'lesson';

interface Toast {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export default function AdminStudioPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  // ── Section nav ──────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<StudioSection>('course');

  // ── Course builder state ──────────────────────────────────────────────────
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [courseStep, setCourseStep] = useState<CourseStep>('select');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  // Course form
  const [courseSlug, setCourseSlug] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseLevel, setCourseLevel] = useState<CourseLevel>('beginner');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePublished, setCoursePublished] = useState(false);

  // Module form
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  // Lesson form
  const [lessonSlug, setLessonSlug] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('video');
  const [lessonLevel, setLessonLevel] = useState<CourseLevel>('beginner');
  const [lessonSummary, setLessonSummary] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonQuizTemplateId, setLessonQuizTemplateId] = useState('');
  const [quizTemplates, setQuizTemplates] = useState<QuizLessonTemplateItem[]>([]);

  // Theory form
  const [theorySlug, setTheorySlug] = useState('');
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryTopic, setTheoryTopic] = useState<TheoryTopic>('scale');
  const [theoryLevel, setTheoryLevel] = useState<CourseLevel>('beginner');
  const [theoryContent, setTheoryContent] = useState('');
  const [theoryPublished, setTheoryPublished] = useState(true);

  // Note form
  const [noteName, setNoteName] = useState('C');
  const [noteOctave, setNoteOctave] = useState(4);
  const [noteFreq, setNoteFreq] = useState(261.63);
  const [noteMidi, setNoteMidi] = useState(60);

  // Global state
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = ++toastCounter.current;
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const wrapSubmit = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await fn();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadCourses = useCallback(async () => {
    setCourseLoading(true);
    try {
      const { courses: data } = await courseService.getCourses({ page: 1, limit: 100 });
      setCourses(data);
    } catch {
      showToast('error', 'Không thể tải danh sách khóa học.');
    } finally {
      setCourseLoading(false);
    }
  }, []);

  const loadModules = useCallback(async (courseId: string) => {
    if (!courseId) { setCourseModules([]); return; }
    try {
      const detail = await courseService.getCourseBySlug(
        courses.find((c) => c.id === courseId)?.slug ?? ''
      );
      setCourseModules(detail.modules);
    } catch {
      setCourseModules([]);
    }
  }, [courses]);

  const loadQuizTemplates = useCallback(async () => {
    try {
      const result = await quizService.getQuizLessonTemplates({ page: 1, limit: 50 });
      setQuizTemplates(result.items);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCourses(); loadQuizTemplates(); }, [loadCourses, loadQuizTemplates]);

  useEffect(() => {
    if (selectedCourseId) {
      loadModules(selectedCourseId);
      setSelectedModuleId('');
      setCourseStep('module');
    }
  }, [selectedCourseId, loadModules]);

  useEffect(() => {
    if (selectedModuleId) setCourseStep('lesson');
  }, [selectedModuleId]);

  // ── Slug auto-generate helpers ─────────────────────────────────────────────
  const toSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const autoSlug = (text: string) => setCourseSlug(toSlug(text));

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCreateCourse = async () => {
    if (!courseTitle.trim()) { showToast('error', 'Vui lòng nhập tiêu đề khóa học.'); return; }
    const slug = courseSlug.trim() || toSlug(courseTitle);
    await courseService.createCourse({ slug, title: courseTitle, level: courseLevel, description: courseDesc, isPublished: coursePublished });
    showToast('success', `Đã tạo khóa học "${courseTitle}"!`);
    setCourseTitle(''); setCourseSlug(''); setCourseDesc(''); setCourseLevel('beginner'); setCoursePublished(false);
    await loadCourses();
  };

  const handleCreateModule = async () => {
    if (!selectedCourseId) { showToast('error', 'Hãy chọn khóa học trước.'); return; }
    if (!moduleTitle.trim()) { showToast('error', 'Vui lòng nhập tiêu đề module.'); return; }
    const created = await courseService.createModule(selectedCourseId, { title: moduleTitle, description: moduleDesc });
    showToast('success', `Đã thêm module "${created.title}"!`);
    setModuleTitle(''); setModuleDesc('');
    await loadModules(selectedCourseId);
    setSelectedModuleId(created.id);
  };

  const handleCreateLesson = async () => {
    if (!selectedCourseId) { showToast('error', 'Hãy chọn khóa học.'); return; }
    if (!selectedModuleId) { showToast('error', 'Hãy chọn module.'); return; }
    if (!lessonTitle.trim()) { showToast('error', 'Vui lòng nhập tiêu đề bài học.'); return; }
    const slug = lessonSlug.trim() || toSlug(lessonTitle);
    await courseService.createLesson(selectedCourseId, selectedModuleId, {
      slug, title: lessonTitle, lessonType: lessonType, level: lessonLevel,
      summary: lessonSummary, videoUrlHls: lessonVideoUrl || undefined,
      quizLessonTemplateId: lessonQuizTemplateId || undefined, isPublished: true,
    });
    showToast('success', `Đã tạo bài học "${lessonTitle}"!`);
    setLessonTitle(''); setLessonSlug(''); setLessonSummary(''); setLessonVideoUrl(''); setLessonQuizTemplateId('');
  };

  const handleCreateTheory = async () => {
    if (!theoryTitle.trim()) { showToast('error', 'Vui lòng nhập tiêu đề bài nhạc lý.'); return; }
    const slug = theorySlug.trim() || toSlug(theoryTitle);
    await theoryService.createTheory({
      slug, title: theoryTitle, topic: theoryTopic, level: theoryLevel,
      contentRichText: theoryContent, isPublished: theoryPublished,
    });
    showToast('success', `Đã tạo bài nhạc lý "${theoryTitle}"!`);
    setTheoryTitle(''); setTheorySlug(''); setTheoryContent('');
  };

  const handleCreateNote = async () => {
    await noteService.createNote({ canonicalName: noteName, octave: noteOctave, frequencyHz: noteFreq, midiNumber: noteMidi });
    showToast('success', `Đã thêm note ${noteName}${noteOctave}!`);
  };

  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourseId(e.target.value);
    setSelectedModuleId('');
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  if (!canManage) {
    return (
      <main className="admin-main">
        <div className="admin-card studio-access-denied">
          <h2>Bạn chưa có quyền truy cập</h2>
          <p>Trang này dành cho vai trò teacher hoặc admin.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-main">
      {/* ── Toast notifications ── */}
      <div className="studio-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`studio-toast studio-toast-${t.type}`}>
            <span>{t.type === 'success' ? '✓' : '✕'}</span> {t.text}
          </div>
        ))}
      </div>

      {/* ── Page header ── */}
      <div className="studio-page-header">
        <div>
          <h1>Tạo nội dung</h1>
          <p>Xây dựng và quản lý khóa học, bài học, nhạc lý cho GuitarVN</p>
        </div>
      </div>

      <div className="studio-layout">
        {/* ── Left nav ── */}
        <nav className="studio-nav">
          {[
            { id: 'course' as StudioSection, icon: '📚', label: 'Khóa học', desc: 'Tạo course → module → lesson' },
            { id: 'theory' as StudioSection, icon: '📖', label: 'Nhạc lý', desc: 'Bài lý thuyết âm nhạc' },
            { id: 'notes' as StudioSection, icon: '🎵', label: 'Note', desc: 'Tạo nốt nhạc & cao độ' },
            { id: 'links' as StudioSection, icon: '🔗', label: 'Liên kết', desc: 'Công cụ bổ sung' },
          ].map((s) => (
            <button
              key={s.id}
              className={`studio-nav-item ${activeSection === s.id ? 'studio-nav-item-active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="studio-nav-icon">{s.icon}</span>
              <div>
                <strong>{s.label}</strong>
                <small>{s.desc}</small>
              </div>
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <div className="studio-content">

          {/* ═══════════════ COURSE BUILDER ═══════════════ */}
          {activeSection === 'course' && (
            <div className="studio-section">
              <div className="studio-section-head">
                <h2>📚 Trình tạo khóa học</h2>
                <p>Tạo khóa học, sau đó thêm module và bài học theo thứ tự.</p>
              </div>

              {/* Step breadcrumb */}
              <div className="studio-steps-bar">
                {[
                  { key: 'select', label: '1. Chọn khóa học' },
                  { key: 'module', label: '2. Thêm module' },
                  { key: 'lesson', label: '3. Thêm bài học' },
                ].map((s, i, arr) => {
                  const stepIdx = ['select', 'module', 'lesson'].indexOf(courseStep);
                  const thisIdx = arr.indexOf(s);
                  const done = thisIdx < stepIdx;
                  const active = thisIdx === stepIdx;
                  return (
                    <div key={s.key} className="studio-step-item">
                      <div className={`studio-step-dot ${done ? 'done' : active ? 'active' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={active ? 'active' : ''}>{s.label}</span>
                      {i < arr.length - 1 && <div className={`studio-step-line ${done ? 'done' : ''}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Course selector + new course card */}
              <div className="studio-two-col">
                {/* Existing course picker */}
                <div className="studio-card">
                  <div className="studio-card-header">
                    <h3>📂 Chọn khóa học hiện có</h3>
                  </div>
                  {courseLoading ? (
                    <div className="studio-loading">Đang tải...</div>
                  ) : (
                    <>
                      <select
                        className="form-input studio-select"
                        value={selectedCourseId}
                        onChange={handleCourseSelect}
                      >
                        <option value="">— Chọn một khóa học —</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            [{c.level}] {c.title}
                          </option>
                        ))}
                      </select>
                      {selectedCourse && (
                        <div className="studio-selected-info">
                          <div className="studio-info-row">
                            <span className="studio-info-label">Tiêu đề</span>
                            <strong>{selectedCourse.title}</strong>
                          </div>
                          <div className="studio-info-row">
                            <span className="studio-info-label">Cấp độ</span>
                            <span className="studio-badge">{selectedCourse.level}</span>
                          </div>
                          <div className="studio-info-row">
                            <span className="studio-info-label">Slug</span>
                            <code>{selectedCourse.slug}</code>
                          </div>
                          <div className="studio-info-row">
                            <span className="studio-info-label">Trạng thái</span>
                            <span className={`studio-badge ${selectedCourse.isPublished ? 'published' : 'draft'}`}>
                              {selectedCourse.isPublished ? 'Đã xuất bản' : 'Nháp'}
                            </span>
                          </div>
                          <div className="studio-info-row">
                            <span className="studio-info-label">Module</span>
                            <strong>{courseModules.length} module</strong>
                          </div>
                        </div>
                      )}
                      {selectedCourseId && (
                        <div className="studio-card-actions">
                          <button
                            className="studio-btn studio-btn-secondary"
                            onClick={() => { setSelectedCourseId(''); setSelectedModuleId(''); setCourseStep('select'); }}
                          >
                            ✕ Bỏ chọn
                          </button>
                          <button
                            className="studio-btn studio-btn-primary"
                            onClick={() => setCourseStep('module')}
                          >
                            Tiếp tục →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Create new course */}
                <div className="studio-card studio-card-create">
                  <div className="studio-card-header">
                    <h3>✨ Tạo khóa học mới</h3>
                  </div>
                  <div className="studio-form">
                    <div className="studio-form-field">
                      <label>Tiêu đề khóa học <span className="required">*</span></label>
                      <input
                        className="form-input"
                        placeholder="VD: Guitar cơ bản cho người mới"
                        value={courseTitle}
                        onChange={(e) => { setCourseTitle(e.target.value); autoSlug(e.target.value); }}
                      />
                    </div>
                    <div className="studio-form-field">
                      <label>Slug (URL thân thiện)</label>
                      <input
                        className="form-input"
                        placeholder="guitar-co-ban-cho-nguoi-moi"
                        value={courseSlug}
                        onChange={(e) => setCourseSlug(e.target.value)}
                      />
                      <small className="studio-form-hint">Để trống để tự động tạo từ tiêu đề</small>
                    </div>
                    <div className="studio-form-row">
                      <div className="studio-form-field">
                        <label>Cấp độ</label>
                        <select className="form-input" value={courseLevel} onChange={(e) => setCourseLevel(e.target.value as CourseLevel)}>
                          <option value="beginner">Sơ cấp</option>
                          <option value="intermediate">Trung cấp</option>
                          <option value="advanced">Nâng cao</option>
                        </select>
                      </div>
                      <div className="studio-form-field">
                        <label>Trạng thái</label>
                        <select className="form-input" value={String(coursePublished)} onChange={(e) => setCoursePublished(e.target.value === 'true')}>
                          <option value="false">Nháp (Ẩn)</option>
                          <option value="true">Xuất bản (Hiện)</option>
                        </select>
                      </div>
                    </div>
                    <div className="studio-form-field">
                      <label>Mô tả</label>
                      <textarea
                        className="form-input"
                        placeholder="Mô tả ngắn gọn về nội dung khóa học..."
                        value={courseDesc}
                        onChange={(e) => setCourseDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <button
                      className="studio-btn studio-btn-primary"
                      onClick={() => wrapSubmit(handleCreateCourse)}
                      disabled={submitting || !courseTitle.trim()}
                    >
                      {submitting ? 'Đang tạo...' : '💾 Tạo khóa học'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Module step */}
              {courseStep !== 'select' && selectedCourseId && (
                <div className="studio-card studio-step-card">
                  <div className="studio-card-header">
                    <h3>📁 Module: {selectedCourse?.title}</h3>
                    <span className="studio-badge">{courseModules.length} module</span>
                  </div>

                  <div className="studio-two-col">
                    {/* Module list */}
                    <div>
                      <label className="studio-form-label">Module hiện có</label>
                      <select
                        className="form-input studio-select"
                        value={selectedModuleId}
                        onChange={(e) => setSelectedModuleId(e.target.value)}
                      >
                        <option value="">— Chọn module —</option>
                        {courseModules.map((m) => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                      {courseModules.length > 0 ? (
                        <div className="studio-module-list">
                          {courseModules.map((m) => (
                            <div key={m.id} className="studio-module-item">
                              <span>📂 {m.title}</span>
                              <span className="studio-module-lessons">{m.lessons.length} bài</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="studio-empty-hint">Chưa có module nào. Tạo module đầu tiên bên cạnh!</p>
                      )}
                      {selectedModuleId && (
                        <div className="studio-card-actions">
                          <button className="studio-btn studio-btn-primary" onClick={() => setCourseStep('lesson')}>
                            Tiếp tục tạo bài học →
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add module */}
                    <div>
                      <label className="studio-form-label">Thêm module mới</label>
                      <div className="studio-form">
                        <div className="studio-form-field">
                          <label>Tên module <span className="required">*</span></label>
                          <input
                            className="form-input"
                            placeholder="VD: Bài 1 - Nhận biết dây đàn"
                            value={moduleTitle}
                            onChange={(e) => setModuleTitle(e.target.value)}
                          />
                        </div>
                        <div className="studio-form-field">
                          <label>Mô tả</label>
                          <textarea
                            className="form-input"
                            placeholder="Mô tả nội dung module..."
                            value={moduleDesc}
                            onChange={(e) => setModuleDesc(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <button
                          className="studio-btn studio-btn-secondary"
                          onClick={() => wrapSubmit(handleCreateModule)}
                          disabled={submitting || !moduleTitle.trim()}
                        >
                          {submitting ? 'Đang tạo...' : '+ Thêm module'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson step */}
              {courseStep === 'lesson' && selectedCourseId && selectedModuleId && (
                <div className="studio-card studio-step-card">
                  <div className="studio-card-header">
                    <h3>📝 Bài học</h3>
                    <div className="studio-breadcrumb">
                      {selectedCourse?.title} → {courseModules.find((m) => m.id === selectedModuleId)?.title}
                    </div>
                  </div>
                  <div className="studio-form">
                    <div className="studio-form-row">
                      <div className="studio-form-field">
                        <label>Tiêu đề bài học <span className="required">*</span></label>
                        <input
                          className="form-input"
                          placeholder="VD: Cách cầm đàn guitar đúng cách"
                          value={lessonTitle}
                          onChange={(e) => { setLessonTitle(e.target.value); setLessonSlug(toSlug(e.target.value)); }}
                        />
                      </div>
                      <div className="studio-form-field">
                        <label>Slug</label>
                        <input
                          className="form-input"
                          placeholder="cach-cam-dan-guitar-dung-cach"
                          value={lessonSlug}
                          onChange={(e) => setLessonSlug(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="studio-form-row">
                      <div className="studio-form-field">
                        <label>Loại bài học</label>
                        <select className="form-input" value={lessonType} onChange={(e) => setLessonType(e.target.value as LessonType)}>
                          <option value="video">🎬 Video</option>
                          <option value="theory">📖 Nhạc lý</option>
                          <option value="quiz">🧩 Quiz</option>
                        </select>
                      </div>
                      <div className="studio-form-field">
                        <label>Cấp độ</label>
                        <select className="form-input" value={lessonLevel} onChange={(e) => setLessonLevel(e.target.value as CourseLevel)}>
                          <option value="beginner">Sơ cấp</option>
                          <option value="intermediate">Trung cấp</option>
                          <option value="advanced">Nâng cao</option>
                        </select>
                      </div>
                    </div>
                    {lessonType === 'quiz' && (
                      <div className="studio-form-field">
                        <label>Bài quiz template</label>
                        <select className="form-input" value={lessonQuizTemplateId} onChange={(e) => setLessonQuizTemplateId(e.target.value)}>
                          <option value="">— Không dùng template —</option>
                          {quizTemplates.map((t) => (
                            <option key={t.id} value={t.id}>{t.title} ({t.quizCount} câu)</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {lessonType === 'video' && (
                      <div className="studio-form-field">
                        <label>URL video (HLS/m3u8)</label>
                        <input
                          className="form-input"
                          placeholder="https://cdn.example.com/video.m3u8"
                          value={lessonVideoUrl}
                          onChange={(e) => setLessonVideoUrl(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="studio-form-field">
                      <label>Tóm tắt</label>
                      <textarea
                        className="form-input"
                        placeholder="Mô tả ngắn nội dung bài học..."
                        value={lessonSummary}
                        onChange={(e) => setLessonSummary(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="studio-card-actions">
                      <button
                        className="studio-btn studio-btn-secondary"
                        onClick={() => { setCourseStep('module'); setSelectedModuleId(''); }}
                      >
                        ← Quay lại module
                      </button>
                      <button
                        className="studio-btn studio-btn-primary"
                        onClick={() => wrapSubmit(handleCreateLesson)}
                        disabled={submitting || !lessonTitle.trim()}
                      >
                        {submitting ? 'Đang tạo...' : '💾 Tạo bài học'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ THEORY ═══════════════ */}
          {activeSection === 'theory' && (
            <div className="studio-section">
              <div className="studio-section-head">
                <h2>📖 Tạo bài nhạc lý</h2>
                <p>Bài lý thuyết âm nhạc: scale, interval, rhythm, key...</p>
              </div>
              <div className="studio-card">
                <div className="studio-form">
                  <div className="studio-form-row">
                    <div className="studio-form-field">
                      <label>Tiêu đề <span className="required">*</span></label>
                      <input
                        className="form-input"
                        placeholder="VD: Thang âm major"
                        value={theoryTitle}
                        onChange={(e) => { setTheoryTitle(e.target.value); setTheorySlug(toSlug(e.target.value)); }}
                      />
                    </div>
                    <div className="studio-form-field">
                      <label>Slug</label>
                      <input className="form-input" placeholder="thang-am-major" value={theorySlug} onChange={(e) => setTheorySlug(e.target.value)} />
                    </div>
                  </div>
                  <div className="studio-form-row">
                    <div className="studio-form-field">
                      <label>Chủ đề</label>
                      <select className="form-input" value={theoryTopic} onChange={(e) => setTheoryTopic(e.target.value as TheoryTopic)}>
                        <option value="scale">Scale (Thang âm)</option>
                        <option value="interval">Interval (Khoảng cách)</option>
                        <option value="rhythm">Rhythm (Nhịp)</option>
                        <option value="key">Key (Khóa)</option>
                      </select>
                    </div>
                    <div className="studio-form-field">
                      <label>Cấp độ</label>
                      <select className="form-input" value={theoryLevel} onChange={(e) => setTheoryLevel(e.target.value as CourseLevel)}>
                        <option value="beginner">Sơ cấp</option>
                        <option value="intermediate">Trung cấp</option>
                        <option value="advanced">Nâng cao</option>
                      </select>
                    </div>
                    <div className="studio-form-field">
                      <label>Trạng thái</label>
                      <select className="form-input" value={String(theoryPublished)} onChange={(e) => setTheoryPublished(e.target.value === 'true')}>
                        <option value="true">Xuất bản</option>
                        <option value="false">Nháp</option>
                      </select>
                    </div>
                  </div>
                  <div className="studio-form-field">
                    <label>Nội dung (HTML)</label>
                    <textarea
                      className="form-input"
                      placeholder="<h3>Giới thiệu</h3><p>Nội dung bài học...</p>"
                      value={theoryContent}
                      onChange={(e) => setTheoryContent(e.target.value)}
                      rows={8}
                    />
                    <small className="studio-form-hint">Có thể dùng HTML để định dạng nội dung</small>
                  </div>
                  <button
                    className="studio-btn studio-btn-primary"
                    onClick={() => wrapSubmit(handleCreateTheory)}
                    disabled={submitting || !theoryTitle.trim()}
                  >
                    {submitting ? 'Đang tạo...' : '💾 Tạo bài nhạc lý'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ NOTES ═══════════════ */}
          {activeSection === 'notes' && (
            <div className="studio-section">
              <div className="studio-section-head">
                <h2>🎵 Quản lý Note</h2>
                <p>Tạo và quản lý các nốt nhạc trong hệ thống GuitarVN.</p>
              </div>
              <div className="studio-card">
                <div className="studio-form">
                  <div className="studio-form-row">
                    <div className="studio-form-field">
                      <label>Tên note (canonical)</label>
                      <select className="form-input" value={noteName} onChange={(e) => setNoteName(e.target.value)}>
                        {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div className="studio-form-field">
                      <label>Octave</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        max={9}
                        value={noteOctave}
                        onChange={(e) => setNoteOctave(Number(e.target.value))}
                      />
                    </div>
                    <div className="studio-form-field">
                      <label>MIDI number</label>
                      <input
                        className="form-input"
                        type="number"
                        value={noteMidi}
                        onChange={(e) => setNoteMidi(Number(e.target.value))}
                      />
                    </div>
                    <div className="studio-form-field">
                      <label>Tần số (Hz)</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        value={noteFreq}
                        onChange={(e) => setNoteFreq(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="studio-note-preview">
                    <div className="studio-note-symbol">
                      <span className="studio-note-name">{noteName}</span>
                      <span className="studio-note-octave">{noteOctave}</span>
                    </div>
                    <div className="studio-note-detail">
                      <div><strong>MIDI:</strong> {noteMidi}</div>
                      <div><strong>Tần số:</strong> {noteFreq} Hz</div>
                    </div>
                  </div>
                  <button
                    className="studio-btn studio-btn-primary"
                    onClick={() => wrapSubmit(handleCreateNote)}
                    disabled={submitting}
                  >
                    {submitting ? 'Đang tạo...' : '💾 Thêm note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ LINKS ═══════════════ */}
          {activeSection === 'links' && (
            <div className="studio-section">
              <div className="studio-section-head">
                <h2>🔗 Liên kết nhanh</h2>
                <p>Truy cập nhanh các công cụ và trang quản trị khác.</p>
              </div>
              <div className="studio-links-grid">
                <Link to="/quan-tri/quizzes" className="studio-link-card">
                  <span className="studio-link-icon">🧩</span>
                  <div>
                    <strong>Trang tạo Quiz</strong>
                    <small>Tạo bài kiểm tra với nhiều loại câu hỏi</small>
                  </div>
                </Link>
                <Link to="/songs/new" className="studio-link-card">
                  <span className="studio-link-icon">🎵</span>
                  <div>
                    <strong>Tạo Tab nhạc</strong>
                    <small>Thêm bài hát mới vào thư viện</small>
                  </div>
                </Link>
                <Link to="/quan-tri/nguoi-dung" className="studio-link-card">
                  <span className="studio-link-icon">👥</span>
                  <div>
                    <strong>Quản lý người dùng</strong>
                    <small>Xem, sửa, xóa tài khoản người dùng</small>
                  </div>
                </Link>
                <Link to="/quan-tri/khoa-hoc" className="studio-link-card">
                  <span className="studio-link-icon">📚</span>
                  <div>
                    <strong>Danh sách khóa học</strong>
                    <small>Xem và quản lý tất cả khóa học</small>
                  </div>
                </Link>
                <Link to="/quan-tri/bai-hat" className="studio-link-card">
                  <span className="studio-link-icon">🎸</span>
                  <div>
                    <strong>Danh sách bài hát</strong>
                    <small>Quản lý thư viện tabs và lyrics</small>
                  </div>
                </Link>
                <Link to="/nhan-dien-tab" className="studio-link-card">
                  <span className="studio-link-icon">📷</span>
                  <div>
                    <strong>Nhận diện Tab</strong>
                    <small>Upload ảnh để nhận diện tab nhạc</small>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
