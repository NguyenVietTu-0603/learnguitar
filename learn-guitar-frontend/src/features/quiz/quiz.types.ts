export type QuizMode = 'practice' | 'exam';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all';
export type QuizQuestionType = 'note_name_mc' | 'chord_name_mc' | 'fret_select';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface QuizQuestion {
  questionId: string;
  questionType: QuizQuestionType;
  prompt: string;
  audioUrl?: string | null;
  options?: string[];
  questionToken: string;
  chordSnapshot?: {
    slug: string;
    displayName: string;
    positions: number[];
    fingers?: number[];
    diagramSvg?: string | null;
    audioUrl?: string | null;
  } | null;
  answerKey?: {
    correctOption: string;
    aliases?: string[];
  } | null;
}

export interface QuizStartPayload {
  mode?: QuizMode;
}

export interface CreateQuizPayload {
  slug: string;
  title: string;
  quizType: 'note_identify' | 'chord_identify' | 'fret_position';
  level: 'beginner' | 'intermediate' | 'advanced';
  courseId?: string;
  lessonId?: string;
  config?: {
    questionCount?: number;
  };
  isPublished?: boolean;
}

export interface CreateQuizQuestionPayload {
  questionType: QuizQuestionType;
  prompt: string;
  audioUrl: string;
  noteId?: string;
  chordSlug?: string;
  correctAnswer?: Record<string, unknown>;
  options?: string[];
  difficultyWeight?: number;
}

export interface QuizAdminItem {
  id: string;
  slug: string;
  title: string;
  quizType: string;
  level: string;
  courseId?: string | null;
  lessonId?: string | null;
  config?: {
    questionCount?: number;
  };
  isPublished: boolean;
}

export interface QuizQuestionAdminItem {
  id: string;
  quizId: string;
  questionType: QuizQuestionType;
  prompt: string;
  audioUrl: string;
  noteId?: string | null;
  chordSlug?: string | null;
  options?: string[] | null;
  difficultyWeight?: number;
  correctAnswer?: Record<string, unknown>;
}

export interface QuizLessonTemplateItem {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessonType: 'quiz_chord_guess';
  quizCount: number;
  isPublished: boolean;
}

export interface QuizLessonTemplatePayload {
  slug: string;
  title: string;
  summary?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPublished?: boolean;
}

export interface ChordGuessQuizInput {
  title: string;
  prompt: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  audioUrl?: string;
  correctChordSlug: string;
  wrongChordSlugs: [string, string, string];
  difficultyWeight?: number;
}

export interface CreateChordGuessBatchPayload {
  quizzes: ChordGuessQuizInput[];
}

export interface ChordGuessBatchResult {
  template: QuizLessonTemplateItem;
  createdCount: number;
  items: Array<{
    quiz: QuizAdminItem;
    question: QuizQuestionAdminItem;
  }>;
}

export interface QuizLessonDetailQuestion {
  id: string;
  questionType: QuizQuestionType;
  prompt: string;
  audioUrl: string;
  chordSlug?: string | null;
  options?: string[] | null;
}

export interface QuizLessonDetailQuiz {
  id: string;
  slug: string;
  title: string;
  quizType: string;
  level: string;
  isPublished: boolean;
  questions: QuizLessonDetailQuestion[];
}

export interface PracticeQuizPickerItem {
  id: string;
  slug: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  quizType?: string;
  lessonId?: string | null;
  courseId?: string | null;
}

export interface QuizLessonTemplateDetail extends QuizLessonTemplateItem {
  quizzes: QuizLessonDetailQuiz[];
}

export interface QuizStartData {
  attemptId: string;
  quiz: {
    id: string;
    title: string;
    slug?: string;
    quizType?: string;
  };
  questions: QuizQuestion[];
}

export interface QuizAnswerInput {
  questionId: string;
  questionToken: string;
  selectedOption?: string;
  selectedPosition?: {
    stringNumber: number;
    fret: number;
  };
  responseTimeMs?: number;
}

export interface QuizSubmitPayload {
  attemptId: string;
  idempotencyKey?: string;
  answers: QuizAnswerInput[];
}

export interface QuizSubmitData {
  id: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  status: 'submitted' | 'in_progress';
  breakdown?: {
    accuracy: number;
    speedBonus: number;
    streakBonus: number;
  };
}

export interface QuizAttemptItem {
  id: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  status: string;
  durationSec?: number;
  createdAt: string;
}

export interface LeaderboardItem {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  bestScore: number;
  durationSec: number;
}

export interface LeaderboardData {
  items: LeaderboardItem[];
  myRank: number | null;
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
  };
}
