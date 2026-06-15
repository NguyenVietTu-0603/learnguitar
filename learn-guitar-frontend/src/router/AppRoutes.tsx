import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MyCoursesPage from '../pages/MyCoursesPage';
import SongsPage from '../pages/SongsPage';
import SongDetailPage from '../pages/SongDetailPage';
import SongEditorPage from '../pages/SongEditorPage';
import SongCreatePage from '../pages/SongCreatePage';
import ChordsPage from '../pages/ChordsPage';
import ChordDetailPage from '../pages/ChordDetailPage';
import DashboardPage from '../pages/DashboardPage';
import CoursesPage from '../pages/CoursesPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import LessonPage from '../pages/LessonPage';
import PracticeRoomPage from '../pages/PracticeRoomPage';
import QuizLessonPracticePage from '../pages/QuizLessonPracticePage';
import BlogPage from '../pages/BlogPage';
import TheoryPage from '../pages/TheoryPage';
import TheoryDetailPage from '../pages/TheoryDetailPage';
import AdminStudioPage from '../pages/AdminStudioPage';
import QuizStudioPage from '../pages/QuizStudioPage';
import QuizChord from '../pages/quizchord.page'
import VideoLessonsPage from '../pages/VideoLessonsPage';
import VideoLessonDetailPage from '../pages/VideoLessonDetailPage';
import TextQuizPage from '../pages/TextQuizPage';
import TextQuizDetailPage from '../pages/TextQuizDetailPage';
import QuizPage from '../pages/QuizPage';
import TabImagePage from '../pages/TabImagePage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/useAuth';

function PublicOnly({ children }: { children: ReactElement }) {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loader" aria-hidden="true"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />

      <Route path="/tab-nhac" element={<SongsPage />} />
      <Route path="/songs" element={<SongsPage />} />
      <Route path="/songs/:slug" element={<SongDetailPage />} />
      <Route path="/hop-am" element={<ChordsPage />} />
      <Route path="/chords" element={<ChordsPage />} />
      <Route path="/chords/:slug" element={<ChordDetailPage />} />
      <Route path="/khoa-hoc" element={<CoursesPage />} />
      <Route path="/khoa-hoc/:slug" element={<CourseDetailPage />} />
      <Route path="/khoa-hoc/:courseSlug/bai-hoc/:slug" element={<LessonPage />} />
      <Route path="/bai-hoc/:slug" element={<LessonPage />} />
      <Route path="/nhac-ly" element={<TheoryPage />} />
      <Route path="/nhac-ly/:slug" element={<TheoryDetailPage />} />
      <Route path="/video-lessons" element={<VideoLessonsPage />} />
      <Route path="/video-lessons/:slug" element={<VideoLessonDetailPage />} />
      <Route path="/text-quiz" element={<TextQuizPage />} />
      <Route path="/text-quiz/:slug" element={<TextQuizDetailPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/nhan-dien-tab" element={<TabImagePage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/khoa-hoc-cua-toi" element={<MyCoursesPage />} />
        <Route path="/quiz-lessons" element={<QuizLessonPracticePage />} />
        <Route path="/thuc-hanh" element={<PracticeRoomPage />} />
        <Route path="/quan-tri/studio" element={<AdminStudioPage />} />
        <Route path="/quan-tri/quizzes" element={<QuizStudioPage />} />
        <Route path="/songs/new" element={<SongCreatePage />} />
        <Route path="/songs/:slug/edit" element={<SongEditorPage />} />
        <Route path="/quizchord" element={<QuizChord />} />
        
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
