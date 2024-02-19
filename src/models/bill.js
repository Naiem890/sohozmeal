const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  mealCosts: {
    breakfast: {
      type: Number,
      required: true,
      default: 0,
    },
    lunch: {
      type: Number,
      required: true,
      default: 0,
    },
    dinner: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  mealCounts: {
    breakfast: {
      type: Number,
      required: true,
      default: 0,
    },
    lunch: {
      type: Number,
      required: true,
      default: 0,
    },
    dinner: {
      type: Number,
      required: true,
      default: 0,
    },
  },
});

// Define virtual property to calculate perHeadCost for each meal type
billSchema.virtual("perHeadCosts").get(function () {
  const perHeadCosts = {
    breakfast:
      this.mealCounts.breakfast !== 0
        ? this.mealCosts.breakfast / this.mealCounts.breakfast
        : 0,
    lunch:
      this.mealCounts.lunch !== 0
        ? this.mealCosts.lunch / this.mealCounts.lunch
        : 0,
    dinner:
      this.mealCounts.dinner !== 0
        ? this.mealCosts.dinner / this.mealCounts.dinner
        : 0,
  };
  return perHeadCosts;
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
