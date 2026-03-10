const ExcelJS = require("exceljs");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { execSync } = require("child_process");

// Get wing parameter from command line
const wing = process.argv[2];
if (!wing) {
  console.error("Please provide wing parameter (e.g. node generateJson.js male)");
  process.exit(1);
}

// Helper: convert an ExcelJS worksheet to array of plain objects (like xlsx sheet_to_json)
function worksheetToJson(worksheet) {
  const headers = [];
  const data = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? String(cell.value).trim() : `col${colNumber}`;
      });
    } else {
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) obj[header] = cell.value;
      });
      if (Object.values(obj).some((v) => v !== null && v !== undefined && v !== "")) {
        data.push(obj);
      }
    }
  });

  return data;
}

// Find the keys from the student object (case-insensitive)
const findKeyValue = (object, key) =>
  object[Object.keys(object).find((k) => k.trim().toLowerCase() === key.toLowerCase())];

(async () => {
  // Delete old output files
  const deleteOldFiles = `rm -f src/data/${wing}_students.json src/data/processed_${wing}_students.xlsx`;
  execSync(deleteOldFiles);
  console.log("Successfully deleted old files");

  // Read the Excel file
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(`src/data/${wing}_main_clean.xlsx`);
  const worksheet = workbook.getWorksheet(1);
  const studentsData = worksheetToJson(worksheet);

  const students = [];
  let lastRoomNo = "";

  studentsData.forEach((studentData) => {
    // Trim all string values
    studentData = Object.fromEntries(
      Object.entries(studentData).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    try {
      if (studentData.studentId && studentData.hallId && studentData.name) {
        if (studentData.roomNo) {
          lastRoomNo = `${studentData.roomNo}`;
        }

        const dept = findKeyValue(studentData, "dept") || "";
        const studentRecord = {
          name: studentData.name.trim(),
          hallId: `${studentData.hallId}`,
          studentId: `${studentData.studentId}`,
          roomNo: lastRoomNo,
          password: bcrypt.hashSync(studentData.studentId + "", 10),
          department: dept.includes("-")
            ? dept.split("-")[0]?.trim()
            : dept.split("_")[0]?.trim() || "",
          batch: dept.includes("-")
            ? dept.split("-")[1]?.trim()
            : dept.split("_")[1]?.trim() || "",
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

  // Save JSON
  try {
    fs.writeFileSync(
      `src/data/${wing}_students.json`,
      JSON.stringify(students, null, 2)
    );
    console.log(`Successfully saved student data to ${wing}_students.json`);
  } catch (error) {
    console.error("Error saving JSON file:", error);
  }

  // Save processed Excel with exceljs
  try {
    const outWorkbook = new ExcelJS.Workbook();
    const outSheet = outWorkbook.addWorksheet("Processed Students");

    if (students.length > 0) {
      outSheet.columns = Object.keys(students[0]).map((key) => ({
        header: key,
        key,
        width: 20,
      }));
      students.forEach((student) => outSheet.addRow(student));
    }

    await outWorkbook.xlsx.writeFile(`src/data/processed_${wing}_students.xlsx`);
    console.log(`Successfully saved student data to processed_${wing}_students.xlsx`);
  } catch (error) {
    console.error("Error saving Excel file:", error);
  }
})();
