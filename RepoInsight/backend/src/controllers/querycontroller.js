import { queryAI } from "../services/aiservice.js";

export const handleQuery = async (req, res) => {
  try {
    const { message, mode } = req.body;

    const response = await queryAI({ message, mode });

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};