import { useMemo } from 'react';

import type { Chord } from '../../features/chord/chord.types';
import type { SongChord, SongSection } from '../../features/song/song.types';

interface SongLyricsViewerProps {
  sections: SongSection[];
  chords: Chord[];
}

interface RenderToken {
  type: 'chord' | 'word';
  value: string;
}

const buildTokens = (text: string, chords: SongChord[]): RenderToken[] => {
  const syllables = text.trim().split(/\s+/).filter(Boolean);
  if (syllables.length === 0) return [];

  const grouped = new Map<number, string[]>();
  (chords || []).forEach((item) => {
    if (!grouped.has(item.offset)) {
      grouped.set(item.offset, []);
    }
    grouped.get(item.offset)?.push(item.chord);
  });

  const tokens: RenderToken[] = [];
  syllables.forEach((word, index) => {
    const chordTokens = grouped.get(index) || [];
    chordTokens.forEach((chordName) => {
      tokens.push({ type: 'chord', value: chordName });
    });
    tokens.push({ type: 'word', value: word });
  });

  return tokens;
};

export default function SongLyricsViewer({ sections, chords }: SongLyricsViewerProps) {
  const chordLookup = useMemo(() => {
    void chords;
    return new Map<string, Chord>();
  }, [chords]);
  void chordLookup;

  return (
    <div className="song-lyrics-wrapper">
      {sections.map((section, sectionIndex) => (
        <section key={`${section.name}-${sectionIndex}`} className="song-section">
          <h3>{section.name}</h3>
          <p className="song-section-type">{section.type}</p>

          <div className="song-lines">
            {section.lines.map((line, lineIndex) => {
              const tokens = buildTokens(line.text, line.chords || []);
              return (
                <div key={`${sectionIndex}-${lineIndex}`} className="song-line">
                  {tokens.map((token, tokenIndex) => {
                    if (token.type === 'chord') {
                      return (
                        <button
                          key={`${sectionIndex}-${lineIndex}-${tokenIndex}`}
                          type="button"
                          className="song-line-chord"
                        >
                          {token.value}
                        </button>
                      );
                    }

                    return (
                      <span key={`${sectionIndex}-${lineIndex}-${tokenIndex}`} className="song-line-word">
                        {token.value}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
