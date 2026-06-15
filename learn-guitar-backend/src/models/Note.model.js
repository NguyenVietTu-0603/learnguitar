import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    canonicalName: {
      type: String,
      required: true,
      trim: true,
    },
    enharmonicNames: {
      type: [String],
      default: [],
    },
    octave: {
      type: Number,
      required: true,
      min: 0,
      max: 9,
    },
    frequencyHz: {
      type: Number,
      required: true,
      min: 0,
    },
    midiNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 0,
      max: 127,
    },
    audioUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

noteSchema.index({ canonicalName: 1, octave: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
