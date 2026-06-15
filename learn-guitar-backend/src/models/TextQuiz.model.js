import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const textQuizSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    coverImageUrl: { type: String, default: null },
    isPublished: { type: Boolean, default: false, index: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

textQuizSchema.index({ level: 1, isPublished: 1 });

const TextQuiz = mongoose.model('TextQuiz', textQuizSchema);

export default TextQuiz;
