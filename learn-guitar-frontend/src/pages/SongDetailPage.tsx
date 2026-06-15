import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import songService from '../features/song/song.service';
import type { SongDetail } from '../features/song/song.types';
import { useAuth } from '../context/useAuth';
import SongDetailSidebar from '../components/song/SongDetailSidebar';
import SongLyricsViewer from '../components/song/SongLyricsViewer';
import chordService from '../features/chord/chord.service';
import type { Chord } from '../features/chord/chord.types';
import ChordDiagram from '../components/chord/ChordDiagram';

export default function SongDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [song, setSong] = useState<SongDetail | null>(null);
  const [chords, setChords] = useState<Chord[]>([]);
  const [activeChord, setActiveChord] = useState<Chord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const loadSong = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [detail, usedChords] = await Promise.all([
          songService.getSongBySlug(slug),
          chordService.getSongChordsBySlug(slug),
        ]);
        if (!mounted) return;
        setSong(detail);
        setChords(usedChords);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không tải được bài hát.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSong();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const onDelete = async () => {
    if (!song) return;
    const ok = window.confirm('Bạn chắc chắn muốn xóa bài hát này?');
    if (!ok) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await songService.deleteSong(song.id);
      navigate('/songs');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xóa bài hát.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="song-detail-page">
      <div className="song-detail-page-inner">
        {isLoading ? (
          <div className="songs-loading">
            <div className="auth-loader" aria-hidden="true"></div>
            <p>Đang tải bài hát...</p>
          </div>
        ) : null}

        {!isLoading && errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {!isLoading && song ? (
          <>
            <div className="song-detail-hero">
              <div className="song-detail-hero-left">
                <p className="badge">Song Detail</p>
                <h1>{song.title}</h1>
                <p className="song-detail-hero-artist">{song.artist}</p>
              </div>
            </div>

            <div className="song-detail-grid">
              <SongDetailSidebar
                song={song}
                chords={chords}
                isAuthenticated={isAuthenticated}
                isDeleting={isDeleting}
                onDelete={onDelete}
                onPickChord={(chord) => setActiveChord(chord)}
              />

              <div className="song-detail-content">
                <SongLyricsViewer sections={song.sections} chords={chords} />
              </div>
            </div>

            {activeChord ? (
              <div
                className="chord-modal-overlay"
                onClick={() => setActiveChord(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Chi tiết hợp âm"
              >
                <div onClick={(event) => event.stopPropagation()} className="chord-modal-box">
                  <ChordDiagram
                    chordName={activeChord.displayName || activeChord.name}
                    positions={activeChord.positions}
                    fingers={activeChord.fingers}
                    audioUrl={activeChord.audioUrl}
                    size={240}
                  />
                  <button
                    type="button"
                    className="chord-modal-close"
                    onClick={() => setActiveChord(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
