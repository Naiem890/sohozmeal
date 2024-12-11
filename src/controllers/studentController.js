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
    const session = await Student.startSession(); // Start a session for transactions
    session.startTransaction();

    try {
      const { studentId } = req.params;

      // Find the student in the Student collection
      const student = await Student.findOne({ studentId }).session(session);

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

      await Alumni.create([alumniData], { session });

      // Delete the student from the Student collection
      await Student.findOneAndDelete({ studentId }).session(session);

      // Delete any associated meal data from the Meal collection
      await Meal.deleteMany({ studentId }).session(session);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res
        .status(200)
        .json({ message: "Student moved to alumni and deleted successfully" });
    } catch (error) {
      // Rollback the transaction in case of an error
      await session.abortTransaction();
      session.endSession();

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
      studentId,
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
      isTutor,
      isTutorAvailable,
      bloodGroup,
      isDonor,
      lastDonationDate,
    } = req.body;

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
      if (isTutor !== undefined) {
        student.isTutor = isTutor;
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

module.exports = router;
