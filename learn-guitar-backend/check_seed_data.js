import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';
import Song from './src/models/Song.model.js';
import Chord from './src/models/Chord.model.js';
import SongChordUsage from './src/models/SongChordUsage.model.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const userCount = await User.countDocuments();
  const songCount = await Song.countDocuments();
  const chordCount = await Chord.countDocuments();
  const usageCount = await SongChordUsage.countDocuments();

  const songs = await Song.find().select('slug');
  const chords = await Chord.find().select('slug');

  console.log(JSON.stringify({
    counts: {
      users: userCount,
      songs: songCount,
      chords: chordCount,
      songChordUsage: usageCount
    },
    songs: songs.map(s => s.slug),
    chords: chords.map(c => c.slug)
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
