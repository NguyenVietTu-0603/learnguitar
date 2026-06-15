import 'dotenv/config';
import mongoose from 'mongoose';
import Badge from '../src/models/Badge.model.js';

const defaultBadges = [
  {
    code: 'FRETBOARD_MASTER',
    name: 'Fretboard Master',
    description: 'Đạt điểm trung bình cao ở quiz định vị nốt trên cần đàn.',
    ruleType: 'fretboard',
    ruleConfig: {
      score: 85,
      attempts: 5,
    },
  },
  {
    code: 'DAYS_30_STREAK',
    name: '30 Days Streak',
    description: 'Luyện tập liên tục trong 30 ngày.',
    ruleType: 'streak',
    ruleConfig: {
      days: 30,
    },
  },
  {
    code: 'LESSON_50',
    name: 'Half Century Learner',
    description: 'Hoàn thành 50 bài học.',
    ruleType: 'lesson_count',
    ruleConfig: {
      lessons: 50,
    },
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const badge of defaultBadges) {
    await Badge.findOneAndUpdate(
      { code: badge.code },
      {
        $set: {
          name: badge.name,
          description: badge.description,
          ruleType: badge.ruleType,
          ruleConfig: badge.ruleConfig,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  console.log('Seed badges completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
