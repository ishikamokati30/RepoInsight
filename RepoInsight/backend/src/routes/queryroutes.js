import express from "express";
import { handleQuery } from "../controllers/querycontroller.js";

const router = express.Router();
router.post("/", handleQuery);
router.post("/evaluate", async (req, res) => {
  const response = await axios.post("http://localhost:8000/evaluate", req.body);
  res.json(response.data);
});

export default router;