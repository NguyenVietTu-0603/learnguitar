import 'dotenv/config';
import mongoose from 'mongoose';
import slugify from 'slugify';

import Course from '../src/models/Course.model.js';
import CourseModule from '../src/models/CourseModule.model.js';
import Lesson from '../src/models/Lesson.model.js';
import Quiz from '../src/models/Quiz.model.js';
import QuizQuestion from '../src/models/QuizQuestion.model.js';
import QuizLessonTemplate from '../src/models/QuizLessonTemplate.model.js';
import Chord from '../src/models/Chord.model.js';

const curatedCourse = {
  slug: 'guitar-foundation-30-ngay',
  title: 'Lộ trình Guitar Foundation 30 Ngày',
  description:
    'Lộ trình thực hành có chọn lọc dành cho người mới: bắt đầu từ hợp âm mở, giữ nhịp tay phải, chuyển hợp âm mượt và ứng dụng ngay vào bài đệm thực tế.',
  level: 'beginner',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
  isPublished: true,
  order: 1,
};

const curatedModules = [
  {
    key: 'module-open-chords',
    title: 'Module 1 · Hợp âm mở và tư thế',
    description:
      'Tập trung vào tư thế cầm đàn, cách đặt tay và ba hợp âm nền tảng đầu tiên để người học có thể bắt đầu đệm hát ngay.',
    order: 1,
    lessons: [
      {
        slug: 'tu-the-cam-dan-va-giu-nhip-dem-dau-tien',
        title: 'Tư thế cầm đàn và giữ nhịp đệm đầu tiên',
        summary:
          'Thiết lập tư thế ngồi đúng, thả lỏng vai, cầm pick cơ bản và cảm nhịp 4/4 bằng động tác xuống đều tay.',
        lessonType: 'video',
        level: 'beginner',
        videoUrlHls: 'https://www.w3schools.com/html/mov_bbb.mp4',
        videoThumbnailUrl:
          'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80',
        durationSec: 540,
        tags: ['tu-the', 'nhip-4-4', 'pick', 'khoi-dong'],
        order: 1,
      },
      {
        slug: 'hop-am-em-c-g-cho-nguoi-moi',
        title: 'Làm quen hợp âm Em, C và G',
        summary:
          'Học cách bấm ba hợp âm Em, C, G rõ tiếng; kiểm tra từng dây và chuyển chậm theo vòng 4 nhịp.',
        lessonType: 'video',
        level: 'beginner',
        videoUrlHls: 'https://www.w3schools.com/html/movie.mp4',
        videoThumbnailUrl:
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
        durationSec: 660,
        tags: ['hop-am-mo', 'em', 'c', 'g', 'quiz:quiz-template-open-chords-1'],
        order: 2,
      },
      {
        slug: 'kiem-tra-hop-am-mo-1',
        title: 'Kiểm tra hợp âm mở · vòng 1',
        summary:
          'Bài quiz ngắn để nhận diện nhanh hợp âm Em, C và G sau khi đã quan sát sơ đồ bấm.',
        lessonType: 'quiz',
        level: 'beginner',
        durationSec: 300,
        tags: ['quiz', 'hop-am-mo', 'quiz:quiz-template-open-chords-1'],
        order: 3,
      },
    ],
  },
  {
    key: 'module-strumming-transition',
    title: 'Module 2 · Chuyển hợp âm và tay phải',
    description:
      'Kết nối hợp âm thành vòng đệm thực tế, tập strumming xuống-lên và giữ nhịp ổn định khi đổi hợp âm.',
    order: 2,
    lessons: [
      {
        slug: 'chuyen-hop-am-am-f-c-g',
        title: 'Chuyển hợp âm Am - F - C - G mượt hơn',
        summary:
          'Tối ưu đường đi ngón tay giữa Am, F, C, G; chia chuyển động thành 2 bước để giảm độ khựng khi đổi hợp âm.',
        lessonType: 'video',
        level: 'beginner',
        videoUrlHls: 'https://www.w3schools.com/html/mov_bbb.mp4',
        videoThumbnailUrl:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
        durationSec: 720,
        tags: ['am', 'f', 'c', 'g', 'chuyen-hop-am', 'quiz:quiz-template-open-chords-2'],
        order: 1,
      },
      {
        slug: 'strumming-xuong-len-co-ban-8-beat',
        title: 'Strumming xuống lên cơ bản kiểu 8-beat',
        summary:
          'Tập mẫu xuống-xuống-lên-lên-xuống-lên để tạo cảm giác đệm hát mềm và đều tay hơn.',
        lessonType: 'video',
        level: 'beginner',
        videoUrlHls: 'https://www.w3schools.com/html/movie.mp4',
        videoThumbnailUrl:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
        durationSec: 780,
        tags: ['strumming', '8-beat', 'nhip', 'quiz:quiz-template-rhythm-1'],
        order: 2,
      },
      {
        slug: 'thuc-hanh-vong-dem-pop-co-ban',
        title: 'Thực hành vòng đệm pop cơ bản',
        summary:
          'Ghép vòng C - G - Am - F vào nhịp 8-beat và luyện đổi hợp âm theo từng cụm 2 ô nhịp.',
        lessonType: 'video',
        level: 'beginner',
        videoUrlHls: 'https://www.w3schools.com/html/mov_bbb.mp4',
        videoThumbnailUrl:
          'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80',
        durationSec: 840,
        tags: ['vong-pop', 'c-g-am-f', 'thuc-hanh', 'quiz:quiz-template-open-chords-2'],
        order: 3,
      },
    ],
  },
];

const quizTemplates = [
  {
    key: 'quiz-template-open-chords-1',
    slug: 'open-chords-beginner-set-1',
    title: 'Nhận diện hợp âm mở · Bộ 1',
    summary: 'Bộ câu hỏi chọn lọc về Em, C, G và Am để người mới nhận diện nhanh sau bài học đầu tiên.',
    level: 'beginner',
    lessonType: 'quiz_chord_guess',
    quizzes: [
      {
        slug: 'quiz-template-open-chords-1',
        title: 'Nhận diện Em nhanh',
        prompt: 'Nhìn sơ đồ bấm và chọn tên hợp âm đúng cho hình thế này.',
        chordSlug: 'em',
        wrongChordSlugs: ['c', 'g', 'am'],
      },
      {
        title: 'Chọn đúng hợp âm C',
        prompt: 'Sơ đồ có dây A ngăn 3, dây D ngăn 2 và dây B ngăn 1 là hợp âm nào?',
        chordSlug: 'c',
        wrongChordSlugs: ['em', 'g', 'am'],
      },
      {
        title: 'G Major cơ bản',
        prompt: 'Hợp âm có hai ngón ở dây E thấp ngăn 3 và E cao ngăn 3 thường là hợp âm nào?',
        chordSlug: 'g',
        wrongChordSlugs: ['c', 'am', 'em'],
      },
    ],
  },
  {
    key: 'quiz-template-open-chords-2',
    slug: 'open-chords-beginner-set-2',
    title: 'Chuyển hợp âm phổ biến · Bộ 2',
    summary: 'Tập trung vào vòng C - G - Am - F để hỗ trợ trực tiếp cho phần đệm pop cơ bản.',
    level: 'beginner',
    lessonType: 'quiz_chord_guess',
    quizzes: [
      {
        title: 'Nhận diện Am',
        prompt: 'Sơ đồ có dây D ngăn 2, G ngăn 2 và B ngăn 1 là hợp âm nào?',
        chordSlug: 'am',
        wrongChordSlugs: ['c', 'em', 'g'],
      },
      {
        title: 'Nhận diện F dễ dùng',
        prompt: 'Hình thế F mini phổ biến cho người mới thường tương ứng với hợp âm nào?',
        chordSlug: 'f',
        wrongChordSlugs: ['am', 'c', 'g'],
      },
      {
        title: 'C-G-Am-F trong bài pop',
        prompt: 'Trong vòng đệm pop cơ bản, sơ đồ này đại diện cho hợp âm nào?',
        chordSlug: 'g',
        wrongChordSlugs: ['f', 'c', 'am'],
      },
    ],
  },
  {
    key: 'quiz-template-rhythm-1',
    slug: 'rhythm-and-strumming-set-1',
    title: 'Nhịp và đệm tay phải · Bộ 1',
    summary: 'Quiz có chọn lọc để liên kết tiết tấu 8-beat với các hợp âm người học đang dùng thực tế.',
    level: 'beginner',
    lessonType: 'quiz_chord_guess',
    quizzes: [
      {
        title: 'Giữ nhịp với Em',
        prompt: 'Trong bài tập giữ nhịp đầu tiên, hợp âm mở dễ dùng nhất ở đây là gì?',
        chordSlug: 'em',
        wrongChordSlugs: ['f', 'c', 'am'],
      },
      {
        title: 'Strumming với C',
        prompt: 'Khi giữ mẫu xuống-xuống-lên-lên-xuống-lên, sơ đồ này là hợp âm nào?',
        chordSlug: 'c',
        wrongChordSlugs: ['g', 'em', 'am'],
      },
    ],
  },
];

const audioForChord = (chord) => chord.audioUrl || '/static/audio/chords/default.mp3';

const normalizeSlug = (value) => slugify(value || '', { lower: true, strict: true });

async function ensureCourse() {
  return Course.findOneAndUpdate(
    { slug: curatedCourse.slug },
    { $set: curatedCourse },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureModule(courseId, moduleData) {
  return CourseModule.findOneAndUpdate(
    { courseId, order: moduleData.order },
    {
      $set: {
        title: moduleData.title,
        description: moduleData.description,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureLesson(courseId, moduleId, lessonData) {
  return Lesson.findOneAndUpdate(
    { slug: lessonData.slug },
    {
      $set: {
        courseId,
        moduleId,
        title: lessonData.title,
        summary: lessonData.summary,
        lessonType: lessonData.lessonType,
        level: lessonData.level,
        videoUrlHls: lessonData.videoUrlHls || null,
        videoThumbnailUrl: lessonData.videoThumbnailUrl || null,
        durationSec: lessonData.durationSec,
        tags: lessonData.tags || [],
        isPublished: true,
        order: lessonData.order,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureQuizTemplate(templateData) {
  return QuizLessonTemplate.findOneAndUpdate(
    { slug: templateData.slug },
    {
      $set: {
        title: templateData.title,
        summary: templateData.summary,
        level: templateData.level,
        lessonType: templateData.lessonType,
        isPublished: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureQuizAndQuestion({ template, templateData, chordMap }) {
  for (let index = 0; index < templateData.quizzes.length; index += 1) {
    const item = templateData.quizzes[index];
    const quizSlug = normalizeSlug(item.slug || `${template.slug}-${index + 1}-${item.title}`);
    const chord = chordMap.get(item.chordSlug);
    const wrongChords = item.wrongChordSlugs.map((slug) => chordMap.get(slug));

    if (!chord || wrongChords.some((entry) => !entry)) {
      throw new Error(`Thiếu chord dữ liệu cho quiz template ${template.slug}`);
    }

    const quiz = await Quiz.findOneAndUpdate(
      { slug: quizSlug },
      {
        $set: {
          title: item.title,
          quizType: 'chord_identify',
          level: templateData.level,
          lessonTemplateId: template._id,
          courseId: null,
          lessonId: null,
          config: { questionCount: 1 },
          isPublished: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const options = [chord.displayName, ...wrongChords.map((entry) => entry.displayName)];

    await QuizQuestion.findOneAndUpdate(
      { quizId: quiz._id },
      {
        $set: {
          questionType: 'chord_name_mc',
          prompt: item.prompt,
          audioUrl: audioForChord(chord),
          chordSlug: chord.slug,
          noteId: null,
          options,
          correctAnswer: {
            chordName: chord.displayName,
            aliases: chord.alias || [],
          },
          difficultyWeight: 1,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const quizCount = await Quiz.countDocuments({ lessonTemplateId: template._id });
  await QuizLessonTemplate.updateOne({ _id: template._id }, { $set: { quizCount } });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu MONGODB_URI trong môi trường.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const requiredChordSlugs = [...new Set(quizTemplates.flatMap((template) => template.quizzes.flatMap((quiz) => [quiz.chordSlug, ...quiz.wrongChordSlugs])))];
  const chords = await Chord.find({ slug: { $in: requiredChordSlugs } });
  const chordMap = new Map(chords.map((item) => [item.slug, item]));
  const missingChords = requiredChordSlugs.filter((slug) => !chordMap.has(slug));

  if (missingChords.length > 0) {
    throw new Error(`Thiếu chord trong cơ sở dữ liệu: ${missingChords.join(', ')}`);
  }

  const course = await ensureCourse();

  for (const moduleData of curatedModules) {
    const moduleDoc = await ensureModule(course._id, moduleData);
    for (const lessonData of moduleData.lessons) {
      await ensureLesson(course._id, moduleDoc._id, lessonData);
    }
  }

  for (const templateData of quizTemplates) {
    const template = await ensureQuizTemplate(templateData);
    await ensureQuizAndQuestion({ template, templateData, chordMap });
  }

  console.log('Imported curated lessons and quizzes successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
