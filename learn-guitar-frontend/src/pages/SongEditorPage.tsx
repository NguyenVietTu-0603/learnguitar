import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import songService from '../features/song/song.service';
import type { SongDetail, SongPayload, SongSectionInput } from '../features/song/song.types';
import SongFormFields from '../components/song/SongFormFields';
import type { SongBaseFormValues } from '../components/song/songFormFields.types';

interface SongEditorForm extends SongBaseFormValues {
  lyricsText: string;
  chordsText: string;
}

const initialForm: SongEditorForm = {
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
  lyricsText: '',
  chordsText: '',
};

const toCommaLine = (values: string[] = []) => values.join(', ');

const toLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const chordsFromLine = (songLine: SongDetail['sections'][number]['lines'][number]) => {
  if (!songLine.chords || songLine.chords.length === 0) return '';
  return songLine.chords.map((item) => item.chord).join(' ');
};

export default function SongEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(slug);

  const [form, setForm] = useState<SongEditorForm>(initialForm);
  const [songId, setSongId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !slug) return;

    let mounted = true;

    const loadSong = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const song = await songService.getSongBySlug(slug);
        if (!mounted) return;

        const firstSection = song.sections[0];
        const lyricLines = firstSection ? firstSection.lines.map((line) => line.text).join('\n') : '';
        const chordLines = firstSection ? firstSection.lines.map((line) => chordsFromLine(line)).join('\n') : '';

        setSongId(song.id);
        setForm({
          title: song.title,
          artist: song.artist,
          originalKey: song.originalKey,
          capo: String(song.capo ?? 0),
          tempo: song.tempo ? String(song.tempo) : '',
          timeSignature: song.timeSignature || '4/4',
          strummingPattern: song.strummingPattern || '',
          difficulty: song.difficulty,
          genre: toCommaLine(song.genre),
          tags: toCommaLine(song.tags),
          youtubeLink: song.youtubeLink || '',
          image: song.image || '',
          isPublic: song.isPublic,
          sectionType: firstSection?.type || 'verse',
          sectionName: firstSection?.name || 'Main',
          lyricsText: lyricLines,
          chordsText: chordLines,
        });
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Khong tai duoc bai hat de chinh sua.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSong();

    return () => {
      mounted = false;
    };
  }, [isEditMode, slug]);

  const title = useMemo(() => (isEditMode ? 'Chinh sua bai hat' : 'Tao bai hat moi'), [isEditMode]);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    if (name === 'isPublic') {
      const target = event.target as HTMLInputElement;
      setForm((prev) => ({ ...prev, isPublic: target.checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = (): SongPayload => {
    const lyricsLines = toLines(form.lyricsText);
    const chordsLines = toLines(form.chordsText);

    if (lyricsLines.length === 0) {
      throw new Error('Can it nhat mot dong loi bai hat.');
    }

    const section: SongSectionInput = {
      type: form.sectionType,
      name: form.sectionName.trim() || 'Main',
      lines: lyricsLines.map((line, index) => ({
        text: line,
        chordsLine: chordsLines[index] || '',
      })),
    };

    const tempoNumber = form.tempo ? Number(form.tempo) : null;
    const capoNumber = Number(form.capo || '0');

    if (Number.isNaN(capoNumber) || capoNumber < 0 || capoNumber > 12) {
      throw new Error('Capo phai la so tu 0 den 12.');
    }

    if (tempoNumber !== null && Number.isNaN(tempoNumber)) {
      throw new Error('Tempo khong hop le.');
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
      genre: toLines(form.genre.replace(/,/g, '\n')),
      tags: toLines(form.tags.replace(/,/g, '\n')),
      youtubeLink: form.youtubeLink.trim(),
      image: form.image.trim(),
      isPublic: form.isPublic,
      sections: [section],
    };
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (!form.title.trim() || !form.artist.trim() || !form.originalKey.trim()) {
        throw new Error('Title, artist va original key la bat buoc.');
      }

      const payload = buildPayload();
      const result = isEditMode
        ? await songService.updateSong(songId || '', payload)
        : await songService.createSong(payload);

      navigate(`/songs/${result.slug}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the luu bai hat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="song-editor-layout">
      <section className="song-editor-shell">
        <div className="song-editor-header">
          <div>
            <p className="badge">Song Editor</p>
            <h1>{title}</h1>
            <p className="songs-subtitle">Nhap thong tin bai hat, loi va hop am.</p>
          </div>

          <div className="songs-header-actions">
            <Link to="/songs" className="ghost-btn">Danh sach</Link>
          </div>
        </div>

        {isLoading ? (
          <div className="songs-loading">
            <div className="auth-loader" aria-hidden="true"></div>
            <p>Dang tai du lieu bai hat...</p>
          </div>
        ) : (
          <form className="song-editor-form" onSubmit={onSubmit}>
            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <SongFormFields form={form} onChange={onChange} />

            <div className="song-editor-textareas">
              <label>
                Lyrics (moi dong la mot cau)
                <textarea
                  name="lyricsText"
                  value={form.lyricsText}
                  onChange={onChange}
                  rows={8}
                  placeholder="Em oi Ha Noi pho\nTa con em mui hoang lan"
                />
              </label>

              <label>
                Chords Line (moi dong ung voi lyrics ben trai)
                <textarea
                  name="chordsText"
                  value={form.chordsText}
                  onChange={onChange}
                  rows={8}
                  placeholder="C G Am F\nDm G C C"
                />
              </label>
            </div>

            <div className="song-editor-actions">
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Dang luu...' : isEditMode ? 'Cap nhat bai hat' : 'Tao bai hat'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
