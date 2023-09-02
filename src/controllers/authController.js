const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Student = require("../models/student"); // Adjust the path as needed
const { validateToken } = require("../utils/validateToken");

// Student login
router.post("/login", async (req, res) => {
  const { studentId, password } = req.body;
  console.log(req.body);
  try {
    // Find the student by studentId
    const student = await Student.findOne({ studentId });

    // If student doesn't exist or password doesn't match
    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ message: "Invalid studentId or password" });
    }

    // eslint-disable-next-line no-undef
    console.log("JWT_SECRET", process.env.JWT_SECRET);
    // Create a JWT token
    const token = jwt.sign(
      { studentId: student.studentId },
      // eslint-disable-next-line no-undef
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ token, student });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.post("/change-password", validateToken, async (req, res) => {
  console.log("req.body", req.body, req.cookies, req.user);
  const { password } = req.body;
  const { studentId } = req.user;

  try {
    // Find the student by studentId
    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.studentId === password) {
      return res
        .status(400)
        .json({ message: "Password can't be same as student id" });
    }

    // Update the student's password
    student.password = bcrypt.hashSync(password, 10);
    student.firstTimeLogin = false;

    // Save the updated student data
    const result = await student.save();

    res
      .status(200)
      .json({ student: result, message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
