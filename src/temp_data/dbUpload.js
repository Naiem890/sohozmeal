const mongoose = require('mongoose');
const Student = require("../models/student");
const dbConnect = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

// Get wing parameter from command line
const wing = process.argv[2];
if (!wing) {
  console.error("Please provide wing parameter (e.g. node dbUpload.js male)");
  process.exit(1);
}

// Import the correct JSON file based on wing parameter
const students = require(`./${wing}_students.json`);

// Create an array to store the bulk update operations
const bulkOperations = students.map(student => ({
  updateOne: {
    filter: { studentId: student.studentId },
    update: student,
    upsert: true // If the document doesn't exist, insert it
  }
}));

console.log(`Bulk operation started for ${wing} wing`);

try {
  dbConnect().then(() => {
    console.log(`Bulk operation started for ${wing} wing`);
    Student.bulkWrite(bulkOperations)
      .then((result) => {
        console.log(`Bulk update completed for ${wing} wing. Modified ${result.modifiedCount} documents.`);
        mongoose.disconnect();
      })
      .catch((error) => {
        console.error(`Error during bulk update for ${wing} wing:`, error);
        mongoose.disconnect();
      });
  });
} catch (error) {
  console.error("Database connection error: ", error);
}
