import { useEffect, useMemo, useState } from 'react';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';
import courseService from '../features/course/course.service';
import type { CourseListItem } from '../features/course/course.types';

const highlights = [
  {
    title: 'Lộ trình học rõ ràng',
    text: 'Từ người mới đến đệm hát tự tin qua các chặng nhỏ, có kiểm tra và gợi ý tự động.',
  },
  {
    title: 'Hợp âm và tab trực quan',
    text: 'Sơ đồ ngón bấm, tab nhạc và nhịp điệu được trình bày gọn gàng, dễ đọc trên cả điện thoại.',
  },
  {
    title: 'Thực hành có động lực',
    text: 'Streak, huy hiệu và tiến độ giúp bạn giữ thói quen luyện đàn mà không bị áp lực.',
  },
];

const journey = [
  'Bắt đầu với hợp âm mở và cách cầm đàn đúng tư thế',
  'Chuyển hợp âm mượt với bài tập nhịp chậm',
  'Đệm hát bài Việt quen thuộc với tiết tấu dễ nhớ',
  'Nâng cấp kỹ thuật tay phải và cảm âm trong thực tế',
];

export default function HomePage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadHomeCourses = async () => {
      try {
        const result = await courseService.getCourses({ page: 1, limit: 6 });
        if (!mounted) return;
        setCourses(result.courses);
      } catch {
        if (!mounted) return;
        setCourses([]);
      }
    };

    loadHomeCourses();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredCourse = courses[0] ?? null;
  const quickCourses = useMemo(() => courses.slice(0, 3), [courses]);

  return (
    <main className="app-page">
      <section className="site-container hero-section">
        <div className="hero-panel">
          <Reveal className="hero-copy">
            <p className="section-kicker">Nền tảng học guitar trực tuyến</p>
            <h1>Học guitar mỗi ngày với cảm hứng ấm áp và lộ trình rõ ràng</h1>
            <p>
              GuitarVN giúp bạn luyện tập đúng cách, cảm nhịp tốt hơn và chơi được những bài hát yêu thích
              bằng phương pháp thực tế, dễ bám theo.
            </p>

            <div className="hero-actions">
              <AppButton to={featuredCourse ? `/khoa-hoc/${featuredCourse.slug}` : '/khoa-hoc'}>
                {featuredCourse ? `Bắt đầu với ${featuredCourse.title}` : 'Khám phá khóa học'}
              </AppButton>
              <AppButton to="/tab-nhac" variant="ghost">
                Xem thư viện tab nhạc
              </AppButton>
            </div>

            <div className="hero-metrics">
              <article>
                <strong>{courses.length || '0'}</strong>
                <span>Khóa học công khai</span>
              </article>
              <article>
                <strong>{quickCourses.length || '0'}</strong>
                <span>Khóa học nổi bật đang hiển thị</span>
              </article>
              <article>
                <strong>{featuredCourse?.level || 'N/A'}</strong>
                <span>Trình độ của khóa học đề xuất</span>
              </article>
            </div>
          </Reveal>

          <Reveal className="hero-visual" delay={140}>
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80"
              alt="Người chơi guitar acoustic trong không gian ấm áp"
            />
            <div className="hero-floating-note">
              <strong>Phiên học hôm nay</strong>
              <p>20 phút luyện hợp âm · 10 phút đệm hát · 5 phút nghe lại và tinh chỉnh</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-container page-block">
        {quickCourses.length > 0 ? (
          <>
            <Reveal>
              <p className="section-kicker">Khóa học mới nhất</p>
              <h2>Gợi ý từ dữ liệu thật của hệ thống</h2>
            </Reveal>
            <div className="course-catalog-grid">
              {quickCourses.map((course, index) => (
                <Reveal key={course.id} delay={index * 60}>
                  <AppCard className="course-catalog-card">
                    <p className="section-kicker">{course.level}</p>
                    <h3>{course.title}</h3>
                    <p>{course.description || 'Lộ trình được chia bài ngắn, bám sát kỹ năng thực hành.'}</p>
                    <AppButton to={`/khoa-hoc/${course.slug}`}>Xem khóa học</AppButton>
                  </AppCard>
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        <Reveal>
          <p className="section-kicker">Điểm nổi bật</p>
          <h2>Thiết kế để học lâu dài, không quá tải</h2>
        </Reveal>
        <div className="feature-grid">
          {highlights.map((item, index) => (
            <Reveal key={item.title} delay={index * 80}>
              <AppCard>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </AppCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Lộ trình học đề xuất</p>
          <h2>4 bước để bạn chơi tự tin một bản nhạc trọn vẹn</h2>
        </Reveal>

        <div className="feature-grid">
          {journey.map((step, index) => (
            <Reveal key={step} delay={index * 80}>
              <AppCard>
                <p className="section-kicker">Bước {index + 1}</p>
                <p>{step}</p>
              </AppCard>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
