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

// Test route to check the sms functionality
app.get("/test-sms", async (req, res) => {
  console.log("test-sms route");
  try {
    const result = await sendSMS(
      req.body.message || "Message working from Sohoz Meal App",
      "01790732717"
    );

    if (result.data.success_message) {
      res.status(200).json({ message: result.data.success_message });
    } else {
      res.status(500).json({ message: "SMS sending failed!" });
      console.log("Reason: ", result.data.error_message);
    }
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

// require("../src/data/insertStudents");
require("../cron/mealGenerate");

app.listen(port, () => {
  console.log(`Sohoz Meal app listening on port ${port}!`);
  console.log(`Running on port: ${port}`);
});
