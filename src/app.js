const express = require("express");
const app = express();
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/database");
const apiRoutes = require("./routes/index");
// Load env variables
require("dotenv").config();

// eslint-disable-next-line no-undef
const port = process.env.PORT || 5000;

// eslint-disable-next-line no-undef
const { PORT, NODE_ENV, DB_URI_CLOUD } = process.env;
console.log("app.js => ", PORT, NODE_ENV, DB_URI_CLOUD);
// Middleware Array
const middleware = [
  logger("dev"),
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
  cookieParser(),
  express.static("public"),
  express.urlencoded({ extended: true }),
  express.json(),
];

app.use(middleware);

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Sohoz Meal App with workflow!");
});

// Api routes
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Add 'next' as the fourth parameter
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Connect to the database
dbConnect();

// require("../temp/insertStudents");
require("../cron/cronScheduler");

app.listen(port, () => {
  console.log(`Sohoz Meal app listening on port ${port}`);
  console.log(`Running on port: ${port}`);
});
