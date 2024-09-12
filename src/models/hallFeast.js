const mongoose = require("mongoose");

const hallFeastSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  meal: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true,
  },
  wing: {
    type: String,
    enum: ["MALE", "FEMALE"],
    required: true,
  },
});

// Custom validation to ensure only one feast per day per wing
hallFeastSchema.pre("save", async function (next) {
  const feast = this;

  try {
    // Check if there is any feast already on the same date and wing
    const existingFeast = await mongoose.model("HallFeast").findOne({
      date: feast.date,
      wing: feast.wing,
    });

    if (existingFeast) {
      const error = new Error(
        `A feast already exists for the ${feast.wing} wing on ${feast.date.toDateString()}. Only one meal feast can happen per day.`
      );
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
});

const HallFeast = mongoose.model("HallFeast", hallFeastSchema);

module.exports = HallFeast;
