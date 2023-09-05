const router = require("express").Router();
const { validateToken } = require("../utils/validateToken");
const Student = require("../models/student");
const { checkAdminRole } = require("../utils/checkAdminRole");

router.get("/", validateToken, async (req, res) => {
  const { studentId } = req.user;
  console.log("studentId:", studentId);
  try {
    console.log("Before findOne");
    const student = await Student.findOne({ studentId }, { password: 0 });
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

// DELETE Student by studentId
router.delete(
  "/:studentId",
  validateToken,
  checkAdminRole,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await Student.findOneAndDelete({ studentId });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res
        .status(500)
        .json({ message: "An error occurred while deleting the student" });
    }
  }
);
router.get("/all", validateToken, checkAdminRole, async (req, res) => {
  try {
    // Fetch all students from the database
    const students = await Student.find({}, { password: 0 });

    // Respond with the list of students as JSON
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching students" });
  }
});

// router to update student profile
router.put("/", validateToken, async (req, res) => {
  const { role } = req.user;
  console.log("role", role);
  const {
    name,
    hallId,
    newStudentId,
    studentId,
    phoneNumber,
    department,
    batch,
    status,
  } = req.body;
  console.log("here", studentId);
  try {
    const student = await Student.findOne({ studentId }, { password: 0 });
    if (!student) {
      res.status(404).json({ message: "Student not found" });
    } else {
      student.phoneNumber = phoneNumber;
      student.department = department;
      student.batch = batch;

      if (role === "admin") {
        student.name = name;
        student.hallId = hallId;
        student.studentId = newStudentId ? newStudentId : studentId;
        student.status = status;
      }
      console.log("student:", student);
      await student.save();
      res
        .status(200)
        .json({ student, message: "Profile updated successfully" });
    }
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
