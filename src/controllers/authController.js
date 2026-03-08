const router  = require("express").Router();
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const Student  = require("../models/student");
const Admin    = require("../models/admin");
const Staff    = require("../models/staff");
const RefreshToken = require("../models/refreshToken");
const { validateToken } = require("../utils/validateToken");
const { checkAdminRole } = require("../utils/checkAdminRole");

// ─── helpers ─────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY  = "15m";
const REFRESH_TOKEN_DAYS   = 7;

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function createRefreshToken(userId, role) {
  const raw      = crypto.randomBytes(40).toString("hex");
  const hashed   = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ token: hashed, userId, role, expiresAt });
  return raw;
}

// ─── Student login ────────────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  const { studentId, password } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ message: "Invalid studentId or password" });
    }

    const accessToken  = signAccess({ studentId: student.studentId, role: "student", _id: student._id });
    const refreshToken = await createRefreshToken(student.studentId, "student");

    const studentData = student.toObject();
    delete studentData.password;

    res.status(200).json({ accessToken, refreshToken, student: studentData, role: "student", wing: student.gender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ─── Admin login ──────────────────────────────────────────────────────────────

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ message: "Invalid admin email or password" });
    }

    const accessToken  = signAccess({ email: admin.email, _id: admin._id, role: "admin", wing: admin.wing });
    const refreshToken = await createRefreshToken(String(admin._id), "admin");

    res.status(200).json({ accessToken, refreshToken, role: "admin", wing: admin.wing, _id: admin._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// ─── Staff login ──────────────────────────────────────────────────────────────

router.post("/staff/login", async (req, res) => {
  try {
    const { staffId, password } = req.body;
    const staff = await Staff.findOne({ staffId });
    if (!staff || !bcrypt.compareSync(password, staff.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken  = signAccess({ staffId: staff.staffId, role: staff.role });
    const refreshToken = await createRefreshToken(staff.staffId, staff.role);

    res.status(200).json({ accessToken, refreshToken, staffId: staff.staffId, role: staff.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error logging in", details: error.message });
  }
});

// ─── Refresh access token ─────────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const hashed   = hashToken(refreshToken);
    const tokenDoc = await RefreshToken.findOne({ token: hashed });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      if (tokenDoc) await tokenDoc.deleteOne();
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    let payload;
    const { userId, role } = tokenDoc;

    if (role === "student") {
      const student = await Student.findOne({ studentId: userId });
      if (!student) return res.status(401).json({ message: "User not found" });
      payload = { studentId: student.studentId, role: "student", _id: student._id };
    } else if (role === "admin") {
      const admin = await Admin.findById(userId);
      if (!admin) return res.status(401).json({ message: "User not found" });
      payload = { email: admin.email, _id: admin._id, role: "admin", wing: admin.wing };
    } else {
      // staff roles: MESS | WIFI | CLEANING | REPAIR
      const staff = await Staff.findOne({ staffId: userId });
      if (!staff) return res.status(401).json({ message: "User not found" });
      payload = { staffId: staff.staffId, role: staff.role };
    }

    const accessToken = signAccess(payload);
    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await RefreshToken.deleteOne({ token: hashed });
    }
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ─── Token validity check (kept for backward compat) ─────────────────────────

router.get("/check-token-validity", validateToken, (req, res) => {
  res.status(200).json({ isValid: true, message: "Token is valid" });
});

// ─── Change password ──────────────────────────────────────────────────────────

router.post("/change-password", validateToken, async (req, res) => {
  const { oldPassword, password } = req.body;
  const { studentId } = req.user;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student.studentId === password) {
      return res.status(400).json({ message: "Password can't be same as student id" });
    }
    if (!bcrypt.compareSync(oldPassword, student.password)) {
      return res.status(400).json({ message: "Wrong credential!" });
    }
    student.password = bcrypt.hashSync(password, 10);
    student.firstTimeLogin = false;
    const result = await student.save();
    const resultObj = result.toObject();
    delete resultObj.password;
    res.status(200).json({ student: resultObj, message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ─── Password reset (admin only) ──────────────────────────────────────────────

router.post("/password-reset", validateToken, checkAdminRole, async (req, res) => {
  const { studentId } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });
    student.password = bcrypt.hashSync(studentId, 10);
    student.firstTimeLogin = true;
    const result = await student.save();
    const resultObj = result.toObject();
    delete resultObj.password;
    res.status(200).json({ student: resultObj, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ─── Admin register (unprotected — keep as-is, known issue) ──────────────────

router.post("/admin/register", async (req, res) => {
  const { email, password, wing } = req.body;
  if (!wing || !["MALE", "FEMALE", "ALL"].includes(wing)) {
    return res.status(400).json({ message: "Invalid or missing wing. Must be MALE, FEMALE, or ALL." });
  }
  try {
    const existing = await Admin.findOne({ email: { $regex: new RegExp(email, "i") } });
    if (existing) return res.status(400).json({ message: "Admin with this email already exists" });
    const newAdmin = new Admin({ email, password, wing });
    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred during registration" });
  }
});

// ─── Create staff member ──────────────────────────────────────────────────────

router.post("/staff", async (req, res) => {
  try {
    const { staffId, name, phoneNumber, role, password } = req.body;
    const newStaff = new Staff({ staffId, name, phoneNumber, role, password });
    const saved = await newStaff.save();
    res.status(201).json({ message: "Staff member created successfully", staff: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating staff member", details: error.message });
  }
});

module.exports = router;
