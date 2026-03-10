const ExcelJS = require("exceljs");
const bcrypt = require("bcrypt");
const Student = require("../models/student");

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
  // Read the Excel file
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("src/data/male_wing_cleaned.xlsx");
  const worksheet = workbook.getWorksheet(1);
  const studentsData = worksheetToJson(worksheet);

  const bulkOperations = [];

  studentsData.forEach((studentData) => {
    try {
      if (studentData.studentId && studentData.hallId && studentData.name) {
        const filter = { studentId: studentData.studentId };
        const update = {
          name: studentData.name.trim(),
          hallId: studentData.hallId,
          studentId: studentData.studentId,
          roomNo: studentData.roomNo,
          password: bcrypt.hashSync(studentData.studentId + "", 10),
          department: findKeyValue(studentData, "dept")?.split("-")?.[0]?.trim() || "",
          batch: findKeyValue(studentData, "dept")?.split("-")?.[1]?.trim() || "",
          status: "active",
          gender: "MALE",
          residence: studentData.roomNo[0] === "D" ? "EXT_D" : "OSMANY_HALL",
          firstTimeLogin: true,
        };

        bulkOperations.push({
          updateOne: {
            filter,
            update,
            upsert: true,
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

  Student.bulkWrite(bulkOperations)
    .then((result) => {
      console.log(`Bulk update completed. Modified ${result.modifiedCount} documents.`);
    })
    .catch((error) => {
      console.error("Error during bulk update:", error);
    });
})();
