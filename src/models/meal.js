const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    meal: {
      breakfast: {
        type: Boolean,
        default: false,
      },
      lunch: {
        type: Boolean,
        default: false,
      },
      dinner: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index on studentId and date
mealSchema.index(
  {
    studentId: 1,
    date: 1,
  },
  { unique: true }
);

const Meal = mongoose.model("Meal", mealSchema);

module.exports = Meal;
