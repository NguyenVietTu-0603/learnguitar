import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import songService from '../features/song/song.service';
import type { SongDifficulty, SongListItem, SongPagination } from '../features/song/song.types';
import { useAuth } from '../context/useAuth';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';

export default function SongsPage() {
  const { isAuthenticated } = useAuth();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [pagination, setPagination] = useState<SongPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [difficultyInput, setDifficultyInput] = useState<SongDifficulty | ''>('');
  const [genreInput, setGenreInput] = useState('');

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<SongDifficulty | ''>('');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const loadSongs = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await songService.getSongs({
          page,
          limit: 9,
          search,
          difficulty,
          genre,
        });

        if (!mounted) return;
        setSongs(result.songs);
        setPagination(result.pagination);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không thể tải thư viện tab nhạc.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSongs();

    return () => {
      mounted = false;
    };
  }, [page, search, difficulty, genre]);

  const onApplyFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setDifficulty(difficultyInput);
    setGenre(genreInput.trim());
  };

  const onResetFilter = () => {
    setSearchInput('');
    setDifficultyInput('');
    setGenreInput('');
    setSearch('');
    setDifficulty('');
    setGenre('');
    setPage(1);
  };

  const subtitle = useMemo(() => {
    if (!pagination) return 'Kho tab và sheet nhạc guitar với hợp âm, tiết tấu và gợi ý tập luyện.';
    return `Tổng cộng ${pagination.total} bản tab và sheet nhạc`;
  }, [pagination]);

  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Thư viện tab và sheet nhạc</p>
          <h1>Tab Nhạc Guitar</h1>
          <p>{subtitle}</p>
        </Reveal>

        <Reveal delay={80}>
          <form className="tab-toolbar" onSubmit={onApplyFilter}>
            <input
              className="form-input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên bài hát hoặc ca sĩ"
            />

            <select
              className="form-input"
              value={difficultyInput}
              onChange={(event) => setDifficultyInput(event.target.value as SongDifficulty | '')}
            >
              <option value="">Tất cả độ khó</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung bình</option>
              <option value="advanced">Nâng cao</option>
            </select>

            <input
              className="form-input"
              value={genreInput}
              onChange={(event) => setGenreInput(event.target.value)}
              placeholder="Thể loại: ballad, pop, acoustic"
            />

            <div className="stack-actions">
              <button type="submit" className="app-btn app-btn-primary">Lọc</button>
              <button type="button" className="app-btn app-btn-ghost" onClick={onResetFilter}>Đặt lại</button>
            </div>
          </form>
        </Reveal>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {isLoading ? (
          <div className="loading-wrap">
            <div className="auth-loader" aria-hidden="true"></div>
            <p>Đang tải thư viện tab nhạc...</p>
          </div>
        ) : (
          <>
            {songs.length === 0 ? (
              <AppCard>
                <h3>Chưa có bản tab phù hợp</h3>
                <p>Hãy thử thay đổi từ khóa hoặc bộ lọc để xem nhiều kết quả hơn.</p>
              </AppCard>
            ) : (
              <div className="list-grid">
                {songs.map((song, index) => (
                  <Reveal key={song.id} delay={index * 40}>
                    <AppCard>
                      <p className="section-kicker">{song.artist}</p>
                      <h3>{song.title}</h3>
                      <div className="list-card-meta">
                        <span>Tông: {song.originalKey}</span>
                        <span>Độ khó: {song.difficulty}</span>
                        <span>{song.views} lượt xem</span>
                      </div>
                      <div className="hero-actions">
                        <Link to={`/songs/${song.slug}`} className="app-btn app-btn-primary">
                          Xem chi tiết
                        </Link>
                        {isAuthenticated ? (
                          <Link to={`/songs/${song.slug}/edit`} className="app-btn app-btn-ghost">
                            Chỉnh sửa
                          </Link>
                        ) : null}
                      </div>
                    </AppCard>
                  </Reveal>
                ))}
              </div>
            )}

            {pagination && pagination.pages > 1 ? (
              <div className="pagination-wrap">
                <button
                  type="button"
                  className="app-btn app-btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Trang trước
                </button>

                <span>
                  Trang {page}/{pagination.pages}
                </span>

                <button
                  type="button"
                  className="app-btn app-btn-ghost"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
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
