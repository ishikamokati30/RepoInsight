import { getUserProgress, getWeakTopics } from "../db/queries.js";

export const getProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    const overall = await getUserProgress(userId);
    const topics = await getWeakTopics(userId);

    const total = parseInt(overall.total) || 0;
    const correct = parseInt(overall.correct) || 0;

    const accuracy = total === 0 ? 0 : (correct / total) * 100;

    // 🔥 Detect weak topics
    const weakTopics = topics
      .map(t => {
        const tTotal = parseInt(t.total);
        const tCorrect = parseInt(t.correct);
        const acc = tTotal === 0 ? 0 : (tCorrect / tTotal) * 100;

        return { topic: t.topic, accuracy: acc };
      })
      .filter(t => t.accuracy < 60)   // threshold
      .map(t => t.topic);

    res.json({
      total,
      correct,
      accuracy: accuracy.toFixed(2),
      weak_topics: weakTopics
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};