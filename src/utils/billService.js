const Cost = require("../models/cost");
const { StockTransaction } = require("../models/stock");
const HallFeast = require("../models/hallFeast");
const Student = require("../models/student");
const Meal = require("../models/meal");

// Creating or updating a bill for a specific date and wing
async function createOrUpdateBill(date, wing) {
  try {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split("T")[0];

    // Step 1: Check if a hall feast exists for each meal on the specified date
    const hallFeasts = await HallFeast.find({ date: formattedDate });

    const breakfastFeastExists = hallFeasts.some(feast => feast.meal === "breakfast");
    const lunchFeastExists = hallFeasts.some(feast => feast.meal === "lunch");
    const dinnerFeastExists = hallFeasts.some(feast => feast.meal === "dinner");

    // Step 2: Determine student counts based on hall feast or meal preference, filtered by wing
    let breakfastCount, lunchCount, dinnerCount;
    let totalStudents = await Student.countDocuments({ wing }); // Count students by wing
    
    // Breakfast Count
    if (breakfastFeastExists) {
      breakfastCount = totalStudents;
    } else {
      const breakfastMealCount = await Meal.countDocuments({ "meal.breakfast": true, date: formattedDate, wing });
      breakfastCount = breakfastMealCount; // Count students who turned breakfast on for the specific wing
    }

    // Lunch Count
    if (lunchFeastExists) {
      lunchCount = totalStudents;
    } else {
      const lunchMealCount = await Meal.countDocuments({ "meal.lunch": true, date: formattedDate, wing });
      lunchCount = lunchMealCount; // Count students who turned lunch on for the specific wing
    }

    // Dinner Count
    if (dinnerFeastExists) {
      dinnerCount = totalStudents;
    } else {
      const dinnerMealCount = await Meal.countDocuments({ "meal.dinner": true, date: formattedDate, wing });
      dinnerCount = dinnerMealCount; // Count students who turned dinner on for the specific wing
    }

    // Step 3: Aggregate meal costs for the specified date and wing
    const mealCosts = await StockTransaction.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(formattedDate),
            $lt: new Date(new Date(formattedDate).setDate(new Date(formattedDate).getDate() + 1))
          },
          wing, // Filter by wing in transactions
        },
      },
      {
        $group: {
          _id: null, // Group by the whole date range
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

    // Check if mealCosts exist
    const breakfastCost = mealCosts[0]?.breakfastCost || 0;
    const lunchCost = mealCosts[0]?.lunchCost || 0;
    const dinnerCost = mealCosts[0]?.dinnerCost || 0;

    // Step 4: Fetch or create a bill for the specific date and wing
    let bill = await Cost.findOne({ date: formattedDate, wing });

    // If no bill exists for the given date and wing, create a new one
    if (!bill) {
      bill = new Cost({
        date: dateObj,
        wing, // Include the wing in the bill
        mealBill: {
          breakfast: {
            totalCost: breakfastCost,
            totalStudent: breakfastCount,
          },
          lunch: {
            totalCost: lunchCost,
            totalStudent: lunchCount,
          },
          dinner: {
            totalCost: dinnerCost,
            totalStudent: dinnerCount,
          },
        },
      });
    } else {
      // Update the existing bill for the specific wing
      bill.mealBill = {
        breakfast: {
          totalCost: breakfastCost,
          totalStudent: breakfastCount,
        },
        lunch: {
          totalCost: lunchCost,
          totalStudent: lunchCount,
        },
        dinner: {
          totalCost: dinnerCost,
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
