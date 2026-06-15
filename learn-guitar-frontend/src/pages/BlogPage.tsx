import AppCard from '../components/common/AppCard';
import Reveal from '../components/common/Reveal';

const posts = [
  {
    title: 'Cách chọn dây đàn phù hợp cho người mới',
    excerpt: 'So sánh dây phosphor bronze, 80/20 và mẹo thay dây để giữ âm ấm tự nhiên.',
  },
  {
    title: '5 bài hát Việt dễ đệm cho cuối tuần',
    excerpt: 'Danh sách tab và tiết tấu gợi ý để luyện đều tay mà vẫn thư giãn.',
  },
  {
    title: 'Mẹo giữ tay trái không bị mỏi khi bấm barre',
    excerpt: 'Kỹ thuật đặt ngón cái, chia lực và tối ưu tư thế cổ tay cho buổi tập dài.',
  },
];

export default function BlogPage() {
  return (
    <main className="app-page">
      <section className="site-container page-block">
        <Reveal>
          <p className="section-kicker">Blog GuitarVN</p>
          <h1>Kiến thức guitar thực tế, dễ áp dụng mỗi ngày</h1>
          <p>Tổng hợp mẹo học đàn, bảo quản nhạc cụ và cảm hứng âm nhạc dành cho cộng đồng học viên.</p>
        </Reveal>

        <div className="feature-grid">
          {posts.map((post, index) => (
            <Reveal key={post.title} delay={index * 80}>
              <AppCard>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </AppCard>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
