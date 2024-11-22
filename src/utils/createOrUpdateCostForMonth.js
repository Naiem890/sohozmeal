const Cost = require("../models/cost");
const { StockTransaction } = require("../models/stock");
const HallFeast = require("../models/hallFeast");
const Student = require("../models/student");
const Meal = require("../models/meal");

// Helper function to generate all days in a month
function generateDateRange(year, month) {
  const dates = [];
  const lastDay = new Date(year, month, 0).getDate(); // Last day of the month
  for (let i = 2; i <= lastDay + 1; i++) {
    const date = new Date(year, month - 1, i); // Create date
    date.setHours(0, 0, 0, 0); // Set time to midnight to prevent timezone issues
    dates.push(date);
  }
  return dates;
}

// Creating or updating a bill for a specific date and wing
async function createOrUpdateCostForMonth(year, month, wing) {
  try {
    // Generate all dates in the given month
    const datesInMonth = generateDateRange(year, month);

    // Process each day of the month in parallel using Promise.all
    const promises = datesInMonth.map(async (dateObj) => {
      const formattedDate = dateObj.toISOString().split("T")[0];

      // Get all students based on their gender (wing)
      const students = await Student.find({ gender: wing }).lean();
      const studentIds = students.map(student => student.studentId);

      // Fetch data for the hall feast, meal counts, and meal costs
      const [hallFeasts, totalStudents, breakfastMealCount, lunchMealCount, dinnerMealCount, mealCosts, guestMealCounts] =
      await Promise.all([
        HallFeast.find({ date: formattedDate }).lean(),
        Student.countDocuments({ gender: wing }),
        Meal.countDocuments({ "meal.breakfast": true, date: formattedDate, studentId: { $in: studentIds } }),
        Meal.countDocuments({ "meal.lunch": true, date: formattedDate, studentId: { $in: studentIds } }),
        Meal.countDocuments({ "meal.dinner": true, date: formattedDate, studentId: { $in: studentIds } }),
        StockTransaction.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(formattedDate),
                $lt: new Date(new Date(formattedDate).setDate(new Date(formattedDate).getDate() + 1)),
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
        ]),
        Meal.aggregate([
          {
            $match: {
              date: formattedDate,
              studentId: { $in: studentIds },
            },
          },
          {
            $group: {
              _id: null,
              breakfast: { $sum: "$guestMeal.breakfast" },
              lunch: { $sum: "$guestMeal.lunch" },
              dinner: { $sum: "$guestMeal.dinner" },
            },
          },
        ]),
      ]);
    
    // Extract guestMealCounts if present, otherwise default to 0
    const guestBreakfast = guestMealCounts[0]?.breakfast || 0;
    const guestLunch = guestMealCounts[0]?.lunch || 0;
    const guestDinner = guestMealCounts[0]?.dinner || 0;
    
    // Add guest meal counts to respective meal counts
    const totalBreakfastCount = breakfastMealCount + guestBreakfast;
    const totalLunchCount = lunchMealCount + guestLunch;
    const totalDinnerCount = dinnerMealCount + guestDinner;

      // Determine if hall feasts exist for each meal
      const breakfastFeastExists = hallFeasts.some((feast) => feast.meal === "breakfast");
      const lunchFeastExists = hallFeasts.some((feast) => feast.meal === "lunch");
      const dinnerFeastExists = hallFeasts.some((feast) => feast.meal === "dinner");

      // Calculate student counts based on hall feasts or meal preferences
      const breakfastCount = breakfastFeastExists ? totalStudents : totalBreakfastCount;
      const lunchCount = lunchFeastExists ? totalStudents : totalLunchCount;
      const dinnerCount = dinnerFeastExists ? totalStudents : totalDinnerCount;

      // Extract meal costs
      const breakfastCost = mealCosts[0]?.breakfastCost || 0;
      const lunchCost = mealCosts[0]?.lunchCost || 0;
      const dinnerCost = mealCosts[0]?.dinnerCost || 0;

      // Update the existing bill or create a new one if it doesn't exist
      await Cost.findOneAndUpdate(
        { date: formattedDate, wing }, // Find by date and wing
        {
          $set: {
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
          },
        },
        { upsert: true } // If the document doesn't exist, create a new one
      );
    });

    // Await all the promises for the month
    await Promise.all(promises);

    return { message: "All bills for the month processed successfully" };
  } catch (error) {
    console.error("Error processing bills for the month:", error);
    throw new Error("Error processing bills for the month.");
  }
}


module.exports = { createOrUpdateCostForMonth };
