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

// Custom validation for uniqueness based on wing
hallFeastSchema.pre("save", async function (next) {
  const feast = this;
  try {
    const existingFeast = await mongoose.model("HallFeast").findOne({
      date: feast.date,
      wing: feast.wing,
    });
    console.log(existingFeast);
    
    if (existingFeast) {
      const error = new Error(
        `A feast already exists for ${feast.wing} on ${feast.date.toDateString()}`
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
