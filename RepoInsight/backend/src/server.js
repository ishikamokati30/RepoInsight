import express from "express";
import cors from "cors";
import "./config/env.js";
import queryRoutes from "./routes/queryroutes.js";
import ingestRoutes from "./routes/ingestRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/progress", progressRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/quiz", quizRoutes);

app.listen(5000, () => {
  console.log("Server running 🚀");
});
