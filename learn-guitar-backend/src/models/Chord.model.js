import mongoose from 'mongoose';

const DIFFICULTY_ENUM = ['beginner', 'intermediate', 'advanced'];
const CHORD_CATEGORY_ENUM = [
  'major',
  'minor',
  'seventh',
  'suspended',
  'diminished',
  'augmented',
  'extended',
  'other'
];

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

const chordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    displayName: {
      type: String,
      required: true,
      trim: true
    },
    alias: {
      type: [String],
      default: []
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

    difficulty: {
      type: String,
      enum: DIFFICULTY_ENUM,
      default: 'beginner'
    },
    capo: {
      type: Number,
      default: null,
      min: 0,
      max: 24
    },
    key: {
      type: String,
      default: null,
      trim: true
    },
    notes: {
      type: [String],
      default: []
    },

    audioUrl: {
      type: String,
      default: null,
      trim: true
    },

    diagramSvg: {
      type: String,
      default: null
    },
    isBarre: {
      type: Boolean,
      default: false
    },

    category: {
      type: String,
      enum: CHORD_CATEGORY_ENUM,
      required: true,
      default: 'other'
    },
    tags: {
      type: [String],
      default: []
    },

    popularity: {
      type: Number,
      default: 0,
      min: 0
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

chordSchema.index({ category: 1 });
chordSchema.index({ difficulty: 1 });

chordSchema.virtual('variations', {
  ref: 'ChordVariation',
  localField: '_id',
  foreignField: 'chordId'
});

chordSchema.virtual('songUsages', {
  ref: 'SongChordUsage',
  localField: '_id',
  foreignField: 'chordId'
});

const Chord = mongoose.model('Chord', chordSchema);

export default Chord;
