import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import songService from '../features/song/song.service';
import type { SongPayload } from '../features/song/song.types';
import SongFormFields from '../components/song/SongFormFields';
import type { SongBaseFormValues } from '../components/song/songFormFields.types';

type LyricMode = 'with-chords' | 'without-chords';
type ChordInsertPosition = 'start' | 'before' | 'after' | 'end';

type SongCreateForm = SongBaseFormValues;

interface ChordPlacement {
  id: string;
  slot: number;
  chord: string;
}

interface ChordDraft {
  lineIndex: number;
  position: ChordInsertPosition;
  targetWordIndex: number;
  chord: string;
}

const initialForm: SongCreateForm = {
  title: '',
  artist: '',
  originalKey: 'C',
  capo: '0',
  tempo: '',
  timeSignature: '4/4',
  strummingPattern: '',
  difficulty: 'beginner',
  genre: '',
  tags: '',
  youtubeLink: '',
  image: '',
  isPublic: true,
  sectionType: 'verse',
  sectionName: 'Verse 1',
};

const toLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const wordsFromLine = (line: string) =>
  line
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

const splitTagInput = (value: string) =>
  value
    .replace(/,/g, '\n')
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const newPlacementId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function SongCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<SongCreateForm>(initialForm);
  const [lyricMode, setLyricMode] = useState<LyricMode>('with-chords');
  const [lyricsWithChords, setLyricsWithChords] = useState('');
  const [plainLyrics, setPlainLyrics] = useState('');
  const [placementsByLine, setPlacementsByLine] = useState<Record<number, ChordPlacement[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plainLines = useMemo(() => toLines(plainLyrics), [plainLyrics]);
  const lineWords = useMemo(() => plainLines.map((line) => wordsFromLine(line)), [plainLines]);

  const [chordDraft, setChordDraft] = useState<ChordDraft>({
    lineIndex: 0,
    position: 'start',
    targetWordIndex: 0,
    chord: '',
  });

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (name === 'isPublic') {
      const target = event.target as HTMLInputElement;
      setForm((prev) => ({ ...prev, isPublic: target.checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getChordSlot = (draft: ChordDraft): number => {
    const words = lineWords[draft.lineIndex] || [];

    if (draft.position === 'start') return 0;
    if (draft.position === 'end') return words.length;
    if (draft.position === 'before') return Math.min(Math.max(draft.targetWordIndex, 0), Math.max(words.length - 1, 0));
    return Math.min(Math.max(draft.targetWordIndex + 1, 0), words.length);
  };

  const addChordPlacement = () => {
    const chord = chordDraft.chord.trim();
    if (!chord) {
      setErrorMessage('Vui long nhap hop am truoc khi them.');
      return;
    }

    if (lineWords.length === 0) {
      setErrorMessage('Hay nhap lyric chua co hop am truoc.');
      return;
    }

    const slot = getChordSlot(chordDraft);
    const placement: ChordPlacement = {
      id: newPlacementId(),
      slot,
      chord,
    };

    setPlacementsByLine((prev) => {
      const linePlacements = prev[chordDraft.lineIndex] || [];
      return {
        ...prev,
        [chordDraft.lineIndex]: [...linePlacements, placement],
      };
    });

    setChordDraft((prev) => ({ ...prev, chord: '' }));
    setErrorMessage(null);
  };

  const clearLinePlacements = (lineIndex: number) => {
    setPlacementsByLine((prev) => ({
      ...prev,
      [lineIndex]: [],
    }));
  };

  const removePlacement = (lineIndex: number, placementId: string) => {
    setPlacementsByLine((prev) => ({
      ...prev,
      [lineIndex]: (prev[lineIndex] || []).filter((placement) => placement.id !== placementId),
    }));
  };

  const buildChordedLine = (lineIndex: number): string => {
    const words = lineWords[lineIndex] || [];
    const placements = [...(placementsByLine[lineIndex] || [])].sort((a, b) => a.slot - b.slot);

    const placementsBySlot: Record<number, string[]> = {};
    for (const placement of placements) {
      if (!placementsBySlot[placement.slot]) {
        placementsBySlot[placement.slot] = [];
      }
      placementsBySlot[placement.slot].push(placement.chord);
    }

    const tokens: string[] = [];
    for (let slot = 0; slot <= words.length; slot += 1) {
      const slotChords = placementsBySlot[slot] || [];
      if (slotChords.length > 0) {
        tokens.push(...slotChords);
      }

      if (slot < words.length) {
        tokens.push(words[slot]);
      }
    }

    return tokens.join(' ').trim();
  };

  const buildPayload = (): SongPayload => {
    const capoNumber = Number(form.capo || '0');
    const tempoNumber = form.tempo ? Number(form.tempo) : undefined;

    if (!form.title.trim() || !form.artist.trim() || !form.originalKey.trim()) {
      throw new Error('Title, artist va original key la bat buoc.');
    }

    if (Number.isNaN(capoNumber) || capoNumber < 0 || capoNumber > 12) {
      throw new Error('Capo phai la so tu 0 den 12.');
    }

    if (tempoNumber !== undefined && Number.isNaN(tempoNumber)) {
      throw new Error('Tempo khong hop le.');
    }

    const sectionLines = lyricMode === 'with-chords'
      ? toLines(lyricsWithChords).map((line) => ({ text: line }))
      : plainLines.map((line, lineIndex) => {
          const chordsLine = buildChordedLine(lineIndex);
          return {
            text: line,
            chordsLine: chordsLine.length > 0 ? chordsLine : undefined,
          };
        });

    if (sectionLines.length === 0) {
      throw new Error('Can it nhat mot dong lyric de tao bai hat.');
    }

    return {
      title: form.title.trim(),
      artist: form.artist.trim(),
      originalKey: form.originalKey.trim(),
      capo: capoNumber,
      tempo: tempoNumber,
      timeSignature: form.timeSignature.trim() || '4/4',
      strummingPattern: form.strummingPattern.trim(),
      difficulty: form.difficulty,
      genre: splitTagInput(form.genre),
      tags: splitTagInput(form.tags),
      youtubeLink: form.youtubeLink.trim(),
      image: form.image.trim(),
      isPublic: form.isPublic,
      sections: [
        {
          type: form.sectionType,
          name: form.sectionName.trim() || 'Main',
          lines: sectionLines,
        },
      ],
    };
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = buildPayload();
      const result = await songService.createSong(payload);
      navigate(`/songs/${result.slug}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the tao bai hat.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="song-create-layout">
      <section className="song-create-shell">
        <div className="song-editor-header">
          <div>
            <p className="badge">New Song</p>
            <h1>Them moi bai hat</h1>
            <p className="songs-subtitle">Chon workflow lyric co hop am san hoac lyric chua co hop am.</p>
          </div>

          <div className="songs-header-actions">
            <Link to="/songs" className="ghost-btn">Danh sach</Link>
          </div>
        </div>

        <form className="song-editor-form" onSubmit={onSubmit}>
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <SongFormFields form={form} onChange={onChange} />

          <div className="song-create-mode-switch" role="group" aria-label="Lyric mode">
            <button
              type="button"
              className={`ghost-btn ${lyricMode === 'with-chords' ? 'is-active' : ''}`}
              onClick={() => setLyricMode('with-chords')}
            >
              Lyric da co hop am
            </button>

            <button
              type="button"
              className={`ghost-btn ${lyricMode === 'without-chords' ? 'is-active' : ''}`}
              onClick={() => setLyricMode('without-chords')}
            >
              Lyric chua co hop am
            </button>
          </div>

          {lyricMode === 'with-chords' ? (
            <label>
              Lyric da co hop am (backend se tu parse)
              <textarea
                value={lyricsWithChords}
                onChange={(event) => setLyricsWithChords(event.target.value)}
                rows={12}
                placeholder="[C] Em oi Ha Noi pho\n[G] Ta con em mui hoang lan"
              />
            </label>
          ) : (
            <div className="song-create-builder">
              <label>
                Lyric chua co hop am (moi dong la mot cau)
                <textarea
                  value={plainLyrics}
                  onChange={(event) => setPlainLyrics(event.target.value)}
                  rows={10}
                  placeholder="Em oi Ha Noi pho\nTa con em mui hoang lan"
                />
              </label>

              <div className="song-create-chord-panel">
                <h3>Them hop am vao lyric</h3>

                <div className="song-create-chord-controls">
                  <label>
                    Dong lyric
                    <select
                      value={chordDraft.lineIndex}
                      onChange={(event) => setChordDraft((prev) => ({ ...prev, lineIndex: Number(event.target.value) }))}
                      disabled={lineWords.length === 0}
                    >
                      {lineWords.length === 0 ? <option value={0}>Chua co dong lyric</option> : null}
                      {lineWords.map((_, lineIndex) => (
                        <option key={lineIndex} value={lineIndex}>Dong {lineIndex + 1}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Vi tri chen hop am
                    <select
                      value={chordDraft.position}
                      onChange={(event) => setChordDraft((prev) => ({ ...prev, position: event.target.value as ChordInsertPosition }))}
                    >
                      <option value="start">Dau dong</option>
                      <option value="before">Truoc tu</option>
                      <option value="after">Sau tu</option>
                      <option value="end">Cuoi dong</option>
                    </select>
                  </label>

                  {(chordDraft.position === 'before' || chordDraft.position === 'after') ? (
                    <label>
                      Tu muc tieu
                      <select
                        value={chordDraft.targetWordIndex}
                        onChange={(event) => setChordDraft((prev) => ({ ...prev, targetWordIndex: Number(event.target.value) }))}
                        disabled={(lineWords[chordDraft.lineIndex] || []).length === 0}
                      >
                        {(lineWords[chordDraft.lineIndex] || []).map((word, wordIndex) => (
                          <option key={`${word}-${wordIndex}`} value={wordIndex}>
                            {wordIndex + 1}. {word}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label>
                    Hop am
                    <input
                      value={chordDraft.chord}
                      onChange={(event) => setChordDraft((prev) => ({ ...prev, chord: event.target.value }))}
                      placeholder="Am, C, D/F#..."
                    />
                  </label>
                </div>

                <button type="button" className="primary-btn" onClick={addChordPlacement}>Them hop am</button>
              </div>

              {plainLines.length > 0 ? (
                <div className="song-create-preview-list">
                  <h3>Preview lyric + hop am</h3>
                  {plainLines.map((line, lineIndex) => (
                    <article key={`${line}-${lineIndex}`} className="song-line">
                      <p className="song-create-line-title">Dong {lineIndex + 1}</p>
                      <p className="song-line-lyrics">Lyric: {line}</p>
                      <p className="song-line-lyrics">Da chen: {buildChordedLine(lineIndex) || '(chua co hop am)'}</p>

                      {(placementsByLine[lineIndex] || []).length > 0 ? (
                        <div className="song-chords-legend">
                          {(placementsByLine[lineIndex] || []).map((placement) => (
                            <button
                              key={placement.id}
                              type="button"
                              className="chord-pill song-create-remove-pill"
                              onClick={() => removePlacement(lineIndex, placement.id)}
                            >
                              {placement.chord} xoa
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {(placementsByLine[lineIndex] || []).length > 0 ? (
                        <button
                          type="button"
                          className="ghost-btn song-create-clear-line"
                          onClick={() => clearLinePlacements(lineIndex)}
                        >
                          Xoa het hop am dong nay
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="song-editor-actions">
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Dang tao...' : 'Tao bai hat'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
