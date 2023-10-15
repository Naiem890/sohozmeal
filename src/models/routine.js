const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ],
    set: (day) => day.toUpperCase(),
  },
  breakfast: { type: String, required: true },
  lunch: { type: String, required: true },
  dinner: { type: String, required: true },
});

const Routine = mongoose.model("Routine", routineSchema);

module.exports = Routine;
