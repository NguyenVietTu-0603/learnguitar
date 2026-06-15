import mongoose from 'mongoose';

const songChordUsageSchema = new mongoose.Schema(
  {
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      required: true,
      index: true
    },
    chordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chord',
      required: true,
      index: true
    },
    positionInSong: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

songChordUsageSchema.index({ songId: 1, chordId: 1, positionInSong: 1 });

const SongChordUsage = mongoose.model('SongChordUsage', songChordUsageSchema);

export default SongChordUsage;
