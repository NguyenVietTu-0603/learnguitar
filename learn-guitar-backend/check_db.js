import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';
import Song from './src/models/Song.model.js';
import Chord from './src/models/Chord.model.js';
import SongChordUsage from './src/models/SongChordUsage.model.js';

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const [userCount, songCount, chordCount, usageCount] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Chord.countDocuments(),
      SongChordUsage.countDocuments()
    ]);

    const songs = await Song.find().select('title');
    const chords = await Chord.find().select('name');

    console.log("Counts:");
    console.log(`- Users: ${userCount}`);
    console.log(`- Songs: ${songCount}`);
    console.log(`- Chords: ${chordCount}`);
    console.log(`- SongChordUsage: ${usageCount}`);

    console.log("\nSong Titles:");
    songs.forEach(s => console.log(`- ${s.title}`));

    console.log("\nChord Names:");
    chords.forEach(c => console.log(`- ${c.name}`));
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
