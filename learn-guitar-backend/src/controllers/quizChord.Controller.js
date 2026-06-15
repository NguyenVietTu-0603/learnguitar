import quizChordService from '../services/quizChord.service.js'

export const generateQuizChord = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const questions = await quizChordService.generateQuizChord({ category, difficulty });

    res.json({ total: questions.length, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkQuizChordAnswer = async (req, res) => {
  try {
    const { questionId, selectedId } = req.body;

    if (!questionId || !selectedId) {
      return res.status(400).json({ message: 'Thiếu questionId hoặc selectedId' });
    }

    const result = await quizChordService.checkQuizChordAnswer(questionId, selectedId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};