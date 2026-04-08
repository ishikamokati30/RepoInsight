import express from "express";
import axios from "axios";

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Text ingestion
router.post("/text", async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ingest/text`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
