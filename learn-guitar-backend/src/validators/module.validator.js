import { z } from 'zod';

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, 'ID không hợp lệ.');

export const listCourseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().trim().max(120).optional(),
});

export const listLessonQuerySchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const createCourseBodySchema = z.object({
  slug: z.string().trim().min(3).max(140),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  thumbnailUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const createModuleBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  order: z.number().int().min(0).optional(),
});

export const createLessonBodySchema = z.object({
  slug: z.string().trim().min(3).max(140),
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(3000).optional(),
  lessonType: z.enum(['video', 'theory', 'quiz']).default('video'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  videoUrlHls: z.string().url().optional(),
  videoThumbnailUrl: z.string().url().optional(),
  durationSec: z.number().int().min(0).default(0),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  quizLessonTemplateId: z.string().trim().min(12).optional(),
  isPublished: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const listQuizLessonTemplateQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().trim().max(120).optional(),
});

export const createQuizLessonTemplateBodySchema = z.object({
  slug: z.string().trim().min(3).max(140),
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().max(3000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  isPublished: z.boolean().optional(),
});

export const createChordGuessQuizBatchBodySchema = z.object({
  quizzes: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200).optional(),
        prompt: z.string().trim().min(3).max(400),
        level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        audioUrl: z.string().trim().max(500).optional(),
        correctChordSlug: z.string().trim().min(1).max(80),
        wrongChordSlugs: z.array(z.string().trim().min(1).max(80)).length(3),
        difficultyWeight: z.number().min(0.1).max(3).optional(),
      })
    )
    .min(1)
    .max(60),
});

export const noteListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  name: z.string().trim().max(12).optional(),
  octave: z.coerce.number().int().min(0).max(9).optional(),
});

export const createNoteBodySchema = z.object({
  canonicalName: z.string().trim().min(1).max(4),
  enharmonicNames: z.array(z.string().trim().min(1).max(4)).max(4).default([]),
  octave: z.number().int().min(0).max(9),
  frequencyHz: z.number().positive(),
  midiNumber: z.number().int().min(0).max(127),
  audioUrl: z.string().url(),
  fretPositions: z
    .array(
      z.object({
        stringNumber: z.number().int().min(1).max(6),
        fret: z.number().int().min(0).max(22),
      })
    )
    .default([]),
});

export const randomNoteQuerySchema = z.object({
  count: z.coerce.number().int().min(1).max(30).default(10),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const fretPositionQuerySchema = z.object({
  stringNumber: z.coerce.number().int().min(1).max(6),
  fret: z.coerce.number().int().min(0).max(22),
});

export const theoryQuerySchema = z.object({
  topic: z.enum(['scale', 'interval', 'rhythm', 'key']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const createTheoryBodySchema = z.object({
  slug: z.string().trim().min(3).max(140),
  title: z.string().trim().min(3).max(200),
  topic: z.enum(['scale', 'interval', 'rhythm', 'key']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  contentRichText: z.any(),
  coverImageUrl: z.string().url().optional(),
  embeddedVideoUrl: z.string().url().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  isPublished: z.boolean().optional(),
});

export const startQuizBodySchema = z.object({
  mode: z.enum(['practice', 'exam']).optional(),
});

export const createQuizBodySchema = z.object({
  slug: z.string().trim().min(3).max(140),
  title: z.string().trim().min(3).max(200),
  quizType: z.enum(['note_identify', 'chord_identify', 'fret_position']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  courseId: z.string().trim().min(12).optional(),
  lessonId: z.string().trim().min(12).optional(),
  config: z
    .object({
      questionCount: z.number().int().min(1).max(100).optional(),
    })
    .optional(),
  isPublished: z.boolean().optional(),
});

export const createQuizQuestionBodySchema = z
  .object({
    questionType: z.enum(['note_name_mc', 'chord_name_mc', 'fret_select']),
    prompt: z.string().trim().min(3).max(300),
    audioUrl: z.string().trim().min(1).max(500),
    noteId: z.string().trim().min(12).optional(),
    chordSlug: z.string().trim().min(1).max(80).optional(),
    correctAnswer: z.record(z.any()).default({}),
    options: z.array(z.string().trim().min(1).max(80)).optional(),
    difficultyWeight: z.number().min(0.1).max(3).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.questionType === 'chord_name_mc') {
      if (!value.chordSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['chordSlug'],
          message: 'chordSlug là bắt buộc cho câu hỏi đoán hợp âm.',
        });
      }

      if (!Array.isArray(value.options) || value.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Câu hỏi đoán hợp âm phải có đúng 4 đáp án.',
        });
      }

      const chordName = String(value.correctAnswer?.chordName || '').trim();
      if (!chordName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctAnswer', 'chordName'],
          message: 'correctAnswer.chordName là bắt buộc cho câu hỏi đoán hợp âm.',
        });
      }

      if (Array.isArray(value.options) && chordName) {
        const normalizedCorrect = chordName.toUpperCase();
        const hitCount = value.options.filter((item) => item.trim().toUpperCase() === normalizedCorrect).length;
        if (hitCount !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['options'],
            message: 'Đáp án đúng phải xuất hiện đúng 1 lần trong 4 lựa chọn.',
          });
        }
      }
    }
  });

export const submitQuizBodySchema = z.object({
  attemptId: z.string().min(12),
  idempotencyKey: z.string().max(120).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(12),
        questionToken: z.string().min(8),
        selectedOption: z.string().optional(),
        selectedPosition: z
          .object({
            stringNumber: z.number().int().min(1).max(6),
            fret: z.number().int().min(0).max(22),
          })
          .optional(),
        responseTimeMs: z.number().int().positive().optional(),
      })
    )
    .min(1),
});

export const leaderboardQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'all']).default('weekly'),
});

export const lessonProgressBodySchema = z.object({
  watchedSec: z.coerce.number().int().min(0).default(0),
  markCompleted: z.boolean().optional(),
  quizBestScore: z.coerce.number().min(0).max(100).optional(),
  accumulatedSec: z.coerce.number().int().min(0).optional(),
});

export const enrollCourseBodySchema = z.object({
  courseId: objectIdSchema,
});

export const myCoursesQuerySchema = z.object({
  status: z.enum(['enrolled', 'completed', 'paused']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const continueLearningQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(12).optional(),
});

export const historyQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  eventType: z
    .enum(['lesson_viewed', 'lesson_completed', 'quiz_submitted', 'streak_updated', 'badge_unlocked'])
    .optional(),
});
