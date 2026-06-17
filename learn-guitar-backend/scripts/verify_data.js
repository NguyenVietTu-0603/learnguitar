import 'dotenv/config';
import mongoose from 'mongoose';
import Badge from '../src/models/Badge.model.js';
import Chord from '../src/models/Chord.model.js';
import Course from '../src/models/Course.model.js';
import Lesson from '../src/models/Lesson.model.js';
import Quiz from '../src/models/Quiz.model.js';
import User from '../src/models/User.model.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const [badges, chords, courses, lessons, quizzes, users] = await Promise.all([
    Badge.countDocuments(),
    Chord.countDocuments(),
    Course.countDocuments(),
    Lesson.countDocuments(),
    Quiz.countDocuments(),
    User.countDocuments(),
  ]);

  console.log('\n===== Database summary =====');
  console.log(`Users:    ${users}`);
  console.log(`Badges:   ${badges}`);
  console.log(`Chords:   ${chords}`);
  console.log(`Courses:  ${courses}`);
  console.log(`Lessons:  ${lessons}`);
  console.log(`Quizzes:  ${quizzes}`);
  console.log('============================\n');

  const sampleLessons = await Lesson.find().select('title type').limit(5).lean();
  console.log('Sample lessons:');
  sampleLessons.forEach((l) => console.log(`  - [${l.type}] ${l.title}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => mongoose.disconnect());
