import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chord',
      required: true
    },
    label: {
      type: String,
      required: true
    },
    diagramSvg: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

const quizChordSchema = new mongoose.Schema(
  {
    chordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chord',
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      default: 'Hợp âm này tên là gì?'
    },
    options: {
      type: [optionSchema],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: 'Phải có đúng 4 options'
      }
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    category: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

const QuizChord = mongoose.model('QuizChord', quizChordSchema);

export default QuizChord;