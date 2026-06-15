import mongoose from 'mongoose';

const quizLessonTemplateSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
      index: true,
    },
    lessonType: {
      type: String,
      enum: ['quiz_chord_guess'],
      default: 'quiz_chord_guess',
      index: true,
    },
    quizCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

quizLessonTemplateSchema.index({ level: 1, isPublished: 1, createdAt: -1 });

const QuizLessonTemplate = mongoose.model('QuizLessonTemplate', quizLessonTemplateSchema);

export default QuizLessonTemplate;
