import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export const generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;

    const response = await axios.post(`${AI_SERVICE_URL}/query`, {
      message: topic,
      mode: "learning",
    });

    res.json(response.data.quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
