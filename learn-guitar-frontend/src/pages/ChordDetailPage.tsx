import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import ChordDiagram from '../components/chord/ChordDiagram';
import chordService from '../features/chord/chord.service';
import type { Chord, ChordSongItem, PaginationMeta } from '../features/chord/chord.types';
import '../styles/chord-detail-page.css';

export default function ChordDetailPage() {
  const { slug } = useParams();
  const [chord, setChord] = useState<Chord | null>(null);
  const [songs, setSongs] = useState<ChordSongItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [chordDetail, songsResult] = await Promise.all([
          chordService.getChordBySlug(slug),
          chordService.getSongsByChordSlug(slug),
        ]);

        if (!mounted) return;
        setChord(chordDetail);
        setSongs(songsResult.songs);
        setPagination(songsResult.pagination);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không tải được thông tin hợp âm.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return <main className="chord-detail-state">Đang tải thông tin hợp âm...</main>;
  }

  if (errorMessage || !chord) {
    return <main className="chord-detail-state chord-detail-state-error">{errorMessage || 'Không tìm thấy hợp âm.'}</main>;
  }

  return (
    <main className="chord-detail-page">
      <section className="chord-detail-shell">
        <aside className="chord-detail-sidebar">
          <Link to="/chords" className="chord-detail-back-link">
            Quay lại danh sách
          </Link>

          <ChordDiagram
            chordName={chord.displayName || chord.name}
            positions={chord.positions}
            fingers={chord.fingers}
            audioUrl={chord.audioUrl}
            size={320}
          />

          <div className="chord-detail-meta-box">
            <p>Độ khó: <strong>{chord.difficulty}</strong></p>
            <p>Nhóm hợp âm: <strong>{chord.category}</strong></p>
            {/* <p>Âm thanh mẫu: {chord.audioUrl || 'Chưa có'}</p> */}
          </div>
        </aside>

        <section className="chord-detail-content">
          <h1>{chord.displayName || chord.name}</h1>
          <p className="chord-detail-subtitle">Các bài hát đang sử dụng hợp âm này</p>

          <div className="chord-detail-song-list">
            {songs.length === 0 ? (
              <p className="chord-detail-empty">
                Chưa có bài hát nào sử dụng hợp âm này.
              </p>
            ) : (
              songs.map((song) => (
                <article key={song.id} className="chord-detail-song-card">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                  <Link to={`/songs/${song.slug}`} className="chord-detail-song-link">
                    Xem bài hát
                  </Link>
                </article>
              ))
            )}
          </div>

          {pagination ? (
            <p className="chord-detail-count">
              Hiển thị {songs.length} / {pagination.total} bài hát
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
