const router = require("express").Router();
const { validateToken } = require("../utils/validateToken");
const Student = require("../models/student");

router.get("/", validateToken, async (req, res) => {
  const { studentId } = req.user;
  try {
    console.log("Before findOne");
    const student = await Student.findOne({ studentId });
    console.log("After findOne");
    if (!student) {
      res.status(404).json({ message: "Student not found" });
    } else {
      res.status(200).json({ student });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// router to update student profile
router.put("/", validateToken, async (req, res) => {
  const { studentId } = req.user;
  const { phoneNumber, department, batch } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      res.status(404).json({ message: "Student not found" });
    } else {
      student.phoneNumber = phoneNumber;
      student.department = department;
      student.batch = batch;
      console.log("student:", student);
      await student.save();
      res.status(200).json({ student });
    }
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
