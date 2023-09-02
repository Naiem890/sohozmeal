const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true },
  hallId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
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
  batch: { type: Number },
  status: { default: "active", type: String, enum: ["active", "inactive"] },
  firstTimeLogin: { type: Boolean, required: true, default: true },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
