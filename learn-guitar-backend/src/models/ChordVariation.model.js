import mongoose from 'mongoose';

const isValidPositions = (positions) => {
  if (!Array.isArray(positions) || positions.length !== 6) {
    return false;
  }

  return positions.every((value) => Number.isInteger(value) && value >= -1);
};

const isValidFingers = (fingers) => {
  if (fingers === undefined || fingers === null) {
    return true;
  }

  if (!Array.isArray(fingers) || fingers.length !== 6) {
    return false;
  }

  return fingers.every((value) => Number.isInteger(value) && value >= 0 && value <= 4);
};

const chordVariationSchema = new mongoose.Schema(
  {
    chordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chord',
      required: true,
      index: true
    },
    positions: {
      type: [Number],
      required: true,
      validate: {
        validator: isValidPositions,
        message: 'positions phai la mang 6 so nguyen (>= -1)'
      }
    },
    fingers: {
      type: [Number],
      default: undefined,
      validate: {
        validator: isValidFingers,
        message: 'fingers phai la mang 6 so nguyen trong khoang 0-4'
      }
    },
    capo: {
      type: Number,
      default: null,
      min: 0,
      max: 24
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    audioUrl: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

chordVariationSchema.index({ chordId: 1, capo: 1 });

const ChordVariation = mongoose.model('ChordVariation', chordVariationSchema);

export default ChordVariation;
