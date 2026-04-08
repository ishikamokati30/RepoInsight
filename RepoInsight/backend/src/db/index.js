import "../config/env.js";
import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check backend/.env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
