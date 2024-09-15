const mongoose = require("mongoose");

const costSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    wing: {
      type: String,
      enum: ["MALE", "FEMALE"],
      required: true,
    },
    mealBill: {
      breakfast: {
        totalCost: {
          type: Number,
          required: true,
          default: 0,
        },
        totalStudent: {
          type: Number,
          required: true,
          default: 0,
        },
      },
      lunch: {
        totalCost: {
          type: Number,
          required: true,
          default: 0,
        },
        totalStudent: {
          type: Number,
          required: true,
          default: 0,
        },
      },
      dinner: {
        totalCost: {
          type: Number,
          required: true,
          default: 0,
        },
        totalStudent: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    },
  },
  {
    toJSON: { virtuals: true }, // Include virtual fields in the JSON representation
  }
);

// Virtual for perHeadCost of breakfast
costSchema.virtual("mealBill.breakfast.perHeadCost").get(function () {
  return this.mealBill.breakfast.totalStudent !== 0
    ? this.mealBill.breakfast.totalCost / this.mealBill.breakfast.totalStudent
    : 0;
});

// Virtual for perHeadCost of lunch
costSchema.virtual("mealBill.lunch.perHeadCost").get(function () {
  return this.mealBill.lunch.totalStudent !== 0
    ? this.mealBill.lunch.totalCost / this.mealBill.lunch.totalStudent
    : 0;
});

// Virtual for perHeadCost of dinner
costSchema.virtual("mealBill.dinner.perHeadCost").get(function () {
  return this.mealBill.dinner.totalStudent !== 0
    ? this.mealBill.dinner.totalCost / this.mealBill.dinner.totalStudent
    : 0;
});

const Cost = mongoose.model("Cost", costSchema);

module.exports = Cost;
