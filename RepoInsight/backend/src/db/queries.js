import pool from "./index.js";

// Save query
export const saveQuery = async (userId, message, response) => {
  const query = `
    INSERT INTO queries (user_id, message, response)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [userId, message, response];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get progress
export const getUserProgress = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM progress WHERE user_id = $1",
    [userId]
  );
  return result.rows;
};

export const saveQuizResult = async (
  userId,
  topic,
  question,
  userAnswer,
  correctAnswer,
  isCorrect
) => {
  const query = `
    INSERT INTO quiz_results 
    (user_id, topic, question, user_answer, correct_answer, is_correct)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  await pool.query(query, [
    userId,
    topic,
    question,
    userAnswer,
    correctAnswer,
    isCorrect,
  ]);
};