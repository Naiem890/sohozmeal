const Bill = require("../models/bill");
const { StockTransaction } = require("../models/stock");
const HallFeast = require("../models/hallFeast");
const Student = require("../models/student");
const Meal = require("../models/meal");

// Creating or updating a bill for a specific date
async function createOrUpdateBill(date) {
  try {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split("T")[0];

    // Step 1: Check if a hall feast exists for each meal on the specified date
    const hallFeasts = await HallFeast.find({ date: formattedDate });

    const breakfastFeastExists = hallFeasts.some(feast => feast.meal === "breakfast");
    const lunchFeastExists = hallFeasts.some(feast => feast.meal === "lunch");
    const dinnerFeastExists = hallFeasts.some(feast => feast.meal === "dinner");

    // Step 2: Determine student counts based on hall feast or meal preference
    let breakfastCount, lunchCount, dinnerCount;
    let totalStudents = await Student.countDocuments();
    // Breakfast Count
    if (breakfastFeastExists) {
      breakfastCount = totalStudents;
    } else {
      const breakfastMealCount = await Meal.countDocuments({ "meal.breakfast": true, date: formattedDate });
      breakfastCount = breakfastMealCount; // Count students who turned breakfast on
    }

    // Lunch Count
    if (lunchFeastExists) {
      lunchCount = totalStudents
    } else {
      const lunchMealCount = await Meal.countDocuments({ "meal.lunch": true, date: formattedDate });
      lunchCount = lunchMealCount; // Count students who turned lunch on
    }

    // Dinner Count
    if (dinnerFeastExists) {
      dinnerCount = totalStudents
    } else {
      const dinnerMealCount = await Meal.countDocuments({ "meal.dinner": true, date: formattedDate });
      dinnerCount = dinnerMealCount; // Count students who turned dinner on
    }

    // Step 3: Aggregate meal costs for the specified date
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

    // Step 4: Fetch or create a bill
    let bill = await Bill.findOne({ date: dateObj });

    // If no bill exists for the given date, create a new one
    if (!bill) {
      bill = new Bill({
        date: dateObj,
        mealBill: {
          breakfast: {
            totalCost: mealCosts[0]?.breakfastCost || 0,
            totalStudent: breakfastCount,
          },
          lunch: {
            totalCost: mealCosts[0]?.lunchCost || 0,
            totalStudent: lunchCount,
          },
          dinner: {
            totalCost: mealCosts[0]?.dinnerCost || 0,
            totalStudent: dinnerCount,
          },
        },
      });
    } else {
      // Update the existing bill
      bill.mealBill = {
        breakfast: {
          totalCost: mealCosts[0]?.breakfastCost || 0,
          totalStudent: breakfastCount,
        },
        lunch: {
          totalCost: mealCosts[0]?.lunchCost || 0,
          totalStudent: lunchCount,
        },
        dinner: {
          totalCost: mealCosts[0]?.dinnerCost || 0,
          totalStudent: dinnerCount,
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
