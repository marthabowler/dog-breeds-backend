import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB

const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/", async (req, res) => {
  try {
    const dbres = await client.query("select breed, votes from dog_breeds");
    res.status(200).json({ status: "success", data: dbres.rows });
  } catch (err) {
    res.status(404).json({ status: "failed", error: err });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const dbres = await client.query(
      "select breed, votes from dog_breeds order by votes desc limit 10"
    );
    res.status(200).json({ status: "success", data: dbres.rows });
  } catch (err) {
    res.status(404).json({ status: "failed", error: err });
  }
});

app.put("/vote/:breed", async (req, res) => {
  const breed = req.params.breed;
  try {
    const dbres = await client.query(
      "update dog_breeds set votes=votes+1 where breed=$1 returning *",
      [breed]
    );
    if (dbres.rows.length === 0) {
      res
        .status(404)
        .json({
          status: "failed",
          message: `dog breed ${breed} does not exist`,
        });
    } else {
      res.status(200).json({
        status: "success",
        message: "vote count has increased by 1",
        data: dbres.rows,
      });
    }
  } catch (err) {
    res.status(404).json({ status: "failed", error: err });
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
