import type { SongChord, SongSection } from '../../features/song/song.types';

const buildLyricsWithChordsBySyllable = (text: string, chords: SongChord[]) => {
  if (!chords || chords.length === 0) return text;

  const syllables = text.trim().split(/\s+/);
  const sortedChords = [...chords].sort((a, b) => a.offset - b.offset);
  const result: string[] = [...syllables];

  for (const { offset, chord: chordName } of sortedChords) {
    if (offset >= 0 && offset < syllables.length) {
      result[offset] = `[${chordName}] ${result[offset]}`;
    }
  }

  return result.join(' ');
};

interface SongDetailSectionsProps {
  sections: SongSection[];
}

export default function SongDetailSections({ sections }: SongDetailSectionsProps) {
  return (
    <div className="song-detail-lyrics-scroll">
      {sections.map((section, sectionIndex) => (
        <section key={`${section.name}-${sectionIndex}`} className="song-section">
          <h3>{section.name}</h3>
          <p className="song-section-type">{section.type}</p>

          <div className="song-lines">
            {section.lines.map((line, lineIndex) => (
              <article key={`${sectionIndex}-${lineIndex}`} className="song-line">
                <pre className="song-line-lyrics">
                  {buildLyricsWithChordsBySyllable(line.text, line.chords)}
                </pre>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
