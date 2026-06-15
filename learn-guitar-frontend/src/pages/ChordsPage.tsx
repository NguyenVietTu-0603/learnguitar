import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ChordDiagram from '../components/chord/ChordDiagram';
import InteractiveFretboard from '../components/chord/InteractiveFretboard';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import chordService from '../features/chord/chord.service';
import type { Chord, ChordCategory, ChordDifficulty, PaginationMeta } from '../features/chord/chord.types';

export default function ChordsPage() {
  const [chords, setChords] = useState<Chord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [difficultyInput, setDifficultyInput] = useState<ChordDifficulty | ''>('');
  const [categoryInput, setCategoryInput] = useState<ChordCategory | ''>('');

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<ChordDifficulty | ''>('');
  const [category, setCategory] = useState<ChordCategory | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const loadChords = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await chordService.getChords({
          page,
          limit: 18,
          search,
          difficulty,
          category,
        });

        if (!mounted) return;
        setChords(result.chords);
        setPagination(result.pagination);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải thư viện hợp âm.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadChords();

    return () => {
      mounted = false;
    };
  }, [category, difficulty, page, search]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setDifficulty(difficultyInput);
    setCategory(categoryInput);
  };

  const onReset = () => {
    setSearchInput('');
    setDifficultyInput('');
    setCategoryInput('');
    setSearch('');
    setDifficulty('');
    setCategory('');
    setPage(1);
  };

  const subtitle = useMemo(() => {
    if (!pagination) return 'Thư viện hợp âm guitar có bộ lọc thông minh và sơ đồ ngón bấm trực quan.';
    return `Tổng cộng ${pagination.total} hợp âm`;
  }, [pagination]);

  const previewChord = chords[0];

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Thư viện hợp âm</p>
          <h1>Hợp âm Guitar</h1>
          <p>{subtitle}</p>
        </Reveal>

        <Reveal delay={80}>
          <form onSubmit={onSubmit} className="tab-toolbar">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm hợp âm theo tên"
              className="form-input"
            />

            <select
              value={difficultyInput}
              onChange={(event) => setDifficultyInput(event.target.value as ChordDifficulty | '')}
              className="form-input"
            >
              <option value="">Tất cả độ khó</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung bình</option>
              <option value="advanced">Nâng cao</option>
            </select>

            <select
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value as ChordCategory | '')}
              className="form-input"
            >
              <option value="">Tất cả nhóm hợp âm</option>
              <option value="major">Trưởng</option>
              <option value="minor">Thứ</option>
              <option value="seventh">Seventh</option>
              <option value="suspended">Suspended</option>
              <option value="diminished">Diminished</option>
              <option value="augmented">Augmented</option>
              <option value="extended">Extended</option>
              <option value="other">Khác</option>
            </select>

            <div className="stack-actions">
              <button type="submit" className="app-btn app-btn-primary">
                Lọc
              </button>
              <button type="button" onClick={onReset} className="app-btn app-btn-ghost">
                Đặt lại
              </button>
            </div>
          </form>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {isLoading ? (
          <p className="loading-wrap">Đang tải thư viện hợp âm...</p>
        ) : (
          <>
            {previewChord ? (
              <Reveal>
                <div className="feature-grid" style={{ marginBottom: '16px' }}>
                  <AppCard>
                    <ChordDiagram
                      chordName={previewChord.displayName || previewChord.name}
                      positions={previewChord.positions}
                      fingers={previewChord.fingers}
                      audioUrl={previewChord.audioUrl}
                      size={250}
                    />
                  </AppCard>

                  <InteractiveFretboard highlightedNotes={previewChord.notes} />

                  <AppCard>
                    <h3>Mẹo luyện nhanh</h3>
                    <ul>
                      <li>Bắt đầu với tempo chậm và tập chính xác vị trí ngón trước.</li>
                      <li>Tách riêng từng cặp hợp âm khó để luyện chuyển mượt.</li>
                      <li>Ghi âm 30 giây cuối buổi để nghe lại độ sạch tiếng đàn.</li>
                    </ul>
                  </AppCard>
                </div>
              </Reveal>
            ) : null}

            <div className="list-grid">
              {chords.map((chord) => (
                <AppCard key={chord.id}>
                  <p className="section-kicker">{chord.category}</p>
                  <h3>{chord.displayName || chord.name}</h3>
                  <p>Độ khó: {chord.difficulty}</p>
                  <div className="hero-actions">
                    <Link to={`/chords/${chord.slug}`} className="app-btn app-btn-primary">
                      Xem chi tiết
                    </Link>
                    <Link to="/thuc-hanh" className="app-btn app-btn-ghost">
                      Luyện ngay
                    </Link>
                  </div>
                </AppCard>
              ))}
            </div>

            {pagination && pagination.pages > 1 ? (
              <div className="pagination-wrap">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="app-btn app-btn-ghost"
                >
                  Trang trước
                </button>
                <span>Trang {page}/{pagination.pages}</span>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
                  className="app-btn app-btn-ghost"
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
