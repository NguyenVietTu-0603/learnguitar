import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const chordsSeed = [
  {
    name: 'C',
    slug: 'c',
    displayName: 'C',
    alias: ['Do'],
    positions: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    difficulty: 'beginner',
    category: 'major',
    notes: ['C', 'E', 'G'],
    tags: ['open-chord', 'basic'],
    audioUrl: '/static/audio/chords/c.mp3'
  },
  {
    name: 'G',
    slug: 'g',
    displayName: 'G',
    alias: ['Sol'],
    positions: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    difficulty: 'beginner',
    category: 'major',
    notes: ['G', 'B', 'D'],
    tags: ['open-chord', 'basic'],
    audioUrl: '/static/audio/chords/g.mp3'
  },
  {
    name: 'Am',
    slug: 'am',
    displayName: 'Am',
    alias: ['La minor'],
    positions: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    difficulty: 'beginner',
    category: 'minor',
    notes: ['A', 'C', 'E'],
    tags: ['open-chord', 'basic'],
    audioUrl: '/static/audio/chords/am.mp3'
  },
  {
    name: 'F',
    slug: 'f',
    displayName: 'F',
    alias: ['Fa'],
    positions: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    difficulty: 'intermediate',
    category: 'major',
    notes: ['F', 'A', 'C'],
    tags: ['barre'],
    audioUrl: '/static/audio/chords/f.mp3'
  },
  {
    name: 'Dm',
    slug: 'dm',
    displayName: 'Dm',
    alias: ['Re minor'],
    positions: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 1, 3, 2],
    difficulty: 'beginner',
    category: 'minor',
    notes: ['D', 'F', 'A'],
    tags: ['open-chord'],
    audioUrl: '/static/audio/chords/dm.mp3'
  }
];

const songSeed = [
  {
    title: 'Mua Tren Pho',
    slug: 'mua-tren-pho',
    artist: 'Demo Artist',
    originalKey: 'C',
    difficulty: 'beginner',
    genre: ['ballad'],
    tags: ['demo', 'acoustic'],
    chordsInOrder: ['C', 'G', 'Am', 'F'],
    lyrics: {
      sections: [
        {
          type: 'verse',
          name: 'Verse 1',
          lines: [
            {
              text: 'Mua roi khe ben them',
              chordsLine: '[C] [G] [Am] [F]',
              words: [],
              chords: [
                { chord: 'C', offset: 0 },
                { chord: 'G', offset: 1 },
                { chord: 'Am', offset: 2 },
                { chord: 'F', offset: 3 }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    title: 'Ngay Moi Len',
    slug: 'ngay-moi-len',
    artist: 'Demo Band',
    originalKey: 'G',
    difficulty: 'beginner',
    genre: ['pop'],
    tags: ['demo'],
    chordsInOrder: ['G', 'Dm', 'C', 'G'],
    lyrics: {
      sections: [
        {
          type: 'chorus',
          name: 'Chorus',
          lines: [
            {
              text: 'Ngay moi len tren doi',
              chordsLine: '[G] [Dm] [C] [G]',
              words: [],
              chords: [
                { chord: 'G', offset: 0 },
                { chord: 'Dm', offset: 1 },
                { chord: 'C', offset: 2 },
                { chord: 'G', offset: 3 }
              ]
            }
          ]
        }
      ]
    }
  }
];

async function seed() {
  const result = await prisma.user.findFirst({ where: { email: 'demo.seed@learn-guitar.local' } });
  if (result) {
    console.log('Seed already done or data exists. Skipping deletion to avoid transaction issues.');
  } else {
    const demoUser = await prisma.user.create({
      data: {
        name: 'Demo Seed User',
        email: 'demo.seed@learn-guitar.local',
        role: 'teacher',
        isActive: true,
        avatar: 'https://placehold.co/128x128'
      }
    });

    const chordIdByName = new Map();

    for (const chord of chordsSeed) {
      const savedChord = await prisma.chord.create({
        data: {
          ...chord,
          popularity: 0,
          usageCount: 0,
          isBarre: chord.tags.includes('barre')
        }
      });
      chordIdByName.set(savedChord.name, savedChord.id);
    }

    for (const song of songSeed) {
      const savedSong = await prisma.song.create({
        data: {
          title: song.title,
          slug: song.slug,
          artist: song.artist,
          originalKey: song.originalKey,
          difficulty: song.difficulty,
          genre: song.genre,
          tags: song.tags,
          lyrics: song.lyrics,
          isPublic: true,
          createdById: demoUser.id,
          capo: 0,
          timeSignature: '4/4'
        }
      });

      const usageData = song.chordsInOrder
        .map((chordName, index) => {
          const chordId = chordIdByName.get(chordName);
          if (!chordId) return null;
          return {
            songId: savedSong.id,
            chordId,
            positionInSong: index
          };
        })
        .filter(Boolean);

      if (usageData.length > 0) {
        for (const usage of usageData) {
          await prisma.songChordUsage.create({
            data: usage
          });
        }
      }
    }

    const allChords = await prisma.chord.findMany({ select: { id: true } });      
    for (const chord of allChords) {
      const usageCount = await prisma.songChordUsage.count({
        where: { chordId: chord.id }
      });
      await prisma.chord.update({
        where: { id: chord.id },
        data: {
          usageCount,
          popularity: usageCount
        }
      });
    }
    console.log('Seed completed successfully.');
  }
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
