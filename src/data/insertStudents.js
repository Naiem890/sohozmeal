const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const Student = require("../models/student");

// Read the Excel file
const workbook = xlsx.readFile("src/data/MessBill.xlsx"); // Replace with your file path

// Assuming the first sheet is the one with student data
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert worksheet data to an array of objects
const studentsData = xlsx.utils.sheet_to_json(worksheet);

// Find the keys from the student object
const findKeyValue = (object, key) =>
  object[
    Object.keys(object).find(
      (k) => k.trim().toLowerCase() === key.toLowerCase()
    )
  ];

// Create an array to store the bulk update operations
const bulkOperations = [];

studentsData.forEach((studentData) => {
  try {
    if (
      studentData.studentId !== undefined &&
      studentData.hallId !== undefined &&
      studentData.name !== undefined
    ) {
      const filter = { studentId: studentData.studentId };
      const update = {
        name: studentData.name,
        hallId: studentData.hallId,
        studentId: studentData.studentId,
        password: bcrypt.hashSync(studentData.studentId + "", 10),
        department: findKeyValue(studentData, "dept").split("-")[0],
        batch: findKeyValue(studentData, "dept").split("-")[1],
        status: "active",
        gender: "MALE",
        firstTimeLogin: true,
      };

      // Create the bulk update operation
      bulkOperations.push({
        updateOne: {
          filter,
          update,
          upsert: true, // If the document doesn't exist, insert it
        },
      });
    } else {
      console.log("Student data is incomplete =>", studentData);
    }
  } catch (error) {
    console.error(`Error processing student ${studentData.name}:`, error);
  }
});

console.log("bulk operation started");

// Execute the bulk write operation
Student.bulkWrite(bulkOperations)
  .then((result) => {
    console.log(
      `Bulk update completed. Modified ${result.modifiedCount} documents.`
    );
  })
  .catch((error) => {
    console.error("Error during bulk update:", error);
  });
