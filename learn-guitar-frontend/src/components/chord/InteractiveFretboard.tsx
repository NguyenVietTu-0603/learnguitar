import { useMemo, useState } from 'react';

const NOTE_MATRIX = [
  ['E', 'F', 'F#', 'G', 'G#', 'A'],
  ['B', 'C', 'C#', 'D', 'D#', 'E'],
  ['G', 'G#', 'A', 'A#', 'B', 'C'],
  ['D', 'D#', 'E', 'F', 'F#', 'G'],
  ['A', 'A#', 'B', 'C', 'C#', 'D'],
  ['E', 'F', 'F#', 'G', 'G#', 'A'],
];

interface InteractiveFretboardProps {
  highlightedNotes?: string[];
}

export default function InteractiveFretboard({ highlightedNotes = ['C', 'E', 'G'] }: InteractiveFretboardProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const normalized = useMemo(() => highlightedNotes.map((note) => note.toUpperCase()), [highlightedNotes]);

  return (
    <section className="fretboard-card">
      <header>
        <h3>Fretboard tương tác</h3>
        <p>Chạm vào từng nốt để ghi nhớ vị trí và tai nghe của bạn sẽ quen dần với âm sắc.</p>
      </header>
      <div className="fretboard-grid">
        {NOTE_MATRIX.map((stringNotes, stringIndex) =>
          stringNotes.map((note, fretIndex) => {
            const isHighlighted = normalized.includes(note.toUpperCase());
            const isActive = activeNote === `${stringIndex}-${fretIndex}`;
            return (
              <button
                type="button"
                key={`${stringIndex}-${fretIndex}`}
                className={`fret-note ${isHighlighted ? 'fret-note-highlight' : ''} ${isActive ? 'fret-note-active' : ''}`.trim()}
                onClick={() => setActiveNote(`${stringIndex}-${fretIndex}`)}
              >
                <span className="fret-note-label">{note}</span>
                <small>Dây {6 - stringIndex} · Ngăn {fretIndex}</small>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
