import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

courseModuleSchema.index({ courseId: 1, order: 1 }, { unique: true });

const CourseModule = mongoose.model('CourseModule', courseModuleSchema);

export default CourseModule;
