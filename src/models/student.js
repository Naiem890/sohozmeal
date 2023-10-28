const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true, default: null },
  hallId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: {
    type: String,
    default: function () {
      return bcrypt.hashSync(this.studentId, 10);
    }
  },
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
  batch: { type: Number },
  status: { default: "active", type: String, enum: ["active", "inactive"] },
  firstTimeLogin: { type: Boolean, required: true, default: true },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
