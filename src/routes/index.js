const router = require("express").Router();
const authController = require("../controllers/authController");
const studentController = require("../controllers/studentController");
const mealController = require("../controllers/mealController");

router.use("/auth", authController);
router.use("/student", studentController);
router.use("/meal", mealController);

module.exports = router;
