const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Student = require("../models/student"); // Adjust the path as needed
const { validateToken } = require("../utils/validateToken");
const Admin = require("../models/admin");
const { checkAdminRole } = require("../utils/checkAdminRole");
const Staff = require("../models/staff");

// Student login
router.post("/login", async (req, res) => {
  const { studentId, password } = req.body;
  try {
    // Find the student by studentId
    const student = await Student.findOne({ studentId });

    // If student doesn't exist or password doesn't match
    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ message: "Invalid studentId or password" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { studentId: student.studentId, role: "student", _id: student._id },
      // eslint-disable-next-line no-undef
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    delete student.password;
    res.status(200).json({ token, student, role: "student", wing: student.gender });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// write a logout route for devalidating the token
router.post("/logout", validateToken, async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.get("/check-token-validity", validateToken, async (req, res) => {
  console.log("checking from token valid");
  res.status(200).json({ isValid: true, message: "Token is valid" });
});

// Student Password Change
router.post("/change-password", validateToken, async (req, res) => {
  console.log("req.body", req.body, req.cookies, req.user);
  const { oldPassword, password } = req.body;
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

    // check if the given password is correct or not
    if (!bcrypt.compareSync(oldPassword, student.password)) {
      return res.status(400).json({ message: "Wrong credential!" });
    }
    // Update the student's password
    student.password = bcrypt.hashSync(password, 10);
    student.firstTimeLogin = false;

    // Save the updated student data
    const result = await student.save();

    delete result.password;
    res
      .status(200)
      .json({ student: result, message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Student Password Reset
router.post(
  "/password-reset",
  validateToken,
  checkAdminRole,
  async (req, res) => {
    const { studentId } = req.body;
    try {
      const student = await Student.findOne({ studentId });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      student.password = bcrypt.hashSync(studentId, 10);
      student.firstTimeLogin = true;

      const result = await student.save();
      delete result.password;
      res
        .status(200)
        .json({ student: result, message: "Password reset successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "An error occurred" });
    }
  }
);

// Admin login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    const admin = await Admin.findOne({
      email: { $regex: new RegExp(email, "i") },
    });

    console.log("admin", admin);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res
        .status(401)
        .json({ message: "Invalid admin email or password" });
    }

    // eslint-disable-next-line no-undef
    console.log("JWT_SECRET", process.env.JWT_SECRET);
    // Create a JWT token
    const token = jwt.sign(
      { email: admin.email, _id: admin._id, role: "admin" },
      // eslint-disable-next-line no-undef
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({ token, admin, role: "admin" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
});


// Create a new staff member (POST)
router.post('/staff', async (req, res) => {
  try {
    const { staffId, name, phoneNumber, role, password } = req.body;

    // Hash the password before saving (this is handled by the pre-save hook)
    const newStaff = new Staff({
      staffId,
      name,
      phoneNumber,
      role,
      password, // Plain password will be hashed by the pre-save hook
    });

    // Save the staff member to the database
    const savedStaff = await newStaff.save();
    res.status(201).json({ message: 'Staff member created successfully', staff: savedStaff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating staff member', details: error.message });
  }
});


// Staff login route
router.post('/staff/login', async (req, res) => {
  try {
    const { staffId, password } = req.body;
    
    // Find the staff by staffId
    const staffMember = await Staff.findOne({ staffId });
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Compare the provided password with the stored hash
    const isMatch = bcrypt.compareSync(password, staffMember.password); // Corrected order
    console.log(isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { staffId: staffMember.staffId, role: staffMember.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send the token to the client
    res.status(200).json({ token, staffId: staffMember.staffId, role: staffMember.role });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in', details: error.message });
  }
});


module.exports = router;
