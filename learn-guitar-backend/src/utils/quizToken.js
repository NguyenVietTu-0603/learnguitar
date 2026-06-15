import jwt from 'jsonwebtoken';

const secret = process.env.QUIZ_TOKEN_SECRET || process.env.JWT_SECRET || 'quiz-secret-local';

export const signQuizQuestionToken = ({ questionId, quizId }) => {
  return jwt.sign(
    {
      questionId,
      quizId,
      type: 'quiz_question',
    },
    secret,
    { expiresIn: process.env.QUIZ_TOKEN_EXPIRES_IN || '20m' }
  );
};

export const verifyQuizQuestionToken = (token) => {
  return jwt.verify(token, secret);
};
