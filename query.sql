CREATE TABLE dog_breeds(
  id SERIAL PRIMARY KEY,
  breed text NOT NULL,
  votes int default 0
  );
