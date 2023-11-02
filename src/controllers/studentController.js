const router = require("express").Router();
const { validateToken } = require("../utils/validateToken");
const Student = require("../models/student");
const { checkAdminRole } = require("../utils/checkAdminRole");
const multer = require("multer");
// const upload = multer({ dest: "./uploads/" });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    return cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
const sharp = require("sharp");
const fs = require("fs"); // Import the Node.js file system module
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
    gender,
    department,
    batch,
    status,
  } = req.body;
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
        student.gender = gender;
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
//get the last hall id and increment by 1
router.get("/hallId", validateToken, checkAdminRole, async (req, res) => {
  try {
    const lastHallId = await Student.aggregate([
      { $group: { _id: null, maxHallId: { $max: "$hallId" } } },
      { $project: { _id: 0, maxHallId: 1 } },
    ]);

    let availableId =
      lastHallId.length > 0 ? parseInt(lastHallId[0].maxHallId) + 1 : 1000;

    res.status(200).json({ hallId: availableId.toString() });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
//add student
router.post(
  "/add",
  validateToken,
  checkAdminRole,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const {
        studentId,
        phoneNumber,
        hallId,
        name,
        department,
        gender,
        batch,
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
      };
      if (profileImage) {
        const compressedImage = await sharp(profileImage.path)
          .resize({ width: 300 }) // Resize the image
          .jpeg({ quality: 30 }) // Set the JPEG quality to 30 (adjust as needed)
          .toBuffer();
        studentData.profileImage = compressedImage; // Add image to the student data
      }
      const newStudent = new Student(studentData);
      await newStudent.save();
      //Clean up: Delete the temporarily uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return res.status(500).send("Error deleting uploaded file.");
        }
      });
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

// router.post('/add', upload.single('profileImage'), validateToken, checkAdminRole, async (req, res) => {
//   try {
//     const { studentId, phoneNumber, hallId, name, department, gender, batch } = req.body;
//     const studentImage = req.file; // Use req.file to access the uploaded file
//     console.log("studentImage:", studentImage);
//     const studentData = {
//       studentId,
//       phoneNumber,
//       hallId,
//       name,
//       department: department.toUpperCase(),
//       gender: gender.toUpperCase(),
//       batch,
//     };

//     if (studentImage) {
//       const compressedImage = await sharp(studentImage.path)
//         .resize({ width: 300 }) // Resize the image
//         .jpeg({ quality: 30 }) // Set the JPEG quality to 30 (adjust as needed)
//         .toBuffer();
//       studentData.profileImage = compressedImage; // Add image to the student data
//     }

//     const newStudent = new Student(studentData);
//     await newStudent.save();
//     res.status(201).json({ message: 'Student added successfully', student: newStudent });
//   } catch (error) {
//     if (error.name === 'MongoServerError' && error.code === 11000) {
//       let errorMessage = "Unknown error occurred";
//       if (error.message.includes("studentId")) {
//         errorMessage = "Duplicate student ID";
//       } else if (error.message.includes("phoneNumber")) {
//         errorMessage = "Duplicate phone number";
//       } else if (error.message.includes("hallId")) {
//         errorMessage = "Duplicate hall ID";
//       }
//       res.status(400).json({ message: errorMessage });
//     } else {
//       res.status(500).json({ message: 'Error adding the student', error: error.message });
//     }
//   }
// });

// router.post("/upload/:id", upload.single("image"), async (req, res) => {
//   try {
//     console.log(req.file, "shohaan lsdfjsla aldfjsa");
//     if (!req.file) {
//       return res.status(400).send("No file uploaded.");
//     }
//     const studentId = req.params.id;
//     const compressedImage = await sharp(req.file.path)
//       .resize({ width: 300 }) // Resize the image
//       .jpeg({ quality: 30 }) // Set the JPEG quality to 30 (adjust as needed)
//       .toBuffer();

//     const student = await Student.findOne({ studentId });
//     if (!student) {
//       return res.status(404).send("Student not found.");
//     }
//     student.profileImage = compressedImage;
//     await student.save();
//     // Clean up: Delete the temporarily uploaded file
//     // fs.unlink(req.file.path, (err) => {
//     //   if (err) {
//     //     console.error('Error deleting file:', err);
//     //     return res.status(500).send('Error deleting uploaded file.');
//     //   }
//     //   res.status(200).send('Image uploaded and linked to the student successfully.');
//     // });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error uploading image.");
//   }
// });

module.exports = router;
