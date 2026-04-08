CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT
);

CREATE TABLE queries (
  id SERIAL PRIMARY KEY,
  user_id INT,
  message TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  user_id INT,
  topic TEXT,
  score INT
);

CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  user_id INT,
  topic TEXT,
  question TEXT,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);