const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
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

billSchema.virtual("mealBill.breakfast.perHeadCost").get(function () {
  return this.mealBill.breakfast.totalStudent !== 0
    ? this.mealBill.breakfast.totalCost / this.mealBill.breakfast.totalStudent
    : 0;
});

billSchema.virtual("mealBill.lunch.perHeadCost").get(function () {
  return this.mealBill.lunch.totalStudent !== 0
    ? this.mealBill.lunch.totalCost / this.mealBill.lunch.totalStudent
    : 0;
});

billSchema.virtual("mealBill.dinner.perHeadCost").get(function () {
  return this.mealBill.dinner.totalStudent !== 0
    ? this.mealBill.dinner.totalCost / this.mealBill.dinner.totalStudent
    : 0;
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
