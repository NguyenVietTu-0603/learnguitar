import 'dotenv/config';
import mongoose from 'mongoose';
import Chord from '../src/models/Chord.model.js';

const chords = [
  {
    name: 'Em',
    slug: 'em',
    displayName: 'Em',
    alias: ['E minor', 'Mi thứ'],
    positions: [0, 0, 0, 2, 2, 0],
    fingers: [0, 0, 0, 2, 3, 0],
    difficulty: 'beginner',
    notes: ['E', 'G', 'B'],
    category: 'minor',
    tags: ['open', 'beginner', 'em'],
    popularity: 95,
    isBarre: false,
  },
  {
    name: 'C',
    slug: 'c',
    displayName: 'C',
    alias: ['C major', 'Đô trưởng'],
    positions: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    difficulty: 'beginner',
    notes: ['C', 'E', 'G'],
    category: 'major',
    tags: ['open', 'beginner', 'c'],
    popularity: 98,
    isBarre: false,
  },
  {
    name: 'G',
    slug: 'g',
    displayName: 'G',
    alias: ['G major', 'Sol trưởng'],
    positions: [3, 2, 0, 0, 0, 3],
    fingers: [3, 2, 0, 0, 0, 4],
    difficulty: 'beginner',
    notes: ['G', 'B', 'D'],
    category: 'major',
    tags: ['open', 'beginner', 'g'],
    popularity: 97,
    isBarre: false,
  },
  {
    name: 'Am',
    slug: 'am',
    displayName: 'Am',
    alias: ['A minor', 'La thứ'],
    positions: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    difficulty: 'beginner',
    notes: ['A', 'C', 'E'],
    category: 'minor',
    tags: ['open', 'beginner', 'am'],
    popularity: 96,
    isBarre: false,
  },
  {
    name: 'F',
    slug: 'f',
    displayName: 'F',
    alias: ['F major', 'Fa trưởng'],
    positions: [-1, -1, 3, 2, 1, 1],
    fingers: [0, 0, 3, 2, 1, 1],
    difficulty: 'beginner',
    notes: ['F', 'A', 'C'],
    category: 'major',
    tags: ['open', 'beginner', 'f', 'mini-barre'],
    popularity: 90,
    isBarre: false,
  },
  {
    name: 'D',
    slug: 'd',
    displayName: 'D',
    alias: ['D major', 'Rê trưởng'],
    positions: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    difficulty: 'beginner',
    notes: ['D', 'F#', 'A'],
    category: 'major',
    tags: ['open', 'beginner', 'd'],
    popularity: 92,
    isBarre: false,
  },
  {
    name: 'A',
    slug: 'a',
    displayName: 'A',
    alias: ['A major', 'La trưởng'],
    positions: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    difficulty: 'beginner',
    notes: ['A', 'C#', 'E'],
    category: 'major',
    tags: ['open', 'beginner', 'a'],
    popularity: 88,
    isBarre: false,
  },
  {
    name: 'E',
    slug: 'e',
    displayName: 'E',
    alias: ['E major', 'Mi trưởng'],
    positions: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    difficulty: 'beginner',
    notes: ['E', 'G#', 'B'],
    category: 'major',
    tags: ['open', 'beginner', 'e'],
    popularity: 85,
    isBarre: false,
  },
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu MONGODB_URI trong môi trường.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let updated = 0;

  for (const chord of chords) {
    const result = await Chord.findOneAndUpdate(
      { slug: chord.slug },
      { $set: chord },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (result) updated += 1;
    else created += 1;
    console.log(`  + ${chord.displayName} (${chord.slug})`);
  }

  const total = await Chord.countDocuments();
  console.log(`\nSeed chords completed. Total chords in DB: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
