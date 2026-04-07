import { queryAI } from "../services/aiservice.js";
import { saveQuery } from "../db/queries.js";

export const handleQuery = async (req, res) => {
  try {
    const { message, mode, userId = 1 } = req.body;

    const aiResponse = await queryAI({ message, mode });

    // Save in DB
    await saveQuery(userId, message, aiResponse.answer);

    res.json(aiResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};