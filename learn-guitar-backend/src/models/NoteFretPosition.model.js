import mongoose from 'mongoose';

const noteFretPositionSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true,
    },
    stringNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      index: true,
    },
    fret: {
      type: Number,
      required: true,
      min: 0,
      max: 22,
      index: true,
    },
  },
  { timestamps: true }
);

noteFretPositionSchema.index({ noteId: 1, stringNumber: 1, fret: 1 }, { unique: true });

const NoteFretPosition = mongoose.model('NoteFretPosition', noteFretPositionSchema);

export default NoteFretPosition;
