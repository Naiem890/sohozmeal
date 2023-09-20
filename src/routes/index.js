const router = require("express").Router();
const authController = require("../controllers/authController");
const studentController = require("../controllers/studentController");
const mealController = require("../controllers/mealController");
const { sendSMS } = require("../utils/sendSMS");

router.use("/auth", authController);
router.use("/student", studentController);
router.use("/meal", mealController);

// write a test route to check the sms functionality
router.get("/test-sms", async (req, res) => {
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

module.exports = router;
