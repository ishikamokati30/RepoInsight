const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "repoinsight",
  password: "ayu5hika",
  port: 5432,
});

module.exports = pool;