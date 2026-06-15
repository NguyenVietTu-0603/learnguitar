import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    iconUrl: {
      type: String,
      default: null,
    },
    ruleType: {
      type: String,
      enum: ['streak', 'quiz_score', 'lesson_count', 'fretboard'],
      required: true,
    },
    ruleConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
