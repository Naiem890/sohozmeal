// services/billService.js

const Bill = require("../models/bill");
const Meal = require("../models/meal");
const { StockTransaction } = require("../models/stock");

// Creating or updating a bill for a specific date
async function createOrUpdateBill(date) {
  try {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split("T")[0];

    // Aggregate meal counts for the specified date
    const mealCounts = await Meal.aggregate([
      {
        $match: {
          date: formattedDate,
        },
      },
      {
        $group: {
          _id: "$date",
          breakfastCount: {
            $sum: { $cond: [{ $eq: ["$meal.breakfast", true] }, 1, 0] },
          },
          lunchCount: {
            $sum: { $cond: [{ $eq: ["$meal.lunch", true] }, 1, 0] },
          },
          dinnerCount: {
            $sum: { $cond: [{ $eq: ["$meal.dinner", true] }, 1, 0] },
          },
        },
      },
    ]);

    console.log(mealCounts, "xx");

    // Aggregate meal costs for the specified date
    const mealCosts = await StockTransaction.aggregate([
      {
        $match: {
          date: dateObj,
        },
      },
      {
        $group: {
          _id: "$date",
          breakfastCost: {
            $sum: {
              $cond: [{ $eq: ["$meal", "BREAKFAST"] }, "$transactionAmount", 0],
            },
          },
          lunchCost: {
            $sum: {
              $cond: [{ $eq: ["$meal", "LUNCH"] }, "$transactionAmount", 0],
            },
          },
          dinnerCost: {
            $sum: {
              $cond: [{ $eq: ["$meal", "DINNER"] }, "$transactionAmount", 0],
            },
          },
        },
      },
    ]);

    // Fetch or create a bill
    let bill = await Bill.findOne({ date: dateObj });

    // If no bill exists for the given date, create a new one
    if (!bill) {
      bill = new Bill({
        date: dateObj,
        mealBill: {
          breakfast: {
            totalCost: mealCosts[0]?.breakfastCost || 0,
            totalStudent: mealCounts[0]?.breakfastCount || 0,
          },
          lunch: {
            totalCost: mealCosts[0]?.lunchCost || 0,
            totalStudent: mealCounts[0]?.lunchCount || 0,
          },
          dinner: {
            totalCost: mealCosts[0]?.dinnerCost || 0,
            totalStudent: mealCounts[0]?.dinnerCount || 0,
          },
        },
      });
    } else {
      // Update the existing bill
      bill.mealBill = {
        breakfast: {
          totalCost: mealCosts[0]?.breakfastCost || 0,
          totalStudent: mealCounts[0]?.breakfastCount || 0,
        },
        lunch: {
          totalCost: mealCosts[0]?.lunchCost || 0,
          totalStudent: mealCounts[0]?.lunchCount || 0,
        },
        dinner: {
          totalCost: mealCosts[0]?.dinnerCost || 0,
          totalStudent: mealCounts[0]?.dinnerCount || 0,
        },
      };
    }

    // Save the bill to the database
    await bill.save();

    return bill;
  } catch (error) {
    console.error("Error during bill creation or update:", error);
    throw new Error("Error creating or updating the bill.");
  }
}

module.exports = { createOrUpdateBill };
