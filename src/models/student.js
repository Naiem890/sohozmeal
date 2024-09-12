const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true, default: null },
  hallId: { type: String, required: true },
  name: { type: String, required: true },
  password: {
    type: String,
    default: function () {
      return bcrypt.hashSync(this.studentId, 10);
    },
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
  profileImage: { type: Buffer },
  roomNo: { type: String, default: null },
  residence: { type: String, default: null, enum: ["OSMANY_HALL", "EXT_D", "NOT_SELECTED", null] },
});

// Create a compound index for `hallId` and `gender` to ensure uniqueness within the same gender
studentSchema.index({ hallId: 1, gender: 1 }, { unique: true });

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
