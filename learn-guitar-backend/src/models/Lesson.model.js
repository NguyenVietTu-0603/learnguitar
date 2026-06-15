import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      required: true,
      index: true,
    },
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
    lessonType: {
      type: String,
      enum: ['video', 'theory', 'quiz'],
      default: 'video',
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
      index: true,
    },
    videoUrlHls: {
      type: String,
      default: null,
    },
    videoThumbnailUrl: {
      type: String,
      default: null,
    },
    durationSec: {
      type: Number,
      default: 0,
      min: 0,
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
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ moduleId: 1, order: 1 }, { unique: true });
lessonSchema.index({ courseId: 1, level: 1, isPublished: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
