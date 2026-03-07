const mongoose = require("mongoose");

const mealConfigSchema = new mongoose.Schema({
  wing: {
    type: String,
    enum: ["MALE", "FEMALE"],
    required: true,
    unique: true,
    set: (v) => v.toUpperCase(),
  },
  cutoffHour: {
    type: Number,
    min: 0,
    max: 23,
    default: 22,
  },
  cutoffMinute: {
    type: Number,
    min: 0,
    max: 59,
    default: 0,
  },
});

const MealConfig = mongoose.model("MealConfig", mealConfigSchema);
module.exports = MealConfig;
