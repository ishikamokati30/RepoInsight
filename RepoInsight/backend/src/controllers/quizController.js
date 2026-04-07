import axios from "axios";

export const generateQuiz = async (req, res) => {
  const { topic } = req.body;

  const response = await axios.post("http://localhost:8000/query", {
    message: topic,
    mode: "learning",
  });

  res.json(response.data.quiz);
};