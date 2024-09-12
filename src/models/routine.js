const { default: mongoose } = require("mongoose");

const routineSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
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
  wing: {
    type: String,
    required: true,
    enum: ["MALE", "FEMALE"],
    set: (wing) => wing.toUpperCase(),
  },
  breakfast: { type: String, default: "" },
  lunch: { type: String, default: "" },   
  dinner: { type: String, default: "" },
});
routineSchema.index({ day: 1, wing: 1 }, { unique: true });
const Routine = mongoose.model("Routine", routineSchema);

module.exports = Routine;
