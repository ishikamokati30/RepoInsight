import express from "express";
import queryRoutes from "./routes/queryroutes.js";

const app = express();

app.use(express.json());

app.use("/api/query", queryRoutes);

app.listen(5000, () => {
  console.log("Server running 🚀");
});