/**
 * Seed script: tạo dữ liệu mẫu cho Video Lessons và Text Quizzes
 * Chạy: node scripts/seed_video_lessons.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ─── Models ───────────────────────────────────────────────────────────────────
const courseSchema = new mongoose.Schema({ slug: String, title: String, description: String, level: String, thumbnailUrl: String, isPublished: Boolean, order: Number }, { timestamps: true });
const moduleSchema = new mongoose.Schema({ courseId: mongoose.Schema.Types.ObjectId, title: String, description: String, order: Number }, { timestamps: true });
const lessonSchema = new mongoose.Schema({ courseId: mongoose.Schema.Types.ObjectId, moduleId: mongoose.Schema.Types.ObjectId, slug: String, title: String, summary: String, lessonType: String, level: String, videoUrlHls: String, videoThumbnailUrl: String, durationSec: Number, tags: [String], isPublished: Boolean, order: Number }, { timestamps: true });
const textQuizSchema = new mongoose.Schema({
  slug: { type: String, unique: true }, title: String, description: String, level: String, coverImageUrl: String, isPublished: Boolean,
  questions: [{ prompt: String, options: [String], correctIndex: Number, explanation: String }]
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
const CourseModule = mongoose.model('CourseModule', moduleSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);
const TextQuiz = mongoose.model('TextQuiz', textQuizSchema);

// ─── Video URL ─────────────────────────────────────────────────────────────────
const VIDEO_URL = '/static/video/Lessons/videoplayback.mp4';
const THUMB_URL = 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80';

// ─── Seed function ─────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learn-guitar');
  console.log('✅ Connected to MongoDB');

  // ── Course ──────────────────────────────────────────────────────────────────
  let course = await Course.findOne({ slug: 'guitar-co-ban' });
  if (!course) {
    course = await Course.create({
      slug: 'guitar-co-ban',
      title: 'Guitar Cơ Bản',
      description: 'Khóa học guitar dành cho người mới bắt đầu hoàn toàn, từ cách cầm đàn đến các hợp âm cơ bản.',
      level: 'beginner',
      thumbnailUrl: THUMB_URL,
      isPublished: true,
      order: 1,
    });
    console.log('✅ Tạo course:', course.title);
  } else {
    console.log('ℹ️  Course đã tồn tại:', course.title);
  }

  // ── Module ──────────────────────────────────────────────────────────────────
  let module1 = await CourseModule.findOne({ courseId: course._id, title: 'Kỹ thuật nền tảng' });
  if (!module1) {
    module1 = await CourseModule.create({ courseId: course._id, title: 'Kỹ thuật nền tảng', description: 'Các kỹ thuật bấm dây, gảy dây và tư thế cơ bản.', order: 1 });
    console.log('✅ Tạo module:', module1.title);
  } else {
    console.log('ℹ️  Module đã tồn tại:', module1.title);
  }

  // ── Lessons ─────────────────────────────────────────────────────────────────
  const lessonDefs = [
    { slug: 'gioi-thieu-dan-guitar', title: 'Giới thiệu về đàn guitar', summary: 'Tìm hiểu cấu tạo cây đàn guitar, cách cầm đàn đúng tư thế và cách gảy dây cơ bản.', level: 'beginner', durationSec: 420, order: 1, tags: ['guitar', 'beginner', 'tu-the'] },
    { slug: 'lam-quen-cac-hop-am-co-ban', title: 'Làm quen với hợp âm C, D, E', summary: 'Học cách bấm và chuyển đổi giữa 3 hợp âm cơ bản nhất: Am, C và G.', level: 'beginner', durationSec: 600, order: 2, tags: ['hop-am', 'am', 'c', 'g'] },
    { slug: 'ky-thuat-go-dan-chu-yeu', title: 'Kỹ thuật gõ đàn chủ yếu', summary: 'Làm quen với nhịp điệu 4/4 và các kiểu gảy ngón tay cơ bản cho phong cách folk.', level: 'beginner', durationSec: 540, order: 3, tags: ['nhip-dieu', 'flat-picking', 'folk'] },
  ];

  for (const def of lessonDefs) {
    const existing = await Lesson.findOne({ slug: def.slug });
    if (!existing) {
      await Lesson.create({
        courseId: course._id,
        moduleId: module1._id,
        slug: def.slug,
        title: def.title,
        summary: def.summary,
        lessonType: 'video',
        level: def.level,
        videoUrlHls: VIDEO_URL,
        videoThumbnailUrl: THUMB_URL,
        durationSec: def.durationSec,
        tags: def.tags,
        isPublished: true,
        order: def.order,
      });
      console.log('✅ Tạo lesson:', def.title);
    } else {
      console.log('ℹ️  Lesson đã tồn tại:', def.title);
    }
  }

  // ── Text Quizzes ────────────────────────────────────────────────────────────
  const quizDefs = [
    {
      slug: 'kien-thuc-co-ban-ve-guitar',
      title: 'Kiến thức cơ bản về Guitar',
      description: 'Kiểm tra hiểu biết của bạn về cấu tạo và nguyên lý cơ bản của đàn guitar.',
      level: 'beginner',
      questions: [
        { prompt: 'Đàn guitar tiêu chuẩn có bao nhiêu dây?', options: ['4 dây', '6 dây', '8 dây', '12 dây'], correctIndex: 1, explanation: 'Guitar tiêu chuẩn có 6 dây, được lên dây từ thấp đến cao: E2 A2 D3 G3 B3 E4.' },
        { prompt: 'Nốt dây 1 (dây mỏng nhất) khi chưa bấm phím là?', options: ['E', 'A', 'D', 'G'], correctIndex: 0, explanation: 'Dây 1 (mỏng nhất) là nốt E4, dây 6 (dày nhất) là E2.' },
        { prompt: 'Hợp âm Am gồm những nốt nào?', options: ['A - C# - E', 'A - C - E', 'A - B - E', 'A - C - F'], correctIndex: 1, explanation: 'Hợp âm Am (A minor) gồm 3 nốt: A - C - E.' },
        { prompt: 'Capo là gì?', options: ['Kiểu đánh đàn', 'Kẹp phím dùng để tăng tông', 'Loại dây đàn', 'Phần thân đàn'], correctIndex: 1, explanation: 'Capo là một kẹp kim loại hoặc nhựa đặt ngang phím đàn để thay đổi tông tất cả dây cùng lúc.' },
        { prompt: 'Barre chord là gì?', options: ['Hợp âm chỉ bấm 1 nốt', 'Hợp âm dùng 1 ngón bấm ngang toàn bộ dây', 'Hợp âm không cần bấm', 'Kỹ thuật gảy dây nhanh'], correctIndex: 1, explanation: 'Barre chord (hợp âm barré) là kỹ thuật dùng ngón trỏ bấm ngang toàn bộ 6 dây tại một phím, thường dùng để chuyển tông.' },
      ],
    },
    {
      slug: 'ly-thuyet-nhip-dieu-guitar',
      title: 'Lý thuyết nhịp điệu Guitar',
      description: 'Kiểm tra kiến thức về nhịp điệu, trường độ nốt nhạc và nhịp đánh.',
      level: 'beginner',
      questions: [
        { prompt: 'Nhịp 4/4 có nghĩa là gì?', options: ['4 phách, mỗi phách là nốt đen', '4 nốt trong bài', '4 hợp âm', 'Đánh 4 lần liên tiếp'], correctIndex: 0, explanation: 'Nhịp 4/4 nghĩa là mỗi ô nhịp có 4 phách, và mỗi phách tương ứng với 1 nốt đen (quarter note).' },
        { prompt: 'Strumming pattern D-DU là gì?', options: ['Gảy xuống - Gảy xuống - Gảy lên', 'Gảy xuống - Gảy lên', 'Gảy lên - Gảy xuống - Gảy lên', 'Chỉ gảy xuống'], correctIndex: 0, explanation: 'D = Down (gảy xuống), U = Up (gảy lên). D-DU là: gảy xuống, gảy xuống, gảy lên.' },
        { prompt: 'BPM là viết tắt của gì?', options: ['Beats Per Minute', 'Bass Per Measure', 'Bar Per Melody', 'Beat Playing Mode'], correctIndex: 0, explanation: 'BPM = Beats Per Minute, đơn vị đo tốc độ (tempo) của bài nhạc.' },
        { prompt: 'Tempo 60 BPM tương ứng với?', options: ['60 nốt mỗi giây', '1 phách mỗi giây', '60 ô nhịp mỗi phút', '6 nốt mỗi phách'], correctIndex: 1, explanation: '60 BPM = 60 phách mỗi phút = 1 phách mỗi giây.' },
        { prompt: 'Fingerpicking khác Strumming ở điểm nào?', options: ['Chỉ dùng móng tay', 'Gảy từng dây riêng lẻ bằng các ngón tay', 'Dùng pick lớn hơn', 'Chỉ dùng cho guitar bass'], correctIndex: 1, explanation: 'Fingerpicking là kỹ thuật gảy từng dây riêng lẻ bằng các ngón tay (không dùng pick), tạo âm thanh rõ ràng và tinh tế hơn strumming.' },
      ],
    },
  ];

  for (const def of quizDefs) {
    const existing = await TextQuiz.findOne({ slug: def.slug });
    if (!existing) {
      await TextQuiz.create({ ...def, isPublished: true });
      console.log('✅ Tạo text quiz:', def.title);
    } else {
      console.log('ℹ️  Text quiz đã tồn tại:', def.title);
    }
  }

  console.log('\n🎸 Seed hoàn tất! Dữ liệu mẫu đã được thêm vào database.\n');
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('❌ Seed thất bại:', error);
  process.exit(1);
});
