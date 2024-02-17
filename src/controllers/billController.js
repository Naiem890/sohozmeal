const router = require("express").Router();
const Bill = require("../models/bill");
const Meal = require("../models/meal");
const { StockTransaction } = require("../models/stock");
const { validateToken } = require("../utils/validateToken");

router.get("/", validateToken, async (req, res) => {
  const { date } = req.query;
  try {
    // Convert the query strings into Date objects
    const dateObj = new Date(date);

    // Check if the dates are valid
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Aggregate meals within the specified date range
    const mealCost = await StockTransaction.aggregate([
      {
        $match: {
          date: { $eq: dateObj },
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
      {
        $project: {
          _id: 0,
          breakfastCost: 1,
          lunchCost: 1,
          dinnerCost: 1,
        },
      },
      {
        $sort: { date: 1 }, // Sort by date in ascending order
      },
    ]);
    const mealCounts = await Meal.aggregate([
      {
        $match: {
          date: { $eq: date },
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
      {
        $project: {
          _id: 0,
          breakfastCount: 1,
          lunchCount: 1,
          dinnerCount: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    // Fetch or create a bill
    let bill = await Bill.findOne({ date: dateObj });

    // If no bill exists for the given date, create a new one
    if (!bill) {
      bill = new Bill({
        date: dateObj,
        mealCosts: {
          breakfast: mealCost[0]?.breakfastCost || 0,
          lunch: mealCost[0]?.lunchCost || 0,
          dinner: mealCost[0]?.dinnerCost || 0,
        },
        mealCounts: {
          breakfast: mealCounts[0]?.breakfastCount || 0,
          lunch: mealCounts[0]?.lunchCount || 0,
          dinner: mealCounts[0]?.dinnerCount || 0,
        },
      });
    } else {
      // Update the existing bill
      bill.mealCosts = {
        breakfast: mealCost[0]?.breakfastCost || 0,
        lunch: mealCost[0]?.lunchCost || 0,
        dinner: mealCost[0]?.dinnerCost || 0,
      };
      bill.mealCounts = {
        breakfast: mealCounts[0]?.breakfastCount || 0,
        lunch: mealCounts[0]?.lunchCount || 0,
        dinner: mealCounts[0]?.dinnerCount || 0,
      };
    }

    // Save the bill to the database
    await bill.save();

    res.status(200).json({
      message: `Bill generated successfully`,
      date: dateObj,
      mealCost: mealCost[0] || {},
      mealCounts: mealCounts[0] || {},
      perHeadCosts: bill.perHeadCosts, // Include the virtual column in the response
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while retrieving meal rates" });
  }
});

//Not Yet Implemented,60% completed.
router.get("/student", validateToken, async (req, res) => {
  const { month, year, studentId } = req.query;
  try {
    // Validate month and year
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    // Calculate start and end dates of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    // Calculate start and end dates of the month
    const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const end = new Date(year, month, 0).toISOString().split("T")[0];

    // Aggregate pipeline to fetch bills
    const bills = await Bill.aggregate([
      {
        $match: {
          date: { $gt: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          mealCosts: 1,
          mealCounts: 1,
          perHeadCosts: 1,
          __v: 1,
        },
      },
    ]);

    // Aggregate pipeline to fetch meals
    const meals = await Meal.aggregate([
      {
        $match: {
          date: { $gt: start, $lte: end },
          studentId: studentId,
        },
      },
      {
        $project: {
          date: 1,
          _id: 0,
          studentId: 1,
          meal: 1,
        },
      },
    ]);
    console.log("meals", meals, "bills", bills, "shohan");

    res.status(200).json({
      message: "Bills and meals fetched successfully"
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bills and meals" });
  }
});

module.exports = router;
