import mongoose from 'mongoose';

const chordSchema = new mongoose.Schema({
  chord: {
    type: String,
    required: true
  },
  offset: {
    type: Number,
    required: true
  }
});

const wordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true
  },
  chord: {
    type: String,
    default: null
  },
  index: {
    type: Number
  }
});

const lineSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  words: [wordSchema],           // Word Tokenization + Chord
  chords: [chordSchema],         // Lưu vị trí hợp âm gốc
  chordsLine: String             // Dòng hợp âm thô người nhập (để dễ chỉnh sửa sau)
});

const sectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro', 'solo', 'interlude'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  lines: [lineSchema]
});

const songSchema = new mongoose.Schema({
  // Thông tin cơ bản
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  // Metadata
  genre: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [{ type: String }],

  // Thông tin guitar
  originalKey: {
    type: String,
    required: true
  },
  capo: {
    type: Number,
    default: 0,
    min: 0,
    max: 12
  },
  tempo: Number,
  timeSignature: {
    type: String,
    default: '4/4'
  },
  strummingPattern: String,

  // Cấu trúc bài hát
  sections: [sectionSchema],

  // Thông tin bổ sung
  youtubeLink: String,
  image: String,
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
songSchema.index({ title: 'text', artist: 'text' });
songSchema.index({ genre: 1 });
songSchema.index({ difficulty: 1 });

songSchema.virtual('songChordUsages', {
  ref: 'SongChordUsage',
  localField: '_id',
  foreignField: 'songId'
});

// Middleware trước khi lưu (tự động tạo slug nếu chưa có)
songSchema.pre('save', function () {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
  }
});

const Song = mongoose.model('Song', songSchema);

export default Song;