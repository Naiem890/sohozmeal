const mongoose = require("mongoose");

const alumniSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true, default: null },
  hallId: { type: String, required: true },
  name: { type: String, required: true },
  department: {
    type: String,
    enum: [
      "CSE",
      "EECE",
      "CE",
      "ME",
      "NAME",
      "BME",
      "PME",
      "IPE",
      "AE",
      "NSE",
      "EWCE",
      "ARCH",
    ],
    set: (department) => department.toUpperCase(),
  },
  gender: {
    type: String,
    required: true,
    enum: ["MALE", "FEMALE"],
    set: (gender) => gender.toUpperCase(),
  },
  batch: { type: Number, required: true },
  graduationYear: { type: Number, required: true }, // Specific to alumni
  email: { type: String}, // Alumni email for communication
  jobTitle: { type: String, default: null }, // Alumni's current job title
  companyName: { type: String, default: null }, // Alumni's current company
  profileImage: { type: Buffer, default: null }, // Profile image if available
  roomNo: { type: String, default: null }, // Last known room number at the hall
  residence: {
    type: String,
    default: null,
    enum: ["OSMANY_HALL", "EXT_D", "NOT_SELECTED", null],
  }, // Last known residence
  address: { type: String, default: null }, // Current address of the alumni
  linkedinProfile: { type: String, default: null }, // LinkedIn profile URL
  achievements: { type: [String], default: [] }, // List of achievements
  notes: { type: String, default: null }, // Notes or additional information about the alumni
});

// Create an index on `studentId` for faster querying
alumniSchema.index({ studentId: 1 }, { unique: true });

// Create the Alumni model
const Alumni = mongoose.model("Alumni", alumniSchema);

module.exports = Alumni;
