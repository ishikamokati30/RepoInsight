import express from "express";
import { handleQuery } from "../controllers/querycontroller.js";

const router = express.Router();

router.post("/", handleQuery);

export default router;