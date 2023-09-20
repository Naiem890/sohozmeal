const express = require("express");
const app = express();
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/database");
const apiRoutes = require("./routes/index");
const { sendSMS } = require("./utils/sendSMS");
// Load env variables
require("dotenv").config();

// eslint-disable-next-line no-undef
const port = process.env.PORT || 5000;

// Middleware Array
const middleware = [
  logger("dev"),
  cors(),
  cookieParser(),
  express.static("public"),
  express.urlencoded({ extended: true }),
  express.json(),
];

app.use(middleware);

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Sohoz Meal App!");
});

// Api routes
app.use("/api", apiRoutes);
app.get("/test-sms", async (req, res) => {
  console.log("test-sms route");
  try {
    const result = await sendSMS(
      "Message working from Sohoz Meal App",
      "01790732717"
    );
    console.log("SMS sent successfully!", result);
    res.status(200).json({ message: "SMS sent successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Add 'next' as the fourth parameter
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Connect to the database
dbConnect();

// require("../temp/insertStudents");
require("../cron/mealGenerate");

app.listen(port, () => {
  console.log(`Sohoz Meal app listening on port ${port}!`);
  console.log(`Running on port: ${port}`);
});
