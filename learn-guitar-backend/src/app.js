import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import AppError from './exceptions/AppError.js';
import authRoutes from './routes/auth.route.js';
import songRoutes from './routes/song.route.js';
import chordRoutes from './routes/chord.route.js';
import courseRoutes from './routes/course.route.js';
import noteRoutes from './routes/note.route.js';
import quizRoutes from './routes/quiz.route.js';
import quizLessonTemplateRoutes from './routes/quizLessonTemplate.route.js';
import theoryRoutes from './routes/theory.route.js';
import progressRoutes from './routes/progress.route.js';
import fretboardRoutes from './routes/fretboard.route.js';
import quizchord from './routes/quizchord.route.js'
import lessonRoutes from './routes/lesson.route.js';
import textquizRoutes from './routes/textquiz.route.js';
import adminRoutes from './routes/admin.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDevOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultDevOrigins, ...envOrigins])];

// ====================== MIDDLEWARE ======================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    const isLocalhost = Boolean(origin && /^http:\/\/localhost:\d+$/.test(origin));

    if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// ====================== ROUTES ======================
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Learn Guitar Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/songs', songRoutes);
// Chord Routes
app.use('/api/v1/chords', chordRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/fretboard', fretboardRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/quiz-lessons', quizLessonTemplateRoutes);
app.use('/api/v1/theory-lessons', theoryRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/quizchord', quizchord);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/text-quizzes', textquizRoutes);
app.use('/api/v1/admin', adminRoutes);
// ====================== GLOBAL ERROR HANDLER =======================
// Phải đặt sau tất cả routes
app.use((err, req, res, next) => {
  console.error('❌ Error Details:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.details || undefined
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors: err.issues?.map((item) => ({
        path: item.path,
        message: item.message,
      })) || [],
    });
  }

  // Lỗi Mongoose Validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Lỗi Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} đã tồn tại trong hệ thống`
    });
  }

  // Lỗi từ service/controller (Error thông thường)
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Lỗi server
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
  });
});

// ====================== START SERVER ======================
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();