const router = require("express").Router();
const authController = require("../controllers/authController");
const studentController = require("../controllers/studentController");

router.use("/auth", authController);
router.use("/student", studentController);

module.exports = router;
