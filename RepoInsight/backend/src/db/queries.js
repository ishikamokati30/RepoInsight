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