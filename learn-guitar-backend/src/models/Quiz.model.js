import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
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
    quizType: {
      type: String,
      enum: ['note_identify', 'chord_identify', 'fret_position'],
      required: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    lessonTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizLessonTemplate',
      default: null,
      index: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

quizSchema.index({ courseId: 1, level: 1, isPublished: 1 });
quizSchema.index({ lessonTemplateId: 1, isPublished: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
