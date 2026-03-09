const router = require("express").Router();
const { validateToken } = require("../utils/validateToken");
const Student = require("../models/student");
const { checkAdminRole } = require("../utils/checkAdminRole");
const fs = require("fs");
const multer = require("multer");
// Check if the uploads directory exists, if not, create it
const uploadDirectory = "./uploads/";
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Define multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Create the multer instance with the defined storage configuration
const upload = multer({ storage: storage });
const sharp = require("sharp");
const createMealForNextDay = require("../utils/mealInitializer");
const Meal = require("../models/meal");
const Alumni = require("../models/alumni");
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

      // Find the student in the Student collection
      const student = await Student.findOne({ studentId });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Create a new entry in the Alumni collection
      const alumniData = {
        studentId: student.studentId,
        phoneNumber: student.phoneNumber,
        hallId: student.hallId,
        name: student.name,
        department: student.department,
        gender: student.gender,
        batch: student.batch,
        graduationYear: new Date().getFullYear(),
        profileImage: student.profileImage,
        roomNo: student.roomNo,
        residence: student.residence,
      };

      
      // Delete the student from the Student collection
      await Student.findOneAndDelete({ studentId });
      
      // Delete any associated meal data from the Meal collection
      await Meal.deleteMany({ studentId });
      
      const alumniWithStudentId = Alumni.find({ studentId: student.studentId });
      if (!alumniWithStudentId) {
        await Alumni.create([alumniData]);
      }
      
      res
        .status(200)
        .json({ message: "Student moved to alumni and deleted successfully" });
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
    const {
      page = 1,
      limit = 20,
      search,
      department,
      gender,
      sortBy,
      sortOrder,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Build filter
    const query = {};
    if (search) {
      query.$or = [
        { studentId:  { $regex: search, $options: "i" } },
        { hallId:     { $regex: search, $options: "i" } },
        { name:       { $regex: search, $options: "i" } },
      ];
    }
    if (department && department !== "all") query.department = department;
    if (gender     && gender     !== "all") query.gender     = gender;

    // Build sort
    const sort = {};
    if (sortBy) sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    else        sort.hallId  = 1;

    const [students, total] = await Promise.all([
      Student.find(query, { password: 0 })
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Student.countDocuments(query),
    ]);

    res.json({
      students,
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "An error occurred while fetching students" });
  }
});

// router to update student profile
router.put(
  "/",
  validateToken,
  upload.single("profileImage"),
  async (req, res) => {
    const { role } = req.user;
    const {
      name,
      hallId,
      newStudentId,
      studentId: bodyStudentId,
      phoneNumber,
      gender,
      department,
      batch,
      status,
      roomNo,
      residence,
      preferredBackground,
      preferredArea,
      preferredSubject,
      isTutorAvailable,
      bloodGroup,
      isDonor,
      lastDonationDate,
    } = req.body;

    const studentId = bodyStudentId || req.user.studentId;

    try {
      const student = await Student.findOne({ studentId }, { password: 0 });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (phoneNumber !== undefined) {
        student.phoneNumber = phoneNumber;
      }
      if (department !== undefined) {
        student.department = department.toUpperCase();
      }
      if (batch !== undefined) {
        student.batch = batch;
      }
      if (roomNo !== undefined) {
        student.roomNo = roomNo;
      }
      if (residence !== undefined) {
        student.residence = residence;
      }
      if (preferredBackground !== undefined && preferredBackground.length > 0) {
        student.preferredBackground = preferredBackground;
      }
      if (preferredArea !== undefined && preferredArea.length > 0) {
        student.preferredArea = preferredArea;
      }
      if (preferredSubject !== undefined && preferredSubject.length > 0) {
        student.preferredSubject = preferredSubject;
      }

      if (isTutorAvailable !== undefined) {
        student.isTutorAvailable = isTutorAvailable;
      }
      if (bloodGroup !== undefined && bloodGroup !== "") {
        student.bloodGroup = bloodGroup;
      }
      if (isDonor !== undefined) {
        student.isDonor = isDonor;
      }
      if (lastDonationDate !== undefined) {
        student.lastDonationDate = lastDonationDate;
      }

      if (req.file) {
        const compressedImage = await sharp(req.file.path)
          .resize({ width: 300 })
          .jpeg({ quality: 30 })
          .toBuffer();
        student.profileImage = compressedImage;
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return res.status(500).send("Error deleting uploaded file.");
          }
        });
      }

      if (role === "admin") {
        if (name !== undefined) {
          student.name = name;
        }
        if (hallId !== undefined) {
          student.hallId = hallId;
        }
        if (newStudentId !== undefined) {
          student.studentId = newStudentId;
        }
        if (status !== undefined) {
          student.status = status;
        }
        if (gender !== undefined) {
          student.gender = gender;
        }
      }

      await student.save();
      res
        .status(200)
        .json({ student, message: "Profile updated successfully" });
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  }
);

// Check if a specific hallId exists for a given wing
router.get("/checkHallId", validateToken, checkAdminRole, async (req, res) => {
  const { hallId, wing } = req.query;

  // Validate the request parameters
  if (!hallId || !wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({
      message: "Invalid hallId or wing. Wing must be MALE or FEMALE.",
    });
  }

  try {
    // Check if a student with the given hallId and wing exists
    const studentExists = await Student.exists({
      hallId: hallId,
      gender: wing.toUpperCase(),
    });

    if (studentExists) {
      return res.status(200).json({
        exists: true,
        message: `Hall ID ${hallId} already exists for ${wing} wing.`,
      });
    } else {
      return res.status(200).json({
        exists: false,
        message: `Hall ID ${hallId} is available for ${wing} wing.`,
      });
    }
  } catch (error) {
    console.error("Error checking hall ID:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while checking the hall ID." });
  }
});

//get the last hall id and increment by 1
router.get("/hallId", validateToken, checkAdminRole, async (req, res) => {
  const { wing } = req.query; // Get the wing from query parameters (MALE/FEMALE)

  // Validate the wing parameter
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res
      .status(400)
      .json({ message: "Invalid wing. Must be MALE or FEMALE." });
  }

  try {
    // Find the highest hallId for the given wing
    const lastHallId = await Student.aggregate([
      { $match: { gender: wing.toUpperCase() } }, // Filter by the wing
      { $group: { _id: null, maxHallId: { $max: "$hallId" } } },
      { $project: { _id: 0, maxHallId: 1 } },
    ]);

    // Generate the next available hallId for the given wing
    let availableId =
      lastHallId.length > 0 ? parseInt(lastHallId[0].maxHallId) + 1 : 1000;

    res.status(200).json({ hallId: availableId.toString() });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add student
router.post(
  "/add",
  validateToken,
  checkAdminRole,
  upload.single("profileImage"),
  async (req, res, next) => {
    try {
      const {
        studentId,
        phoneNumber,
        hallId,
        name,
        department,
        gender,
        batch,
        roomNo,
        residence,
      } = req.body;
      const profileImage = req.file;
      const studentData = {
        studentId,
        phoneNumber,
        hallId,
        name,
        department: department.toUpperCase(),
        gender: gender.toUpperCase(),
        batch,
        roomNo,
        residence,
      };
      if (profileImage) {
        const compressedImage = await sharp(profileImage.path)
          .resize({ width: 300 })
          .jpeg({ quality: 30 })
          .toBuffer();
        studentData.profileImage = compressedImage;
      }
      const newStudent = new Student(studentData);
      await newStudent.save();
      await createMealForNextDay(req, res, next);

      if (profileImage) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return res.status(500).send("Error deleting uploaded file.");
          }
        });
      }

      res
        .status(201)
        .json({ message: "Student added successfully", student: newStudent });
    } catch (error) {
      if (error.name === "MongoServerError" && error.code === 11000) {
        let errorMessage = "Unknown error occurred";
        if (error.message.includes("studentId")) {
          errorMessage = "Duplicate student ID";
        } else if (error.message.includes("phoneNumber")) {
          errorMessage = "Duplicate phone number";
        } else if (error.message.includes("hallId")) {
          errorMessage = "Duplicate hall ID";
        }
        res.status(400).json({ message: errorMessage });
      } else {
        res
          .status(500)
          .json({ message: "Error adding the student", error: error.message });
      }
    }
  }
);

// Blood Group Information of specific wing
// Query params: search, bloodGroup, availability (AVAILABLE|UNAVAILABLE), dateFrom, dateTo
router.get("/blood-bank/:gender", validateToken, async (req, res) => {
  try {
    const { gender } = req.params;
    const { search, bloodGroup, availability, dateFrom, dateTo } = req.query;

    const matchFilter = { isDonor: true };
    const andConditions = [];

    if (gender.toUpperCase() !== "ALL") {
      matchFilter.gender = gender.toUpperCase();
    }

    if (bloodGroup && bloodGroup !== "ALL") {
      matchFilter.bloodGroup = bloodGroup;
    }

    if (search && search.trim()) {
      andConditions.push({
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { phoneNumber: { $regex: search.trim(), $options: "i" } },
          { studentId: { $regex: search.trim(), $options: "i" } },
        ],
      });
    }

    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    if (availability === "AVAILABLE") {
      const cutoff = new Date(Date.now() - NINETY_DAYS_MS);
      andConditions.push({
        $or: [
          { lastDonationDate: null },
          { lastDonationDate: { $exists: false } },
          { lastDonationDate: { $lte: cutoff } },
        ],
      });
    } else if (availability === "UNAVAILABLE") {
      const cutoff = new Date(Date.now() - NINETY_DAYS_MS);
      andConditions.push({ lastDonationDate: { $gt: cutoff } });
    }

    if (dateFrom || dateTo) {
      const dateCondition = {};
      if (dateFrom) dateCondition.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateCondition.$lte = toDate;
      }
      andConditions.push({ lastDonationDate: dateCondition });
    }

    if (andConditions.length > 0) {
      matchFilter.$and = andConditions;
    }

    const donorData = await Student.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$bloodGroup",
          count: { $sum: 1 },
          donorInfo: {
            $push: {
              studentId: "$studentId",
              name: "$name",
              phoneNumber: "$phoneNumber",
              lastDonationDate: "$lastDonationDate",
              residence: "$residence",
              roomNo: "$roomNo",
              gender: "$gender",
              batch: "$batch",
              department: "$department",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dashboard = donorData.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        donors: item.donorInfo,
      };
      return acc;
    }, {});

    res.status(200).json(dashboard);
  } catch (error) {
    console.error("Error retrieving donor dashboard:", error);
    res.status(500).json({ message: "Error retrieving donor dashboard", error });
  }
});

module.exports = router;
