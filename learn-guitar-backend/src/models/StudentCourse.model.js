import mongoose from 'mongoose';

const studentCourseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'paused'],
      default: 'enrolled',
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAccessAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

studentCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
studentCourseSchema.index({ userId: 1, lastAccessAt: -1 });

const StudentCourse = mongoose.model('StudentCourse', studentCourseSchema);

export default StudentCourse;
