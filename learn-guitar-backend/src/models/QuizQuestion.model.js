import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    questionType: {
      type: String,
      enum: ['note_name_mc', 'chord_name_mc', 'fret_select'],
      required: true,
    },
    prompt: {
      type: String,
      default: '',
    },
    audioUrl: {
      type: String,
      required: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      default: null,
      index: true,
    },
    chordSlug: {
      type: String,
      default: null,
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    difficultyWeight: {
      type: Number,
      default: 1,
      min: 0.1,
    },
  },
  { timestamps: true }
);

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

export default QuizQuestion;
