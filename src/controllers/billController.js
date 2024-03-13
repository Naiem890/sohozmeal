const router = require("express").Router();
const Bill = require("../models/bill");
const Meal = require("../models/meal");
const { StockTransaction } = require("../models/stock");
const { validateToken } = require("../utils/validateToken");

// Fetch all bills for a specific date
router.post("/", validateToken, async (req, res) => {
  const queryDate = req.query.date;
  try {
    // Convert the query strings into Date objects
    const dateObj = new Date(queryDate);
    const date = dateObj.toISOString().split("T")[0];
    // Check if the dates are valid
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Aggregate meal counts for the specified date
    const mealCounts = await Meal.aggregate([
      {
        $match: {
          date: date,
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

    res.status(200).json({
      message: `Bill generated successfully`,
      date: dateObj,
      mealBill: bill.mealBill,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while retrieving meal rates" });
  }
});

// Fetch {bills for a specific student(as an admin)} || {monthly bill} || {by student's bearer token get his meal and bill details}
router.get("/student", validateToken, async (req, res) => {
  let studentId = req.user.studentId; // Default to the logged-in user's studentId
  const { month, year, studentId: queryStudentId } = req.query; // Destructure query parameters
  // If the user is an admin and a studentId is provided in the query, use it
  if (req.user.role === "admin" && queryStudentId) {
    studentId = queryStudentId;
  }

  try {
    // Validate month and year
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    // Calculate start and end dates of the month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month)); // Last day of the month
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    // Aggregate pipeline to fetch bills
    const billsPipeline = [
      {
        $match: {
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $addFields: {
          "mealBill.breakfast.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.breakfast.totalStudent", 0] },
              {
                $divide: [
                  "$mealBill.breakfast.totalCost",
                  "$mealBill.breakfast.totalStudent",
                ],
              },
              0,
            ],
          },
          "mealBill.lunch.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.lunch.totalStudent", 0] },
              {
                $divide: [
                  "$mealBill.lunch.totalCost",
                  "$mealBill.lunch.totalStudent",
                ],
              },
              0,
            ],
          },
          "mealBill.dinner.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.dinner.totalStudent", 0] },
              {
                $divide: [
                  "$mealBill.dinner.totalCost",
                  "$mealBill.dinner.totalStudent",
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          mealBill: 1,
        },
      },
      {
        $sort: { date: 1 }, // Sort by date in ascending order
      },
    ];

    // Fetch bills
    const bills = await Bill.aggregate(billsPipeline).exec();
    // Fetch meals
    let combinedMealBill = [];
    if (studentId) {
      const mealsPipeline = [
        {
          $match: {
            date: { $gte: start, $lt: end },
            studentId: studentId,
          },
        },
        {
          $project: {
            date: 1,
            meal: 1,
          },
        },
        {
          $sort: { date: 1 }, // Sort by date in ascending order
        },
      ];

      const meals = await Meal.aggregate(mealsPipeline).exec();
      // Index meals by date for faster lookup
      const mealMap = {};
      for (const meal of meals) {
        mealMap[meal.date] = meal;
      }

      // Combine bills and meals data
      combinedMealBill = bills
        .filter((bill) => {
          const meal = mealMap[bill.date];
          return meal;
        })
        .map((bill) => {
          return {
            date: bill.date,
            mealBill: {
              breakfast: {
                ...bill.mealBill.breakfast,
                perHeadCost: bill.mealBill.breakfast.perHeadCost,
                status: mealMap[bill.date].meal.breakfast,
              },
              lunch: {
                ...bill.mealBill.lunch,
                perHeadCost: bill.mealBill.lunch.perHeadCost,
                status: mealMap[bill.date].meal.lunch,
              },
              dinner: {
                ...bill.mealBill.dinner,
                perHeadCost: bill.mealBill.dinner.perHeadCost,
                status: mealMap[bill.date].meal.dinner,
              },
            },
          };
        });
    } else {
      // If no studentId is provided, simply return bills without combining with meals
      combinedMealBill = bills;
    }
    res.status(200).json({
      message: `Bills and meals fetched successfully`,
      mealBillData: combinedMealBill,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bills and meals" });
  }
});

module.exports = router;
