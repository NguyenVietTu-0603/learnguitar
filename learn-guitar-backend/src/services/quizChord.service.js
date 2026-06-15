import Chord from '../models/Chord.model.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const pickDistractors = (targetChord, allChords) => {
  const othersInCategory = allChords.filter(
    (c) =>
      c._id.toString() !== targetChord._id.toString() &&
      c.category === targetChord.category
  );

  const othersOutCategory = allChords.filter(
    (c) =>
      c._id.toString() !== targetChord._id.toString() &&
      c.category !== targetChord.category
  );

  const fromCategory = shuffle(othersInCategory).slice(0, 3);
  const needed = 3 - fromCategory.length;
  const fromOther = shuffle(othersOutCategory).slice(0, needed);

  return [...fromCategory, ...fromOther];
};

const buildQuizChordQuestion = (targetChord, allChords) => {
  const distractors = pickDistractors(targetChord, allChords);

  const options = shuffle([targetChord, ...distractors]).map((c) => ({
    id: c._id,
    label: c.displayName,
    diagramSvg: c.diagramSvg ?? null
  }));

  return {
    questionId: targetChord._id,
    question: 'Hợp âm này tên là gì?',
    diagramSvg: targetChord.diagramSvg ?? null,
    audioUrl: targetChord.audioUrl ?? null,
    difficulty: targetChord.difficulty,
    category: targetChord.category,
    options
  };
};

const quizChordService = {
  async generateQuizChord(filters = {}) {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.difficulty) query.difficulty = filters.difficulty;

    const targetChords = await Chord.find(query).select(
      '_id name displayName diagramSvg audioUrl category difficulty'
    );

    if (targetChords.length === 0) return [];

    const allChords = await Chord.find({}).select(
      '_id name displayName diagramSvg category'
    );

    const questions = targetChords.map((chord) =>
      buildQuizChordQuestion(chord, allChords)
    );

    return shuffle(questions);
  },

  async checkQuizChordAnswer(questionId, selectedId) {
    const chord = await Chord.findById(questionId).select(
      '_id displayName name'
    );

    if (!chord) throw new Error('Chord không tồn tại');

    const isCorrect = chord._id.toString() === selectedId?.toString();

    return {
      isCorrect,
      correctId: chord._id,
      correctLabel: chord.displayName,
      explanation: null
    };
  }
};

export default quizChordService;