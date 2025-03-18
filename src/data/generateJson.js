const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { execSync } = require("child_process");

// Get wing parameter from command line
const wing = process.argv[2];
if (!wing) {
  console.error("Please provide wing parameter (e.g. node insertStudents.js male)");
  process.exit(1);
}

// Read the Excel file
const workbook = xlsx.readFile(`src/data/${wing}_main_clean.xlsx`);

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

// Create an array to store all student records
const students = [];

let lastRoomNo = "";

// write command to delete old files
const deleteOldFiles = `rm -f src/data/${wing}_students.json src/data/processed_${wing}_students.xlsx`;
execSync(deleteOldFiles);
console.log("Successfully deleted old files");

studentsData.forEach((studentData) => {
  // trim all the data if it is a string
  studentData = Object.fromEntries(
    Object.entries(studentData).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  );

  try {
    if (
      studentData.studentId &&
      studentData.hallId &&
      studentData.name
    ) {
      if (studentData.roomNo) {
        lastRoomNo = `${studentData.roomNo}`;
      }

      const studentRecord = {
        name: studentData.name.trim(),
        hallId: `${studentData.hallId}`,
        studentId: `${studentData.studentId}`,
        roomNo: lastRoomNo,
        password: bcrypt.hashSync(studentData.studentId + "", 10),
        department: findKeyValue(studentData, "dept").includes("-") ? findKeyValue(studentData, "dept")?.split("-")?.[0]?.trim() : findKeyValue(studentData, "dept")?.split("_")?.[0]?.trim() || "",
        batch: findKeyValue(studentData, "dept").includes("-") ? findKeyValue(studentData, "dept")?.split("-")?.[1]?.trim() : findKeyValue(studentData, "dept")?.split("_")?.[1]?.trim() || "",
        status: "active",
        gender: wing.toUpperCase(),
        residence: lastRoomNo.includes("D") ? "EXT_D" : "OSMANY_HALL",
        firstTimeLogin: true,
      };

      students.push(studentRecord);
    } else {
      console.log("Student data is incomplete =>", studentData);
    }
  } catch (error) {
    console.error(`Error processing student ${studentData.name}:`, error);
  }
});

// Save all student records to JSON file
try {
  fs.writeFileSync(
    `src/data/${wing}_students.json`,
    JSON.stringify(students, null, 2)
  );
  console.log(`Successfully saved student data to ${wing}_students.json`);

  // Create a new workbook and worksheet for the processed data
  const newWorkbook = xlsx.utils.book_new();
  const newWorksheet = xlsx.utils.json_to_sheet(students);
  
  // Add the worksheet to the workbook
  xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Processed Students");
  
  // Write the workbook to a file
  xlsx.writeFile(newWorkbook, `src/data/processed_${wing}_students.xlsx`);
  console.log(`Successfully saved student data to processed_${wing}_students.xlsx`);
} catch (error) {
  console.error("Error saving files:", error);
}
