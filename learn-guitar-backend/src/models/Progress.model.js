import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['course', 'module', 'lesson'],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    completionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
    },
    watchedSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizBestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    accumulatedSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAccessAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    version: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });
progressSchema.index({ userId: 1, courseId: 1 });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
