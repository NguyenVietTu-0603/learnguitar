import mongoose from 'mongoose';

const theoryLessonSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      enum: ['scale', 'interval', 'rhythm', 'key'],
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
      index: true,
    },
    contentRichText: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    embeddedVideoUrl: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

theoryLessonSchema.index({ topic: 1, level: 1, isPublished: 1 });

const TheoryLesson = mongoose.model('TheoryLesson', theoryLessonSchema);

export default TheoryLesson;
